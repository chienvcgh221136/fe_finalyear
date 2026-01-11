import { useState, useEffect } from 'react';
import ListingCard from '../components/ListingCard';
import { postService } from '../services/api';
import { Search, MapPin } from 'lucide-react';
import bannerImg from '../assets/banner.jpg';

const Home = () => {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const response = await postService.getAll();
                const data = response.data.data || response.data;
                setListings(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error fetching listings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, []);

    return (
        <div>
            <section className="hero" style={{
                backgroundImage: `url(${bannerImg})`
            }}>
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1>Find your dream home with ease.</h1>
                    <p>Discover thousands of properties for sale and rent in your preferred city.</p>

                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Keyword (e.g. Modern, Pool...)"
                            className="search-input"
                        />
                        <select className="search-input">
                            <option value="" disabled selected>Select City</option>
                            <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                            <option value="Hà Nội">Hà Nội</option>
                            <option value="Đà Nẵng">Đà Nẵng</option>
                        </select>
                        <button className="btn btn-primary">
                            <Search size={18} style={{ marginRight: '8px' }} />
                            Search
                        </button>
                    </div>
                </div>
            </section>

            <section className="container" style={{ paddingBottom: '4rem' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                    <div>
                        <h2 className="font-bold" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Featured VIP Listings</h2>
                        <p className="text-secondary">Handpicked properties just for you.</p>
                    </div>
                    <a href="#" className="text-primary font-bold">View All VIPs →</a>
                </div>

                {loading ? (
                    <div className="text-center p-4">Loading...</div>
                ) : (
                    <div className="grid-4">
                        {listings.map((post) => (
                            <ListingCard key={post._id || post.id} post={post} />
                        ))}
                        {listings.length === 0 && <p className="text-secondary">No listings found.</p>}
                    </div>
                )}
            </section>

            <section className="container" style={{ marginBottom: '4rem' }}>
                <h2 className="font-bold" style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Recommended for You</h2>
                <p className="text-secondary" style={{ marginBottom: '2rem' }}>Based on your recent searches and interests</p>

                <div className="grid-4">
                    {listings.slice(0, 4).map((post) => (
                        <ListingCard key={`rec-${post._id || post.id}`} post={post} />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;
