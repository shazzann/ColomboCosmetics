import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const Settings = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md pt-4 pb-2 px-4 border-b border-gray-100">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-pink-500">Colombo Cosmetics</p>
                        <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Settings</h1>
                    </div>
                </div>
            </header>

            <main className="px-4 py-4 space-y-6">
                {/* User Profile */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xl">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{user?.name}</h2>
                            <p className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1">
                                {user?.role}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Account Actions */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Account</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 p-4 text-left hover:bg-red-50 transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 group-hover:bg-red-200 transition-colors">
                                <LogOut size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-red-600">Log Out</p>
                                <p className="text-[10px] text-gray-400">Sign out of your account</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* About Section */}
                <div className="space-y-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
                        <div className="text-center space-y-1">
                            <p className="text-sm font-bold text-gray-900">v1.0.0 </p>
                            <p className="text-[0.6rem] font-semibold text-gray-600">Powered By <span className='text-[0.95rem] font-semibold text-purple-600'>Shazion</span></p>
                            <p className="text-xs text-gray-400">© 2026 Colombo Cosmetics</p>
                            <p className="text-xs text-gray-400  border-t border-gray-100">Order management system for Colombo Cosmetics</p>
                        </div>
                    </div>
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default Settings;
