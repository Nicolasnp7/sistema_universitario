import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Importar rutas
import estudiantesRoutes from './routes/estudiantes';
import profesoresRoutes from './routes/profesores';
import asignaturasRoutes from './routes/asignaturas';
import inscripcionesRoutes from './routes/inscripciones';
import profesorAsignaturaRoutes from './routes/profesorAsignatura';

// Rutas de la API
app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/profesores', profesoresRoutes);
app.use('/api/asignaturas', asignaturasRoutes);
app.use('/api/inscripciones', inscripcionesRoutes);
app.use('/api/profesor-asignatura', profesorAsignaturaRoutes);

// Rutas para las páginas HTML
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/estudiantes', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', 'estudiantes.html'));
});

app.get('/profesores', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', 'profesores.html'));
});

app.get('/asignaturas', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', 'asignaturas.html'));
});

app.get('/inscripciones', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', 'inscripciones.html'));
});

app.get('/profesor-asignatura', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', 'profesor-asignatura.html'));
});

// Manejo de errores
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: err.message
    });
});

// Ruta no encontrada
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
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
