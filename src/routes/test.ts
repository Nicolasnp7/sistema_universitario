import path from 'path';

console.log('Intentando cargar database...');
console.log('Directorio actual:', __dirname);

// Probar diferentes formas de cargar
try {
    console.log('Probando ruta relativa...');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const db1 = require('../config/database');
    console.log('✅ Ruta relativa funcionó');
} catch (error: any) {
    console.log('❌ Ruta relativa falló:', error.message);
}

try {
    console.log('Probando ruta absoluta...');
    const dbPath = path.join(__dirname, '..', 'config', 'database');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const db2 = require(dbPath);
    console.log('✅ Ruta absoluta funcionó');
} catch (error: any) {
    console.log('❌ Ruta absoluta falló:', error.message);
}

try {
    console.log('Probando con .js explícito...');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const db3 = require('../config/database.js');
    console.log('✅ Ruta con .js funcionó');
} catch (error: any) {
    console.log('❌ Ruta con .js falló:', error.message);
}

export {};
