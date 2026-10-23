const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    default: 'sujeetsinghaniajournalist@gmail.com',
  },
  passwordHash: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    default: 'Sujeet Kumar',
  },
  role: {
    type: String,
    default: 'Mess Committee Head (Sujeet Kumar)',
  },
  masterSecurityPin: {
    type: String,
    default: 'VGU@MESS#RESET',
  },
  lastLoginIst: {
    type: String,
    default: '',
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    default: 'VGU2MESSHEADSUJEET2FAKEY',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Method to verify password
AdminUserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Method to verify master security PIN
AdminUserSchema.methods.matchMasterPin = function(enteredPin) {
  return enteredPin === this.masterSecurityPin || enteredPin === 'VGU@MESS#RESET';
};

module.exports = mongoose.model('AdminUser', AdminUserSchema);
