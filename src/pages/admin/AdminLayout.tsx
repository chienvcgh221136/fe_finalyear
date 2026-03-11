import { useState, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LocalizedLink from '../../components/common/LocalizedLink';
import {
    FileText, Users, LogOut, Menu, X, Flag, BarChart3, Home, Crown, Wallet, Coins, Bell
} from 'lucide-react';

const AdminLayout = () => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navItems = useMemo(() => [
        { label: t('admin.menu_overview'), href: '/admin', icon: BarChart3 },
        { label: t('admin.menu_posts'), href: '/admin/posts', icon: FileText },
        { label: t('admin.menu_users'), href: '/admin/users', icon: Users },
        { label: t('admin.menu_vip'), href: '/admin/vip', icon: Crown },
        { label: t('admin.menu_withdrawals'), href: '/admin/withdrawals', icon: Wallet },
        { label: t('admin.menu_points'), href: '/admin/points', icon: Coins },
        { label: t('admin.menu_notifications'), href: '/admin/notifications', icon: Bell },
        { label: t('admin.menu_reports'), href: '/admin/reports', icon: Flag },
    ], [t]);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white transition-transform md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } flex flex-col`}
            >
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-6">
                    <LocalizedLink to="/" className="flex items-center gap-2" lg-checked="true">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                            <Home className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold text-gray-900 text-lg">Admin</span>
                    </LocalizedLink>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-200">
                    {navItems.map((item) => {
                        // Check active status by stripping the language prefix from location.pathname
                        const pathWithoutLang = location.pathname.replace(/^\/(vi|en)/, '') || '/';
                        const isActive = pathWithoutLang === item.href || (pathWithoutLang === '' && item.href === '/admin');

                        return (
                            <LocalizedLink
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
                            </LocalizedLink>
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
                        {t('navbar.logout')}
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
                            {navItems.find((item) => {
                                const pathWithoutLang = location.pathname.replace(/^\/(vi|en)/, '') || '/';
                                return pathWithoutLang === item.href;
                            })?.label || t('admin.menu_overview')}
                        </h1>
                    </div>

                    <LocalizedLink to="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
                        {t('admin.back_to_site')}
                    </LocalizedLink>
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
