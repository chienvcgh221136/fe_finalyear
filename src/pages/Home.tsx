import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { SearchBar } from '../components/SearchBar';
import ListingCard from '../components/ListingCard';
import VipPostCard from '../components/post/VipPostCard';
import { postsAPI } from '../services/api';
import { ChevronRight, Crown, Clock, Building2, Home as HomeIcon, MapPin } from 'lucide-react';
import LocalizedLink from '../components/common/LocalizedLink';
import { Button } from '../components/ui/Button';
import { useTranslation, Trans } from 'react-i18next';

import type { Post } from '../types';

const Home = () => {
    const { t } = useTranslation();

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
        { label: t('home.categories.buy_house'), icon: HomeIcon, href: '/buy?transactionType=SALE&propertyType=HOUSE', color: 'bg-blue-100 text-blue-600' },
        { label: t('home.categories.rent_apartment'), icon: Building2, href: '/rent?transactionType=RENT&propertyType=APARTMENT', color: 'bg-orange-100 text-orange-600' },
        { label: t('home.categories.land'), icon: MapPin, href: '/buy?propertyType=LAND', color: 'bg-green-100 text-green-600' },
        { label: t('home.categories.office'), icon: Building2, href: '/rent?propertyType=OFFICE', color: 'bg-purple-100 text-purple-600' },
        { label: t('home.categories.shophouse'), icon: Building2, href: '/buy?propertyType=SHOPHOUSE', color: 'bg-red-100 text-red-600' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Hero Section */}
            <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-40">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-white overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px]"></div>
                    <div className="absolute right-0 top-0 -z-10 h-full w-1/2 bg-gradient-to-b from-blue-50/50 to-transparent blur-3xl"></div>
                </div>

                <div className="w-full px-4 md:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="mx-auto max-w-4xl text-center mb-16"
                    >
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight">
                            <Trans
                                i18nKey="home.hero.title"
                                components={{
                                    keyword: <span className="inline-block bg-blue-600 text-white px-8 py-2 rounded-3xl shadow-2xl shadow-blue-600/30 font-black my-3 transform -rotate-1" />,
                                    br: <br />,
                                    sub: <span className="text-slate-400 font-medium" />
                                }}
                            />
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium mt-10">
                            <Trans
                                i18nKey="home.hero.subtitle"
                                components={{
                                    br: <br className="hidden md:block" />
                                }}
                            />
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
                <div className="w-full px-4 md:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-8">
                        {categories.map((cat, i) => (
                            <motion.div
                                key={cat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                            >
                                <LocalizedLink
                                    to={cat.href}
                                    className="group flex flex-col items-center gap-4 rounded-2xl bg-gray-50 p-8 transition-all hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 border border-transparent hover:border-gray-100"
                                >
                                    <div className={`p-4 rounded-2xl ${cat.color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                                        <cat.icon className={`h-8 w-8`} />
                                    </div>
                                    <span className="font-bold text-gray-900 text-lg">{cat.label}</span>
                                </LocalizedLink>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* VIP Posts */}
            <section className="py-16 md:py-24 bg-white relative">
                <div className="w-full px-4 md:px-8">
                    <div className="flex items-end justify-between mb-10 md:mb-12">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm font-bold text-yellow-600 uppercase tracking-wider">{t('home.vip_posts.label')}</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">{t('home.vip_posts.title')}</h2>
                        </div>
                        <LocalizedLink 
                            to="/search?isVip=true"
                            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all group whitespace-nowrap"
                        >
                            <span>{t('home.vip_posts.view_all')}</span>
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </LocalizedLink>
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
                                <VipPostCard key={post._id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-gray-50 text-gray-400 border-2 border-dashed border-gray-100">
                            <Crown className="mb-4 h-12 w-12 opacity-20" />
                            <p className="font-medium">{t('home.vip_posts.no_posts')}</p>
                        </div>
                    )}

                    <div className="mt-8 text-center md:hidden px-4">
                        <LocalizedLink 
                            to="/search?isVip=true"
                            className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <span>{t('home.vip_posts.view_all')}</span>
                            <ChevronRight className="h-4 w-4" />
                        </LocalizedLink>
                    </div>
                </div>
            </section>

            {/* Recent Posts */}
            <section className="py-16 md:py-24 bg-gray-50/50">
                <div className="w-full px-4 md:px-8">
                    <div className="flex items-end justify-between mb-10 md:mb-12">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-5 w-5 text-blue-600" />
                                <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">{t('home.recent_posts.label')}</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">{t('home.recent_posts.title')}</h2>
                        </div>
                        <LocalizedLink 
                            to="/search"
                            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-white transition-all group whitespace-nowrap"
                        >
                            <span>{t('home.recent_posts.view_all')}</span>
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </LocalizedLink>
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
                            <p className="font-medium">{t('home.recent_posts.no_posts')}</p>
                        </div>
                    )}

                    <div className="mt-8 text-center md:hidden px-4">
                        <LocalizedLink 
                            to="/search"
                            className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <span>{t('home.recent_posts.view_all')}</span>
                            <ChevronRight className="h-4 w-4" />
                        </LocalizedLink>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-white">
                <div className="w-full px-4 md:px-8">
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0A0A0A] px-6 py-16 md:px-16 md:py-24 text-center text-white shadow-2xl">
                        {/* Abstract Shapes */}
                        <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl"></div>

                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="mb-6 text-3xl font-extrabold md:text-5xl leading-tight">
                                <Trans
                                    i18nKey="home.cta.title"
                                    components={{ br: <br /> }}
                                />
                            </h2>
                            <p className="mb-10 text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
                                {t('home.cta.description')}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button size="lg" asChild className="bg-white text-black hover:bg-gray-100 font-bold px-8 py-6 h-auto text-lg rounded-xl">
                                    <LocalizedLink to="/post-ad">{t('home.cta.post_now')}</LocalizedLink>
                                </Button>
                                <Button variant="outline" size="lg" asChild className="border-gray-700 text-white hover:bg-white/10 hover:text-white font-semibold px-8 py-6 h-auto text-lg rounded-xl">
                                    <LocalizedLink to="/contact">{t('home.cta.contact')}</LocalizedLink>
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
