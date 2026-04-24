import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { chatbotAPI } from '../../services/api';
import ListingCard from '../ListingCard';
import type { Post } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLocalizedPath } from '../../utils/pathUtils';
import { useTranslation } from 'react-i18next';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    posts?: Post[];
}

const Chatbot = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: t('chatbot.welcome', 'Xin chào! Tôi là trợ lý ảo RealEstate. Tôi có thể giúp gì cho bạn trong việc tìm kiếm bất động sản?'),
            sender: 'bot'
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [anonymousCount, setAnonymousCount] = useState(0);
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const localizePath = useLocalizedPath();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const prevUserId = useRef<string | undefined>('__init__');
    const hasFetchedForCurrentSession = useRef(false);


    // Consolidate sync logic to handle user transitions cleanly
    useEffect(() => {
        const syncChatbot = async () => {
            const userChanged = prevUserId.current !== user?.id;
            
            // Define welcome message
            const welcomeMsg: Message = {
                id: '1',
                text: t('chatbot.welcome', 'Xin chào! Tôi là trợ lý ảo RealEstate. Tôi có thể giúp gì cho bạn trong việc tìm kiếm bất động sản?'),
                sender: 'bot'
            };

            // 1. If user identity changed (Guest -> User, User A -> User B, or Logout)
            if (userChanged) {
                console.log('[Chatbot] Identity changed, resetting state.');
                setMessages([welcomeMsg]);
                setAnonymousCount(0);
                hasFetchedForCurrentSession.current = false;
                prevUserId.current = user?.id;
                // If it's a logout or closed, we stop here
                if (!isAuthenticated || !user?.id || !isOpen) return;
            }

            // 2. If authenticated and open, fetch history if not already done for this session
            if (isAuthenticated && user?.id && isOpen && !hasFetchedForCurrentSession.current) {
                try {
                    hasFetchedForCurrentSession.current = true;
                    console.log('[Chatbot] Fetching clean history for user:', user.id);
                    const response = await chatbotAPI.getHistory();
                    
                    if (response.data.success && response.data.data.length > 0) {
                        const historyMessages: Message[] = response.data.data.map((m: any, idx: number) => ({
                            id: `history-${idx}-${Date.now()}`,
                            text: m.content,
                            sender: m.role === 'user' ? 'user' : 'bot',
                            posts: m.posts || []
                        }));
                        
                        // Set fresh messages: Welcome + History (discarding any existing guest messages)
                        setMessages([welcomeMsg, ...historyMessages]);
                    } else {
                        // Ensure it's reset if no history found
                        setMessages([welcomeMsg]);
                    }
                } catch (error) {
                    console.error('Fetch chatbot history error:', error);
                    hasFetchedForCurrentSession.current = false;
                }
            }
        };

        syncChatbot();
    }, [isAuthenticated, user?.id, isOpen, t]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        // Check access control
        if (!isAuthenticated && anonymousCount >= 1) {
            const warningMsg: Message = {
                id: Date.now().toString(),
                text: t('chatbot.usage_limit', 'Bạn đã dùng hết lượt hỏi miễn phí. Vui lòng đăng nhập để tiếp tục trò chuyện và nhận tư vấn chi tiết hơn!'),
                sender: 'bot'
            };
            setMessages(prev => [...prev, warningMsg]);
            return;
        }

        const userMsg: Message = {
            id: Date.now().toString(),
            text: input,
            sender: 'user'
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        if (!isAuthenticated) {
            setAnonymousCount(prev => prev + 1);
        }

        try {
            const response = await chatbotAPI.query(input);
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response.data.data.message,
                sender: 'bot',
                posts: response.data.data.posts
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error: any) {
            console.error('Chatbot error:', error);
            const errorMessage = error.response?.data?.message || t('chatbot.error_occurred', 'Xin lỗi, tôi gặp sự cố khi kết nối. Vui lòng thử lại sau.');
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: errorMessage,
                sender: 'bot'
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessageContent = (msg: Message) => {
        // More permissive regex to catch any variation like [PROPERTY:...] or [PROPERTY: ...]
        const parts = msg.text.split(/(\[PROPERTY:?\s*[^\]\s]+\s*\])/g);

        return (
            <div className="space-y-4">
                <div className="whitespace-pre-wrap">
                    {parts.map((part, i) => {
                        const match = part.match(/\[PROPERTY:?\s*([^\]\s]+)\s*\]/);
                        if (match) {
                            const postId = match[1].trim();
                            // Search in current message first, then fallback to all messages
                            let post = msg.posts?.find(p => (String(p._id) === postId || String(p.id) === postId));

                            if (!post && messages) {
                                // Find in any other message that has posts
                                for (const otherMsg of messages) {
                                    const found = otherMsg.posts?.find(p => (String(p._id) === postId || String(p.id) === postId));
                                    if (found) {
                                        post = found;
                                        break;
                                    }
                                }
                            }

                            if (post) {
                                return (
                                    <div key={i} className="my-4 max-w-full sm:max-w-[320px] group">
                                        <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 transition-all duration-300 group-hover:shadow-xl group-hover:border-blue-200 group-hover:-translate-y-1">
                                            <ListingCard post={post} />
                                            <div className="p-3 bg-gray-50 border-t border-gray-100">
                                                <button
                                                    onClick={() => navigate(localizePath(`/post/${post._id || post.id}`))}
                                                    className="w-full py-2 bg-blue-600/10 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                                >
                                                    {t('chatbot.view_details', 'Xem chi tiết bài đăng')}
                                                    <ExternalLink size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        }
                        return <span key={i}>{part}</span>;
                    })}
                </div>
                {msg.text.includes('Vui lòng đăng nhập để tiếp tục') && (
                    <button
                        onClick={() => navigate(localizePath('/login'))}
                        className="w-full py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                    >
                        {t('chatbot.login_now', 'Đăng nhập ngay')}
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[400px] h-[600px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white flex justify-between items-center shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[140%] bg-white rotate-12 blur-3xl rounded-full" />
                            </div>

                            <div className="flex items-center gap-3 relative z-10">
                                <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                                    <Bot size={24} className="text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg tracking-tight">EstateBot</h3>
                                        <span className="bg-blue-400/30 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider backdrop-blur-sm border border-white/10">AI Agent</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                                        <span className="text-[11px] text-blue-100 font-medium">{t('chatbot.ready_to_help', 'Sẵn sàng hỗ trợ')}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-white/20 p-2 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50"
                        >
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}
                                >
                                    {msg.sender === 'bot' && (
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-blue-200 font-bold border border-white/20">
                                            <Bot size={16} />
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm transition-all ${msg.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none font-medium shadow-md shadow-blue-600/10'
                                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none leading-relaxed'
                                        }`}>
                                        {renderMessageContent(msg)}
                                    </div>
                                    {msg.sender === 'user' && (
                                        <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center shrink-0 mt-1 shadow-sm font-bold border border-gray-200">
                                            U
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-200">
                                        <Loader2 size={16} className="animate-spin" />
                                    </div>
                                    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm text-gray-500 text-sm flex items-center gap-2 italic">
                                        <Sparkles size={14} className="text-blue-500" />
                                        {t('chatbot.searching', 'Đang tìm kiếm thông tin...')}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-6 bg-white border-t border-gray-100">
                            <div className="relative flex items-center gap-3">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={t('chatbot.placeholder', 'Hỏi tôi bất cứ điều gì...')}
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl pl-5 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm font-medium"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/20"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <p className="mt-3 text-[10px] text-center text-gray-400 font-medium uppercase tracking-wider">
                                Powered by EstateAI & Gemini
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700"
                >
                    <Bot size={32} />
                </motion.button>
            )}
        </div>
    );
};

export default Chatbot;
