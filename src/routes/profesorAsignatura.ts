import { Router, Request, Response } from 'express';
import db from '../config/database';
import { ResultSetHeader } from 'mysql2';

const router = Router();

// GET /api/inscripciones
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [rows] = await db.execute<any[]>(`
      SELECT 
        ea.id,
        CONCAT(e.nombre, ' ', e.apellido) AS estudiante,
        e.id AS estudiante_id,
        e.documento AS estudiante_documento,
        a.nombre AS asignatura,
        a.codigo AS asignatura_codigo,
        a.id AS asignatura_id,
        CONCAT(p.nombre, ' ', p.apellido) AS profesor,
        p.id AS profesor_id,
        pa.grupo,
        pa.horario,
        ea.nota1,
        ea.nota2,
        ea.nota3,
        ea.nota_final,
        ea.fecha_inscripcion,
        ea.estado
      FROM estudiante_asignatura ea
      JOIN estudiantes e ON ea.estudiante_id = e.id
      JOIN profesor_asignatura pa ON ea.profesor_asignatura_id = pa.id
      JOIN profesores p ON pa.profesor_id = p.id
      JOIN asignaturas a ON pa.asignatura_id = a.id
    `);

    res.status(200).json({ success: true, data: rows, count: rows.length });
  } catch (error: any) {
    console.error('Error al obtener inscripciones:', error);
    res.status(500).json({ success: false, message: 'Error al obtener inscripciones', error: error.message });
  }
});

// ✅ GET /api/inscripciones/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute<any[]>(`
      SELECT 
        ea.id,
        CONCAT(e.nombre, ' ', e.apellido) AS estudiante,
        e.id AS estudiante_id,
        e.documento AS estudiante_documento,
        a.nombre AS asignatura,
        a.codigo AS asignatura_codigo,
        a.id AS asignatura_id,
        CONCAT(p.nombre, ' ', p.apellido) AS profesor,
        p.id AS profesor_id,
        pa.grupo,
        pa.horario,
        ea.nota1,
        ea.nota2,
        ea.nota3,
        ea.nota_final,
        ea.fecha_inscripcion,
        ea.estado
      FROM estudiante_asignatura ea
      JOIN estudiantes e ON ea.estudiante_id = e.id
      JOIN profesor_asignatura pa ON ea.profesor_asignatura_id = pa.id
      JOIN profesores p ON pa.profesor_id = p.id
      JOIN asignaturas a ON pa.asignatura_id = a.id
      WHERE ea.id = ?
    `, [id]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Inscripción no encontrada' });
      return;
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error: any) {
    console.error('Error al obtener inscripción:', error);
    res.status(500).json({ success: false, message: 'Error al obtener inscripción', error: error.message });
  }
});

// POST /api/inscripciones
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { estudiante_id, profesor_asignatura_id } = req.body;

    if (!estudiante_id || !profesor_asignatura_id) {
      res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
      return;
    }

    const [exists] = await db.execute<any[]>(
      'SELECT id FROM estudiante_asignatura WHERE estudiante_id = ? AND profesor_asignatura_id = ?',
      [estudiante_id, profesor_asignatura_id]
    );

    if (exists.length > 0) {
      res.status(409).json({ success: false, message: 'El estudiante ya está inscrito en esta asignatura' });
      return;
    }

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO estudiante_asignatura (estudiante_id, profesor_asignatura_id, fecha_inscripcion) 
       VALUES (?, ?, NOW())`,
      [estudiante_id, profesor_asignatura_id]
    );

    res.status(201).json({ success: true, message: 'Inscripción creada', id: result.insertId });
  } catch (error: any) {
    console.error('Error al crear inscripción:', error);
    res.status(500).json({ success: false, message: 'Error al crear inscripción', error: error.message });
  }
});

// PUT /api/inscripciones/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nota1, nota2, nota3, estado } = req.body;

    const notas = [nota1, nota2, nota3].map(n => parseFloat(n));
    const nota_final = ((notas[0] + notas[1] + notas[2]) / 3).toFixed(1);

    await db.execute(
      `UPDATE estudiante_asignatura 
       SET nota1 = ?, nota2 = ?, nota3 = ?, nota_final = ?, estado = ? 
       WHERE id = ?`,
      [nota1, nota2, nota3, nota_final, estado, id]
    );

    res.status(200).json({ success: true, message: 'Inscripción actualizada' });
  } catch (error: any) {
    console.error('Error al actualizar inscripción:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar inscripción', error: error.message });
  }
});

// DELETE /api/inscripciones/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute<any[]>(
      'SELECT id FROM estudiante_asignatura WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Inscripción no encontrada' });
      return;
    }

    await db.execute('DELETE FROM estudiante_asignatura WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Inscripción eliminada' });
  } catch (error: any) {
    console.error('Error al eliminar inscripción:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar inscripción', error: error.message });
  }
});

export default router;
