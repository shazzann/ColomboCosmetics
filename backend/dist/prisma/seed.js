"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const adminEmail = 'admin@colombo.com';
    const plainPassword = 'admin123';
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });
    if (existingAdmin) {
        console.log('Admin user already exists.');
        return;
    }
    const hashedPassword = await bcryptjs_1.default.hash(plainPassword, 10);
    const user = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: adminEmail,
            password_hash: hashedPassword,
            role: 'ADMIN',
        },
    });
    console.log(`Created admin user with email: ${user.email}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
