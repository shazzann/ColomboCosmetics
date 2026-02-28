const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'f:/WORK/Colombo Cosmetics/backend/.env' });

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

async function test() {
    let user;
    try {
        console.log("Creating test staff user...");
        user = await prisma.user.create({
            data: {
                email: 'test_staff_' + Date.now() + '@example.com',
                name: 'Test Staff',
                password_hash: 'password',
                role: 'STAFF',
                is_approved: true
            }
        });

        console.log("User from DB:", user);
        console.log("Generating token with payload:", { userId: user.id, role: user.role });
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        console.log("Decoded token:", jwt.decode(token));

        console.log("Creating a draft order...");
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            body: JSON.stringify({
                customer_name: "Test Draft Customer",
                status: "DRAFT",
                items: []
            }),
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        const draftId = data.id;
        console.log("Created draft with ID:", draftId, data);

        console.log("Attempting to delete draft...");
        const delRes = await fetch(`http://localhost:3000/api/orders/${draftId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (delRes.ok) {
            console.log("Draft deleted successfully!");
        } else {
            console.log("Delete failed:", delRes.status, await delRes.text());
        }

    } catch (e) {
        console.error("Test error:", e.message);
    } finally {
        if (user) await prisma.user.delete({ where: { id: user.id } });
        await prisma.$disconnect();
    }
}

test();
