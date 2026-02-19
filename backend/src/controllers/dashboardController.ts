import { Request, Response } from 'express';
import prisma from '../db/client';

const OrderStatus = {
    PENDING: 'PENDING',
    DISPATCHED: 'DISPATCHED',
    DELIVERED: 'DELIVERED',
    RETURNED: 'RETURNED',
    CANCELLED: 'CANCELLED'
} as const;

type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter: any = {};
        if (startDate && endDate) {
            dateFilter.created_at = {
                gte: new Date(String(startDate) + 'T00:00:00.000Z'),
                lte: new Date(String(endDate) + 'T23:59:59.999Z')
            };
        } else if (startDate) {
            dateFilter.created_at = {
                gte: new Date(String(startDate) + 'T00:00:00.000Z')
            };
        }

        // 1. Total Sales (Realized Sales: Not Returned, Not Cancelled)
        const totalSales = await prisma.order.aggregate({
            where: {
                status: {
                    notIn: [OrderStatus.RETURNED, OrderStatus.CANCELLED]
                },
                ...dateFilter
            },
            _sum: {
                total_selling_price: true
            }
        });

        // 2. Total Profit (Includes losses from returns)
        const totalProfit = await prisma.order.aggregate({
            where: dateFilter,
            _sum: {
                net_profit: true
            }
        });

        // 3. Status Counts
        const statusCounts = await prisma.order.groupBy({
            by: ['status'],
            where: dateFilter,
            _count: {
                id: true
            }
        });

        // 4. Outstanding Revenue (Pending + Dispatched) -> Cash to be collected
        const outstandingRevenue = await prisma.order.aggregate({
            where: {
                status: {
                    in: [OrderStatus.PENDING, OrderStatus.DISPATCHED]
                },
                ...dateFilter
            },
            _sum: {
                total_selling_price: true
            }
        });

        // Format status counts
        const formattedStatusCounts = statusCounts.reduce((acc: any, curr: any) => {
            acc[curr.status] = curr._count.id;
            return acc;
        }, {}) as Record<OrderStatus, number>;

        res.json({
            totalSales: Number(totalSales._sum.total_selling_price) || 0,
            totalProfit: Number(totalProfit._sum.net_profit) || 0,
            statusCounts: {
                PENDING: formattedStatusCounts[OrderStatus.PENDING] || 0,
                DISPATCHED: formattedStatusCounts[OrderStatus.DISPATCHED] || 0,
                DELIVERED: formattedStatusCounts[OrderStatus.DELIVERED] || 0,
                RETURNED: formattedStatusCounts[OrderStatus.RETURNED] || 0,
                CANCELLED: formattedStatusCounts[OrderStatus.CANCELLED] || 0,
            },
            outstandingRevenue: Number(outstandingRevenue._sum.total_selling_price) || 0
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
};
