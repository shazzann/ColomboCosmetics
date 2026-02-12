import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const Dashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-pink-50/30 p-4">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif text-gray-800">Hello, {user?.name.split(' ')[0]}</h1>
                    <p className="text-sm text-gray-500">Welcome back to Colombo Cosmetics</p>
                </div>
                <button
                    onClick={logout}
                    className="p-2 bg-white rounded-full shadow-sm text-pink-500 hover:bg-pink-50 transition-colors"
                >
                    <LogOut size={20} />
                </button>
            </header>

            <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-pink-50 p-4 rounded-2xl">
                        <p className="text-xs text-gray-500 mb-1">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-800">42</p>
                    </div>
                    <div className="bg-pink-50 p-4 rounded-2xl">
                        <p className="text-xs text-gray-500 mb-1">Today's Sales</p>
                        <p className="text-2xl font-bold text-gray-800">$1,240</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 px-2">Recent Activity</h2>
                {/* Placeholder list */}
                {[1, 2, 3].map((item) => (
                    <div key={item} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center">
                        <div>
                            <p className="font-medium text-gray-800">Order #102{item}</p>
                            <p className="text-xs text-gray-500">2 hours ago</p>
                        </div>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                            Pending
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
