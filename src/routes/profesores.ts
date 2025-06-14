import express, { Request, Response } from 'express';
import db from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';  // Solo una línea, aquí todos los tipos

const router = express.Router();

// GET /api/profesores - Obtener todos los profesores
router.get('/', async (req: Request, res: Response) => {
    try {
        const [rows] = await db.execute<any[]>(
            'SELECT * FROM profesores WHERE activo = TRUE ORDER BY apellido, nombre'
        );

        res.status(200).json({
            success: true,
            data: rows,
            count: rows.length
        });
    } catch (error: any) {
        console.error('Error al obtener profesores:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener profesores',
            error: error.message
        });
    }
});

// GET /api/profesores/:id - Obtener un profesor por ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(
      'SELECT * FROM profesores WHERE id = ? AND activo = TRUE',
      [id]
    );
    const profesores = rows as any[];

    if (profesores.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Profesor no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: profesores[0]
    });
  } catch (error: any) {
    console.error('Error al obtener profesor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener profesor',
      error: error.message
    });
  }
});

// POST /api/profesores - Crear un nuevo profesor
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, apellido, email, telefono, especialidad, documento } = req.body;

    if (!nombre || !apellido || !email || !documento) {
      res.status(400).json({
        success: false,
        message: 'Los campos nombre, apellido, email y documento son obligatorios'
      });
      return;
    }

    // Ejecutar el INSERT, tipando el resultado con ResultSetHeader para obtener insertId
    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO profesores (nombre, apellido, email, telefono, especialidad, documento) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, apellido, email, telefono, especialidad, documento]
    );

    res.status(201).json({
      success: true,
      message: 'Profesor creado exitosamente',
      data: {
        id: result.insertId,
        nombre,
        apellido,
        email,
        telefono,
        especialidad,
        documento
      }
    });
  } catch (error: any) {
    console.error('Error al crear profesor:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        success: false,
        message: 'El email o documento ya existe'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear profesor',
      error: error.message
    });
  }
});

// PUT /api/profesores/:id - Actualizar un profesor
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, telefono, especialidad, documento } = req.body;

    // Tipamos el resultado como RowDataPacket[]
    const [existing] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM profesores WHERE id = ? AND activo = TRUE',
      [id]
    );

    if (existing.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Profesor no encontrado'
      });
      return;
    }

    await db.execute(
      'UPDATE profesores SET nombre = ?, apellido = ?, email = ?, telefono = ?, especialidad = ?, documento = ? WHERE id = ?',
      [nombre, apellido, email, telefono, especialidad, documento, id]
    );

    res.status(200).json({
      success: true,
      message: 'Profesor actualizado exitosamente'
    });
  } catch (error: any) {
    console.error('Error al actualizar profesor:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        success: false,
        message: 'El email o documento ya existe'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar profesor',
      error: error.message
    });
  }
});

// DELETE /api/profesores/:id - Eliminar un profesor (soft delete)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Tipar la respuesta como RowDataPacket[] para el SELECT
    const [existing] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM profesores WHERE id = ? AND activo = TRUE',
      [id]
    );

    if (existing.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Profesor no encontrado'
      });
      return;
    }

    await db.execute(
      'UPDATE profesores SET activo = FALSE WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Profesor eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('Error al eliminar profesor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar profesor',
      error: error.message
    });
  }
});

// GET /api/profesores/:id/asignaturas - Obtener asignaturas que imparte un profesor
router.get('/:id/asignaturas', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const [rows] = await db.execute<any[]>(`
            SELECT 
                a.id as asignatura_id,
                a.nombre as asignatura,
                a.codigo,
                a.creditos,
                pa.grupo,
                pa.horario,
                pa.semestre,
                COUNT(ea.estudiante_id) as estudiantes_inscritos
            FROM profesor_asignatura pa
            JOIN asignaturas a ON pa.asignatura_id = a.id
            LEFT JOIN estudiante_asignatura ea ON pa.id = ea.profesor_asignatura_id
            WHERE pa.profesor_id = ? AND pa.activo = TRUE AND a.activo = TRUE
            GROUP BY pa.id, a.id, a.nombre, a.codigo, a.creditos, pa.grupo, pa.horario, pa.semestre
            ORDER BY a.nombre, pa.grupo
        `, [id]);

        res.status(200).json({
            success: true,
            data: rows,
            count: rows.length
        });
    } catch (error: any) {
        console.error('Error al obtener asignaturas del profesor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener asignaturas del profesor',
            error: error.message
        });
    }
});

export default router;
