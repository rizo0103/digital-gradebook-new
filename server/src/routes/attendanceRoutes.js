const router = require('express').Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const adminController = require('../controllers/adminController');

router.use(authMiddleware);

router.get('/:groupId', attendanceController.getGroupAttendance);
router.post('/', roleMiddleware(['admin', 'teacher']), attendanceController.saveAttendance);
router.get('/get-student-attendance', roleMiddleware(['student']), adminController.getStudentAttendanceStats);

module.exports = router;