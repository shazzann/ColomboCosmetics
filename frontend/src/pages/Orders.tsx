import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Search, Bell, Plus, Truck, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import api from '../api/client';
import BottomNav from '../components/BottomNav';
import OrderCard, { OrderStatus } from '../components/orders/OrderCard';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const Orders = () => {

    const { user } = useAuth();
    // Initialize state from sessionStorage if available
    const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>(() => {
        return (sessionStorage.getItem('orders_activeTab') as any) || 'ALL';
    });
    const [orders, setOrders] = useState<any[]>(() => {
        const saved = sessionStorage.getItem('orders_data');
        return saved ? JSON.parse(saved) : [];
    });
    const [isLoading, setIsLoading] = useState(() => {
        return !sessionStorage.getItem('orders_data');
    });
    const [search, setSearch] = useState(() => sessionStorage.getItem('orders_search') || '');
    const [dateRange, setDateRange] = useState(() => {
        const saved = sessionStorage.getItem('orders_dateRange');
        return saved ? JSON.parse(saved) : { start: '', end: '' };
    });
    const [shippingMethod, setShippingMethod] = useState(() => sessionStorage.getItem('orders_shippingMethod') || 'ALL');
    const [showCustomDate, setShowCustomDate] = useState(false);

    // Tabs configuration
    const tabs = [
        { id: 'ALL', label: 'All Orders' },
        { id: OrderStatus.PENDING, label: 'Pending' },
        { id: OrderStatus.DISPATCHED, label: 'Dispatched' },
        { id: OrderStatus.DELIVERED, label: 'Delivered' },
        { id: OrderStatus.RETURNED, label: 'Returned' },
        { id: OrderStatus.CANCELLED, label: 'Cancelled' },
    ];

    // Persist state changes
    useEffect(() => {
        sessionStorage.setItem('orders_activeTab', activeTab);
        sessionStorage.setItem('orders_search', search);
        sessionStorage.setItem('orders_dateRange', JSON.stringify(dateRange));
        sessionStorage.setItem('orders_shippingMethod', shippingMethod);
    }, [activeTab, search, dateRange, shippingMethod]);

    // Persist orders data whenever it changes
    useEffect(() => {
        if (orders.length > 0) {
            sessionStorage.setItem('orders_data', JSON.stringify(orders));
        }
    }, [orders]);

    // Scroll Logic
    useEffect(() => {
        const handleScroll = () => {
            sessionStorage.setItem('orders_scrollY', window.scrollY.toString());
        };
        window.addEventListener('scroll', handleScroll);

        // Restore scroll on mount if we have data
        const savedScroll = sessionStorage.getItem('orders_scrollY');
        if (savedScroll && orders.length > 0) {
            // Immediate scroll restore
            window.scrollTo(0, Number(savedScroll));
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, []); // Run once on mount

    useEffect(() => {
        // Background fetch to update data
        fetchOrders(false);
    }, [activeTab, dateRange, shippingMethod]);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDateFilterChange = (value: string) => {
        const today = new Date();
        if (value === 'all') {
            setDateRange({ start: '', end: '' });
        } else if (value === 'today') {
            const start = format(startOfDay(today), 'yyyy-MM-dd');
            const end = format(endOfDay(today), 'yyyy-MM-dd');
            setDateRange({ start, end });
        } else if (value === 'week') {
            const start = format(subDays(today, 7), 'yyyy-MM-dd');
            const end = format(endOfDay(today), 'yyyy-MM-dd');
            setDateRange({ start, end });
        } else if (value === 'custom') {
            setShowCustomDate(true);
        }
    };

    const fetchOrders = async (showLoading = true) => {
        if (showLoading && orders.length === 0) setIsLoading(true);
        try {
            // Always fetch ALL orders (up to 1000) for current filters to enable client-side tab switching
            const params: any = {
                status: 'ALL',
                search: search,
                shipping_method: shippingMethod,
                limit: 1000 // Fetch large number to support client-side filtering
            };

            if (dateRange.start) params.startDate = dateRange.start;
            if (dateRange.end) params.endDate = dateRange.end;

            const { data } = await api.get('/orders', { params });
            setOrders(data.orders);

            // Backend stats are for ALL (filtered by date/search), but we calculate local stats based on tab
        } catch (error) {
            console.error('Error fetching orders:', error);
            if (orders.length === 0) toast.error('Failed to load orders');
        } finally {
            setIsLoading(false);
        }
    };

    // Client-side filtering for tabs
    const filteredOrders = orders.filter((order: any) => {
        if (activeTab === 'ALL') return true;
        return order.status === activeTab;
    });

    // Calculate stats client-side based on filtered orders
    const stats = useMemo(() => filteredOrders.reduce((acc, order) => {
        const isReturned = order.status === OrderStatus.RETURNED;
        // Don't count sales for returned items, but do count them for profit (as negative/loss) logic which is handled in DB
        // User request: "on all oreders tab shoe every orders ... except returned orders" regarding sales summation?
        // Actually for "All Orders" we want realized sales. Returned is not a sale.
        const sales = isReturned ? 0 : Number(order.total_selling_price);
        const profit = Number(order.net_profit);

        return {
            totalSales: acc.totalSales + sales,
            totalProfit: acc.totalProfit + profit
        };
    }, { totalSales: 0, totalProfit: 0 }), [filteredOrders]);

    const handleStatusUpdate = async (order: any, newStatus: OrderStatus) => {
        const originalStatus = order.status;

        // Optimistic Update
        const updatedOrders = orders.map(o =>
            o.id === order.id ? { ...o, status: newStatus } : o
        );
        setOrders(updatedOrders);

        // API Call with Undo
        const toastId = toast.loading(
            <span>
                Status updated to {newStatus}.
                <button
                    onClick={() => handleUndo(order.id, originalStatus, toastId)}
                    className="ml-2 font-bold underline"
                >
                    Undo
                </button>
            </span>,
            { duration: 5000 }
        );

        try {
            await api.patch(`/orders/${order.id}/status`, { status: newStatus });
            // Refresh in background to get accurate stats
            fetchOrders();
        } catch (error) {
            setOrders(orders); // Revert on error
            toast.error('Failed to update status', { id: toastId });
        }
    };

    const handleUndo = async (orderId: string, originalStatus: OrderStatus, toastId: string) => {
        toast.dismiss(toastId);
        // Optimistic Revert
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: originalStatus } : o));

        try {
            await api.patch(`/orders/${orderId}/status`, { status: originalStatus });
            toast.success('Status reverted');
            fetchOrders();
        } catch (error) {
            toast.error('Failed to revert status');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans relative">
            {/* Custom Date Modal */}
            {showCustomDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Select Date Range</h3>
                            <p className="text-sm text-gray-500">Filter orders by custom dates</p>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Start Date</label>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="w-full mt-1 p-2 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">End Date</label>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="w-full mt-1 p-2 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => { setShowCustomDate(false); setDateRange({ start: '', end: '' }); }}
                                className="flex-1 py-2 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowCustomDate(false)}
                                className="flex-1 py-2 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-colors shadow-lg shadow-pink-200"
                            >
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md pt-4 pb-2 px-4 border-b border-gray-100">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-pink-500">Colombo Cosmetics</p>
                        <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Order Management</h1>
                    </div>
                    <div className="flex gap-2">
                        {/* <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                            <Bell size={18} />
                        </button> */}
                    </div>
                </div>

                {/* Stats - Only for Admin */}
                {user?.role === 'ADMIN' && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {activeTab !== OrderStatus.RETURNED && (
                            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Sales</p>
                                <p className="text-lg font-extrabold text-gray-900 mt-0.5">LKR {Number(stats.totalSales).toLocaleString()}</p>
                            </div>
                        )}
                        <div className={`bg-white p-3 rounded-xl border border-gray-100 shadow-sm ${activeTab === OrderStatus.RETURNED ? 'col-span-2' : ''}`}>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {activeTab === OrderStatus.RETURNED ? 'Total Loss' : 'Total Profit'}
                            </p>
                            <p className={`text-lg font-extrabold mt-0.5 ${activeTab === OrderStatus.RETURNED || stats.totalProfit < 0
                                ? 'text-red-500'
                                : 'text-green-500'
                                }`}>
                                LKR {activeTab === OrderStatus.RETURNED
                                    ? Math.abs(Number(stats.totalProfit)).toLocaleString()
                                    : Number(stats.totalProfit).toLocaleString()}
                            </p>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search Orders..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none shadow-sm placeholder-gray-400"
                    />
                </div>

                {/* Filters */}
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select
                                className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-3 pr-8 text-xs font-semibold focus:ring-2 focus:ring-pink-500 outline-none appearance-none text-gray-700"
                                onChange={(e) => handleDateFilterChange(e.target.value)}
                                value={showCustomDate ? 'custom' : (dateRange.start ? 'custom' : 'all')}
                            >
                                <option value="all">All Dates</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="custom">Custom Range...</option>
                            </select>
                            <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                        </div>
                        <div className="relative flex-1">
                            <select
                                value={shippingMethod}
                                onChange={(e) => setShippingMethod(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-3 pr-8 text-xs font-semibold focus:ring-2 focus:ring-pink-500 outline-none appearance-none text-gray-700"
                            >
                                <option value="ALL">All Shipping</option>
                                <option value="COD">Cash on Delivery</option>
                                <option value="Speed Post">Speed Post</option>
                                <option value="Pickup">Pickup</option>
                            </select>
                            <Truck className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                                    ? 'bg-pink-500 text-white shadow-md shadow-pink-200'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="px-3 pb-32 pt-2 space-y-2">
                {isLoading ? (
                    [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
                ) : filteredOrders.length === 0 ? (
                    <EmptyState
                        icon={Search}
                        title="No orders found"
                        description="Try adjusting your filters."
                    />
                ) : (
                    filteredOrders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onStatusUpdate={handleStatusUpdate}
                        />
                    ))
                )}
            </main>

            {/* Floating Action Button */}
            <Link
                to="/orders/new"
                className="fixed bottom-24 right-6 w-12 h-12 bg-pink-500 text-white rounded-full shadow-xl shadow-pink-500/40 flex items-center justify-center active:scale-90 transition-transform z-30"
            >
                <Plus size={24} />
            </Link>

            <BottomNav />
        </div>
    );
};

export default Orders;
