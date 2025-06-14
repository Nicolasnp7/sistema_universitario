import express, { Request, Response } from 'express';
import db from '../config/database';


const router = express.Router();

// GET /api/profesor-asignatura
router.get('/', async (req: Request, res: Response) => {
    try {
        const [rows] = await db.execute<any[]>(`
            SELECT 
                pa.id,
                pa.profesor_id,
                pa.asignatura_id,
                pa.grupo,
                pa.horario,
                pa.semestre,
                CONCAT(p.nombre, ' ', p.apellido) as profesor,
                a.nombre as asignatura,
                a.codigo as asignatura_codigo,
                a.creditos,
                COUNT(ea.estudiante_id) as estudiantes_inscritos,
                pa.fecha_creacion
            FROM profesor_asignatura pa
            JOIN profesores p ON pa.profesor_id = p.id
            JOIN asignaturas a ON pa.asignatura_id = a.id
            LEFT JOIN estudiante_asignatura ea ON pa.id = ea.profesor_asignatura_id
            WHERE pa.activo = TRUE AND p.activo = TRUE AND a.activo = TRUE
            GROUP BY pa.id, pa.profesor_id, pa.asignatura_id, pa.grupo, pa.horario, pa.semestre, p.nombre, p.apellido, a.nombre, a.codigo, a.creditos, pa.fecha_creacion
            ORDER BY p.apellido, p.nombre, a.nombre, pa.grupo
        `);

        res.status(200).json({ success: true, data: rows, count: rows.length });
    } catch (error: any) {
        console.error('Error al obtener asignaciones:', error);
        res.status(500).json({ success: false, message: 'Error al obtener asignaciones', error: error.message });
    }
});

// GET /api/profesor-asignatura/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(`
      SELECT 
        pa.id,
        pa.profesor_id,
        pa.asignatura_id,
        pa.grupo,
        pa.horario,
        pa.semestre,
        CONCAT(p.nombre, ' ', p.apellido) as profesor,
        a.nombre as asignatura,
        a.codigo as asignatura_codigo,
        COUNT(ea.estudiante_id) as estudiantes_inscritos
      FROM profesor_asignatura pa
      JOIN profesores p ON pa.profesor_id = p.id
      JOIN asignaturas a ON pa.asignatura_id = a.id
      LEFT JOIN estudiante_asignatura ea ON pa.id = ea.profesor_asignatura_id
      WHERE pa.id = ? AND pa.activo = TRUE AND p.activo = TRUE AND a.activo = TRUE
      GROUP BY pa.id, pa.profesor_id, pa.asignatura_id, pa.grupo, pa.horario, pa.semestre, p.nombre, p.apellido, a.nombre, a.codigo
    `, [id]);

    const result = rows as any[];

    if (result.length === 0) {
      res.status(404).json({ success: false, message: 'Asignación no encontrada' });
      return;
    }

    res.status(200).json({ success: true, data: result[0] });
  } catch (error: any) {
    console.error('Error al obtener asignación:', error);
    res.status(500).json({ success: false, message: 'Error al obtener asignación', error: error.message });
  }
});


// PUT /api/profesor-asignatura/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { grupo, horario, semestre } = req.body;

    if (!grupo && !horario && !semestre) {
      res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un campo para actualizar',
      });
      return;
    }

    const [existingRows] = await db.execute(
      'SELECT id, profesor_id, asignatura_id FROM profesor_asignatura WHERE id = ? AND activo = TRUE',
      [id]
    );
    const existing = existingRows as any[];

    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'Asignación no encontrada' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (grupo) {
      updates.push('grupo = ?');
      values.push(grupo);
    }
    if (horario) {
      updates.push('horario = ?');
      values.push(horario);
    }
    if (semestre) {
      updates.push('semestre = ?');
      values.push(semestre);
    }
    values.push(id);

    if (grupo) {
      const [duplicateRows] = await db.execute(
        `SELECT id FROM profesor_asignatura 
         WHERE profesor_id = ? AND asignatura_id = ? AND grupo = ? 
         AND semestre = (SELECT semestre FROM profesor_asignatura WHERE id = ?) 
         AND id != ? AND activo = TRUE`,
        [existing[0].profesor_id, existing[0].asignatura_id, grupo, id, id]
      );
      const duplicate = duplicateRows as any[];

      if (duplicate.length > 0) {
        res.status(409).json({ success: false, message: 'Ya existe una asignación para este grupo' });
        return;
      }
    }

    await db.execute(`UPDATE profesor_asignatura SET ${updates.join(', ')} WHERE id = ?`, values);

    res.status(200).json({ success: true, message: 'Asignación actualizada' });
  } catch (error: any) {
    console.error('Error al actualizar asignación:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar asignación', error: error.message });
  }
});


// DELETE /api/profesor-asignatura/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [existingRows] = await db.execute(
      'SELECT id FROM profesor_asignatura WHERE id = ? AND activo = TRUE',
      [id]
    );
    const existing = existingRows as any[];

    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'Asignación no encontrada' });
      return;
    }

    const [estudiantesRows] = await db.execute(
      'SELECT COUNT(*) as count FROM estudiante_asignatura WHERE profesor_asignatura_id = ?',
      [id]
    );
    const estudiantes = estudiantesRows as Array<{ count: number }>;

    if (estudiantes[0].count > 0) {
      res.status(409).json({
        success: false,
        message: `No se puede eliminar la asignación con ${estudiantes[0].count} estudiante(s) inscrito(s).`,
      });
      return;
    }

    await db.execute('UPDATE profesor_asignatura SET activo = FALSE WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Asignación eliminada' });
  } catch (error: any) {
    console.error('Error al eliminar asignación:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar asignación', error: error.message });
  }
});
export default router;

