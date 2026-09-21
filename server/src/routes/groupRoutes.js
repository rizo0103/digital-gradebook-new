const router = require('express').Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/', groupController.getGroups);
router.get('/:groupId/students', groupController.getGroupStudents);
router.get('/:groupId/lessons', groupController.getGroupLessons);
router.post('/', roleMiddleware(['admin']), groupController.createGroup);

module.exports = router;