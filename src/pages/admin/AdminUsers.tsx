import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../../services/api';
import type { User } from '../../types';
import {
    Search, Filter, Ban,
    UserPlus, Users, ShieldCheck, ChevronDown, AlertTriangle, Trash2
} from 'lucide-react';

const AdminUsers = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All Roles'); // 'All Roles', 'ADMIN', 'USER'
    const [statusFilter, setStatusFilter] = useState('Status'); // 'Status', 'Active', 'Banned'

    const { data: users, isLoading } = useQuery({
        queryKey: ['admin', 'users'],
        queryFn: () => usersAPI.getAll(),
        select: (res) => res.data.data as User[],
    });

    const banMutation = useMutation({
        mutationFn: (userId: string) => usersAPI.ban(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            alert(t('admin.common.update_success'));
        },
        onError: () => {
            alert(t('admin.common.error'));
        },
    });

    const unbanMutation = useMutation({
        mutationFn: (userId: string) => usersAPI.unban(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            alert(t('admin.common.update_success'));
        },
        onError: () => {
            alert(t('admin.common.error'));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (userId: string) => usersAPI.delete(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            alert(t('admin.common.update_success'));
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || t('admin.common.error'));
        },
    });

    const [confirmModal, setConfirmModal] = useState<{ open: boolean; userId: string | null }>({
        open: false,
        userId: null,
    });

    const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ open: boolean; userId: string | null }>({
        open: false,
        userId: null,
    });

    const handleConfirmBan = () => {
        if (confirmModal.userId) {
            banMutation.mutate(confirmModal.userId);
            setConfirmModal({ open: false, userId: null });
        }
    };

    const handleConfirmDelete = () => {
        if (deleteConfirmModal.userId) {
            deleteMutation.mutate(deleteConfirmModal.userId);
            setDeleteConfirmModal({ open: false, userId: null });
        }
    };

    // Derived Stats
    const totalUsers = users?.length || 0;
    const activeUsers = users?.filter(u => !u.isBanned).length || 0;
    const bannedUsers = users?.filter(u => u.isBanned).length || 0;

    // Growth Calculation (New users this month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const usersThisMonth = users?.filter(u => u.createdAt && new Date(u.createdAt).getTime() >= startOfMonth.getTime()).length || 0;

    // Filter Logic
    const filteredUsers = users?.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === 'All Roles' || user.role === roleFilter;

        const matchesStatus = statusFilter === 'Status'
            ? true
            : statusFilter === 'Active' ? !user.isBanned : user.isBanned;

        return matchesSearch && matchesRole && matchesStatus;
    });

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans text-slate-800">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('admin.users.title')}</h1>
                    <p className="text-slate-500 mt-1 text-sm">{t('admin.users.stat_active')}: {activeUsers}</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-blue-200">
                    <UserPlus size={18} />
                    {t('admin.users.btn_add')}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.users.stat_total')}</p>
                        <p className="text-3xl font-bold text-slate-900 mt-3">{totalUsers.toLocaleString()}</p>
                        <p className="text-xs font-medium text-green-600 mt-2 flex items-center gap-1">
                            <span>↗</span> +{usersThisMonth} {t('common.month').toLowerCase()}
                        </p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Users size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.users.stat_active')}</p>
                        <p className="text-3xl font-bold text-slate-900 mt-3">{activeUsers.toLocaleString()}</p>
                        <p className="text-xs font-medium text-slate-500 mt-2">
                            {(totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(1) : 0)}% {t('admin.common.all').toLowerCase()}
                        </p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <ShieldCheck size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('auth.password_strength.very_weak')}</p>
                        <p className="text-3xl font-bold text-slate-900 mt-3">{bannedUsers.toLocaleString()}</p>
                        <p className="text-xs font-medium text-slate-500 mt-2">
                            {(totalUsers > 0 ? (bannedUsers / totalUsers * 100).toFixed(1) : 0)}% {t('admin.common.all').toLowerCase()}
                        </p>
                    </div>
                    <div className="p-3 bg-red-50 text-red-500 rounded-lg">
                        <Ban size={24} />
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                {/* Filters */}
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('admin.common.search')}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative">
                            <select
                                className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium py-2.5 pl-4 pr-10 rounded-lg cursor-pointer hover:border-slate-300 focus:outline-none focus:border-blue-500"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="All Roles">{t('admin.users.table_role')}</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="USER">USER</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        </div>

                        <div className="relative">
                            <select
                                className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium py-2.5 pl-4 pr-10 rounded-lg cursor-pointer hover:border-slate-300 focus:outline-none focus:border-blue-500"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="Status">{t('admin.common.status')}</option>
                                <option value="Active">{t('stats.status_active')}</option>
                                <option value="Banned">{t('auth.password_strength.very_weak')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        </div>
                    </div>

                    <div className="hidden sm:block text-sm text-slate-500 font-medium ml-auto">
                        {t('admin.common.showing_of', { count: filteredUsers?.length || 0, total: totalUsers })}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.users.title')}</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">EMAIL</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.users.table_role')}</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.common.status')}</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('admin.common.action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers && filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                                    alt={user.name}
                                                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                                />
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                                                    <p className="text-xs text-slate-400 font-mono mt-0.5">ID: #USR-{user._id?.slice(-4).toUpperCase() || '????'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                                            {user.email}
                                        </td>
                                        <td className="py-4 px-6">
                                            {user.role === 'ADMIN' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700">
                                                    ADMIN
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">
                                                    USER
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${user.isBanned ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                                <span className={`text-sm font-medium ${user.isBanned ? 'text-red-500' : 'text-slate-600'}`}>
                                                    {user.isBanned ? t('auth.password_strength.very_weak') : t('stats.status_active')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-4">
                                                {user.role !== 'ADMIN' && user._id && (
                                                    <button
                                                        onClick={() => user._id && (user.isBanned ? unbanMutation.mutate(user._id) : setConfirmModal({ open: true, userId: user._id }))}
                                                        className={`text-xs font-bold flex items-center gap-1 transition-colors ${user.isBanned
                                                            ? 'text-green-600 hover:text-green-700'
                                                            : 'text-red-500 hover:text-red-600'
                                                            }`}
                                                    >
                                                        {user.isBanned ? (
                                                            <>
                                                                <ShieldCheck size={14} /> {t('admin.users.unban', 'Mở khóa')}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Ban size={14} /> {t('auth.password_strength.very_weak')}
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => user._id && setDeleteConfirmModal({ open: true, userId: user._id })}
                                                    className="text-slate-400 hover:text-red-600 transition-colors"
                                                    title="Xóa người dùng vĩnh viễn"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Filter className="h-10 w-10 text-slate-300 mb-3" />
                                            <p>{t('admin.common.no_data')}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination (Mock UI) */}
                <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-between items-center">
                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-50 transition-all" disabled>
                        {t('admin.common.prev')}
                    </button>
                    <span className="text-sm text-slate-500">{t('admin.common.page_of', { page: 1, total: 1 })}</span>
                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-50 transition-all" disabled>
                        {t('admin.common.next')}
                    </button>
                </div>
            </div>

            {/* Ban Confirmation Modal */}
            {confirmModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                                <AlertTriangle className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('admin.users.confirm_ban')}</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                {t('admin.users.confirm_ban')}
                            </p>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setConfirmModal({ open: false, userId: null })}
                                    className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 font-medium hover:bg-gray-200 transition-colors text-sm"
                                >
                                    {t('admin.common.cancel')}
                                </button>
                                <button
                                    onClick={handleConfirmBan}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-sm shadow-sm shadow-red-200"
                                >
                                    {t('auth.password_strength.very_weak')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                                <Trash2 className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('admin.common.confirm')}</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                {t('admin.common.confirm')}
                            </p>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setDeleteConfirmModal({ open: false, userId: null })}
                                    className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 font-medium hover:bg-gray-200 transition-colors text-sm"
                                >
                                    {t('admin.common.cancel')}
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-sm shadow-sm shadow-red-200"
                                >
                                    {t('admin.common.delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
