"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const client_1 = __importDefault(require("../db/client"));
const client_2 = require("@prisma/client");
const getDashboardStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.created_at = {
                gte: new Date(String(startDate)),
                lte: new Date(String(endDate))
            };
        }
        else if (startDate) {
            dateFilter.created_at = {
                gte: new Date(String(startDate))
            };
        }
        // 1. Total Sales (Realized Sales: Not Returned, Not Cancelled, Not Draft)
        const totalSales = await client_1.default.order.aggregate({
            where: {
                status: {
                    notIn: [client_2.OrderStatus.RETURNED, client_2.OrderStatus.CANCELLED, client_2.OrderStatus.DRAFT]
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
                    not: client_2.OrderStatus.DRAFT
                }
            },
            _sum: {
                net_profit: true
            }
        });
        // 3. Status Counts
        // Non-dispatched/delivered statuses filtered by created_at
        const statusCounts = await client_1.default.order.groupBy({
            by: ['status'],
            where: {
                ...dateFilter,
                status: {
                    notIn: [client_2.OrderStatus.DISPATCHED, client_2.OrderStatus.DELIVERED]
                }
            },
            _count: {
                id: true
            }
        });
        // Dispatched & Delivered filtered by status_updated_at
        const statusUpdatedDateFilter = {};
        if (startDate && endDate) {
            statusUpdatedDateFilter.status_updated_at = {
                gte: new Date(String(startDate)),
                lte: new Date(String(endDate))
            };
        }
        else if (startDate) {
            statusUpdatedDateFilter.status_updated_at = {
                gte: new Date(String(startDate))
            };
        }
        const dispatchedCount = await client_1.default.order.count({
            where: {
                status: client_2.OrderStatus.DISPATCHED,
                ...statusUpdatedDateFilter
            }
        });
        const deliveredCount = await client_1.default.order.count({
            where: {
                status: client_2.OrderStatus.DELIVERED,
                ...statusUpdatedDateFilter
            }
        });
        // 4. Outstanding Revenue (Pending + Dispatched) -> Cash to be collected
        const outstandingRevenue = await client_1.default.order.aggregate({
            where: {
                status: {
                    in: [client_2.OrderStatus.PENDING, client_2.OrderStatus.DISPATCHED]
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
                DRAFT: formattedStatusCounts[client_2.OrderStatus.DRAFT] || 0,
                PENDING: formattedStatusCounts[client_2.OrderStatus.PENDING] || 0,
                DISPATCHED: dispatchedCount || 0,
                DELIVERED: deliveredCount || 0,
                RETURNED: formattedStatusCounts[client_2.OrderStatus.RETURNED] || 0,
                CANCELLED: formattedStatusCounts[client_2.OrderStatus.CANCELLED] || 0,
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
