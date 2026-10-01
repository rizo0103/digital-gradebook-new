module.exports = {
    ...require('./admin/usersController'),
    ...require('./admin/groupsController'),
    ...require('./admin/scheduleController'),
    ...require('./admin/attendanceController')
};
