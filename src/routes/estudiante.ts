import { Router } from 'express';
import { EstudianteController } from '../controllers/estudianteController';

const router: Router = Router();

// Rutas CRUD completas para estudiantes
router.get('/', EstudianteController.obtenerTodos);           // GET /api/estudiantes
router.get('/:id', EstudianteController.obtenerPorId);        // GET /api/estudiantes/:id
router.post('/', EstudianteController.crear);                // POST /api/estudiantes
router.put('/:id', EstudianteController.actualizar);         // PUT /api/estudiantes/:id
router.delete('/:id', EstudianteController.eliminar);        // DELETE /api/estudiantes/:id
router.get('/:id/asignaturas', EstudianteController.obtenerAsignaturas); // GET /api/estudiantes/:id/asignaturas

export default router;