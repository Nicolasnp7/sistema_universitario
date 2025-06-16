import { Request, Response } from 'express';
import pool from '../config/database';
import { Estudiante, EstudianteCreate, EstudianteUpdate } from '../models/Estudiante';
import { ApiResponse } from '../types/api';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class EstudianteController {
  
  // GET /api/estudiantes - Obtener todos los estudiantes
  static async obtenerTodos(req: Request, res: Response): Promise<void> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM estudiantes WHERE activo = TRUE ORDER BY apellido, nombre'
      );
      
      const response: ApiResponse<Estudiante[]> = {
        success: true,
        data: rows as Estudiante[],
        count: rows.length
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener estudiantes:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al obtener estudiantes',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }

  // GET /api/estudiantes/:id - Obtener estudiante por ID
  static async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de estudiante inválido'
        };
        res.status(400).json(response);
        return;
      }
      
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM estudiantes WHERE id = ? AND activo = TRUE',
        [id]
      );
      
      if (rows.length === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Estudiante no encontrado'
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse<Estudiante> = {
        success: true,
        data: rows[0] as Estudiante
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener estudiante:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al obtener estudiante',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }

  // POST /api/estudiantes - Crear nuevo estudiante
  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, apellido, email, telefono, fecha_nacimiento, documento }: EstudianteCreate = req.body;
      
      // Validaciones de campos obligatorios
      if (!nombre || !apellido || !email || !documento) {
        const response: ApiResponse = {
          success: false,
          message: 'Los campos nombre, apellido, email y documento son obligatorios'
        };
        res.status(400).json(response);
        return;
      }

      // Validación de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const response: ApiResponse = {
          success: false,
          message: 'Formato de email inválido'
        };
        res.status(400).json(response);
        return;
      }
      
      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO estudiantes (nombre, apellido, email, telefono, fecha_nacimiento, documento) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, apellido, email, telefono || null, fecha_nacimiento || null, documento]
      );
      
      const nuevoEstudiante: Estudiante = {
        id: result.insertId,
        nombre,
        apellido,
        email,
        telefono,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : undefined,
        documento,
        activo: true
      };
      
      const response: ApiResponse<Estudiante> = {
        success: true,
        message: 'Estudiante creado exitosamente',
        data: nuevoEstudiante
      };
      
      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error al crear estudiante:', error);
      
      // Manejo de errores específicos de MySQL
      if (error.code === 'ER_DUP_ENTRY') {
        const response: ApiResponse = {
          success: false,
          message: 'El email o documento ya existe'
        };
        res.status(409).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: false,
        message: 'Error al crear estudiante',
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  // PUT /api/estudiantes/:id - Actualizar estudiante
  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: EstudianteUpdate = req.body;
      
      if (!id || isNaN(Number(id))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de estudiante inválido'
        };
        res.status(400).json(response);
        return;
      }

      // Validación de email si se está actualizando
      if (updates.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updates.email)) {
          const response: ApiResponse = {
            success: false,
            message: 'Formato de email inválido'
          };
          res.status(400).json(response);
          return;
        }
      }
      
      // Construir query dinámicamente solo con campos que tienen valor
      const fields: string[] = [];
      const values: any[] = [];
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      if (fields.length === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'No hay campos válidos para actualizar'
        };
        res.status(400).json(response);
        return;
      }
      
      values.push(id);
      
      const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE estudiantes SET ${fields.join(', ')} WHERE id = ? AND activo = TRUE`,
        values
      );
      
      if (result.affectedRows === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Estudiante no encontrado'
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: true,
        message: 'Estudiante actualizado exitosamente'
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error al actualizar estudiante:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        const response: ApiResponse = {
          success: false,
          message: 'El email o documento ya existe'
        };
        res.status(409).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: false,
        message: 'Error al actualizar estudiante',
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/estudiantes/:id - Eliminar estudiante (soft delete)
  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de estudiante inválido'
        };
        res.status(400).json(response);
        return;
      }
      
      // Verificar si el estudiante tiene inscripciones activas
      const [inscripciones] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM estudiante_asignatura WHERE estudiante_id = ?',
        [id]
      );
      
      if (inscripciones[0].count > 0) {
        const response: ApiResponse = {
          success: false,
          message: 'No se puede eliminar el estudiante porque tiene inscripciones activas'
        };
        res.status(409).json(response);
        return;
      }
      
      // Soft delete - marcar como inactivo
      const [result] = await pool.execute<ResultSetHeader>(
        'UPDATE estudiantes SET activo = FALSE WHERE id = ? AND activo = TRUE',
        [id]
      );
      
      if (result.affectedRows === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Estudiante no encontrado'
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: true,
        message: 'Estudiante eliminado exitosamente'
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al eliminar estudiante:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al eliminar estudiante',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }

  // GET /api/estudiantes/:id/asignaturas - Obtener asignaturas del estudiante
  static async obtenerAsignaturas(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de estudiante inválido'
        };
        res.status(400).json(response);
        return;
      }
      
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          a.id,
          a.nombre,
          a.codigo,
          CONCAT(p.nombre, ' ', p.apellido) as profesor,
          pa.grupo,
          pa.horario,
          ea.nota1,
          ea.nota2,
          ea.nota3,
          ea.nota_final
        FROM estudiante_asignatura ea
        JOIN profesor_asignatura pa ON ea.profesor_asignatura_id = pa.id
        JOIN asignaturas a ON pa.asignatura_id = a.id
        JOIN profesores p ON pa.profesor_id = p.id
        WHERE ea.estudiante_id = ?
        ORDER BY a.nombre`,
        [id]
      );
      
      const response: ApiResponse = {
        success: true,
        data: rows,
        count: rows.length
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener asignaturas del estudiante:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al obtener asignaturas del estudiante',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }
}