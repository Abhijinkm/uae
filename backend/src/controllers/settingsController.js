const { Settings, Branch, Batch, Instructor, User, AuditLog } = require('../models');

// @desc    Get academy settings
// @route   GET /api/settings
// @access  Public (or Private)
async function getSettings(req, res) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Update academy settings
// @route   PUT /api/settings
// @access  Private (Admin)
async function updateSettings(req, res) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      settings = await Settings.findByIdAndUpdate(settings._id, req.body, { new: true });
    }
    res.json({ success: true, message: 'Settings updated successfully', data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Branches CRUD
async function getBranches(req, res) {
  try {
    const branches = await Branch.find().sort({ name: 1 });
    res.json({ success: true, data: branches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createBranch(req, res) {
  try {
    const { name, code, address, phone, email } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Branch name and code are required' });
    }
    const branch = await Branch.create({ name, code: code.toUpperCase(), address, phone, email });
    res.status(201).json({ success: true, data: branch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateBranch(req, res) {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    res.json({ success: true, message: 'Branch updated successfully', data: branch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function deleteBranch(req, res) {
  try {
    const count = await Branch.countDocuments();
    if (count <= 1) {
      return res.status(400).json({ success: false, message: 'Cannot delete the only branch. At least one branch must exist.' });
    }
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    res.json({ success: true, message: 'Branch deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Batches CRUD
async function getBatches(req, res) {
  try {
    const batches = await Batch.find().populate('branch', 'name code').sort({ name: 1 });
    res.json({ success: true, data: batches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createBatch(req, res) {
  try {
    const { name, branch, days, startTime, endTime, capacity } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Batch name is required' });
    }

    // Default to first branch if not specified
    let targetBranch = branch;
    if (!targetBranch) {
      const firstBranch = await Branch.findOne();
      targetBranch = firstBranch ? firstBranch._id : null;
    }

    const batch = await Batch.create({
      name,
      branch: targetBranch,
      days: days || ['Mon', 'Wed', 'Fri'],
      startTime: startTime || '06:00 PM',
      endTime: endTime || '07:30 PM',
      capacity: capacity ? Number(capacity) : 30
    });
    const populated = await Batch.findById(batch._id).populate('branch', 'name');
    res.status(201).json({ success: true, message: 'Batch created successfully', data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateBatch(req, res) {
  try {
    const updated = await Batch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    const batch = await Batch.findById(req.params.id).populate('branch', 'name');
    res.json({ success: true, message: 'Batch updated successfully', data: batch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function deleteBatch(req, res) {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Instructors CRUD
async function getInstructors(req, res) {
  try {
    const instructors = await Instructor.find().populate('branch', 'name').sort({ name: 1 });
    res.json({ success: true, data: instructors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createInstructor(req, res) {
  try {
    const { name, email, phone, specialization, branch } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Instructor name is required' });
    }
    const instructor = await Instructor.create({
      name,
      email,
      phone,
      specialization,
      branch: branch || null
    });
    const populated = await Instructor.findById(instructor._id).populate('branch', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateInstructor(req, res) {
  try {
    const updated = await Instructor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }
    const instructor = await Instructor.findById(req.params.id).populate('branch', 'name');
    res.json({ success: true, data: instructor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Audit Logs
async function getAuditLogs(req, res) {
  try {
    const logs = await AuditLog.find().populate('performedBy', 'name email role').sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Staff list
async function getStaffUsers(req, res) {
  try {
    const users = await User.find({ role: { $in: ['admin', 'staff'] } })
      .select('-password')
      .populate('branch', 'name code')
      .sort({ name: 1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  getInstructors,
  createInstructor,
  updateInstructor,
  getAuditLogs,
  getStaffUsers
};
