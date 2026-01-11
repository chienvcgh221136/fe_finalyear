import { useState, useEffect } from 'react';
import ListingCard from '../components/ListingCard';
import { postService } from '../services/api';
import { ChevronDown, MapPin, Grid, List } from 'lucide-react';

const Search = () => {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filteredListings, setFilteredListings] = useState<any[]>([]);

    // Filters States
    const [city, setCity] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [propertyTypes, setPropertyTypes] = useState<string[]>([]);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const response = await postService.getAll();
                const data = response.data.data || response.data;
                const posts = Array.isArray(data) ? data : [];
                setListings(posts);
                setFilteredListings(posts);
            } catch (error) {
                console.error('Error fetching listings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, []);

    const handleApplyFilters = () => {
        let result = [...listings];

        if (city) {
            result = result.filter(post => post.address?.city === city);
        }
        if (minPrice) {
            result = result.filter(post => post.price >= Number(minPrice));
        }
        if (maxPrice) {
            result = result.filter(post => post.price <= Number(maxPrice));
        }
 

        setFilteredListings(result);
    };

    return (
        <div className="container">
            <div className="page-layout">
                {/* Sidebar */}
                <aside className="sidebar">
                    <div className="filter-title">
                        <span>Filters</span>
                        <button className="text-primary text-sm font-bold bg-transparent">Clear All</button>
                    </div>

                    <div className="filter-group">
                        <label className="font-bold mb-2 block text-sm">Price Range</label>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="number"
                                placeholder="$ Min"
                                className="filter-input"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="$ Max"
                                className="filter-input"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <label className="font-bold mb-2 block text-sm">Area (sq ft)</label>
                        <div className="range-slider-container">
                            {/* CSS specific simulation for range visualization */}
                            <div className="range-track">
                                <div className="range-thumb" style={{ left: '20%' }}></div>
                                <div className="range-thumb" style={{ left: '70%' }}></div>
                            </div>
                            <div className="flex justify-between text-xs text-text-secondary mt-2">
                                <span>500</span>
                                <span>3,500</span>
                            </div>
                        </div>
                    </div>

                    <div className="filter-group">
                        <label className="font-bold mb-2 block text-sm">City</label>
                        <div className="relative">
                            <select
                                className="filter-input appearance-none bg-white cursor-pointer"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            >
                                <option value="">Select City</option>
                                <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                                <option value="Hà Nội">Hà Nội</option>
                                <option value="Đà Nẵng">Đà Nẵng</option>
                                <option value="New York">New York</option>
                                <option value="San Francisco">San Francisco</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>
                    </div>

                    <div className="filter-group">
                        <label className="font-bold mb-2 block text-sm">Property Type</label>
                        <div className="checkbox-group">
                            <label className="checkbox-item"><input type="checkbox" /> Apartment</label>
                            <label className="checkbox-item"><input type="checkbox" /> Detached House</label>
                            <label className="checkbox-item"><input type="checkbox" /> Condo</label>
                            <label className="checkbox-item"><input type="checkbox" /> Townhouse</label>
                        </div>
                    </div>

                    <button className="btn btn-primary w-full mt-4" onClick={handleApplyFilters}>
                        Apply Filters
                    </button>
                </aside>

                {/* Main Content */}
                <main className="main-content">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold mb-1">Find your dream home</h1>
                        <div className="results-header">
                            <span className="results-count">Showing {filteredListings.length} properties</span>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold text-text-secondary">Sort by:</span>
                                <select className="sort-select border-none bg-transparent font-bold text-primary pl-0 focus:ring-0 cursor-pointer">
                                    <option>Newest First</option>
                                    <option>Price (Low to High)</option>
                                    <option>Price (High to Low)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading properties...</div>
                    ) : (
                        <>
                            <div className="listings-grid">
                                {filteredListings.map((post) => (
                                    <ListingCard key={post._id || post.id} post={post} />
                                ))}
                            </div>

                            {filteredListings.length > 0 && (
                                <div className="pagination">
                                    <button className="page-btn"><ChevronDown size={14} className="rotate-90" /></button>
                                    <button className="page-btn active">1</button>
                                    <button className="page-btn">2</button>
                                    <button className="page-btn">3</button>
                                    <button className="page-btn">...</button>
                                    <button className="page-btn">12</button>
                                    <button className="page-btn"><ChevronDown size={14} className="-rotate-90" /></button>
                                </div>
                            )}

                            {filteredListings.length === 0 && (
                                <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                                    No properties found matching your filters.
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Search;
