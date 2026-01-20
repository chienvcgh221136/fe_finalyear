import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesAPI, chatAPI } from '../services/api';
import type { ChatRoom, MessageData } from '../types';
import { useAuth } from '../context/AuthContext';
import { Search, Send, Phone, Video, MessageCircle, Image as ImageIcon, X, Loader2, Check, CheckCheck, Trash2 } from 'lucide-react';

const Chat = () => {
    const { user } = useAuth();
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'buying' | 'selling'>('all');
    const [isSearching, setIsSearching] = useState(false);
    const [messageSearchResults, setMessageSearchResults] = useState<any[]>([]);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

    // Image Handling
    const [previewImage, setPreviewImage] = useState<{ file: File, url: string } | null>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const queryClient = useQueryClient();

    // Fetch Chat Rooms
    const { data: roomsResponse, isLoading: loadingRooms } = useQuery({
        queryKey: ['chats'],
        queryFn: () => chatAPI.getMyChats(),
        select: (res) => res.data.chats as ChatRoom[],
        retry: false,
    });

    const getOtherParticipant = (room: ChatRoom) => {
        return room.userIds.find((p: any) => p._id !== user?.id && p._id !== user?._id) || room.userIds[0];
    };

    // Advanced Search Effect
    useEffect(() => {
        const searchTimer = setTimeout(async () => {
            if (searchTerm.trim().length > 0) {
                setIsSearching(true);
                try {
                    const res = await chatAPI.searchMessages(searchTerm);
                    setMessageSearchResults(res.data.results || []);
                } catch (err) {
                    console.error("Search failed", err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setMessageSearchResults([]);
            }
        }, 600);

        return () => clearTimeout(searchTimer);
    }, [searchTerm]);

    // Filter Logic
    const filteredRooms = roomsResponse?.filter(room => {
        const other = getOtherParticipant(room) as any;

        // Prevent showing self if data is corrupted, and filter by search
        if (!other) return false;

        const matchesName = other.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const post = room.postId as any;
        const myId = user?.id || user?._id;
        const isSeller = post && (post.userId === myId || post.userId?._id === myId);

        let matchesTab = true;
        if (activeTab === 'buying') matchesTab = !isSeller;
        if (activeTab === 'selling') matchesTab = isSeller;

        const hasMessageMatch = messageSearchResults.some(r => r.chatRoomId === room._id);

        if (searchTerm.trim()) {
            return (matchesName || hasMessageMatch) && matchesTab;
        }

        return matchesTab;
    });

    const getPreviewInfo = (room: ChatRoom) => {
        if (searchTerm.trim().length > 0) {
            const match = messageSearchResults.find(r => r.chatRoomId === room._id);
            if (match) {
                return {
                    text: match.message.content,
                    time: match.message.createdAt,
                    matchId: match.message._id,
                    isMatch: true
                };
            }
        }
        return {
            text: room.lastMessage || 'Bắt đầu trò chuyện',
            time: room.lastMessageAt,
            matchId: null,
            isMatch: false
        };
    };

    // Highlight text helper
    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim()) return text;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span key={i} className="bg-yellow-200 text-gray-900 font-medium px-0.5 rounded">{part}</span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    const { data: messagesData, isLoading: loadingMessages } = useQuery({
        queryKey: ['messages', selectedRoomId],
        queryFn: () => chatAPI.getMessages(selectedRoomId!),
        select: (res) => res.data.data as MessageData,
        enabled: !!selectedRoomId,
        refetchInterval: 3000,
    });

    useEffect(() => {
        if (highlightedMessageId && messageRefs.current[highlightedMessageId]) {
            messageRefs.current[highlightedMessageId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const timer = setTimeout(() => {
                setHighlightedMessageId(null);
            }, 2000);
            return () => clearTimeout(timer);
        } else if (!highlightedMessageId && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messagesData, highlightedMessageId]);

    // Mark as Read Mutation
    const markReadMutation = useMutation({
        mutationFn: (chatRoomId: string) => chatAPI.markAsRead(chatRoomId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        },
    });

    // Mark as read effect
    useEffect(() => {
        if (selectedRoomId && messagesData?.messages) {
            // Check if there are any unread messages from others
            const hasUnread = messagesData.messages.some(
                (m: any) =>
                    (typeof m.senderId === 'string' ? m.senderId !== (user?.id || user?._id) : (m.senderId._id || m.senderId.id) !== (user?.id || user?._id))
                    && !m.isRead
            );

            if (hasUnread) {
                markReadMutation.mutate(selectedRoomId);
            }
        }
    }, [messagesData, selectedRoomId]);

    // Send Message Mutation
    const sendMessageMutation = useMutation({
        mutationFn: ({ content, type }: { content: string, type: 'TEXT' | 'IMAGE' }) => chatAPI.sendMessage(selectedRoomId!, content, type),
        onSuccess: () => {
            setNewMessage('');
            setPreviewImage(null);
            queryClient.invalidateQueries({ queryKey: ['messages', selectedRoomId] });
            queryClient.invalidateQueries({ queryKey: ['chats'] });
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        },
    });

    const handleSend = async () => {
        if (!selectedRoomId) return;

        if (previewImage) {
            setIsUploading(true);
            try {
                const res = await filesAPI.upload(previewImage.file);
                const imageUrl = res.data.url;
                sendMessageMutation.mutate({ content: imageUrl, type: 'IMAGE' });
            } catch (error) {
                console.error("Upload failed", error);
                alert("Gửi ảnh thất bại");
            } finally {
                setIsUploading(false);
            }
        } else {
            if (!newMessage.trim()) return;
            sendMessageMutation.mutate({ content: newMessage, type: 'TEXT' });
        }
    };

    const handleDeleteChat = async () => {
        if (!selectedRoomId) return;
        if (window.confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này? hành động này không thể hoàn tác.")) {
            try {
                await chatAPI.deleteChat(selectedRoomId);
                queryClient.invalidateQueries({ queryKey: ['chats'] });
                setSelectedRoomId(null);
            } catch (error) {
                console.error("Delete chat failed", error);
                alert("Xóa thất bại");
            }
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreviewImage({ file, url });
    };

    return (
        <div className="flex bg-gray-50 h-[calc(100vh-74px)] relative">
            {/* Sidebar */}
            <aside className="w-full md:w-80 border-r border-gray-200 bg-white flex flex-col h-full">
                <div className="p-4 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900 mb-4">Tin nhắn</h1>

                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setActiveTab('buying')}
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'buying' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Mua
                        </button>
                        <button
                            onClick={() => setActiveTab('selling')}
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'selling' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Bán
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Tìm người dùng hoặc tin nhắn..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="animate-spin text-blue-500 h-3 w-3" />
                            </div>
                        )}
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
                            const { text, time, isMatch, matchId } = getPreviewInfo(room);

                            return (
                                <div
                                    key={room._id}
                                    onClick={() => {
                                        setSelectedRoomId(room._id);
                                        if (matchId) {
                                            setHighlightedMessageId(matchId);
                                        } else {
                                            setHighlightedMessageId(null);
                                        }
                                    }}
                                    className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${isActive ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg overflow-hidden border border-gray-100">
                                            {other?.avatar ? (
                                                <img src={other.avatar} alt={other.name} className="w-full h-full object-cover" />
                                            ) : (
                                                other?.name?.charAt(0).toUpperCase() || '?'
                                            )}
                                        </div>
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            {/* Search Highlight Name */}
                                            <h3 className="font-semibold text-gray-900 truncate">
                                                {highlightText(other?.name || 'Unknown User', searchTerm)}
                                            </h3>
                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                                {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className={`text-sm truncate ${isActive ? 'text-blue-700 font-medium' : isMatch ? 'text-gray-900 font-semibold bg-yellow-100 px-1 rounded' : 'text-gray-500'}`}>
                                            {isMatch && <Search size={12} className="inline mr-1" />}
                                            {/* Search Highlight Message Preview */}
                                            {isMatch ? highlightText(text, searchTerm) : text}
                                        </p>
                                    </div>
                                    {!isMatch && (room.unreadCount || 0) > 0 && (
                                        <div className="flex flex-col items-end justify-center gap-1">
                                            <div className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                {room.unreadCount}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <MessageCircle size={48} className="mb-2 opacity-20" />
                            <p className="text-sm">Không tìm thấy cuộc trò chuyện nào</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Chat Area */}
            <main className="hidden md:flex flex-1 flex-col h-full bg-white/50 relative">
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
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden border border-gray-100">
                                                {other?.avatar ? (
                                                    <img src={other.avatar} alt={other.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    other?.name?.charAt(0).toUpperCase()
                                                )}
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
                                <button
                                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                                    onClick={handleDeleteChat}
                                    title="Xóa cuộc trò chuyện"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Post Context Bar */}
                        {roomsResponse && (() => {
                            const room = roomsResponse.find(r => r._id === selectedRoomId);
                            const post = room?.postId as any;

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

                                    return (
                                        <>
                                            {messages.map((msg, idx) => {
                                                const senderId = typeof msg.senderId === 'object'
                                                    ? (('id' in msg.senderId ? msg.senderId.id : undefined) || ('_id' in msg.senderId ? msg.senderId._id : undefined))
                                                    : msg.senderId;

                                                const isMe = String(senderId) === String(currentUserId);
                                                const isLastMyMsg = isMe && idx === lastMyMessageIdx;
                                                const isHighlighted = highlightedMessageId === msg._id;

                                                const isImage = msg.type === 'IMAGE' || (msg.content.startsWith('http') && (msg.content.includes('/uploads/') || msg.content.match(/\.(jpg|jpeg|png|gif|webp)$/i)));

                                                return (
                                                    <div
                                                        key={idx}
                                                        ref={(el) => {
                                                            if (msg._id) messageRefs.current[msg._id] = el;
                                                        }}
                                                        className={`flex flex-col mb-1 ${isMe ? 'items-end' : 'items-start'} ${isHighlighted ? 'bg-yellow-50/50 p-2 rounded -mx-2 transition-all duration-1000' : ''}`}
                                                    >
                                                        <div className={`max-w-[70%] rounded-2xl shadow-sm relative ${isHighlighted ? 'ring-2 ring-yellow-400 ring-offset-2' : ''} ${isImage
                                                            ? `p-0 overflow-hidden ${isMe ? 'rounded-br-none' : 'rounded-bl-none'}`
                                                            : `px-5 py-3 ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`
                                                            }`}>
                                                            {isImage ? (
                                                                <img
                                                                    src={msg.content}
                                                                    alt="Sent image"
                                                                    className="max-w-full rounded-none max-h-60 object-cover cursor-pointer hover:opacity-95 transition-opacity block"
                                                                    onClick={() => setViewingImage(msg.content)}
                                                                />
                                                            ) : (
                                                                <p className="text-sm leading-relaxed">
                                                                    {/* Highlight content search match only if this is the highlighted message for better UX */}
                                                                    {isHighlighted && searchTerm ? highlightText(msg.content, searchTerm) : msg.content}
                                                                </p>
                                                            )}

                                                            <div className={`flex items-center gap-1 ${isImage
                                                                ? 'absolute bottom-2 right-2 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm text-white'
                                                                : `justify-end mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`
                                                                }`}>
                                                                <p className="text-[10px]">
                                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                                {isMe && (
                                                                    msg.isRead ? (
                                                                        <CheckCheck size={12} className={isImage ? "text-white" : "text-blue-100"} />
                                                                    ) : (
                                                                        <Check size={12} className={isImage ? "text-white/70" : "text-blue-100"} />
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                        {isLastMyMsg && !isImage && (
                                                            <span className="text-[10px] text-gray-400 mt-1 mr-1">
                                                                {msg.isRead ? 'Đã xem' : 'Đã gửi'}
                                                            </span>
                                                        )}
                                                        {isLastMyMsg && isImage && (
                                                            <span className="text-[10px] text-gray-400 mt-1 mr-1">
                                                                {msg.isRead ? 'Đã xem' : 'Đã gửi'}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </>
                                    );
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
                            {/* Image Preview */}
                            {previewImage && (
                                <div className="mb-4 relative inline-block">
                                    <img src={previewImage.url} alt="Preview" className="h-24 rounded-lg border border-gray-200" />
                                    <button
                                        onClick={() => setPreviewImage(null)}
                                        className="absolute -top-2 -right-2 bg-gray-900/50 text-white rounded-full p-1 hover:bg-gray-900 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}

                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex gap-3 max-w-4xl mx-auto items-center"
                            >
                                <label className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full cursor-pointer transition-colors">
                                    <ImageIcon size={20} />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageSelect}
                                    />
                                </label>

                                <input
                                    type="text"
                                    placeholder="Nhập tin nhắn..."
                                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={!!previewImage}
                                />
                                <button
                                    type="submit"
                                    disabled={(!newMessage.trim() && !previewImage) || sendMessageMutation.isPending || isUploading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-blue-600/20"
                                >
                                    {(sendMessageMutation.isPending || isUploading) ? <Loader2 className="animate-spin" /> : <Send size={20} />}
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

                {/* Lightbox Modal */}
                {viewingImage && (
                    <div
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
                        onClick={() => setViewingImage(null)}
                    >
                        <img
                            src={viewingImage}
                            alt="Full size"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                        <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full">
                            <X size={24} />
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Chat;
