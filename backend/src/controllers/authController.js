const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Student } = require('../models');
const { JWT_SECRET } = require('../middleware/authMiddleware');

function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
async function login(req, res) {
  try {
    const { emailOrId, password } = req.body;

    if (!emailOrId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/student ID and password' });
    }

    const trimmedInput = emailOrId.trim();

    // Look for user by email or username
    let user = await User.findOne({
      $or: [
        { email: trimmedInput.toLowerCase() },
        { phone: trimmedInput }
      ]
    });

    // If not found by user email, check if it is a student ID
    if (!user) {
      const student = await Student.findOne({ studentId: trimmedInput.toUpperCase() });
      if (student && student.userId) {
        user = await User.findById(student.userId);
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    let studentProfile = null;
    if (user.role === 'student' && user.studentId) {
      studentProfile = await Student.findById(user.studentId)
        .populate('branch')
        .populate('batch')
        .populate('currentPackage')
        .populate('currentMembership');
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        studentId: user.studentId,
        studentProfile
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
async function getMe(req, res) {
  try {
    let studentProfile = null;
    if (req.user.role === 'student' && req.user.studentId) {
      studentProfile = await Student.findById(req.user.studentId)
        .populate('branch')
        .populate('batch')
        .populate('currentPackage')
        .populate('currentMembership');
    }

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        branch: req.user.branch,
        studentId: req.user.studentId,
        studentProfile
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Create staff/admin user
// @route   POST /api/auth/register-staff
// @access  Private (Admin only)
async function registerStaff(req, res) {
  try {
    const { name, email, password, role, phone, branch } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'staff',
      phone,
      branch: branch || null,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Staff account created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  login,
  getMe,
  registerStaff
};

