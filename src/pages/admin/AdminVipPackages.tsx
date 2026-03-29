import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vipAPI } from '../../services/api';
import { Users, DollarSign, Star, Plus, Edit, Filter, Box, XCircle } from 'lucide-react';
import { formatVNDRaw } from '../../utils/currencyUtils';

const AdminVipPackages = () => {
    const { t } = useTranslation();
    // Force Re-render
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'packages' | 'users'>('packages');
    const [showModal, setShowModal] = useState(false);
    const [editingPackage, setEditingPackage] = useState<any | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        durationDays: '',
        priorityScore: '',
        limitViewPhone: '',
        postLimit: '',
        description: '',
        perks: '',
        isPopular: false
    });

    // Queries
    const { data: packagesRes } = useQuery({
        queryKey: ['admin', 'vip-packages'],
        queryFn: vipAPI.getPackages
    });

    const { data: statsRes } = useQuery({
        queryKey: ['admin', 'vip-stats'],
        queryFn: vipAPI.getAdminStats
    });

    const { data: usersRes } = useQuery({
        queryKey: ['admin', 'vip-users'],
        queryFn: vipAPI.getVipUsers
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => vipAPI.createPackage(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'vip-packages'] });
            setShowModal(false);
            resetForm();
            alert(t('admin.common.update_success'));
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || t('admin.common.error'));
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => vipAPI.updatePackage(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'vip-packages'] });
            setShowModal(false);
            resetForm();
            alert(t('admin.common.update_success'));
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || t('admin.common.error'));
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => vipAPI.deletePackage(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'vip-packages'] });
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || t('admin.common.error'));
        }
    });

    const resetForm = () => {
        setFormData({ name: '', price: '', durationDays: '', priorityScore: '', limitViewPhone: '', postLimit: '', description: '', perks: '', isPopular: false });
        setEditingPackage(null);
    };

    const handleEdit = (pkg: any) => {
        setEditingPackage(pkg);
        setFormData({
            name: pkg.name,
            price: pkg.price.toString(),
            durationDays: pkg.durationDays.toString(),
            priorityScore: pkg.priorityScore.toString(),
            limitViewPhone: (pkg.limitViewPhone || 0).toString(),
            postLimit: (pkg.postLimit || 0).toString(),
            description: pkg.description,
            perks: pkg.perks?.join(', ') || '',
            isPopular: pkg.isPopular || false
        });
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            price: Number(formData.price),
            durationDays: Number(formData.durationDays),
            priorityScore: Number(formData.priorityScore),
            limitViewPhone: Number(formData.limitViewPhone),
            postLimit: Number(formData.postLimit),
            perks: formData.perks.split(',').map(s => s.trim()).filter(Boolean),
            isPopular: formData.isPopular
        };

        if (editingPackage) {
            updateMutation.mutate({ id: editingPackage._id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('admin.common.confirm'))) {
            deleteMutation.mutate(id);
        }
    };

    const stats = statsRes?.data?.data || {};
    const packages = packagesRes?.data?.data || [];
    const vipUsers = usersRes?.data?.data || [];



    return (
        <div className="space-y-6 pb-12">
            {/* ... Existing UI ... */}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('admin.vip.title')}</h1>
                    <p className="text-gray-500">{t('admin.vip.tab_config')}</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                    <Plus size={18} /> {t('admin.vip.btn_add')}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('admin.vip.stat_count')}</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.activeVipUsers || 0}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Users size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('admin.vip.stat_revenue')}</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">
                                {formatVNDRaw(stats.monthlyRevenue || 0)} {t('admin.vip.currency_symbol', 'đ')}
                            </h3>
                        </div>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('admin.vip.stat_top')}</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.topPackage || t('admin.common.no_data')}</h3>
                        </div>
                        <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                            <Star size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('packages')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'packages'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Box size={18} /> {t('admin.vip.tab_config')}
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'users'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Users size={18} /> {t('admin.users.title')}
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'packages' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {packages.map((pkg: any) => (
                        <div key={pkg._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className={`h-2 w-full ${pkg.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-xl text-gray-900">{pkg.name}</h3>
                                    <button onClick={() => handleEdit(pkg)} className="text-gray-400 hover:text-blue-600">
                                        <Edit size={18} />
                                    </button>
                                </div>
                                <div className="text-2xl font-bold text-blue-600 mb-6">
                                    {formatVNDRaw(pkg.price)} <span className="text-gray-400 ml-1 text-xs">/ {pkg.durationDays} {t('common.days')}</span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">{t('admin.vip.table_duration')}</span>
                                        <span className="font-medium text-gray-900">{pkg.durationDays} {t('common.days')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">{t('admin.vip.table_priority')}</span>
                                        <span className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">{pkg.priorityScore} / 100</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">{t('admin.vip.table_view_phone')}</span>
                                        <span className="font-medium text-blue-600">{pkg.limitViewPhone || 0} {t('stats.view_count').toLowerCase()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">{t('admin.vip.table_post_limit')}</span>
                                        <span className="font-bold text-amber-600">{pkg.postLimit || 0} {t('admin.posts.title').toLowerCase()}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase">{t('admin.vip.table_perks')}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {pkg.perks?.map((perk: string, idx: number) => (
                                            <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md border border-gray-200">
                                                {perk}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                                    <button onClick={() => handleDelete(pkg._id)} className="text-red-500 text-sm hover:underline">
                                        {pkg.isActive ? t('admin.reports.dismiss') : t('stats.status_active')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-700">{t('admin.vip.tab_users')} ({vipUsers.length})</h3>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                                <Filter size={16} /> {t('admin.common.filter')}
                            </button>

                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-medium">{t('admin.users.title')}</th>
                                    <th className="px-6 py-4 font-medium">{t('admin.vip.table_name')}</th>
                                    <th className="px-6 py-4 font-medium">{t('admin.common.status')}</th>
                                    <th className="px-6 py-4 font-medium">{t('admin.vip.table_expired')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {vipUsers.map((user: any) => (
                                    <tr key={user._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{user.vip?.vipType}</td>
                                        <td className="px-6 py-4">
                                            {user.vip?.isActive ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {t('stats.status_active')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {t('admin.reports.tab_dismissed')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(user.vip?.expiredAt).toLocaleDateString('vi-VN')}
                                        </td>
                                    </tr>
                                ))}
                                {vipUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            {t('admin.common.no_data')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Package Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900">
                                {editingPackage ? t('admin.vip.table_name') : t('admin.vip.btn_add')}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.vip.table_name')}</label>
                                <select
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="" disabled>-- {t('admin.common.filter')} --</option>
                                    <option value="VIP Bronze">VIP Bronze</option>
                                    <option value="VIP Silver">VIP Silver</option>
                                    <option value="VIP Gold">VIP Gold</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.common.points')} ({t('admin.vip.package_price_unit', 'VNĐ')})</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="500000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.vip.table_duration')} ({t('common.days')})</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.durationDays}
                                        onChange={e => setFormData({ ...formData, durationDays: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.vip.table_priority')} (0-100)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max="100"
                                        value={formData.priorityScore}
                                        onChange={e => setFormData({ ...formData, priorityScore: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.vip.table_view_phone')} ({t('stats.view_count')})</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.limitViewPhone}
                                        onChange={e => setFormData({ ...formData, limitViewPhone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.vip.table_post_limit')}</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.postLimit}
                                        onChange={e => setFormData({ ...formData, postLimit: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder={t('admin.vip.example_post_limit', 'Ví dụ: 5')}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.vip.table_perks')}</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder={t('admin.vip.perks_placeholder')}
                                    rows={3}
                                    value={formData.perks}
                                    onChange={e => setFormData({ ...formData, perks: e.target.value })}
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.notifications.table_content')}</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    rows={2}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isPopular"
                                    checked={formData.isPopular}
                                    onChange={e => setFormData({ ...formData, isPopular: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isPopular" className="text-sm font-medium text-gray-700">
                                    {t('admin.vip.stat_top')}
                                </label>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    {t('admin.common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    {editingPackage ? t('admin.common.confirm') : t('admin.vip.btn_add')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </div>
    );
};

export default AdminVipPackages;

