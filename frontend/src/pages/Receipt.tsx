import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { format } from 'date-fns';
import { MessageCircle } from 'lucide-react';

const Receipt = () => {
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const hasPrinted = useRef(false);

    useEffect(() => {
        const fetchOrder = async () => {
            // ... existing fetch logic
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
            // Auto-print when ready
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [loading, order]);

    if (loading) return <div className="p-8 text-center">Loading receipt...</div>;
    if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

    const subtotal = Number(order.total_selling_price);
    const shipping = Number(order.shipping_cost);
    const total = subtotal + shipping; // Total Bill to customer

    const handleWhatsAppShare = () => {
        if (!order) return;

        const itemsList = order.items.map((item: any) =>
            `- ${item.product_name || item.name} x ${item.quantity}: ${(Number(item.selling_price) * Number(item.quantity)).toFixed(2)}`
        ).join('\n');

        const message = `*COLOMBO COSMETICS*
Order: #${order.id.slice(-6).toUpperCase()}
Date: ${format(new Date(order.created_at), 'yyyy-MM-dd')}

*Customer:*
${order.customer_name}
${order.address || ''}

*Items:*
${itemsList}

Subtotal: ${subtotal.toFixed(2)}
Shipping: ${shipping.toFixed(2)}
*TOTAL: ${total.toFixed(2)}*

Thank you for your order!`;

        const encodedMessage = encodeURIComponent(message);
        const phoneNumber = order.mobile_number.replace(/\D/g, ''); // Strip non-digits
        // Default to no number (user picks contact) if invalid, or use specific format if needed
        // wa.me/?text=... allows picking contact. wa.me/NUMBER?text=... pre-fills number.

        const url = phoneNumber
            ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
            : `https://wa.me/?text=${encodedMessage}`;

        window.open(url, '_blank');
    };

    return (
        <div className="bg-white min-h-screen p-8 text-black font-mono text-sm max-w-[80mm] mx-auto print:max-w-none print:mx-0 print:p-0">
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">Colombo Cosmetics</h1>
                <p className="text-xs text-gray-500 mb-4">Make Up & Beauty Store</p>
                <div className="border-b border-black pb-4 mb-4 border-dashed">
                    <p>Order ID: <strong>#{order.id.slice(-6).toUpperCase()}</strong></p>
                    <p>Date: {format(new Date(order.created_at), 'dd/MM/yyyy hh:mm a')}</p>
                </div>
            </div>

            {/* Customer */}
            <div className="mb-6 text-xs">
                <p><strong>Customer:</strong> {order.customer_name}</p>
                <p><strong>Phone:</strong> {order.mobile_number}</p>
                {order.address && <p><strong>Address:</strong> {order.address}</p>}
            </div>

            {/* Items */}
            <table className="w-full mb-6 text-left border-collapse">
                <thead>
                    <tr className="border-b border-black border-dashed">
                        <th className="py-2 w-1/2">Item</th>
                        <th className="py-2 text-center">Qty</th>
                        <th className="py-2 text-right">Price</th>
                        <th className="py-2 text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="text-xs">
                    {order.items.map((item: any, index: number) => (
                        <tr key={index} className="">
                            <td className="py-2 pr-2 align-top">
                                {item.product_name || item.name}
                            </td>
                            <td className="py-2 text-center align-top">{item.quantity}</td>
                            <td className="py-2 text-right align-top">{Number(item.selling_price).toFixed(2)}</td>
                            <td className="py-2 text-right align-top font-bold">
                                {(Number(item.selling_price) * Number(item.quantity)).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="border-t border-black border-dashed pt-4 mb-8">
                <div className="flex justify-between mb-1">
                    <span>Subtotal</span>
                    <span>{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1">
                    <span>Shipping</span>
                    <span>{shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-black border-dashed">
                    <span>TOTAL</span>
                    <span>{total.toFixed(2)}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs space-y-2">
                <p>Thank you for your purchase!</p>
                <p>No returns on opened items.</p>
                <p className="mt-4 text-[10px] text-gray-400">Inventory System Generated</p>
            </div>

            {/* Actions (Hidden in Print) */}
            <div className="mt-8 space-y-3 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="w-full bg-black text-white py-3 font-bold uppercase text-xs hover:bg-gray-800 transition-colors"
                >
                    Print Receipt
                </button>
                <button
                    onClick={handleWhatsAppShare}
                    className="w-full bg-[#25D366] text-white py-3 font-bold uppercase text-xs hover:bg-[#20bd5a] transition-colors flex items-center justify-center gap-2"
                >
                    <MessageCircle size={16} /> Send to WhatsApp
                </button>
            </div>
        </div>
    );
};

export default Receipt;
