import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { statsAPI } from '../services/api';
import type { UserStats } from '../types';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Bar, Area, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Eye, DollarSign, Package, ArrowUpCircle, TrendingUp, Users, Target, Activity } from 'lucide-react';
import UpgradeWizard from '../components/vip/UpgradeWizard';
import { useTranslation } from 'react-i18next';
import { formatVND } from '../utils/currencyUtils';

const UserStatsPage = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [showUpgrade, setShowUpgrade] = useState(false);

    const { data: stats, isLoading } = useQuery({
        queryKey: ['userStats'],
        queryFn: async () => {
            const res = await statsAPI.getMyStats();
            return res.data as UserStats;
        },
    });

    if (isLoading) return <div className="p-12 text-center text-gray-500 animate-pulse">{t('stats.loading')}</div>;

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    const postStatusData = [
        { name: t('stats.status_active'), value: stats?.activePosts || 0 },
        { name: t('stats.status_sold'), value: stats?.soldPosts || 0 },
        { name: t('stats.status_vip'), value: stats?.vipPosts || 0 },
        { name: t('stats.status_other'), value: (stats?.totalPosts || 0) - (stats?.activePosts || 0) - (stats?.soldPosts || 0) }
    ].filter(i => i.value > 0);

    const formatCurrency = (val: number) => formatVND(val);

    return (
        <div className="w-full px-4 md:px-0 py-4 relative">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <Activity className="text-blue-600" size={32} />
                        {t('stats.dashboard_title')}
                    </h1>
                    <p className="text-gray-500 mt-1">{t('stats.dashboard_subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full w-fit">
                    <TrendingUp size={14} />
                    {t('stats.realtime_update')}
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
                                        <span className="text-amber-600 font-bold text-sm tracking-wider uppercase">{t('stats.premium_status')}</span>
                                        <span className="h-1 w-1 bg-amber-300 rounded-full"></span>
                                        <span className="text-gray-400 text-xs">{t('stats.member_type', { type: user.vip.vipType.toUpperCase() })}</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 mb-2">
                                        {user.vip.vipType}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                                        <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
                                            <span className="text-xs uppercase font-bold tracking-tight">{t('stats.expired_at')}:</span>
                                            {(() => {
                                                const end = new Date(user.vip.expiredAt || '');
                                                return end.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US');
                                            })()}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                                            <span className="text-xs uppercase font-bold tracking-tight">{t('stats.priority_level')}:</span>
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
                                    {t('stats.btn_upgrade')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* KPI Cards section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: t('stats.kpi_posts'), value: stats?.totalPosts, icon: Package, color: 'blue', desc: t('stats.kpi_posts_desc') },
                    { label: t('stats.kpi_views'), value: stats?.totalViews, icon: Eye, color: 'green', desc: t('stats.kpi_views_desc') },
                    { label: t('stats.kpi_leads'), value: stats?.totalLeads, icon: Users, color: 'purple', desc: t('stats.kpi_leads_desc') },
                    { label: t('stats.kpi_spent'), value: formatCurrency(stats?.totalSpent || 0), icon: DollarSign, color: 'red', desc: t('stats.kpi_spent_desc') },
                ].map((kpi, i) => {
                    const colorClasses: Record<string, string> = {
                        blue: 'bg-blue-50 text-blue-600',
                        green: 'bg-green-50 text-green-600',
                        purple: 'bg-purple-50 text-purple-600',
                        red: 'bg-red-50 text-red-600'
                    };
                    const currentColorClass = colorClasses[kpi.color] || 'bg-gray-50 text-gray-600';

                    return (
                        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 ${currentColorClass} rounded-2xl group-hover:scale-110 transition-transform`}>
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
                    );
                })}
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Activity Progress */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[450px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{t('stats.chart_interaction_trend')}</h3>
                            <p className="text-sm text-gray-500 font-medium">{t('stats.chart_interaction_subtitle')}</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" title={t('stats.kpi_posts')}></div>
                            <div className="w-3 h-3 rounded-full bg-emerald-500" title={t('stats.kpi_views')}></div>
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
                                    name={t('stats.kpi_posts')}
                                    dataKey="posts"
                                    fill="#3b82f6"
                                    radius={[6, 6, 6, 6]}
                                    barSize={12}
                                />
                                <Area
                                    type="monotone"
                                    name={t('stats.kpi_views')}
                                    dataKey="views"
                                    fill="url(#colorViewsNew)"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                />
                                <Area
                                    type="monotone"
                                    name={t('stats.kpi_leads')}
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
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{t('stats.chart_distribution_title')}</h3>
                        <p className="text-sm text-gray-500 font-medium">{t('stats.chart_distribution_subtitle')}</p>
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
                                        cornerRadius={8}
                                    >
                                        {postStatusData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-gray-900">{stats?.totalPosts || 0}</span>
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{t('stats.total_count')}</span>
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
