import { MapPin, Bed, Bath, Square } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ListingProps {
    post: any;
}

const ListingCard = ({ post }: ListingProps) => {
    // Format price
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(price);
    };

    return (
        <Link to={`/post/${post._id || post.id}`} className="listing-card">
            <div className="card-image-wrapper">
                <span className="badge">
                    {post.type || 'For Sale'}
                </span>
                <img
                    src={post.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}
                    alt={post.title}
                    className="card-image"
                />
                <div className="card-price">
                    {formatPrice(post.price)}
                </div>
            </div>
            <div className="card-content">
                <h3 className="card-title">
                    {post.title}
                </h3>
                <p className="card-location">
                    <MapPin size={16} />
                    <span>{post.address?.city}, {post.address?.state || 'CA'}</span>
                </p>
                <div className="card-features">
                    <div className="feature">
                        <Bed size={18} />
                        <span>{post.bedrooms || 3} Beds</span>
                    </div>
                    <div className="feature">
                        <Bath size={18} />
                        <span>{post.bathrooms || 2} Baths</span>
                    </div>
                    <div className="feature">
                        <Square size={18} />
                        <span>{post.area || 2000} sqft</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ListingCard;
