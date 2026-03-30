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

router.patch('/:id', authMiddleware, (req, res, next) => {
  console.log(' PATCH /api/jobs/:id - Updating job status:', req.params.id);
  next();
}, jobController.updateJobStatus);

router.delete('/:id', authMiddleware, (req, res, next) => {
  console.log(' DELETE /api/jobs/:id - Deleting job:', req.params.id);
  next();
}, jobController.deleteJob);

module.exports = router;