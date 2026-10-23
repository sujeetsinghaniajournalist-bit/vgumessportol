const express = require('express');
const router = express.Router();
const {
  getStats,
  getCombinedRecords,
  updateRecordStatus,
  exportCsv,
  getAuditLogs,
  toggleTwoFactor
} = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.get('/stats', getStats);
router.get('/records', protectAdmin, getCombinedRecords);
router.put('/records/:id/status', protectAdmin, updateRecordStatus);
router.get('/export', protectAdmin, exportCsv);
router.get('/audit-logs', protectAdmin, getAuditLogs);
router.post('/toggle-2fa', toggleTwoFactor);

module.exports = router;
