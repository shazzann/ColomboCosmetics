import { Request, Response } from 'express';
import prisma from '../db/client';

import { OrderStatus as PrismaOrderStatus } from '@prisma/client';

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

        // 1. Total Sales (Realized Sales: Not Returned, Not Cancelled, Not Draft)
        const totalSales = await prisma.order.aggregate({
            where: {
                status: {
                    notIn: [PrismaOrderStatus.RETURNED, PrismaOrderStatus.CANCELLED, PrismaOrderStatus.DRAFT]
                },
                ...dateFilter
            },
            _sum: {
                total_selling_price: true
            }
        });

        // 2. Total Profit (Includes losses from returns, excludes drafts)
        const totalProfit = await prisma.order.aggregate({
            where: {
                ...dateFilter,
                status: {
                    not: PrismaOrderStatus.DRAFT
                }
            },
            _sum: {
                net_profit: true
            }
        });

        // 3. Status Counts (Include Drafts?) User might want to see how many drafts.
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
                    in: [PrismaOrderStatus.PENDING, PrismaOrderStatus.DISPATCHED]
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
        }, {}) as Record<PrismaOrderStatus, number>;

        res.json({
            totalSales: Number(totalSales._sum.total_selling_price) || 0,
            totalProfit: Number(totalProfit._sum.net_profit) || 0,
            statusCounts: {
                DRAFT: formattedStatusCounts[PrismaOrderStatus.DRAFT] || 0,
                PENDING: formattedStatusCounts[PrismaOrderStatus.PENDING] || 0,
                DISPATCHED: formattedStatusCounts[PrismaOrderStatus.DISPATCHED] || 0,
                DELIVERED: formattedStatusCounts[PrismaOrderStatus.DELIVERED] || 0,
                RETURNED: formattedStatusCounts[PrismaOrderStatus.RETURNED] || 0,
                CANCELLED: formattedStatusCounts[PrismaOrderStatus.CANCELLED] || 0,
            },
            outstandingRevenue: Number(outstandingRevenue._sum.total_selling_price) || 0
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
};
