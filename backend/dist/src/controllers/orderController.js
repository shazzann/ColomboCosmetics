"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderById = exports.getOrderStats = exports.updateOrderStatus = exports.getOrders = exports.createOrder = void 0;
const client_1 = __importDefault(require("../db/client"));
const client_2 = require("@prisma/client");
const createOrder = async (req, res) => {
    try {
        const { customer_name, mobile_number, address, shipping_method, shipping_cost, notes, items } = req.body;
        const userId = req.user?.userId; // Assumes authMiddleware adds user
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Order must contain at least one item' });
        }
        let total_selling_price = 0;
        let total_cost_price = 0;
        const orderItemsData = [];
        // Calculate totals and prepare item data
        for (const item of items) {
            const itemCost = Number(item.cost_price);
            const itemSelling = Number(item.selling_price);
            const quantity = Number(item.quantity);
            const totalItemValue = itemSelling * quantity;
            const totalItemCost = itemCost * quantity;
            total_selling_price += totalItemValue;
            total_cost_price += totalItemCost;
            orderItemsData.push({
                product_id: item.productId || null, // Optional for manual items
                product_name: item.name,
                quantity: quantity,
                cost_price: itemCost,
                selling_price: itemSelling,
                total_item_value: totalItemValue
            });
        }
        const shippingCostNum = Number(shipping_cost || 0);
        const net_profit = total_selling_price - total_cost_price - shippingCostNum;
        // Use a transaction to create order and items
        const newOrder = await client_1.default.$transaction(async (tx) => {
            // Generate a simple readable ID (e.g., ORD-timestamp-random) or let UUID handle it.
            // Schema says ID is String @id but not default uuid for Order? 
            // Checking schema... "id String @id". It does NOT say default(uuid).
            // So we must provide ID. Let's use a timestamp-based ID for readability or UUID.
            // Let's use a custom ID format: ORD-{YYYYMMDD}-{Random4}
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const orderId = `ORD-${dateStr}-${randomSuffix}`;
            const order = await tx.order.create({
                data: {
                    id: orderId,
                    customer_name,
                    mobile_number,
                    address,
                    shipping_method: shipping_method,
                    shipping_cost: shippingCostNum,
                    total_selling_price,
                    total_cost_price,
                    net_profit,
                    status: client_2.OrderStatus.PENDING,
                    notes: notes ? String(notes) : null,
                    created_by_id: userId,
                    items: {
                        create: orderItemsData
                    }
                },
                include: {
                    items: true
                }
            });
            return order;
        });
        res.status(201).json(newOrder);
    }
    catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Failed to create order' });
    }
};
exports.createOrder = createOrder;
const getOrders = async (req, res) => {
    try {
        const { status, search, startDate, endDate, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }
        if (startDate && endDate) {
            where.created_at = {
                gte: new Date(String(startDate)),
                lte: new Date(String(endDate))
            };
        }
        if (search) {
            const searchStr = String(search);
            where.OR = [
                { customer_name: { contains: searchStr, mode: 'insensitive' } },
                { mobile_number: { contains: searchStr, mode: 'insensitive' } },
                { id: { contains: searchStr, mode: 'insensitive' } }
            ];
        }
        const [orders, total] = await client_1.default.$transaction([
            client_1.default.order.findMany({
                where,
                include: { items: true },
                orderBy: { created_at: 'desc' },
                skip,
                take: Number(limit)
            }),
            client_1.default.order.count({ where })
        ]);
        res.json({
            orders,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        });
    }
    catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
};
exports.getOrders = getOrders;
const updateOrderStatus = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { status } = req.body;
        const userId = req.user?.userId;
        const order = await client_1.default.order.findUnique({ where: { id } });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const updatedOrder = await client_1.default.order.update({
            where: { id },
            data: { status: status }
        });
        // Create audit log
        await client_1.default.auditLog.create({
            data: {
                user_id: userId,
                action: 'UPDATE_ORDER_STATUS',
                target_id: id,
                previous_value: { status: order.status },
                new_value: { status: status }
            }
        });
        res.json(updatedOrder);
    }
    catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Failed to update order status' });
    }
};
exports.updateOrderStatus = updateOrderStatus;
const getOrderStats = async (req, res) => {
    try {
        const stats = await client_1.default.order.groupBy({
            by: ['status'],
            _count: {
                id: true
            },
            _sum: {
                total_selling_price: true,
                net_profit: true
            }
        });
        const formattedStats = stats.reduce((acc, curr) => {
            acc[curr.status] = {
                count: curr._count.id,
                total: Number(curr._sum.total_selling_price) || 0,
                profit: Number(curr._sum.net_profit) || 0
            };
            return acc;
        }, {});
        const totals = await client_1.default.order.aggregate({
            _sum: {
                total_selling_price: true,
                net_profit: true
            }
        });
        res.json({
            statusStats: formattedStats,
            totalSales: Number(totals._sum.total_selling_price) || 0,
            totalProfit: Number(totals._sum.net_profit) || 0
        });
    }
    catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({ message: 'Failed to fetch order stats' });
    }
};
exports.getOrderStats = getOrderStats;
const getOrderById = async (req, res) => {
    try {
        const id = String(req.params.id);
        const order = await client_1.default.order.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    }
    catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ message: 'Failed to fetch order' });
    }
};
exports.getOrderById = getOrderById;
