const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const authRoutes = require('../src/routes/authRoutes');
const userRoutes = require('../src/routes/userRoutes');

const app = express();

// Middleware
app.use(express.json());

// Middleware CORS personalizzato per Netlify Functions
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://its-verifica-auth-system.windsurf.build');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Gestione delle richieste preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

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
