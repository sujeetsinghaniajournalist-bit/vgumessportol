const express = require('express');
const router = express.Router();
const {
  login,
  resetPassword,
  forgotPassword,
  verifyResetToken,
  resetPasswordWithToken,
  getMe,
  getTwoFactorInfo,
  sendEmailOtp,
  verifyTwoFactorTest,
} = require('../controllers/authController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/reset-password', resetPassword);
router.post('/send-otp', sendEmailOtp);
router.post('/forgot-password', forgotPassword);
router.get('/verify-reset-token', verifyResetToken);
router.post('/reset-password-with-token', resetPasswordWithToken);
router.get('/2fa-info', getTwoFactorInfo);
router.post('/verify-2fa', verifyTwoFactorTest);
router.get('/me', protectAdmin, getMe);

module.exports = router;
