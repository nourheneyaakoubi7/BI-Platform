const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'], 
    default: 'user',
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  photo: {
    type: String,
  },
  birthday: {
    type: Date,
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },
  sex: {
    type: String,
    enum: ['Male', 'Female'],
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);