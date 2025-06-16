import { Request, Response } from 'express';
import pool from '../config/database';
import { Asignatura, AsignaturaCreate, AsignaturaUpdate } from '../models/Asignatura';
import { ApiResponse } from '../types/api';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class AsignaturaController {
  
  // GET /api/asignaturas - Obtener todas las asignaturas
  static async obtenerTodas(req: Request, res: Response): Promise<void> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM asignaturas WHERE activo = TRUE ORDER BY nombre'
      );
      
      const response: ApiResponse<Asignatura[]> = {
        success: true,
        data: rows as Asignatura[],
        count: rows.length
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener asignaturas:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al obtener asignaturas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }

  // GET /api/asignaturas/:id - Obtener asignatura por ID
  static async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de asignatura inválido'
        };
        res.status(400).json(response);
        return;
      }
      
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM asignaturas WHERE id = ? AND activo = TRUE',
        [id]
      );
      
      if (rows.length === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Asignatura no encontrada'
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse<Asignatura> = {
        success: true,
        data: rows[0] as Asignatura
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener asignatura:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al obtener asignatura',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }

  // POST /api/asignaturas - Crear nueva asignatura
  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, codigo, creditos, descripcion }: AsignaturaCreate = req.body;
      
      // Validaciones de campos obligatorios
      if (!nombre || !codigo || !creditos) {
        const response: ApiResponse = {
          success: false,
          message: 'Los campos nombre, código y créditos son obligatorios'
        };
        res.status(400).json(response);
        return;
      }

      // Validación de créditos (1-6)
      if (creditos < 1 || creditos > 6) {
        const response: ApiResponse = {
          success: false,
          message: 'Los créditos deben estar entre 1 y 6'
        };
        res.status(400).json(response);
        return;
      }
      
      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO asignaturas (nombre, codigo, creditos, descripcion) VALUES (?, ?, ?, ?)',
        [nombre, codigo, creditos, descripcion || null]
      );
      
      const nuevaAsignatura: Asignatura = {
        id: result.insertId,
        nombre,
        codigo,
        creditos,
        descripcion,
        activo: true
      };
      
      const response: ApiResponse<Asignatura> = {
        success: true,
        message: 'Asignatura creada exitosamente',
        data: nuevaAsignatura
      };
      
      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error al crear asignatura:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        const response: ApiResponse = {
          success: false,
          message: 'El código de asignatura ya existe'
        };
        res.status(409).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: false,
        message: 'Error al crear asignatura',
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  // PUT /api/asignaturas/:id - Actualizar asignatura
  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: AsignaturaUpdate = req.body;
      
      if (!id || isNaN(Number(id))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de asignatura inválido'
        };
        res.status(400).json(response);
        return;
      }

      // Validación de créditos si se está actualizando
      if (updates.creditos && (updates.creditos < 1 || updates.creditos > 6)) {
        const response: ApiResponse = {
          success: false,
          message: 'Los créditos deben estar entre 1 y 6'
        };
        res.status(400).json(response);
        return;
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
        `UPDATE asignaturas SET ${fields.join(', ')} WHERE id = ? AND activo = TRUE`,
        values
      );
      
      if (result.affectedRows === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Asignatura no encontrada'
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: true,
        message: 'Asignatura actualizada exitosamente'
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error al actualizar asignatura:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        const response: ApiResponse = {
          success: false,
          message: 'El código de asignatura ya existe'
        };
        res.status(409).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: false,
        message: 'Error al actualizar asignatura',
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/asignaturas/:id - Eliminar asignatura (soft delete)
  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de asignatura inválido'
        };
        res.status(400).json(response);
        return;
      }
      
      // Verificar si la asignatura tiene profesores asignados
      const [asignaciones] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM profesor_asignatura WHERE asignatura_id = ? AND activo = TRUE',
        [id]
      );
      
      if (asignaciones[0].count > 0) {
        const response: ApiResponse = {
          success: false,
          message: 'No se puede eliminar la asignatura porque tiene profesores asignados'
        };
        res.status(409).json(response);
        return;
      }
      
      // Soft delete
      const [result] = await pool.execute<ResultSetHeader>(
        'UPDATE asignaturas SET activo = FALSE WHERE id = ? AND activo = TRUE',
        [id]
      );
      
      if (result.affectedRows === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Asignatura no encontrada'
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: true,
        message: 'Asignatura eliminada exitosamente'
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al eliminar asignatura:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al eliminar asignatura',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }

  // GET /api/asignaturas/:id/profesores - Obtener profesores de la asignatura
  static async obtenerProfesores(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de asignatura inválido'
        };
        res.status(400).json(response);
        return;
      }
      
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          pa.id,
          pa.profesor_id,
          CONCAT(p.nombre, ' ', p.apellido) as nombre,
          p.especialidad,
          pa.grupo,
          pa.horario,
          pa.semestre,
          COUNT(ea.id) as estudiantes_count
        FROM profesor_asignatura pa
        JOIN profesores p ON pa.profesor_id = p.id
        LEFT JOIN estudiante_asignatura ea ON pa.id = ea.profesor_asignatura_id
        WHERE pa.asignatura_id = ? AND pa.activo = TRUE
        GROUP BY pa.id, p.nombre, p.apellido, p.especialidad, pa.grupo, pa.horario, pa.semestre
        ORDER BY p.apellido, p.nombre, pa.grupo`,
        [id]
      );
      
      const response: ApiResponse = {
        success: true,
        data: rows,
        count: rows.length
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener profesores de la asignatura:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error al obtener profesores de la asignatura',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      res.status(500).json(response);
    }
  }
}