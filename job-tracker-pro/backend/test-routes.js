// Quick test to verify route structure
const express = require('express');
const cors = require('cors');
const jobRoutes = require('./src/routes/jobRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Test root route
app.get('/', (req, res) => {
  console.log('🏠 Root route accessed');
  res.json({ 
    message: '🚀 Job Tracker API is running smoothly...',
    routes: {
      root: '/',
      jobs: '/api/jobs',
      allJobs: '/api/jobs/all',
      addJob: '/api/jobs/add'
    }
  });
});

// Mount job routes
app.use('/api/jobs', jobRoutes);
console.log('🔧 Job routes mounted under /api/jobs');

// Test 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: ['/api/jobs/all', '/api/jobs/add', '/']
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`🌍 Test: http://localhost:${PORT}/`);
  console.log(`📋 Test: http://localhost:${PORT}/api/jobs/all`);
});
