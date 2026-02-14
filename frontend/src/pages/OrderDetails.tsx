import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, User, Truck, DollarSign, Calendar, Clock, FileText, RotateCcw, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api/client';
import BottomNav from '../components/BottomNav';
import Skeleton from '../components/ui/Skeleton';

import { OrderStatus } from '../components/orders/OrderCard';

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            const { data } = await api.get(`/orders/${id}`);
            setOrder(data);
        } catch (error) {
            console.error('Error fetching order:', error);
            toast.error('Failed to load order details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: OrderStatus) => {
        const originalStatus = order.status;

        // Optimistic
        setOrder({ ...order, status: newStatus });
        const toastId = toast.loading('Updating status...');

        try {
            await api.patch(`/orders/${id}/status`, { status: newStatus });
            toast.success('Status updated', { id: toastId });
            fetchOrderDetails(); // Refresh to ensure data consistency
        } catch (error) {
            setOrder({ ...order, status: originalStatus }); // Revert
            toast.error('Failed to update status', { id: toastId });
        }
    };

    const getNextStatus = (current: OrderStatus): OrderStatus | null => {
        switch (current) {
            case OrderStatus.PENDING: return OrderStatus.DISPATCHED;
            case OrderStatus.DISPATCHED: return OrderStatus.DELIVERED;
            default: return null;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <Skeleton className="h-12 w-1/3 mb-6" />
                <Skeleton className="h-64 w-full mb-6" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Order Not Found</h2>
                <button onClick={() => navigate('/orders')} className="text-pink-500 font-bold hover:underline">
                    Back to Orders
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            <header className="bg-white px-6 py-4 border-b border-gray-100 sticky top-0 z-40 shadow-sm flex items-center space-x-4">
                <button onClick={() => navigate('/orders')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        Order #{order.id}
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            order.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'
                            }`}>
                            {order.status}
                        </span>

                        {getNextStatus(order.status) && (
                            <button
                                onClick={() => handleStatusUpdate(getNextStatus(order.status)!)}
                                className="ml-2 bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-1 shadow-md active:scale-95"
                            >
                                <span>Mark {getNextStatus(order.status)}</span>
                                {getNextStatus(order.status) === 'DISPATCHED' ? <Truck size={12} /> : <CheckCircle size={12} />}
                            </button>
                        )}

                        {order.status === 'DISPATCHED' && (
                            <button
                                onClick={() => handleStatusUpdate(OrderStatus.RETURNED)}
                                className="ml-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1 shadow-sm active:scale-95 border border-red-100"
                            >
                                <span>Mark Returned</span>
                                <RotateCcw size={12} />
                            </button>
                        )}
                    </h1>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={10} /> {format(new Date(order.created_at), 'MMM dd, yyyy')}
                        <span className="mx-1">•</span>
                        <Clock size={10} /> {format(new Date(order.created_at), 'hh:mm a')}
                    </p>
                </div>
            </header>

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Items */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                        <Package className="text-pink-500" size={18} />
                        <h2 className="font-bold text-gray-800">Order Items</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {order.items.map((item: any) => (
                            <div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-bold text-gray-800">{item.product_name}</p>
                                    <p className="text-xs text-gray-500">
                                        Qty: {item.quantity} × <span className="font-medium text-gray-900">${Number(item.selling_price).toFixed(2)}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">${(Number(item.selling_price) * item.quantity).toFixed(2)}</p>
                                    <p className="text-[10px] text-gray-400">Cost: ${(Number(item.cost_price) * item.quantity).toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Customer & Shipping */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-50 p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-50">
                            <User className="text-blue-500" size={18} />
                            <h2 className="font-bold text-gray-800">Customer Details</h2>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-xs text-gray-400 uppercase font-bold">Name</span>
                                <p className="font-bold text-gray-900 text-lg">{order.customer_name}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 uppercase font-bold">Mobile</span>
                                <p className="text-gray-700 font-medium">{order.mobile_number}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 uppercase font-bold">Address</span>
                                <p className="text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">{order.address}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-50 p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-50">
                            <Truck className="text-orange-500" size={18} />
                            <h2 className="font-bold text-gray-800">Shipping Info</h2>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center bg-orange-50 p-3 rounded-xl border border-orange-100">
                                <span className="text-orange-800 font-medium">Method</span>
                                <span className="font-bold text-orange-900 uppercase tracking-wide text-xs">{order.shipping_method}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Shipping Cost</span>
                                <span className="font-bold text-gray-900 text-lg">${Number(order.shipping_cost).toFixed(2)}</span>
                            </div>
                            {order.notes && (
                                <div className="mt-4 pt-4 border-t border-gray-50">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                        <FileText size={12} /> Order Notes
                                    </p>
                                    <p className="text-amber-800 bg-amber-50 p-3 rounded-xl text-sm leading-relaxed border border-amber-100">
                                        {order.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Financials */}
                <div className="bg-gray-900 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 text-gray-800 opacity-20 transform rotate-12">
                        <DollarSign size={150} />
                    </div>
                    <div className="relative z-10 space-y-3">
                        <div className="flex justify-between text-gray-400 text-sm">
                            <span>Subtotal</span>
                            <span>${Number(order.total_selling_price).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400 text-sm">
                            <span>Shipping</span>
                            <span>${Number(order.shipping_cost).toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-gray-700 my-2"></div>
                        <div className="flex justify-between text-xl font-serif font-bold">
                            <span>Total</span>
                            <span className="text-pink-400">${(Number(order.total_selling_price) + Number(order.shipping_cost)).toFixed(2)}</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase">Net Profit</span>
                            <span className="text-green-400 font-bold bg-green-500/10 px-3 py-1 rounded-full text-sm">
                                +${Number(order.net_profit).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default OrderDetails;
