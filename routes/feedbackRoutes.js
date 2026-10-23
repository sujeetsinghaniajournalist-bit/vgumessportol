const express = require('express');
const router = express.Router();
const { createFeedback, getFeedbacks, getFeedbackById } = require('../controllers/feedbackController');

router.route('/')
  .post(createFeedback)
  .get(getFeedbacks);

router.route('/:id')
  .get(getFeedbackById);

module.exports = router;
