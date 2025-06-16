import { Router } from 'express';
import { ProfesorController } from '../controllers/profesorController';

const router: Router = Router();

// Rutas CRUD completas para profesores
router.get('/', ProfesorController.obtenerTodos);           // GET /api/profesores
router.get('/:id', ProfesorController.obtenerPorId);        // GET /api/profesores/:id
router.post('/', ProfesorController.crear);                // POST /api/profesores
router.put('/:id', ProfesorController.actualizar);         // PUT /api/profesores/:id
router.delete('/:id', ProfesorController.eliminar);        // DELETE /api/profesores/:id
router.get('/:id/asignaturas', ProfesorController.obtenerAsignaturas); // GET /api/profesores/:id/asignaturas

export default router;