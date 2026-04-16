import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI, usersAPI } from '../../services/api';
import { Bell, Trash2, Edit2, Send, Users, Check, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { parseNotificationMessage } from '../../utils/notificationParser';

interface NotificationFormData {
    recipientId: string;
    recipientType: string;
    targetGroup: string;
    message: string;
    type: string;
}

const AdminNotifications = () => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const { register, handleSubmit, reset, setValue, watch } = useForm<NotificationFormData>({
        defaultValues: {
            recipientId: '',
            recipientType: 'INDIVIDUAL',
            targetGroup: 'USER',
            message: '',
            type: 'SYSTEM'
        }
    });

    // Fetch System Notifications
    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ['admin-notifications'],
        queryFn: notificationAPI.getSystemNotifications,
    });

    // Fetch Users for selection
    const { data: usersData } = useQuery({
        queryKey: ['admin-users-list'],
        queryFn: usersAPI.getAll,
        enabled: isModalOpen, // Only fetch when modal is open
    });

    // Handle different API response structures just in case
    const users = Array.isArray(usersData?.data) ? usersData.data : (usersData?.data?.data || []);
    const notifications = notificationsData?.data?.data || [];

    const [searchQuery, setSearchQuery] = useState('');

    // Filter users based on search
    const filteredUsers = users.filter((u: any) =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil((notifications?.length || 0) / ITEMS_PER_PAGE);
    const currentNotifications = notifications?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Mutations
    const createMutation = useMutation({
        mutationFn: notificationAPI.createSystemNotification,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
            reset();
            setIsModalOpen(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, message }: { id: string, message: string }) => notificationAPI.updateNotification(id, message),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
            setEditingId(null);
            reset();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: notificationAPI.deleteNotification,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        },
    });

    const onSubmit = (data: any) => {
        if (editingId) {
            updateMutation.mutate({ id: editingId, message: data.message });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (n: any) => {
        setValue('message', n.message);
        setValue('recipientId', n.recipientId ? n.recipientId._id : 'ALL');
        setEditingId(n._id);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('admin.common.confirm'))) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="text-blue-600" />
                    {t('admin.notifications.title')}
                </h1>
                <button
                    onClick={() => {
                        setEditingId(null);
                        reset();
                        setIsModalOpen(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                    <Send size={18} />
                    {t('admin.notifications.btn_add')}
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-medium text-gray-500">{t('admin.notifications.table_content')}</th>
                            <th className="px-6 py-4 font-medium text-gray-500">{t('admin.notifications.table_recipient')}</th>
                            <th className="px-6 py-4 font-medium text-gray-500">{t('admin.common.type')}</th>
                            <th className="px-6 py-4 font-medium text-gray-500">{t('admin.common.created_at')}</th>
                            <th className="px-6 py-4 font-medium text-gray-500 text-right">{t('admin.common.action')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">{t('admin.common.loading')}</td></tr>
                        ) : notifications.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">{t('admin.common.no_data')}</td></tr>
                        ) : (
                            currentNotifications.map((n: any) => (
                                <tr key={n._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 max-w-md truncate" title={n.message}>
                                        {parseNotificationMessage(n.message, t)}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {n.recipientId ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold shrink-0">
                                                    {n.recipientId.name?.charAt(0)}
                                                </div>
                                                <span className="truncate max-w-[150px]">{n.recipientId.email}</span>
                                            </div>
                                        ) : (
                                            <span className="flex items-center gap-1 text-blue-600 font-medium">
                                                <Users size={14} /> {t('admin.common.all')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                                            {n.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(n)}
                                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                title={t('admin.common.edit')}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(n._id)}
                                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                title={t('admin.common.delete')}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* Pagination UI */}
            {notifications && notifications.length > ITEMS_PER_PAGE && (
                <div className="border-t border-gray-100 p-4 bg-white rounded-xl shadow-sm border mt-4 flex justify-center items-center gap-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                    >
                        {t('admin.common.prev', { defaultValue: 'Trang trước' })}
                    </button>
                    <span className="text-sm font-medium text-gray-600 px-4">
                        {t('admin.common.page_display', { defaultValue: 'Hiển thị trang' })} {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                    >
                        {t('admin.common.next', { defaultValue: 'Trang sau' })}
                    </button>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingId ? t('admin.common.update_success') : t('admin.notifications.btn_add')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {!editingId && (
                                <div className="space-y-4">
                                    {/* Target Type Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.notifications.table_recipient')}</label>
                                        <select
                                            {...register('recipientType')}
                                            className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                            onChange={(e) => {
                                                setValue('recipientType', e.target.value);
                                                // Reset other fields if needed or handle logic
                                            }}
                                        >
                                            <option value="INDIVIDUAL">{t('admin.users.role_user')}</option>
                                            <option value="ALL">{t('admin.common.all')}</option>
                                            <option value="ROLE">{t('admin.users.title')}</option>
                                        </select>
                                    </div>

                                    {/* Sub-selection based on Type */}
                                    {watch('recipientType') === 'ROLE' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.common.filter')}</label>
                                            <select
                                                {...register('targetGroup')}
                                                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="ADMIN">{t('admin.users.role_admin')}</option>
                                                <option value="USER">{t('admin.users.role_user')}</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Individual Selection (Existing logic) */}
                                    {watch('recipientType') === 'INDIVIDUAL' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.notifications.table_recipient')}</label>

                                            {/* Search Input */}
                                            <div className="relative mb-2">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder={t('admin.common.search')}
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>

                                            <select
                                                {...register('recipientId')}
                                                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 max-h-40 overflow-y-auto"
                                            >
                                                <optgroup label={searchQuery ? t('admin.notifications.search_results') : t('admin.notifications.select_user')}>
                                                    {filteredUsers.map((u: any) => (
                                                        <option key={u._id} value={u._id}>
                                                            {u.name} ({u.email})
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.notifications.table_content')}</label>
                                <textarea
                                    {...register('message', { required: true })}
                                    rows={4}
                                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    placeholder={t('admin.notifications.table_content')}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    {t('admin.common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateMutation.isPending || createMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
                                >
                                    {(updateMutation.isPending || createMutation.isPending) ? (
                                        t('admin.common.loading')
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            {editingId ? t('admin.common.confirm') : t('admin.notifications.btn_add')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNotifications;
