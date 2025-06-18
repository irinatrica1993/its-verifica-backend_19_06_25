const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const authRoutes = require('../src/routes/authRoutes');
const userRoutes = require('../src/routes/userRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // In produzione, specificare l'URL del frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Root route
app.get('/api', (req, res) => {
  res.json({ message: 'API ITS Verifica Backend' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Si è verificato un errore interno del server' });
});

// Esporta l'handler per Netlify Functions
module.exports.handler = serverless(app);
