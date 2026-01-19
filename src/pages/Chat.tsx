import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatAPI } from '../services/api';
import type { ChatRoom, MessageData } from '../types';
import { useAuth } from '../context/AuthContext';
import { Send, Search, MessageCircle, Loader2, Phone, Video } from 'lucide-react';

const Chat = () => {
    const { user } = useAuth();
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // Added search state
    const queryClient = useQueryClient();

    // Fetch Chat Rooms
    const { data: roomsResponse, isLoading: loadingRooms } = useQuery({
        queryKey: ['chats'],
        queryFn: () => chatAPI.getMyChats(),
        select: (res) => res.data.chats as ChatRoom[],
        retry: false, // Don't retry on 401
    });

    if (roomsResponse === undefined && !loadingRooms) {
        // handle error state visually if needed, but react-query usually handles this. 
        // For now, let's just ensure we don't crash.
    }


    const getOtherParticipant = (room: ChatRoom) => {
        return room.userIds.find((p: any) => p._id !== user?.id && p._id !== user?._id) || room.userIds[0];
    };

    // Filter rooms based on search term
    const filteredRooms = roomsResponse?.filter(room => {
        const other = getOtherParticipant(room) as any;
        return other?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Fetch Messages
    const { data: messagesData, isLoading: loadingMessages } = useQuery({
        queryKey: ['messages', selectedRoomId],
        queryFn: () => chatAPI.getMessages(selectedRoomId!),
        select: (res) => res.data.data as MessageData,
        enabled: !!selectedRoomId,
        refetchInterval: 5000, // Poll every 5s for now
    });

    // Send Message Mutation
    const sendMessageMutation = useMutation({
        mutationFn: (content: string) => chatAPI.sendMessage(selectedRoomId!, content),
        onSuccess: () => {
            setNewMessage('');
            queryClient.invalidateQueries({ queryKey: ['messages', selectedRoomId] });
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        },
    });

    // Mark as Read Effect
    useEffect(() => {
        if (selectedRoomId && messagesData) {
            chatAPI.markAsRead(selectedRoomId).catch(err => console.error("Mark read failed", err));
        }
    }, [selectedRoomId, messagesData]);

    const handleSend = () => {
        if (!newMessage.trim() || !selectedRoomId) return;
        sendMessageMutation.mutate(newMessage);
    };





    return (
        <div className="flex bg-gray-50 h-[calc(100vh-74px)]">
            {/* Sidebar */}
            <aside className="w-full md:w-80 border-r border-gray-200 bg-white flex flex-col h-full">
                <div className="p-4 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900 mb-4">Tin nhắn</h1>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingRooms ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="animate-spin text-blue-600" />
                        </div>
                    ) : filteredRooms && filteredRooms.length > 0 ? (
                        filteredRooms.map((room) => {
                            const other = getOtherParticipant(room) as any;
                            const isActive = selectedRoomId === room._id;

                            return (
                                <div
                                    key={room._id}
                                    onClick={() => setSelectedRoomId(room._id)}
                                    className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${isActive ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                            {other?.name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-semibold text-gray-900 truncate">{other?.name || 'Unknown User'}</h3>
                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                                {new Date(room.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className={`text-sm truncate ${isActive ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                                            {room.lastMessage || 'Bắt đầu trò chuyện'}
                                        </p>
                                    </div>
                                    {(room.unreadCount || 0) > 0 && (
                                        <div className="flex flex-col items-end justify-center gap-1">
                                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <MessageCircle size={48} className="mb-2 opacity-20" />
                            <p className="text-sm">Chưa có tin nhắn nào</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Chat Area */}
            <main className="hidden md:flex flex-1 flex-col h-full bg-white/50">
                {selectedRoomId ? (
                    <>
                        {/* Header */}
                        <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
                            <div className="flex items-center gap-3">
                                {roomsResponse && (() => {
                                    const room = roomsResponse.find(r => r._id === selectedRoomId);
                                    if (!room) return null;
                                    const other = getOtherParticipant(room) as any;
                                    return (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                {other?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h2 className="font-bold text-gray-900">{other?.name}</h2>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                    <p className="text-xs text-green-600 font-medium">Đang hoạt động</p>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <Phone size={20} />
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <Video size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Post Context Bar */}
                        {roomsResponse && (() => {
                            const room = roomsResponse.find(r => r._id === selectedRoomId);
                            console.log("Current Room:", room); // Debugging
                            const post = room?.postId as any; // Post is populated

                            // If post is missing or not populated (just an ID string), don't show bar or show skeleton
                            if (!post || typeof post === 'string') return null;

                            return (<div className="bg-blue-50/50 border-b border-blue-100 p-3 flex items-center gap-4 px-6">
                                <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden shrink-0 border border-gray-200">
                                    <img
                                        src={post.images?.[0] || 'https://placehold.co/100'}
                                        alt={post.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/100?text=No+Image';
                                        }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-blue-600 font-bold mb-0.5 uppercase tracking-wide">Đang trao đổi về</p>
                                    <h3 className="font-bold text-gray-900 truncate text-sm mb-0.5">{post.title}</h3>
                                    <p className="text-red-600 font-bold text-sm">
                                        {post.price >= 1000000000
                                            ? `${(post.price / 1000000000).toLocaleString('vi-VN')} Tỷ`
                                            : `${(post.price / 1000000).toLocaleString('vi-VN')} Triệu`}
                                    </p>
                                </div>
                                <a
                                    href={`/post/${post._id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm"
                                >
                                    Xem tin
                                </a>
                            </div>
                            );
                        })()}

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loadingMessages ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="animate-spin text-blue-600" size={32} />
                                </div>
                            ) : messagesData && messagesData.messages && messagesData.messages.length > 0 ? (
                                (() => {
                                    const messages = messagesData.messages;
                                    const currentUserId = user?.id || user?._id;
                                    let lastMyMessageIdx = -1;

                                    // 1. Find the index of the very last message sent by ME
                                    for (let i = messages.length - 1; i >= 0; i--) {
                                        const msg = messages[i];
                                        const senderId = typeof msg.senderId === 'object'
                                            ? (('id' in msg.senderId ? msg.senderId.id : undefined) || ('_id' in msg.senderId ? msg.senderId._id : undefined))
                                            : msg.senderId;

                                        if (String(senderId) === String(currentUserId)) {
                                            lastMyMessageIdx = i;
                                            break;
                                        }
                                    }

                                    return messages.map((msg, idx) => {
                                        const senderId = typeof msg.senderId === 'object'
                                            ? (('id' in msg.senderId ? msg.senderId.id : undefined) || ('_id' in msg.senderId ? msg.senderId._id : undefined))
                                            : msg.senderId;

                                        const isMe = String(senderId) === String(currentUserId);
                                        // 2. Only show status if it's me AND it is my last message
                                        const showStatus = isMe && idx === lastMyMessageIdx;

                                        return (
                                            <div key={idx} className={`flex flex-col mb-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${isMe
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                                    }`}>
                                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                {showStatus && (
                                                    <span className="text-[10px] text-gray-400 mt-1 mr-1">
                                                        {msg.isRead ? 'Đã xem' : 'Đã gửi'}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    });
                                })()
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <MessageCircle size={48} className="mb-4 opacity-20" />
                                    <p>Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!</p>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-200">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex gap-3 max-w-4xl mx-auto"
                            >
                                <input
                                    type="text"
                                    placeholder="Nhập tin nhắn..."
                                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-blue-600/20"
                                >
                                    {sendMessageMutation.isPending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md mb-6">
                            <MessageCircle size={48} className="text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Xin chào, {user?.name}!</h2>
                        <p className="text-gray-500">Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Chat;
