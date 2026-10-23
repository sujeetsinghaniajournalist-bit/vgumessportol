const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

const protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vgu_mess_jwt_super_secret_key_2026');

      // Restrict strictly to authorized email
      const authorizedEmail = process.env.ADMIN_AUTHORIZED_EMAIL || 'sujeetsinghaniajournalist@gmail.com';
      if (decoded.email !== authorizedEmail) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Unauthorised administrator account.'
        });
      }

      req.admin = await AdminUser.findById(decoded.id).select('-passwordHash');
      if (!req.admin) {
        return res.status(401).json({ success: false, message: 'Admin user not found in database.' });
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired administrator token.' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Authorization header with Bearer token is required.' });
  }
};

module.exports = { protectAdmin };
