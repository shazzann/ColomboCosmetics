import { Request, Response } from 'express';
import prisma from '../db/client';

const OrderStatus = {
    DRAFT: 'DRAFT',
    PENDING: 'PENDING',
    DISPATCHED: 'DISPATCHED',
    DELIVERED: 'DELIVERED',
    RETURNED: 'RETURNED',
    CANCELLED: 'CANCELLED'
} as const;

type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

interface OrderItemInput {
    productId?: string;
    name: string;
    quantity: number;
    cost_price: number;
    selling_price: number;
}

export const createOrder = async (req: Request, res: Response) => {
    try {
        const {
            customer_name,
            mobile_number,
            address,
            shipping_method,
            shipping_cost,
            notes,
            items,
            status // Accept status property
        } = req.body;

        const userId = (req as any).user?.userId;

        const isDraft = status === 'DRAFT';

        // Validation: Items required only if NOT draft
        if (!isDraft && (!items || items.length === 0)) {
            return res.status(400).json({ message: 'Order must contain at least one item' });
        }

        let total_selling_price = 0;
        let total_cost_price = 0;

        interface OrderItemData {
            product_id: string | null;
            product_name: string;
            quantity: number;
            cost_price: number;
            selling_price: number;
            total_item_value: number;
        }

        const orderItemsData: any[] = [];

        // Calculate totals if items exist
        if (items && items.length > 0) {
            for (const item of items as OrderItemInput[]) {
                const itemCost = Number(item.cost_price);
                const itemSelling = Number(item.selling_price);
                const quantity = Number(item.quantity);

                const totalItemValue = itemSelling * quantity;
                const totalItemCost = itemCost * quantity;

                total_selling_price += totalItemValue;
                total_cost_price += totalItemCost;

                orderItemsData.push({
                    product_id: item.productId || null,
                    product_name: item.name,
                    quantity: quantity,
                    cost_price: itemCost,
                    selling_price: itemSelling,
                    total_item_value: totalItemValue
                });
            }
        }

        const shippingCostNum = Number(shipping_cost || 0);
        // Profit is calculated even for drafts if items exist, otherwise 0
        const net_profit = total_selling_price - total_cost_price;

        // Use a transaction to create order and items
        const newOrder = await prisma.$transaction(async (tx: any) => {
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const orderId = `ORD-${dateStr}-${randomSuffix}`;

            const orderData: any = {
                id: orderId,
                customer_name,
                mobile_number,
                address,
                shipping_method: shipping_method || 'COD', // Default if missing in draft
                shipping_cost: shippingCostNum,
                total_selling_price,
                total_cost_price,
                net_profit,
                status: isDraft ? OrderStatus.DRAFT : OrderStatus.PENDING,
                created_by_id: userId,
                items: {
                    create: orderItemsData
                }
            };

            if (notes) {
                orderData.notes = String(notes);
            }

            const order = await tx.order.create({
                data: orderData,
                include: {
                    items: true
                }
            });

            return order;
        });

        res.status(201).json(newOrder);

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Failed to create order' });
    }
};

const checkAutoDelivery = async () => {
    try {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const ordersToUpdate: Array<{ id: string }> = await prisma.order.findMany({
            where: {
                shipping_method: { equals: 'Speed Post' } as any, // Cast to any to bypass strict type check if schema mismatch
                status: {
                    in: [OrderStatus.PENDING, OrderStatus.DISPATCHED]
                },
                created_at: {
                    lt: threeDaysAgo
                }
            }
        });

        if (ordersToUpdate.length > 0) {
            console.log(`Auto-delivering ${ordersToUpdate.length} Speed Post orders...`);
            // We can batch this since logic is simple (profit is already set correctly at creation)
            await prisma.order.updateMany({
                where: {
                    id: { in: ordersToUpdate.map((o) => o.id) }
                },
                data: {
                    status: OrderStatus.DELIVERED
                }
            });
        }
    } catch (error) {
        console.error('Auto delivery check failed:', error);
    }
};

