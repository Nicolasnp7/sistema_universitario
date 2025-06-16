import { Request, Response } from 'express';
import pool from '../config/database';
import { Inscripcion, InscripcionCreate, InscripcionUpdate, InscripcionCompleta } from '../models/Inscripcion';
import { ApiResponse } from '../types/api';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class InscripcionController {
  
  // GET /api/inscripciones - Obtener todas las inscripciones
  static async obtenerTodas(req: Request, res: Response): Promise<void> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          ea.id,
          ea.estudiante_id,
          ea.profesor_asignatura_id,
          ea.nota1,
          ea.nota2,
          ea.nota3,
          ea.nota_final,
          ea.fecha_inscripcion,
          CONCAT(e.nombre, ' ', e.apellido) as estudiante_nombre,
          e.documento as estudiante_documento,
          e.email as estudiante_email,
          a.nombre as asignatura_nombre,
          a.codigo as asignatura_codigo,
          a.creditos,
          CONCAT(p.nombre, ' ', p.apellido) as profesor_nombre,
          pa.grupo,
          pa.horario,
          pa.semestre
        FROM estudiante_asignatura ea
        JOIN estudiantes e ON ea.estudiante_id = e.id
        JOIN profesor_asignatura pa ON ea.profesor_asignatura_id = pa.id
        JOIN asignaturas a ON pa.asignatura_id = a.id
        JOIN profesores p ON pa.profesor_id = p.id
        WHERE e.activo = TRUE AND p.activo = TRUE AND a.activo = TRUE AND pa.activo = TRUE
        ORDER BY e.apellido, e.nombre, a.nombre`
      );
      
      const response: ApiResponse<InscripcionCompleta[]> = {
        success: true,
        data: rows as InscripcionCompleta[],
        count: rows.length
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener inscripciones:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al obtener inscripciones',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }

  // GET /api/inscripciones/por-asignatura/:asignaturaId/:grupo - Estudiantes por asignatura y grupo
  static async obtenerPorAsignaturaYGrupo(req: Request, res: Response): Promise<void> {
    try {
      const { asignaturaId, grupo } = req.params;
      
      if (!asignaturaId || !grupo || isNaN(Number(asignaturaId))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de asignatura y grupo son requeridos'
        };
        res.status(400).json(response);
        return;
      }
      
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          ea.id,
          ea.estudiante_id,
          CONCAT(e.nombre, ' ', e.apellido) as estudiante_nombre,
          e.documento as estudiante_documento,
          e.email as estudiante_email,
          ea.nota1,
          ea.nota2,
          ea.nota3,
          ea.nota_final,
          ea.fecha_inscripcion,
          a.nombre as asignatura_nombre,
          a.codigo as asignatura_codigo,
          CONCAT(p.nombre, ' ', p.apellido) as profesor_nombre
        FROM estudiante_asignatura ea
        JOIN estudiantes e ON ea.estudiante_id = e.id
        JOIN profesor_asignatura pa ON ea.profesor_asignatura_id = pa.id
        JOIN asignaturas a ON pa.asignatura_id = a.id
        JOIN profesores p ON pa.profesor_id = p.id
        WHERE pa.asignatura_id = ? AND pa.grupo = ? 
          AND e.activo = TRUE AND p.activo = TRUE AND a.activo = TRUE AND pa.activo = TRUE
        ORDER BY e.apellido, e.nombre`,
        [asignaturaId, grupo]
      );
      
      const response: ApiResponse = {
        success: true,
        data: rows,
        count: rows.length
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener estudiantes por asignatura y grupo:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al obtener estudiantes por asignatura y grupo',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }

  // GET /api/inscripciones/opciones-inscripcion - Opciones para crear inscripciones
  static async obtenerOpcionesInscripcion(req: Request, res: Response): Promise<void> {
    try {
      // Obtener estudiantes activos
      const [estudiantes] = await pool.execute<RowDataPacket[]>(
        'SELECT id, CONCAT(nombre, " ", apellido) as nombre_completo, documento FROM estudiantes WHERE activo = TRUE ORDER BY apellido, nombre'
      );
      
      // Obtener asignaturas con profesores
      const [asignaturasConProfesores] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          pa.id as profesor_asignatura_id,
          a.id as asignatura_id,
          a.nombre as asignatura_nombre,
          a.codigo as asignatura_codigo,
          CONCAT(p.nombre, ' ', p.apellido) as profesor_nombre,
          pa.grupo,
          pa.horario,
          pa.semestre
        FROM profesor_asignatura pa
        JOIN asignaturas a ON pa.asignatura_id = a.id
        JOIN profesores p ON pa.profesor_id = p.id
        WHERE pa.activo = TRUE AND a.activo = TRUE AND p.activo = TRUE
        ORDER BY a.nombre, pa.grupo`
      );
      
      const response: ApiResponse = {
        success: true,
        data: {
          estudiantes,
          asignaturas: asignaturasConProfesores
        }
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener opciones de inscripción:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al obtener opciones de inscripción',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }

  // POST /api/inscripciones - Crear nueva inscripción
  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const { estudiante_id, profesor_asignatura_id }: InscripcionCreate = req.body;
      
      // Validaciones de campos obligatorios
      if (!estudiante_id || !profesor_asignatura_id) {
        const response: ApiResponse = {
          success: false,
          message: 'Los campos estudiante_id y profesor_asignatura_id son obligatorios'
        };
        res.status(400).json(response);
        return;
      }

      // Verificar que el estudiante existe y está activo
      const [estudiante] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM estudiantes WHERE id = ? AND activo = TRUE',
        [estudiante_id]
      );

      if (estudiante.length === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'El estudiante no existe o no está activo'
        };
        res.status(400).json(response);
        return;
      }

      // Verificar que la asignación profesor-asignatura existe
      const [profesorAsignatura] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM profesor_asignatura WHERE id = ? AND activo = TRUE',
        [profesor_asignatura_id]
      );

      if (profesorAsignatura.length === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'La asignación profesor-asignatura no existe o no está activa'
        };
        res.status(400).json(response);
        return;
      }

      // Verificar que no existe una inscripción duplicada
      const [inscripcionExistente] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM estudiante_asignatura WHERE estudiante_id = ? AND profesor_asignatura_id = ?',
        [estudiante_id, profesor_asignatura_id]
      );

      if (inscripcionExistente.length > 0) {
        const response: ApiResponse = {
          success: false,
          message: 'El estudiante ya está inscrito en esta asignatura con este profesor'
        };
        res.status(409).json(response);
        return;
      }
      
      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO estudiante_asignatura (estudiante_id, profesor_asignatura_id) VALUES (?, ?)',
        [estudiante_id, profesor_asignatura_id]
      );
      
      const nuevaInscripcion: Inscripcion = {
        id: result.insertId,
        estudiante_id,
        profesor_asignatura_id
      };
      
      const response: ApiResponse<Inscripcion> = {
        success: true,
        message: 'Inscripción creada exitosamente',
        data: nuevaInscripcion
      };
      
      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error al crear inscripción:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Error al crear inscripción',
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  // PUT /api/inscripciones/:id/notas - Actualizar notas de una inscripción
  static async actualizarNotas(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nota1, nota2, nota3 }: InscripcionUpdate = req.body;
      
      if (!id || isNaN(Number(id))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de inscripción inválido'
        };
        res.status(400).json(response);
        return;
      }

      // Validar que las notas estén en el rango correcto
      const notas = [nota1, nota2, nota3].filter(nota => nota !== undefined);
      for (const nota of notas) {
        if (nota !== null && (nota < 0 || nota > 5)) {
          const response: ApiResponse = {
            success: false,
            message: 'Las notas deben estar entre 0.0 y 5.0'
          };
          res.status(400).json(response);
          return;
        }
      }
      
      // Construir query dinámicamente
      const fields: string[] = [];
      const values: any[] = [];
      
      if (nota1 !== undefined) {
        fields.push('nota1 = ?');
        values.push(nota1);
      }
      if (nota2 !== undefined) {
        fields.push('nota2 = ?');
        values.push(nota2);
      }
      if (nota3 !== undefined) {
        fields.push('nota3 = ?');
        values.push(nota3);
      }
      
      if (fields.length === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'No hay notas para actualizar'
        };
        res.status(400).json(response);
        return;
      }
      
      values.push(id);
      
      const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE estudiante_asignatura SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      if (result.affectedRows === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Inscripción no encontrada'
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: true,
        message: 'Notas actualizadas exitosamente'
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error al actualizar notas:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Error al actualizar notas',
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/inscripciones/:id - Eliminar inscripción
  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de inscripción inválido'
        };
        res.status(400).json(response);
        return;
      }
      
      const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM estudiante_asignatura WHERE id = ?',
        [id]
      );
      
      if (result.affectedRows === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Inscripción no encontrada'
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: true,
        message: 'Inscripción eliminada exitosamente'
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al eliminar inscripción:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al eliminar inscripción',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }
}