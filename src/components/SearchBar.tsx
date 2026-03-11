import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { postsAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import { useLocalizedPath } from '../utils/pathUtils';
import type { Post } from '../types';

// Simple cache for search suggestions
const searchCache: { [key: string]: Post[] } = {};

export function SearchBar() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const localizePath = useLocalizedPath();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [keyword, setKeyword] = useState('');
    const [type, setType] = useState('SALE'); // SALE or RENT
    const [city, setCity] = useState(''); // Empty = Toàn quốc
    const [suggestions, setSuggestions] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (keyword.length >= 2) {
                if (searchCache[keyword]) {
                    setSuggestions(searchCache[keyword]);
                    setShowSuggestions(true);
                    return;
                }

                setIsLoading(true);
                try {
                    const response = await postsAPI.getSuggestions(keyword);
                    const data = response.data.data || [];
                    setSuggestions(data);
                    searchCache[keyword] = data;
                    setShowSuggestions(true);
                } catch (error) {
                    console.error('Fetch suggestions error:', error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [keyword]);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setShowSuggestions(false);
        const params = new URLSearchParams();
        if (keyword) params.append('q', keyword);
        if (city) params.append('city', city);

        const path = type === 'SALE' ? '/buy' : '/rent';
        params.append('transactionType', type);

        navigate(localizePath(`${path}?${params.toString()}`));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            if (selectedIndex >= 0) {
                e.preventDefault();
                const selected = suggestions[selectedIndex];
                navigate(localizePath(`/post/${selected._id}`));
                setShowSuggestions(false);
            } else {
                handleSearch();
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const formatPrice = (price: number) => {
        if (price >= 1000000000) return `${(price / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} ${t('common.billion')}`;
        if (price >= 1000000) return `${(price / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} ${t('common.million')}`;
        return `${price.toLocaleString('vi-VN')} đ`;
    };

    return (
        <div className="w-full max-w-5xl mx-auto" ref={dropdownRef}>
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    type="button"
                    onClick={() => setType('SALE')}
                    className={`px-8 py-3 rounded-t-xl font-bold text-base transition-all ${type === 'SALE'
                        ? 'bg-white text-blue-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10'
                        : 'bg-white/50 text-gray-600 hover:bg-white/80'}`}
                >
                    {t('search.tab_buy')}
                </button>
                <button
                    type="button"
                    onClick={() => setType('RENT')}
                    className={`px-8 py-3 rounded-t-xl font-bold text-base transition-all ${type === 'RENT'
                        ? 'bg-white text-blue-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10'
                        : 'bg-white/50 text-gray-600 hover:bg-white/80'}`}
                >
                    {t('search.tab_rent')}
                </button>
            </div>

            {/* Main Search Box */}
            <form onSubmit={handleSearch} className="bg-white rounded-b-2xl rounded-tr-2xl shadow-2xl p-6 md:p-8 pt-6 relative z-0 border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4 relative">

                    {/* Location Dropdown */}
                    <div className="md:w-1/4 relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                            <MapPin className="text-gray-400" size={20} />
                        </div>
                        <select
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full h-full min-h-[56px] pl-12 pr-10 bg-gray-50 border border-gray-200 rounded-xl appearance-none cursor-pointer text-gray-700 font-medium hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="">{t('search.nationwide')}</option>
                            {[
                                "Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Bình Dương", "Đồng Nai",
                                "Cần Thơ", "Hải Phòng", "Long An", "Bà Rịa - Vũng Tàu",
                                "Tiền Giang", "Khánh Hòa", "Bình Thuận", "Quảng Ninh",
                                "Lâm Đồng", "Thanh Hóa", "Nghệ An", "Bắc Ninh"
                            ].map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <ChevronDown className="text-gray-400" size={16} />
                        </div>
                    </div>

                    {/* Keyword Input */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            {isLoading ? <Loader2 className="animate-spin text-blue-500" size={20} /> : <Search className="text-gray-400" size={20} />}
                        </div>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => keyword.length >= 2 && setShowSuggestions(true)}
                            placeholder={type === 'SALE' ? t('search.placeholder_buy') : t('search.placeholder_rent')}
                            className="w-full h-full min-h-[56px] pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                        />

                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="max-h-[400px] overflow-y-auto py-2">
                                    {suggestions.map((post, index) => (
                                        <div
                                            key={post._id}
                                            onClick={() => {
                                                navigate(localizePath(`/post/${post._id}`));
                                                setShowSuggestions(false);
                                            }}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="w-16 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
                                                {post.images?.[0] ? (
                                                    <img src={post.images[0]} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <Search size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 truncate text-sm md:text-base">{post.title}</h4>
                                                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mt-0.5">
                                                    <span className="text-blue-600 font-bold">{formatPrice(post.price)}</span>
                                                    <span>•</span>
                                                    <span className="truncate">{post.address.district}, {post.address.city}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-gray-300 h-4 w-4" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {showSuggestions && keyword.length >= 2 && suggestions.length === 0 && !isLoading && (
                            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 p-8 text-center z-100">
                                <div className="text-gray-400 mb-2">
                                    <Search size={32} className="mx-auto opacity-20" />
                                </div>
                                <p className="text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">{t('search.no_results_for')} "{keyword}"</p>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 rounded-xl h-auto py-4 shadow-lg shadow-blue-600/30 transition-transform active:scale-95"
                    >
                        <span className="mr-2 text-lg">{t('search.btn_search')}</span>
                        <ChevronRight size={20} />
                    </Button>
                </div>

                {/* Quick Filters / Suggestions */}
                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-gray-400 font-medium mr-2">{t('search.suggestions')}:</span>
                    <button type="button" onClick={() => { setCity('Hồ Chí Minh'); setKeyword(''); }} className="px-4 py-1.5 rounded-full bg-gray-50 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-colors font-medium">
                        Hồ Chí Minh
                    </button>
                    <button type="button" onClick={() => { setCity('Hà Nội'); setKeyword(''); }} className="px-4 py-1.5 rounded-full bg-gray-50 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-colors font-medium">
                        Hà Nội
                    </button>
                    <button type="button" onClick={() => { setType('RENT'); setKeyword('Căn hộ'); }} className="px-4 py-1.5 rounded-full bg-gray-50 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-colors font-medium">
                        {t('search.suggest_rent')}
                    </button>
                </div>
            </form>
        </div>
    );
}

