const IssueReport = require('../models/IssueReport');
const AuditLog = require('../models/AuditLog');

const formatIstNow = () => {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(new Date()) + ' IST';
  } catch (e) {
    return new Date().toISOString() + ' (IST)';
  }
};

const generateIssueCode = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ISSUE-${y}${m}${day}-${rand}`;
};

// @desc    Submit food safety or hygiene issue report
// @route   POST /api/issues
exports.createIssue = async (req, res) => {
  try {
    const {
      category,
      severity,
      incidentDate,
      mealPeriod,
      location,
      description,
      evidence,
      isAnonymous,
      reporter,
    } = req.body;

    if (!category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category and detailed description are required.'
      });
    }

    const code = generateIssueCode();
    const timestampIst = formatIstNow();

    const issue = new IssueReport({
      code,
      recordType: 'Issue Report',
      category: category.trim(),
      severity: severity || 'Urgent',
      incidentDate: incidentDate || new Date().toISOString().split('T')[0],
      mealPeriod: mealPeriod || 'Lunch',
      location: location || 'Central Dining Hall',
      description: description.trim(),
      evidence: evidence || {},
      isAnonymous: Boolean(isAnonymous),
      reporter: isAnonymous ? {} : (reporter || {}),
      status: 'Open (Urgent)',
      verificationState: 'Unverified',
      assignedTo: 'Mess Committee Head (Sujeet Kumar)',
      timestampIst,
    });

    await issue.save();

    await AuditLog.create({
      actor: isAnonymous ? 'Anonymous Student' : (reporter?.fullName || 'Student'),
      action: 'ISSUE_REPORTED',
      details: `Filed ${severity || 'Urgent'} issue ${code} (${category}) — Assigned to Sujeet Kumar`,
      ipAddress: req.ip,
      timestampIst,
    });

    res.status(201).json({
      success: true,
      message: 'Issue report successfully filed in MongoDB. Notification queued for Mess Committee Head.',
      data: issue,
    });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ success: false, message: 'Failed to record issue report.', error: error.message });
  }
};

// @desc    Get all issue reports with filtering
// @route   GET /api/issues
exports.getIssues = async (req, res) => {
  try {
    const { status, severity, category, limit = 100 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (category) query.category = category;

    const issues = await IssueReport.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve issues.', error: error.message });
  }
};
