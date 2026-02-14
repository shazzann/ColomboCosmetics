import { MapPin, Package, Eye, CheckCircle, Truck, RotateCcw, Printer } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export type OrderStatus = 'PENDING' | 'DISPATCHED' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';

export const OrderStatus = {
    PENDING: 'PENDING',
    DISPATCHED: 'DISPATCHED',
    DELIVERED: 'DELIVERED',
    RETURNED: 'RETURNED',
    CANCELLED: 'CANCELLED'
} as const;

interface Order {
    id: string;
    customer_name: string;
    mobile_number: string;
    address: string;
    created_at: string;
    status: OrderStatus;
    total_selling_price: number;
    net_profit: number;
    items: any[];
    notes?: string;
    shipping_method?: string; // Added to support potential styling based on shipping
}

interface OrderCardProps {
    order: Order;
    onStatusUpdate: (order: Order, newStatus: OrderStatus) => void;
}

const OrderCard = ({ order, onStatusUpdate }: OrderCardProps) => {

    const getStatusStyles = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case OrderStatus.DISPATCHED: return 'bg-sky-100 text-sky-700 border-sky-200'; // status-dispatched equivalent
            case OrderStatus.DELIVERED: return 'bg-emerald-100 text-emerald-700 border-emerald-200'; // status-delivered equivalent
            case OrderStatus.RETURNED: return 'bg-orange-100 text-orange-700 border-orange-200';
            case OrderStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getNextStatus = (current: OrderStatus): OrderStatus | null => {
        switch (current) {
            case OrderStatus.PENDING: return OrderStatus.DISPATCHED;
            case OrderStatus.DISPATCHED: return OrderStatus.DELIVERED;
            default: return null;
        }
    };

    const nextStatus = getNextStatus(order.status);
    const canReturn = order.status === 'DISPATCHED'; // Only allow return from DISPATCHED as per user request
    const itemCount = order.items.reduce((acc: number, item: any) => acc + item.quantity, 0);

    const getTimeText = () => {
        const date = new Date(order.created_at);
        const now = new Date();
        const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffHours < 24) {
            return format(date, 'hh:mm a');
        } else if (diffHours < 48) {
            return 'Yesterday';
        } else {
            return formatDistanceToNow(date, { addSuffix: true });
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform duration-100">
            <div className="py-1 px-3">
                {/* Header: ID & Status */}
                <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-tight">#{order.id.slice(-5)}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border leading-none ${getStatusStyles(order.status)}`}>
                        {order.status}
                    </span>
                </div>

                {/* Main Info: Name, Address, Phone, Items */}
                <div className="grid grid-cols-2 gap-x-2 ">
                    <div className="flex flex-col min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm truncate">{order.customer_name}</h3>
                        <p className="text-gray-500 flex items-center gap-1 truncate mt-0.5 text-xs">
                            <MapPin size={12} className="shrink-0" />
                            <span className="truncate">{order.address || 'No Address'}</span>
                        </p>
                    </div>
                    <div className="flex flex-col text-right items-end whitespace-nowrap">
                        <p className="text-gray-700 font-semibold text-xs">{order.mobile_number}</p>
                        <p className="text-gray-400 flex items-center gap-1 justify-end mt-0.5 text-xs">
                            <Package size={12} />
                            {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                        </p>
                    </div>
                </div>

                {/* Footer: Financials & Actions */}
                <div className="flex justify-between items-center   border-gray-50">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">
                            {Number(order.total_selling_price).toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">LKR</span>
                        </span>
                        <span className="text-lg font-bold text-emerald-500">
                            +{Number(order.net_profit).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400">{getTimeText()}</span>
                    </div>

                    <div className="flex gap-1">
                        <Link
                            to={`/orders/${order.id}`}
                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-colors"
                            title="View Details"
                        >
                            <Eye size={16} />
                        </Link>

                        {nextStatus && (
                            <button
                                onClick={() => onStatusUpdate(order, nextStatus)}
                                className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${nextStatus === 'DISPATCHED'
                                    ? 'text-gray-400 hover:text-sky-600 hover:bg-sky-50'
                                    : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                title={`Mark as ${nextStatus}`}
                            >
                                {nextStatus === 'DISPATCHED' ? <Truck size={16} /> : <CheckCircle size={16} />}
                            </button>
                        )}

                        {canReturn && (
                            <button
                                onClick={() => onStatusUpdate(order, OrderStatus.RETURNED)}
                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Mark as Returned"
                            >
                                <RotateCcw size={16} />
                            </button>
                        )}

                        <Link
                            to={`/orders/${order.id}/print`}
                            target="_blank"
                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Print Receipt"
                        >
                            <Printer size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderCard;
