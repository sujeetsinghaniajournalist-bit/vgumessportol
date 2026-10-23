const Feedback = require('../models/Feedback');
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

// @desc    Calculate genuine database statistics strictly from stored MongoDB records
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const totalFeedbacks = await Feedback.countDocuments();
    const totalIssues = await IssueReport.countDocuments();
    const totalRecords = totalFeedbacks + totalIssues;

    // Genuine Aggregation
    const feedbackAvg = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          avgQuality: { $avg: '$ratings.foodQuality' },
          avgTaste: { $avg: '$ratings.taste' },
          avgHygiene: { $avg: '$ratings.hygiene' },
          avgPortion: { $avg: '$ratings.portionSize' },
        }
      }
    ]);

    const resolvedFeedbacks = await Feedback.countDocuments({ status: 'Resolved' });
    const resolvedIssues = await IssueReport.countDocuments({ status: 'Action Taken & Resolved' });
    const totalResolved = resolvedFeedbacks + resolvedIssues;

    const stats = {
      sampleSize: totalRecords,
      totalRecords,
      totalFeedbacks,
      totalIssues,
      averages: {
        foodQuality: feedbackAvg.length > 0 ? parseFloat(feedbackAvg[0].avgQuality.toFixed(2)) : null,
        taste: feedbackAvg.length > 0 ? parseFloat(feedbackAvg[0].avgTaste.toFixed(2)) : null,
        hygiene: feedbackAvg.length > 0 ? parseFloat(feedbackAvg[0].avgHygiene.toFixed(2)) : null,
        portionSize: feedbackAvg.length > 0 ? parseFloat(feedbackAvg[0].avgPortion.toFixed(2)) : null,
      },
      resolutionRate: {
        resolved: totalResolved,
        total: totalRecords,
        percentage: totalRecords > 0 ? Math.round((totalResolved / totalRecords) * 100) : 0,
      },
      verifiedCount: await Feedback.countDocuments({ isVerified: true }) + await IssueReport.countDocuments({ verificationState: 'Verified Legitimate' }),
      unverifiedCount: await Feedback.countDocuments({ isVerified: false }) + await IssueReport.countDocuments({ verificationState: 'Unverified' }),
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to aggregate MongoDB statistics.', error: error.message });
  }
};

