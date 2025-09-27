import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

app.use(express.json());

app.use(cors());

app.use(routes);

// app.get('/ping', (_req, res) => {
//   res.status(200).json({ message: 'pong' });
// });

export default app;
