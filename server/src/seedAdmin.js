require('dotenv').config();
const { db } = require("./config/firebase");
const bcrypt = require("bcryptjs");
const { admin } = require("./config/resources");

const createFirstAdmin = async () => {
    const adminEmail = admin.email, 
        adminPassword = admin.password,
        adminName = admin.name,
        username = admin.username;

    try {
        const existingUser = await db.collection("users").where("email", "==", adminEmail).get();

        if (!existingUser.empty) {
            console.log("Пользователь с email " + adminEmail + " уже существует.");
            process.exit(0);
        }

        const passwordHash = await bcrypt.hash(adminPassword, 10);

        const newAdminRef = await db.collection('users').add({
            email: adminEmail,
            passwordHash: passwordHash,
            fullName: adminName,
            username: username,
            role: 'admin',
            createdAt: new Date().toISOString(),
        });

        console.log("--------------------------------------------");
        console.log(" Администратор успешно создан!");
        console.log(` ID: ${newAdminRef.id}`);
        console.log(` Email: ${adminEmail}`);
        console.log(` Имя: ${adminName}`);
        console.log(` Роль: admin`);
        console.log("--------------------------------------------");

        process.exit(0);
    } catch (error) {
        console.error("Ошибка при проверке существующего администратора:", error);
        process.exit(1);
    }
};

createFirstAdmin();
