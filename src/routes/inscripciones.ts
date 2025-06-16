import { Router } from 'express';
import { InscripcionController } from '../controllers/inscripcionController';

const router: Router = Router();

// Rutas completas para inscripciones
router.get('/', InscripcionController.obtenerTodas);                                    // GET /api/inscripciones
router.get('/por-asignatura/:asignaturaId/:grupo', InscripcionController.obtenerPorAsignaturaYGrupo); // GET /api/inscripciones/por-asignatura/:asignaturaId/:grupo
router.get('/opciones-inscripcion', InscripcionController.obtenerOpcionesInscripcion);  // GET /api/inscripciones/opciones-inscripcion
router.post('/', InscripcionController.crear);                                         // POST /api/inscripciones
router.put('/:id/notas', InscripcionController.actualizarNotas);                       // PUT /api/inscripciones/:id/notas
router.delete('/:id', InscripcionController.eliminar);                                 // DELETE /api/inscripciones/:id

export default router;