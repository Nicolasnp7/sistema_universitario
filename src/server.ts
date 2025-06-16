import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import dotenv from 'dotenv';

// Importar rutas (las crearemos en los siguientes pasos)
import estudiantesRoutes from './routes/estudiante';
import profesoresRoutes from './routes/profesores';
import asignaturasRoutes from './routes/asignaturas';
import inscripcionesRoutes from './routes/inscripciones';
import profesorAsignaturaRoutes from './routes/profesorAsignatura';

// Importar tipos
import { ApiResponse } from './types/api';

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app: express.Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos (HTML, CSS, JS del frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Rutas de la API REST
app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/profesores', profesoresRoutes);
app.use('/api/asignaturas', asignaturasRoutes);
app.use('/api/inscripciones', inscripcionesRoutes);
app.use('/api/profesor-asignatura', profesorAsignaturaRoutes);

// Rutas para servir páginas HTML
app.get('/', (req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.get('/estudiantes', (req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, '../public', 'estudiantes.html'));
});

app.get('/profesores', (req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, '../public', 'profesores.html'));
});

app.get('/asignaturas', (req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, '../public', 'asignaturas.html'));
});

app.get('/inscripciones', (req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, '../public', 'inscripciones.html'));
});

app.get('/profesor-asignatura', (req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, '../public', 'profesor-asignatura.html'));
});

// Middleware de manejo de errores con tipos
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error del servidor:', err.stack);
  
  const errorResponse: ApiResponse = {
    success: false,
    message: 'Error interno del servidor',
    error: err.message
  };
  
  res.status(500).json(errorResponse);
});

// Manejo de rutas no encontradas
app.use('*', (req: Request, res: Response): void => {
  const notFoundResponse: ApiResponse = {
    success: false,
    message: 'Ruta no encontrada'
  };
  
  res.status(404).json(notFoundResponse);
});

// Iniciar servidor
app.listen(PORT, (): void => {
  console.log(`🚀 Servidor TypeScript corriendo en http://localhost:${PORT}`);
  console.log(`📚 APIs disponibles:`);
  console.log(`   - Estudiantes: http://localhost:${PORT}/api/estudiantes`);
  console.log(`   - Profesores: http://localhost:${PORT}/api/profesores`);
  console.log(`   - Asignaturas: http://localhost:${PORT}/api/asignaturas`);
  console.log(`   - Inscripciones: http://localhost:${PORT}/api/inscripciones`);
  console.log(`   - Profesor-Asignatura: http://localhost:${PORT}/api/profesor-asignatura`);
  console.log(`📱 Páginas web:`);
  console.log(`   - Dashboard: http://localhost:${PORT}`);
  console.log(`   - Estudiantes: http://localhost:${PORT}/estudiantes`);
  console.log(`   - Profesores: http://localhost:${PORT}/profesores`);
  console.log(`   - Asignaturas: http://localhost:${PORT}/asignaturas`);
  console.log(`   - Inscripciones: http://localhost:${PORT}/inscripciones`);
  console.log(`   - Profesor-Asignatura: http://localhost:${PORT}/profesor-asignatura`);
});