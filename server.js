require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const { connectDB } = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 8000;

// Connect to MongoDB
connectDB();

// Security HTTP headers with CSP configured for external CDN assets
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Enable CORS for external API clients, mobile apps, or Postman
app.use(cors());

// HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend dashboard
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);

// Fallback to index.html for client-side navigation (non-API routes)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 Handler for undefined API routes
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorHandler);

// Start HTTP Server
const server = app.listen(PORT, () => {
  console.log(`
======================================================================
  InventoryHub Web Server Running
  Local URL:        http://localhost:${PORT}
  API Base URL:     http://localhost:${PORT}/api/products
  Health Check:     http://localhost:${PORT}/api/health
  Environment:      ${process.env.NODE_ENV || 'development'}
======================================================================
  `);
});

// Graceful shutdown handling
const handleGracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
    }
    process.exit(0);
  });
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

module.exports = app;
