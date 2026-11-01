const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isDbConnected } = require('../config/db');

const stateNames = {
  0: 'Disconnected',
  1: 'Connected',
  2: 'Connecting',
  3: 'Disconnecting',
};

router.get('/', (req, res) => {
  const dbReadyState = mongoose.connection.readyState;
  const dbStatus = stateNames[dbReadyState] || 'Unknown';
  const healthy = isDbConnected();

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      type: 'MongoDB',
      connected: healthy,
      status: dbStatus,
      databaseName: mongoose.connection.name || 'none',
      host: mongoose.connection.host || 'none',
    },
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

module.exports = router;