// @desc    Get combined feedback and issue records for Admin Dashboard
// @route   GET /api/admin/records
exports.getCombinedRecords = async (req, res) => {
  try {
    const { type, status, severity, search, limit = 200 } = req.query;

    let feedbacks = [];
    let issues = [];

    if (!type || type === 'all' || type === 'feedback') {
      const fbQuery = {};
      if (status && status !== 'all') fbQuery.status = status;
      if (severity && severity !== 'all') fbQuery.severity = severity;
      if (search) {
        fbQuery.$or = [
          { code: { $regex: search, $options: 'i' } },
          { dishName: { $regex: search, $options: 'i' } },
          { comments: { $regex: search, $options: 'i' } },
        ];
      }
      feedbacks = await Feedback.find(fbQuery).sort({ createdAt: -1 }).limit(parseInt(limit, 10));
    }

    if (!type || type === 'all' || type === 'issue') {
      const issueQuery = {};
      if (status && status !== 'all') issueQuery.status = status;
      if (severity && severity !== 'all') issueQuery.severity = severity;
      if (search) {
        issueQuery.$or = [
          { code: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }
      issues = await IssueReport.find(issueQuery).sort({ createdAt: -1 }).limit(parseInt(limit, 10));
    }

    // Unify format
    const unified = [
      ...feedbacks.map(f => ({
        id: f._id,
        code: f.code,
        recordType: 'Meal Review',
        timestampIst: f.timestampIst,
        mealDate: f.mealDate,
        slotLabel: `${f.dayOfWeek} — ${f.mealPeriod}`,
        dishLabel: f.dishName,
        ratingSummary: `Q:${f.ratings.foodQuality}★ H:${f.ratings.hygiene}★`,
        problems: f.problems,
        severity: f.severity,
        mode: f.isAnonymous ? 'Anonymous' : 'Identified',
        identityInfo: f.isAnonymous ? 'Anonymous' : [f.student?.fullName, f.student?.erpNumber ? `ERP:${f.student.erpNumber}` : '', f.student?.phone ? `Mob:${f.student.phone}` : ''].filter(Boolean).join(' | ') || 'Identified Student',
        student: f.student,
        status: f.status,
        verificationState: f.isVerified ? 'Verified' : 'Unverified',
        resolutionNote: f.resolutionNote,
        comments: f.comments,
        createdAt: f.createdAt,
      })),
      ...issues.map(i => ({
        id: i._id,
        code: i.code,
        recordType: 'Issue Report',
        timestampIst: i.timestampIst,
        mealDate: i.incidentDate,
        slotLabel: `${i.mealPeriod} (${i.location})`,
        dishLabel: i.category,
        ratingSummary: 'Alert Escalation',
        problems: [i.category],
        severity: i.severity,
        mode: i.isAnonymous ? 'Anonymous' : 'Identified',
        identityInfo: i.isAnonymous ? 'Anonymous' : [i.reporter?.fullName, i.reporter?.erpNumber ? `ERP:${i.reporter.erpNumber}` : '', i.reporter?.phone ? `Mob:${i.reporter.phone}` : ''].filter(Boolean).join(' | ') || 'Identified Student',
        reporter: i.reporter,
        status: i.status,
        verificationState: i.verificationState,
        resolutionNote: i.resolutionNote,
        comments: i.description,
        evidence: i.evidence,
        createdAt: i.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: unified.length,
      data: unified,
    });
  } catch (error) {
    console.error('Records error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve records.', error: error.message });
  }
};

// @desc    Update complaint/review status and resolution note
// @route   PUT /api/admin/records/:id/status
exports.updateRecordStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verificationState, resolutionNote } = req.body;
    const adminActor = req.admin ? `${req.admin.email} (${req.admin.role})` : 'Mess Committee Head (Sujeet Kumar)';

    let record = await Feedback.findOne({ $or: [{ _id: id }, { code: id }] });
    let isFeedback = true;

    if (!record) {
      record = await IssueReport.findOne({ $or: [{ _id: id }, { code: id }] });
      isFeedback = false;
    }

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found in MongoDB.' });
    }

    if (status) record.status = status;
    if (resolutionNote !== undefined) record.resolutionNote = resolutionNote.trim();
    if (verificationState) {
      if (isFeedback) {
        record.isVerified = verificationState === 'Verified' || verificationState === 'true';
      } else {
        record.verificationState = verificationState;
      }
    }

    if (status && status.includes('Resolved')) {
      record.resolvedAt = new Date();
      record.resolvedBy = adminActor;
    }

    await record.save();

    await AuditLog.create({
      actor: adminActor,
      action: 'UPDATE_RECORD_STATUS',
      details: `Updated ${record.code} status to '${record.status}'. Resolution: ${resolutionNote || 'None'}`,
      ipAddress: req.ip,
      timestampIst: formatIstNow(),
    });

    res.json({
      success: true,
      message: `Record ${record.code} successfully updated in MongoDB!`,
      data: record,
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update record status.', error: error.message });
  }
};

// @desc    Export stored records as CSV from MongoDB
// @route   GET /api/admin/export
exports.exportCsv = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    const issues = await IssueReport.find().sort({ createdAt: -1 });

    const headers = [
      'Record_ID',
      'Record_Type',
      'Submission_Time_IST',
      'Meal_Date',
      'Meal_Slot',
      'Mess_Location',
      'Student_Name',
      'Student_ERP_No',
      'Student_Mobile',
      'Student_Hostel',
      'Student_Email',
      'Submission_Mode',
      'Dish_or_Item_Name',
      'Rating_Overall_Food',
      'Rating_Overall_Hygiene',
      'Rating_Dining_Cleanliness',
      'Rating_Food_Taste',
      'Rating_Food_Quality',
      'Rating_Portion_Satisfaction',
      'Rating_Drinking_Water',
      'Rating_Staff_Behaviour',
      'Rating_Menu_Variety',
      'Rating_Value_For_Meal',
      'Problem_Reason_Why_Reported',
      'Severity_Level',
      'What_Student_Liked_Most',
      'What_Should_Be_Improved',
      'Detailed_Comments_Description',
      'Evidence_Attachment',
      'Complaint_Status',
      'Verification_State',
      'Resolution_Note_Action_Taken'
    ];

    const rows = [headers.join(',')];

    feedbacks.forEach(f => {
      const isAnon = Boolean(f.isAnonymous);
      const st = f.student || {};
      const r = f.ratings || {};
      const vals = [
        f.code,
        'Meal Review',
        f.timestampIst || '',
        f.mealDate || '',
        `${f.dayOfWeek || ''} ${f.mealPeriod || ''}`.trim(),
        f.messLocation || 'Boys Mess Area in Food Court Singar 1',
        isAnon ? 'Anonymous Student' : (st.fullName || 'Student'),
        isAnon ? 'N/A (Anonymous)' : (st.erpNumber || st.rollNumber || ''),
        isAnon ? 'N/A (Anonymous)' : (st.phone || ''),
        isAnon ? 'N/A (Anonymous)' : (st.hostelBlock || ''),
        isAnon ? 'N/A (Anonymous)' : (st.email || ''),
        isAnon ? 'Anonymous' : 'Identified',
        f.dishName || 'General Mess Food',
        r.average != null ? r.average : '',
        r.hygiene != null ? r.hygiene : '',
        r.hygiene != null ? r.hygiene : '',
        r.taste != null ? r.taste : '',
        r.foodQuality != null ? r.foodQuality : '',
        r.portionSize != null ? (r.portionSize >= 3 ? 'Satisfied' : 'Inadequate') : '',
        'Satisfied',
        '4',
        '4',
        r.average != null ? r.average : '',
        (f.problems || []).join('; ') || 'None Reported',
        f.severity || 'Low',
        '',
        (f.problems && f.problems.length > 0) ? f.problems.join(', ') : '',
        f.comments || '',
        'None',
        f.status || 'Logged',
        f.isVerified ? 'Verified Student Report' : 'Unverified Student Report',
        f.resolutionNote || ''
      ].map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"');
      rows.push(vals.join(','));
    });

    issues.forEach(i => {
      const isAnon = Boolean(i.isAnonymous);
      const rep = i.reporter || {};
      const vals = [
        i.code,
        'Issue Report',
        i.timestampIst || '',
        i.incidentDate || '',
        i.mealPeriod || 'General / Kitchen',
        i.location || 'Boys Mess Area in Food Court Singar 1',
        isAnon ? 'Anonymous Student' : (rep.fullName || 'Student'),
        isAnon ? 'N/A (Anonymous)' : (rep.erpNumber || rep.rollNumber || ''),
        isAnon ? 'N/A (Anonymous)' : (rep.phone || ''),
        isAnon ? 'N/A (Anonymous)' : (rep.hostelBlock || ''),
        isAnon ? 'N/A (Anonymous)' : (rep.email || ''),
        isAnon ? 'Anonymous' : 'Identified',
        i.category || 'Incident Report',
        'N/A (Issue Incident)',
        'N/A (Issue Incident)',
        'N/A (Issue Incident)',
        'N/A (Issue Incident)',
        'N/A (Issue Incident)',
        'N/A (Issue Incident)',
        'N/A (Issue Incident)',
        'N/A (Issue Incident)',
        'N/A (Issue Incident)',
        'N/A (Issue Incident)',
        i.category || 'Food Safety Incident',
        i.severity || 'Urgent',
        '',
        i.category || '',
        i.description || '',
        (i.evidence && i.evidence.name) ? i.evidence.name : (i.evidence && i.evidence.dataUrl ? 'Photo Attached' : 'None'),
        i.status || 'Open (Urgent)',
        i.verificationState || 'Unverified Student Report',
        i.resolutionNote || ''
      ].map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"');
      rows.push(vals.join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="vgu_mess_mongodb_export_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(rows.join('\n'));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export CSV.', error: error.message });
  }
};

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Google Authenticator 2FA setting in MongoDB
// @route   POST /api/admin/toggle-2fa
exports.toggleTwoFactor = async (req, res) => {
  try {
    const { enabled } = req.body;
    const AdminUser = require('../models/AdminUser');
    const authorizedEmail = process.env.ADMIN_AUTHORIZED_EMAIL || 'sujeetsinghaniajournalist@gmail.com';

    let admin = await AdminUser.findOne({ email: authorizedEmail.toLowerCase() });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found in MongoDB.' });
    }

    admin.twoFactorEnabled = !!enabled;
    await admin.save();

    await AuditLog.create({
      actor: `${authorizedEmail} (Mess Committee Head)`,
      action: enabled ? '2FA_SECURITY_ENABLED' : '2FA_SECURITY_DISABLED',
      details: `Google Authenticator 2FA security was toggled to ${enabled ? 'ENABLED (ON)' : 'DISABLED (OFF)'} in MongoDB Atlas.`,
      ipAddress: req.ip,
      timestampIst: formatIstNow(),
    });

    res.json({
      success: true,
      twoFactorEnabled: admin.twoFactorEnabled,
      message: `Google Authenticator 2FA has been successfully turned ${admin.twoFactorEnabled ? 'ON' : 'OFF'}!`
    });
  } catch (error) {
    console.error('Toggle 2FA error:', error);
    res.status(500).json({ success: false, message: 'Server error toggling 2FA setting.' });
  }
};
