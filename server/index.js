import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

import './config/db.js'; // Initialize DB

import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';
import exportRoutes from './routes/export.js';
import headerRoutes from './routes/headers.js';
import supabase from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving via Supabase Proxy
app.get('/uploads/:filename', async (req, res) => {
  try {
    const { data, error } = await supabase.storage.from('uploads').download(req.params.filename);
    if (error || !data) return res.status(404).send('File not found in cloud storage');
    
    const buffer = Buffer.from(await data.arrayBuffer());
    res.set('Content-Type', data.type);
    res.send(buffer);
  } catch (err) {
    res.status(500).send('Storage proxy error');
  }
});
app.use('/templates', express.static(path.join(__dirname, 'templates')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/headers', headerRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Literary Club Report Server running on http://localhost:${PORT}`);
  console.log(`📁 API: http://localhost:${PORT}/api`);
  console.log(`🔑 Admin accounts: admin/admin123, anupama/anupama123, LCConvener/convener123\n`);
});

export default app;
