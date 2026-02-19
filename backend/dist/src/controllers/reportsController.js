"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportOrders = void 0;
const date_fns_1 = require("date-fns");
const json2csv_1 = require("json2csv");
const client_1 = __importDefault(require("../db/client"));
const OrderStatus = {
    PENDING: 'PENDING',
    DISPATCHED: 'DISPATCHED',
    DELIVERED: 'DELIVERED',
    RETURNED: 'RETURNED',
    CANCELLED: 'CANCELLED'
};
const exportOrders = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        const where = {};
        // Status Filter
        if (status && status !== 'ALL') {
            where.status = status;
        }
        // Date Filter
        if (startDate && endDate) {
            where.created_at = {
                gte: new Date(String(startDate) + 'T00:00:00.000Z'),
                lte: new Date(String(endDate) + 'T23:59:59.999Z')
            };
        }
        // Fetch Orders
        const orders = await client_1.default.order.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: {
                items: true
            }
        });
        if (orders.length === 0) {
            return res.status(404).json({ message: 'No orders found for the selected criteria' });
        }
        // Format Data for CSV
        const csvData = orders.map((order) => {
            const itemsSummary = order.items.map((item) => `${item.product_name} (x${item.quantity})`).join(', ');
            return {
                'Order ID': order.id,
                'Date': (0, date_fns_1.format)(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
                'Customer Name': order.customer_name,
                'Mobile': order.mobile_number,
                'Address': order.address,
                'Status': order.status,
                'Total Sales': Number(order.total_selling_price) || 0,
                'Net Profit': Number(order.net_profit) || 0,
                'Shipping Cost': Number(order.shipping_cost) || 0,
                'Items': itemsSummary
            };
        });
        // Generate CSV
        const parser = new json2csv_1.Parser();
        const csv = parser.parse(csvData);
        // Send CSV File
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', `attachment; filename=orders_export_${Date.now()}.csv`);
        res.send(csv);
    }
    catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ message: 'Failed to generate report' });
    }
};
exports.exportOrders = exportOrders;
