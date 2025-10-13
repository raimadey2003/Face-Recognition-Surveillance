// index.js
// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import policeRoutes from './routes/police.js';
// import reportRoutes from './routes/missingReport.js';
// import userRoutes from './routes/user.js';

// dotenv.config();

// const app = express();

import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url'; // <-- add this import
import policeRoutes from './routes/police.js';
import reportRoutes from './routes/missingReport.js';
import userRoutes from './routes/user.js';

dotenv.config();

const app = express();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Middleware
app.use(cors());
app.use(express.json());
// app.use('/uploads', express.static('uploads')); // for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Simple homepage route
app.get('/', (req, res) => {
  res.send('Backend is running ✅');
});

// API Routes
app.use('/api/police', policeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
