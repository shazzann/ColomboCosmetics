import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import BottomNav from '../components/BottomNav';
import {
    format,
    startOfDay,
    endOfDay,
    subDays,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear
} from 'date-fns';
import {
    TrendingUp,
    Calendar,
    Clock,
    Truck,
    CheckCircle,
    RotateCcw,
    Wallet,
    ArrowRight,
    ChevronDown
} from 'lucide-react';

interface DashboardStats {
    totalSales: number;
    totalProfit: number;
    statusCounts: {
        PENDING: number;
        DISPATCHED: number;
        DELIVERED: number;
        RETURNED: number;
        CANCELLED: number;
    };
    outstandingRevenue: number;
}

const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterLabel, setFilterLabel] = useState('Last 30 Days');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const filterRef = useRef<HTMLDivElement>(null);

    const handleCustomDateSubmit = () => {
        if (customStart && customEnd) {
            fetchStats(customStart, customEnd);
            setFilterLabel(`${customStart} to ${customEnd}`);
            setShowCustomPicker(false);
        }
    };

    const fetchStats = async (startDate?: string, endDate?: string) => {
        // Cache Key
        const cacheKey = `dashboard_stats_${startDate || 'default'}_${endDate || 'default'}`;

        // 1. Check Cache first
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try {
                setStats(JSON.parse(cached));
                setLoading(false);
            } catch (e) {
                console.error('Cache parse error', e);
                sessionStorage.removeItem(cacheKey);
                setLoading(true);
            }
        } else {
            setLoading(true);
        }

        try {
            const params: any = {};
            if (startDate && endDate) {
                params.startDate = startDate;
                params.endDate = endDate;
            }
            const { data } = await api.get('/orders/dashboard', { params });

            // 2. Update State & Cache
            setStats(data);
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial load: Last 30 Days
        const end = new Date();
        const start = subDays(end, 30);
        fetchStats(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowFilterMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFilterChange = (type: string) => {
        const today = new Date();
        let start, end;
        let label = '';

        switch (type) {
            case 'today':
                start = startOfDay(today);
                end = endOfDay(today);
                label = 'Today';
                break;
            case 'week':
                start = startOfWeek(today, { weekStartsOn: 1 });
                end = endOfWeek(today, { weekStartsOn: 1 });
                label = 'This Week';
                break;
            case 'month':
                start = startOfMonth(today);
                end = endOfMonth(today);
                label = 'This Month';
                break;
            case 'year':
                start = startOfYear(today);
                end = endOfYear(today);
                label = 'This Year';
                break;
            case 'last30':
                end = today;
                start = subDays(today, 30);
                label = 'Last 30 Days';
                break;
            default: // All Time
                fetchStats();
                setFilterLabel('All Time');
                setShowFilterMenu(false);
                return;
        }

        if (start && end) {
            fetchStats(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
            setFilterLabel(label);
        }
        setShowFilterMenu(false);
    };

    if (loading && !stats) return <div className="p-8 text-center text-pink-500 font-manrope">Loading Dashboard...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500 font-manrope">Failed to load data</div>;

    const currentDate = format(new Date(), 'MMMM d, yyyy');

    return (
        <div className="min-h-screen bg-[#f8f5f7] pb-24 font-manrope text-slate-800">
            {/* Header Section */}
            <header className="px-6 pt-8 mb-8">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-[#f53d87]/80 font-bold mb-1">Overview</p>
                        <h1 className="font-playfair text-3xl font-bold text-slate-900">Executive Summary</h1>
                        <p className="text-xs text-gray-400 mt-1">{currentDate}</p>
                    </div>
                    {/* <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#f53d87]/20 bg-white shadow-sm">
                        <img
                            className="w-full h-full object-cover"
                            src="https://ui-avatars.com/api/?name=Admin&background=f53d87&color=fff"
                            alt="Profile"
                        />
                    </div> */}
                </div>

                <div className="flex items-center gap-3 relative" ref={filterRef}>
                    <button
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        className="flex-1 flex items-center justify-between bg-white p-3 px-4 rounded-xl shadow-sm border border-[#f53d87]/10 active:scale-95 transition-transform"
                    >
                        <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-[#f53d87]" />
                            <span className="text-sm font-semibold">{filterLabel}</span>
                        </div>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showFilterMenu && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden">
                            <button onClick={() => handleFilterChange('today')} className="w-full text-left px-4 py-3 text-sm hover:bg-pink-50 transition-colors border-b border-gray-50">Today</button>
                            <button onClick={() => handleFilterChange('week')} className="w-full text-left px-4 py-3 text-sm hover:bg-pink-50 transition-colors border-b border-gray-50">This Week</button>
                            <button onClick={() => handleFilterChange('month')} className="w-full text-left px-4 py-3 text-sm hover:bg-pink-50 transition-colors border-b border-gray-50">This Month</button>
                            <button onClick={() => handleFilterChange('last30')} className="w-full text-left px-4 py-3 text-sm hover:bg-pink-50 transition-colors border-b border-gray-50">Last 30 Days</button>
                            <button onClick={() => handleFilterChange('year')} className="w-full text-left px-4 py-3 text-sm hover:bg-pink-50 transition-colors border-b border-gray-50">This Year</button>
                            <button onClick={() => { setShowCustomPicker(true); setShowFilterMenu(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-pink-50 transition-colors border-b border-gray-50 font-medium text-[#f53d87]">Custom Range</button>
                            <button onClick={() => handleFilterChange('all')} className="w-full text-left px-4 py-3 text-sm hover:bg-pink-50 transition-colors">All Time</button>
                        </div>
                    )}

                    {showCustomPicker && (
                        <div className="absolute top-full right-0 mt-2 p-4 bg-white rounded-xl shadow-xl border border-gray-100 z-20 w-72">
                            <h3 className="text-sm font-bold text-slate-800 mb-3">Select Date Range</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:border-[#f53d87]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:border-[#f53d87]"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => setShowCustomPicker(false)}
                                        className="flex-1 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCustomDateSubmit}
                                        className="flex-1 py-2 text-xs font-bold text-white bg-[#f53d87] hover:bg-[#d93675] rounded-lg"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}


                </div>
            </header>

            <main className="px-6 max-w-md mx-auto">
                {/* Metrics Section: Primary Cards */}
                <section className="grid grid-cols-2 gap-4 mb-8">
                    {/* Sales Card */}
                    <div className="bg-white/70 backdrop-blur-md border border-white/30 p-5 rounded-xl shadow-xl shadow-[#f53d87]/5 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#f53d87]/10 rounded-full blur-2xl"></div>
                        <p className="text-xs font-semibold text-slate-500 mb-2">Total Sales</p>
                        <h3 className="font-playfair text-xl font-bold text-slate-900 mb-1">
                            LKR {stats.totalSales.toLocaleString()}
                        </h3>
                        <div className="flex items-center text-emerald-500">
                            <TrendingUp size={12} />
                            <span className="text-[10px] font-bold ml-1">Realized</span>
                        </div>
                    </div>

                    {/* Profit Card */}
                    <div className="bg-white/70 backdrop-blur-md border border-white/30 p-5 rounded-xl shadow-xl shadow-[#f53d87]/5 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#f53d87]/20 rounded-full blur-2xl"></div>
                        <p className="text-xs font-semibold text-slate-500 mb-2">Total Profit</p>
                        <h3 className="font-playfair text-xl font-bold text-[#f53d87] mb-1">
                            LKR {stats.totalProfit.toLocaleString()}
                        </h3>
                        <div className="flex items-center text-emerald-500">
                            <TrendingUp size={12} />
                            <span className="text-[10px] font-bold ml-1">Net</span>
                        </div>
                    </div>
                </section>

                {/* Operations Grid */}
                <section className="mb-8">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 px-1">Order Status</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Pending */}
                        <Link to="/orders" className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                                <Clock size={20} className="text-amber-500" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900">{stats.statusCounts.PENDING}</span>
                            <span className="text-[10px] font-medium text-slate-500 uppercase">Pending</span>
                        </Link>
                        {/* Dispatched */}
                        <Link to="/orders" className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center mb-3">
                                <Truck size={20} className="text-sky-500" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900">{stats.statusCounts.DISPATCHED}</span>
                            <span className="text-[10px] font-medium text-slate-500 uppercase">Dispatched</span>
                        </Link>
                        {/* Delivered */}
                        <Link to="/orders" className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                                <CheckCircle size={20} className="text-emerald-500" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900">{stats.statusCounts.DELIVERED}</span>
                            <span className="text-[10px] font-medium text-slate-500 uppercase">Delivered</span>
                        </Link>
                        {/* Returned */}
                        <Link to="/orders" className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center mb-3">
                                <RotateCcw size={20} className="text-rose-500" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900">{stats.statusCounts.RETURNED}</span>
                            <span className="text-[10px] font-medium text-slate-500 uppercase">Returned</span>
                        </Link>
                    </div>
                </section>

                {/* Financial Summary Card */}
                <section>
                    <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#f53d87]/20 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Wallet size={18} className="text-[#f53d87]" />
                                    <span className="text-sm font-medium opacity-80">Outstanding Revenue</span>
                                </div>
                                <span className="text-[10px] bg-[#f53d87]/20 text-[#f53d87] px-2 py-1 rounded-full font-bold uppercase">Critical</span>
                            </div>
                            <p className="text-xs opacity-60 mb-1">To be collected (COD)</p>
                            <div className="flex items-baseline gap-2">
                                <h4 className="font-playfair text-3xl font-bold">LKR {stats.outstandingRevenue.toLocaleString()}</h4>
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                                <div className="flex -space-x-2">
                                    {/* Placeholder avatars for staff */}
                                    {/* <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px]">JD</div>
                                    <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px]">MS</div> */}
                                </div>
                                <Link to="/orders" className="text-[#f53d87] text-sm font-bold flex items-center gap-1 hover:text-pink-400 transition-colors">
                                    View Details <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
};

export default Dashboard;
