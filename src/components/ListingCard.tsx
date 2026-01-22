import { MapPin, Bed, Bath, Square } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ListingProps {
    post: any;
}

const ListingCard = ({ post }: ListingProps) => {
    // Format price
    const formatPrice = (price: number) => {
        if (price >= 1000000000) {
            return `${(price / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Tỷ`;
        }
        if (price >= 1000000) {
            return `${(price / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} Triệu`;
        }
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    return (
        <Link to={`/post/${post._id || post.id}`} className="group block bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
            <div className="relative h-48 overflow-hidden">
                <span className={`absolute top-3 left-3 z-10 text-white px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${post.transactionType === 'RENT' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                    {post.transactionType === 'RENT' ? 'Cho thuê' : 'Cần bán'}
                </span>
                <img
                    src={post.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm font-bold text-gray-900 border border-gray-100">
                    {formatPrice(post.price)}
                </div>
            </div>

            <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2 truncate text-base group-hover:text-blue-600 transition-colors">
                    {post.title}
                </h3>

                <p className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="truncate">{post.address?.district || post.district || 'Chưa rõ'}, {post.address?.city || post.city || 'Chưa rõ'}</span>
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                        <Bed size={16} className="text-gray-400" />
                        <span>{post.bedrooms || 2} ngủ</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                        <Bath size={16} className="text-gray-400" />
                        <span>{post.bathrooms || 1} toilet</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                        <Square size={16} className="text-gray-400" />
                        <span>{post.area || 0} m²</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ListingCard;
