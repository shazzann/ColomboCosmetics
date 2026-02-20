"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const client_1 = __importDefault(require("../db/client"));
const OrderStatus = {
    DRAFT: 'DRAFT',
    PENDING: 'PENDING',
    DISPATCHED: 'DISPATCHED',
    DELIVERED: 'DELIVERED',
    RETURNED: 'RETURNED',
    CANCELLED: 'CANCELLED'
};
const getDashboardStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.created_at = {
                gte: new Date(String(startDate) + 'T00:00:00.000Z'),
                lte: new Date(String(endDate) + 'T23:59:59.999Z')
            };
        }
        else if (startDate) {
            dateFilter.created_at = {
                gte: new Date(String(startDate) + 'T00:00:00.000Z')
            };
        }
        // 1. Total Sales (Realized Sales: Not Returned, Not Cancelled, Not Draft)
        const totalSales = await client_1.default.order.aggregate({
            where: {
                status: {
                    notIn: [OrderStatus.RETURNED, OrderStatus.CANCELLED, OrderStatus.DRAFT]
                },
                ...dateFilter
            },
            _sum: {
                total_selling_price: true
            }
        });
        // 2. Total Profit (Includes losses from returns, excludes drafts)
        const totalProfit = await client_1.default.order.aggregate({
            where: {
                ...dateFilter,
                status: {
                    not: OrderStatus.DRAFT
                }
            },
            _sum: {
                net_profit: true
            }
        });
        // 3. Status Counts (Include Drafts?) User might want to see how many drafts.
        const statusCounts = await client_1.default.order.groupBy({
            by: ['status'],
            where: dateFilter,
            _count: {
                id: true
            }
        });
        // 4. Outstanding Revenue (Pending + Dispatched) -> Cash to be collected
        const outstandingRevenue = await client_1.default.order.aggregate({
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
        const formattedStatusCounts = statusCounts.reduce((acc, curr) => {
            acc[curr.status] = curr._count.id;
            return acc;
        }, {});
        res.json({
            totalSales: Number(totalSales._sum.total_selling_price) || 0,
            totalProfit: Number(totalProfit._sum.net_profit) || 0,
            statusCounts: {
                DRAFT: formattedStatusCounts[OrderStatus.DRAFT] || 0,
                PENDING: formattedStatusCounts[OrderStatus.PENDING] || 0,
                DISPATCHED: formattedStatusCounts[OrderStatus.DISPATCHED] || 0,
                DELIVERED: formattedStatusCounts[OrderStatus.DELIVERED] || 0,
                RETURNED: formattedStatusCounts[OrderStatus.RETURNED] || 0,
                CANCELLED: formattedStatusCounts[OrderStatus.CANCELLED] || 0,
            },
            outstandingRevenue: Number(outstandingRevenue._sum.total_selling_price) || 0
        });
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
