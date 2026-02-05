import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Package, Home, Building2, User, LogOut, PlusCircle, MessageCircle, Shield, CreditCard, Crown, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { chatAPI } from '../services/api';
import NotificationDropdown from './notifications/NotificationDropdown';
import { useToast } from '../context/ToastContext';

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { success } = useToast();

    // Fetch unread messages count
    const { data: chatsData } = useQuery({
        queryKey: ['chats'],
        queryFn: chatAPI.getMyChats,
        enabled: !!isAuthenticated && !!user,
        refetchInterval: 5000, // Check every 5 seconds
        retry: false,
    });

    const unreadCount = chatsData?.data?.chats?.reduce((acc: number, chat: any) => acc + (chat.unreadCount || 0), 0) || 0;

    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
        success('Đăng xuất thành công!');
    };

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="w-full px-4 md:px-8 h-[72px] flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                        <Package size={24} />
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">EstateMarket</span>
                </Link>

                {/* Centered Navigation */}
                <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                    <Link to="/buy" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition-colors">
                        <Home size={18} />
                        <span>Mua bán</span>
                    </Link>
                    <Link to="/rent" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition-colors">
                        <Building2 size={18} />
                        <span>Cho thuê</span>
                    </Link>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-6">
                    {isAuthenticated ? (
                        // Logged In State
                        <div className="flex items-center gap-4">
                            <Link to="/post-ad" className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all shadow-lg shadow-blue-600/20">
                                <PlusCircle size={18} />
                                <span className="hidden md:inline">Đăng tin</span>
                            </Link>

                            <NotificationDropdown />

                            <Link to="/chat" className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors relative">
                                <MessageCircle size={24} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </Link>

                            {/* User Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className={`w-10 h-10 rounded-full ${user?.avatar ? '' : 'bg-blue-100 text-blue-600'} font-bold flex items-center justify-center border-2 ${user?.vip?.isActive ? 'border-amber-400 ring-2 ring-amber-100' : 'border-white'} shadow-sm hover:ring-2 hover:ring-blue-100 transition-all focus:outline-none overflow-visible relative`}
                                >
                                    {user?.vip?.isActive && (
                                        <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-white rounded-full p-0.5 border-2 border-white shadow-sm z-10">
                                            <Crown size={10} fill="currentColor" />
                                        </div>
                                    )}
                                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            user?.name?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                </button>

                                {isDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10 cursor-default"
                                            onClick={() => setIsDropdownOpen(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-100">
                                            {/* Header */}
                                            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full ${user?.avatar ? '' : 'bg-blue-600 text-white'} font-bold flex items-center justify-center shrink-0 border-2 ${user?.vip?.isActive ? 'border-amber-400' : 'border-transparent'} relative`}>
                                                    {user?.vip?.isActive && (
                                                        <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-white rounded-full p-0.5 border-2 border-white shadow-sm z-10">
                                                            <Crown size={10} fill="currentColor" />
                                                        </div>
                                                    )}
                                                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                                                        {user?.avatar ? (
                                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            user?.name?.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-bold text-gray-900 truncate">{user?.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                                </div>
                                            </div>

                                            {/* Links */}
                                            <div className="py-2">
                                                <Link
                                                    to="/profile"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    <User size={18} />
                                                    Tài khoản
                                                </Link>
                                                <Link
                                                    to="/profile?tab=wallet"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    <CreditCard size={18} />
                                                    Ví của tôi
                                                </Link>
                                                <Link
                                                    to={`/user/${user?._id}`}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    <User size={18} />
                                                    Trang của tôi (Public)
                                                </Link>
                                                <Link
                                                    to="/profile?tab=stats"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    <BarChart2 size={18} />
                                                    Thống kê
                                                </Link>
                                                {user?.role === 'ADMIN' && (
                                                    <Link
                                                        to="/admin"
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                                        onClick={() => setIsDropdownOpen(false)}
                                                    >
                                                        <Shield size={18} />
                                                        Quản trị viên
                                                    </Link>
                                                )}
                                            </div>

                                            {/* Footer */}
                                            <div className="border-t border-gray-100 mt-1 pt-1">
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <LogOut size={18} />
                                                    Đăng xuất
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Guest State
                        <>
                            <Link to="/post-ad" className="hidden md:block text-gray-900 font-bold hover:text-blue-600 transition-colors">
                                Đăng tin
                            </Link>
                            <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
                            <Link to="/login" className="font-bold text-gray-700 hover:text-blue-600 transition-colors">
                                Đăng nhập
                            </Link>
                            <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-all shadow-lg shadow-blue-600/20">
                                Đăng ký
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
