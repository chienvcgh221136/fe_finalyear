import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { statsAPI } from '../services/api';
import type { UserStats } from '../types';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Bar, Area, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { LayoutDashboard, Eye, MessageSquare, DollarSign, Package, ArrowUpCircle, TrendingUp, Users, Target, Activity } from 'lucide-react';
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

    if (isLoading) return <div className="p-12 text-center text-gray-500 animate-pulse">Đang tải dữ liệu phân tích...</div>;

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    const postStatusData = [
        { name: 'Đang hiển thị', value: stats?.activePosts || 0 },
        { name: 'Đã bán', value: stats?.soldPosts || 0 },
        { name: 'VIP', value: stats?.vipPosts || 0 },
        { name: 'Khác', value: (stats?.totalPosts || 0) - (stats?.activePosts || 0) - (stats?.soldPosts || 0) }
    ].filter(i => i.value > 0);

    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    return (
        <div className="w-full px-4 md:px-0 py-4 relative">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <Activity className="text-blue-600" size={32} />
                        Bảng điều khiển phân tích
                    </h1>
                    <p className="text-gray-500 mt-1">Theo dõi hiệu quả đăng tin và tương tác khách hàng của bạn.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full w-fit">
                    <TrendingUp size={14} />
                    Cập nhật thời gian thực
                </div>
            </div>

            {/* VIP Status Card - Enhanced Premium Look */}
            {user?.vip?.isActive && (
                <div className="relative group mb-10">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-white rounded-2xl p-8 shadow-sm border border-amber-100 overflow-hidden">
                        {/* Background subtle pattern */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-50 rounded-full blur-3xl opacity-50"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-200 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                    <Target size={40} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-amber-600 font-bold text-sm tracking-wider uppercase">Premium Status</span>
                                        <span className="h-1 w-1 bg-amber-300 rounded-full"></span>
                                        <span className="text-gray-400 text-xs">{user.vip.vipType.toUpperCase()} Member</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 mb-2">
                                        {user.vip.vipType}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                                        <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
                                            <span className="text-xs uppercase font-bold tracking-tight">Hết hạn:</span>
                                            {(() => {
                                                const end = new Date(user.vip.expiredAt || '');
                                                return end.toLocaleDateString('vi-VN');
                                            })()}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                                            <span className="text-xs uppercase font-bold tracking-tight">Priority Level:</span>
                                            {user.vip.priorityScore}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {user.vip.vipType !== 'PREMIUM' && (
                                <button
                                    onClick={() => setShowUpgrade(true)}
                                    className="w-full md:w-auto px-8 py-4 bg-gray-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <ArrowUpCircle size={22} className="text-amber-400" />
                                    Nâng cấp ngay
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* KPI Cards section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Tin đăng', value: stats?.totalPosts, icon: Package, color: 'blue', desc: 'Tổng số tin đã đăng' },
                    { label: 'Lượt xem', value: stats?.totalViews, icon: Eye, color: 'green', desc: 'Tổng lượt tiếp cận' },
                    { label: 'Tiếp cận', value: stats?.totalLeads, icon: Users, color: 'purple', desc: 'Khách hàng quan tâm' },
                    { label: 'Chi tiêu', value: formatCurrency(stats?.totalSpent || 0), icon: DollarSign, color: 'red', desc: 'Tổng chi phí dịch vụ' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 bg-${kpi.color}-50 text-${kpi.color}-600 rounded-2xl group-hover:scale-110 transition-transform`}>
                                <kpi.icon size={24} />
                            </div>
                            <TrendingUp size={16} className="text-gray-300" />
                        </div>
                        <div className="text-3xl font-black text-gray-900 mb-1">{kpi.value}</div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
                        <div className="mt-4 pt-4 border-t border-gray-50">
                            <p className="text-xs text-gray-500 italic">{kpi.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Activity Progress */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[450px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Xu hướng tương tác</h3>
                            <p className="text-sm text-gray-500 font-medium">Hoạt động trong 7 ngày gần nhất</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" title="Tin đăng"></div>
                            <div className="w-3 h-3 rounded-full bg-emerald-500" title="Lượt xem"></div>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={stats?.chartData || []}>
                                <defs>
                                    <linearGradient id="colorViewsNew" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                                    dy={15}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                    cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }}
                                />
                                <Bar
                                    name="Tin đăng"
                                    dataKey="posts"
                                    fill="#3b82f6"
                                    radius={[6, 6, 6, 6]}
                                    barSize={12}
                                />
                                <Area
                                    type="monotone"
                                    name="Lượt xem"
                                    dataKey="views"
                                    fill="url(#colorViewsNew)"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                />
                                <Area
                                    type="monotone"
                                    name="Leads"
                                    dataKey="leads"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fill="none"
                                    strokeDasharray="5 5"
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution Chart */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[450px]">
                    <div className="mb-8">
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Phân bổ tin đăng</h3>
                        <p className="text-sm text-gray-500 font-medium">Tỷ lệ theo trạng thái hiển thị</p>
                    </div>
                    <div className="flex-1 flex flex-col md:flex-row items-center gap-8 min-h-0">
                        <div className="flex-1 w-full h-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={postStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {postStatusData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-gray-900">{stats?.totalPosts || 0}</span>
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Tông cộng</span>
                            </div>
                        </div>
                        <div className="w-full md:w-32 space-y-4">
                            {postStatusData.map((entry, index) => (
                                <div key={index} className="flex flex-col">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{entry.name}</span>
                                    </div>
                                    <span className="text-xl font-black text-gray-900 pl-4">{entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer space */}
            <div className="h-12"></div>

            {/* Upgrade Modal */}
            {showUpgrade && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
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
