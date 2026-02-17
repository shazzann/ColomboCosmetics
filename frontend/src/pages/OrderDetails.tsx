import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Package, User, Truck, DollarSign, FileText, Edit2, Save, X, Plus, Minus, Trash2, Search, CheckCircle, RotateCcw, MessageCircle } from 'lucide-react';
// import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api/client';
import BottomNav from '../components/BottomNav';
import Skeleton from '../components/ui/Skeleton';
import { OrderStatus } from '../components/orders/OrderCard';
import { calculateShipping } from '../utils/shipping';

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editedOrder, setEditedOrder] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // New Edit Features State
    const [quickAddProducts, setQuickAddProducts] = useState<any[]>([]);
    const [weight, setWeight] = useState<number | ''>('');

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    useEffect(() => {
        if (order) {
            setEditedOrder(JSON.parse(JSON.stringify(order))); // Deep copy
        }
    }, [order]);

    // Fetch Quick Add Products when entering edit mode
    useEffect(() => {
        if (isEditing && quickAddProducts.length === 0) {
            const fetchQuickAdd = async () => {
                try {
                    const { data } = await api.get('/products', { params: { limit: 10 } });
                    setQuickAddProducts(data);
                } catch (error) {
                    console.error('Error fetching quick add products', error);
                }
            };
            fetchQuickAdd();
        }
    }, [isEditing]);

    useEffect(() => {
        const searchProducts = async () => {
            if (!searchTerm.trim()) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const { data } = await api.get('/products', { params: { search: searchTerm } });
                setSearchResults(data);
            } catch (error) {
                console.error('Search error', error);
            } finally {
                setIsSearching(false);
            }
        };
        const timeout = setTimeout(searchProducts, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    // Auto-calculate shipping
    useEffect(() => {
        if (isEditing && weight && typeof weight === 'number' && editedOrder) {
            const totalSelling = editedOrder.items.reduce((acc: number, item: any) => acc + (Number(item.selling_price) * Number(item.quantity)), 0);
            const cost = calculateShipping(weight, totalSelling, editedOrder.shipping_method);
            setEditedOrder((prev: any) => ({ ...prev, shipping_cost: cost }));
        }
    }, [weight, isEditing, editedOrder?.shipping_method, editedOrder?.items]);


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
        setOrder({ ...order, status: newStatus });
        const toastId = toast.loading('Updating status...');

        try {
            await api.patch(`/orders/${id}/status`, { status: newStatus });
            toast.success('Status updated', { id: toastId });
            fetchOrderDetails();
        } catch (error) {
            setOrder({ ...order, status: originalStatus });
            toast.error('Failed to update status', { id: toastId });
        }
    };

    const handleDeleteOrder = async () => {
        if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;

        const toastId = toast.loading('Deleting order...');
        try {
            await api.delete(`/orders/${id}`);
            toast.success('Order deleted successfully', { id: toastId });
            navigate('/orders');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete order', { id: toastId });
        }
    };

    const handleWhatsAppShare = () => {
        if (!order) return;

        const itemsList = order.items.map((item: any) =>
            `- ${item.product_name || item.name} x ${item.quantity}: ${(Number(item.selling_price) * Number(item.quantity)).toFixed(2)}`
        ).join('\n');

        const subtotal = Number(order.total_selling_price);
        const shipping = Number(order.shipping_cost);
        const total = subtotal + shipping;

        const message = `*COLOMBO COSMETICS*
Order: #${order.id.slice(-6).toUpperCase()}
Date: ${new Date(order.created_at).toISOString().split('T')[0]}

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

        const url = phoneNumber
            ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
            : `https://wa.me/?text=${encodedMessage}`;

        window.open(url, '_blank');
    };

    const getNextStatus = (current: OrderStatus): OrderStatus | null => {
        switch (current) {
            case OrderStatus.PENDING: return OrderStatus.DISPATCHED;
            case OrderStatus.DISPATCHED: return OrderStatus.DELIVERED;
            default: return null;
        }
    };

    // Edit Handlers
    const handleEditChange = (field: string, value: any) => {
        setEditedOrder({ ...editedOrder, [field]: value });
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...editedOrder.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setEditedOrder({ ...editedOrder, items: newItems });
        // recalculateTotals is handled by useEffect if weight is present, but we should also update valid price if needed
        // For manual updates, we trust the effect or manual shipping override
    };

    const handleRemoveItem = (index: number) => {
        const newItems = editedOrder.items.filter((_: any, i: number) => i !== index);
        setEditedOrder({ ...editedOrder, items: newItems });
    };

    const handleAddItem = (product: any) => {
        const newItem = {
            product_id: product.id,
            product_name: product.name,
            quantity: 1,
            cost_price: Number(product.cost_price),
            selling_price: Number(product.default_selling_price || product.cost_price * 2),
            total_item_value: Number(product.default_selling_price || product.cost_price * 2)
        };
        const newItems = [...editedOrder.items, newItem];
        setEditedOrder({ ...editedOrder, items: newItems });
        setSearchTerm('');
        setSearchResults([]);
        toast.success(`Added ${product.name}`);
    };

    const addManualItem = () => {
        const newItem = {
            product_id: null,
            product_name: '',
            quantity: 1,
            cost_price: '',
            selling_price: '',
            isManual: true
        };
        setEditedOrder({ ...editedOrder, items: [...editedOrder.items, newItem] });
    };

    const handleSaveEdit = async () => {
        if (!editedOrder.customer_name || editedOrder.items.length === 0) {
            toast.error('Please fill required fields');
            return;
        }

        const toastId = toast.loading('Saving changes...');
        try {
            const payload = {
                ...editedOrder,
                items: editedOrder.items.map((item: any) => ({
                    productId: item.product_id,
                    name: item.product_name,
                    quantity: Number(item.quantity),
                    cost_price: Number(item.cost_price),
                    selling_price: Number(item.selling_price)
                }))
            };

            const { data } = await api.put(`/orders/${id}`, payload);
            setOrder(data);
            setIsEditing(false);
            toast.success('Order updated successfully', { id: toastId });
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update order', { id: toastId });
        }
    };

    if (isLoading) return <div className="min-h-screen p-6"><Skeleton className="h-12 w-full mb-6" /><Skeleton className="h-64 w-full" /></div>;
    if (!order) return <div className="p-6 text-center">Order not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-800">
            {/* Header */}
            <header className="bg-white px-6 py-4 border-b border-gray-100 sticky top-0 z-40 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/orders')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            Order #{order.id.substring(4, 12)}...
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                order.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-700' :
                                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                                }`}>{order.status}</span>
                        </h1>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleWhatsAppShare}
                        className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors"
                        title="Share on WhatsApp"
                    >
                        <MessageCircle size={20} />
                    </button>

                    {user?.role === 'ADMIN' && !isEditing && (
                        <button
                            onClick={handleDeleteOrder}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete Order"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}

                    {order.status === 'PENDING' && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 text-pink-500 hover:bg-pink-50 rounded-full transition-colors"
                        >
                            <Edit2 size={20} />
                        </button>
                    )}
                </div>

                {isEditing && (
                    <div className="flex gap-2">
                        {/* Delete moved to main header for always-access */}
                        <button onClick={() => { setIsEditing(false); setEditedOrder(JSON.parse(JSON.stringify(order))); }} className="p-2 text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                        <button onClick={handleSaveEdit} className="p-2 text-green-500 hover:text-green-600 bg-green-50 rounded-full">
                            <Save size={20} />
                        </button>
                    </div>
                )}
            </header>

            {/* Content */}
            <div className="max-w-4xl mx-auto p-6 space-y-6">

                {/* Quick Add Section (Only in Edit Mode) */}
                {isEditing && quickAddProducts.length > 0 && (
                    <div className="mb-2">
                        <h3 className="text-xs font-bold text-pink-400 uppercase tracking-widest pl-1 mb-3">Quick Add</h3>
                        <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                            {quickAddProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => handleAddItem(product)}
                                    className="flex-shrink-0 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 min-w-[140px] flex items-center justify-between gap-3 active:scale-95 transition-all hover:bg-pink-50"
                                >
                                    <div className="text-left overflow-hidden">
                                        <p className="font-bold text-gray-800 text-sm truncate">{product.name}</p>
                                        <p className="text-pink-500 font-bold text-xs mt-0.5">${Number(product.default_selling_price || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="bg-pink-100 text-pink-600 rounded-full p-1">
                                        <Plus size={14} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ITEMS SECTION */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2"><Package className="text-pink-500" size={18} /> Order Items</h2>
                        {isEditing && (
                            <div className="relative">
                                <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isSearching ? 'text-pink-500 animate-pulse' : 'text-gray-400'}`} />
                                <input
                                    type="text"
                                    placeholder="Add item..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-3 py-1.5 bg-gray-50 rounded-full text-xs outline-none focus:ring-1 focus:ring-pink-200 transition-all w-32 focus:w-48"
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl z-50 border border-gray-100 max-h-48 overflow-y-auto">
                                        {searchResults.map(p => (
                                            <button key={p.id} onClick={() => handleAddItem(p)} className="w-full text-left p-3 hover:bg-pink-50 text-xs font-bold border-b border-gray-50 flex justify-between">
                                                <span>{p.name}</span>
                                                <span className="text-pink-500">${p.default_selling_price}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="divide-y divide-gray-50">
                        {(isEditing ? editedOrder.items : order.items).map((item: any, idx: number) => (
                            <div key={idx} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800 text-sm">
                                        {isEditing ? (
                                            <input
                                                value={item.product_name || item.name}
                                                onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)}
                                                className="bg-transparent border-b border-dashed border-gray-300 outline-none w-full"
                                                placeholder="Item Name"
                                            />
                                        ) : (item.product_name || item.name)}
                                    </p>
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                        {isEditing ? (
                                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                                <button onClick={() => handleItemChange(idx, 'quantity', Math.max(1, Number(item.quantity) - 1))} className="p-1 hover:text-pink-500"><Minus size={12} /></button>
                                                <span className="font-bold w-6 text-center">{item.quantity}</span>
                                                <button onClick={() => handleItemChange(idx, 'quantity', Number(item.quantity) + 1)} className="p-1 hover:text-pink-500"><Plus size={12} /></button>
                                            </div>
                                        ) : (
                                            <span>Qty: {item.quantity}</span>
                                        )}
                                        <span>×</span>
                                        <span className="font-medium text-gray-900">
                                            $
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={item.selling_price}
                                                    onChange={(e) => handleItemChange(idx, 'selling_price', e.target.value)}
                                                    className="w-16 bg-transparent border-b border-gray-200 text-right outline-none"
                                                />
                                            ) : (Number(item.selling_price).toFixed(2))}
                                        </span>
                                    </div>
                                    {isEditing && (
                                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                            <span>Cost: $</span>
                                            <input
                                                type="number"
                                                value={item.cost_price}
                                                onChange={(e) => handleItemChange(idx, 'cost_price', e.target.value)}
                                                className="w-14 bg-transparent border-b border-gray-200 text-left outline-none text-gray-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="text-right pl-4">
                                    <p className="font-bold text-gray-900">${(Number(item.selling_price) * Number(item.quantity)).toFixed(2)}</p>
                                    {isEditing && (
                                        <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600 p-1 mt-1"><Trash2 size={14} /></button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Manual Add Button */}
                    {isEditing && (
                        <button
                            onClick={addManualItem}
                            className="w-full py-3 bg-gray-50 text-pink-500 text-xs font-bold tracking-widest hover:bg-pink-100/50 transition-colors flex items-center justify-center gap-2 border-t border-gray-100"
                        >
                            <Plus size={14} /> ADD CUSTOM ROW
                        </button>
                    )}
                </div>

                {/* CUSTOMER & SHIPPING */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-50 p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-50">
                            <User className="text-blue-500" size={18} />
                            <h2 className="font-bold text-gray-800">Customer Details</h2>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-xs text-gray-400 uppercase font-bold">Name</span>
                                {isEditing ? (
                                    <input
                                        value={editedOrder.customer_name}
                                        onChange={(e) => handleEditChange('customer_name', e.target.value)}
                                        className="w-full mt-1 p-2 bg-gray-50 rounded-lg outline-none focus:ring-1 focus:ring-blue-200"
                                    />
                                ) : (
                                    <p className="font-bold text-gray-900 text-lg">{order.customer_name}</p>
                                )}
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 uppercase font-bold">Mobile</span>
                                {isEditing ? (
                                    <input
                                        value={editedOrder.mobile_number}
                                        onChange={(e) => handleEditChange('mobile_number', e.target.value)}
                                        className="w-full mt-1 p-2 bg-gray-50 rounded-lg outline-none focus:ring-1 focus:ring-blue-200"
                                    />
                                ) : (
                                    <p className="text-gray-700 font-medium">{order.mobile_number}</p>
                                )}
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 uppercase font-bold">Address</span>
                                {isEditing ? (
                                    <textarea
                                        value={editedOrder.address}
                                        onChange={(e) => handleEditChange('address', e.target.value)}
                                        className="w-full mt-1 p-2 bg-gray-50 rounded-lg outline-none focus:ring-1 focus:ring-blue-200 h-20 resize-none"
                                    />
                                ) : (
                                    <p className="text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">{order.address}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Shipping */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-50 p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-50">
                            <Truck className="text-orange-500" size={18} />
                            <h2 className="font-bold text-gray-800">Shipping Info</h2>
                        </div>
                        <div className="space-y-3 text-sm">

                            {/* Weight Input for Auto-Calc */}
                            {isEditing && (
                                <div className="flex items-center justify-between bg-orange-50/50 p-2 rounded-lg border border-orange-100/50 mb-2">
                                    <span className="text-orange-400 text-xs font-bold uppercase">Weight (g)</span>
                                    <input
                                        type="number"
                                        placeholder="e.g. 500"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                                        className="w-20 text-right bg-white rounded border-none text-xs font-bold outline-none py-1 px-2 text-gray-700"
                                    />
                                </div>
                            )}

                            <div className="flex justify-between items-center bg-orange-50 p-3 rounded-xl border border-orange-100">
                                <span className="text-orange-800 font-medium">Method</span>
                                {isEditing ? (
                                    <select
                                        value={editedOrder.shipping_method}
                                        onChange={(e) => handleEditChange('shipping_method', e.target.value)}
                                        className="bg-white rounded px-2 py-1 text-xs font-bold text-orange-900 outline-none"
                                    >
                                        <option value="COD">COD</option>
                                        <option value="Speed Post">Speed Post</option>
                                        <option value="Pickup">Pickup</option>
                                    </select>
                                ) : (
                                    <span className="font-bold text-orange-900 uppercase tracking-wide text-xs">{order.shipping_method}</span>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Shipping Cost</span>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={editedOrder.shipping_cost}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setEditedOrder((prev: any) => ({ ...prev, shipping_cost: val }));
                                        }}
                                        className="w-20 text-right bg-gray-50 rounded px-2 py-1 font-bold text-gray-900 text-lg outline-none"
                                    />
                                ) : (
                                    <span className="font-bold text-gray-900 text-lg">${Number(order.shipping_cost).toFixed(2)}</span>
                                )}
                            </div>
                            {(order.notes || isEditing) && (
                                <div className="mt-4 pt-4 border-t border-gray-50">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                        <FileText size={12} /> Order Notes
                                    </p>
                                    {isEditing ? (
                                        <textarea
                                            value={editedOrder.notes || ''}
                                            onChange={(e) => handleEditChange('notes', e.target.value)}
                                            className="w-full p-2 bg-amber-50 rounded-xl text-sm border border-amber-100 outline-none resize-none"
                                        />
                                    ) : (
                                        <p className="text-amber-800 bg-amber-50 p-3 rounded-xl text-sm leading-relaxed border border-amber-100">
                                            {order.notes}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Financials (Updates Live in Edit Mode) */}
                <div className="bg-gray-900 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden transition-all duration-300">
                    <div className="absolute -top-6 -right-6 text-gray-800 opacity-20 transform rotate-12">
                        <DollarSign size={150} />
                    </div>
                    <div className="relative z-10 space-y-3">
                        <div className="flex justify-between text-gray-400 text-sm">
                            <span>Subtotal</span>
                            <span>${Number(isEditing ? editedOrder.total_selling_price : order.total_selling_price).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400 text-sm">
                            <span>Shipping</span>
                            <span>${Number(isEditing ? editedOrder.shipping_cost : order.shipping_cost).toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-gray-700 my-2"></div>
                        <div className="flex justify-between text-xl font-serif font-bold">
                            <span>Total</span>
                            <span className="text-pink-400">
                                ${(Number(isEditing ? editedOrder.total_selling_price : order.total_selling_price) + Number(isEditing ? editedOrder.shipping_cost : order.shipping_cost)).toFixed(2)}
                            </span>
                        </div>
                        {!isEditing && (
                            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase">Net Profit</span>
                                <span className="text-green-400 font-bold bg-green-500/10 px-3 py-1 rounded-full text-sm">
                                    +${Number(order.net_profit).toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {!isEditing && getNextStatus(order.status) && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleStatusUpdate(getNextStatus(order.status)!)}
                            className="flex-1 py-4 bg-black text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95"
                        >
                            <span>Mark {getNextStatus(order.status)}</span>
                            {getNextStatus(order.status) === 'DISPATCHED' ? <Truck size={18} /> : <CheckCircle size={18} />}
                        </button>
                        {order.status === 'DISPATCHED' && (
                            <button
                                onClick={() => handleStatusUpdate(OrderStatus.RETURNED)}
                                className="px-4 py-4 bg-red-50 text-red-500 rounded-2xl font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-all active:scale-95 border border-red-100"
                            >
                                <RotateCcw size={18} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default OrderDetails;
