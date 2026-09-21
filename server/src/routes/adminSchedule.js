const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const scheduleController = require('../controllers/scheduleController');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Импорт необходимых middleware (аутентификация, проверка прав)
router.use(authMiddleware, roleMiddleware(['admin']));

// POST /api/admin/schedule
router.post(
    '/schedule',
    scheduleController.generateSchedule
);

module.exports = router;