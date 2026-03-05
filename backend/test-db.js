const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orders = await prisma.order.findMany({
        orderBy: { created_at: 'desc' },
        take: 5,
        select: { id: true, created_at: true, customer_name: true }
    });
    console.log(orders);
}

main().catch(console.error).finally(() => prisma.$disconnect());
