import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pointsAPI } from '../../services/api';
import { Coins, ArrowUpRight, ArrowDownLeft, Package, Users, History } from 'lucide-react';
import UserBalancesTable from './components/UserBalancesTable';
import PointTransactionsTable from './components/PointTransactionsTable';

const AdminPoints = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'history'>('users');

    // Fetch stats
    const { data: statsData } = useQuery({
        queryKey: ['admin', 'point-stats'],
        queryFn: () => pointsAPI.getAdminStats(),
        select: (res) => res.data.data
    });

    const stats = [
        {
            label: 'Tổng điểm hệ thống',
            value: statsData?.totalAvailable || 0,
            icon: Coins,
            color: 'bg-yellow-50 text-yellow-600',
        },
        {
            label: 'Tổng điểm đã cấp',
            value: statsData?.totalDistributed || 0,
            icon: ArrowDownLeft,
            color: 'bg-green-50 text-green-600',
        },
        {
            label: 'Tổng điểm đã đổi',
            value: statsData?.totalRedeemed || 0,
            icon: ArrowUpRight,
            color: 'bg-red-50 text-red-600',
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý điểm thưởng</h1>
                <p className="text-gray-500">Quản lý các gói dịch vụ và theo dõi điểm của người dùng.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                            </div>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeTab === 'users'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <Users size={18} />
                        Quản lý Người dùng
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeTab === 'history'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <History size={18} />
                        Lịch sử Giao dịch
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="animate-fade-in">
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <UserBalancesTable />
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-6">
                        <PointTransactionsTable />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPoints;
