const router = require('express').Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Только для администратора
router.use(authMiddleware, roleMiddleware(['admin']));

router.post('/students', adminController.createStudent);
router.get('/students', adminController.getStudents);
router.put('/students/:id', adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);
router.post('/import-students', adminController.importStudents);
router.post('/groups', adminController.createGroup);
router.get('/users', adminController.getUsersByRole);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/groups/:id', adminController.updateGroup);
router.delete('/groups/:id', adminController.deleteGroup);

module.exports = router;