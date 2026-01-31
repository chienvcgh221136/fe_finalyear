import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Send, Trash2, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface CommentSectionProps {
    postId: string;
}

const CommentSection = ({ postId }: CommentSectionProps) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [content, setContent] = useState('');

    const { data: comments = [], isLoading } = useQuery({
        queryKey: ['comments', postId],
        queryFn: () => commentsAPI.getByPost(postId).then(res => res.data.data),
        enabled: !!postId
    });

    const createMutation = useMutation({
        mutationFn: (text: string) => commentsAPI.create(postId, text),
        onSuccess: () => {
            setContent('');
            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: commentsAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        createMutation.mutate(content);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <MessageCircle size={20} />
                Bình luận ({comments.length})
            </h3>

            {/* Input */}
            <form onSubmit={handleSubmit} className="mb-6 relative">
                <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Viết bình luận của bạn..."
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={!user}
                />
                <button
                    type="submit"
                    disabled={!content.trim() || createMutation.isPending || !user}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent"
                >
                    <Send size={18} />
                </button>
            </form>

            {!user && (
                <p className="text-sm text-gray-500 mb-4 text-center">Vui lòng đăng nhập để bình luận.</p>
            )}

            {/* List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center text-gray-500 py-4">Đang tải bình luận...</div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <MessageCircle size={40} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                    </div>
                ) : (
                    comments.map((comment: any) => (
                        <div key={comment._id} className="flex gap-3 group">
                            <img
                                src={comment.userId?.avatar || "https://ui-avatars.com/api/?name=" + comment.userId?.name}
                                alt={comment.userId?.name}
                                className="w-10 h-10 rounded-full object-cover border border-gray-100"
                            />
                            <div className="flex-1 bg-gray-50 rounded-2xl p-3 px-4 relative group-hover:bg-gray-100 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-gray-900 text-sm">{comment.userId?.name}</span>
                                    <span className="text-xs text-gray-400">
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                                    </span>
                                </div>
                                <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>

                                {/* Delete Button (Owner/Admin) */}
                                {(user?._id === comment.userId?._id || user?.role === 'ADMIN') && (
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Xóa bình luận này?')) deleteMutation.mutate(comment._id);
                                        }}
                                        className="absolute right-2 bottom-2 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Xóa bình luận"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CommentSection;
