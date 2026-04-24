import LocalizedLink from '../common/LocalizedLink';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Phone, MessageCircle, AlertCircle, CheckCircle, Star, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { leadsAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';

interface AgentWidgetProps {
    user?: {
        name: string;
        avatar?: string;
        phone?: string;
        email?: string;
        _id?: string;
        createdAt?: string;
        rating?: number;
        totalReviews?: number;
        reviewCount?: number;
    };
    postId?: string; // Made optional to avoid breaking other usages if any
    updatedAt?: string;
    onStartChat?: () => void;
}

const AgentWidget = ({ user, postId, updatedAt, onStartChat }: AgentWidgetProps) => {
    const { user: currentUser } = useAuth();
    const { t } = useTranslation();

    // Generate member since date from USER data
    const memberSince = user?.createdAt
        ? t('post_detail.member_since', { date: `${new Date(user.createdAt).getMonth() + 1}/${new Date(user.createdAt).getFullYear()}` })
        : (updatedAt ? t('post_detail.member_since', { date: `${new Date(updatedAt).getMonth() + 1}/${new Date(updatedAt).getFullYear()}` }) : t('post_detail.unknown_date'));

    const userName = user?.name || t('post_detail.unverified_user');
    const firstLetter = userName.charAt(0).toUpperCase();

    const [showPhone, setShowPhone] = useState(false);
    const hasPhone = !!user?.phone;
    const originalPhone = hasPhone ? user.phone : t('common.not_updated');
    const maskedPhone = hasPhone 
        ? (originalPhone!.length > 6 ? `${originalPhone!.slice(0, 4)} *** ***` : t('post_detail.reveal_phone'))
        : t('common.not_updated');

    const [isLoadingPhone, setIsLoadingPhone] = useState(false);

    const queryClient = useQueryClient();

    const { warning, error: toastError } = useToast();

    const handleShowPhone = async () => {
        if (showPhone || !hasPhone) return;

        // If owner viewing their own post
        if (currentUser && (currentUser.id === user?._id || currentUser._id === user?._id)) {
            setShowPhone(true);
            return;
        }

        if (!currentUser) {
            warning(t('post_detail.login_to_view_phone'));
            return;
        }

        if (!postId) {
            // Fallback if no postId provided
            setShowPhone(true);
            return;
        }

        setIsLoadingPhone(true);
        try {
            await leadsAPI.showPhone(postId);
            setShowPhone(true);
            // Refresh VIP and stats immediately
            queryClient.invalidateQueries({ queryKey: ['vip', 'me'] });
        } catch (error: any) {
            console.error("Show phone error", error);
            const message = error.response?.data?.message || t('post_detail.cannot_view_phone');
            toastError(message);
        } finally {
            setIsLoadingPhone(false);
        }
    };

    // Dynamic values for rating - default to hidden or 0 if not present
    const rating = user?.rating || 0;
    const reviewCount = user?.totalReviews || user?.reviewCount || 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full mb-6 relative overflow-hidden">
            {/* VIP Decor if applicable (Optional) */}

            {/* Header Label */}
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-6">
                {t('post_detail.posted_by')}
            </div>

            {/* Profile Section */}
            <div className="flex items-start gap-4 mb-6">
                <div className="relative">
                    <LocalizedLink to={user?._id ? `/user/${user._id}` : '#'}>
                        <div className="p-0.5 rounded-full border-2 border-blue-100 hover:opacity-80 transition-opacity">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt="Agent"
                                    className="w-14 h-14 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-2xl font-bold uppercase">
                                    {firstLetter}
                                </div>
                            )}
                        </div>
                    </LocalizedLink>
                </div>

                <div className="flex flex-col pt-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                        <LocalizedLink to={user?._id ? `/user/${user._id}` : '#'} className="font-bold text-gray-900 text-lg leading-none truncate hover:underline hover:text-blue-600 transition-colors">
                            {userName}
                        </LocalizedLink>
                        <CheckCircle size={16} className="text-blue-600 fill-blue-600 text-white flex-shrink-0" />
                    </div>

                    {/* Show rating if it exists in data */}
                    {(rating > 0) ? (
                        <div className="flex items-center gap-2 text-sm mb-1">
                            <div className="flex items-center gap-1">
                                <Star size={14} className="text-orange-500 fill-orange-500" />
                                <span className="font-bold text-orange-500">{Number(rating).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}</span>
                            </div>
                            <span className="text-gray-400 text-xs">({reviewCount} {t('post_detail.reviews')})</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-sm mb-1 text-gray-500">
                            <Star size={14} className="text-gray-300" />
                            <span className="text-xs">{t('post_detail.no_reviews_yet')}</span>
                        </div>
                    )}

                    <p className="text-gray-500 text-xs">{memberSince}</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mb-8">
                <button
                    onClick={handleShowPhone}
                    disabled={isLoadingPhone || !hasPhone}
                    className={`w-full font-bold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2.5 transition-all shadow-sm ${showPhone
                        ? 'bg-white border-2 border-blue-600 text-blue-600'
                        : (!hasPhone ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-blue-600 hover:bg-blue-700 text-white')
                        } ${isLoadingPhone ? 'opacity-70 cursor-wait' : ''}`}
                >
                    {isLoadingPhone ? (
                        <span>{t('post_detail.checking')}</span>
                    ) : (
                        <>
                            {showPhone ? <Phone size={20} className="text-blue-600" /> : (hasPhone ? <Lock size={18} /> : <Phone size={20} className="text-gray-400" />)}
                            <span>
                                {showPhone ? originalPhone : maskedPhone}
                            </span>
                        </>
                    )}

                    {!showPhone && !isLoadingPhone && hasPhone && <span className="text-xs opacity-80 font-normal ml-auto hidden sm:inline-block">{t('post_detail.reveal_phone')}</span>}
                </button>

                <button
                    onClick={onStartChat}
                    className="w-full bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2.5 transition-colors">
                    <MessageCircle size={20} />
                    <span>{t('post_detail.chat_now')}</span>
                </button>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 pt-6 text-center">
                <button className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors">
                    <AlertCircle size={18} />
                    <span>{t('common.report')}</span>
                </button>
            </div>

        </div>
    );
};

export default AgentWidget;
