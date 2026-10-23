const express = require('express');
const router = express.Router();
const { createIssue, getIssues } = require('../controllers/issueController');

router.route('/')
  .post(createIssue)
  .get(getIssues);

module.exports = router;
