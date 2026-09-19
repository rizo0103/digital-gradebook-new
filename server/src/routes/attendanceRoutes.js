const router = require('express').Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/:groupId', attendanceController.getGroupAttendance);
router.post('/', roleMiddleware(['admin', 'teacher']), attendanceController.saveAttendance);

module.exports = router;