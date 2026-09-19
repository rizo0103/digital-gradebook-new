const router = require('express').Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.post('/login', authController.login);
router.post('/register', authMiddleware, roleMiddleware(['admin']), authController.registerUser);

module.exports = router;