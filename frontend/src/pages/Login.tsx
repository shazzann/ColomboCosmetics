import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import logo from '../assets/logo.png';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, role, name } = response.data;
            login(token, { name, role }, rememberMe);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-white px-4">
            {/* Logo Section */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
                </div>
                <h1 className="text-3xl font-serif text-gray-800 mb-1">Colombo Cosmetics</h1>
                <p className="text-xs tracking-[0.2em] text-pink-500 font-semibold uppercase">
                    Order Management System
                </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400 transition-all"
                            required
                        />
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400 transition-all pr-12"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-300 hover:text-pink-500 transition-colors"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 px-1">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="sr-only"
                            />
                            <div
                                className={`w-10 h-6 bg-gray-200 rounded-full shadow-inner transition-colors duration-300 ${rememberMe ? 'bg-pink-400' : ''
                                    }`}
                            ></div>
                            <div
                                className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${rememberMe ? 'translate-x-4' : ''
                                    }`}
                            ></div>
                        </div>
                        <span>Remember me</span>
                    </label>
                    {/* <button type="button" className="text-pink-500 hover:text-pink-600 font-medium">
                        Forgot Password?
                    </button> */}
                </div>

                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#FF3385] to-[#FF6B9E] text-white font-semibold py-4 rounded-2xl shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
                >
                    <span>Sign In</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                    </svg>
                </button>

                <p className="text-center text-xs text-gray-400 mt-8">
                    Access restricted to authorized personnel only.
                </p>
            </form>

            {/* Footer */}
            <div className="absolute bottom-8 flex flex-col items-center space-y-4">
                <div className="flex space-x-4">
                    {/* Simple icon placeholders */}
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-300">
                        L
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-yellow-200">
                        k
                    </div>
                </div>
                <p className="text-[10px] text-gray-300 tracking-wide">
                    © 2024 COLOMBO COSMETICS V2.4.0
                </p>
            </div>
        </div>
    );
};

export default Login;
