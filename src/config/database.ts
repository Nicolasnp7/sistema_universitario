import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Interface para la configuración de la base de datos
interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
}

// Configuración de la base de datos con tipos
const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_universitario',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Crear pool de conexiones tipado
const pool: mysql.Pool = mysql.createPool(dbConfig);

// Función para probar la conexión con tipos explícitos
const testConnection = async (): Promise<void> => {
  try {
    const connection: mysql.PoolConnection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    connection.release();
  } catch (error) {
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
export default pool;