const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orders = await prisma.order.findMany({
        where: { status: { in: ['DISPATCHED', 'DELIVERED'] } },
        select: { id: true, status: true, created_at: true, status_updated_at: true },
        take: 10
    });
    console.log(JSON.stringify(orders, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
