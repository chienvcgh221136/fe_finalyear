import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { statsAPI } from '../services/api';
import type { UserStats } from '../types';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Bar, Area, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { LayoutDashboard, Eye, MessageSquare, DollarSign, Package, ArrowUpCircle } from 'lucide-react';
import UpgradeWizard from '../components/vip/UpgradeWizard';

const UserStatsPage = () => {
    const { user } = useAuth();
    const [showUpgrade, setShowUpgrade] = useState(false);

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
        <div className="w-full px-4 md:px-8 py-8 relative">
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
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
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
                        {user.vip.vipType !== 'PREMIUM' && (
                            <button
                                onClick={() => setShowUpgrade(true)}
                                className="px-6 py-3 bg-white text-orange-600 font-bold rounded-xl shadow-lg hover:bg-orange-50 transition transform hover:-translate-y-1 flex items-center gap-2"
                            >
                                <ArrowUpCircle size={20} />
                                Nâng cấp gói
                            </button>
                        )}
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

                {/* Activity Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <LayoutDashboard size={20} className="text-blue-500" />
                        Hoạt động 7 ngày qua
                    </h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <ComposedChart data={stats?.chartData || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#666', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#666', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            <Bar
                                name="Tin đăng"
                                dataKey="posts"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                            <Area
                                type="monotone"
                                name="Lượt xem"
                                dataKey="views"
                                fill="url(#colorViews)"
                                stroke="#10b981"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                name="Leads"
                                dataKey="leads"
                                fill="none"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                            />
                            <defs>
                                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Upgrade Modal */}
            {showUpgrade && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <UpgradeWizard
                        onClose={() => setShowUpgrade(false)}
                        onSuccess={() => setShowUpgrade(false)}
                    />
                </div>
            )}
        </div>
    );
};

export default UserStatsPage;
