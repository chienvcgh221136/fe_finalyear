import React, { useEffect, useState } from 'react';
import { X, Award, CheckCircle, TrendingUp, Clock, Zap, Info } from 'lucide-react';
import { postService } from '../../services/api';

interface UseItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { postId: string, quantity: number }) => void;
    item: {
        key: string;
        label: string;
        icon: any;
        color: string;
        count: number;
    } | null;
    isProcessing: boolean;
}

// Helper function to get detailed information for each item type
const getItemDetails = (itemKey: string) => {
    switch (itemKey) {
        case 'ITEM_POST_PUSH':
            return {
                title: 'Đẩy Tin Lên Đầu',
                description: 'Thêm lượt đẩy tin vào gói VIP của bạn.',
                effects: [
                    'Nhận thêm lượt đẩy tin',
                    'Sử dụng ở trang Quản lý VIP',
                    'Đẩy tin đăng lên đầu danh sách',
                    'Tăng khả năng tiếp cận khách hàng'
                ],
                policy: 'Lượt đẩy tin sẽ được cộng vào gói VIP. Vào Quản lý VIP để sử dụng.',
                icon: TrendingUp,
                needsPost: false
            };
        case 'LEAD_CREDIT':
            return {
                title: 'Lượt Xem Lead',
                description: 'Thêm lượt xem số điện thoại khách hàng vào gói VIP.',
                effects: [
                    'Nhận thêm lượt xem lead',
                    'Mở khóa số điện thoại khách hàng',
                    'Xem thông tin liên hệ chi tiết',
                    'Tăng cơ hội chốt giao dịch'
                ],
                policy: 'Lượt xem lead sẽ được cộng vào gói VIP. Sử dụng khi xem thông tin khách hàng quan tâm.',
                icon: CheckCircle,
                needsPost: false
            };
        case 'ITEM_VIP_BRONZE_1DAY':
            return {
                title: 'VIP Bronze - 1 Ngày',
                description: 'Kích hoạt gói VIP Bronze cho tài khoản của bạn trong 24 giờ.',
                effects: [
                    'Tài khoản được nâng cấp lên VIP Bronze',
                    'Có thể gắn VIP cho tối đa 5 tin đăng/ngày',
                    'Tin đăng VIP hiển thị nổi bật với badge Bronze',
                    'Thời hạn: 24 giờ kể từ khi kích hoạt'
                ],
                policy: 'Có thể sử dụng nhiều items cùng loại để kéo dài thời gian VIP. Sau khi kích hoạt, vào Quản lý VIP để gắn cho các tin đăng.',
                icon: Award,
                needsPost: false,
                vipDuration: '1 ngày'
            };
        case 'ITEM_VIP_SILVER_3DAY':
            return {
                title: 'VIP Silver - 3 Ngày',
                description: 'Kích hoạt gói VIP Silver cho tài khoản của bạn trong 3 ngày.',
                effects: [
                    'Tài khoản được nâng cấp lên VIP Silver',
                    'Có thể gắn VIP cho tối đa 10 tin đăng/ngày',
                    'Tin đăng VIP hiển thị nổi bật với badge Silver',
                    'Thời hạn: 3 ngày kể từ khi kích hoạt'
                ],
                policy: 'Có thể sử dụng nhiều items cùng loại để kéo dài thời gian VIP. Sau khi kích hoạt, vào Quản lý VIP để gắn cho các tin đăng.',
                icon: Award,
                needsPost: false,
                vipDuration: '3 ngày'
            };
        case 'ITEM_VIP_GOLD_7DAY':
            return {
                title: 'VIP Gold - 7 Ngày',
                description: 'Kích hoạt gói VIP Gold cho tài khoản của bạn trong 7 ngày.',
                effects: [
                    'Tài khoản được nâng cấp lên VIP Gold',
                    'Có thể gắn VIP cho tối đa 20 tin đăng/ngày',
                    'Tin đăng VIP hiển thị nổi bật với badge Gold',
                    'Thời hạn: 7 ngày kể từ khi kích hoạt'
                ],
                policy: 'Có thể sử dụng nhiều items cùng loại để kéo dài thời gian VIP. Sau khi kích hoạt, vào Quản lý VIP để gắn cho các tin đăng.',
                icon: Award,
                needsPost: false,
                vipDuration: '7 ngày'
            };
        default:
            return null;
    }
};