export const getOrders = async (req: Request, res: Response) => {
    // Lazy check for auto-delivery
    checkAutoDelivery().catch(err => console.error('Background auto-delivery error', err));

    try {
        const { status, search, startDate, endDate, shipping_method, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};

        if (status && status !== 'ALL') {
            where.status = status as OrderStatus;
        }

        if (startDate && endDate) {
            where.created_at = {
                gte: new Date(String(startDate) + 'T00:00:00.000Z'),
                lte: new Date(String(endDate) + 'T23:59:59.999Z')
            };
        } else if (startDate) {
            where.created_at = {
                gte: new Date(String(startDate) + 'T00:00:00.000Z')
            };
        }

        if (shipping_method && shipping_method !== 'ALL') {
            where.shipping_method = String(shipping_method);
        }

        if (search) {
            const searchStr = String(search);
            where.OR = [
                { customer_name: { contains: searchStr, mode: 'insensitive' } },
                { mobile_number: { contains: searchStr, mode: 'insensitive' } },
                { id: { contains: searchStr, mode: 'insensitive' } },
                { address: { contains: searchStr, mode: 'insensitive' } }
            ];
        }

        const [orders, total, stats] = await prisma.$transaction([
            prisma.order.findMany({
                where,
                include: { items: true },
                orderBy: { created_at: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.order.count({ where }),
            prisma.order.aggregate({
                where,
                _sum: {
                    total_selling_price: true,
                    net_profit: true
                }
            })
        ]);

        res.json({
            orders,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            stats: {
                totalSales: Number(stats._sum.total_selling_price) || 0,
                totalProfit: Number(stats._sum.net_profit) || 0
            }
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const { status } = req.body;
        const userId = (req as any).user?.userId;

        const order = await prisma.order.findUnique({ where: { id } });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        let newStatus = status as OrderStatus;

        // Speed Post Logic: Skip DISPATCHED -> DELIVERED
        if (newStatus === OrderStatus.DISPATCHED && (order.shipping_method as string) === 'Speed Post') {
            newStatus = OrderStatus.DELIVERED;
        }

        const newProfit = newStatus === OrderStatus.RETURNED
            ? -Number(order.shipping_cost)
            : Number(order.total_selling_price) - Number(order.total_cost_price);

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
                status: newStatus,
                net_profit: newProfit
            }
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                user_id: userId,
                action: 'UPDATE_ORDER_STATUS',
                target_id: id,
                previous_value: { status: order.status, net_profit: order.net_profit },
                new_value: { status: newStatus, net_profit: newProfit }
            }
        });

        res.json(updatedOrder);

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Failed to update order status' });
    }
};

export const getOrderStats = async (req: Request, res: Response) => {
    try {
        const stats = await prisma.order.groupBy({
            by: ['status'],
            _count: {
                id: true
            },
            _sum: {
                total_selling_price: true,
                net_profit: true
            }
        });

        const formattedStats = stats.reduce((acc: any, curr: any) => {
            acc[curr.status] = {
                count: curr._count.id,
                total: Number(curr._sum.total_selling_price) || 0,
                profit: Number(curr._sum.net_profit) || 0
            };
            return acc;
        }, {}) as Record<string, { count: number; total: number; profit: number }>;

        const totals = await prisma.order.aggregate({
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

    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({ message: 'Failed to fetch order stats' });
    }
};

export const getOrderById = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ message: 'Failed to fetch order' });
    }
};

export const updateOrder = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const {
            customer_name,
            mobile_number,
            address,
            shipping_method,
            shipping_cost,
            notes,
            items,
            status // Accept status change (e.g. finalizing draft)
        } = req.body;

        const userId = (req as any).user?.userId;

        // 1. Fetch existing order to check status
        const existingOrder = await prisma.order.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!existingOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Allow editing PENDING or DRAFT
        if (existingOrder.status !== OrderStatus.PENDING && existingOrder.status !== OrderStatus.DRAFT) {
            return res.status(400).json({ message: 'Only PENDING or DRAFT orders can be edited' });
        }

        const isFinalizing = existingOrder.status === OrderStatus.DRAFT && status === OrderStatus.PENDING;
        const newStatus = status || existingOrder.status;

        // Validation: If Finalizing or staying Pending, requires items
        if ((newStatus === OrderStatus.PENDING) && (!items || items.length === 0)) {
            return res.status(400).json({ message: 'Order must contain at least one item to be finalized' });
        }

        // 2. Recalculate Totals (Logic mirrored from createOrder)
        let total_selling_price = 0;
        let total_cost_price = 0;

        interface OrderItemData {
            product_id: string | null;
            product_name: string;
            quantity: number;
            cost_price: number;
            selling_price: number;
            total_item_value: number;
        }

        const orderItemsData: OrderItemData[] = [];

        if (items && items.length > 0) {
            for (const item of items) {
                const itemCost = Number(item.cost_price);
                const itemSelling = Number(item.selling_price);
                const quantity = Number(item.quantity);

                const totalItemValue = itemSelling * quantity;
                const totalItemCost = itemCost * quantity;

                total_selling_price += totalItemValue;
                total_cost_price += totalItemCost;

                orderItemsData.push({
                    product_id: item.productId || item.product_id || null, // Handle both formats
                    product_name: item.name || item.product_name,
                    quantity: quantity,
                    cost_price: itemCost,
                    selling_price: itemSelling,
                    total_item_value: totalItemValue
                });
            }
        }

        const shippingCostNum = Number(shipping_cost || 0);
        const net_profit = total_selling_price - total_cost_price;

        // 3. Transaction: Update Order & Replace Items
        const updatedOrder = await prisma.$transaction(async (tx: any) => {
            // Delete existing items
            await tx.orderItem.deleteMany({
                where: { order_id: id }
            });

            // Update Order Details
            const order = await tx.order.update({
                where: { id },
                data: {
                    customer_name,
                    mobile_number,
                    address,
                    shipping_method,
                    shipping_cost: shippingCostNum,
                    status: newStatus, // Update status (e.g., Draft -> Pending)
                    notes: notes ? String(notes) : null,
                    total_selling_price,
                    total_cost_price,
                    net_profit,
                    // updated_at is auto-handled by Prisma
                    items: {
                        create: orderItemsData
                    }
                },
                include: {
                    items: true
                }
            });

            // Create Audit Log
            await tx.auditLog.create({
                data: {
                    user_id: userId,
                    action: 'EDIT_ORDER',
                    target_id: id,
                    previous_value: existingOrder as any,
                    new_value: order as any
                }
            });

            return order;
        });

        res.json(updatedOrder);

    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ message: 'Failed to update order' });
    }
};

export const deleteOrder = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const userId = (req as any).user?.userId;

        // Transaction to delete items first, then order
        await prisma.$transaction(async (tx: any) => {
            await tx.orderItem.deleteMany({
                where: { order_id: id }
            });

            await tx.auditLog.create({
                data: {
                    user_id: userId,
                    action: 'DELETE_ORDER',
                    target_id: id,
                    previous_value: { id },
                }
            });

            await tx.order.delete({
                where: { id }
            });
        });

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ message: 'Failed to delete order' });
    }
};
