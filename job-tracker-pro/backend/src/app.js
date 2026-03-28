const express = require('express');
const cors = require('cors');
const jobRoutes = require('./routes/jobRoutes');
require('dotenv').config();

const app = express();

// ─── CORS Settings ──────────────────
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? '*' : 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));          
app.options('*', cors(corsOptions)); 
console.log('🔧 CORS initialized');

app.use(express.json());
console.log('🔧 JSON middleware initialized');

app.get('/', (req, res) => {
  console.log('🏠 Root route accessed');
  res.send('🚀 Job Tracker API is running smoothly...');
});

app.use('/api/jobs', jobRoutes);
console.log('🔧 Job routes mounted under /api/jobs');

app.use((err, req, res, next) => {
  console.error('❌ Error middleware:', err.stack);
  res.status(500).json({ error: 'Something broke inside the server!' });
});

// Add a 404 handler for debugging
app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: ['/api/jobs/all', '/api/jobs/add', '/']
  });
});

// ─── Robust Server Startup ──────────────────
const startServer = async (preferredPort) => {
  const net = require('net');
  
  const checkPortAvailable = (port) => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      server.on('error', () => resolve(false));
    });
  };

  const findAvailablePort = async (startPort) => {
    let port = startPort;
    while (port < startPort + 10) { // Try up to 10 ports
      if (await checkPortAvailable(port)) {
        return port;
      }
      port++;
    }
    return null; // No available port found
  };

  try {
    const PORT = process.env.PORT || preferredPort;
    let finalPort = PORT;

    // Check if preferred port is available
    if (!(await checkPortAvailable(PORT))) {
      console.log(`⚠️  Port ${PORT} is busy. Finding next available port...`);
      finalPort = await findAvailablePort(parseInt(PORT) + 1);
      
      if (!finalPort) {
        console.error('❌ No available ports found. Please close some applications.');
        process.exit(1);
      }
    }

    // Start the server
    const server = app.listen(finalPort, '0.0.0.0', () => {
      console.log(`🚀 Server running successfully on port ${finalPort}`);
      console.log(`🌍 API endpoints available at: http://localhost:${finalPort}`);
      console.log(`🔗 Frontend should use: http://localhost:${finalPort}`);
      
      // Update environment variable for other parts of the app
      process.env.PORT = finalPort.toString();
    });

    // Handle server errors gracefully
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${finalPort} is still in use. Trying another port...`);
        startServer(finalPort + 1); // Recursive call with next port
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 SIGINT received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
    });

    return server;

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer(5000);