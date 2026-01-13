
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../../services/api';
import type { User } from '../../types';
import {
    Search, Filter, MoreVertical, Ban,
    UserPlus, Users, ShieldCheck, ChevronDown, AlertTriangle
} from 'lucide-react';

const AdminUsers = () => {
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
            alert("Đã khóa tài khoản người dùng.");
        },
        onError: () => {
            alert("Lỗi khi khóa tài khoản.");
        },
    });

    const unbanMutation = useMutation({
        mutationFn: (userId: string) => usersAPI.unban(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            alert("Đã mở khóa tài khoản người dùng.");
        },
        onError: () => {
            alert("Lỗi khi mở khóa tài khoản.");
        },
    });

    const [confirmModal, setConfirmModal] = useState<{ open: boolean; userId: string | null }>({
        open: false,
        userId: null,
    });

    const handleConfirmBan = () => {
        if (confirmModal.userId) {
            banMutation.mutate(confirmModal.userId);
            setConfirmModal({ open: false, userId: null });
        }
    };

    // Derived Stats
    const totalUsers = users?.length || 0;
    const activeUsers = users?.filter(u => !u.isBanned).length || 0;
    const bannedUsers = users?.filter(u => u.isBanned).length || 0;

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
                    <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                    <p className="text-slate-500 mt-1 text-sm">Manage platform users, roles, and security status.</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-blue-200">
                    <UserPlus size={18} />
                    Add New User
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL USERS</p>
                        <p className="text-3xl font-bold text-slate-900 mt-3">{totalUsers.toLocaleString()}</p>
                        <p className="text-xs font-medium text-green-600 mt-2 flex items-center gap-1">
                            <span>↗</span> +12% this month
                        </p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Users size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ACTIVE ACCOUNTS</p>
                        <p className="text-3xl font-bold text-slate-900 mt-3">{activeUsers.toLocaleString()}</p>
                        <p className="text-xs font-medium text-green-600 mt-2 flex items-center gap-1">
                            <span>↗</span> +5% from last week
                        </p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <ShieldCheck size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">BANNED ACCOUNTS</p>
                        <p className="text-3xl font-bold text-slate-900 mt-3">{bannedUsers.toLocaleString()}</p>
                        <p className="text-xs font-medium text-red-500 mt-2 flex items-center gap-1">
                            <span>⚠</span> 2 pending review
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
                            placeholder="Search by name or email..."
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
                                <option value="All Roles">All Roles</option>
                                <option value="ADMIN">Admin</option>
                                <option value="USER">User</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        </div>

                        <div className="relative">
                            <select
                                className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium py-2.5 pl-4 pr-10 rounded-lg cursor-pointer hover:border-slate-300 focus:outline-none focus:border-blue-500"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="Status">Status</option>
                                <option value="Active">Active</option>
                                <option value="Banned">Banned</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        </div>
                    </div>

                    <div className="hidden sm:block text-sm text-slate-500 font-medium ml-auto">
                        Showing <span className="text-slate-900 font-bold">{filteredUsers?.length}</span> of {totalUsers} users
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">USER</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">EMAIL</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">ROLE</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">STATUS</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">ACTIONS</th>
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
                                                    {user.isBanned ? 'Banned' : 'Active'}
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
                                                                <ShieldCheck size={14} /> Unban User
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Ban size={14} /> Ban User
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                                <button className="text-slate-400 hover:text-slate-600">
                                                    <MoreVertical size={18} />
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
                                            <p>No users found matching your filters.</p>
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
                        Previous
                    </button>
                    <span className="text-sm text-slate-500">Page 1 of 1</span>
                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-50 transition-all" disabled>
                        Next
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
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận khóa tài khoản</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Bạn có chắc chắn muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập sau khi bị khóa.
                            </p>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setConfirmModal({ open: false, userId: null })}
                                    className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 font-medium hover:bg-gray-200 transition-colors text-sm"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleConfirmBan}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-sm shadow-sm shadow-red-200"
                                >
                                    Khóa ngay
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
