import React, { useEffect, useState } from 'react';
import { X, Award, CheckCircle, TrendingUp, Clock, Zap, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { postService } from '../../services/api';

interface UseItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { postId: string, quantity: number }) => void;
    item: {
        key: string;
        label: string;
        icon: any;
        color: string;
        count: number;
    } | null;
    isProcessing: boolean;
}

const UseItemModal: React.FC<UseItemModalProps> = ({ isOpen, onClose, onConfirm, item, isProcessing }) => {
    const { t } = useTranslation();
    const [posts, setPosts] = useState<any[]>([]);
    const [selectedPostId, setSelectedPostId] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(1);
    const [loadingPosts, setLoadingPosts] = useState(false);

    // Helper function to get detailed information for each item type
    const getItemDetails = (itemKey: string) => {
        switch (itemKey) {
            case 'ITEM_POST_PUSH':
                return {
                    title: t('loyalty.use_modal.title_push'),
                    description: t('loyalty.use_modal.desc_push'),
                    effects: [
                        t('loyalty.use_modal.effect_push_1'),
                        t('loyalty.use_modal.effect_push_2'),
                        t('loyalty.use_modal.effect_push_3'),
                        t('loyalty.use_modal.effect_push_4')
                    ],
                    policy: t('loyalty.use_modal.policy_push'),
                    icon: TrendingUp,
                    needsPost: false
                };
            case 'LEAD_CREDIT':
                return {
                    title: t('loyalty.use_modal.title_lead'),
                    description: t('loyalty.use_modal.desc_lead'),
                    effects: [
                        t('loyalty.use_modal.effect_lead_1'),
                        t('loyalty.use_modal.effect_lead_2'),
                        t('loyalty.use_modal.effect_lead_3'),
                        t('loyalty.use_modal.effect_lead_4')
                    ],
                    policy: t('loyalty.use_modal.policy_lead'),
                    icon: CheckCircle,
                    needsPost: false
                };
            case 'ITEM_VIP_BRONZE_1DAY':
                return {
                    title: t('loyalty.use_modal.title_vip_bronze'),
                    description: t('loyalty.use_modal.desc_vip_bronze'),
                    effects: [
                        t('loyalty.use_modal.effect_vip_bronze_1'),
                        t('loyalty.use_modal.effect_vip_bronze_2'),
                        t('loyalty.use_modal.effect_vip_bronze_3'),
                        t('loyalty.use_modal.effect_vip_bronze_4')
                    ],
                    policy: t('loyalty.use_modal.common_policy_vip'),
                    icon: Award,
                    needsPost: false,
                    vipDuration: t('common.days', { count: 1 })
                };
            case 'ITEM_VIP_SILVER_3DAY':
                return {
                    title: t('loyalty.use_modal.title_vip_silver'),
                    description: t('loyalty.use_modal.desc_vip_silver'),
                    effects: [
                        t('loyalty.use_modal.effect_vip_silver_1'),
                        t('loyalty.use_modal.effect_vip_silver_2'),
                        t('loyalty.use_modal.effect_vip_silver_3'),
                        t('loyalty.use_modal.effect_vip_silver_4')
                    ],
                    policy: t('loyalty.use_modal.common_policy_vip'),
                    icon: Award,
                    needsPost: false,
                    vipDuration: t('common.days', { count: 3 })
                };
            case 'ITEM_VIP_GOLD_7DAY':
                return {
                    title: t('loyalty.use_modal.title_vip_gold'),
                    description: t('loyalty.use_modal.desc_vip_gold'),
                    effects: [
                        t('loyalty.use_modal.effect_vip_gold_1'),
                        t('loyalty.use_modal.effect_vip_gold_2'),
                        t('loyalty.use_modal.effect_vip_gold_3'),
                        t('loyalty.use_modal.effect_vip_gold_4')
                    ],
                    policy: t('loyalty.use_modal.common_policy_vip'),
                    icon: Award,
                    needsPost: false,
                    vipDuration: t('common.days', { count: 7 })
                };
            default:
                return null;
        }
    };

    // Reset state when modal opens or item changes
    useEffect(() => {
        if (!isOpen) return;
        setQuantity(1);
        setSelectedPostId('');
    }, [isOpen, item?.key]);

    // Fetch posts when modal opens (only for items that need post selection)
    useEffect(() => {
        if (!isOpen || !item) return;

        const itemDetails = getItemDetails(item.key);
        if (!itemDetails?.needsPost) return;

        setLoadingPosts(true);
        postService.getMyPosts()
            .then(res => {
                setPosts(res.data.data || []);
            })
            .catch(console.error)
            .finally(() => setLoadingPosts(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, item?.key]);

    if (!isOpen || !item) return null;

    const Icon = item.icon;
    const itemDetails = getItemDetails(item.key);
    const isLeadCredit = item.key === 'LEAD_CREDIT';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition z-10"
                >
                    <X size={20} />
                </button>

                {/* Header Image/Icon Area */}
                <div className={`h-24 ${item.color.replace('text-', 'bg-').replace('50', '100')} flex items-center justify-center relative`}>
                    <div className="absolute inset-0 bg-white/20" />
                    <div className={`w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center ${item.color} relative z-10`}>
                        <Icon size={32} />
                    </div>
                </div>

                <div className="p-8">
                    {/* Title and Description */}
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{itemDetails?.title || item.label}</h3>
                        <p className="text-gray-600 mb-1">{itemDetails?.description}</p>
                        <p className="text-sm text-gray-500">
                            {t('loyalty.use_modal.currently_have', { count: item.count, label: item.label.toLowerCase() })}
                        </p>
                    </div>

                    {/* Item Effects */}
                    {itemDetails && (
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap size={18} className="text-blue-600" />
                                <h4 className="font-bold text-blue-900">{t('loyalty.use_modal.usage_effects_title')}</h4>
                            </div>
                            <ul className="space-y-2">
                                {itemDetails.effects.map((effect, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                                        <CheckCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>{effect}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Policy Information */}
                    {itemDetails?.policy && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
                            <div className="flex items-start gap-2">
                                <Info size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-amber-900 mb-1">{t('loyalty.use_modal.usage_policy_title')}</h4>
                                    <p className="text-sm text-amber-800">{itemDetails.policy}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lead Credit Notice */}
                    {isLeadCredit && (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 text-center">
                            <p className="text-green-800 font-medium">
                                {t('loyalty.use_modal.lead_credit_auto_notice')}
                            </p>
                        </div>
                    )}

                    {/* VIP Duration Badge */}
                    {itemDetails?.vipDuration && (
                        <div className="flex justify-center mb-6">
                            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full">
                                <Clock size={16} />
                                <span className="font-bold">{itemDetails.vipDuration}</span>
                            </div>
                        </div>
                    )}

                    {/* Quantity Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('loyalty.use_modal.quantity_label')}
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-12 h-12 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 font-bold text-lg"
                                type="button"
                            >-</button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val > 0 && val <= item.count) setQuantity(val);
                                }}
                                className="flex-1 h-12 text-center border-2 border-gray-300 rounded-lg font-bold text-xl text-gray-900 outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={() => setQuantity(Math.min(item.count, quantity + 1))}
                                className="w-12 h-12 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 font-bold text-lg"
                                type="button"
                            >+</button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-right">{t('loyalty.use_modal.max')}: {item.count}</p>
                    </div>

                    {/* Post Selection */}
                    {itemDetails?.needsPost && !isLeadCredit && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('loyalty.use_modal.select_post_label')} <span className="text-red-500">*</span>
                            </label>
                            {loadingPosts ? (
                                <div className="text-sm text-gray-400 italic p-4 text-center bg-gray-50 rounded-xl">
                                    {t('loyalty.use_modal.loading_posts')}
                                </div>
                            ) : (
                                <select
                                    value={selectedPostId}
                                    onChange={(e) => setSelectedPostId(e.target.value)}
                                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-700"
                                >
                                    <option value="">{t('loyalty.use_modal.select_post_placeholder')}</option>
                                    {posts.map((post: any) => (
                                        <option key={post._id} value={post._id}>
                                            {post.title} ({post.status})
                                        </option>
                                    ))}
                                </select>
                            )}
                            {posts.length === 0 && !loadingPosts && (
                                <p className="text-xs text-red-500 mt-2">{t('loyalty.use_modal.no_posts')}</p>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-6 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                            disabled={isProcessing}
                            type="button"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={() => onConfirm({ postId: selectedPostId, quantity })}
                            className={`flex-1 py-3 px-6 rounded-xl font-bold text-white shadow-lg transition flex items-center justify-center gap-2
                                ${isProcessing || (itemDetails?.needsPost && !isLeadCredit && !selectedPostId)
                                    ? 'bg-gray-400 cursor-not-allowed shadow-none'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-blue-200'}`
                            }
                            disabled={isProcessing || (itemDetails?.needsPost && !isLeadCredit && !selectedPostId)}
                            type="button"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {t('loyalty.use_modal.using')}
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    {t('loyalty.use_modal.btn_confirm_use')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UseItemModal;
