const express = require('express');

const router = express.Router();
const jobAuth = require('../controllers/jobs');
const isAuth = require('../middleware/isauth');


router.post('/createJob',isAuth,jobAuth.createJob);
router.get('/jobs',isAuth,jobAuth.getAllJob);
router.get('/stats',isAuth,jobAuth.getstats);
router.patch('/jobs/:jobId',isAuth,jobAuth.updateJob);
router.delete('/jobs/:jobId',isAuth,jobAuth.deleteJob);
router.get('/apply_for_jobs',isAuth,jobAuth.applyJob);
router.post('/add_apply_for_jobs',isAuth,jobAuth.addApplyJob);
router.get('/applications',isAuth,jobAuth.getApplications);
router.get('/appliedApplications',isAuth,jobAuth.getUserJobApplications)
router.post('/applicationRequest',isAuth,jobAuth.updateApplicationRequest);

module.exports = router;


