import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import { postService } from '../services/api';
import { ChevronDown } from 'lucide-react';

// Helper to calculate percentage
const getPercent = (value: number, min: number, max: number) => {
    return Math.round(((value - min) / (max - min)) * 100);
};

const Search = () => {
    const location = useLocation();
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filteredListings, setFilteredListings] = useState<any[]>([]);

    // Filters States
    const [city, setCity] = useState('');
    const [minArea, setMinArea] = useState('');
    const [maxArea, setMaxArea] = useState('');
    const [areaError, setAreaError] = useState('');

    // Price Range Slider State
    const MIN_PRICE = 0;
    const MAX_PRICE = 50 * 1000000000; // 50 Billion
    const [priceRange, setPriceRange] = useState([0, 50 * 1000000000]);
    const sliderRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef<'min' | 'max' | null>(null);

    // Sorting State
    const [sortOption, setSortOption] = useState('newest');

    const sortListings = (items: any[], sort: string) => {
        const sorted = [...items];
        switch (sort) {
            case 'price_asc':
                return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
            case 'price_desc':
                return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
            case 'newest':
            default:
                return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
    };

    const [propertyTypes, setPropertyTypes] = useState<string[]>([]);

    const [availableCities, setAvailableCities] = useState<string[]>([]);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const response = await postService.getAll();
                const data = response.data.data || response.data;
                const posts = Array.isArray(data) ? data : [];
                setListings(posts);
                setFilteredListings(posts);

                // Initial Filter based on URL
                let initialFiltered = [...posts];
                const searchParams = new URLSearchParams(location.search);
                const isBuyPage = location.pathname === '/buy';
                const isRentPage = location.pathname === '/rent';
                const typeParam = searchParams.get('propertyType');
                const isVipParam = searchParams.get('isVip');

                // Filter by Transaction Type (Path)
                if (isBuyPage) {
                    initialFiltered = initialFiltered.filter(p => p.transactionType === 'SALE');
                } else if (isRentPage) {
                    initialFiltered = initialFiltered.filter(p => p.transactionType === 'RENT');
                }
                // If /search, show all (unless filtered by param below)

                const transactionTypeParam = searchParams.get('transactionType');
                if (transactionTypeParam) {
                    initialFiltered = initialFiltered.filter(p => p.transactionType === transactionTypeParam);
                    setTransactionTypes([transactionTypeParam]);
                }

                // Filter by Property Type (Query Param)
                if (typeParam) {
                    initialFiltered = initialFiltered.filter(p => p.propertyType === typeParam || p.type === typeParam);
                    setPropertyTypes([typeParam]);
                } else {
                    setPropertyTypes([]);
                }

                // Filter by VIP (Query Param)
                if (isVipParam === 'true') {
                    initialFiltered = initialFiltered.filter(p => p.vip?.isActive);
                }

                setFilteredListings(initialFiltered);

                // Extract unique cities
                const fetchedCities = Array.from(new Set(posts.map((p: any) => p.address?.city || p.city).filter(Boolean))) as string[];
                const majorCities = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
                const allCities = Array.from(new Set([...majorCities, ...fetchedCities]));

                setAvailableCities(allCities);
            } catch (error) {
                console.error('Error fetching listings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, [location.pathname, location.search]);

    // Handle Slider Drag (Price)
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!draggingRef.current || !sliderRef.current) return;

            const rect = sliderRef.current.getBoundingClientRect();
            const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
            const value = Math.round(percent * (MAX_PRICE - MIN_PRICE) + MIN_PRICE);

            setPriceRange(prev => {
                const [min, max] = prev;
                // Snap to 100 Million steps for cleaner values
                const step = 100000000;
                const steppedValue = Math.round(value / step) * step;

                if (draggingRef.current === 'min') {
                    if (steppedValue > max - step) return [max - step, max];
                    return [steppedValue, max];
                } else {
                    if (steppedValue < min + step) return [min, min + step];
                    return [min, steppedValue];
                }
            });
        };

        const handleMouseUp = () => {
            draggingRef.current = null;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        if (draggingRef.current) {
            // Logic handled by startDrag which attaches listeners
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const startDrag = (type: 'min' | 'max') => {
        draggingRef.current = type;
        const step = 100000000;

        const handleMouseMove = (e: MouseEvent) => {
            if (!sliderRef.current) return;
            const rect = sliderRef.current.getBoundingClientRect();
            const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
            const value = Math.round(percent * (MAX_PRICE - MIN_PRICE) + MIN_PRICE);
            const steppedValue = Math.round(value / step) * step;

            setPriceRange(prev => {
                const [min, max] = prev;
                if (type === 'min') {
                    const newValue = Math.min(steppedValue, max - step);
                    return [newValue, max];
                } else {
                    const newValue = Math.max(steppedValue, min + step);
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

    // Transaction Type Filter Logic
    const [transactionTypes, setTransactionTypes] = useState<string[]>([]);



    const handleApplyFilters = () => {
        setAreaError(''); // Clear previous error

        // Validate Area
        if (minArea && maxArea && Number(minArea) > Number(maxArea)) {
            setAreaError('Min area cannot be greater than Max area');
            return;
        }

        let result = [...listings];

        // Ensure we respect the current page context (Buy vs Rent)
        if (location.pathname === '/buy') {
            result = result.filter(post => post.transactionType === 'SALE');
        } else if (location.pathname === '/rent') {
            result = result.filter(post => post.transactionType === 'RENT');
        }

        if (city) {
            result = result.filter(post => (post.address?.city === city) || (post.city === city));
        }

        // Filter by Area (Inputs)
        if (minArea) {
            result = result.filter(post => (post.area || 0) >= Number(minArea));
        }
        if (maxArea) {
            result = result.filter(post => (post.area || 0) <= Number(maxArea));
        }

        // Filter by Price (Slider)
        result = result.filter(post => {
            const price = post.price || 0;
            return price >= priceRange[0] && price <= priceRange[1];
        });

        if (propertyTypes.length > 0) {
            result = result.filter(post => propertyTypes.includes(post.type));
        }

        // Filter by Transaction Type (Sidebar)
        if (transactionTypes.length > 0) {
            result = result.filter(post => transactionTypes.includes(post.transactionType));
        }

        const sortedResult = sortListings(result, sortOption);
        setFilteredListings(sortedResult);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSort = e.target.value;
        setSortOption(newSort);
        setFilteredListings(prev => sortListings(prev, newSort));
    };

    const handleClearFilters = () => {
        setCity('');
        setMinArea(''); // Clear Area Inputs
        setMaxArea('');
        setPriceRange([0, MAX_PRICE]); // Reset Price Slider
        setPropertyTypes([]);
        setTransactionTypes([]); // Clear Transaction Filter
        setFilteredListings(listings);
        setAreaError('');
    };

    // Helper to format price
    const formatPrice = (price: number) => {
        if (price >= 1000000000) {
            return (price / 1000000000).toFixed(1) + ' tỷ';
        }
        if (price >= 1000000) {
            return (price / 1000000).toFixed(0) + ' triệu';
        }
        return price;
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



                    {/* Area Range (Inputs) */}
                    <div className="filter-group">
                        <label className="font-bold mb-2 block text-sm">Diện tích (m²)</label>
                        <div className="flex items-start gap-2 mb-4">
                            <div className="flex-1">
                                <span className="block text-gray-500 text-xs font-bold mb-1">Tối thiểu</span>
                                <input
                                    type="number"
                                    min="0"
                                    onKeyDown={(e) => ["-", "e", "+"].includes(e.key) && e.preventDefault()}
                                    className="w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-900 bg-gray-50"
                                    value={minArea}
                                    onChange={(e) => setMinArea(e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <span className="block text-gray-500 text-xs font-bold mb-1">Tối đa</span>
                                <input
                                    type="number"
                                    min="0"
                                    onKeyDown={(e) => ["-", "e", "+"].includes(e.key) && e.preventDefault()}
                                    className="w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-900 bg-gray-50"
                                    value={maxArea}
                                    onChange={(e) => setMaxArea(e.target.value)}
                                />
                            </div>
                        </div>
                        {areaError && <p className="text-red-500 text-xs mt-1 mb-2">{areaError}</p>}
                    </div>

                    <div className="filter-group">
                        <label className="font-bold mb-2 block text-sm">Khoảng giá (VNĐ)</label>
                        <div className="range-slider-container mb-6">
                            <div
                                className="range-track"
                                ref={sliderRef}
                                style={{
                                    background: `linear-gradient(to right, #e2e8f0 ${getPercent(priceRange[0], MIN_PRICE, MAX_PRICE)}%, var(--primary) ${getPercent(priceRange[0], MIN_PRICE, MAX_PRICE)}%, var(--primary) ${getPercent(priceRange[1], MIN_PRICE, MAX_PRICE)}%, #e2e8f0 ${getPercent(priceRange[1], MIN_PRICE, MAX_PRICE)}%)`
                                }}
                            >
                                <div
                                    className="range-thumb"
                                    style={{ left: `${getPercent(priceRange[0], MIN_PRICE, MAX_PRICE)}%` }}
                                    onMouseDown={() => startDrag('min')}
                                    role="slider"
                                    aria-valuenow={priceRange[0]}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {formatPrice(priceRange[0])}
                                    </div>
                                </div>
                                <div
                                    className="range-thumb"
                                    style={{ left: `${getPercent(priceRange[1], MIN_PRICE, MAX_PRICE)}%` }}
                                    onMouseDown={() => startDrag('max')}
                                    role="slider"
                                    aria-valuenow={priceRange[1]}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {formatPrice(priceRange[1])}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-text-secondary mt-3 font-bold">
                                <span>{formatPrice(priceRange[0])}</span>
                                <span>{formatPrice(priceRange[1])}</span>
                            </div>
                        </div>

                        {/* Price Inputs */}
                        <div className="flex items-start gap-2">
                            <div className="flex-1">
                                <span className="block text-gray-500 text-xs font-bold mb-1">Tối thiểu</span>
                                <input
                                    type="text"
                                    value={priceRange[0].toLocaleString('vi-VN')}
                                    onChange={(e) => {
                                        const val = Number(e.target.value.replace(/\./g, '').replace(/[^0-9]/g, ''));
                                        if (val <= MAX_PRICE + 1000000000) {
                                            setPriceRange([Math.min(val, priceRange[1]), priceRange[1]]);
                                        }
                                    }}
                                    className="w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-900 bg-gray-50"
                                />
                                <div className="text-xs text-blue-600 mt-1 font-medium">{formatPrice(priceRange[0])}</div>
                            </div>
                            <div className="flex-1">
                                <span className="block text-gray-500 text-xs font-bold mb-1">Tối đa</span>
                                <input
                                    type="text"
                                    value={priceRange[1].toLocaleString('vi-VN')}
                                    onChange={(e) => {
                                        const val = Number(e.target.value.replace(/\./g, '').replace(/[^0-9]/g, ''));
                                        if (val <= MAX_PRICE + 5000000000) {
                                            setPriceRange([priceRange[0], val]);
                                        }
                                    }}
                                    className="w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-900 bg-gray-50"
                                />
                                <div className="text-xs text-blue-600 mt-1 font-medium">{formatPrice(priceRange[1])}</div>
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
                                <option value="">All Cities</option>
                                {availableCities.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
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
                                <span className="text-sm font-semibold text-text-secondary">Sắp xếp:</span>
                                <select
                                    className="sort-select border-none bg-transparent font-bold text-primary pl-0 focus:ring-0 cursor-pointer"
                                    value={sortOption}
                                    onChange={handleSortChange}
                                >
                                    <option value="newest">Mới nhất</option>
                                    <option value="price_asc">Giá (Thấp đến Cao)</option>
                                    <option value="price_desc">Giá (Cao đến Thấp)</option>
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
