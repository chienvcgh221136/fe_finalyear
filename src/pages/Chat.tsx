import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { filesAPI, chatAPI, usersAPI } from '../services/api';
import type { ChatRoom, MessageData } from '../types';
import { useAuth } from '../context/AuthContext';
import { Search, Send, MessageCircle, Image as ImageIcon, X, Loader2, Check, CheckCheck, Trash2, ArrowDown, Pencil, ChevronLeft, MoreVertical, Shield, Ban, User, Image, ExternalLink } from 'lucide-react';
import ReportModal from '../components/modals/ReportModal';
import LocalizedLink from '../components/common/LocalizedLink';
import { useTranslation } from 'react-i18next';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Chat = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
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

    // Nickname State
    const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
    const [nicknameInput, setNicknameInput] = useState('');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    // Sidebar & Modal State
    const [isDetailsOpen, setIsDetailsOpen] = useState(true); // Default open on desktop
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Scroll & Badge State
    const [showNewMessageBadge, setShowNewMessageBadge] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isNearBottomRef = useRef(true);
    const prevMessageCountRef = useRef(0);
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

    const getDisplayName = (room: ChatRoom, otherUser: any) => {
        if (!room.nicknames || !otherUser) return otherUser?.name;
        const otherId = otherUser._id || otherUser.id;
        return room.nicknames[otherId] || otherUser.name;
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

        const displayName = getDisplayName(room, other);
        const matchesName = displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || other.name?.toLowerCase().includes(searchTerm.toLowerCase());

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
        // refetchInterval: 3000, // Removed for Socket.io real-time
    });

    // Socket.io Initialization
    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });
        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    // Join Room and Listen for Messages
    useEffect(() => {
        if (socket && selectedRoomId) {
            socket.emit("join_room", selectedRoomId);

            const handleNewMessage = (data: { chatRoomId: string, newMessage: any }) => {
                if (data.chatRoomId === selectedRoomId) {
                    // Update the messages cache instantly
                    queryClient.setQueryData(['messages', selectedRoomId], (old: any) => {
                        if (!old || !old.data || !old.data.data) return old;
                        
                        const incomingMsg = data.newMessage;
                        const messages = [...(old.data.data.messages || [])];
                        
                        // Check if we already have this message (by ID or optimistic temp ID)
                        const isFromMe = String(incomingMsg.senderId) === String(user?.id || user?._id);
                        if (isFromMe) {
                            const tempIdx = messages.findIndex(m => m._id && String(m._id).startsWith('temp-') && m.content === incomingMsg.content);
                            if (tempIdx > -1) {
                                messages[tempIdx] = incomingMsg; // Replace temp with real
                                return { ...old, data: { ...old.data, data: { ...old.data.data, messages } } };
                            }
                        }

                        // If not a duplicate, append it
                        if (!messages.find(m => m._id === incomingMsg._id)) {
                            messages.push(incomingMsg);
                        }

                        return { ...old, data: { ...old.data, data: { ...old.data.data, messages } } };
                    });
                    
                    // Also invalidate chats to updated last message in sidebar
                    queryClient.invalidateQueries({ queryKey: ['chats'] });
                }
            };

            socket.on("new_message", handleNewMessage);

            return () => {
                socket.off("new_message", handleNewMessage);
            };
        }
    }, [socket, selectedRoomId, queryClient]);

    // Scroll Handler
    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            const distanceToBottom = scrollHeight - scrollTop - clientHeight;
            const isNear = distanceToBottom <= 100;
            isNearBottomRef.current = isNear;

            if (isNear) {
                setShowNewMessageBadge(false);
            }
        }
    };

    const scrollToBottom = (smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
        setShowNewMessageBadge(false);
    };

    // Reset state on room change
    useEffect(() => {
        setShowNewMessageBadge(false);
        isNearBottomRef.current = true;
        prevMessageCountRef.current = 0;
    }, [selectedRoomId]);

    // Handle New Messages & Auto-scroll
    useEffect(() => {
        if (highlightedMessageId && messageRefs.current[highlightedMessageId]) {
            messageRefs.current[highlightedMessageId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const timer = setTimeout(() => {
                setHighlightedMessageId(null);
            }, 2000);
            return () => clearTimeout(timer);
        }

        if (messagesData?.messages) {
            const messages = messagesData.messages;
            const count = messages.length;
            const prevCount = prevMessageCountRef.current;

            if (count > 0) {
                if (prevCount === 0) {
                    if (!highlightedMessageId) {
                        scrollToBottom(false);
                    }
                }

                else if (count > prevCount) {
                    const lastMsg = messages[count - 1];
                    const myId = user?.id || user?._id;
                    const senderId = typeof lastMsg.senderId === 'object'
                        ? (('id' in lastMsg.senderId ? lastMsg.senderId.id : undefined) || ('_id' in lastMsg.senderId ? lastMsg.senderId._id : undefined))
                        : lastMsg.senderId;

                    const isMe = String(senderId) === String(myId);

                    if (isMe) {
                        // I sent a message -> Always scroll
                        scrollToBottom();
                    } else {
                        // Incoming message
                        if (isNearBottomRef.current) {
                            scrollToBottom();
                        } else {
                            setShowNewMessageBadge(true);
                        }
                    }
                }
            }

            prevMessageCountRef.current = count;
        }
    }, [messagesData, highlightedMessageId, user]);

    // Mark as Read Mutation
    const markReadMutation = useMutation({
        mutationFn: (chatRoomId: string) => chatAPI.markAsRead(chatRoomId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
            queryClient.invalidateQueries({ queryKey: ['messages', selectedRoomId] });
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

            if (hasUnread && !markReadMutation.isPending) {
                markReadMutation.mutate(selectedRoomId);
            }
        }
    }, [messagesData, selectedRoomId, user, markReadMutation]);

    // Send Message Mutation
    const sendMessageMutation = useMutation({
        mutationFn: ({ content, type }: { content: string, type: 'TEXT' | 'IMAGE' }) => chatAPI.sendMessage(selectedRoomId!, content, type),
        onMutate: async (newMsg) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['messages', selectedRoomId] });

            // Snapshot the previous value
            const previousData = queryClient.getQueryData(['messages', selectedRoomId]);

            // Optimistically update to the new value
            if (previousData) {
                queryClient.setQueryData(['messages', selectedRoomId], (old: any) => {
                    if (!old || !old.data || !old.data.data) return old;
                    
                    const tempId = 'temp-' + Date.now();
                    const optimisticMsg = {
                        _id: tempId,
                        senderId: user?.id || user?._id,
                        content: newMsg.content,
                        type: newMsg.type,
                        isRead: false,
                        createdAt: new Date().toISOString(),
                    };

                    const newMessages = [...(old.data.data.messages || []), optimisticMsg];
                    
                    return {
                        ...old,
                        data: {
                            ...old.data,
                            data: {
                                ...old.data.data,
                                messages: newMessages
                            }
                        }
                    };
                });
            }

            // Clear input immediately for better UX
            setNewMessage('');
            setPreviewImage(null);

            return { previousData };
        },
        // @ts-expect-error - Ignore unused variables for build
        onError: (err, newMsg, context) => {
            // Rollback on error
            if (context?.previousData) {
                queryClient.setQueryData(['messages', selectedRoomId], context.previousData);
            }
            alert(t('chat.send_failed'));
        },
        onSettled: () => {
            // Invalidate to sync with server eventually, but don't block
            // We use shorter delay or just rely on socket
            queryClient.invalidateQueries({ queryKey: ['chats'] });
            scrollToBottom();
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
                alert(t('chat.upload_failed'));
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
        if (window.confirm(t('chat.confirm_delete_chat'))) {
            try {
                await chatAPI.deleteChat(selectedRoomId);
                queryClient.invalidateQueries({ queryKey: ['chats'] });
                setSelectedRoomId(null);
            } catch (error) {
                console.error("Delete chat failed", error);
                alert(t('chat.delete_failed'));
            }
        }
    };

    const handleSetNickname = async () => {
        if (!selectedRoomId || !editingUserId) return;
        try {
            await chatAPI.setNickname(selectedRoomId, editingUserId, nicknameInput);
            queryClient.invalidateQueries({ queryKey: ['chats'] }); // Refresh to get new nicknames
            setIsNicknameModalOpen(false);
            setEditingUserId(null);
            setNicknameInput('');
        } catch (error) {
            console.error("Set nickname failed", error);
            alert(t('chat.set_nickname_failed'));
        }
    };

    const openNicknameModal = () => {
        if (!selectedRoomId) return;
        const room = roomsResponse?.find(r => r._id === selectedRoomId);
        if (!room) return;
        const other = getOtherParticipant(room) as any;
        if (!other) return;

        setEditingUserId(other._id || other.id);
        const otherId = other._id || other.id;
        // If nickname is same as name, show empty or name? Let's show current display name
        setNicknameInput(room.nicknames?.[otherId] || '');
        setIsNicknameModalOpen(true);
    };

    const handleBlockUser = async () => {
        if (!selectedRoomId) return;
        const room = roomsResponse?.find(r => r._id === selectedRoomId);
        if (!room) return;
        const other = getOtherParticipant(room) as any;
        if (!other) return;
        const otherId = other._id || other.id;

        if (window.confirm(t('chat.confirm_block_user', { name: other.name }))) {
            try {
                await usersAPI.block(otherId);
                alert(t('chat.block_success'));
                // Refresh auth user to update blocked list
                queryClient.invalidateQueries({ queryKey: ['chats'] });
                window.location.reload(); // Simple way to refresh auth context for now
            } catch (error) {
                console.error("Block failed", error);
                alert(t('chat.block_failed'));
            }
        }
    };

    const handleUnblockUser = async () => {
        if (!selectedRoomId) return;
        const room = roomsResponse?.find(r => r._id === selectedRoomId);
        if (!room) return;
        const other = getOtherParticipant(room) as any;
        if (!other) return;
        const otherId = other._id || other.id;

        if (window.confirm(t('chat.confirm_unblock_user', { name: other.name }))) {
            try {
                await usersAPI.unblock(otherId);
                alert(t('chat.unblock_success'));
                window.location.reload();
            } catch (error) {
                console.error("Unblock failed", error);
                alert(t('chat.unblock_failed'));
            }
        }
    };

    // Check if I blocked this user
    const isBlockedByMe = () => {
        if (!selectedRoomId || !user?.blockedUsers) return false;
        const room = roomsResponse?.find(r => r._id === selectedRoomId);
        if (!room) return false;
        const other = getOtherParticipant(room) as any;
        if (!other) return false;
        const otherId = other._id || other.id;
        return user.blockedUsers.includes(otherId);
    };

    const handleReportUser = () => {
        setIsReportModalOpen(true);
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
            <aside className={`w-full md:w-80 border-r border-gray-200 bg-white flex-col h-full transition-all duration-300 ${selectedRoomId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold text-gray-900">{t('chat.title', 'Tin nhắn')}</h1>
                        {/* Optional: Add a 'New Chat' or 'Compose' button here if needed */}
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t('chat.tab_all', 'Tất cả')}
                        </button>
                        <button
                            onClick={() => setActiveTab('buying')}
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'buying' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t('chat.tab_buying', 'Mua')}
                        </button>
                        <button
                            onClick={() => setActiveTab('selling')}
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'selling' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t('chat.tab_selling', 'Bán')}
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder={t('chat.search_placeholder', 'Tìm người dùng hoặc tin nhắn...')}
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
                                                {highlightText(getDisplayName(room, other) || 'Người dùng không xác định', searchTerm)}
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
                            <p className="text-sm">{t('chat.no_chats', 'Không tìm thấy cuộc trò chuyện nào')}</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Chat Area */}
            <main className={`flex-1 h-full bg-white/50 relative flex flex-row ${selectedRoomId ? 'flex' : 'hidden md:flex'}`}>
                {selectedRoomId ? (
                    <>
                        <div className="flex-1 flex flex-col min-w-0 h-full">
                            <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 shrink-0 sticky top-0 z-20">
                                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                    <button
                                        onClick={() => setSelectedRoomId(null)}
                                        className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full shrink-0"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    {roomsResponse && (() => {
                                        const room = roomsResponse.find(r => r._id === selectedRoomId);
                                        if (!room) return null;
                                        const other = getOtherParticipant(room) as any;
                                        return (
                                            <>
                                                <div 
                                                    className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden border border-gray-100 shrink-0 cursor-pointer"
                                                    onClick={() => navigate(`/user/${other?._id || other?.id}`)}
                                                >
                                                    {other?.avatar ? (
                                                        <img src={other.avatar} alt={other.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        other?.name?.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1">
                                                        <h2 className="font-bold text-gray-900 truncate text-sm md:text-base">{getDisplayName(room, other)}</h2>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                        <p className="text-[10px] text-green-600 font-medium">{t('chat.active_now', 'Đang hoạt động')}</p>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                                <div className="flex items-center gap-1 md:gap-2">
                                    <button
                                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors hidden sm:block"
                                        onClick={handleDeleteChat}
                                        title={t('chat.delete_chat')}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                    <button
                                        className={`p-2 rounded-full transition-colors ${isDetailsOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                        onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                                        title={t('chat.conversation_info')}
                                    >
                                        <MoreVertical size={22} />
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
                                        <p className="text-xs text-blue-600 font-bold mb-0.5 uppercase tracking-wide">{t('chat.discussing')}</p>
                                        <h3 className="font-bold text-gray-900 truncate text-sm mb-0.5">{post.title}</h3>
                                        <p className="text-red-600 font-bold text-sm">
                                            {post.price >= 1000000000
                                                ? `${(post.price / 1000000000).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} ${t('chat.billion')}`
                                                : `${(post.price / 1000000).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} ${t('chat.million')}`}
                                        </p>
                                    </div>
                                    <LocalizedLink
                                        to={`/post/${post._id}`}
                                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm flex items-center justify-center gap-1"
                                    >
                                        {t('chat.view_tin', 'Xem tin')}
                                        <ExternalLink size={12} />
                                    </LocalizedLink>
                                </div>
                                );
                            })()}

                            {/* Messages List */}
                            <div
                                ref={scrollContainerRef}
                                onScroll={handleScroll}
                                className="flex-1 overflow-y-auto p-6 space-y-4 relative"
                            >
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
                                                        <React.Fragment key={idx}>
                                                            {(() => {
                                                                const currentDate = new Date(msg.createdAt).toLocaleDateString('vi-VN');
                                                                const prevDate = idx > 0 ? new Date(messages[idx - 1].createdAt).toLocaleDateString('vi-VN') : null;
                                                                if (currentDate !== prevDate) {
                                                                    return (
                                                                        <div className="flex justify-center my-4">
                                                                            <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest shadow-sm">
                                                                                {currentDate}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                            <div
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
                                                                        {msg.isRead ? t('chat.seen', 'Đã xem') : t('chat.sent', 'Đã gửi')}
                                                                    </span>
                                                                )}
                                                                {isLastMyMsg && isImage && (
                                                                    <span className="text-[10px] text-gray-400 mt-1 mr-1">
                                                                        {msg.isRead ? t('chat.seen', 'Đã xem') : t('chat.sent', 'Đã gửi')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </React.Fragment>
                                                    );
                                                })}
                                                <div ref={messagesEndRef} />
                                            </>
                                        );
                                    })()
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <MessageCircle size={48} className="mb-4 opacity-20" />
                                        <p>{t('chat.no_messages', 'Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!')}</p>
                                    </div>
                                )}

                                {/* Float New Message Badge */}
                                {showNewMessageBadge && (
                                    <button
                                        onClick={() => scrollToBottom(true)}
                                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-all z-10 text-sm font-medium animate-bounce"
                                    >
                                        📩 {t('chat.new_messages_badge', 'Tin nhắn mới')} <ArrowDown size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-gray-100 pb-safe pb-4">
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

                                {isBlockedByMe() ? (
                                    <div className="flex items-center justify-center p-4 bg-gray-100 rounded-xl text-gray-500 gap-2">
                                        <Ban size={20} />
                                        <span>{t('chat.you_blocked_user')}</span>
                                        <button
                                            onClick={handleUnblockUser}
                                            className="ml-2 text-blue-600 hover:underline font-medium"
                                        >
                                            {t('chat.unblock_btn')}
                                        </button>
                                    </div>
                                ) : (
                                    (() => {
                                        const room = roomsResponse?.find(r => r._id === selectedRoomId);
                                        if (room?.blockedByOther) {
                                            return (
                                                <div className="flex items-center justify-center p-4 bg-red-50 rounded-xl text-red-500 gap-2">
                                                    <Ban size={20} />
                                                    <span>{t('chat.blocked_by_other')}</span>
                                                </div>
                                            );
                                        }

                                        return (
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
                                                    placeholder={t('chat.input_placeholder', 'Nhập tin nhắn...')}
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
                                        );
                                    })()
                                )}
                            </div>
                        </div>

                        {/* Right Sidebar - Details (Mobile Drawer / Desktop Sidebar) */}
                        {isDetailsOpen && (
                            <>
                                {/* Overlay for mobile */}
                                <div 
                                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[40] lg:hidden transition-opacity duration-300"
                                    onClick={() => setIsDetailsOpen(false)}
                                />
                                <aside className="fixed right-0 top-0 bottom-0 z-[50] w-[85%] max-w-[340px] lg:static lg:z-0 lg:w-80 border-l border-gray-200 bg-white flex flex-col h-full overflow-y-auto animate-in slide-in-from-right duration-300 shrink-0 shadow-2xl lg:shadow-none">
                                    <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                                        <h3 className="font-bold text-gray-900">{t('chat.details', 'Chi tiết')}</h3>
                                        <button 
                                            onClick={() => setIsDetailsOpen(false)}
                                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                    {roomsResponse && (() => {
                                        const room = roomsResponse.find(r => r._id === selectedRoomId);
                                        if (!room) return null;
                                        const other = getOtherParticipant(room) as any;
                                        const otherId = other?._id || other?.id;
                                        const displayName = getDisplayName(room, other);

                                        // Filter images from messages
                                        const images = messagesData?.messages?.filter(m =>
                                            m.type === 'IMAGE' || (m.content.startsWith('http') && (m.content.includes('/uploads/') || m.content.match(/\.(jpg|jpeg|png|gif|webp)$/i)))
                                        ) || [];

                                        return (
                                            <div className="flex flex-col h-full">
                                                <div className="p-6 flex flex-col items-center border-b border-gray-100">
                                                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-3xl overflow-hidden border-2 border-white shadow-md mb-3">
                                                        {other?.avatar ? (
                                                            <img src={other.avatar} alt={other.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            other?.name?.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <h2 className="font-bold text-gray-900 text-lg text-center" style={{ wordBreak: 'break-word', maxWidth: '100%', lineHeight: '1.4' }}>{displayName}</h2>
                                                    <p className="text-gray-500 text-sm mb-4">{t('chat.member')}</p>

                                                    <div className="flex gap-2 w-full">
                                                        <button
                                                            onClick={() => navigate(`/user/${otherId}`)}
                                                            className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <User size={16} />
                                                            {t('chat.view_profile')}
                                                        </button>
                                                        <button
                                                            onClick={openNicknameModal}
                                                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                                            title="Đổi biệt danh"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="p-4 flex-1 overflow-y-auto">
                                                    {/* Media Section */}
                                                    <div className="mb-6">
                                                        <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                                                            <Image size={16} className="text-blue-500" />
                                                            {t('chat.media', { length: images.length })}
                                                        </h3>
                                                        {images.length > 0 ? (
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {images.slice(0, 9).map((msg, idx) => (
                                                                    <div
                                                                        key={msg._id || idx}
                                                                        className="aspect-square rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                                                                        onClick={() => setViewingImage(msg.content)}
                                                                    >
                                                                        <img src={msg.content} alt="media" className="w-full h-full object-cover" />
                                                                    </div>
                                                                ))}
                                                                {images.length > 9 && (
                                                                    <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold cursor-pointer hover:bg-gray-200">
                                                                        +{images.length - 9}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-4 bg-gray-50 rounded-lg text-gray-400 text-xs">
                                                                {t('chat.no_media')}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions Section */}
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                                                            <Shield size={16} className="text-green-500" />
                                                            {t('chat.privacy_support')}
                                                        </h3>
                                                        <div className="space-y-1">
                                                            <button
                                                                onClick={handleReportUser}
                                                                className="w-full flex items-center gap-3 p-3 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-xl transition-colors text-sm font-medium"
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-red-100 group-hover:text-red-500">
                                                                    <Shield size={16} />
                                                                </div>
                                                                {t('chat.report_user')}
                                                            </button>
                                                            <button
                                                                onClick={handleBlockUser}
                                                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors text-sm font-medium"
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                                    <Ban size={16} />
                                                                </div>
                                                                {t('chat.block_user')}
                                                            </button>
                                                            <button
                                                                onClick={handleDeleteChat}
                                                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors text-sm font-medium"
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                                    <Trash2 size={16} />
                                                                </div>
                                                                {t('chat.delete_chat')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </aside>
                            </>
                        )}

                        {/* Report Modal */}
                        {selectedRoomId && isReportModalOpen && (() => {
                            const room = roomsResponse?.find(r => r._id === selectedRoomId);
                            // Get the user to report (the other participant)
                            if (!room) return null;
                            const other = getOtherParticipant(room) as any;
                            const otherId = other?._id || other?.id;

                            if (!otherId) return null;

                            return (
                                <ReportModal
                                    isOpen={isReportModalOpen}
                                    onClose={() => setIsReportModalOpen(false)}
                                    // Report the user, not the post
                                    targetUserId={otherId}
                                    chatRoomId={room._id} // Pass the chat room ID
                                />
                            );
                        })()}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md mb-6">
                            <MessageCircle size={48} className="text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('chat.welcome_msg', { name: user?.name || '' })}</h2>
                        <p className="text-gray-500">{t('chat.select_chat')}</p>
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

            {/* Nickname Modal */}
            {isNicknameModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">{t('chat.set_nickname_title')}</h3>
                            <button
                                onClick={() => setIsNicknameModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-500 mb-4">
                                {t('chat.nickname_desc')}
                            </p>
                            <input
                                type="text"
                                value={nicknameInput}
                                onChange={(e) => setNicknameInput(e.target.value)}
                                placeholder={t('chat.nickname_placeholder')}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSetNickname();
                                }}
                            />
                        </div>
                        <div className="p-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
                            <button
                                onClick={() => setIsNicknameModalOpen(false)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                {t('chat.cancel')}
                            </button>
                            <button
                                onClick={handleSetNickname}
                                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
                            >
                                {t('chat.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
