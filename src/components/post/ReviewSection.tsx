import { useState } from 'react';
import { Star, User, Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsAPI } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';

interface ReviewSectionProps {
    postId: string;
}

const ReviewSection = ({ postId }: ReviewSectionProps) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);

    // Edit State
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editRating, setEditRating] = useState(5);

    const { data: reviews = [], isLoading } = useQuery({
        queryKey: ['reviews', postId],
        queryFn: () => reviewsAPI.getByPost(postId).then(res => res.data.data),
        enabled: !!postId
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => reviewsAPI.create(postId, data),
        onSuccess: () => {
            setComment('');
            setRating(5);
            queryClient.invalidateQueries({ queryKey: ['reviews', postId] });
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
            alert("Cảm ơn đánh giá của bạn!");
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || "Có lỗi xảy ra");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => reviewsAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews', postId] });
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
            alert("Đã xóa đánh giá");
        },
        onError: (err: any) => alert(err.response?.data?.message || "Lỗi khi xóa")
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => reviewsAPI.update(editingReviewId!, data),
        onSuccess: () => {
            setEditingReviewId(null);
            queryClient.invalidateQueries({ queryKey: ['reviews', postId] });
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
            alert("Đã cập nhật đánh giá");
        },
        onError: (err: any) => alert(err.response?.data?.message || "Lỗi khi cập nhật")
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;
        createMutation.mutate({ rating, comment });
    };

    const handleEditStart = (review: any) => {
        setEditingReviewId(review._id);
        setEditContent(review.comment);
        setEditRating(review.rating);
    };

    const handleUpdate = () => {
        if (!editContent.trim()) return;
        updateMutation.mutate({ rating: editRating, comment: editContent });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <Star className="text-yellow-400 fill-yellow-400" size={20} />
                Đánh giá & Bình luận ({reviews.length})
            </h3>

            {/* Writing Form */}
            {user ? (
                <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-bold text-gray-700">Đánh giá của bạn:</span>
                        <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        size={20}
                                        className={`${star <= (hoverRating || rating)
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-300'
                                            } transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Chia sẻ trải nghiệm của bạn..."
                            className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!comment.trim() || createMutation.isPending}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            ) : (
                <p className="text-sm text-center text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg">
                    Vui lòng đăng nhập để gửi đánh giá.
                </p>
            )}

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center text-gray-500">Đang tải đánh giá...</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center text-gray-400 py-4 italic">Chưa có đánh giá nào.</div>
                ) : (
                    reviews.map((review: any) => (
                        <div key={review._id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0 group">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                    {review.buyerId?.avatar ? (
                                        <img src={review.buyerId.avatar} alt={review.buyerId.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={16} className="text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{review.buyerId?.name || "Người dùng ẩn danh"}</p>

                                            {/* Edit Rating Mode */}
                                            {editingReviewId === review._id ? (
                                                <div className="flex gap-1 my-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button key={star} onClick={() => setEditRating(star)} type="button">
                                                            <Star size={12} className={star <= editRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={12}
                                                            className={`${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                                                        />
                                                    ))}
                                                    <span className="text-xs text-gray-400 ml-2">
                                                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: vi })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        {user && user._id === review.buyerId?._id && !editingReviewId && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                <button onClick={() => handleEditStart(review)} className="text-xs text-blue-500 font-medium hover:underline">Sửa</button>
                                                <button onClick={() => { if (confirm('Xóa đánh giá này?')) deleteMutation.mutate(review._id) }} className="text-xs text-red-500 font-medium hover:underline">Xóa</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Comment Content or Edit Input */}
                            {editingReviewId === review._id ? (
                                <div className="flex gap-2 mt-2">
                                    <input
                                        type="text"
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-blue-500"
                                    />
                                    <button onClick={handleUpdate} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg">Lưu</button>
                                    <button onClick={() => setEditingReviewId(null)} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-lg">Hủy</button>
                                </div>
                            ) : (
                                <p className="text-gray-600 text-sm bg-gray-50/50 p-3 rounded-xl italic">"{review.comment}"</p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewSection;
