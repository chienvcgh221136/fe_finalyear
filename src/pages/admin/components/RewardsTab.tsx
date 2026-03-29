import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pointService } from '../../../services/pointService';
import { Plus, Edit2, Trash2, Package, X } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/ui/Button';

const AdminRewards = () => {
    const { t } = useTranslation();
    const { success, error } = useToast();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReward, setEditingReward] = useState<any>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-rewards'],
        queryFn: () => pointService.getRewards(),
        select: (res) => res.data
    });

    const createMutation = useMutation({
        mutationFn: pointService.createReward,
        onSuccess: () => {
            success(t('admin.common.update_success'));
            setIsModalOpen(false);
            setEditingReward(null);
            queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
        },
        onError: (err: any) => error(err.response?.data?.message || t('admin.common.error'))
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => pointService.updateReward(editingReward._id, data),
        onSuccess: () => {
            success(t('admin.common.update_success'));
            setIsModalOpen(false);
            setEditingReward(null);
            queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
        },
        onError: (err: any) => error(err.response?.data?.message || t('admin.common.error'))
    });

    const deleteMutation = useMutation({
        mutationFn: pointService.deleteReward,
        onSuccess: () => {
            success(t('admin.common.update_success'));
            queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
        },
        onError: (err: any) => error(err.response?.data?.message || t('admin.common.error'))
    });

    const handleSubmit = (e: React.FormEvent, formData: any) => {
        e.preventDefault();
        if (editingReward) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('admin.common.confirm'))) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{t('admin.points.tab_rewards')}</h2>
                    <p className="text-gray-500">{t('admin.points.subtitle')}</p>
                </div>
                <Button onClick={() => { setEditingReward(null); setIsModalOpen(true); }}>
                    <Plus size={18} className="mr-2" />
                    {t('admin.points.btn_add_reward')}
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">Checking...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data?.map((reward: any) => (
                        <div key={reward._id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${reward.type === 'VIP' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {reward.type === 'VIP' ? <p className="font-bold text-xs">VIP</p> : <Package size={20} />}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setEditingReward(reward); setIsModalOpen(true); }}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(reward._id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-gray-900 text-lg mb-1">{reward.title}</h3>
                            <p className="text-sm text-gray-500 mb-4 h-10 line-clamp-2">{reward.subtitle}</p>

                            <div className="flex items-end justify-between border-t border-gray-50 pt-4">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t('admin.points.stat_total_redeemed')}</p>
                                    <p className="font-bold text-indigo-600 text-xl">{reward.points.toLocaleString()} {t('admin.common.points')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Key</p>
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{reward.key}</code>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <RewardFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialData={editingReward}
                    onSubmit={handleSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                />
            )}
        </div>
    );
};

const RewardFormModal = ({ isOpen, onClose, initialData, onSubmit, isLoading }: any) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(initialData || {
        key: '',
        title: '',
        subtitle: '',
        desc: '',
        points: 0,
        type: 'ITEM',
        value: 1,
        inventoryKey: '',
        isActive: true
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-900">{initialData ? t('admin.common.confirm') : t('admin.points.btn_add_reward')}</h3>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-gray-600" /></button>
                </div>
                <form onSubmit={(e) => onSubmit(e, formData)} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mã Gói (Key)</label>
                            <input
                                required
                                className="w-full px-4 py-2 border rounded-xl"
                                value={formData.key}
                                onChange={e => setFormData({ ...formData, key: e.target.value })}
                                placeholder="ITEM_NAME"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Loại (Type)</label>
                            <select
                                className="w-full px-4 py-2 border rounded-xl"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="ITEM">ITEM ({t('admin.common.points')})</option>
                                <option value="VIP">VIP (VIP)</option>
                                <option value="CREDIT">CREDIT ({t('navbar.points')})</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.vip.package_name')}</label>
                        <input
                            required
                            className="w-full px-4 py-2 border rounded-xl"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.vip.package_description')}</label>
                        <input
                            className="w-full px-4 py-2 border rounded-xl"
                            value={formData.subtitle}
                            onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Số điểm đổi</label>
                            <input
                                type="number"
                                required
                                className="w-full px-4 py-2 border rounded-xl"
                                value={formData.points}
                                onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị (Value)</label>
                            <input
                                type="number"
                                required
                                className="w-full px-4 py-2 border rounded-xl"
                                value={formData.value}
                                onChange={e => setFormData({ ...formData, value: parseInt(e.target.value) })}
                                title="Số lượng item hoặc số ngày VIP"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Key (Backend Field)</label>
                        <input
                            required
                            className="w-full px-4 py-2 border rounded-xl bg-gray-50"
                            value={formData.inventoryKey}
                            onChange={e => setFormData({ ...formData, inventoryKey: e.target.value })}
                            placeholder="e.g. postPush, vipGold7Day"
                        />
                        <p className="text-xs text-gray-500 mt-1">Trường trong DB User.inventory để cộng.</p>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>{t('admin.common.cancel')}</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? t('admin.common.loading') : (initialData ? t('admin.common.confirm') : t('admin.points.btn_add_reward'))}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminRewards;
