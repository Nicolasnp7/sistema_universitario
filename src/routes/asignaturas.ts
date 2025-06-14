import { Router, Request, Response } from 'express';
import pool from '../config/database'; // ✅ Importa tu pool de conexión tipado

const router = Router();

// GET /api/asignaturas - Obtener todas las asignaturas
router.get('/', async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM asignaturas WHERE activo = TRUE ORDER BY nombre');
        res.status(200).json({ success: true, data: rows, count: (rows as any[]).length });
    } catch (error: any) {
        console.error('Error al obtener asignaturas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener asignaturas', error: error.message });
    }
});

// GET /api/asignaturas/:id - Obtener una asignatura por ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute<any[]>('SELECT * FROM asignaturas WHERE id = ? AND activo = TRUE', [id]);

        if (rows.length === 0) {
            res.status(404).json({ success: false, message: 'Asignatura no encontrada' });
            return;
        }

        res.status(200).json({ success: true, data: rows[0] });
    } catch (error: any) {
        console.error('Error al obtener asignatura:', error);
        res.status(500).json({ success: false, message: 'Error al obtener asignatura', error: error.message });
    }
});


import { ResultSetHeader } from 'mysql2';

// ...

// POST /api/asignaturas - Crear una nueva asignatura
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const { nombre, codigo, creditos, descripcion } = req.body;

        if (!nombre || !codigo || !creditos) {
            res.status(400).json({ success: false, message: 'Los campos nombre, código y créditos son obligatorios' });
            return;
        }

        if (creditos < 1 || creditos > 6) {
            res.status(400).json({ success: false, message: 'Los créditos deben estar entre 1 y 6' });
            return;
        }

        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO asignaturas (nombre, codigo, creditos, descripcion) VALUES (?, ?, ?, ?)',
            [nombre, codigo, creditos, descripcion]
        );

        res.status(201).json({
            success: true,
            message: 'Asignatura creada exitosamente',
            data: {
                id: result.insertId,
                nombre,
                codigo,
                creditos,
                descripcion
            }
        });
    } catch (error: any) {
        console.error('Error al crear asignatura:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ success: false, message: 'El código de asignatura ya existe' });
            return;
        }
        res.status(500).json({ success: false, message: 'Error al crear asignatura', error: error.message });
    }
});



// PUT /api/asignaturas/:id - Actualizar una asignatura
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { nombre, codigo, creditos, descripcion } = req.body;

        const [existing] = await pool.execute<any[]>(
            'SELECT id FROM asignaturas WHERE id = ? AND activo = TRUE',
            [id]
        );

        if (existing.length === 0) {
            res.status(404).json({ success: false, message: 'Asignatura no encontrada' });
            return;
        }

        if (creditos < 1 || creditos > 6) {
            res.status(400).json({ success: false, message: 'Los créditos deben estar entre 1 y 6' });
            return;
        }

        await pool.execute(
            'UPDATE asignaturas SET nombre = ?, codigo = ?, creditos = ?, descripcion = ? WHERE id = ?',
            [nombre, codigo, creditos, descripcion, id]
        );

        res.status(200).json({ success: true, message: 'Asignatura actualizada exitosamente' });
    } catch (error: any) {
        console.error('Error al actualizar asignatura:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ success: false, message: 'El código de asignatura ya existe' });
            return;
        }
        res.status(500).json({ success: false, message: 'Error al actualizar asignatura', error: error.message });
    }
});

// DELETE /api/asignaturas/:id - Eliminar una asignatura (soft delete)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const [existing] = await pool.execute<any[]>(
            'SELECT id FROM asignaturas WHERE id = ? AND activo = TRUE',
            [id]
        );

        if (existing.length === 0) {
            res.status(404).json({ success: false, message: 'Asignatura no encontrada' });
            return;
        }

        await pool.execute('UPDATE asignaturas SET activo = FALSE WHERE id = ?', [id]);

        res.status(200).json({ success: true, message: 'Asignatura eliminada exitosamente' });
    } catch (error: any) {
        console.error('Error al eliminar asignatura:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar asignatura', error: error.message });
    }
});


// GET /api/asignaturas/:id/profesores
router.get('/:id/profesores', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute(`
            SELECT 
                p.id as profesor_id,
                CONCAT(p.nombre, ' ', p.apellido) as profesor,
                p.email,
                p.especialidad,
                pa.grupo,
                pa.horario,
                pa.semestre,
                COUNT(ea.estudiante_id) as estudiantes_inscritos
            FROM profesor_asignatura pa
            JOIN profesores p ON pa.profesor_id = p.id
            LEFT JOIN estudiante_asignatura ea ON pa.id = ea.profesor_asignatura_id
            WHERE pa.asignatura_id = ? AND pa.activo = TRUE AND p.activo = TRUE
            GROUP BY p.id, pa.id, p.nombre, p.apellido, p.email, p.especialidad, pa.grupo, pa.horario, pa.semestre
            ORDER BY p.apellido, p.nombre, pa.grupo
        `, [id]);

        res.status(200).json({ success: true, data: rows, count: (rows as any[]).length });
    } catch (error: any) {
        console.error('Error al obtener profesores de la asignatura:', error);
        res.status(500).json({ success: false, message: 'Error al obtener profesores de la asignatura', error: error.message });
    }
});

// GET /api/asignaturas/:id/estudiantes/:grupo
router.get('/:id/estudiantes/:grupo', async (req: Request, res: Response) => {
    try {
        const { id, grupo } = req.params;
        const [rows] = await pool.execute(`
            SELECT 
                e.id as estudiante_id,
                CONCAT(e.nombre, ' ', e.apellido) as estudiante,
                e.email,
                e.documento,
                CONCAT(p.nombre, ' ', p.apellido) as profesor,
                ea.nota1,
                ea.nota2,
                ea.nota3,
                ea.nota_final,
                CASE 
                    WHEN ea.nota_final >= 3.0 THEN 'APROBADO'
                    WHEN ea.nota_final < 3.0 AND ea.nota_final IS NOT NULL THEN 'REPROBADO'
                    ELSE 'EN CURSO'
                END as estado
            FROM estudiante_asignatura ea
            JOIN profesor_asignatura pa ON ea.profesor_asignatura_id = pa.id
            JOIN estudiantes e ON ea.estudiante_id = e.id
            JOIN profesores p ON pa.profesor_id = p.id
            WHERE pa.asignatura_id = ? AND pa.grupo = ? AND pa.activo = TRUE AND e.activo = TRUE
            ORDER BY e.apellido, e.nombre
        `, [id, grupo]);

        res.status(200).json({ success: true, data: rows, count: (rows as any[]).length });
    } catch (error: any) {
        console.error('Error al obtener estudiantes de la asignatura:', error);
        res.status(500).json({ success: false, message: 'Error al obtener estudiantes de la asignatura', error: error.message });
    }
});

export default router;
