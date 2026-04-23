import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import { postService } from '../services/api';
import { useTranslation } from 'react-i18next';
import { formatVND } from '../utils/currencyUtils';
import { getLocalizedCity, translateCityToVi } from '../utils/cityTranslations';
import { SlidersHorizontal, X } from 'lucide-react';

// Helper to calculate percentage
const getPercent = (value: number, min: number, max: number) => {
    return Math.round(((value - min) / (max - min)) * 100);
};

const MIN_PRICE = 0;
const MAX_PRICE = 1000 * 1000000000; // 1000 Billion

const Search = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filteredListings, setFilteredListings] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

    // Filters States
    const [city, setCity] = useState('');
    const [minArea, setMinArea] = useState('');
    const [maxArea, setMaxArea] = useState('');
    const [areaError, setAreaError] = useState('');

    // Price Range Slider State
    const [priceRange, setPriceRange] = useState([MIN_PRICE, MAX_PRICE]);
    const sliderRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef<'min' | 'max' | null>(null);

    // Sorting State
    const [sortOption, setSortOption] = useState('newest');

    const sortListings = (items: any[], sort: string) => {
        const sorted = [...items];

        // Helper to get sorting value
        const getVipScore = (item: any) => item.vip?.isActive ? (item.vip.priorityScore || 1) : 0;

        return sorted.sort((a, b) => {
            // First Priority: VIP Score
            const vipA = getVipScore(a);
            const vipB = getVipScore(b);

            if (vipA !== vipB) {
                return vipB - vipA; // Higher score first
            }

            // Second Priority: Selected Sort
            switch (sort) {
                case 'price_asc':
                    return (a.price || 0) - (b.price || 0);
                case 'price_desc':
                    return (b.price || 0) - (a.price || 0);
                case 'newest':
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });
    };

    const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
    const PROPERTY_TYPE_LABELS: Record<string, string> = {
        'APARTMENT': 'Căn hộ',
        'HOUSE': 'Nhà riêng',
        'LAND': 'Đất nền',
        'OFFICE': 'Văn phòng',
        'SHOPHOUSE': 'Shophouse'
    };

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
                const isBuyPage = location.pathname.endsWith('/buy');
                const isRentPage = location.pathname.endsWith('/rent');
                const typeParam = searchParams.get('propertyType');
                const isVipParam = searchParams.get('isVip');

                // Filter by Transaction Type (Path)
                if (isBuyPage) {
                    initialFiltered = initialFiltered.filter(p => p.transactionType === 'SALE');
                    setTransactionTypes(['SALE']);
                } else if (isRentPage) {
                    initialFiltered = initialFiltered.filter(p => p.transactionType === 'RENT');
                    setTransactionTypes(['RENT']);
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
                setCurrentPage(1);

                // Extract unique cities
                const fetchedCities = Array.from(new Set(posts.map((p: any) => p.address?.city || p.city).filter(Boolean))) as string[];
                const majorCities = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];

                // Keep Vietnamese standard internally for availableCities
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

    const handleTransactionTypeChange = (type: string) => {
        setTransactionTypes(prev => {
            if (prev.includes(type)) return prev.filter(t => t !== type);
            return [...prev, type];
        });
    };

    const handleApplyFilters = () => {
        setAreaError(''); // Clear previous error

        // Validate Area
        if (minArea && maxArea && Number(minArea) > Number(maxArea)) {
            setAreaError(t('search_page.area_error'));
            return;
        }

        let result = [...listings];

        // Ensure we use what's selected in the sidebar, rather than hardcoding /buy to SALE here

        if (city) {
            const cityVi = translateCityToVi(city);
            result = result.filter(post =>
                (post.address?.city === city) ||
                (post.city === city) ||
                (post.address?.city === cityVi) ||
                (post.city === cityVi)
            );
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
            result = result.filter(post => propertyTypes.includes(post.propertyType) || propertyTypes.includes(post.type));
        }

        // Filter by Transaction Type (Sidebar)
        if (transactionTypes.length > 0) {
            result = result.filter(post => transactionTypes.includes(post.transactionType));
        }

        const sortedResult = sortListings(result, sortOption);
        setFilteredListings(sortedResult);
        setCurrentPage(1);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSort = e.target.value;
        setSortOption(newSort);
        setFilteredListings(prev => sortListings(prev, newSort));
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setCity('');
        setMinArea(''); // Clear Area Inputs
        setMaxArea('');
        setPriceRange([0, MAX_PRICE]); // Reset Price Slider
        setPropertyTypes([]);

        let initialT: string[] = [];
        if (location.pathname.endsWith('/buy')) initialT = ['SALE'];
        else if (location.pathname.endsWith('/rent')) initialT = ['RENT'];
        setTransactionTypes(initialT);

        let initialListings = [...listings];
        if (initialT.length > 0) {
            initialListings = initialListings.filter(p => initialT.includes(p.transactionType));
        }
        setFilteredListings(initialListings);
        setCurrentPage(1);
        setAreaError('');
    };

    // Helper to format price
    const formatPrice = (price: number) => {
        if (price >= 1000000000) {
            return (price / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' ' + t('common.billion');
        }
        if (price >= 1000000) {
            return (price / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' ' + t('common.million');
        }
        return formatVND(price);
    };

    const SidebarContent = () => (
        <>
            <div className="filter-title border-b border-gray-100 pb-4 mb-4">
                <span className="flex items-center gap-2">
                    <SlidersHorizontal size={18} className="text-blue-600" />
                    {t('search_page.filters')}
                </span>
                <div className="flex items-center gap-4">
                    <button
                        className="text-blue-600 text-xs font-bold bg-transparent hover:underline"
                        onClick={handleClearFilters}
                    >
                        {t('search_page.clear_all')}
                    </button>
                    <button
                        className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
                        onClick={() => setIsFilterDrawerOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Area Range (Inputs) */}
            <div className="filter-group">
                <label className="font-bold mb-2 block text-sm">{t('search_page.area')}</label>
                <div className="flex items-start gap-2 mb-4">
                    <div className="flex-1">
                        <span className="block text-gray-500 text-xs font-bold mb-1">{t('search_page.min')}</span>
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
                        <span className="block text-gray-500 text-xs font-bold mb-1">{t('search_page.max')}</span>
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

            {/* Price Range Slider */}
            <div className="filter-group">
                <label className="font-bold mb-2 block text-sm">{t('search_page.price_range')}</label>
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
                        <span className="block text-gray-500 text-xs font-bold mb-1">{t('search_page.min')}</span>
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
                        <span className="block text-gray-500 text-xs font-bold mb-1">{t('search_page.max')}</span>
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

            {/* City Filter */}
            <div className="filter-group">
                <label className="font-bold mb-2 block text-sm">{t('search_page.city')}</label>
                <div className="relative">
                    <input
                        list="search-city-list"
                        className="filter-input w-full bg-white border border-gray-300 rounded px-3 py-2 cursor-text"
                        placeholder={t('search_page.all_cities')}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        autoComplete="off"
                    />
                    <datalist id="search-city-list">
                        {availableCities.map((c) => {
                            const localizedValue = getLocalizedCity(c, i18n.language);
                            return <option key={c} value={localizedValue} />;
                        })}
                    </datalist>
                </div>
            </div>

            {/* Transaction Type Filter */}
            <div className="filter-group">
                <label className="font-bold mb-2 block text-sm">{t('search_page.transaction_type')}</label>
                <div className="checkbox-group">
                    {['SALE', 'RENT'].map(type => (
                        <label key={type} className="checkbox-item">
                            <input
                                type="checkbox"
                                checked={transactionTypes.includes(type)}
                                onChange={() => handleTransactionTypeChange(type)}
                            />
                            {type === 'SALE' ? t('search_page.sale') : t('search_page.rent')}
                        </label>
                    ))}
                </div>
            </div>

            {/* Property Type Filter */}
            <div className="filter-group">
                <label className="font-bold mb-2 block text-sm">{t('search_page.property_type')}</label>
                <div className="checkbox-group">
                    {['APARTMENT', 'HOUSE', 'LAND', 'OFFICE', 'SHOPHOUSE'].map(type => (
                        <label key={type} className="checkbox-item">
                            <input
                                type="checkbox"
                                checked={propertyTypes.includes(type)}
                                onChange={() => handleTypeChange(type)}
                            />
                            {t(`search_page.property_type_${type}`, { defaultValue: PROPERTY_TYPE_LABELS[type] || type })}
                        </label>
                    ))}
                </div>
            </div>

            <button 
                className="btn btn-primary w-full mt-4 shadow-lg shadow-blue-200" 
                onClick={() => {
                    handleApplyFilters();
                    setIsFilterDrawerOpen(false);
                }}
            >
                {t('search_page.apply')}
            </button>
        </>
    );

    return (
        <div className="w-full px-4 md:px-8 mt-8 bg-gray-50/50 min-h-screen">
            <div className="page-layout w-full">
                {/* Desktop Sidebar */}
                <aside className="sidebar hidden lg:block shadow-sm">
                    <SidebarContent />
                </aside>

                {/* Mobile Filter Drawer */}
                {isFilterDrawerOpen && (
                    <div className="filter-drawer-overlay lg:hidden" onClick={() => setIsFilterDrawerOpen(false)}>
                        <div className="filter-drawer-content p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <SidebarContent />
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <main className="main-content">
                    {/* Compact Filter Bar for Mobile */}
                    <div className="lg:hidden flex items-center gap-3 mb-6 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                        <button 
                            onClick={() => setIsFilterDrawerOpen(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm transition-all active:scale-95"
                        >
                            <SlidersHorizontal size={18} />
                            {t('search_page.filters')}
                            {(transactionTypes.length > 0 || propertyTypes.length > 0 || priceRange[0] > MIN_PRICE || priceRange[1] < MAX_PRICE) && (
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                        </button>
                        <div className="w-px h-6 bg-gray-200"></div>
                        <select
                            className="flex-1 bg-white border-0 font-bold text-gray-700 text-sm focus:ring-0 cursor-pointer text-center"
                            value={sortOption}
                            onChange={handleSortChange}
                        >
                            <option value="newest">{t('search_page.newest')}</option>
                            <option value="price_asc">{t('search_page.price_asc')}</option>
                            <option value="price_desc">{t('search_page.price_desc')}</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <div className="hidden lg:flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-1">{t('search_page.title')}</h1>
                                <span className="results-count font-medium">{t('search_page.showing_results', { count: filteredListings.length })}</span>
                            </div>
                            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                                <span className="text-sm font-semibold text-gray-500">{t('search_page.sort_by')}</span>
                                <select
                                    className="sort-select border-none bg-transparent font-bold text-blue-600 pl-0 focus:ring-0 cursor-pointer"
                                    value={sortOption}
                                    onChange={handleSortChange}
                                >
                                    <option value="newest">{t('search_page.newest')}</option>
                                    <option value="price_asc">{t('search_page.price_asc')}</option>
                                    <option value="price_desc">{t('search_page.price_desc')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Mobile Title Display */}
                        <div className="lg:hidden text-center mb-4">
                            <h1 className="text-xl font-bold text-gray-900">{t('search_page.title')}</h1>
                            <p className="text-xs text-gray-500 mt-1">{t('search_page.showing_results', { count: filteredListings.length })}</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">{t('search_page.loading')}</div>
                    ) : (
                        <>
                            <div className="listings-grid">
                                {filteredListings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((post) => (
                                    <ListingCard key={post._id || post.id} post={post} />
                                ))}
                            </div>

                            {filteredListings.length > ITEMS_PER_PAGE && (
                                <div className="border-t border-gray-100 p-4 mt-6 flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="rounded-lg border border-gray-200 px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50 font-medium"
                                    >
                                        {t('admin.common.prev', { defaultValue: 'Trang trước' })}
                                    </button>
                                    <span className="text-sm font-medium text-gray-600 px-4">
                                        {t('admin.common.page_display', { defaultValue: 'Hiển thị trang' })} {currentPage} / {Math.ceil(filteredListings.length / ITEMS_PER_PAGE)}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredListings.length / ITEMS_PER_PAGE), p + 1))}
                                        disabled={currentPage === Math.ceil(filteredListings.length / ITEMS_PER_PAGE)}
                                        className="rounded-lg border border-gray-200 px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50 font-medium"
                                    >
                                        {t('admin.common.next', { defaultValue: 'Trang sau' })}
                                    </button>
                                </div>
                            )}

                            {filteredListings.length === 0 && (
                                <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                                    {t('search_page.no_results')}
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
