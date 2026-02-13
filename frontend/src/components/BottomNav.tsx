import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Settings } from 'lucide-react';

const BottomNav = () => {
    const location = useLocation();
    const path = location.pathname;

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Products', icon: Package, path: '/products' },
        { name: 'Orders', icon: ShoppingCart, path: '/orders' },
        { name: 'Settings', icon: Settings, path: '/settings' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 pb-6 flex justify-between items-center z-50">
            {navItems.map((item) => {
                const isActive = path === item.path;
                return (
                    <Link
                        key={item.name}
                        to={item.path}
                        className={`flex flex-col items-center space-y-1 ${isActive ? 'text-pink-500' : 'text-gray-400'
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
