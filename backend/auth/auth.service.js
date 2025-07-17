const bcrypt = require('bcryptjs');
const User = require('./auth.model');
const { generateToken } = require('../config/jwt');

// Signup
async function signup(email, username, password) {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error('Email already exists');

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ email, username, password: hashedPassword, role: 'user' }); // Default role is set here

  await newUser.save();
  return newUser;
}

// Login
async function login(email, password) {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');
  user.lastLogin = Date.now();
  await user.save();

  const token = generateToken(user._id);
  return { token, user };
}

module.exports = { signup, login };