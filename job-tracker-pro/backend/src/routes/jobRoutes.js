const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const jobController = require('../controllers/jobController');

// DHYAN SE DEKH: jobController.createJob aur jobController.getJobs likhna hai
router.post('/add', authMiddleware, jobController.createJob); 
router.get('/all', authMiddleware, jobController.getJobs);

module.exports = router;