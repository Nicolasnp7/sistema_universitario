import express, { Request, Response } from 'express';
import db from '../config/database';

const router = express.Router();

// GET /api/inscripciones
router.get('/', async (_req: Request, res: Response) => {
    try {
        const [rows] = await db.execute<any[]>(`
            SELECT 
                ea.id,
                CONCAT(e.nombre, ' ', e.apellido) as estudiante,
                e.id as estudiante_id,
                e.documento as estudiante_documento,
                a.nombre as asignatura,
                a.codigo as asignatura_codigo,
                a.id as asignatura_id,
                CONCAT(p.nombre, ' ', p.apellido) as profesor,
                p.id as profesor_id,
                pa.grupo,
                pa.horario,
                ea.nota1,
                ea.nota2,
                ea.nota3,
                ea.nota_final,
                ea.fecha_inscripcion,
                CASE 
                    WHEN ea.nota_final >= 3.0 THEN 'APROBADO'
                    WHEN ea.nota_final < 3.0 AND ea.nota_final IS NOT NULL THEN 'REPROBADO'
                    ELSE 'EN CURSO'
                END as estado
            FROM estudiante_asignatura ea
            JOIN profesor_asignatura pa ON ea.profesor_asignatura_id = pa.id
            JOIN estudiantes e ON ea.estudiante_id = e.id
            JOIN asignaturas a ON pa.asignatura_id = a.id
            JOIN profesores p ON pa.profesor_id = p.id
            WHERE e.activo = TRUE AND a.activo = TRUE AND p.activo = TRUE AND pa.activo = TRUE
            ORDER BY e.apellido, e.nombre, a.nombre
        `);
        res.status(200).json({ success: true, data: rows, count: rows.length });
    } catch (error: any) {
        console.error('Error al obtener inscripciones:', error);
        res.status(500).json({ success: false, message: 'Error al obtener inscripciones', error: error.message });
    }
});

// GET /api/inscripciones/por-asignatura/:asignaturaId/:grupo
router.get('/por-asignatura/:asignaturaId/:grupo', async (req: Request, res: Response) => {
    try {
        const { asignaturaId, grupo } = req.params;
        const [rows] = await db.execute<any[]>(`
            SELECT 
                ea.id,
                CONCAT(e.nombre, ' ', e.apellido) as estudiante,
                e.id as estudiante_id,
                e.documento,
                e.email,
                ea.nota1,
                ea.nota2,
                ea.nota3,
                ea.nota_final,
                CASE 
                    WHEN ea.nota_final >= 3.0 THEN 'APROBADO'
                    WHEN ea.nota_final < 3.0 AND ea.nota_final IS NOT NULL THEN 'REPROBADO'
                    ELSE 'EN CURSO'
                END as estado,
                ea.fecha_inscripcion
            FROM estudiante_asignatura ea
            JOIN profesor_asignatura pa ON ea.profesor_asignatura_id = pa.id
            JOIN estudiantes e ON ea.estudiante_id = e.id
            WHERE pa.asignatura_id = ? AND pa.grupo = ? AND e.activo = TRUE AND pa.activo = TRUE
            ORDER BY e.apellido, e.nombre
        `, [asignaturaId, grupo]);
        res.status(200).json({ success: true, data: rows, count: rows.length });
    } catch (error: any) {
        console.error('Error al obtener inscripciones por asignatura:', error);
        res.status(500).json({ success: false, message: 'Error al obtener inscripciones por asignatura', error: error.message });
    }
});

