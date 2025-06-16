import { Router } from 'express';
import { ProfesorAsignaturaController } from '../controllers/profesorAsignaturaController';

const router: Router = Router();

// Rutas completas para profesor-asignatura
router.get('/', ProfesorAsignaturaController.obtenerTodas);                    // GET /api/profesor-asignatura
router.get('/opciones/crear', ProfesorAsignaturaController.obtenerOpcionesCrear); // GET /api/profesor-asignatura/opciones/crear
router.get('/:id', ProfesorAsignaturaController.obtenerPorId);                 // GET /api/profesor-asignatura/:id
router.post('/', ProfesorAsignaturaController.crear);                         // POST /api/profesor-asignatura
router.put('/:id', ProfesorAsignaturaController.actualizar);                  // PUT /api/profesor-asignatura/:id
router.delete('/:id', ProfesorAsignaturaController.eliminar);                 // DELETE /api/profesor-asignatura/:id

export default router;