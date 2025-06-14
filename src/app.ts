import * as dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import { db } from './db';

// ✅ Importa correctamente las rutas
import asignaturasRouter from './routes/asignaturas';

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

// ✅ Monta las rutas
app.use('/api/asignaturas', asignaturasRouter);

app.get('/', (req: Request, res: Response) => {
    res.type('text/plain');
    res.status(200).send('Welcome!');
});

db.connect((err) => {
    if (err) {
        console.log('Database connection error');
    } else {
        console.log('Database Connected');
    }
});

app.use((req: Request, res: Response) => {
    res.status(404).send({ error: 'Not Found', message: 'URL not found' });
});

app.listen(process.env.PORT, () => {
    console.log('Node server started running');
    console.log(`Go to http://${process.env.HOST}:${process.env.PORT}`);
});
