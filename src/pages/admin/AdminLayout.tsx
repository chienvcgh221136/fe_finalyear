
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FileText, Users, LogOut, Menu, X, Flag, BarChart3, Home, Crown, Wallet, Coins, Bell
} from 'lucide-react';

const navItems = [
    { label: 'Tổng quan', href: '/admin', icon: BarChart3 },
    { label: 'Duyệt tin', href: '/admin/posts', icon: FileText },
    { label: 'Người dùng', href: '/admin/users', icon: Users },
    { label: 'Gói VIP', href: '/admin/vip', icon: Crown },
    { label: 'Rút tiền', href: '/admin/withdrawals', icon: Wallet },
    { label: 'Điểm thưởng', href: '/admin/points', icon: Coins },
    { label: 'Thông báo', href: '/admin/notifications', icon: Bell },
    { label: 'Báo cáo', href: '/admin/reports', icon: Flag },
];

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white transition-transform md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } flex flex-col`}
            >
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-6">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                            <Home className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold text-gray-900 text-lg">Admin</span>
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-200">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="shrink-0 border-t border-gray-200 p-4 bg-gray-50/50">
                    <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium border border-transparent hover:border-red-100"
                    >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8 shadow-sm">
                    <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600">
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="hidden md:block">
                        <h1 className="text-xl font-bold text-gray-800">
                            {navItems.find((item) => item.href === location.pathname)?.label || 'Tổng quan'}
                        </h1>
                    </div>

                    <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
                        Về trang chủ
                    </Link>
                </header>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-auto bg-gray-50 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default AdminLayout;
