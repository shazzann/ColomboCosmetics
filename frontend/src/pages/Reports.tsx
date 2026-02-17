import { useState } from 'react';
import { format, subDays, startOfMonth, startOfYear, startOfWeek } from 'date-fns';
import BottomNav from '../components/BottomNav';
import { FileText, Calendar, Download, Filter } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';

const Reports = () => {
    const [reportType, setReportType] = useState('ALL');
    const [dateRange, setDateRange] = useState('thisMonth');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            let startDate, endDate;
            const today = new Date();

            switch (dateRange) {
                case 'today':
                    startDate = format(today, 'yyyy-MM-dd');
                    endDate = format(today, 'yyyy-MM-dd');
                    break;
                case 'thisWeek':
                    startDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                    endDate = format(today, 'yyyy-MM-dd');
                    break;
                case 'thisMonth':
                    startDate = format(startOfMonth(today), 'yyyy-MM-dd');
                    endDate = format(today, 'yyyy-MM-dd');
                    break;
                case 'last30':
                    startDate = format(subDays(today, 30), 'yyyy-MM-dd');
                    endDate = format(today, 'yyyy-MM-dd');
                    break;
                case 'thisYear':
                    startDate = format(startOfYear(today), 'yyyy-MM-dd');
                    endDate = format(today, 'yyyy-MM-dd');
                    break;
                case 'custom':
                    startDate = customStart;
                    endDate = customEnd;
                    break;
                default:
                    // All time (no dates sent)
                    break;
            }

            const params: any = {
                status: reportType === 'ALL' ? undefined : reportType,
                startDate,
                endDate
            };

            const response = await api.get('/reports/export', {
                params,
                responseType: 'blob' // Important for file download
            });

            // Trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const fileName = `Report_${reportType}_${startDate || 'AllTime'}_to_${endDate || 'Now'}.csv`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Report generated successfully');

        } catch (error) {
            console.error('Error generating report:', error);
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f5f7] pb-24 font-manrope text-slate-800">
            <header className="px-6 pt-8 mb-8">
                <h1 className="font-playfair text-3xl font-bold text-slate-900 mb-2">Reports</h1>
                <p className="text-sm text-slate-500">Generate detailed CSV reports for your orders.</p>
            </header>

            <main className="px-6 max-w-md mx-auto">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

                    {/* Report Type */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Filter size={16} className="text-[#f53d87]" /> Report Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {['ALL', 'DELIVERED', 'RETURNED'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setReportType(type)}
                                    className={`p-3 rounded-xl text-xs font-bold transition-all ${reportType === type
                                        ? 'bg-[#f53d87] text-white shadow-lg shadow-[#f53d87]/20'
                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    {type === 'ALL' ? 'All Orders' : type.charAt(0) + type.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="mb-8">
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Calendar size={16} className="text-[#f53d87]" /> Date Range
                        </label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#f53d87] transition-colors mb-3"
                        >
                            <option value="today">Today</option>
                            <option value="thisWeek">This Week</option>
                            <option value="thisMonth">This Month</option>
                            <option value="last30">Last 30 Days</option>
                            <option value="thisYear">This Year</option>
                            <option value="all">All Time</option>
                            <option value="custom">Custom Range</option>
                        </select>

                        {dateRange === 'custom' && (
                            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Start Date</label>
                                    <input
                                        type="date"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#f53d87]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">End Date</label>
                                    <input
                                        type="date"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#f53d87]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerateReport}
                        disabled={loading || (dateRange === 'custom' && (!customStart || !customEnd))}
                        className="w-full bg-[#f53d87] text-white p-4 rounded-xl font-bold shadow-lg shadow-[#f53d87]/30 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#d93675]"
                    >
                        {loading ? (
                            <span className="animate-pulse">Generating...</span>
                        ) : (
                            <>
                                <Download size={20} /> Generate Report
                            </>
                        )}
                    </button>

                </div>

                <div className="mt-8">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                        <FileText className="text-blue-500 shrink-0 mt-1" size={20} />
                        <div>
                            <h4 className="font-bold text-blue-900 text-sm mb-1">Report Contents</h4>
                            <p className="text-xs text-blue-700/80 leading-relaxed">
                                The generated CSV will include Order ID, Customer Details, Items, Financials (Total, Profit), and Status. You can open this file in Excel or Google Sheets.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default Reports;
