const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const scheduleController = require('../controllers/scheduleController');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Импорт необходимых middleware (аутентификация, проверка прав)
router.use(authMiddleware, roleMiddleware(['admin']));

router.post('/schedule', scheduleController.generateSchedule);
router.get('/schedules', scheduleController.getSchedules);
router.delete('/schedules/bulk', scheduleController.deleteSchedulesBulk);
router.delete('/schedules/:id', scheduleController.deleteSchedule);

module.exports = router;