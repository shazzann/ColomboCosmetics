import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, PenLine, PackageX } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import BottomNav from '../components/BottomNav';
import Skeleton from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';

interface Product {
    id: string;
    name: string;
    cost_price: number;
    default_selling_price?: number;
}

const Products = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        cost_price: '',
        default_selling_price: '',
    });
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const { data } = await api.get('/products');
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const loadingToast = toast.loading(isEditing ? 'Updating product...' : 'Creating product...');
        try {
            if (isEditing) {
                await api.put(`/products/${isEditing}`, formData);
                setIsEditing(null);
                toast.success('Product updated successfully');
            } else {
                await api.post('/products', formData);
                toast.success('Product created successfully');
            }
            setFormData({ name: '', cost_price: '', default_selling_price: '' });
            fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Failed to save product');
        } finally {
            toast.dismiss(loadingToast);
        }
    };

    const handleEdit = (product: Product) => {
        setFormData({
            name: product.name,
            cost_price: product.cost_price.toString(),
            default_selling_price: product.default_selling_price?.toString() || '',
        });
        setIsEditing(product.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: string) => {
        setIsDeleting(id);
    };

    const confirmDelete = async () => {
        if (!isDeleting) return;
        const loadingToast = toast.loading('Deleting product...');
        try {
            await api.delete(`/products/${isDeleting}`);
            toast.success('Product deleted successfully');
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        } finally {
            toast.dismiss(loadingToast);
            setIsDeleting(null);
        }
    };

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            {/* Header */}
            <header className="bg-white px-6 py-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-40">
                <h1 className="text-2xl font-serif text-gray-800 font-bold">Manage Products</h1>
                <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-pink-500 shadow-sm">
                    <PackageIcon />
                </div>
            </header>

            <div className="p-6 space-y-8">
                {/* Create/Edit Form */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                        {isEditing ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Product Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Hydrating Face Mask"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-pink-50/50 rounded-xl text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all font-medium"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Wholesale Cost
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 font-bold text-sm">Rs</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.cost_price}
                                        onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-pink-50/50 rounded-xl text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all font-medium"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Retail Price
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 font-bold text-sm">Rs</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.default_selling_price}
                                        onChange={(e) => setFormData({ ...formData, default_selling_price: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-pink-50/50 rounded-xl text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-[#FF3385] to-[#FF6B9E] text-white font-bold py-4 rounded-xl shadow-lg shadow-pink-200 hover:shadow-pink-300 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                        >
                            {isEditing ? (
                                <span>Update Product</span>
                            ) : (
                                <>
                                    <div className="bg-white/20 rounded-full p-0.5">
                                        <Plus size={16} strokeWidth={3} />
                                    </div>
                                    <span>Add New Product</span>
                                </>
                            )}
                        </button>

                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(null);
                                    setFormData({ name: '', cost_price: '', default_selling_price: '' });
                                }}
                                className="w-full text-gray-400 text-sm py-2 hover:text-gray-600"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </form>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search Created Products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border border-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-100 text-gray-600 placeholder-gray-400 transition-all"
                    />
                </div>

                {/* Product List */}
                <div className="space-y-4">
                    {isLoading ? (
                        // Skeletons
                        [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
                    ) : filteredProducts.length === 0 ? (
                        <EmptyState
                            icon={PackageX}
                            title="No products found"
                            description="Start by adding your first product using the form above."
                        />
                    ) : (
                        filteredProducts.map((product) => (
                            <div key={product.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 flex justify-between items-center group hover:shadow-md transition-shadow animate-scale-in">
                                <div className="space-y-1">
                                    <h3 className="font-serif font-bold text-gray-800 text-lg">{product.name}</h3>
                                    <div className="flex space-x-4 text-xs font-bold tracking-wide">
                                        <span className="text-gray-400">
                                            WHOLESALE: <span className="text-gray-600">Rs. {Number(product.cost_price).toFixed(2)}</span>
                                        </span>
                                        <span className="text-gray-400">
                                            RETAIL: <span className="text-pink-500">Rs. {Number(product.default_selling_price || 0).toFixed(2)}</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="w-9 h-9 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:bg-pink-50 hover:text-pink-500 transition-colors"
                                    >
                                        <PenLine size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="w-9 h-9 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Modal
                isOpen={!!isDeleting}
                onClose={() => setIsDeleting(null)}
                title="Confirm Deletion"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Are you sure you want to delete this product? This action cannot be undone.
                    </p>
                    <div className="flex space-x-3 justify-end">
                        <button
                            onClick={() => setIsDeleting(null)}
                            className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                        >
                            Delete Product
                        </button>
                    </div>
                </div>
            </Modal>

            <BottomNav />
        </div>
    );
};

const PackageIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
);

export default Products;
