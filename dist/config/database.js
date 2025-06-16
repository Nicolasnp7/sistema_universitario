"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
// Cargar variables de entorno
dotenv_1.default.config();
// Configuración de la base de datos con tipos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sistema_universitario',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
// Crear pool de conexiones tipado
const pool = promise_1.default.createPool(dbConfig);
// Función para probar la conexión con tipos explícitos
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL establecida correctamente');
        connection.release();
    }
    catch (error) {
        console.error('❌ Error conectando a MySQL:', error);
        if (error instanceof Error) {
            console.error('Mensaje de error:', error.message);
        }
        process.exit(1);
    }
};
// Probar conexión al inicializar
testConnection();
// Exportar el pool tipado
exports.default = pool;
//# sourceMappingURL=database.js.map