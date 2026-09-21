module.exports = {
    admin: {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        name: process.env.ADMIN_NAME || 'Admin User',
        username: process.env.ADMIN_USERNAME || 'admin',
    }
};
