const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  toggleStudentStatus,
  deleteStudent
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getStudents);
router.post('/', protect, createStudent);
router.get('/:id', protect, getStudentById);
router.put('/:id', protect, updateStudent);
router.patch('/:id/status', protect, toggleStudentStatus);
router.delete('/:id', protect, authorize('admin'), deleteStudent);

module.exports = router;

