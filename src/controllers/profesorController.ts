import { Request, Response } from 'express';
import pool from '../config/database';
import { Profesor, ProfesorCreate, ProfesorUpdate } from '../models/Profesor';
import { ApiResponse } from '../types/api';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class ProfesorController {
  
  // GET /api/profesores - Obtener todos los profesores
  static async obtenerTodos(req: Request, res: Response): Promise<void> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM profesores WHERE activo = TRUE ORDER BY apellido, nombre'
      );
      
      const response: ApiResponse<Profesor[]> = {
        success: true,
        data: rows as Profesor[],
        count: rows.length
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener profesores:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al obtener profesores',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }

  // GET /api/profesores/:id - Obtener profesor por ID
  static async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de profesor inválido'
        };
        res.status(400).json(response);
        return;
      }
      
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM profesores WHERE id = ? AND activo = TRUE',
        [id]
      );
      
      if (rows.length === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Profesor no encontrado'
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse<Profesor> = {
        success: true,
        data: rows[0] as Profesor
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener profesor:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al obtener profesor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }

  // POST /api/profesores - Crear nuevo profesor
  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, apellido, email, telefono, especialidad, documento }: ProfesorCreate = req.body;
      
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
        'INSERT INTO profesores (nombre, apellido, email, telefono, especialidad, documento) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, apellido, email, telefono || null, especialidad || null, documento]
      );
      
      const nuevoProfesor: Profesor = {
        id: result.insertId,
        nombre,
        apellido,
        email,
        telefono,
        especialidad,
        documento,
        activo: true
      };
      
      const response: ApiResponse<Profesor> = {
        success: true,
        message: 'Profesor creado exitosamente',
        data: nuevoProfesor
      };
      
      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error al crear profesor:', error);
      
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
        message: 'Error al crear profesor',
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  // PUT /api/profesores/:id - Actualizar profesor
  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: ProfesorUpdate = req.body;
      
      if (!id || isNaN(Number(id))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de profesor inválido'
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
      
      // Construir query dinámicamente
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
        `UPDATE profesores SET ${fields.join(', ')} WHERE id = ? AND activo = TRUE`,
        values
      );
      
      if (result.affectedRows === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Profesor no encontrado'
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: true,
        message: 'Profesor actualizado exitosamente'
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error al actualizar profesor:', error);
      
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
        message: 'Error al actualizar profesor',
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/profesores/:id - Eliminar profesor (soft delete)
  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de profesor inválido'
        };
        res.status(400).json(response);
        return;
      }
      
      // Verificar si el profesor tiene asignaturas asignadas
      const [asignaciones] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM profesor_asignatura WHERE profesor_id = ? AND activo = TRUE',
        [id]
      );
      
      if (asignaciones[0].count > 0) {
        const response: ApiResponse = {
          success: false,
          message: 'No se puede eliminar el profesor porque tiene asignaturas asignadas'
        };
        res.status(409).json(response);
        return;
      }
      
      // Soft delete
      const [result] = await pool.execute<ResultSetHeader>(
        'UPDATE profesores SET activo = FALSE WHERE id = ? AND activo = TRUE',
        [id]
      );
      
      if (result.affectedRows === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Profesor no encontrado'
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: true,
        message: 'Profesor eliminado exitosamente'
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al eliminar profesor:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al eliminar profesor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }

  // GET /api/profesores/:id/asignaturas - Obtener asignaturas del profesor
  static async obtenerAsignaturas(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de profesor inválido'
        };
        res.status(400).json(response);
        return;
      }
      
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          pa.id,
          pa.asignatura_id,
          a.nombre,
          a.codigo,
          pa.grupo,
          pa.horario,
          pa.semestre,
          COUNT(ea.id) as estudiantes_count
        FROM profesor_asignatura pa
        JOIN asignaturas a ON pa.asignatura_id = a.id
        LEFT JOIN estudiante_asignatura ea ON pa.id = ea.profesor_asignatura_id
        WHERE pa.profesor_id = ? AND pa.activo = TRUE
        GROUP BY pa.id, a.nombre, a.codigo, pa.grupo, pa.horario, pa.semestre
        ORDER BY a.nombre, pa.grupo`,
        [id]
      );
      
      const response: ApiResponse = {
        success: true,
        data: rows,
        count: rows.length
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener asignaturas del profesor:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al obtener asignaturas del profesor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }
}