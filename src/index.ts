import express from 'express';
import dotenv from 'dotenv';
import errHandlingMiddleware from './middlewares/error.middleware';
import cors from 'cors';
import AppRouter from './routes/app';
import RestaurantRouter from './routes/producer';
import adminRouter from './routes/admin';

const WEBAPP_URL = process.env.WEBAPP_URL;
const TEMP_WEBAPP_URL = process.env.TEMP_WEBAPP_URL;
const PROD_WEBAPP_URL = process.env.PROD_WEBAPP_URL;
dotenv.config();

const PORT = process.env.PORT || 6543;
const app = express();
app.get('/', (req, res) => res.status(200).send('OK'));
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/healthcheck', (req, res) => res.status(200).send('OK'));

app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/app', AppRouter);
app.use('/api/restaurant', RestaurantRouter);
app.use('/api/admin', adminRouter);
app.use(errHandlingMiddleware);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});
