import { MapPin, Bed, Bath, Square } from 'lucide-react';
import LocalizedLink from './common/LocalizedLink';
import { useTranslation } from 'react-i18next';
import { formatVND } from '../utils/currencyUtils';

import type { Post } from '../types';

interface ListingProps {
    post: Post;
    highlight?: string;
}

const HighlightText = ({ text, highlight }: { text: string; highlight?: string }) => {
    if (!highlight || !text) return <>{text}</>;

    // Split text by highlight (case insensitive)
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="bg-yellow-200 text-gray-900">{part}</span>
                ) : (
                    part
                )
            )}
        </>
    );
};

const ListingCard = ({ post, highlight }: ListingProps) => {
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

    const isVip = post.vip?.isActive;

    return (
        <LocalizedLink
            to={`/post/${post._id || post.id}`}
            className={`group block bg-white rounded-xl overflow-hidden shadow-sm hover:-translate-y-1 transition-all duration-200 
                ${isVip ? 'border-2 border-yellow-400 shadow-yellow-100 ring-2 ring-yellow-400/20' : 'border border-gray-100 hover:shadow-md'}
            `}
        >
            <div className="relative h-48 overflow-hidden">
                <div className="absolute top-3 left-3 z-10 flex gap-2">
                    <span className={`text-white px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${post.transactionType === 'RENT' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                        {post.transactionType === 'RENT' ? t('common.rent') : t('common.sale')}
                    </span>
                    {isVip && (
                        <span className="bg-yellow-400 text-black px-2.5 py-1 rounded text-xs font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                            {t('common.featured')}
                        </span>
                    )}
                </div>

                <img
                    src={post.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm font-bold text-gray-900 border border-gray-100">
                    {formatPrice(post.price)}
                </div>
            </div>

            <div className={`p-4 ${isVip ? 'bg-yellow-50/30' : ''}`}>
                <h3 className="font-bold text-gray-900 mb-2 truncate text-base group-hover:text-blue-600 transition-colors">
                    <HighlightText text={post.title} highlight={highlight} />
                </h3>

                <p className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="truncate">
                        <HighlightText
                            text={`${post.address?.district || post.district || t('common.unknown')}, ${post.address?.city || post.city || t('common.unknown')}`}
                            highlight={highlight}
                        />
                    </span>
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                        <Bed size={16} className="text-gray-400" />
                        <span>{post.bedrooms || 2} {t('common.bedrooms')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                        <Bath size={16} className="text-gray-400" />
                        <span>{post.bathrooms || 1} {t('common.bathrooms')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                        <Square size={16} className="text-gray-400" />
                        <span>{post.area || 0} m²</span>
                    </div>
                </div>
            </div>
        </LocalizedLink>
    );
};

export default ListingCard;
