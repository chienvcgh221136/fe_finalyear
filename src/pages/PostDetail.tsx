import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    MapPin, Share2, Heart, AlertCircle, ChevronRight,
    Home, Maximize2, BedDouble, Bath, Compass, FileText
} from 'lucide-react';
import Gallery from '../components/post/Gallery';
import AgentWidget from '../components/post/AgentWidget';


const PostDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                if (!id) return;
                const response = await postService.getById(id);
                setPost(response.data.data || response.data);
            } catch (error) {
                console.error('Error fetching post details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-[#F4F4F4] pt-20 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EE4D2D]"></div>
        </div>
    );

    if (!post) return <div className="min-h-screen pt-20 text-center">Property not found.</div>;

    const images = post.images || [];

    // Helper to format currency
    const formatPrice = (price: number) => {
        if (!price) return 'Liên hệ';
        if (price >= 1000000000) {
            return `${(price / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} Tỷ`;
        }
        if (price >= 1000000) {
            return `${(price / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Triệu`;
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

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12 font-sans">
            {/* Visibility Warning for Owner/Admin */}
            {post.status !== 'ACTIVE' && (
                <div className={`w-full py-3 px-4 text-center font-bold text-white ${post.status === 'REJECTED' ? 'bg-red-500' :
                        post.status === 'PENDING' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}>
                    {post.status === 'REJECTED' && `⛔ Tin này đã bị TỪ CHỐI (Lý do: ${post.rejectReason}). Chỉ có bạn mới thấy tin này.`}
                    {post.status === 'PENDING' && "⏳ Tin này đang CHỜ DUYỆT. Chưa hiển thị công khai."}
                    {post.status === 'SOLD' && "✅ Tin này đã ĐÃ BÁN."}
                </div>
            )}

            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-100 py-4 sticky top-[72px] z-10 shadow-sm/50">
                <div className="container max-w-[1140px] mx-auto px-4 text-sm flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <Link to="/" className="text-gray-500 hover:text-blue-600 transition-colors">Home</Link>
                    <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                    <Link to="/buy" className="text-gray-500 hover:text-blue-600 transition-colors">Bất động sản</Link>
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
                                            {formatPrice(post.price)}
                                        </span>
                                        <span className="text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded text-sm">
                                            ~ {(post.price / (post.area || 1) / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu/m²
                                        </span>
                                    </div>
                                    <MapPin size={18} className="text-gray-400" />
                                    <span>{post.address?.district || post.district || 'Unknown District'}, {post.address?.city || post.city || 'Unknown City'}</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 font-bold hover:bg-gray-100 hover:text-blue-600 transition-all">
                                    <Share2 size={18} />
                                    <span className="text-sm">Share</span>
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 font-bold hover:bg-red-50 hover:text-red-500 transition-all">
                                    <Heart size={18} />
                                    <span className="text-sm">Save</span>
                                </button>

                                {/* Owner Actions */}
                                {user && (user.id === post.userId?._id || user._id === post.userId?._id || user.id === post.userId || user._id === post.userId) && (
                                    <>
                                        <Link to={`/edit-post/${post._id}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition-all ml-auto">
                                            <span className="text-sm">Edit Post</span>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>



                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            <SpecItem icon={Maximize2} label="Diện tích" value={`${post.area} m²`} />
                            <SpecItem icon={BedDouble} label="Phòng ngủ" value={`${post.bedrooms} phòng`} />
                            <SpecItem icon={Bath} label="Toilet" value={`${post.bathrooms || 2} phòng`} />
                            <SpecItem icon={Compass} label="Hướng" value={post.direction || 'Đông Nam'} />
                            <SpecItem icon={FileText} label="Pháp lý" value="Sổ hồng" />
                            <SpecItem icon={Home} label="Loại hình" value={post.propertyType || post.type || 'Chung cư'} />
                            <SpecItem icon={FileText} label="Nội thất" value={post.furniture || 'Không'} />
                        </div>

                        {/* Description */}
                        <div className="mb-8">
                            <h3 className="font-bold text-gray-900 text-xl mb-4">Thông tin mô tả</h3>
                            <div className="text-gray-600 leading-relaxed whitespace-pre-line text-base bg-gray-50/50 p-6 rounded-xl border border-gray-100/50">
                                {post.description}
                            </div>
                        </div>

                        {/* Legal / Redbook Images */}
                        {post.redbookImages && post.redbookImages.length > 0 && (
                            <div className="mb-8">
                                <h3 className="font-bold text-gray-900 text-xl mb-4">Thông tin pháp lý</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {post.redbookImages.map((img: string, index: number) => (
                                        <div key={index} className="rounded-xl overflow-hidden border border-gray-200 aspect-[3/4] bg-gray-100">
                                            <img
                                                src={img}
                                                alt={`Sổ đỏ ${index + 1}`}
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
                                <h3 className="font-bold text-gray-900 text-xl mb-4">Tiện ích</h3>
                                <div className="flex flex-wrap gap-3">
                                    {post.utilities.map((util: string, idx: number) => (
                                        <span key={idx} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-100">
                                            {util}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}




                        {/* Location / Map Section */}


                    </div>

                    {/* RIGHT COLUMN: Sidebar (30%) */}
                    <div className="lg:w-[30%] space-y-6">

                        {/* Agent Widget - Sidebar Position (Next to Image) */}
                        <AgentWidget user={post.user || post.userId} updatedAt={post.updatedAt || post.createdAt} />

                        {/* Vị trí / Map Section - Moved to Sidebar */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 text-lg mb-4">Vị trí</h3>
                            <div className="bg-gray-100 h-[200px] rounded-xl flex items-center justify-center relative overflow-hidden group border border-gray-200">
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
                                <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-10 hover:scale-105 transition-transform cursor-pointer">
                                    <MapPin className="text-blue-600" size={16} />
                                    <span className="font-bold text-gray-900 text-sm">Xem bản đồ</span>
                                </div>
                            </div>
                        </div>

                        {/* Safety Tips or Ad placeholder */}
                        <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6">
                            <div className="flex items-start gap-3 mb-3">
                                <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
                                <h4 className="font-bold text-gray-900">Lưu ý an toàn</h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                Không nên đặt cọc, chuyển khoản trước khi xem nhà.
                                Hãy kiểm tra kỹ giấy tờ pháp lý và so sánh giá trong khu vực.
                            </p>
                            <Link to="#" className="text-blue-600 text-sm font-bold hover:underline">Xem thêm hướng dẫn</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostDetail;
