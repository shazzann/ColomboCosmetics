import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, PlusCircle, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
    const location = useLocation();
    const path = location.pathname;
    const { user } = useAuth();
    const role = user?.role;

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/', allowed: ['ADMIN'] },
        { name: 'Orders', icon: ShoppingCart, path: '/orders', allowed: ['ADMIN', 'STAFF'] },
        { name: 'Create', icon: PlusCircle, path: '/orders/new', allowed: ['ADMIN', 'STAFF'] },
        { name: 'Products', icon: Package, path: '/products', allowed: ['ADMIN', 'STAFF'] },
        { name: 'Reports', icon: FileText, path: '/reports', allowed: ['ADMIN'] },
    ];

    const filteredNavItems = navItems.filter(item => item.allowed.includes(role || ''));

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 pb-6 flex justify-between items-center z-50">
            {filteredNavItems.map((item) => {
                // Exact match for specific paths, prefix match for others
                const isActive = item.path === '/'
                    ? path === '/'
                    : item.path === '/orders/new'
                        ? path === '/orders/new'
                        : item.path === '/orders'
                            ? path === '/orders' || (path.startsWith('/orders') && path !== '/orders/new')
                            : path.startsWith(item.path);

                const isCreate = item.name === 'Create';

                return (
                    <Link
                        key={item.name}
                        to={item.path}
                        className={`flex flex-col items-center space-y-1 ${
                            isCreate
                                ? 'text-white -mt-5'
                                : isActive ? 'text-[#f53d87]' : 'text-gray-400'
                        }`}
                    >
                        {isCreate ? (
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                                isActive ? 'bg-[#f53d87]' : 'bg-[#f53d87]/90'
                            }`}>
                                <item.icon size={24} strokeWidth={2} className="text-white" />
                            </div>
                        ) : (
                            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        )}
                        <span className={`text-[10px] font-medium uppercase tracking-wide ${
                            isCreate ? 'text-[#f53d87]' : ''
                        }`}>
                            {item.name}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
};

export default BottomNav;
