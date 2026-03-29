import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { usersAPI, postsAPI, filesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { formatVND } from '../utils/currencyUtils';
import LocalizedLink from '../components/common/LocalizedLink';
import { FileText, Heart, LogOut, Edit, User as UserIcon, Calendar, Trash2, CheckCircle, Camera, CreditCard, Crown, BarChart2 } from 'lucide-react';
import WalletPage from './WalletPage';
import VipPage from './VipPage';
import UserStatsPage from './UserStatsPage';
import VipManagement from './VipManagement';


const Profile = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, logout, updateUser } = useAuth();
    const { success: toastSuccess, error: toastError } = useToast();
    const activeTab = searchParams.get('tab') || 'profile';
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        avatar: user?.avatar || '',
    });

    // File Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // Queries
    const { data: myPostsResponse, isLoading: loadingPosts } = useQuery({
        queryKey: ['posts', 'me'],
        queryFn: () => postsAPI.getMyPosts(),
        enabled: activeTab === 'posts',
    });

    const queryClient = useQueryClient();
    const [postFilter, setPostFilter] = useState('ALL');

    // Filter Posts
    const filteredPosts = (myPostsResponse?.data?.data || myPostsResponse?.data || []).filter((post: any) => {
        if (postFilter === 'ALL') return true;
        return post.status === postFilter;
    });

    // Mutations
    const deletePostMutation = useMutation({
        mutationFn: (id: string) => postsAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts', 'me'] });
            toastSuccess(t('profile.delete_post_success'));
        }
    });

    const markSoldMutation = useMutation({
        mutationFn: (id: string) => postsAPI.markSold(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts', 'me'] });
            toastSuccess(t('profile.mark_sold_success'));
        }
    });

    const markRentedMutation = useMutation({
        mutationFn: (id: string) => postsAPI.markRented(id),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['posts', 'me'] });
            toastSuccess(res.data.message || t('profile.update_status_success'));
        }
    });

    const updateProfileMutation = useMutation({
        mutationFn: (data: any) => usersAPI.updateProfile(data),
        onSuccess: (res) => {
            updateUser(res.data.data || res.data);
            setIsEditing(false);
            toastSuccess(t('profile.update_success'));
        },
    });

    // Handlers
    const handleDeletePost = (id: string) => {
        if (window.confirm(t('profile.confirm_delete_post'))) {
            deletePostMutation.mutate(id);
        }
    };

    const handleMarkSold = (id: string) => {
        if (window.confirm(t('profile.confirm_mark_sold'))) {
            markSoldMutation.mutate(id);
        }
    };

    const handleMarkRented = (id: string) => {
        if (window.confirm(t('profile.confirm_mark_rented'))) {
            markRentedMutation.mutate(id);
        }
    };

    const handleMarkAvailable = (id: string) => {
        if (window.confirm(t('profile.confirm_mark_available'))) {
            markRentedMutation.mutate(id);
        }
    };

    const handleTabChange = (tab: string) => {
        setSearchParams({ tab });
    };

    const handleLogout = () => {
        logout();
        navigate(`/${activeTab.split('/')[0] || 'vi'}/login`); // This is tricky, maybe better to just use a fixed path or useLocalizedPath if available in a hook
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toastError(t('common.error_select_image'));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toastError(t('common.error_image_too_large'));
            return;
        }

        try {
            setUploading(true);
            const res = await filesAPI.upload(file);
            const url = res.data.data?.url || res.data.url;

            // Update form state
            const newFormState = { ...profileForm, avatar: url };
            setProfileForm(newFormState);

            // Auto-save to backend
            updateProfileMutation.mutate(newFormState);

            toastSuccess(t('profile.avatar_upload_success'));
        } catch (error) {
            console.error('Upload error:', error);
            toastError(t('profile.avatar_upload_error'));
        } finally {
            setUploading(false);
        }
    };

    const AppointmentsTab = () => {
        const { data: appointmentsRes, isLoading, refetch } = useQuery({
            queryKey: ['appointments', 'me'],
            queryFn: () => import('../services/api').then(m => m.appointmentAPI.getMyAppointments()),
        });

        // 'received' | 'sent'
        const [subTab, setSubTab] = useState('received');

        const updateStatusMutation = useMutation({
            mutationFn: ({ id, status }: { id: string, status: string }) =>
                import('../services/api').then(m => m.appointmentAPI.updateStatus(id, status)),
            onSuccess: () => {
                toastSuccess(t('profile.appointment_update_success'));
                refetch();
            },
            onError: (err: any) => {
                toastError(err.response?.data?.message || t('common.error_occurred'));
            }
        });

        const deleteMutation = useMutation({
            mutationFn: (id: string) => import('../services/api').then(m => m.appointmentAPI.delete(id)),
            onSuccess: () => {
                toastSuccess(t('profile.appointment_delete_success'));
                refetch();
            },
            onError: (err: any) => {
                toastError(err.response?.data?.message || t('common.error_occurred'));
            }
        });

        const { buy = [], sell = [] } = appointmentsRes?.data?.data || {};

        if (isLoading) return <div className="py-12 text-center text-gray-500">{t('common.loading')}</div>;

        const AppointmentCard = ({ ap, isSeller }: { ap: any, isSeller: boolean }) => {
            const partner = isSeller ? ap.buyerId : ap.sellerId;
            const post = ap.postId;
            if (!post) return null;

            return (
                <div key={ap._id} className="bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-100 transition-colors flex flex-col md:flex-row gap-4 group">
                    {/* Post Info */}
                    <div className="md:w-48 shrink-0">
                        <div className="w-full h-28 bg-gray-200 rounded-lg overflow-hidden relative mb-2">
                            {post.images?.[0] && <img src={post.images[0]} className="w-full h-full object-cover" alt="" />}
                            <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded text-white ${ap.status === 'PENDING' ? 'bg-yellow-500' :
                                ap.status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                {ap.status}
                            </span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm truncate">{post.title}</h4>
                        <p className="text-blue-600 text-xs font-bold">{formatPrice(post.price, post.transactionType)}</p>
                    </div>

                    {/* Appointment Details */}
                    <div className="flex-1 text-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h5 className="font-bold text-gray-800 text-base mb-1">
                                    {isSeller ? t('profile.appointment_from') : t('profile.appointment_to')}
                                    <span className="text-blue-600">{partner?.name}</span>
                                </h5>
                                <p className="text-gray-500 flex items-center gap-1">
                                    <Calendar size={14} />
                                    {new Date(ap.appointmentTime).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            {isSeller && partner?.phone && ap.status === 'APPROVED' && (
                                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                                    {partner.phone}
                                </span>
                            )}
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg text-gray-600 mb-3 border border-gray-100">
                            <strong>{t('profile.appointment_note')}:</strong> {ap.note || t('common.none')}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 justify-end items-center">
                            {/* Delete Button (Always visible for both parties to clear history) */}
                            <button
                                onClick={() => {
                                    if (window.confirm(t('profile.confirm_delete_appointment'))) {
                                        deleteMutation.mutate(ap._id);
                                    }
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title={t('common.delete')}
                            >
                                <Trash2 size={16} /> {t('common.delete')}
                            </button>

                            {isSeller && ap.status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={() => updateStatusMutation.mutate({ id: ap._id, status: 'REJECTED' })}
                                        className="px-3 py-1.5 border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        {t('common.reject')}
                                    </button>
                                    <button
                                        onClick={() => updateStatusMutation.mutate({ id: ap._id, status: 'APPROVED' })}
                                        className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                                    >
                                        {t('common.approve')}
                                    </button>
                                </>
                            )}
                            {isSeller && ap.status === 'APPROVED' && (
                                <button
                                    disabled
                                    className="px-3 py-1.5 bg-green-50 text-green-700 font-bold rounded-lg border border-green-200"
                                >
                                    {t('profile.appointment_approved')}
                                </button>
                            )}
                            {!isSeller && ap.status === 'PENDING' && (
                                <button className="px-3 py-1.5 text-gray-400 font-medium text-xs cursor-not-allowed">{t('profile.appointment_pending')}</button>
                            )}
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">{t('profile.tab_appointments')}</h2>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setSubTab('received')}
                            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${subTab === 'received' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {t('profile.appointment_received')}
                            {sell.length > 0 && <span className="ml-2 bg-gray-300 text-gray-700 text-[10px] px-1.5 py-0.5 rounded-full">{sell.length}</span>}
                        </button>
                        <button
                            onClick={() => setSubTab('sent')}
                            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${subTab === 'sent' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {t('profile.appointment_sent')}
                            {buy.length > 0 && <span className="ml-2 bg-gray-300 text-gray-700 text-[10px] px-1.5 py-0.5 rounded-full">{buy.length}</span>}
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {subTab === 'received' ? (
                        sell.length > 0 ? (
                            sell.map((ap: any) => <AppointmentCard key={ap._id} ap={ap} isSeller={true} />)
                        ) : (
                            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                {t('profile.appointment_no_received')}
                            </div>
                        )
                    ) : (
                        buy.length > 0 ? (
                            buy.map((ap: any) => <AppointmentCard key={ap._id} ap={ap} isSeller={false} />)
                        ) : (
                            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                {t('profile.appointment_no_sent')}
                            </div>
                        )
                    )}
                </div>
            </div>
        );
    };

    const FavoritePostsTab = () => {
        const { data: favoritesRes, isLoading } = useQuery({
            queryKey: ['favorites', 'me'],
            queryFn: () => import('../services/api').then(m => m.favoriteAPI.getMyFavorites()),
        });

        const favorites = favoritesRes?.data?.data || [];

        if (isLoading) return <div className="py-12 text-center text-gray-500">{t('common.loading')}</div>;

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">{t('profile.tab_saved_posts')}</h2>
                {favorites.length > 0 ? (
                    <div className="space-y-4">
                        {favorites.map((fav: any) => {
                            const post = fav.postId;
                            if (!post) return null; // Handle deleted posts
                            return (
                                <div key={fav._id} className="flex flex-col md:flex-row gap-4 border border-gray-100 rounded-xl p-4 hover:border-blue-100 transition-colors bg-white">
                                    <div className="w-full md:w-48 h-32 bg-gray-200 rounded-lg shrink-0 overflow-hidden relative">
                                        {post.images?.[0] && <img src={post.images[0]} className="w-full h-full object-cover" alt="" />}
                                        <div className="absolute top-2 left-2">
                                            <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">{t('common.saved')}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg truncate pr-4">{post.title}</h3>
                                            <p className="text-blue-600 font-bold">{formatPrice(post.price, post.transactionType)}</p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50 md:mt-0 md:border-0 md:justify-end">
                                            <LocalizedLink to={`/post/${post._id}`} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
                                                {t('common.view_post')}
                                            </LocalizedLink>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm(t('profile.unsave_confirm'))) {
                                                        await import('../services/api').then(m => m.favoriteAPI.toggle(post._id));
                                                        queryClient.invalidateQueries({ queryKey: ['favorites', 'me'] });
                                                        toastSuccess(t('profile.unsave_success'));
                                                    }
                                                }}
                                                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                                            >
                                                {t('common.unsave')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>{t('profile.no_saved_posts')}</p>
                    </div>
                )}
            </div>
        );
    };

    const StatusBadge = ({ status }: { status: string }) => {
        let color = "bg-gray-100 text-gray-600";
        let label = status;

        switch (status) {
            case 'ACTIVE':
                color = "bg-green-100 text-green-700 border border-green-200";
                label = t('post_detail.status_active');
                break;
            case 'PENDING':
                color = "bg-yellow-100 text-yellow-700 border border-yellow-200";
                label = t('post_detail.status_pending_short');
                break;
            case 'REJECTED':
                color = "bg-red-100 text-red-700 border border-red-200";
                label = t('post_detail.status_rejected_short');
                break;
            case 'SOLD':
                color = "bg-gray-100 text-gray-600 border border-gray-200";
                label = t('post_detail.status_sold_short');
                break;
            case 'RENTED':
                color = "bg-orange-100 text-orange-700 border border-orange-200";
                label = t('post_detail.status_rented_short');
                break;
            default:
                label = status;
        }

        return (
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-sm ${color}`}>
                {label}
            </span>
        );
    };

    const formatPrice = (price: number, transactionType?: string) => {
        if (!price) return t('common.contact');
        if (transactionType === 'RENT') {
            return `${price.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} ${t('common.currency')}/${t('common.month')}`;
        }
        if (price >= 1000000000) {
            return `${(price / 1000000000).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { maximumFractionDigits: 2 })} ${t('common.billion')}`;
        }
        if (price >= 1000000) {
            return `${(price / 1000000).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { maximumFractionDigits: 1 })} ${t('common.million')}`;
        }
        return formatVND(price);
    };

    const myPosts = myPostsResponse?.data?.data || myPostsResponse?.data || [];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="w-full px-4 md:px-8">
                <div className="grid gap-6 md:grid-cols-[280px_1fr]">

                    {/* Sidebar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit sticky top-24">
                        <div className="p-6 text-center border-b border-gray-100">
                            {/* Avatar Display */}
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg overflow-hidden bg-blue-600 text-white text-3xl font-bold relative group">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    user?.name?.charAt(0).toUpperCase()
                                )}
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-1">{user?.name}</h3>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                        <nav className="p-4 space-y-6">
                            {[
                                {
                                    group: t('profile.group_account'),
                                    items: [
                                        { id: 'profile', label: t('profile.tab_personal_info'), icon: UserIcon },
                                    ]
                                },
                                {
                                    group: t('profile.group_activity'),
                                    items: [
                                        { id: 'posts', label: t('profile.tab_my_posts'), icon: FileText },
                                        { id: 'favorites', label: t('profile.tab_saved_posts'), icon: Heart },
                                        { id: 'appointments', label: t('profile.tab_appointments'), icon: Calendar },
                                    ]
                                },
                                {
                                    group: t('profile.group_finance_vip'),
                                    items: [
                                        { id: 'wallet', label: t('profile.tab_my_wallet'), icon: CreditCard },
                                        { id: 'vip', label: t('profile.tab_vip_packages'), icon: Crown },
                                        { id: 'vip-management', label: t('profile.tab_vip_management'), icon: Crown },
                                    ]
                                },
                                {
                                    group: t('profile.group_analysis'),
                                    items: [
                                        { id: 'stats', label: t('profile.tab_statistics'), icon: BarChart2 },
                                    ]
                                }
                            ].map((section, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <div className="h-px bg-gray-100 flex-1"></div>
                                        {section.group}
                                        <div className="h-px bg-gray-100 flex-1"></div>
                                    </div>
                                    <div className="space-y-1">
                                        {section.items.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleTabChange(item.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === item.id
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                    : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'
                                                    }`}
                                            >
                                                <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'} />
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </nav>
                        <div className="p-4 bg-gray-50/50">
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                                <LogOut size={18} />
                                {t('navbar.logout')}
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        {activeTab === 'profile' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">{t('profile.tab_personal_info')}</h2>
                                    {!isEditing && (
                                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
                                            <Edit size={16} />
                                            {t('common.edit')}
                                        </button>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.avatar_label')}</label>
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="relative group/avatar cursor-pointer" onClick={() => isEditing && fileInputRef.current?.click()}>
                                            <div className="w-20 h-20 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                                                {profileForm.avatar ? (
                                                    <img src={profileForm.avatar} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserIcon className="text-gray-400" size={32} />
                                                )}
                                            </div>
                                            {isEditing && (
                                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                                    <Camera className="text-white" size={24} />
                                                </div>
                                            )}
                                        </div>

                                        {isEditing && (
                                            <div className="flex items-center justify-center gap-4">
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileChange}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploading}
                                                    className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                                                >
                                                    {uploading ? t('common.uploading') : t('profile.btn_choose_new_photo')}
                                                </button>
                                                <p className="text-xs text-gray-500 mt-1">{t('profile.avatar_support_formats')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>


                                <div className="space-y-4 max-w-lg">
                                    {/* Name Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.full_name')}</label>
                                        <input
                                            type="text"
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            disabled={!isEditing}
                                            placeholder={t('profile.placeholder_name')}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                                        />
                                    </div>

                                    {/* Email Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="text"
                                            value={user?.email}
                                            disabled
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">{t('profile.email_no_change')}</p>
                                    </div>

                                    {/* Phone Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.phone_number')}</label>
                                        <input
                                            type="text"
                                            value={profileForm.phone}
                                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                            disabled={!isEditing}
                                            placeholder={t('profile.placeholder_phone')}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                                        />
                                    </div>

                                    {isEditing && (
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => updateProfileMutation.mutate(profileForm)}
                                                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                {t('common.save_changes')}
                                            </button>
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                {t('common.cancel')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'posts' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">{t('profile.tab_my_posts')}</h2>
                                    <LocalizedLink to="/post-ad" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                        {t('profile.btn_new_post')}
                                    </LocalizedLink>
                                </div>

                                <div className="flex gap-2 mb-6 border-b border-gray-100 pb-1 overflow-x-auto">
                                    {['ALL', 'ACTIVE', 'PENDING', 'SOLD', 'REJECTED'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setPostFilter(status)}
                                            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${postFilter === status
                                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {status === 'ALL' && t('common.all')}
                                            {status === 'ACTIVE' && t('post_detail.status_active')}
                                            {status === 'PENDING' && t('post_detail.status_pending_short')}
                                            {status === 'SOLD' && t('post_detail.status_sold_short')}
                                            {status === 'REJECTED' && t('post_detail.status_rejected_short')}
                                            <span className="ml-2 text-xs py-0.5 px-1.5 rounded-full bg-gray-200 text-gray-600">
                                                {status === 'ALL' ? myPosts.length : myPosts.filter((p: any) => p.status === status).length}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {loadingPosts ? (
                                    <div className="py-12 text-center text-gray-500">{t('common.loading')}</div>
                                ) : filteredPosts.length > 0 ? (
                                    <div className="space-y-4">
                                        {filteredPosts.map((post: any) => (
                                            <div key={post._id} className="flex flex-col md:flex-row gap-4 border border-gray-100 rounded-xl p-4 hover:border-blue-100 transition-colors bg-white">
                                                <div className="w-full md:w-48 h-32 bg-gray-200 rounded-lg shrink-0 overflow-hidden relative">
                                                    {post.images?.[0] && <img src={post.images[0]} className="w-full h-full object-cover" alt="" />}
                                                    <div className="absolute top-2 left-2">
                                                        <StatusBadge status={post.status || 'PENDING'} />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h3 className="font-bold text-gray-900 text-lg truncate pr-4" title={post.title}>{post.title}</h3>
                                                            <div className="text-right">
                                                                <p className="text-blue-600 font-bold text-lg">{formatPrice(post.price, post.transactionType)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-gray-500 mb-2 flex flex-wrap gap-4">
                                                            <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(post.createdAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}</span>
                                                            {post.area && <span>• {post.area} m²</span>}
                                                            {post.city && <span>• {post.city}</span>}
                                                        </div>
                                                        {post.rejectReason && post.status === 'REJECTED' && (
                                                            <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-2">
                                                                {t('profile.reject_reason')}: {post.rejectReason}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50 md:mt-0 md:border-0 md:justify-end">
                                                        <LocalizedLink to={`/post/${post._id}`} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
                                                            {t('common.view')}
                                                        </LocalizedLink>

                                                        {post.status !== 'SOLD' && (
                                                            <button
                                                                onClick={() => navigate(`/post-ad?edit=${post._id}`)}
                                                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                                                            >
                                                                <Edit size={14} /> {t('common.edit')}
                                                            </button>
                                                        )}

                                                        {post.status === 'ACTIVE' && post.transactionType === 'SALE' && (
                                                            <button
                                                                onClick={() => handleMarkSold(post._id)}
                                                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors"
                                                            >
                                                                <CheckCircle size={14} /> {t('profile.btn_sold')}
                                                            </button>
                                                        )}

                                                        {post.status === 'ACTIVE' && post.transactionType === 'RENT' && (
                                                            <button
                                                                onClick={() => handleMarkRented(post._id)}
                                                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 rounded hover:bg-orange-100 transition-colors"
                                                            >
                                                                <CheckCircle size={14} /> {t('profile.btn_rented')}
                                                            </button>
                                                        )}

                                                        {post.status === 'RENTED' && post.transactionType === 'RENT' && (
                                                            <button
                                                                onClick={() => handleMarkAvailable(post._id)}
                                                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                                                            >
                                                                <CheckCircle size={14} /> {t('profile.btn_available')}
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => handleDeletePost(post._id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors ml-auto md:ml-0"
                                                        >
                                                            <Trash2 size={14} /> {t('common.delete')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>{t('profile.no_posts_found')}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'favorites' && (
                            <FavoritePostsTab />
                        )}

                        {activeTab === 'appointments' && (
                            <AppointmentsTab />
                        )}

                        {activeTab === 'wallet' && (
                            <div className="rounded-xl overflow-hidden">
                                <WalletPage />
                            </div>
                        )}

                        {activeTab === 'vip' && (
                            <div className="rounded-xl overflow-hidden">
                                <VipPage />
                            </div>
                        )}

                        {activeTab === 'stats' && (
                            <div className="rounded-xl overflow-hidden">
                                <UserStatsPage />
                            </div>
                        )}

                        {activeTab === 'vip-management' && (
                            <div className="rounded-xl overflow-hidden">
                                <VipManagement />
                            </div>
                        )}



                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
