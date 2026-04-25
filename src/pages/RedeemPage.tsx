import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pointService } from '../services/pointService';
import { Award, ArrowLeft, ShieldCheck, HelpCircle, Coins, Flame, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocalizedPath } from '../utils/pathUtils';
import { useTranslation } from 'react-i18next';
import RedeemModal from '../components/modals/RedeemModal';
import { useToast } from '../context/ToastContext';

const RedeemPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const localizePath = useLocalizedPath();
    const { success, error } = useToast();
    const queryClient = useQueryClient();
    const [selectedItem, setSelectedItem] = React.useState<any>(null);

    const { data: pointData, isLoading } = useQuery({
        queryKey: ['myPoints'],
        queryFn: () => pointService.getMyPoints().then(res => res.data)
    });

    const redeemMutation = useMutation({
        mutationFn: pointService.redeemReward,
        onSuccess: () => {
            success(t('redeem.success_redeem'));
            queryClient.invalidateQueries({ queryKey: ['myPoints'] });
            setSelectedItem(null);
        },
        onError: (err: any) => {
            error(err.response?.data?.message || t('redeem.error_redeem'));
        }
    });

    const handleRedeem = (itemKey: string) => {
        redeemMutation.mutate(itemKey);
    };

    if (isLoading) return <div className="p-8 text-center">{t('common.loading')}</div>;

    const balance = pointData?.balance || 0;

    const rewards = [
        {
            key: 'ITEM_POST_PUSH',
            title: t('redeem.item_push_title'),
            subtitle: t('redeem.item_push_subtitle'),
            desc: t('redeem.item_push_desc'),
            points: 50,
            icon: Flame,
            color: "from-orange-400 to-red-500",
            bg: "bg-orange-50",
            iconBg: "bg-orange-100 text-orange-600"
        },
        {
            key: 'LEAD_CREDIT',
            title: t('redeem.item_lead_title'),
            subtitle: t('redeem.item_lead_subtitle'),
            desc: t('redeem.item_lead_desc'),
            points: 50,
            icon: Zap,
            color: "from-blue-400 to-indigo-600",
            bg: "bg-blue-50",
            iconBg: "bg-blue-100 text-blue-600"
        },
        {
            key: 'ITEM_VIP_BRONZE_1DAY',
            title: t('redeem.item_vip_bronze_title'),
            subtitle: t('redeem.item_vip_bronze_subtitle'),
            desc: t('redeem.item_vip_bronze_desc'),
            points: 100,
            icon: Award,
            color: "from-amber-400 to-amber-700",
            bg: "bg-amber-50",
            iconBg: "bg-amber-100 text-amber-700"
        },
        {
            key: 'ITEM_VIP_SILVER_3DAY',
            title: t('redeem.item_vip_silver_title'),
            subtitle: t('redeem.item_vip_silver_subtitle'),
            desc: t('redeem.item_vip_silver_desc'),
            points: 250,
            icon: Award,
            color: "from-gray-300 to-gray-500",
            bg: "bg-gray-50",
            iconBg: "bg-gray-100 text-gray-500"
        },
        {
            key: 'ITEM_VIP_GOLD_7DAY',
            title: t('redeem.item_vip_gold_title'),
            subtitle: t('redeem.item_vip_gold_subtitle'),
            desc: t('redeem.item_vip_gold_desc'),
            points: 500,
            icon: Award,
            color: "from-yellow-400 to-yellow-600",
            bg: "bg-yellow-50",
            iconBg: "bg-yellow-100 text-yellow-600"
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Header / Hero Section */}
            <div className="bg-gray-50 py-12 px-4 border-b border-gray-100">
                <div className="w-full mx-auto">
                    <button
                        onClick={() => navigate(localizePath('/loyalty'))}
                        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition mb-8 group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition" />
                        {t('redeem.back_to_loyalty')}
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
                        <div className="max-w-2xl text-center md:text-left">
                            <h2 className="text-blue-600 font-bold uppercase tracking-widest text-xs md:text-sm mb-2 md:mb-3">Rewards & Store</h2>
                            <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
                                {t('redeem.hero_title')} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                    {t('redeem.hero_subtitle')}
                                </span>
                            </h1>
                            <p className="text-gray-500 text-base md:text-lg">
                                {t('redeem.hero_desc')}
                            </p>
                        </div>

                        <div className="bg-white p-5 md:p-6 rounded-3xl shadow-xl shadow-blue-500/5 border border-blue-50 flex items-center justify-center md:justify-start gap-4 md:gap-6 mx-auto md:mx-0 w-full max-w-sm md:w-auto">
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
                                <Coins size={24} className="md:hidden" />
                                <Coins size={28} className="hidden md:block" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5 md:mb-1">{t('redeem.sidebar_balance_label')}</p>
                                <p className="text-2xl md:text-3xl font-black text-gray-900">{t('redeem.balance_display', { count: balance.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US') })}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full px-4 md:px-8 mx-auto py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content: Rewards Grid */}
                    <div className="lg:col-span-2 space-y-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900">{t('redeem.section_popular')}</h3>
                            <div className="h-px flex-1 bg-gray-100 mx-6 hidden md:block"></div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {rewards.map(({ key, ...reward }) => (
                                <RewardCardBig
                                    key={key}
                                    {...reward}
                                    userPoints={balance}
                                    onRedeem={() => setSelectedItem({ key, ...reward })}
                                    t={t}
                                    i18n={i18n}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Sidebar: Info & Help */}
                    <div className="space-y-8">
                        <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 opacity-10">
                                <Flame size={120} />
                            </div>
                            <h4 className="font-bold text-xl mb-4 relative z-10">{t('redeem.btn_how_to_earn')}</h4>
                            <p className="text-blue-100 text-sm mb-6 opacity-80 relative z-10">
                                {t('loyalty.thanks')}
                            </p>
                            <button
                                onClick={() => navigate(localizePath('/loyalty'))}
                                className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition relative z-10"
                            >
                                {t('loyalty.btn_tasks')}
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                            <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <ShieldCheck size={18} className="text-blue-600" />
                                {t('redeem.terms_title')}
                            </h4>
                            <ul className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <li key={i} className="flex gap-3 text-sm text-gray-500 leading-relaxed">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-1.5 shrink-0"></div>
                                        {t(`redeem.term_${i}`)}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-gray-900 rounded-3xl p-8 text-white">
                            <HelpCircle size={32} className="text-blue-400 mb-4" />
                            <h4 className="font-bold text-lg mb-2">{t('redeem.support_title')}</h4>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                {t('redeem.support_desc')}
                            </p>
                            <button className="flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300 transition group">
                                {t('redeem.btn_contact_support')} <ChevronRight size={16} className="group-hover:translate-x-1 transition" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <RedeemModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
                onConfirm={() => selectedItem && handleRedeem(selectedItem.key)}
                isProcessing={redeemMutation.isPending}
            />
        </div>
    );
};

const RewardCardBig = ({ title, subtitle, desc, points, icon: Icon, color, iconBg, userPoints, onRedeem, t, i18n }: any) => {
    const canAfford = userPoints >= points;

    return (
        <div className={`p-1 rounded-3xl bg-white border border-gray-100 hover:border-blue-200 transition duration-300 group shadow-sm hover:shadow-md`}>
            <div className="p-5 md:p-8 flex flex-col md:flex-row items-stretch md:items-center gap-5 md:gap-8">
                {/* Top wrapper for mobile: Icon + Info */}
                <div className="flex flex-row items-start md:items-center gap-4 md:gap-6 flex-1 min-w-0">
                    <div className={`w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl md:rounded-3xl flex items-center justify-center shrink-0 ${iconBg} shadow-inner`}>
                        <Icon size={32} className="md:hidden drop-shadow-sm" />
                        <Icon size={40} className="hidden md:block drop-shadow-sm" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                            <h4 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">{title}</h4>
                            <span className={`px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r ${color}`}>
                                {subtitle}
                            </span>
                        </div>
                        <p className="text-gray-500 text-xs md:text-sm lg:text-base leading-relaxed mb-3">
                            {desc}
                        </p>
                        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 w-fit px-3 py-1.5 rounded-xl border border-blue-100">
                            <Coins size={14} className="md:size-4" />
                            <span className="font-black text-xs md:text-sm">{points.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} {t('common.points', 'Points')}</span>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-auto mt-2 md:mt-0 flex flex-col justify-center shrink-0">
                    <button
                        onClick={onRedeem}
                        disabled={!canAfford}
                        className={`w-full md:px-8 py-3.5 md:py-4 rounded-2xl font-bold transition flex items-center justify-center gap-2 shadow-lg
                            ${canAfford
                                ? 'bg-gray-900 text-white hover:bg-blue-600 shadow-gray-900/10 hover:shadow-blue-500/20'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}
                        `}
                    >
                        {canAfford ? t('redeem.btn_redeem_now') : t('redeem.btn_insufficient')}
                    </button>
                    <p className="text-[9px] md:text-[10px] text-gray-400 mt-3 text-center md:text-left font-medium uppercase tracking-tighter">
                        {t('redeem.points_expiry_note')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RedeemPage;