const UseItemModal: React.FC<UseItemModalProps> = ({ isOpen, onClose, onConfirm, item, isProcessing }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [selectedPostId, setSelectedPostId] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(1);
    const [loadingPosts, setLoadingPosts] = useState(false);

    // Reset state when modal opens or item changes
    useEffect(() => {
        if (!isOpen) return;

        // Intentionally resetting state when modal opens - safe and expected behavior
        setQuantity(1);
        setSelectedPostId('');
    }, [isOpen, item?.key]);

    // Fetch posts when modal opens (only for items that need post selection)
    useEffect(() => {
        if (!isOpen || !item) return;

        const itemDetails = getItemDetails(item.key);
        if (!itemDetails?.needsPost) return; // Skip fetching posts if not needed

        // Fetching data when modal opens - standard async data fetching pattern
        setLoadingPosts(true);
        postService.getMyPosts()
            .then(res => {
                setPosts(res.data.data || []);
            })
            .catch(console.error)
            .finally(() => setLoadingPosts(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, item?.key]);

    if (!isOpen || !item) return null;

    const Icon = item.icon;
    const itemDetails = getItemDetails(item.key);
    const isVipItem = item.key.includes('VIP');
    const isLeadCredit = item.key === 'LEAD_CREDIT';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content - Increased width for more content */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition z-10"
                >
                    <X size={20} />
                </button>

                {/* Header Image/Icon Area */}
                <div className={`h-24 ${item.color.replace('text-', 'bg-').replace('50', '100')} flex items-center justify-center relative`}>
                    <div className="absolute inset-0 bg-white/20" />
                    <div className={`w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center ${item.color} relative z-10`}>
                        <Icon size={32} />
                    </div>
                </div>

                <div className="p-8">
                    {/* Title and Description */}
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{itemDetails?.title || item.label}</h3>
                        <p className="text-gray-600 mb-1">{itemDetails?.description}</p>
                        <p className="text-sm text-gray-500">
                            Hiện có: <span className="font-bold text-blue-600">{item.count}</span> {item.label.toLowerCase()}
                        </p>
                    </div>

                    {/* Item Effects */}
                    {itemDetails && (
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap size={18} className="text-blue-600" />
                                <h4 className="font-bold text-blue-900">Hiệu quả khi sử dụng:</h4>
                            </div>
                            <ul className="space-y-2">
                                {itemDetails.effects.map((effect, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                                        <CheckCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>{effect}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Policy Information */}
                    {itemDetails?.policy && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
                            <div className="flex items-start gap-2">
                                <Info size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-amber-900 mb-1">Chính sách sử dụng:</h4>
                                    <p className="text-sm text-amber-800">{itemDetails.policy}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lead Credit Notice */}
                    {isLeadCredit && (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 text-center">
                            <p className="text-green-800 font-medium">
                                Lượt xem Lead sẽ được sử dụng tự động khi bạn xem số điện thoại tại trang chi tiết khách hàng.
                            </p>
                        </div>
                    )}

                    {/* VIP Duration Badge */}
                    {isVipItem && itemDetails?.vipDuration && (
                        <div className="flex justify-center mb-6">
                            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full">
                                <Clock size={16} />
                                <span className="font-bold">Thời hạn: {itemDetails.vipDuration}</span>
                            </div>
                        </div>
                    )}

                    {/* Quantity Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Số lượng sử dụng {quantity > 1 && itemDetails?.vipDuration && `(Tổng: ${quantity} x ${itemDetails?.vipDuration} = ${parseInt(itemDetails?.vipDuration || '0') * quantity} ngày)`}
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-12 h-12 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 font-bold text-lg"
                            >-</button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val > 0 && val <= item.count) setQuantity(val);
                                }}
                                className="flex-1 h-12 text-center border-2 border-gray-300 rounded-lg font-bold text-xl text-gray-900 outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={() => setQuantity(Math.min(item.count, quantity + 1))}
                                className="w-12 h-12 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 font-bold text-lg"
                            >+</button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-right">Tối đa: {item.count}</p>
                    </div>

                    {/* Post Selection */}
                    {itemDetails?.needsPost && !isLeadCredit && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chọn tin đăng áp dụng <span className="text-red-500">*</span>
                            </label>
                            {loadingPosts ? (
                                <div className="text-sm text-gray-400 italic p-4 text-center bg-gray-50 rounded-xl">
                                    Đang tải danh sách tin...
                                </div>
                            ) : (
                                <select
                                    value={selectedPostId}
                                    onChange={(e) => setSelectedPostId(e.target.value)}
                                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-700"
                                >
                                    <option value="">-- Chọn tin đăng --</option>
                                    {posts.map((post: any) => (
                                        <option key={post._id} value={post._id}>
                                            {post.title} ({post.status})
                                        </option>
                                    ))}
                                </select>
                            )}
                            {posts.length === 0 && !loadingPosts && (
                                <p className="text-xs text-red-500 mt-2">Bạn chưa có tin đăng nào.</p>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-6 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                            disabled={isProcessing}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={() => onConfirm({ postId: selectedPostId, quantity })}
                            className={`flex-1 py-3 px-6 rounded-xl font-bold text-white shadow-lg transition flex items-center justify-center gap-2
                                ${isProcessing || (itemDetails?.needsPost && !isLeadCredit && !selectedPostId)
                                    ? 'bg-gray-400 cursor-not-allowed shadow-none'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-blue-200'}`
                            }
                            disabled={isProcessing || (itemDetails?.needsPost && !isLeadCredit && !selectedPostId)}
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    Xác nhận sử dụng
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UseItemModal;
