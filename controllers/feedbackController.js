const Feedback = require('../models/Feedback');
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

const generateFeedbackCode = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REV-${y}${m}${day}-${rand}`;
};

// @desc    Submit new student meal review
// @route   POST /api/feedback
exports.createFeedback = async (req, res) => {
  try {
    const {
      mealDate,
      dayOfWeek,
      mealPeriod,
      dishName,
      ratings,
      problems,
      severity,
      isAnonymous,
      student,
      comments,
    } = req.body;

    if (!mealDate || !dayOfWeek || !mealPeriod || !dishName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: mealDate, dayOfWeek, mealPeriod, and dishName are mandatory.'
      });
    }

    const r = ratings || {};
    const foodQuality = Number(r.foodQuality) || 4;
    const taste = Number(r.taste) || 4;
    const hygiene = Number(r.hygiene) || 4;
    const portionSize = Number(r.portionSize) || 4;
    const average = parseFloat(((foodQuality + taste + hygiene + portionSize) / 4).toFixed(1));

    const code = generateFeedbackCode();
    const timestampIst = formatIstNow();

    const feedback = new Feedback({
      code,
      recordType: 'Meal Review',
      mealDate,
      dayOfWeek,
      mealPeriod,
      dishName: dishName.trim(),
      ratings: {
        foodQuality,
        taste,
        hygiene,
        portionSize,
        average,
      },
      problems: Array.isArray(problems) ? problems : (problems ? [problems] : []),
      severity: severity || 'None',
      isAnonymous: Boolean(isAnonymous),
      student: isAnonymous ? {} : (student || {}),
      comments: comments ? comments.trim() : '',
      status: 'Logged',
      isVerified: !isAnonymous,
      timestampIst,
    });

    await feedback.save();

    await AuditLog.create({
      actor: isAnonymous ? 'Anonymous Student' : (student?.fullName || 'Student'),
      action: 'FEEDBACK_SUBMITTED',
      details: `Submitted review ${code} for ${dayOfWeek} ${mealPeriod} (${dishName}) - Rating: ${average}★`,
      ipAddress: req.ip,
      timestampIst,
    });

    res.status(201).json({
      success: true,
      message: 'Meal feedback saved to MongoDB successfully!',
      data: feedback,
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ success: false, message: 'Failed to record feedback in MongoDB.', error: error.message });
  }
};

// @desc    Get all feedback records with filtering & search
// @route   GET /api/feedback
exports.getFeedbacks = async (req, res) => {
  try {
    const { mealPeriod, dayOfWeek, status, severity, search, limit = 100 } = req.query;
    const query = {};

    if (mealPeriod) query.mealPeriod = mealPeriod;
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { dishName: { $regex: search, $options: 'i' } },
        { comments: { $regex: search, $options: 'i' } },
      ];
    }

    const feedbacks = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve feedback records.', error: error.message });
  }
};

// @desc    Get single feedback by ID or Code
// @route   GET /api/feedback/:id
exports.getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({
      $or: [{ _id: req.params.id }, { code: req.params.id }]
    });

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback record not found.' });
    }

    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
