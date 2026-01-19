import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { SearchBar } from '../components/SearchBar';
import ListingCard from '../components/ListingCard';
import { postsAPI } from '../services/api';
import { ChevronRight, Crown, Clock, Building2, Home as HomeIcon, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

// Define Post type interface locally if types file doesn't exist yet
interface Post {
    _id: string;
    title: string;
    price: number;
    address: { city: string, state: string };
    images: string[];
    [key: string]: any;
}

const Home = () => {
    const { data: vipPosts, isLoading: loadingVip } = useQuery({
        queryKey: ['posts', 'vip'],
        queryFn: () => postsAPI.getAll({ isVip: true, status: 'ACTIVE', limit: 8 }),
        select: (res) => (res.data.data ? res.data.data : (Array.isArray(res.data) ? res.data : [])) as Post[], // Handle potentially different API response structures
    });

    const { data: recentPosts, isLoading: loadingRecent } = useQuery({
        queryKey: ['posts', 'recent'],
        queryFn: () => postsAPI.getAll({ status: 'ACTIVE', limit: 8 }),
        select: (res) => (res.data.data ? res.data.data : (Array.isArray(res.data) ? res.data : [])) as Post[],
    });

    const categories = [
        { label: 'Mua bán nhà', icon: HomeIcon, href: '/buy?transactionType=SALE&propertyType=HOUSE', color: 'bg-blue-100 text-blue-600' },
        { label: 'Thuê căn hộ', icon: Building2, href: '/rent?transactionType=RENT&propertyType=APARTMENT', color: 'bg-orange-100 text-orange-600' },
        { label: 'Đất nền', icon: MapPin, href: '/buy?propertyType=LAND', color: 'bg-green-100 text-green-600' },
        { label: 'Văn phòng', icon: Building2, href: '/rent?propertyType=OFFICE', color: 'bg-purple-100 text-purple-600' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Hero Section */}
            <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-40 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-white">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px]"></div>
                    <div className="absolute right-0 top-0 -z-10 h-full w-1/2 bg-gradient-to-b from-blue-50/50 to-transparent blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="mx-auto max-w-4xl text-center mb-16"
                    >
                        <h1 className="text-5xl md:text-6xl lg:text-[72px] font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.1]">
                            Tìm kiếm <span className="text-blue-600">Bất động sản</span><br />
                            dễ dàng hơn bao giờ hết
                        </h1>
                        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium">
                            Hàng nghìn tin đăng mua bán, cho thuê nhà đất mỗi ngày. <br className="hidden md:block" />
                            Kết nối trực tiếp với chủ nhà.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mx-auto max-w-5xl"
                    >
                        <SearchBar />
                    </motion.div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-12 bg-white border-b border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        {categories.map((cat, i) => (
                            <motion.div
                                key={cat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                            >
                                <Link
                                    to={cat.href}
                                    className="group flex flex-col items-center gap-4 rounded-2xl bg-gray-50 p-8 transition-all hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 border border-transparent hover:border-gray-100"
                                >
                                    <div className={`p-4 rounded-2xl ${cat.color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                                        <cat.icon className={`h-8 w-8`} />
                                    </div>
                                    <span className="font-bold text-gray-900 text-lg">{cat.label}</span>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* VIP Posts */}
            <section className="py-16 md:py-24 bg-white relative">
                <div className="container mx-auto px-4">
                    <div className="flex items-end justify-between mb-10 md:mb-12">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm font-bold text-yellow-600 uppercase tracking-wider">Tin Nổi Bật</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Tin VIP Nổi Bật</h2>
                        </div>
                        <Button variant="ghost" asChild className="hidden md:flex gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 font-semibold group">
                            <Link to="/buy?isVip=true">
                                Xem tất cả
                                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </div>

                    {loadingVip ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="h-[340px] rounded-xl bg-gray-100 animate-pulse" />
                            ))}
                        </div>
                    ) : vipPosts && vipPosts.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {vipPosts.map((post) => (
                                <ListingCard key={post._id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-gray-50 text-gray-400 border-2 border-dashed border-gray-100">
                            <Crown className="mb-4 h-12 w-12 opacity-20" />
                            <p className="font-medium">Chưa có tin VIP nào</p>
                        </div>
                    )}

                    <div className="mt-8 text-center md:hidden">
                        <Button variant="outline" asChild className="w-full">
                            <Link to="/buy?isVip=true">Xem tất cả tin VIP</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Recent Posts */}
            <section className="py-16 md:py-24 bg-gray-50/50">
                <div className="container mx-auto px-4">
                    <div className="flex items-end justify-between mb-10 md:mb-12">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-5 w-5 text-blue-600" />
                                <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">Tin Mới Nhất</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Tin Mới Đăng</h2>
                        </div>
                        <Button variant="ghost" asChild className="hidden md:flex gap-2 text-gray-600 hover:text-blue-600 hover:bg-white font-semibold group">
                            <Link to="/buy">
                                Xem tất cả
                                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </div>

                    {loadingRecent ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="h-[340px] rounded-xl bg-gray-200 animate-pulse" />
                            ))}
                        </div>
                    ) : recentPosts && recentPosts.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {recentPosts.map((post) => (
                                <ListingCard key={post._id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-white text-gray-400 border-2 border-dashed border-gray-100">
                            <Clock className="mb-4 h-12 w-12 opacity-20" />
                            <p className="font-medium">Chưa có tin đăng nào</p>
                        </div>
                    )}

                    <div className="mt-8 text-center md:hidden">
                        <Button variant="outline" asChild className="w-full bg-white">
                            <Link to="/buy">Xem tất cả tin mới</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0A0A0A] px-6 py-16 md:px-16 md:py-24 text-center text-white shadow-2xl">
                        {/* Abstract Shapes */}
                        <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl"></div>

                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="mb-6 text-3xl font-extrabold md:text-5xl leading-tight">
                                Bạn có bất động sản cần bán <br />hoặc cho thuê?
                            </h2>
                            <p className="mb-10 text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
                                Đăng tin miễn phí, tiếp cận hàng triệu người mua tiềm năng và chốt giao dịch nhanh chóng với nền tảng của chúng tôi.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button size="lg" asChild className="bg-white text-black hover:bg-gray-100 font-bold px-8 py-6 h-auto text-lg rounded-xl">
                                    <Link to="/post-ad">Đăng tin ngay</Link>
                                </Button>
                                <Button variant="outline" size="lg" asChild className="border-gray-700 text-white hover:bg-white/10 hover:text-white font-semibold px-8 py-6 h-auto text-lg rounded-xl">
                                    <Link to="/contact">Liên hệ hỗ trợ</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
