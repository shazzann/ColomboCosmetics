import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Settings, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
    const location = useLocation();
    const path = location.pathname;
    const { user } = useAuth();
    const role = user?.role;

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/', allowed: ['ADMIN'] },
        { name: 'Orders', icon: ShoppingCart, path: '/orders', allowed: ['ADMIN', 'STAFF'] },
        { name: 'Products', icon: Package, path: '/products', allowed: ['ADMIN', 'STAFF'] },
        { name: 'Reports', icon: FileText, path: '/reports', allowed: ['ADMIN'] },
        { name: 'Settings', icon: Settings, path: '/settings', allowed: ['ADMIN', 'STAFF'] },
    ];

    const filteredNavItems = navItems.filter(item => item.allowed.includes(role || ''));

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 pb-6 flex justify-between items-center z-50">
            {filteredNavItems.map((item) => {
                // Improved active check to handle sub-routes (e.g., /orders/new highlights Orders)
                const isActive = item.path === '/'
                    ? path === '/'
                    : path.startsWith(item.path);

                return (
                    <Link
                        key={item.name}
                        to={item.path}
                        className={`flex flex-col items-center space-y-1 ${isActive ? 'text-[#f53d87]' : 'text-gray-400'
                            }`}
                    >
                        <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[10px] font-medium uppercase tracking-wide">
                            {item.name}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
};

export default BottomNav;
