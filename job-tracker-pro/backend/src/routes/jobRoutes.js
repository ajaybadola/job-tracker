const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const jobController = require('../controllers/jobController');

console.log('🔧 Job routes module loaded');

// NOTE: jobController.createJob and jobController.getJobs are the main handlers
router.post('/add', authMiddleware, (req, res, next) => {
  console.log(' POST /api/jobs/add - Creating new job');
  next();
}, jobController.createJob); 

router.get('/all', authMiddleware, (req, res, next) => {
  console.log(' GET /api/jobs/all - Fetching all jobs');
  next();
}, jobController.getJobs);

module.exports = router;