import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import LocalizedLink from '../components/common/LocalizedLink';
import { useTranslation } from 'react-i18next';
import { postService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    MapPin, Share2, Heart, AlertCircle, ChevronRight,
    Home, Maximize2, BedDouble, Bath, Compass, FileText, Flag, Calendar
} from 'lucide-react';
import Gallery from '../components/post/Gallery';
import AgentWidget from '../components/post/AgentWidget';
import ReportModal from '../components/modals/ReportModal';


import ReviewSection from '../components/post/ReviewSection';
import ScheduleModal from '../components/modals/ScheduleModal';
import { useToast } from '../context/ToastContext';

import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const PostDetail = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const { user } = useAuth();
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const { success, error, warning } = useToast();
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

    const { data: post, isLoading: loading } = useQuery({
        queryKey: ['post', id],
        queryFn: () => postService.getById(id!).then(res => res.data.data || res.data),
        enabled: !!id
    });

    // Geocoding effect
    // Geocoding effect
    // Geocoding effect
    useEffect(() => {
        if (!post) return;

        const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        if (!token) {
            console.error("Mapbox token not found");
            return;
        }

        const fetchCoordinates = async (query: string) => {
            try {
                const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=VN&limit=1`);
                const data = await res.json();
                if (data.features && data.features.length > 0) {
                    const [lng, lat] = data.features[0].center;
                    return { latitude: lat, longitude: lng };
                }
            } catch (err) {
                console.error("Geocoding error:", err);
            }
            return null;
        };

        const getBestCoordinates = async () => {
            // 1. Try Specific Address
            const fullAddress = `${post.address?.street ? `${post.address.street}, ` : ''}${post.address?.ward ? `${post.address.ward}, ` : ''}${post.address?.district || post.district || ''}, ${post.address?.city || post.city || ''}`;
            let coords = await fetchCoordinates(fullAddress);
            if (coords) {
                setCoordinates(coords);
                return;
            }

            // 2. Try District + City (Fallback 1)
            const districtCity = `${post.address?.district || post.district || ''}, ${post.address?.city || post.city || ''}`;
            coords = await fetchCoordinates(districtCity);
            if (coords) {
                console.log("Fallback to District+City:", districtCity);
                setCoordinates(coords);
                return;
            }

            // 3. Try City Only (Fallback 2)
            const city = post.address?.city || post.city || '';
            if (city) {
                coords = await fetchCoordinates(city);
                if (coords) {
                    console.log("Fallback to City:", city);
                    setCoordinates(coords);
                    return;
                }
            }

            // 4. Default to Ho Chi Minh City
            setCoordinates({ latitude: 10.762622, longitude: 106.660172 });
        };

        getBestCoordinates();
    }, [post]);

    if (loading) return (
        <div className="min-h-screen bg-[#F4F4F4] pt-20 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!post) return <div className="min-h-screen pt-20 text-center">{t('post_detail.not_found')}</div>;

    const images = post.images || [];

    // Helper to format currency
    const formatPrice = (price: number) => {
        if (!price) return t('common.contact');
        if (price >= 1000000000) {
            return `${(price / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ${t('common.billion')}`;
        }
        if (price >= 1000000) {
            return `${(price / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} ${t('common.million')}`;
        }
        return `${price.toLocaleString('vi-VN')} đ`;
    };

    // Spec Item Component
    const SpecItem = ({ icon: Icon, label, value }: any) => (
        <div className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-0">
            <Icon size={20} className="text-gray-400" />
            <div className="flex-1 flex justify-between items-center">
                <span className="text-gray-500 font-medium">{label}</span>
                <span className="text-gray-900 font-bold">{value}</span>
            </div>
        </div>
    );

    const handleStartChat = async () => {
        if (!user) {
            warning(t('post_detail.login_to_chat'));
            return;
        }
        try {
            await import('../services/api').then(m => m.chatAPI.createOrGet({
                postId: post._id,
                sellerId: post.user?._id || post.userId?._id || post.userId
            }));
            // Redirect to chat
            window.location.href = '/chat';
        } catch (err) {
            console.error("Chat error", err);
            error(t('post_detail.chat_error'));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12 font-sans">
            {/* Visibility Warning for Owner/Admin */}
            {post.status !== 'ACTIVE' && (
                <div className={`w-full py-3 px-4 text-center font-bold text-white ${post.status === 'REJECTED' ? 'bg-red-500' :
                    post.status === 'PENDING' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}>
                    {post.status === 'REJECTED' && `${t('post_detail.status_rejected')} (${t('post_detail.reason')}: ${post.rejectReason}). ${t('post_detail.only_you_see')}.`}
                    {post.status === 'PENDING' && t('post_detail.status_pending')}
                    {post.status === 'SOLD' && t('post_detail.status_sold')}
                </div>
            )}

            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-100 py-4 sticky top-[72px] z-10 shadow-sm/50">
                <div className="container max-w-[1140px] mx-auto px-4 text-sm flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <LocalizedLink to="/" className="text-gray-500 hover:text-blue-600 transition-colors">{t('common.home')}</LocalizedLink>
                    <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                    <LocalizedLink to="/buy" className="text-gray-500 hover:text-blue-600 transition-colors">{t('common.real_estate')}</LocalizedLink>
                    <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                    <span className="text-gray-900 font-medium truncate">{post.title}</span>
                </div>
            </div>


            <div className="container max-w-[1140px] mx-auto px-4 mt-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* LEFT COLUMN: Main Content (70%) */}
                    <div className="lg:w-[70%] space-y-6">

                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                            <Gallery images={images} />
                        </div>

                        {/* Main Info Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                                {post.title}
                            </h1>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-8 border-b border-gray-100">
                                <div>
                                    <div className="flex items-baseline gap-4 mb-2">
                                        <span className="text-blue-600 text-3xl font-extrabold tracking-tight">
                                            {formatPrice(post.price)} {post.transactionType === 'RENT' ? `/${t('common.month')}` : ''}
                                        </span>
                                        {post.transactionType === 'SALE' && post.area && (
                                            <span className="text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded text-sm">
                                                ~ {(post.price / post.area / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} {t('common.million_square_meter')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                        <MapPin size={18} className="text-gray-400" />
                                        <span>{post.address?.district || post.district || t('common.unknown')}, {post.address?.city || post.city || t('common.unknown')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 font-bold hover:bg-gray-100 hover:text-blue-600 transition-all">
                                    <Share2 size={18} />
                                    <span className="text-sm">{t('post_detail.share')}</span>
                                </button>

                                {user?._id !== (typeof post.userId === 'object' ? (post.userId as any)._id : post.userId) && (
                                    <button
                                        onClick={() => setIsScheduleModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 font-bold hover:bg-blue-50 hover:text-blue-600 transition-all"
                                    >
                                        <Calendar size={18} />
                                        <span className="text-sm">{t('post_detail.schedule')}</span>
                                    </button>
                                )}

                                <button
                                    onClick={async () => {
                                        if (!user) {
                                            warning(t('post_detail.login_to_save'));
                                            return;
                                        }
                                        try {
                                            const res = await import('../services/api').then(m => m.favoriteAPI.toggle(post._id));
                                            if (res.data.success) {
                                                success(res.data.message === 'Favorited' ? t('post_detail.saved') : t('post_detail.unsaved'));
                                                // Ideally, toggle a local state here to change icon style
                                            }
                                        } catch (error) {
                                            console.error("Favorite error", error);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 font-bold hover:bg-red-50 hover:text-red-500 transition-all"
                                >
                                    <Heart size={18} />
                                    <span className="text-sm">{t('post_detail.save')}</span>
                                </button>
                                <button
                                    onClick={() => setIsReportModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 font-bold hover:bg-orange-50 hover:text-orange-600 transition-all"
                                >
                                    <Flag size={18} />
                                    <span className="text-sm">{t('common.report')}</span>
                                </button>

                                {/* Owner Actions */}
                                {user && (user.id === post.userId?._id || user._id === post.userId?._id || user.id === post.userId || user._id === post.userId) && (
                                    <>
                                        <LocalizedLink to={`/post-ad?edit=${post._id}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition-all ml-auto">
                                            <span className="text-sm">{t('post_detail.edit')}</span>
                                        </LocalizedLink>
                                    </>
                                )}
                            </div>
                        </div>



                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            <SpecItem icon={Maximize2} label={t('post_detail.area')} value={`${post.area} m²`} />
                            <SpecItem icon={BedDouble} label={t('common.bedrooms')} value={`${post.bedrooms} ${t('post_detail.rooms')}`} />
                            <SpecItem icon={Bath} label={t('common.bathrooms')} value={`${post.bathrooms || 2} ${t('post_detail.rooms')}`} />
                            <SpecItem icon={Compass} label={t('post_detail.direction')} value={post.direction || t('post_detail.southeast')} />
                            <SpecItem icon={FileText} label={t('post_detail.legal')} value={t('post_detail.redbook')} />
                            <SpecItem icon={Home} label={t('post_detail.property_type')} value={t(`post_detail.property_type_${post.propertyType || post.type || 'HOUSE'}`)} />
                            <SpecItem icon={FileText} label={t('post_detail.furniture')} value={post.furniture || t('common.none')} />
                        </div>

                        {/* Description */}
                        <div className="mb-8">
                            <h3 className="font-bold text-gray-900 text-xl mb-4">{t('post_detail.description')}</h3>
                            <div className="text-gray-600 leading-relaxed whitespace-pre-line text-base bg-gray-50/50 p-6 rounded-xl border border-gray-100/50">
                                {post.description}
                            </div>
                        </div>

                        {/* Map Section */}
                        <div className="mb-8">
                            <h3 className="font-bold text-gray-900 text-xl mb-4">{t('post_detail.location')}</h3>
                            <div className="h-[400px] rounded-xl overflow-hidden border border-gray-200 relative bg-gray-100 shadow-sm">
                                {coordinates ? (
                                    <Map
                                        key={`${coordinates.latitude}-${coordinates.longitude}`}
                                        mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
                                        initialViewState={{
                                            longitude: coordinates.longitude,
                                            latitude: coordinates.latitude,
                                            zoom: 15
                                        }}
                                        style={{ width: '100%', height: '100%' }}
                                        mapStyle="mapbox://styles/mapbox/streets-v12"
                                    >
                                        <Marker longitude={coordinates.longitude} latitude={coordinates.latitude} color="red" />
                                        <NavigationControl position="bottom-right" />
                                    </Map>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 flex items-start gap-2 text-gray-600">
                                <MapPin size={18} className="mt-0.5 shrink-0 text-gray-400" />
                                <span className="font-medium">
                                    {post.address?.street ? `${post.address.street}, ` : ''}
                                    {post.address?.ward ? `${post.address.ward}, ` : ''}
                                    {post.address?.district || post.district}, {post.address?.city || post.city}
                                </span>
                            </div>
                        </div>

                        {/* Legal / Redbook Images */}
                        {post.redbookImages && post.redbookImages.length > 0 && (
                            <div className="mb-8">
                                <h3 className="font-bold text-gray-900 text-xl mb-4">{t('post_detail.legal_info')}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {post.redbookImages.map((img: string, index: number) => (
                                        <div key={index} className="rounded-xl overflow-hidden border border-gray-200 aspect-[3/4] bg-gray-100">
                                            <img
                                                src={img}
                                                alt={`${t('post_detail.redbook')} ${index + 1}`}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Amenities / Features List */}
                        {post.utilities && post.utilities.length > 0 && (
                            <div>
                                <h3 className="font-bold text-gray-900 text-xl mb-4">{t('post_detail.utilities')}</h3>
                                <div className="flex flex-wrap gap-3">
                                    {post.utilities.map((util: string, idx: number) => (
                                        <span key={idx} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-100">
                                            {util}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}


                    </div>
                    <div className="lg:w-[30%] space-y-6">
                        <AgentWidget
                            user={post.user || post.userId}
                            postId={post._id}
                            updatedAt={post.updatedAt || post.createdAt}
                            onStartChat={handleStartChat}
                        />

                        <ReviewSection postId={post._id} />





                        {/* Safety Tips or Ad placeholder */}
                        <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6">
                            <div className="flex items-start gap-3 mb-3">
                                <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
                                <h4 className="font-bold text-gray-900">{t('post_detail.safety_tips')}</h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                {t('post_detail.safety_text')}
                            </p>
                            <div className="flex items-center justify-between mb-4">
                                <LocalizedLink to="#" className="text-blue-600 text-sm font-bold hover:underline">{t('post_detail.view_guide')}</LocalizedLink>
                                <button
                                    onClick={() => setIsReportModalOpen(true)}
                                    className="text-gray-400 hover:text-gray-600 text-sm font-medium flex items-center gap-1"
                                >
                                    <Flag size={14} /> {t('common.report')}
                                </button>
                            </div>


                        </div>
                    </div>
                </div>
            </div>

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                postId={post._id}
            />

            <ScheduleModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                postId={post._id}
                postTitle={post.title}
                postImage={post.images?.[0] || ''}
                postPrice={post.price}
                postAddress={post.address?.district ? `${post.address.district}, ${post.address.city}` : post.city}
            />
        </div>
    );
};

export default PostDetail;
