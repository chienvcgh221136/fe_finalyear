import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';

export function SearchBar() {
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState('');
    const [type, setType] = useState('SALE'); // SALE or RENT

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (keyword) params.append('q', keyword);
        if (type) params.append('transactionType', type);
        navigate(`/search?${params.toString()}`); // Navigate to generic search page
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    type="button"
                    onClick={() => setType('SALE')}
                    className={`px-8 py-3 rounded-t-xl font-bold text-base transition-all ${type === 'SALE'
                        ? 'bg-white text-blue-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10'
                        : 'bg-white/50 text-gray-600 hover:bg-white/80'}`}
                >
                    Nhà đất bán
                </button>
                <button
                    type="button"
                    onClick={() => setType('RENT')}
                    className={`px-8 py-3 rounded-t-xl font-bold text-base transition-all ${type === 'RENT'
                        ? 'bg-white text-blue-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10'
                        : 'bg-white/50 text-gray-600 hover:bg-white/80'}`}
                >
                    Nhà đất cho thuê
                </button>
            </div>

            {/* Main Search Box */}
            <form onSubmit={handleSearch} className="bg-white rounded-b-2xl rounded-tr-2xl shadow-2xl p-6 md:p-8 pt-6 relative z-0 border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4">

                    {/* Location 'Fake' Dropdown */}
                    <div className="md:w-1/4 relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <MapPin className="text-gray-400" size={20} />
                        </div>
                        <div className="flex items-center justify-between w-full h-full min-h-[56px] pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl cursor-not-allowed text-gray-700 font-medium group-hover:bg-gray-100 transition-colors">
                            <span>Toàn quốc</span>
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-500">Mở rộng</span>
                        </div>
                    </div>

                    {/* Divider for Desktop - Visual Separation if needed, but managing with gap is cleaner in Flex */}

                    {/* Keyword Input */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="text-gray-400" size={20} />
                        </div>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder={type === 'SALE' ? "Tìm 'Vinhomes Central Park'..." : "Tìm 'Căn hộ Quận 1'..."}
                            className="w-full h-full min-h-[56px] pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 rounded-xl h-auto py-4 shadow-lg shadow-blue-600/30 transition-transform active:scale-95"
                    >
                        <span className="mr-2 text-lg">Tìm Kiếm</span>
                        <ChevronRight size={20} />
                    </Button>
                </div>

                {/* Quick Filters / Suggestions */}
                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-gray-400 font-medium mr-2">Gợi ý:</span>
                    <button type="button" onClick={() => setKeyword('Hồ Chí Minh')} className="px-4 py-1.5 rounded-full bg-gray-50 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-colors font-medium">
                        Hồ Chí Minh
                    </button>
                    <button type="button" onClick={() => setKeyword('Hà Nội')} className="px-4 py-1.5 rounded-full bg-gray-50 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-colors font-medium">
                        Hà Nội
                    </button>
                    <button type="button" onClick={() => { setType('RENT'); setKeyword('Căn hộ'); }} className="px-4 py-1.5 rounded-full bg-gray-50 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-colors font-medium">
                        Căn hộ cho thuê
                    </button>
                </div>
            </form>
        </div>
    );
}