// POST /api/inscripciones
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { estudiante_id, profesor_asignatura_id } = req.body;

  try {
    if (!estudiante_id || !profesor_asignatura_id) {
      res.status(400).json({ success: false, message: 'Los campos estudiante_id y profesor_asignatura_id son obligatorios' });
      return;
    }

    const [estudiante] = await db.execute('SELECT id FROM estudiantes WHERE id = ? AND activo = TRUE', [estudiante_id]);
    if ((estudiante as any[]).length === 0) {
      res.status(404).json({ success: false, message: 'Estudiante no encontrado o inactivo' });
      return;
    }

    const [profesorAsignatura] = await db.execute('SELECT id FROM profesor_asignatura WHERE id = ? AND activo = TRUE', [profesor_asignatura_id]);
    if ((profesorAsignatura as any[]).length === 0) {
      res.status(404).json({ success: false, message: 'Asignatura-profesor no encontrada o inactiva' });
      return;
    }

    const [existeInscripcion] = await db.execute(
      'SELECT id FROM estudiante_asignatura WHERE estudiante_id = ? AND profesor_asignatura_id = ?',
      [estudiante_id, profesor_asignatura_id]
    );
    if ((existeInscripcion as any[]).length > 0) {
      res.status(409).json({ success: false, message: 'El estudiante ya está inscrito en esta asignatura con este profesor' });
      return;
    }

    const [result] = await db.execute('INSERT INTO estudiante_asignatura (estudiante_id, profesor_asignatura_id) VALUES (?, ?)', [estudiante_id, profesor_asignatura_id]);

    res.status(201).json({
      success: true,
      message: 'Inscripción creada exitosamente',
      data: {
        id: (result as any).insertId,
        estudiante_id,
        profesor_asignatura_id
      }
    });
  } catch (error: any) {
    console.error('Error al crear inscripción:', error);
    res.status(500).json({ success: false, message: 'Error al crear inscripción', error: error.message });
  }
});


// PUT /api/inscripciones/:id/notas
router.put('/:id/notas', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nota1, nota2, nota3 } = req.body;

  try {
    const notas = [nota1, nota2, nota3].filter(
      (n) => n !== null && n !== undefined && n !== ''
    );

    for (const nota of notas) {
      if (typeof nota !== 'number' || nota < 0 || nota > 5) {
        res.status(400).json({ success: false, message: 'Las notas deben estar entre 0 y 5' });
        return;
      }
    }

    const [existing] = await db.execute('SELECT id FROM estudiante_asignatura WHERE id = ?', [id]);
    if ((existing as any[]).length === 0) {
      res.status(404).json({ success: false, message: 'Inscripción no encontrada' });
      return;
    }

    await db.execute(
      'UPDATE estudiante_asignatura SET nota1 = ?, nota2 = ?, nota3 = ? WHERE id = ?',
      [nota1 || null, nota2 || null, nota3 || null, id]
    );

    res.status(200).json({ success: true, message: 'Notas actualizadas exitosamente' });
  } catch (error: any) {
    console.error('Error al actualizar notas:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar notas', error: error.message });
  }
});

// DELETE /api/inscripciones/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [existing] = await db.execute('SELECT id FROM estudiante_asignatura WHERE id = ?', [id]);
    
    if ((existing as any[]).length === 0) {
      res.status(404).json({ success: false, message: 'Inscripción no encontrada' });
      return;
    }

    await db.execute('DELETE FROM estudiante_asignatura WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Inscripción eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error al eliminar inscripción:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar inscripción', error: error.message });
  }
});


// GET /api/inscripciones/opciones-inscripcion
router.get('/opciones-inscripcion', async (_req: Request, res: Response) => {
    try {
        const [estudiantes] = await db.execute<any[]>(`
            SELECT id, CONCAT(nombre, ' ', apellido) as nombre_completo, documento, email
            FROM estudiantes 
            WHERE activo = TRUE 
            ORDER BY apellido, nombre
        `);

        const [asignaturas] = await db.execute<any[]>(`
            SELECT 
                pa.id as profesor_asignatura_id,
                a.id as asignatura_id,
                a.nombre as asignatura,
                a.codigo,
                CONCAT(p.nombre, ' ', p.apellido) as profesor,
                pa.grupo,
                pa.horario,
                pa.semestre
            FROM profesor_asignatura pa
            JOIN asignaturas a ON pa.asignatura_id = a.id
            JOIN profesores p ON pa.profesor_id = p.id
            WHERE pa.activo = TRUE AND a.activo = TRUE AND p.activo = TRUE
            ORDER BY a.nombre, pa.grupo
        `);

        res.status(200).json({ success: true, data: { estudiantes, asignaturas } });
    } catch (error: any) {
        console.error('Error al obtener opciones de inscripción:', error);
        res.status(500).json({ success: false, message: 'Error al obtener opciones de inscripción', error: error.message });
    }
});

export default router;
