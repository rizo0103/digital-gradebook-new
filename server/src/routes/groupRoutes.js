const router = require('express').Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/', groupController.getGroups);
router.post('/', roleMiddleware(['admin']), groupController.createGroup);

module.exports = router;