import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vipAPI, postsAPI } from '../services/api';
import { Crown, Clock } from 'lucide-react';
import LocalizedLink from '../components/common/LocalizedLink';
import { useTranslation } from 'react-i18next';

const VipManagement = () => {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();

    // Queries
    const { data: myVipRes, isLoading: loadingVip } = useQuery({
        queryKey: ['vip', 'me'],
        queryFn: vipAPI.getMyVip
    });

    const { data: myPostsRes, isLoading: loadingPosts } = useQuery({
        queryKey: ['posts', 'me'],
        queryFn: postsAPI.getMyPosts
    });

    const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
    const [actionLoading, setActionLoading] = useState(false);

    // Derived State
    const myVip = useMemo(() => myVipRes?.data?.data || myVipRes?.data || {}, [myVipRes]);
    const posts = useMemo(() => myPostsRes?.data?.data || myPostsRes?.data || [], [myPostsRes]);

    const activePosts = useMemo(() => {
        return posts.filter((p: any) => p.status === 'ACTIVE');
    }, [posts]);

    // Format Helpers
    const isVipActive = myVip.isActive && new Date(myVip.expiredAt) > new Date();
    const packageInfo = myVip.packageId;
    const dailyUsed = myVip.dailyUsedSlots || 0;

    const limitMap: Record<string, number> = { 'BASIC': 5, 'PRO': 10, 'PREMIUM': 20 };
    // Calculate Total Limits (Base + Bonus) -> Fix: Add back used bonus so limit appears static
    const baseLimit = isVipActive ? (packageInfo?.postLimit || limitMap[myVip.vipType?.replace('VIP ', '').toUpperCase()] || 0) : 0;
    const limit = baseLimit + (myVip.bonusPushCredits || 0) + Math.max(0, dailyUsed - baseLimit);

    // For leads:
    const dailyViewedPhones = myVip.todayViewedPhones || 0;
    const baseViewLimit = isVipActive ? (myVip.limitViewPhone || 0) : 0;
    const limitViewPhone = baseViewLimit + (myVip.bonusLeadCredits || 0) + Math.max(0, dailyViewedPhones - baseViewLimit);

    // Remaining time text
    const timeRemainingText = useMemo(() => {
        if (!myVip.expiredAt) return t('vip_management.expired');
        const diff = new Date(myVip.expiredAt).getTime() - new Date().getTime();

        if (diff <= 0) return t('vip_management.expired');

        const hours = Math.ceil(diff / (1000 * 60 * 60));
        if (hours < 24) {
            return t('vip_management.remaining_hours', { count: hours });
        }

        const days = Math.ceil(diff / (1000 * 3600 * 24));
        return t('vip_management.remaining_days', { count: days });
    }, [myVip.expiredAt, t]);

    const formatPrice = (price: number) => {
        if (!price) return t('common.contact');
        if (price >= 1000000000) {
            return `${(price / 1000000000).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { maximumFractionDigits: 2 })} ${t('common.billion')}`;
        }
        if (price >= 1000000) {
            return `${(price / 1000000).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { maximumFractionDigits: 1 })} ${t('common.million')}`;
        }
        return new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US').format(price) + ' ' + t('common.currency');
    };


    // Handlers
    const toggleSelection = (id: string) => {
        if (selectedPosts.includes(id)) {
            setSelectedPosts(selectedPosts.filter(pid => pid !== id));
        } else {
            setSelectedPosts([...selectedPosts, id]);
        }
    };

    const attachVipMutation = useMutation({
        mutationFn: (ids: string[]) => vipAPI.attach(ids),
        onSuccess: (res) => {
            alert(res.data.message || t('common.success'));
            queryClient.invalidateQueries({ queryKey: ['posts', 'me'] });
            queryClient.invalidateQueries({ queryKey: ['vip', 'me'] });
            setSelectedPosts([]);
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || t('common.error'));
        }
    });

    const detachVipMutation = useMutation({
        mutationFn: (ids: string[]) => vipAPI.detach(ids),
        onSuccess: (res) => {
            alert(res.data.message || t('common.success'));
            queryClient.invalidateQueries({ queryKey: ['posts', 'me'] });
            queryClient.invalidateQueries({ queryKey: ['vip', 'me'] });
            setSelectedPosts([]);
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || t('common.error'));
        }
    });

    const handleAttach = () => {
        if (selectedPosts.length === 0) return;
        // Check VIP or Bonus
        const hasBonus = (myVip.bonusPushCredits || 0) > 0;
        if (!isVipActive && !hasBonus) {
            alert(t('vip_management.error_no_vip'));
            return;
        }
        if (dailyUsed + selectedPosts.length > limit) {
            alert(t('vip_management.error_slot_limit', { remaining: limit - dailyUsed, selected: selectedPosts.length }));
            return;
        }
        setActionLoading(true);
        attachVipMutation.mutate(selectedPosts, {
            onSettled: () => setActionLoading(false)
        });
    };

    const handleDetach = () => {
        if (selectedPosts.length === 0) return;
        if (!window.confirm(t('vip_management.confirm_detach'))) return;

        setActionLoading(true);
        detachVipMutation.mutate(selectedPosts, {
            onSettled: () => setActionLoading(false)
        });
    };


    if (loadingVip || loadingPosts) return <div className="p-8 text-center">{t('vip_management.loading')}</div>;

    // Show full UI for all users, even without VIP
    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            <div className="w-full px-4 md:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{t('vip_management.title')}</h1>
                        <p className="text-gray-500">{t('vip_management.subtitle')}</p>
                    </div>
                    <LocalizedLink to="/profile?tab=vip" className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 transition">
                        {t('vip_management.btn_history_packages')}
                    </LocalizedLink>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Status Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{t('vip_management.current_package')}</p>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">{myVip.vipType}</h2>
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 w-fit px-3 py-1 rounded-full text-sm font-bold">
                                <Clock size={16} />
                                <span>{timeRemainingText}</span>
                            </div>
                        </div>
                        <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-blue-50 to-transparent"></div>
                        <Crown className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-100" size={80} />
                    </div>

                    {/* Slots Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{t('vip_management.vip_slots_remaining')}</p>
                                <h2 className="text-3xl font-bold text-gray-900">
                                    {Math.max(0, limit - dailyUsed)}
                                </h2>
                                <div className="flex gap-3 mt-1">
                                    <span className="text-xs text-blue-600 font-medium">{t('vip_management.base_slots', { count: Math.max(0, baseLimit - dailyUsed) })}</span>
                                    {myVip.bonusPushCredits > 0 && (
                                        <span className="text-xs text-orange-600 font-bold">{t('vip_management.bonus_slots', { count: myVip.bonusPushCredits })}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Progress Bar - Shows Remaining % */}
                        <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                            <div
                                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${limit > 0 ? Math.min(100, ((limit - dailyUsed) / limit) * 100) : 0}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-400">{t('vip_management.slot_limit_info', { base: baseLimit, bonus: myVip.bonusPushCredits || 0 })}</p>
                    </div>

                    {/* Leads Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 md:col-span-2 lg:col-span-1">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{t('vip_management.phone_slots_remaining')}</p>
                                <h2 className="text-3xl font-bold text-gray-900">
                                    {Math.max(0, limitViewPhone - dailyViewedPhones)}
                                </h2>
                                <div className="flex gap-3 mt-1">
                                    <span className="text-xs text-purple-600 font-medium">{t('vip_management.base_slots', { count: Math.max(0, baseViewLimit - dailyViewedPhones) })}</span>
                                    {myVip.bonusLeadCredits > 0 && (
                                        <span className="text-xs text-orange-600 font-bold">{t('vip_management.bonus_slots', { count: myVip.bonusLeadCredits })}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Progress Bar - Shows Remaining % */}
                        <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                            <div
                                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${limitViewPhone > 0 ? Math.min(100, ((limitViewPhone - dailyViewedPhones) / limitViewPhone) * 100) : 0}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-400">{t('vip_management.phone_limit_info', { base: baseViewLimit, bonus: myVip.bonusLeadCredits || 0 })}</p>
                    </div>


                </div>

                {/* List Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h3 className="font-bold text-gray-900 text-xl">{t('vip_management.active_posts_list', { count: activePosts.length })}</h3>

                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={handleAttach}
                                disabled={selectedPosts.length === 0 || actionLoading || dailyUsed >= limit}
                                className="flex-1 md:flex-none px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                            >
                                <Crown size={18} /> {t('vip_management.btn_attach_vip', { count: selectedPosts.length })}
                            </button>
                            <button
                                onClick={handleDetach}
                                disabled={selectedPosts.length === 0 || actionLoading}
                                className="flex-1 md:flex-none px-6 py-2 border border-red-200 text-red-600 bg-red-50 font-bold rounded-xl hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {t('vip_management.btn_detach_vip')}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-left">
                                <tr>
                                    <th className="p-4 w-12">
                                        {/* Select All Checkbox could go here */}
                                    </th>
                                    <th className="p-4 text-sm font-bold text-gray-500 uppercase">{t('vip_management.col_post')}</th>
                                    <th className="p-4 text-sm font-bold text-gray-500 uppercase">{t('vip_management.col_status')}</th>
                                    <th className="p-4 text-sm font-bold text-gray-500 uppercase">{t('vip_management.col_vip_status')}</th>
                                    <th className="p-4 text-sm font-bold text-gray-500 uppercase text-right">{t('vip_management.col_price')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {activePosts.map((post: any) => {
                                    const isVip = post.vip?.isActive;
                                    const isSelected = selectedPosts.includes(post._id);

                                    return (
                                        <tr key={post._id} className={`hover:bg-blue-50/30 transition ${isSelected ? 'bg-blue-50/50' : ''}`}>
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelection(post._id)}
                                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                                        {post.images?.[0] && <img src={post.images[0]} className="w-full h-full object-cover" alt="" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 line-clamp-1">{post.title}</h4>
                                                        <p className="text-xs text-gray-500">{t('vip_management.posted_on')}: {new Date(post.createdAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">
                                                    {t('common.active')}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {isVip ? (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                                                            <Crown size={16} className="fill-blue-600" />
                                                            {t('vip_management.vip_active_label')}
                                                        </div>
                                                        <span className="text-xs text-gray-500">
                                                            {post.vip?.vipType || myVip.vipType}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm italic">{t('common.none')}</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right font-bold text-gray-900">
                                                {formatPrice(post.price)}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {activePosts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-gray-500 italic">
                                            {t('vip_management.no_active_posts')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VipManagement;
