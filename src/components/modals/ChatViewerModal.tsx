import { useQuery } from '@tanstack/react-query';
import { X, MessageSquare, Image as ImageIcon } from 'lucide-react';
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
        staleTime: 0 // Always fetch fresh
    });

    const messageData = messagesResponse?.data?.data;
    const messages = messageData?.messages || [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[80vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0 bg-gray-50">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="text-blue-600" size={20} />
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Lịch sử chat</h3>
                            {targetUserName && (
                                <p className="text-xs text-gray-500">Liên quan đến báo cáo của: {targetUserName}</p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <MessageSquare size={48} className="mb-2 opacity-50" />
                            <p>Không có tin nhắn nào</p>
                        </div>
                    ) : (
                        messages.map((msg: any, index: number) => {
                            // Simple logic to distinguish sides based on senderId doesn't work perfectly here 
                            // because we don't know which ID is the reported user easily without more context.
                            // For Admin view, maybe just show left/right based on sender change or just list them.
                            // Let's try to align based on a "system" guess or just alternating colors if we can't tell.
                            // Better: Just show all on left but with name/avatar if available?
                            // Since we don't have participant info easily populated in message list usually, 
                            // we'll just display them clearly with Sender ID for now.

                            return (
                                <div key={index} className={`flex flex-col max-w-[80%] ${
                                    // We don't distinguish "me" vs "them" easily here, so just use neutral styling
                                    'self-start'
                                    }`}>
                                    <div className={`p-3 rounded-2xl bg-white shadow-sm border border-gray-100 text-gray-800`}>
                                        {msg.type === 'IMAGE' ? (
                                            <div className="relative group cursor-pointer overflow-hidden rounded-lg">
                                                <img
                                                    src={msg.content}
                                                    alt="Sent image"
                                                    className="max-w-full h-auto max-h-[300px] object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1 ml-1">
                                        {new Date(msg.createdAt).toLocaleString('vi-VN')} • User: {msg.senderId?.slice(-4)}
                                    </span>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatViewerModal;
