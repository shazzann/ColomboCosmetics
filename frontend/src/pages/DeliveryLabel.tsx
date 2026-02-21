import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client'; // Adjust path as needed
import { format } from 'date-fns';

const DeliveryLabel = () => {
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const hasPrinted = useRef(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await api.get(`/orders/${id}`);
                setOrder(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching order', error);
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    useEffect(() => {
        if (!loading && order && !hasPrinted.current) {
            hasPrinted.current = true;
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [loading, order]);

    if (loading) return <div className="p-8 text-center">Loading label...</div>;
    if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

    // Logic for "COD Amount" vs "Value"
    // If shipping method is "COD", we show the total amount to collect.
    // If "Speed Post" (Prepaid generally) or others, we might still show value but maybe label it differently?
    // Based on user request, let's treat it as a standard label showing value.
    // If it is COD, we label it "COD: Rs. XXX".
    // If it is NOT COD, we label it "Value: Rs. XXX" or "Prepaid".
    // Let's stick to the visual provided which highlights COD.

    const isCOD = order.shipping_method === 'COD';
    const totalAmount = Number(order.total_selling_price) + Number(order.shipping_cost);

    return (
        <div className="bg-white min-h-screen p-4 text-black font-sans max-w-[105mm] mx-auto print:max-w-none print:mx-0 print:p-0">
            {/* Label Container - A6 size approx (105mm x 148mm) or 4x6" */}
            <div className="border-2 border-black w-full aspect-[105/148] flex flex-col relative print:w-full print:aspect-auto print:h-screen print:border-none">

                {/* Header (Store Info) */}
                <div className="border-b-2 border-black p-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tight">Colombo Cosmetics</h1>
                        <p className="text-[10px] font-bold text-gray-600">MAKE UP & BEAUTY STORE</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg">076 202 4291</p>
                        {/* <p className="text-[10px] text-gray-500">www.colombocosmetics.lk</p> */}
                    </div>
                </div>

                {/* SENDER (FROM) */}
                <div className="border-b border-black p-3 bg-gray-50/50">
                    <p className="font-bold text-xs text-gray-500 uppercase mb-1">FROM:</p>
                    <p className="font-bold text-sm">Colombo Cosmetics</p>
                    <p className="text-xs">No. 200, Main Street, Kattankudy 02.</p>
                    <p className="font-bold text-xs mt-1">076 202 4291</p>
                </div>

                {/* RECEIVER (TO) - Main Focus */}
                <div className="flex-1 p-4 flex flex-col justify-center relative">
                    <p className="font-bold text-xs text-gray-500 uppercase mb-2">TO:</p>
                    <h2 className="text-xl font-bold mb-1">{order.customer_name}</h2>
                    <p className="text-base font-medium leading-snug whitespace-pre-wrap">{order.address}</p>
                    <p className="text-lg font-bold mt-3">{order.mobile_number}</p>

                    {/* Date Stamp */}
                    <div className="absolute bottom-2 right-2 text-[10px] text-gray-400">
                        {format(new Date(order.created_at), 'yyyy-MM-dd')}
                    </div>
                </div>

                {/* FOOTER (COD & Order Info) */}
                <div className="border-t-2 border-black p-4 bg-gray-100 flex items-center justify-between">
                    {/* COD Box */}
                    <div className="border-2 border-black p-2 px-4 bg-white text-center min-w-[120px]">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">{isCOD ? 'COD Amount' : 'Value (Prepaid)'}</p>
                        <p className="text-xl font-black">Rs. {totalAmount.toLocaleString()}/-</p>
                    </div>

                    {/* Order Details */}
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-600">Order No: <span className="text-black text-sm">#{order.id.slice(-6).toUpperCase()}</span></p>
                        <p className="text-[10px] text-gray-500 mt-1">Thank you for your order!</p>
                    </div>
                </div>

            </div>

            {/* Print Button (Hidden in Print) */}
            <button
                onClick={() => window.print()}
                className="mt-8 w-full bg-black text-white py-3 font-bold uppercase text-xs print:hidden hover:bg-gray-800 transition-colors">
                Print Label
            </button>
        </div>
    );
};

export default DeliveryLabel;
