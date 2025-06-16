"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Importar rutas (las crearemos en los siguientes pasos)
const estudiante_1 = __importDefault(require("./routes/estudiante"));
const profesores_1 = __importDefault(require("./routes/profesores"));
const asignaturas_1 = __importDefault(require("./routes/asignaturas"));
const inscripciones_1 = __importDefault(require("./routes/inscripciones"));
const profesorAsignatura_1 = __importDefault(require("./routes/profesorAsignatura"));
// Cargar variables de entorno
dotenv_1.default.config();
// Crear aplicación Express
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000', 10);
// Middlewares
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// Servir archivos estáticos (HTML, CSS, JS del frontend)
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Rutas de la API REST
app.use('/api/estudiantes', estudiante_1.default);
app.use('/api/profesores', profesores_1.default);
app.use('/api/asignaturas', asignaturas_1.default);
app.use('/api/inscripciones', inscripciones_1.default);
app.use('/api/profesor-asignatura', profesorAsignatura_1.default);
// Rutas para servir páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public', 'index.html'));
});
app.get('/estudiantes', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public', 'estudiantes.html'));
});
app.get('/profesores', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public', 'profesores.html'));
});
app.get('/asignaturas', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public', 'asignaturas.html'));
});
app.get('/inscripciones', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public', 'inscripciones.html'));
});
app.get('/profesor-asignatura', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public', 'profesor-asignatura.html'));
});
// Middleware de manejo de errores con tipos
app.use((err, req, res, next) => {
    console.error('Error del servidor:', err.stack);
    const errorResponse = {
        success: false,
        message: 'Error interno del servidor',
        error: err.message
    };
    res.status(500).json(errorResponse);
});
// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    const notFoundResponse = {
        success: false,
        message: 'Ruta no encontrada'
    };
    res.status(404).json(notFoundResponse);
});
// Iniciar servidor
app.listen(PORT, () => {
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
//# sourceMappingURL=server.js.map