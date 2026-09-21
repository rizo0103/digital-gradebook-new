module.exports = {
    admin: {
        email: process.env.ADMIN_EMAIL || 'test@example.com',
        password: process.env.ADMIN_PASSWORD || 'password',
        name: process.env.ADMIN_NAME || 'Admin User',
        username: process.env.ADMIN_USERNAME || 'admin',
    }
}
