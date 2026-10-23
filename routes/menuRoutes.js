const express = require('express');
const router = express.Router();
const { getMenu, updateMenu, togglePublish } = require('../controllers/menuController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.route('/')
  .get(getMenu)
  .put(protectAdmin, updateMenu);

router.post('/publish', protectAdmin, togglePublish);

module.exports = router;
