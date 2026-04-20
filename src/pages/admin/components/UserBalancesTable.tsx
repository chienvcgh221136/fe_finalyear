import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { pointService } from '../../../services/pointService';
import { Search, ArrowUpDown } from 'lucide-react';
import AdjustPointsModal from '../../../components/modals/AdjustPointsModal';
import { useToast } from '../../../context/ToastContext';

const UserBalancesTable = () => {
    const { t } = useTranslation();
    const { success, error } = useToast();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<'asc' | 'desc'>('desc');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

    const ITEMS_PER_PAGE = 20;
    const { data, isLoading } = useQuery({
        queryKey: ['users-points', page, search, sort],
        queryFn: () => pointService.getUsersWithPoints({ page, limit: ITEMS_PER_PAGE, search, sort }),
        placeholderData: keepPreviousData
    });

    const adjustMutation = useMutation({
        mutationFn: pointService.adjustUserPoints,
        onSuccess: (res: any) => {
            success(res.message);
            setIsAdjustModalOpen(false);
            setSelectedUser(null);
            queryClient.invalidateQueries({ queryKey: ['users-points'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

        },
        onError: (err: any) => {
            error(err.response?.data?.message || t('admin.common.error'));
        }
    });

    const handleOpenAdjust = (user: any) => {
        setSelectedUser(user);
        setIsAdjustModalOpen(true);
    };

    const handleConfirmAdjust = (amount: number, description: string, penaltyLevel?: number) => {
        if (!selectedUser) return;
        adjustMutation.mutate({
            userId: selectedUser._id,
            amount,
            description,
            penaltyLevel
        });
    };

    const users = (data as any)?.data || [];
    const pagination = (data as any)?.pagination;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900">{t('admin.points.tab_users')}</h2>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('admin.common.search')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none w-64"
                        />
                    </div>

                    <button
                        onClick={() => setSort(prev => prev === 'desc' ? 'asc' : 'desc')}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 text-sm"
                    >
                        <ArrowUpDown size={16} />
                        {sort === 'desc' ? t('admin.common.filter') : t('admin.common.filter')}
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('admin.users.title')}</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('auth.phone')}</th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('admin.reports.table_bad_post')}</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('admin.common.points')}</th>

                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('admin.common.status')}</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('admin.common.action')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-10 bg-gray-100 rounded-full w-10"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                    <td className="px-6 py-4 text-center"><div className="h-6 bg-gray-100 rounded-full w-6 mx-auto"></div></td>
                                    <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-100 rounded w-24 ml-auto"></div></td>
                                    <td className="px-6 py-4 text-center"><div className="h-6 bg-gray-100 rounded-full w-20 mx-auto"></div></td>
                                    <td className="px-6 py-4 text-right"><div className="h-8 bg-gray-100 rounded w-24 ml-auto"></div></td>
                                </tr>
                            ))
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    {t('admin.common.no_data')}
                                </td>
                            </tr>
                        ) : (
                            users.map((user: any) => (
                                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
                                                alt={user.name}
                                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                            />
                                            <div>
                                                <div className="font-semibold text-gray-900">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                     <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600">
                                            {user.phone || <span className="text-gray-400 italic font-light">{t('common.none', { defaultValue: 'chưa có' })}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${user.violationCount >= 5 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                            {user.violationCount || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="font-bold text-gray-900">{user.points?.toLocaleString()}</div>
                                        {/* Optional: Show badges/icons */}
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isBanned
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-green-100 text-green-800'
                                            }`}>
                                            {user.isBanned ? t('admin.users.status_banned') : t('stats.status_active')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* History Button - Ideally links to Logs filtered by this user */}
                                            {/* For now, maybe just a placeholder or link */}
                                            {/* <button className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition" title="Lịch sử">
                                                <History size={18} />
                                            </button> */}

                                            <button
                                                onClick={() => handleOpenAdjust(user)}
                                                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-xs font-bold font-medium"
                                            >
                                                {t('admin.common.points')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination UI - Minimal Style */}
            {pagination && (
                <div className="border-t border-gray-100 p-6 flex justify-center items-center gap-8 bg-white">
                    <button
                        onClick={() => {
                            setPage(p => Math.max(1, p - 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={page === 1}
                        className="text-sm font-medium transition-colors disabled:text-gray-300 text-blue-600 hover:text-blue-700"
                    >
                        {t('admin.common.prev', { defaultValue: 'Trang trước' })}
                    </button>
                    <span className="text-sm font-medium text-gray-500">
                        {t('admin.common.page_display', { defaultValue: 'Hiển thị trang' })} {pagination.current} / {pagination.total}
                    </span>
                    <button
                        onClick={() => {
                            setPage(p => Math.min(pagination.total, p + 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={page >= pagination.total}
                        className="text-sm font-medium transition-colors disabled:text-gray-300 text-blue-600 hover:text-blue-700"
                    >
                        {t('admin.common.next', { defaultValue: 'Trang sau' })}
                    </button>
                </div>
            )}

            <AdjustPointsModal
                key={isAdjustModalOpen ? (selectedUser?._id || 'open') : 'closed'}
                isOpen={isAdjustModalOpen}
                onClose={() => setIsAdjustModalOpen(false)}
                onConfirm={handleConfirmAdjust}
                user={selectedUser}
                isLoading={adjustMutation.isPending}
            />
        </div>
    );
};

export default UserBalancesTable;
