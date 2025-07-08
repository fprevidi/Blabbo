const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  avatar: {
    type: String,
    default: null,
  },
  about: {
    type: String,
    default: 'Hey there! I am using Blabbo.',
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  socketId: {
    type: String,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    code: String,
    expiresAt: Date,
  },
}, {
  timestamps: true,
});

// Index for better query performance
userSchema.index({ phoneNumber: 1 });
userSchema.index({ isOnline: 1 });

module.exports = mongoose.model('User', userSchema);