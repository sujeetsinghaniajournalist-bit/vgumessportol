const WeeklyMenu = require('../models/WeeklyMenu');
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

// @desc    Get live weekly menu from MongoDB
// @route   GET /api/menu
exports.getMenu = async (req, res) => {
  try {
    let menuDoc = await WeeklyMenu.findOne().sort({ updatedAt: -1 });

    if (!menuDoc) {
      return res.status(404).json({
        success: false,
        message: 'No weekly menu found in MongoDB. Please run seed script: npm run seed'
      });
    }

    res.json({
      success: true,
      menuPublished: menuDoc.menuPublished,
      weekLabel: menuDoc.weekLabel,
      lastUpdatedIst: menuDoc.lastUpdatedIst,
      updatedBy: menuDoc.updatedBy,
      schedule: menuDoc.schedule,
    });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve weekly menu.', error: error.message });
  }
};

// @desc    Update weekly 28-meal schedule (Admin only)
// @route   PUT /api/menu
exports.updateMenu = async (req, res) => {
  try {
    const { schedule, weekLabel } = req.body;

    if (!schedule) {
      return res.status(400).json({ success: false, message: 'Menu schedule data is required.' });
    }

    let menuDoc = await WeeklyMenu.findOne().sort({ updatedAt: -1 });
    const timestampIst = formatIstNow();
    const adminActor = req.admin ? `${req.admin.email} (${req.admin.role})` : 'Mess Committee Head (Sujeet Kumar)';

    if (!menuDoc) {
      menuDoc = new WeeklyMenu({
        weekLabel: weekLabel || 'Official Mess Menu — Vivekananda Global University, Jaipur',
        menuPublished: true,
        schedule,
        updatedBy: adminActor,
        lastUpdatedIst: timestampIst,
      });
    } else {
      menuDoc.schedule = schedule;
      if (weekLabel) menuDoc.weekLabel = weekLabel;
      menuDoc.updatedBy = adminActor;
      menuDoc.lastUpdatedIst = timestampIst;
      menuDoc.updatedAt = new Date();
    }

    await menuDoc.save();

    await AuditLog.create({
      actor: adminActor,
      action: 'UPDATE_WEEKLY_MENU',
      details: `Updated 28-slot weekly menu schedule for ${menuDoc.weekLabel}`,
      ipAddress: req.ip,
      timestampIst,
    });

    res.json({
      success: true,
      message: 'Weekly mess menu updated successfully in MongoDB!',
      data: menuDoc,
    });
  } catch (error) {
    console.error('Update menu error:', error);
    res.status(500).json({ success: false, message: 'Failed to update weekly menu.', error: error.message });
  }
};

// @desc    Toggle menu publication state (Admin only)
// @route   POST /api/menu/publish
exports.togglePublish = async (req, res) => {
  try {
    let menuDoc = await WeeklyMenu.findOne().sort({ updatedAt: -1 });

    if (!menuDoc) {
      return res.status(404).json({ success: false, message: 'No menu found to publish/unpublish.' });
    }

    menuDoc.menuPublished = !menuDoc.menuPublished;
    menuDoc.lastUpdatedIst = formatIstNow();
    menuDoc.updatedAt = new Date();
    await menuDoc.save();

    const actionText = menuDoc.menuPublished ? 'Published weekly menu' : 'Unpublished weekly menu';
    const adminActor = req.admin ? `${req.admin.email} (${req.admin.role})` : 'Mess Committee Head';

    await AuditLog.create({
      actor: adminActor,
      action: menuDoc.menuPublished ? 'PUBLISH_MENU' : 'UNPUBLISH_MENU',
      details: `${actionText} for VGU student portal in MongoDB`,
      ipAddress: req.ip,
      timestampIst: formatIstNow(),
    });

    res.json({
      success: true,
      menuPublished: menuDoc.menuPublished,
      message: `Menu is now ${menuDoc.menuPublished ? 'PUBLISHED' : 'UNPUBLISHED'}.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
