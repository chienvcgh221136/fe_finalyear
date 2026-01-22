import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { statsAPI } from '../services/api';
import type { UserStats } from '../types';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LayoutDashboard, Eye, MessageSquare, DollarSign, Package } from 'lucide-react';

const UserStatsPage = () => {
    const { user } = useAuth();
    const { data: stats, isLoading } = useQuery({
        queryKey: ['userStats'],
        queryFn: async () => {
            const res = await statsAPI.getMyStats();
            return res.data as UserStats;
        },
    });

    if (isLoading) return <div className="p-12 text-center text-gray-500">Đang tải thống kê...</div>;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const postStatusData = [
        { name: 'Đang hiển thị', value: stats?.activePosts || 0 },
        { name: 'Đã bán', value: stats?.soldPosts || 0 },
        { name: 'VIP', value: stats?.vipPosts || 0 },
        { name: 'Khác', value: (stats?.totalPosts || 0) - (stats?.activePosts || 0) - (stats?.soldPosts || 0) }
    ].filter(i => i.value > 0);

    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <h1 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-3">
                <LayoutDashboard className="text-blue-600" size={32} />
                Thống kê hoạt động
            </h1>

            {/* VIP Status Card */}
            {user?.vip?.isActive && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-6 mb-8 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Package size={100} />
                    </div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-amber-100 font-medium text-sm mb-1">Gói thành viên hiện tại</p>
                            <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                                <span className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">👑</span>
                                {user.vip.vipType}
                            </h2>
                            <p className="text-sm opacity-90">
                                Hết hạn: <span className="font-bold">{new Date(user.vip.expiredAt || '').toLocaleDateString('vi-VN')}</span>
                                <span className="mx-2">•</span>
                                Chỉ số ưu tiên: <span className="font-bold">{user.vip.priorityScore}</span>
                            </p>
                        </div>
                        <button className="bg-white text-orange-600 px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-orange-50 transition-colors">
                            Nâng cấp
                        </button>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Package size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tin đăng</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.totalPosts}</div>
                    <p className="text-sm text-gray-500">Tổng số tin đã đăng</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <Eye size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lượt xem</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.totalViews}</div>
                    <p className="text-sm text-gray-500">Tổng lượt tiếp cận</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <MessageSquare size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Leads</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.totalLeads}</div>
                    <p className="text-sm text-gray-500">Khách hàng quan tâm</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chi tiêu</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats?.totalSpent || 0)}</div>
                    <p className="text-sm text-gray-500">Tổng tiền mua VIP / Đẩy tin</p>
                </div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Trạng thái tin đăng</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={postStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {postStatusData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value?: number) => [value || 0, 'Tin']} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-4 flex-wrap">
                        {postStatusData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-sm text-gray-600">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Placeholder Activity Chart (Can be replaced with real timeseries data if backend supports it) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-50 p-6 rounded-full mb-4">
                        <LayoutDashboard className="text-gray-300" size={48} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Biểu đồ tăng trưởng</h3>
                    <p className="text-gray-500 max-w-xs">Dữ liệu chi tiết theo thời gian sẽ sớm được cập nhật trong phiên bản tiếp theo.</p>
                </div>
            </div>
        </div>
    );
};

export default UserStatsPage;
