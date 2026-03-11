import { MapPin, ArrowRight } from 'lucide-react';
import LocalizedLink from '../common/LocalizedLink';
import { useTranslation } from 'react-i18next';
import { formatVND } from '../../utils/currencyUtils';

import type { Post } from '../../types';

interface VipPostCardProps {
    post: Post;
}

const VipPostCard = ({ post }: VipPostCardProps) => {
    const { t } = useTranslation();

    // Format price
    const formatPrice = (price: number) => {
        if (!price) return t('common.contact');
        if (price >= 1000000000) {
            return `${(price / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} ${t('common.billion')}`;
        }
        if (price >= 1000000) {
            return `${(price / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ${t('common.million')}`;
        }
        return formatVND(price);
    };

    const image = post.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-e32c1631f194?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
    const district = post.address?.district || post.district || t('common.unknown');
    const city = post.address?.city || post.city || t('common.unknown');

    return (
        <LocalizedLink to={`/post/${post._id}`} className="group relative block h-[400px] w-full overflow-hidden rounded-2xl shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src={image}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity group-hover:opacity-90"></div>
            </div>

            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-[#8B5CF6] text-white px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-purple-500/30 flex items-center gap-1 backdrop-blur-md border border-white/10">
                    VIP PREMIUM
                </span>
                <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                    {post.transactionType === 'RENT' ? t('common.rent') : t('common.sale')}
                </span>
            </div>

            {/* Content at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white translate-y-2 transition-transform duration-300 group-hover:translate-y-0">

                {/* Price Tag */}
                <div className="mb-2 inline-flex items-center gap-1">
                    <span className="text-2xl font-extrabold text-white tracking-tight text-shadow-sm">
                        {formatPrice(post.price)}
                    </span>
                    {post.transactionType === 'RENT' && <span className="text-sm text-gray-300 font-medium">/{t('common.month')}</span>}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold leading-snug mb-2 line-clamp-2 group-hover:text-purple-200 transition-colors">
                    {post.title}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-gray-300 text-sm mb-4">
                    <MapPin size={16} className="text-purple-400 shrink-0" />
                    <span className="truncate">{district}, {city}</span>
                </div>

                {/* Hover Action */}
                <div className="flex items-center text-sm font-bold text-purple-300 opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    {t('common.view_details')} <ArrowRight size={16} className="ml-1" />
                </div>
            </div>
        </LocalizedLink>
    );
};

export default VipPostCard;
