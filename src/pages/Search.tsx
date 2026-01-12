import { useState, useEffect, useRef } from 'react';
import ListingCard from '../components/ListingCard';
import { postService } from '../services/api';
import { ChevronDown } from 'lucide-react';

// Helper to calculate percentage
const getPercent = (value: number, min: number, max: number) => {
    return Math.round(((value - min) / (max - min)) * 100);
};

const Search = () => {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filteredListings, setFilteredListings] = useState<any[]>([]);

    // Filters States
    const [city, setCity] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    // Area Range Slider State
    const MIN_AREA = 0;
    const MAX_AREA = 3500;
    const [areaRange, setAreaRange] = useState([500, 3500]); // [min, max]
    const sliderRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef<'min' | 'max' | null>(null);

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

    // Handle Slider Drag
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!draggingRef.current || !sliderRef.current) return;

            const rect = sliderRef.current.getBoundingClientRect();
            const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
            const value = Math.round(percent * (MAX_AREA - MIN_AREA) + MIN_AREA);

            setAreaRange(prev => {
                const [min, max] = prev;
                if (draggingRef.current === 'min') {
                    // Prevent crossing
                    if (value > max - 100) return [max - 100, max];
                    return [value, max];
                } else {
                    if (value < min + 100) return [min, min + 100];
                    return [min, value];
                }
            });
        };

        const handleMouseUp = () => {
            draggingRef.current = null;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        if (draggingRef.current) { // This condition is tricky in effect, usually we attach listeners on mousedown
            // But here we rely on the ref being set in mousedown, then attaching global listeners
        }

        // Use generic handler attached to state/ref logic is cleaner
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const startDrag = (type: 'min' | 'max') => {
        draggingRef.current = type;

        const handleMouseMove = (e: MouseEvent) => {
            if (!sliderRef.current) return;
            const rect = sliderRef.current.getBoundingClientRect();
            const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
            const value = Math.round(percent * (MAX_AREA - MIN_AREA) + MIN_AREA);

            setAreaRange(prev => {
                const [min, max] = prev;
                if (type === 'min') {
                    const newValue = Math.min(value, max - 100);
                    return [newValue, max];
                } else {
                    const newValue = Math.max(value, min + 100);
                    return [min, newValue];
                }
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            draggingRef.current = null;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleTypeChange = (type: string) => {
        setPropertyTypes(prev => {
            if (prev.includes(type)) {
                return prev.filter(t => t !== type);
            }
            return [...prev, type];
        });
    };

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

        // Filter by Area
        result = result.filter(post => {
            const area = post.area || 0;
            return area >= areaRange[0] && area <= areaRange[1];
        });

        // Filter by Property Type
        if (propertyTypes.length > 0) {
            result = result.filter(post => propertyTypes.includes(post.type));
        }

        setFilteredListings(result);
    };

    const handleClearFilters = () => {
        setCity('');
        setMinPrice('');
        setMaxPrice('');
        setAreaRange([500, 3500]);
        setPropertyTypes([]);
        setFilteredListings(listings);
    };

    return (
        <div className="container">
            <div className="page-layout">
                {/* Sidebar */}
                <aside className="sidebar">
                    <div className="filter-title">
                        <span>Filters</span>
                        <button
                            className="text-primary text-sm font-bold bg-transparent"
                            onClick={handleClearFilters}
                        >
                            Clear All
                        </button>
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
                            <div
                                className="range-track"
                                ref={sliderRef}
                                style={{
                                    background: `linear-gradient(to right, #e2e8f0 ${getPercent(areaRange[0], MIN_AREA, MAX_AREA)}%, var(--primary) ${getPercent(areaRange[0], MIN_AREA, MAX_AREA)}%, var(--primary) ${getPercent(areaRange[1], MIN_AREA, MAX_AREA)}%, #e2e8f0 ${getPercent(areaRange[1], MIN_AREA, MAX_AREA)}%)`
                                }}
                            >
                                <div
                                    className="range-thumb"
                                    style={{ left: `${getPercent(areaRange[0], MIN_AREA, MAX_AREA)}%` }}
                                    onMouseDown={() => startDrag('min')}
                                ></div>
                                <div
                                    className="range-thumb"
                                    style={{ left: `${getPercent(areaRange[1], MIN_AREA, MAX_AREA)}%` }}
                                    onMouseDown={() => startDrag('max')}
                                ></div>
                            </div>
                            <div className="flex justify-between text-xs text-text-secondary mt-2 font-bold">
                                <span>{areaRange[0]} sqft</span>
                                <span>{areaRange[1]} sqft</span>
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
                            {['Apartment', 'Detached House', 'Condo', 'Townhouse'].map(type => (
                                <label key={type} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={propertyTypes.includes(type)}
                                        onChange={() => handleTypeChange(type)}
                                    />
                                    {type}
                                </label>
                            ))}
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
