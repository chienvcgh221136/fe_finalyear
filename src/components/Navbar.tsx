import { Link } from 'react-router-dom';
import { Package, Home, Building2 } from 'lucide-react';

const Navbar = () => {
    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="container mx-auto px-4 h-[72px] flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                        <Package size={24} />
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">EstateMarket</span>
                </Link>

                {/* Centered Navigation */}
                <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                    <Link to="/buy" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition-colors">
                        <Home size={18} />
                        <span>Mua bán</span>
                    </Link>
                    <Link to="/rent" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition-colors">
                        <Building2 size={18} />
                        <span>Cho thuê</span>
                    </Link>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-6">
                    <Link to="/post-ad" className="hidden md:block text-gray-900 font-bold hover:text-blue-600 transition-colors">
                        Đăng tin
                    </Link>
                    <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
                    <Link to="/login" className="font-bold text-gray-700 hover:text-blue-600 transition-colors">
                        Đăng nhập
                    </Link>
                    <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-all shadow-lg shadow-blue-600/20">
                        Đăng ký
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
