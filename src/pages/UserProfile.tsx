import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usersAPI, postsAPI, reviewsAPI, filesAPI } from '../services/api'; // Added filesAPI
import type { Post, User, Review } from '../types';
import { Edit, Calendar, Camera, MapPin, Clock, Star, Share2, Truck, ShieldCheck } from 'lucide-react'; // Added Camera
import { useAuth } from '../context/AuthContext'; // Added useAuth

const UserProfile = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user: currentUser } = useAuth(); // Get current user
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'posts' | 'reviews'>('posts');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SOLD'>('ALL');
    const [isUploading, setIsUploading] = useState(false);

    // Refs for file inputs
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // Fetch User Info
    const { data: user, isLoading: isUserLoading } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => usersAPI.getById(userId!),
        enabled: !!userId,
        select: (res) => res.data.data as User,
    });

    // Fetch User Posts
    const { data: posts, isLoading: isPostsLoading } = useQuery({
        queryKey: ['user-posts', userId],
        queryFn: () => postsAPI.getByUser(userId!),
        enabled: !!userId,
        select: (res) => res.data.data as Post[],
    });

    // Fetch User Reviews
    const { data: reviews } = useQuery({
        queryKey: ['user-reviews', userId],
        queryFn: () => reviewsAPI.getBySeller(userId!),
        enabled: !!userId,
        select: (res) => res.data.data as Review[],
    });

    const handleImageUpdate = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'coverImage') => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type/size if needed
        if (file.size > 5 * 1024 * 1024) {
            alert("File quá lớn (Max 5MB)");
            return;
        }

        setIsUploading(true);
        try {
            // 1. Upload file
            const uploadRes = await filesAPI.upload(file);
            const imageUrl = uploadRes.data.url;

            // 2. Update profile
            await usersAPI.updateProfile({ [type]: imageUrl });

            // 3. Refresh data
            queryClient.invalidateQueries({ queryKey: ['user', userId] });
            // Also refresh 'currentUser' if it's the logged-in user viewing their own profile
            if (currentUser?._id === userId) {
                queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
            }

            alert("Cập nhật thành công!");
        } catch (error) {
            console.error("Upload failed", error);
            alert("Có lỗi xảy ra khi tải ảnh lên.");
        } finally {
            setIsUploading(false);
            // Reset input
            if (event.target) event.target.value = '';
        }
    };

    const isOwner = currentUser?._id === userId || currentUser?.id === userId;

    if (isUserLoading) return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    if (!user) return <div className="min-h-screen pt-20 text-center text-gray-500">Người dùng không tồn tại</div>;

    const filteredPosts = posts?.filter(p => {
        if (statusFilter === 'ALL') return true;
        return p.status === statusFilter;
    }) || [];

    const activePostsCount = posts?.filter(p => p.status === 'ACTIVE').length || 0;
    const soldPostsCount = posts?.filter(p => p.status === 'SOLD').length || 0;

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-10">
            <div className="w-full px-4 md:px-8">
                {/* Profile Header Card */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                    {/* Cover Image */}
                    <div className="h-48 md:h-64 relative flex items-center justify-center overflow-hidden bg-gray-200 group">
                        {/* Display Cover Image if exists, else Blue Gradient */}
                        {user.coverImage ? (
                            <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-blue-600 to-blue-400 relative">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://static.chotot.com/storage/chotot-icons/next/pro-cover.png')] bg-repeat-x bg-contain"></div>
                                <div className="absolute right-10 bottom-0 max-w-[200px]">
                                    <img src="https://static.chotot.com/storage/chotot-icons/next/pro-truck.png" alt="" className="w-full object-contain opacity-80 mix-blend-overlay" />
                                </div>
                            </div>
                        )}

                        {/* Edit Cover Button - Only for Owner */}
                        {isOwner && (
                            <>
                                <input
                                    type="file"
                                    ref={coverInputRef}
                                    onChange={(e) => handleImageUpdate(e, 'coverImage')}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <button
                                    onClick={() => coverInputRef.current?.click()}
                                    className="absolute bottom-4 right-4 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer z-10"
                                >
                                    <Camera size={16} />
                                    <span>Thay đổi ảnh bìa</span>
                                </button>
                            </>
                        )}
                    </div>

                    <div className="px-6 pb-6 relative">
                        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-8 md:-mt-4 px-2">
                            {/* Avatar */}
                            <div className="relative group">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-md bg-white relative overflow-hidden">
                                    <img
                                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Upload Overlay for Avatar */}
                                    {isOwner && (
                                        <div
                                            onClick={() => avatarInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                                        >
                                            <Camera className="text-white" size={24} />
                                        </div>
                                    )}
                                </div>
                                {isOwner && (
                                    <input
                                        type="file"
                                        ref={avatarInputRef}
                                        onChange={(e) => handleImageUpdate(e, 'avatar')}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                )}

                                {user.role === 'ADMIN' && (
                                    <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white z-10" title="Quản trị viên">
                                        <ShieldCheck size={14} />
                                    </div>
                                )}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 mb-2 md:mb-0 pt-2">
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    {user.name}
                                    {user.isVerified && <ShieldCheck className="text-green-500 w-5 h-5" />}
                                </h1>
                                <div className="text-sm text-gray-500 space-y-1 mt-1">
                                    <p>Người theo dõi: <span className="font-bold text-gray-900">0</span></p> {/* Placeholder for now */}
                                    <p className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        Đã tham gia: <span className="text-gray-900 font-medium">{new Date(user.createdAt!).toLocaleDateString('vi-VN')}</span>
                                    </p>

                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-full font-bold text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                                    <Share2 size={16} /> Chia sẻ
                                </button>
                                {isOwner && (
                                    <Link to="/profile" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors text-sm shadow-sm shadow-blue-200">
                                        <Edit size={16} /> Chỉnh sửa hồ sơ
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Stats or Info (Optional, keeping it simple like screenshot) */}

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 min-h-[400px]">
                            {/* Tab Headers */}
                            <div className="flex border-b border-gray-100">
                                <button
                                    onClick={() => setActiveTab('posts')}
                                    className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'posts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Tất cả tin đăng ({posts?.length || 0})
                                </button>
                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'reviews' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Đánh giá ({reviews?.length || 0})
                                </button>
                            </div>

                            {/* Posts Tab Content */}
                            {activeTab === 'posts' && (
                                <div className="p-6">
                                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                                        <button
                                            onClick={() => setStatusFilter('ALL')}
                                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            Tất cả ({posts?.length || 0})
                                        </button>
                                        <button
                                            onClick={() => setStatusFilter('ACTIVE')}
                                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${statusFilter === 'ACTIVE' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            Tin đang hoạt động ({activePostsCount})
                                        </button>
                                        <button
                                            onClick={() => setStatusFilter('SOLD')}
                                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${statusFilter === 'SOLD' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            Đã bán ({soldPostsCount})
                                        </button>
                                    </div>

                                    {isPostsLoading ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
                                            ))}
                                        </div>
                                    ) : filteredPosts.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {filteredPosts.map(post => (
                                                <Link to={`/post/${post._id}`} key={post._id} className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                                    <div className="relative aspect-[4/3] bg-gray-200">
                                                        <img
                                                            src={post.images?.[0] || 'https://via.placeholder.com/300'}
                                                            alt={post.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                        {post.status === 'SOLD' && (
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                <span className="text-white font-bold px-3 py-1 border-2 border-white rounded transform -rotate-12">ĐÃ BÁN</span>
                                                            </div>
                                                        )}
                                                        {post.vip?.isActive && (
                                                            <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                                                                VIP
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-3">
                                                        <h3 className="font-medium text-gray-900 line-clamp-2 text-sm group-hover:text-blue-600 transition-colors">
                                                            {post.title}
                                                        </h3>
                                                        <div className="mt-2 flex items-center justify-between">
                                                            <span className="text-red-600 font-bold text-sm">
                                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(post.price)}
                                                            </span>
                                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                <Clock size={12} />
                                                                {new Date(post.createdAt!).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 text-gray-500">
                                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Truck className="text-gray-400" size={32} />
                                            </div>
                                            <p>Chưa có tin đăng nào.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Reviews Tab Content */}
                            {activeTab === 'reviews' && (
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-8 bg-blue-50 p-6 rounded-lg border border-blue-100">
                                        <div className="text-center">
                                            <div className="text-4xl font-extrabold text-blue-600">
                                                {user.rating?.toFixed(1) || '0.0'}
                                            </div>
                                            <div className="flex items-center justify-center gap-1 my-1">
                                                {[1, 2, 3, 4, 5].map(start => (
                                                    <Star
                                                        key={start}
                                                        size={16}
                                                        className={start <= Math.round(user.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                                                    />
                                                ))}
                                            </div>
                                            <div className="text-xs text-gray-500 font-medium">
                                                {user.totalReviews || 0} đánh giá
                                            </div>
                                        </div>
                                        <div className="h-12 w-px bg-blue-200 mx-4"></div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600 italic">
                                                "Đánh giá từ những người đã giao dịch thành công giúp bạn tin tưởng hơn."
                                            </p>
                                        </div>
                                    </div>

                                    {reviews && reviews.length > 0 ? (
                                        <div className="flex flex-col gap-6">
                                            {reviews.map(review => (
                                                <div key={review._id} className="flex gap-4 border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                                    <img
                                                        src={(review.buyerId as any)?.avatar || `https://ui-avatars.com/api/?name=${(review.buyerId as any)?.name || 'U'}`}
                                                        alt=""
                                                        className="w-10 h-10 rounded-full bg-gray-200 object-cover"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 text-sm">{(review.buyerId as any)?.name || 'Người dùng'}</h4>
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    {[1, 2, 3, 4, 5].map(star => (
                                                                        <Star
                                                                            key={star}
                                                                            size={12}
                                                                            className={star <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <span className="text-xs text-gray-400">
                                                                {new Date(review.createdAt!).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-700 text-sm mt-2 leading-relaxed">
                                                            {review.comment}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">
                                            Chưa có đánh giá nào.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Loading Overlay */}
            {isUploading && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="font-bold text-gray-800">Đang tải ảnh lên...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
