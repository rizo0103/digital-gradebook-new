const router = require('express').Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Только для администратора
router.use(authMiddleware, roleMiddleware(['admin']));

router.post('/import-students', adminController.importStudents);
router.post('/groups', adminController.createGroup);
router.post('/schedule', adminController.createSchedule);
router.get('/users', adminController.getUsersByRole);

module.exports = router;