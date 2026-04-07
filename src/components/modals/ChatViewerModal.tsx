import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, MessageSquare } from 'lucide-react';
import { chatAPI } from '../../services/api';

interface ChatViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    chatRoomId: string;
    targetUserName?: string;
}

const ChatViewerModal = ({ isOpen, onClose, chatRoomId, targetUserName }: ChatViewerModalProps) => {
    const { data: messagesResponse, isLoading } = useQuery({
        queryKey: ['admin', 'chat', chatRoomId],
        queryFn: () => chatAPI.getMessages(chatRoomId),
        enabled: isOpen && !!chatRoomId,
        staleTime: 0
    });

    const messageData = messagesResponse?.data?.data;
    const messages = messageData?.messages || [];

    // Map unique senders to sides (Left/Right)
    const senderMap = new Map<string, 'left' | 'right'>();
    messages.forEach((msg: any) => {
        if (!senderMap.has(msg.senderId)) {
            senderMap.set(msg.senderId, senderMap.size === 0 ? 'left' : 'right');
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[85vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Lịch sử hội thoại</h3>
                            {targetUserName && (
                                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                                    Báo cáo: {targetUserName}
                                </p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
                        <X size={20} className="text-gray-400 group-hover:text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-full gap-3 text-slate-400">
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm font-medium">Đang tải tin nhắn...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <MessageSquare size={32} className="opacity-20" />
                            </div>
                            <p className="font-medium text-gray-500">Không có dữ liệu trò chuyện</p>
                            <p className="text-xs text-gray-400 mt-1">Hội thoại này hiện đang trống hoặc đã bị xóa.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg: any, index: number) => {
                                const side = senderMap.get(msg.senderId);
                                const isLeft = side === 'left';
                                
                                // Date divider logic
                                const currentDate = new Date(msg.createdAt).toLocaleDateString('vi-VN');
                                const prevDate = index > 0 ? new Date(messages[index - 1].createdAt).toLocaleDateString('vi-VN') : null;
                                const showDateDivider = currentDate !== prevDate;

                                // Check if next message is from same sender for grouping
                                const nextMsg = messages[index + 1];
                                const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

                                return (
                                    <React.Fragment key={index}>
                                        {showDateDivider && (
                                            <div className="flex justify-center my-6">
                                                <span className="px-4 py-1 rounded-full bg-white border border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-tighter shadow-sm">
                                                    {currentDate}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`flex gap-3 ${isLeft ? 'flex-row' : 'flex-row-reverse'} items-end mt-1`}>
                                            <div className={`flex flex-col max-w-[85%] ${isLeft ? 'items-start' : 'items-end'}`}>
                                                <div className={`p-3 text-sm shadow-sm
                                                    ${isLeft 
                                                        ? 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-none' 
                                                        : 'bg-blue-600 text-white rounded-2xl rounded-br-none'
                                                    }`}
                                                >
                                                    {msg.type === 'IMAGE' ? (
                                                        <div className="relative group cursor-pointer overflow-hidden rounded-lg">
                                                            <img
                                                                src={msg.content}
                                                                alt="Sent image"
                                                                className="max-w-full h-auto max-h-[300px] object-cover hover:scale-105 transition-transform duration-300"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                                                    )}
                                                </div>
                                                
                                                {isLastInGroup && (
                                                    <div className={`flex items-center gap-2 mt-1 px-1 text-[10px] font-medium text-gray-400 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                                                        <span>{new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span>•</span>
                                                        <span className="font-mono bg-gray-100 px-1 rounded uppercase">User: {msg.senderId?.slice(-4)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}
                </div>
                
                {/* Footer hint */}
                <div className="px-4 py-3 bg-white border-t border-gray-100 text-center shrink-0">
                    <p className="text-[10px] text-gray-400 font-medium">Bên trái: Người nhắn đầu tiên | Bên phải: Người nhắn tiếp theo (Dữ liệu phục vụ kiểm soát vi phạm)</p>
                </div>
            </div>
        </div>
    );
};

export default ChatViewerModal;
