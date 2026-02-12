import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

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
        await pool.end();
    });
