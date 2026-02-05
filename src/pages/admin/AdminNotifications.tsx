import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI, usersAPI } from '../../services/api';
import { Bell, Trash2, Edit2, Send, Users, Check, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface NotificationFormData {
    recipientId: string;
    recipientType: string;
    targetGroup: string;
    message: string;
    type: string;
}

const AdminNotifications = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

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
        if (window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="text-blue-600" />
                    Quản lý thông báo hệ thống
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
                    Gửi thông báo mới
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-medium text-gray-500">Nội dung</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Người nhận</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Loại</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Thời gian</th>
                            <th className="px-6 py-4 font-medium text-gray-500 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Đang tải...</td></tr>
                        ) : notifications.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Chưa có thông báo nào</td></tr>
                        ) : (
                            notifications.map((n: any) => (
                                <tr key={n._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 max-w-md truncate" title={n.message}>
                                        {n.message}
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
                                                <Users size={14} /> Tất cả
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
                                                title="Sửa nội dung"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(n._id)}
                                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                title="Xóa"
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingId ? 'Chỉnh sửa thông báo' : 'Gửi thông báo mới'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {!editingId && (
                                <div className="space-y-4">
                                    {/* Target Type Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Đối tượng nhận</label>
                                        <select
                                            {...register('recipientType')}
                                            className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                            onChange={(e) => {
                                                setValue('recipientType', e.target.value);
                                                // Reset other fields if needed or handle logic
                                            }}
                                        >
                                            <option value="INDIVIDUAL">Cá nhân</option>
                                            <option value="ALL">Tất cả người dùng</option>
                                            <option value="ROLE">Theo vai trò</option>
                                        </select>
                                    </div>

                                    {/* Sub-selection based on Type */}
                                    {watch('recipientType') === 'ROLE' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn vai trò</label>
                                            <select
                                                {...register('targetGroup')}
                                                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="ADMIN">Quản trị viên (Admin)</option>
                                                <option value="USER">Người dùng thường (User)</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Individual Selection (Existing logic) */}
                                    {watch('recipientType') === 'INDIVIDUAL' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Người nhận cụ thể</label>

                                            {/* Search Input */}
                                            <div className="relative mb-2">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Tìm kiếm người dùng..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>

                                            <select
                                                {...register('recipientId')}
                                                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 max-h-40 overflow-y-auto"
                                            >
                                                <optgroup label={searchQuery ? "Kết quả tìm kiếm" : "Chọn người dùng"}>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung thông báo</label>
                                <textarea
                                    {...register('message', { required: true })}
                                    rows={4}
                                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Nhập nội dung thông báo..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateMutation.isPending || createMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
                                >
                                    {(updateMutation.isPending || createMutation.isPending) ? (
                                        'Đang xử lý...'
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            {editingId ? 'Cập nhật' : 'Gửi ngay'}
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
