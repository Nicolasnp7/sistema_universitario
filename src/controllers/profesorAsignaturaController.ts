import { Request, Response } from 'express';
import pool from '../config/database';
import { ProfesorAsignatura, ProfesorAsignaturaCreate, ProfesorAsignaturaUpdate, ProfesorAsignaturaCompleta } from '../models/Inscripcion';
import { ApiResponse } from '../types/api';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class ProfesorAsignaturaController {
  
  // GET /api/profesor-asignatura - Obtener todas las asignaciones
  static async obtenerTodas(req: Request, res: Response): Promise<void> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          pa.id,
          pa.profesor_id,
          pa.asignatura_id,
          pa.grupo,
          pa.horario,
          pa.semestre,
          pa.activo,
          pa.fecha_creacion,
          CONCAT(p.nombre, ' ', p.apellido) as profesor_nombre,
          p.especialidad as profesor_especialidad,
          a.nombre as asignatura_nombre,
          a.codigo as asignatura_codigo,
          a.creditos as asignatura_creditos,
          COUNT(ea.id) as estudiantes_count
        FROM profesor_asignatura pa
        JOIN profesores p ON pa.profesor_id = p.id
        JOIN asignaturas a ON pa.asignatura_id = a.id
        LEFT JOIN estudiante_asignatura ea ON pa.id = ea.profesor_asignatura_id
        WHERE pa.activo = TRUE AND p.activo = TRUE AND a.activo = TRUE
        GROUP BY pa.id, p.nombre, p.apellido, p.especialidad, a.nombre, a.codigo, a.creditos, pa.grupo, pa.horario, pa.semestre
        ORDER BY a.nombre, pa.grupo`
      );
      
      const response: ApiResponse<ProfesorAsignaturaCompleta[]> = {
        success: true,
        data: rows as ProfesorAsignaturaCompleta[],
        count: rows.length
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener asignaciones profesor-asignatura:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al obtener asignaciones profesor-asignatura',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }

  // GET /api/profesor-asignatura/:id - Obtener asignación por ID
  static async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de asignación inválido'
        };
        res.status(400).json(response);
        return;
      }
      
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          pa.id,
          pa.profesor_id,
          pa.asignatura_id,
          pa.grupo,
          pa.horario,
          pa.semestre,
          pa.activo,
          pa.fecha_creacion,
          CONCAT(p.nombre, ' ', p.apellido) as profesor_nombre,
          p.especialidad as profesor_especialidad,
          a.nombre as asignatura_nombre,
          a.codigo as asignatura_codigo,
          a.creditos as asignatura_creditos,
          COUNT(ea.id) as estudiantes_count
        FROM profesor_asignatura pa
        JOIN profesores p ON pa.profesor_id = p.id
        JOIN asignaturas a ON pa.asignatura_id = a.id
        LEFT JOIN estudiante_asignatura ea ON pa.id = ea.profesor_asignatura_id
        WHERE pa.id = ? AND pa.activo = TRUE
        GROUP BY pa.id, p.nombre, p.apellido, p.especialidad, a.nombre, a.codigo, a.creditos, pa.grupo, pa.horario, pa.semestre`,
        [id]
      );
      
      if (rows.length === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Asignación no encontrada'
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse<ProfesorAsignaturaCompleta> = {
        success: true,
        data: rows[0] as ProfesorAsignaturaCompleta
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener asignación:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al obtener asignación',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }

  // GET /api/profesor-asignatura/opciones/crear - Opciones para crear asignaciones
  static async obtenerOpcionesCrear(req: Request, res: Response): Promise<void> {
    try {
      // Obtener profesores activos
      const [profesores] = await pool.execute<RowDataPacket[]>(
        'SELECT id, CONCAT(nombre, " ", apellido) as nombre_completo, especialidad FROM profesores WHERE activo = TRUE ORDER BY apellido, nombre'
      );
      
      // Obtener asignaturas activas
      const [asignaturas] = await pool.execute<RowDataPacket[]>(
        'SELECT id, nombre, codigo, creditos FROM asignaturas WHERE activo = TRUE ORDER BY nombre'
      );
      
      const response: ApiResponse = {
        success: true,
        data: {
          profesores,
          asignaturas
        }
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener opciones para crear asignación:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al obtener opciones para crear asignación',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }

  // POST /api/profesor-asignatura - Crear nueva asignación
  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const { profesor_id, asignatura_id, grupo, horario, semestre }: ProfesorAsignaturaCreate = req.body;
      
      // Validaciones de campos obligatorios
      if (!profesor_id || !asignatura_id || !grupo || !horario) {
        const response: ApiResponse = {
          success: false,
          message: 'Los campos profesor_id, asignatura_id, grupo y horario son obligatorios'
        };
        res.status(400).json(response);
        return;
      }

      // Verificar que el profesor existe y está activo
      const [profesor] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM profesores WHERE id = ? AND activo = TRUE',
        [profesor_id]
      );

      if (profesor.length === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'El profesor no existe o no está activo'
        };
        res.status(400).json(response);
        return;
      }

      // Verificar que la asignatura existe y está activa
      const [asignatura] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM asignaturas WHERE id = ? AND activo = TRUE',
        [asignatura_id]
      );

      if (asignatura.length === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'La asignatura no existe o no está activa'
        };
        res.status(400).json(response);
        return;
      }

      // Verificar que no existe una asignación duplicada
      const semestreActual = semestre || '2024-1';
      const [asignacionExistente] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM profesor_asignatura WHERE profesor_id = ? AND asignatura_id = ? AND grupo = ? AND semestre = ? AND activo = TRUE',
        [profesor_id, asignatura_id, grupo, semestreActual]
      );

      if (asignacionExistente.length > 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Ya existe una asignación para este profesor, asignatura, grupo y semestre'
        };
        res.status(409).json(response);
        return;
      }
      
      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO profesor_asignatura (profesor_id, asignatura_id, grupo, horario, semestre) VALUES (?, ?, ?, ?, ?)',
        [profesor_id, asignatura_id, grupo, horario, semestreActual]
      );
      
      const nuevaAsignacion: ProfesorAsignatura = {
        id: result.insertId,
        profesor_id,
        asignatura_id,
        grupo,
        horario,
        semestre: semestreActual,
        activo: true
      };
      
      const response: ApiResponse<ProfesorAsignatura> = {
        success: true,
        message: 'Asignación creada exitosamente',
        data: nuevaAsignacion
      };
      
      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error al crear asignación:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Error al crear asignación',
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  // PUT /api/profesor-asignatura/:id - Actualizar asignación
  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: ProfesorAsignaturaUpdate = req.body;
      
      if (!id || isNaN(Number(id))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de asignación inválido'
        };
        res.status(400).json(response);
        return;
      }
      
      // Construir query dinámicamente solo con campos permitidos
      const fields: string[] = [];
      const values: any[] = [];
      
      // Solo permitir actualizar grupo, horario y semestre
      const allowedFields = ['grupo', 'horario', 'semestre'];
      
      Object.entries(updates).forEach(([key, value]) => {
        if (allowedFields.includes(key) && value !== undefined && value !== null && value !== '') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      if (fields.length === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'No hay campos válidos para actualizar (solo se permiten: grupo, horario, semestre)'
        };
        res.status(400).json(response);
        return;
      }
      
      values.push(id);
      
      const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE profesor_asignatura SET ${fields.join(', ')} WHERE id = ? AND activo = TRUE`,
        values
      );
      
      if (result.affectedRows === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Asignación no encontrada'
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: true,
        message: 'Asignación actualizada exitosamente'
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error al actualizar asignación:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Error al actualizar asignación',
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/profesor-asignatura/:id - Eliminar asignación
  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de asignación inválido'
        };
        res.status(400).json(response);
        return;
      }
      
      // Verificar si hay estudiantes inscritos en esta asignación
      const [inscripciones] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM estudiante_asignatura WHERE profesor_asignatura_id = ?',
        [id]
      );
      
      if (inscripciones[0].count > 0) {
        const response: ApiResponse = {
          success: false,
          message: 'No se puede eliminar la asignación porque tiene estudiantes inscritos'
        };
        res.status(409).json(response);
        return;
      }
      
      // Soft delete
      const [result] = await pool.execute<ResultSetHeader>(
        'UPDATE profesor_asignatura SET activo = FALSE WHERE id = ? AND activo = TRUE',
        [id]
      );
      
      if (result.affectedRows === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Asignación no encontrada'
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: true,
        message: 'Asignación eliminada exitosamente'
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al eliminar asignación:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al eliminar asignación',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }
}