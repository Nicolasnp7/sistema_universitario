import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sistema_universitario',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Crear pool de conexiones
const pool: Pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async (): Promise<void> => {
    try {
        const connection: PoolConnection = await pool.getConnection();
        console.log('✅ Conexión a MySQL establecida correctamente');
        connection.release();
    } catch (error: any) {
        console.error('❌ Error conectando a MySQL:', error.message);
        process.exit(1);
    }
};

// Probar conexión al inicializar
testConnection();

export default pool;
