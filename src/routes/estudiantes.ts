import { Router, Request, Response } from 'express';
import db from '../config/database';
import { ResultSetHeader } from 'mysql2';

const router = Router();

// GET /api/estudiantes/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const [rows] = await db.execute('SELECT * FROM estudiantes WHERE id = ? AND activo = TRUE', [id]);
        const estudiantes = rows as any[];

        if (estudiantes.length === 0) {
            res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
            return;
        }

        res.status(200).json({ success: true, data: estudiantes[0] });
    } catch (error: any) {
        console.error('Error al obtener estudiante:', error);
        res.status(500).json({ success: false, message: 'Error al obtener estudiante', error: error.message });
    }
});

// POST /api/estudiantes
router.post('/', async (req: Request, res: Response): Promise<void> => {
    const { nombre, apellido, email, telefono, fecha_nacimiento, documento } = req.body;

    if (!nombre || !apellido || !email || !documento) {
        res.status(400).json({ success: false, message: 'Los campos nombre, apellido, email y documento son obligatorios' });
        return;
    }

    try {
        const [result] = await db.execute<ResultSetHeader>(
            'INSERT INTO estudiantes (nombre, apellido, email, telefono, fecha_nacimiento, documento) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, apellido, email, telefono, fecha_nacimiento, documento]
        );

        res.status(201).json({
            success: true,
            message: 'Estudiante creado exitosamente',
            data: {
                id: result.insertId,
                nombre,
                apellido,
                email,
                telefono,
                fecha_nacimiento,
                documento
            }
        });
    } catch (error: any) {
        console.error('Error al crear estudiante:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ success: false, message: 'El email o documento ya existe' });
            return;
        }
        res.status(500).json({ success: false, message: 'Error al crear estudiante', error: error.message });
    }
});

// PUT /api/estudiantes/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { nombre, apellido, email, telefono, fecha_nacimiento, documento } = req.body;

    try {
        const [existing] = await db.execute('SELECT id FROM estudiantes WHERE id = ? AND activo = TRUE', [id]);
        if ((existing as any[]).length === 0) {
            res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
            return;
        }

        await db.execute(
            'UPDATE estudiantes SET nombre = ?, apellido = ?, email = ?, telefono = ?, fecha_nacimiento = ?, documento = ? WHERE id = ?',
            [nombre, apellido, email, telefono, fecha_nacimiento, documento, id]
        );

        res.status(200).json({ success: true, message: 'Estudiante actualizado exitosamente' });
    } catch (error: any) {
        console.error('Error al actualizar estudiante:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ success: false, message: 'El email o documento ya existe' });
            return;
        }
        res.status(500).json({ success: false, message: 'Error al actualizar estudiante', error: error.message });
    }
});

// DELETE /api/estudiantes/:id (Soft delete)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const [existing] = await db.execute('SELECT id FROM estudiantes WHERE id = ? AND activo = TRUE', [id]);
        if ((existing as any[]).length === 0) {
            res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
            return;
        }

        await db.execute('UPDATE estudiantes SET activo = FALSE WHERE id = ?', [id]);

        res.status(200).json({ success: true, message: 'Estudiante eliminado exitosamente' });
    } catch (error: any) {
        console.error('Error al eliminar estudiante:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar estudiante', error: error.message });
    }
});
export default router;

