import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '../../services/api';
import { Bell, Heart, Calendar, MessageSquare, AlertTriangle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import LocalizedLink from '../common/LocalizedLink';
import { useTranslation } from 'react-i18next';

const NotificationDropdown = () => {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'ACTIVITY' | 'NEWS'>('NEWS');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const dateLocale = i18n.language === 'en' ? enUS : vi;

    const { data: notificationsData } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationAPI.getAll,
        refetchInterval: 10000, // Poll every 10s
    });

    const notifications = notificationsData?.data?.notifications || [];
    const unreadCount = notificationsData?.data?.unreadCount || 0;

    const markReadMutation = useMutation({
        mutationFn: notificationAPI.markRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: notificationAPI.markAllRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (n: any) => {
        if (!n.isRead) {
            markReadMutation.mutate(n._id);
        }
        setIsOpen(false);
    };

    const newsTypes = ['LEAD', 'APPOINTMENT', 'LIKE', 'REVIEW'];
    const activityTypes = ['SYSTEM', 'REPORT'];

    const displayedNotifications = notifications.filter((n: any) =>
        activeTab === 'NEWS' ? newsTypes.includes(n.type) : activityTypes.includes(n.type)
    );

    const getIcon = (type: string) => {
        switch (type) {
            case 'LIKE': return <Heart className="text-red-500 fill-red-500" size={18} />;
            case 'APPOINTMENT': return <Calendar className="text-blue-500" size={18} />;
            case 'LEAD': return <Info className="text-green-500" size={18} />;
            case 'REVIEW': return <MessageSquare className="text-yellow-500" size={18} />;
            case 'REPORT': return <AlertTriangle className="text-orange-500" size={18} />;
            default: return <Bell className="text-gray-500" size={18} />;
        }
    };

    const getLink = (n: any) => {
        // Construct link based on type and relatedId
        if (n.relatedId) {
            if (n.type === 'APPOINTMENT') return `/profile?tab=appointments`; // Or specific appointment detail if available
            if (n.type === 'LEAD') return `/post/${n.relatedId}`; // Seller reviewing their post
            if (n.type === 'LIKE' || n.type === 'REVIEW') return `/post/${n.relatedId}`;
            if (n.type === 'REPORT') return `/post/${n.relatedId}`; // Or help center
        }
        return '#';
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors relative"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-100 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">{t('notifications.title')}</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllReadMutation.mutate()}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                {t('notifications.mark_all_read')}
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                        <button
                            className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'ACTIVITY' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('ACTIVITY')}
                        >
                            {t('notifications.tab_activity')}
                        </button>
                        <button
                            className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'NEWS' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('NEWS')}
                        >
                            {t('notifications.tab_news')}
                        </button>
                    </div>

                    {/* Content */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {displayedNotifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Bell className="mx-auto mb-2 opacity-20" size={32} />
                                <p className="text-sm">{t('notifications.no_notifications')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {displayedNotifications.map((n: any) => (
                                    <LocalizedLink
                                        key={n._id}
                                        to={getLink(n)}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`flex gap-3 p-4 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <div className="shrink-0 mt-1">
                                            <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                                {getIcon(n.type)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm text-gray-900 ${!n.isRead ? 'font-semibold' : ''}`}>
                                                {n.message}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: dateLocale })}
                                            </p>
                                        </div>
                                        {!n.isRead && (
                                            <div className="shrink-0 self-center">
                                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                            </div>
                                        )}
                                    </LocalizedLink>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
