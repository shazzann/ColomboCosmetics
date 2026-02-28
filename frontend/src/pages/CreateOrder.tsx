import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Search, ChevronLeft, Trash2, StickyNote } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import BottomNav from '../components/BottomNav';
import { calculateShipping } from '../utils/shipping';
import { useOrderDraft } from '../context/OrderDraftContext';

interface CartItem {
    tempId: string;
    product_id?: string;
    name: string;
    quantity: number;
    cost_price: number | string;
    selling_price: number | string;
    isManual: boolean;
}

const CreateOrder = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const {
        orderDetails, setOrderDetails,
        items, setItems,
        weight, setWeight,
        draftId,
        resetDraft,

    } = useOrderDraft();

    // Product Search & Quick Add State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [quickAddProducts, setQuickAddProducts] = useState<any[]>([]);

    useEffect(() => {
        const fetchQuickAdd = async () => {
            try {
                const { data } = await api.get('/products', { params: { limit: 5 } });
                setQuickAddProducts(data);
            } catch (error) {
                console.error('Error fetching quick add products', error);
            }
        };
        fetchQuickAdd();
    }, []);

    useEffect(() => {
        const searchProducts = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }
            try {
                const { data } = await api.get('/products', { params: { search: searchQuery } });
                setSearchResults(data);
            } catch (error) {
                console.error('Search error', error);
            }
        };
        const timeout = setTimeout(searchProducts, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const addToCart = (product: any) => {
        const newItem: CartItem = {
            tempId: Math.random().toString(36).substr(2, 9),
            product_id: product.id,
            name: product.name,
            quantity: 1,
            cost_price: Number(product.cost_price),
            selling_price: Number(product.default_selling_price || product.cost_price * 2),
            isManual: false
        };
        setItems([...items, newItem]);
        setSearchQuery('');
        setSearchResults([]);
        toast.success(`Added ${product.name}`);
    };

    const addManualItem = () => {
        const newItem: CartItem = {
            tempId: Math.random().toString(36).substr(2, 9),
            name: '',
            quantity: 1,
            cost_price: '',
            selling_price: '',
            isManual: true
        };
        setItems([...items, newItem]);
    };

    const updateItem = (id: string, field: keyof CartItem, value: any) => {
        setItems(items.map(item =>
            item.tempId === id ? { ...item, [field]: value } : item
        ));
    };

    const incrementQty = (id: string) => {
        setItems(items.map(item =>
            item.tempId === id ? { ...item, quantity: Number(item.quantity) + 1 } : item
        ));
    };

    const decrementQty = (id: string) => {
        setItems(items.map(item => {
            if (item.tempId === id) {
                if (item.quantity > 1) return { ...item, quantity: Number(item.quantity) - 1 };
                return item;
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.tempId !== id));
    };

    // Calculations
    const totalSelling = items.reduce((acc, item) => acc + (Number(item.selling_price) * Number(item.quantity)), 0);
    const shipping = Number(orderDetails.shipping_cost);

    // Auto-calculate shipping
    useEffect(() => {
        if (weight && typeof weight === 'number') {
            const cost = calculateShipping(weight, totalSelling, orderDetails.shipping_method);
            setOrderDetails(prev => ({ ...prev, shipping_cost: cost }));
        }
    }, [weight, totalSelling, orderDetails.shipping_method]);


    // Final save on unmount (via cleanup or navigation)
    // Note: useEffect cleanup runs on unmount. We try one last save.
    // However, since it's async, we just rely on the periodic debounce or explicit save.
    // React Router 6.4+ blockers are better for this, but let's stick to this for now.

    const handleSubmit = async (status: 'PENDING' | 'DRAFT' = 'PENDING') => {
        if (!orderDetails.customer_name) {
            toast.error('Customer name is required');
            return;
        }
        if (status !== 'DRAFT' && items.length === 0) {
            toast.error('Add at least one item');
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                ...orderDetails,
                status,
                items: items.map(item => ({
                    productId: item.isManual ? undefined : item.product_id,
                    name: item.name,
                    quantity: Number(item.quantity),
                    cost_price: Number(item.cost_price),
                    selling_price: Number(item.selling_price)
                }))
            };

            if (draftId) {
                await api.put(`/orders/${draftId}`, payload);
            } else {
                await api.post('/orders', payload);
            }

            toast.success(status === 'DRAFT' ? 'Draft saved successfully!' : 'Order created successfully!');
            resetDraft();
            navigate('/orders');
        } catch (error) {
            console.error('Create order error', error);
            toast.error('Failed to save order');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDF9FB] pb-24 font-sans text-gray-800">
            {/* Header */}
            <header className="px-6 py-6 flex items-center justify-between bg-[#FDF9FB] sticky top-0 z-50">
                <button onClick={() => navigate('/orders')} className="text-pink-500 hover:bg-pink-50 p-2 rounded-full transition-colors">
                    <ChevronLeft size={28} />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Create New Order</h1>
                <button
                    onClick={resetDraft}
                    className="text-pink-500 font-semibold text-sm hover:text-pink-600 px-2"
                >
                    Reset
                </button>
            </header>

            <div className="max-w-md mx-auto px-6 space-y-8">

                {/* Search / Quick Add Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Quick Add</h3>
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-3 py-2 bg-white rounded-full text-sm border-none shadow-sm focus:ring-2 focus:ring-pink-100 outline-none w-36 transition-all focus:w-56"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-400 transition-colors" size={16} />
                            {/* Live Search Results */}
                            {searchResults.length > 0 && (
                                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl z-50 overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                                    {searchResults.map(product => (
                                        <button
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            className="w-full text-left p-4 hover:bg-pink-50 flex justify-between items-center border-b border-gray-50 last:border-0 transition-colors"
                                        >
                                            <span className="text-sm font-bold text-gray-800">{product.name}</span>
                                            <span className="text-xs font-bold text-pink-500 bg-pink-50 px-2 py-1 rounded-full">Rs. {Number(product.default_selling_price || 0).toFixed(2)}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 pt-1">
                        {quickAddProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="flex-shrink-0 bg-white p-3 rounded-2xl shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)] border border-transparent min-w-[150px] flex items-center justify-between gap-3 active:scale-95 transition-all hover:shadow-md hover:-translate-y-0.5"
                            >
                                <div className="text-left overflow-hidden">
                                    <p className="font-bold text-gray-800 text-sm truncate">{product.name}</p>
                                    <p className="text-pink-500 font-bold text-xs mt-0.5">Rs. {Number(product.default_selling_price || 0).toFixed(2)}</p>
                                </div>
                                <div className="bg-pink-500 text-white rounded-full p-1.5 shadow-sm">
                                    <Plus size={14} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Order Items - COMPACT CARD LAYOUT */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">Order Items ({items.length})</h3>
                        <button
                            onClick={() => setItems([])}
                            className="text-[10px] font-bold text-red-300 hover:text-red-500 uppercase tracking-wider transition-colors"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {items.map((item) => (
                            <div key={item.tempId} className="p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors group">
                                {/* Vertical Stepper */}
                                <div className="flex flex-col items-center bg-white border border-gray-100 rounded-lg w-8 shrink-0 shadow-sm overflow-hidden">
                                    <button onClick={() => incrementQty(item.tempId)} className="h-6 w-full flex items-center justify-center text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-colors"><Plus size={10} /></button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(item.tempId, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                                        className="font-bold text-xs text-center w-full py-0.5 bg-gray-50 border-y border-gray-100 outline-none text-gray-800 appearance-none m-0"
                                    />
                                    <button onClick={() => decrementQty(item.tempId)} className="h-6 w-full flex items-center justify-center text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-colors"><Minus size={10} /></button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 grid grid-cols-12 gap-1.5 items-center">
                                    <div className="col-span-4">
                                        {item.isManual ? (
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => updateItem(item.tempId, 'name', e.target.value)}
                                                className="font-bold text-gray-900 text-sm bg-transparent border-b border-dashed border-gray-300 outline-none w-full placeholder-gray-300 py-1"
                                                placeholder="Item Name"
                                            />
                                        ) : (
                                            <h3 className="font-bold text-gray-900 text-sm truncate">{item.name}</h3>
                                        )}
                                        <p className="text-[10px] font-bold text-gray-300 tracking-wide mt-0.5">
                                            {item.product_id ? item.product_id.substring(0, 8).toUpperCase() : 'MANUAL'}
                                        </p>
                                    </div>

                                    <div className="col-span-2 text-right">
                                        <div className="text-[9px] text-gray-300 font-bold uppercase">Cost</div>
                                        <div className="flex items-center justify-end">
                                            <span className="text-[10px] text-gray-400 mr-0.5">Rs.</span>
                                            <input
                                                type="number"
                                                value={item.cost_price}
                                                onChange={(e) => updateItem(item.tempId, 'cost_price', e.target.value)}
                                                className="w-full text-right bg-transparent outline-none font-medium text-gray-500 text-xs focus:text-pink-500 border-b border-transparent focus:border-pink-100 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-3 text-right">
                                        <div className="text-[9px] text-gray-300 font-bold uppercase">Price</div>
                                        <div className="flex items-center justify-end">
                                            <span className="text-[10px] text-gray-400 mr-0.5">Rs.</span>
                                            <input
                                                type="number"
                                                value={item.selling_price}
                                                onChange={(e) => updateItem(item.tempId, 'selling_price', e.target.value)}
                                                className="w-full text-right bg-transparent outline-none font-bold text-gray-700 text-xs focus:text-pink-500 border-b border-transparent focus:border-pink-100 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-3 text-right pl-1">
                                        <div className="text-[9px] text-gray-300 font-bold uppercase">Total</div>
                                        <div className="font-bold text-gray-900 text-xs whitespace-nowrap">
                                            Rs. {(Number(item.selling_price) * Number(item.quantity)).toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => removeItem(item.tempId)} className="flex p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                    <div className="sr-only">Remove</div>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}

                        {items.length === 0 && (
                            <div className="py-8 px-4 text-center">
                                <p className="text-gray-400 text-xs font-medium italic">Your cart is empty.</p>
                                <p className="text-gray-300 text-[10px] mt-1">Select items from Quick Add or add manually.</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={addManualItem}
                        className="w-full py-3 bg-gray-50 text-pink-500 text-xs font-bold tracking-widest hover:bg-pink-100/50 transition-colors flex items-center justify-center gap-2 border-t border-gray-100"
                    >
                        <Plus size={14} /> ADD CUSTOM ROW
                    </button>
                </div>

                {/* Customer Details */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pl-1">Customer Details</h3>
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Customer Name"
                            value={orderDetails.customer_name}
                            onChange={(e) => setOrderDetails({ ...orderDetails, customer_name: e.target.value })}
                            className="w-full px-6 py-4 rounded-full bg-white shadow-sm border-none focus:ring-2 focus:ring-pink-100 font-medium text-gray-700 placeholder-gray-400 outline-none transition-shadow"
                        />
                        <input
                            type="text"
                            placeholder="Phone Number (77X-XXXXXX)"
                            value={orderDetails.mobile_number}
                            onChange={(e) => setOrderDetails({ ...orderDetails, mobile_number: e.target.value })}
                            className="w-full px-6 py-4 rounded-full bg-white shadow-sm border-none focus:ring-2 focus:ring-pink-100 font-medium text-gray-700 placeholder-gray-400 outline-none transition-shadow"
                        />
                        <textarea
                            placeholder="Shipping Address..."
                            value={orderDetails.address}
                            onChange={(e) => setOrderDetails({ ...orderDetails, address: e.target.value })}
                            className="w-full px-6 py-4 rounded-3xl bg-white shadow-sm border-none focus:ring-2 focus:ring-pink-100 font-medium text-gray-700 placeholder-gray-400 outline-none transition-shadow resize-none h-24"
                        />
                    </div>
                </div>

                {/* Notes Input */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-50">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
                        <StickyNote size={14} /> Order Notes
                    </label>
                    <textarea
                        value={orderDetails.notes}
                        onChange={(e) => setOrderDetails({ ...orderDetails, notes: e.target.value })}
                        placeholder="Add special instructions, delivery notes, or gift messages..."
                        className="w-full p-4 bg-[#FEFCE8] rounded-2xl text-sm font-medium text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-yellow-100 resize-none border-none transition-all"
                        rows={3}
                    />
                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50 pb-10">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Order Summary</h3>

                    {/* Weight Input */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Weight (Grams)</label>
                        </div>
                        <input
                            type="number"
                            placeholder="e.g. 500"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                            className="w-full bg-gray-50 text-gray-700 font-bold rounded-2xl px-4 py-3 border-none outline-none focus:ring-2 focus:ring-pink-100 transition-all text-sm"
                        />
                    </div>

                    {/* Shipping Dropdown */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Shipping Option</label>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <select
                                    value={orderDetails.shipping_method}
                                    onChange={(e) => setOrderDetails({ ...orderDetails, shipping_method: e.target.value })}
                                    className="w-full bg-pink-50 text-pink-600 font-bold rounded-2xl px-4 py-3 border-none outline-none appearance-none cursor-pointer text-sm"
                                >
                                    <option value="COD">Cash on Delivery (COD)</option>
                                    <option value="Speed Post">Speed Post</option>
                                    <option value="Pickup">Store Pickup</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-pink-400">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1" /></svg>
                                </div>
                            </div>
                            <div className="bg-pink-50 rounded-2xl px-4 flex items-center min-w-[80px] justify-center">
                                <span className="text-pink-600 font-bold text-sm mr-0.5">Rs.</span>
                                <input
                                    type="number"
                                    value={orderDetails.shipping_cost === 0 ? '' : orderDetails.shipping_cost}
                                    onChange={(e) => setOrderDetails({ ...orderDetails, shipping_cost: e.target.value ? Number(e.target.value) : 0 })}
                                    placeholder="0"
                                    className="w-10 bg-transparent font-bold text-pink-600 outline-none text-sm placeholder-gray-300"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        <div className="flex justify-between text-gray-500 font-medium text-sm">
                            <span>Subtotal</span>
                            <span>Rs. {totalSelling.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 font-medium text-sm">
                            <span>Shipping Fee</span>
                            <span>Rs. {shipping.toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-gray-100 my-4"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-900">TOTAL BILL</span>
                            <span className="text-4xl font-bold text-pink-500 tracking-tight">Rs. {(totalSelling + shipping).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => handleSubmit('DRAFT')}
                            disabled={isLoading}
                            className="flex-1 bg-white text-gray-500 py-4 rounded-2xl font-bold text-lg shadow-sm border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <StickyNote size={20} />
                            Save Draft
                        </button>
                        <button
                            onClick={() => handleSubmit('PENDING')}
                            disabled={isLoading}
                            className="flex-[2] bg-[#EC4899] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-pink-200 hover:bg-[#DB2777] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isLoading ? <span className="animate-pulse">Creating...</span> : (
                                <>
                                    <ShoppingBagIcon />
                                    CREATE ORDER
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>

            <div className="h-20"></div>
            <BottomNav />
        </div>
    );
};

// Custom Icon for cleaner look
const ShoppingBagIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <path d="M16 10a4 4 0 0 1-8 0"></path>
    </svg>
)

export default CreateOrder;
