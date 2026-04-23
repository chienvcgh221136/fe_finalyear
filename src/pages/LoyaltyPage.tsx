import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pointService } from '../services/pointService';
import { useAuth } from '../context/AuthContext';
import { Gift, TrendingUp, Users, Clock, ChevronRight, Award, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocalizedPath } from '../utils/pathUtils';
import { useTranslation } from 'react-i18next';
import EarnPointsModal from '../components/modals/EarnPointsModal';
import PointTermsModal from '../components/modals/PointTermsModal';
import UseItemModal from '../components/modals/UseItemModal';
import { useToast } from '../context/ToastContext';

const LoyaltyPage = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const localizePath = useLocalizedPath();
    const { success, error } = useToast();
    const queryClient = useQueryClient();

    const [showTasks, setShowTasks] = React.useState(false);
    const [showTerms, setShowTerms] = React.useState(false);
    const [selectedItem, setSelectedItem] = React.useState<any>(null);

    const { data: pointData, isLoading } = useQuery({
        queryKey: ['myPoints'],
        queryFn: () => pointService.getMyPoints().then(res => res.data)
    });

    const useItemMutation = useMutation({
        mutationFn: pointService.useItem,
        onSuccess: (data, variables) => {
            const { itemKey, quantity } = variables;
            let successMessage = data.message;
            
            if (itemKey === 'ITEM_POST_PUSH') {
                successMessage = t('loyalty.use_modal.use_success_push', { count: quantity, defaultValue: successMessage });
            } else if (itemKey === 'LEAD_CREDIT') {
                successMessage = t('loyalty.use_modal.use_success_lead', { count: quantity, defaultValue: successMessage });
            } else if (itemKey.includes('VIP')) {
                let vipType = '';
                if (itemKey.includes('BRONZE')) vipType = 'VIP Bronze';
                if (itemKey.includes('SILVER')) vipType = 'VIP Silver';
                if (itemKey.includes('GOLD')) vipType = 'VIP Gold';
                
                const dateMatch = data.message.match(/đến ([\d/]+)\./);
                const date = dateMatch ? dateMatch[1] : '';
                
                successMessage = t('loyalty.use_modal.use_success_vip', { type: vipType, date, defaultValue: successMessage });
            }

            success(successMessage);
            queryClient.invalidateQueries({ queryKey: ['myPoints'] });
            queryClient.invalidateQueries({ queryKey: ['vip', 'me'] }); // Refetch VIP data for VIP Management
            setSelectedItem(null);
        },
        onError: (err: any) => {
            error(err.response?.data?.message || t('common.error'));
        }
    });

    const handleItemClick = (key: string, label: string, icon: any, color: string, count: number) => {
        if (count <= 0) return;
        setSelectedItem({ key, label, icon, color, count });
    };

    const handleConfirmUse = (data: { postId: string, quantity: number }) => {
        if (selectedItem && !useItemMutation.isPending) {
            useItemMutation.mutate({
                itemKey: selectedItem.key,
                postId: data.postId,
                quantity: data.quantity
            });
        }
    };

    // Auto-scroll handler
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (isLoading) return <div className="p-8 text-center">{t('common.loading')}</div>;

    const { balance, history, inventory = {}, expiringSoon = { total: 0, batches: [] } } = pointData || { balance: 0, history: [], inventory: {}, expiringSoon: { total: 0, batches: [] } };
    const filteredHistory = (history || []).filter((log: any) => log.points > 0 || log.action === 'EXPIRED');

    const formatAction = (log: any) => {
        const { action, description } = log;

        if (action === 'ADMIN_ADJUSTMENT' && description) {
            // Check if description is a translation key
            if (description.startsWith('admin.points.adjustment_reasons.')) {
                return t(description);
            }
            return description;
        }

        switch (action) {
            case 'POST_CREATED': return t('loyalty.action_post_created');
            case 'VIP_PURCHASE': return t('loyalty.action_vip_purchase');
            case 'DAILY_LOGIN': return t('loyalty.action_daily_login');
            case 'REDEEM_LEAD_CREDIT': return t('loyalty.action_redeem_lead');
            case 'REDEEM_ITEM_POST_PUSH': return t('loyalty.action_redeem_push');
            case 'REDEEM_ITEM_VIP_BRONZE_1DAY': return t('loyalty.action_redeem_vip_bronze');
            case 'REDEEM_ITEM_VIP_SILVER_3DAY': return t('loyalty.action_redeem_vip_silver');
            case 'REDEEM_ITEM_VIP_GOLD_7DAY': return t('loyalty.action_redeem_vip_gold');
            case 'EXPIRED': return t('loyalty.action_expired');
            case 'ADMIN_ADJUSTMENT': return t('loyalty.action_admin');
            case 'TOPUP_REWARD': return t('loyalty.action_topup_reward');
            case 'FIRST_TOPUP_BONUS': return t('loyalty.action_first_topup_bonus');
            case 'POST_SOLD': return t('loyalty.action_post_sold');
            case 'VIEW_MILESTONE': return t('loyalty.action_view_milestone');
            case 'ADMIN_BONUS': return t('loyalty.action_admin_bonus');
            default: return action;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Compact Header Section */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white pt-6 pb-24 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 animate-pulse text-white">
                    <Award size={200} />
                </div>
                {/* Decorative circles */}
                <div className="absolute top-6 left-10 w-24 h-24 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-6 right-20 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl"></div>

                <div className="w-full px-4 md:px-8 mx-auto relative z-10">
                    <div className="flex flex-col items-center">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full mb-3 border border-white/20">
                                <Award size={12} className="text-yellow-300" />
                                <p className="text-blue-50 font-medium tracking-wide text-[10px] uppercase">{t('loyalty.member_title')}</p>
                            </div>
                            <h1 className="text-2xl font-bold mb-0.5">{t('loyalty.welcome', { name: user?.name })}</h1>
                            <p className="text-sm text-blue-100 opacity-70">{t('loyalty.thanks')}</p>
                        </div>

                        <div className="flex justify-center items-center relative py-2">
                            {/* Smaller Circular Point Display */}
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-300 to-yellow-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/10 flex flex-col items-center justify-center bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md shadow-xl">
                                    <Award size={20} className="md:size-24 mb-1 text-yellow-300 drop-shadow-lg md:scale-100 scale-90" />
                                    <span className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">{balance.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}</span>
                                    <span className="text-[10px] font-bold text-blue-100 mt-1 uppercase tracking-widest opacity-80">{t('loyalty.balance_label')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tighter Quick Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8 w-full max-w-2xl mx-auto text-white">
                            <div onClick={() => navigate(localizePath('/loyalty/redeem'))} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center cursor-pointer hover:bg-white/20 hover:-translate-y-0.5 transition duration-300">
                                <div className="w-8 h-8 mx-auto mb-2 bg-blue-500/30 rounded-full flex items-center justify-center">
                                    <Gift size={16} className="text-white" />
                                </div>
                                <span className="text-xs font-bold block">{t('loyalty.btn_redeem')}</span>
                            </div>

                            <div onClick={() => setShowTasks(true)} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center cursor-pointer hover:bg-white/20 hover:-translate-y-0.5 transition duration-300">
                                <div className="w-8 h-8 mx-auto mb-2 bg-indigo-500/30 rounded-full flex items-center justify-center">
                                    <Award size={16} className="text-white" />
                                </div>
                                <span className="text-xs font-bold block">{t('loyalty.btn_tasks')}</span>
                            </div>

                            <div onClick={() => scrollToSection('history-section')} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center cursor-pointer hover:bg-white/20 hover:-translate-y-0.5 transition duration-300">
                                <div className="w-8 h-8 mx-auto mb-2 bg-emerald-500/30 rounded-full flex items-center justify-center">
                                    <Clock size={16} className="text-white" />
                                </div>
                                <span className="text-xs font-bold block">{t('loyalty.btn_history')}</span>
                            </div>

                            <div onClick={() => setShowTerms(true)} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center cursor-pointer hover:bg-white/20 hover:-translate-y-0.5 transition duration-300">
                                <div className="w-8 h-8 mx-auto mb-2 bg-amber-500/30 rounded-full flex items-center justify-center">
                                    <ShieldCheck size={16} className="text-white" />
                                </div>
                                <span className="text-xs font-bold block">{t('loyalty.btn_terms')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full px-4 md:px-8 mx-auto -mt-20 relative z-20 space-y-10">
                {/* Expiring Points Warning */}
                {expiringSoon.total > 0 && (
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-3xl shadow-md">
                        <div className="flex items-start gap-4">
                            <div className="bg-orange-100 p-2 rounded-full">
                                <Clock size={20} className="text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-orange-900 font-bold mb-1">
                                    {t('loyalty.expiring_warning', { count: expiringSoon.total.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US') })}
                                </h4>
                                <p className="text-orange-700 text-sm leading-relaxed">
                                    {t('loyalty.expiring_desc', {
                                        total: expiringSoon.total.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US'),
                                        expiryDay: expiringSoon.expiryDay,
                                        expiryMonth: expiringSoon.expiryMonth,
                                        year: expiringSoon.year ? `/${expiringSoon.year}` : ''
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Inventory Section (New) */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                            <Gift size={20} className="text-gray-400" /> {t('loyalty.inventory_title')}
                        </h3>
                        <button onClick={() => navigate(localizePath('/loyalty/redeem'))} className="text-sm text-blue-600 font-bold hover:underline">
                            {t('loyalty.inventory_redeem_more')}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InventoryItem
                            icon={TrendingUp}
                            color="bg-cyan-100 text-cyan-600"
                            label={t('loyalty.item_push')}
                            count={inventory.postPush || 0}
                            onClick={() => handleItemClick('ITEM_POST_PUSH', t('loyalty.item_push'), TrendingUp, 'bg-cyan-100 text-cyan-600', inventory.postPush)}
                        />
                        <InventoryItem
                            icon={Users}
                            color="bg-green-100 text-green-600"
                            label={t('loyalty.item_lead')}
                            count={inventory.leadCredit || 0}
                            onClick={() => handleItemClick('LEAD_CREDIT', t('loyalty.item_lead'), Users, 'bg-green-100 text-green-600', inventory.leadCredit)}
                        />
                        <InventoryItem
                            icon={Award}
                            color="bg-amber-100 text-amber-700"
                            label={t('loyalty.item_vip_bronze')}
                            count={inventory.vipBronze1Day || 0}
                            onClick={() => handleItemClick('ITEM_VIP_BRONZE_1DAY', t('loyalty.item_vip_bronze'), Award, 'bg-amber-100 text-amber-700', inventory.vipBronze1Day)}
                        />
                        <InventoryItem
                            icon={Award}
                            color="bg-gray-200 text-gray-600"
                            label={t('loyalty.item_vip_silver')}
                            count={inventory.vipSilver3Day || 0}
                            onClick={() => handleItemClick('ITEM_VIP_SILVER_3DAY', t('loyalty.item_vip_silver'), Award, 'bg-gray-200 text-gray-600', inventory.vipSilver3Day)}
                        />
                        <InventoryItem
                            icon={Award}
                            color="bg-yellow-100 text-yellow-600"
                            label={t('loyalty.item_vip_gold')}
                            count={inventory.vipGold7Day || 0}
                            onClick={() => handleItemClick('ITEM_VIP_GOLD_7DAY', t('loyalty.item_vip_gold'), Award, 'bg-yellow-100 text-yellow-600', inventory.vipGold7Day)}
                        />
                    </div>
                </div>

                {/* Redeem Link Section */}
                <div id="redeem-section" className="scroll-mt-24">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition cursor-pointer"
                        onClick={() => navigate(localizePath('/loyalty/redeem'))}
                    >
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('loyalty.redeem_banner_title')}</h2>
                            <p className="text-gray-500">{t('loyalty.redeem_banner_desc')}</p>
                        </div>
                        <button className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition flex items-center gap-2 whitespace-nowrap">
                            {t('loyalty.redeem_banner_btn')} <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* History Table */}
                <div id="history-section" className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden scroll-mt-24">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                <Clock size={20} className="text-gray-400" /> {t('loyalty.history_title')}
                            </h3>
                            <p className="text-gray-500 text-sm mt-1">{t('loyalty.history_subtitle')}</p>
                        </div>
                        <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none shadow-sm">
                            <option>{t('loyalty.history_filter_recent')}</option>
                            <option>{t('loyalty.history_filter_month')}</option>
                            <option>{t('loyalty.history_filter_last_month')}</option>
                        </select>
                    </div>
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100/50 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-8 py-5">{t('loyalty.col_action')}</th>
                                    <th className="px-8 py-5">{t('loyalty.col_time')}</th>
                                    <th className="px-8 py-5 text-right">{t('loyalty.col_points')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredHistory.length > 0 ? filteredHistory.map((log: any) => (
                                    <tr key={log._id} className="hover:bg-gray-50/80 transition duration-150 group">
                                        <td className="px-8 py-5 font-medium text-gray-900 group-hover:text-blue-600 transition">
                                            {formatAction(log)}
                                        </td>
                                        <td className="px-8 py-5 text-gray-500">
                                            {new Date(log.createdAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} <span className="text-gray-300 mx-2">|</span> {new Date(log.createdAt).toLocaleTimeString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-8 py-5 text-right font-bold text-base">
                                            <div className={`${log.type === 'EARN' ? 'text-green-600' : 'text-orange-500'}`}>
                                                {log.type === 'EARN' ? '+' : '-'}{log.points.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-16 text-center text-gray-400">
                                            {t('loyalty.no_history')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile History List */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {filteredHistory.length > 0 ? filteredHistory.map((log: any) => (
                            <div key={log._id} className="p-5 hover:bg-gray-50 transition active:bg-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-gray-900 leading-tight pr-4">
                                        {formatAction(log)}
                                    </span>
                                    <div className={`font-black text-lg shrink-0 ${log.type === 'EARN' ? 'text-green-600' : 'text-orange-500'}`}>
                                        {log.type === 'EARN' ? '+' : '-'}{log.points.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                    <Clock size={12} className="opacity-50" />
                                    <span>{new Date(log.createdAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}</span>
                                    <span className="text-gray-300">•</span>
                                    <span>{new Date(log.createdAt).toLocaleTimeString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="px-8 py-16 text-center text-gray-400 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <Clock size={32} className="text-gray-300" />
                                </div>
                                {t('loyalty.no_history')}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <EarnPointsModal isOpen={showTasks} onClose={() => setShowTasks(false)} />
            <PointTermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
            <UseItemModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                onConfirm={handleConfirmUse}
                item={selectedItem}
                isProcessing={useItemMutation.isPending}
            />
        </div>
    );
};

const InventoryItem = ({ icon: Icon, color, label, count, onClick }: any) => (
    <div
        onClick={onClick}
        className={`flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-transparent group transition
            ${count > 0 ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-100 hover:shadow-md' : 'cursor-not-allowed opacity-60'}
        `}
    >
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                <Icon size={20} />
            </div>
            <span className={`font-medium transition ${count > 0 ? 'text-gray-700 group-hover:text-blue-700' : 'text-gray-400'}`}>{label}</span>
        </div>
        <span className={`font-extrabold text-xl ${count > 0 ? 'text-gray-900' : 'text-gray-400'}`}>{count}</span>
    </div>
);

export default LoyaltyPage;
