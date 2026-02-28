import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import reportRoutes from './routes/reportRoutes';
import prisma from './db/client';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Colombo Cosmetics API' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Force nodemon restart for new permissions
app.get("/db-check", async (req, res) => {
  try {
    await prisma.user.findFirst();
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});