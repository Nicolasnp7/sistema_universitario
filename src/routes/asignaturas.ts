import { Router } from 'express';
import { AsignaturaController } from '../controllers/asignaturaController';

const router: Router = Router();

// Rutas CRUD completas para asignaturas
router.get('/', AsignaturaController.obtenerTodas);           // GET /api/asignaturas
router.get('/:id', AsignaturaController.obtenerPorId);        // GET /api/asignaturas/:id
router.post('/', AsignaturaController.crear);                // POST /api/asignaturas
router.put('/:id', AsignaturaController.actualizar);         // PUT /api/asignaturas/:id
router.delete('/:id', AsignaturaController.eliminar);        // DELETE /api/asignaturas/:id
router.get('/:id/profesores', AsignaturaController.obtenerProfesores); // GET /api/asignaturas/:id/profesores

export default router;