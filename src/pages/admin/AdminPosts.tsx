import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsAPI, statsAPI } from '../../services/api';
import type { Post, User } from '../../types';
import {
    CheckSquare, RefreshCw, Search, Filter, MapPin, AlertTriangle
} from 'lucide-react';
import LocalizedLink from '../../components/common/LocalizedLink';
import { useTranslation } from 'react-i18next';

const AdminPosts = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filterType, setFilterType] = useState('All'); // 'All', 'SALE', 'RENT'

    const [rejectModal, setRejectModal] = useState<{ open: boolean; postId: string | null }>({
        open: false,
        postId: null,
    });
    const [rejectReason, setRejectReason] = useState('');

    const { data: posts, isLoading, refetch } = useQuery({
        queryKey: ['admin', 'pending-posts'],
        queryFn: () => postsAPI.getPending(),
        select: (res) => res.data.data as Post[],
    });

    const { data: stats } = useQuery({
        queryKey: ['admin', 'post-stats'],
        queryFn: () => statsAPI.getAdminPostStats(),
        select: (res) => res.data,
        refetchInterval: 30000,
    });

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetch();
        setTimeout(() => setIsRefreshing(false), 500); // Visual feedback
    };

    const approveMutation = useMutation({
        mutationFn: (postId: string) => postsAPI.approve(postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'pending-posts'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'post-stats'] });
            alert(t('admin.common.update_success'));
        },
        onError: (err) => {
            console.error(err);
            alert(t('admin.common.error'));
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ postId, reason }: { postId: string; reason: string }) =>
            postsAPI.reject(postId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'pending-posts'] });
            setRejectModal({ open: false, postId: null });
            setRejectReason('');
            alert(t('admin.common.update_success'));
        },
        onError: (err) => {
            console.error(err);
            alert(t('admin.common.error'));
        },
    });

    const handleReject = () => {
        if (!rejectModal.postId || !rejectReason.trim()) {
            alert(t('admin.posts.reject_reason_label'));
            return;
        }
        rejectMutation.mutate({ postId: rejectModal.postId, reason: rejectReason });
    };

    // Filter Logic
    const filteredPosts = posts?.filter(post => {
        const matchesSearch =
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (post.userId as User)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post._id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'All' || post.transactionType === filterType;

        return matchesSearch && matchesType;
    });

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans text-slate-800">
            {/* Top Search Bar (Simulated Layout Header) */}
            <div className="bg-white p-4 -mx-4 sm:-mx-8 -mt-8 sm:-mt-8 mb-8 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-30">
                <div className="relative w-full max-w-2xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={t('admin.common.search')}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                    {/* Icons removed as per user request */}
                </div>
            </div>

            {/* Title & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{t('admin.posts.title')}</h1>
                    <p className="text-slate-500 mt-1">{t('admin.dashboard.pending_posts')}: <span className="font-bold text-blue-600">{posts?.length || 0}</span></p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors ${showFilters ? 'bg-slate-50 border-slate-300' : ''}`}
                        >
                            <Filter size={16} />
                            {t('admin.common.filter')}
                        </button>

                        {/* Filter Dropdown */}
                        {showFilters && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg z-20 p-2 animate-in fade-in zoom-in duration-100">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-2">{t('post_detail.property_type')}</div>
                                {['All', 'SALE', 'RENT'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => { setFilterType(type); setShowFilters(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === type ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        {type === 'All' ? t('admin.common.all') : type === 'SALE' ? t('common.buy') : t('common.rent')}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-colors shadow-sm shadow-blue-200"
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        {t('admin.common.refresh')}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.dashboard.pending_posts')}</p>
                        <p className="text-3xl font-bold text-slate-900 mt-3">{posts?.length || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.posts.approved_today')}</p>
                        <p className="text-3xl font-bold text-slate-900 mt-3">{stats?.approvedToday || 0}</p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <CheckSquare size={24} />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.posts.table_post')}</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('common.price')}</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.posts.table_location')}</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.posts.table_user')}</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.common.created_at')}</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('admin.common.status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredPosts && filteredPosts.length > 0 ? (
                                filteredPosts.map((post) => (
                                    <tr key={post._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-6 max-w-xs">
                                            <div className="flex items-start gap-3">
                                                <div className="h-12 w-16 shrink-0 rounded-lg bg-slate-200 overflow-hidden">
                                                    <img
                                                        src={post.images?.[0] || 'https://via.placeholder.com/150'}
                                                        alt={post.title}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <LocalizedLink to={`/post/${post._id}`} target="_blank" className="font-bold text-slate-900 text-sm hover:text-blue-600 line-clamp-1">
                                                        {post.title}
                                                    </LocalizedLink>
                                                    <p className="text-xs text-blue-500 font-mono mt-0.5">ID: #PROP-{post._id.slice(-4).toUpperCase()}</p>
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mt-1 ${post.transactionType === 'SALE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                        {post.transactionType === 'SALE' ? t('common.sale') : t('common.rent')}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                                            {(post.price / 1000000000).toFixed(2)} {t('common.billion').replace(' VNĐ', '')}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                <MapPin size={14} className="text-slate-400 shrink-0" />
                                                <span className="truncate max-w-[150px]">{post.address?.district || 'Unknown'}, {post.address?.city || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{(post.userId as User)?.name || 'Unknown'}</p>
                                                <p className="text-xs text-slate-500">{(post.userId as User)?.email || 'Private User'}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                <span className="text-xs text-slate-500">
                                                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}
                                                    <br />
                                                    <span className="text-[10px] text-slate-400">
                                                        {post.createdAt ? new Date(post.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => approveMutation.mutate(post._id)}
                                                    disabled={approveMutation.isPending}
                                                    className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition-colors shadow-sm shadow-green-200"
                                                >
                                                    {t('admin.posts.approve')}
                                                </button>
                                                <button
                                                    onClick={() => setRejectModal({ open: true, postId: post._id })}
                                                    className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
                                                >
                                                    {t('admin.posts.reject')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Filter className="h-10 w-10 text-slate-300 mb-3" />
                                            <p>{t('admin.common.no_data')}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reject Modal (Retained functionality) */}
            {rejectModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-red-50/50">
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                                <AlertTriangle size={16} />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg">{t('admin.posts.reject_modal_title')}</h3>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">
                                {t('admin.posts.reject_placeholder')}
                            </p>
                            <textarea
                                placeholder={t('admin.posts.reject_placeholder')}
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm resize-none"
                                autoFocus
                            />
                        </div>

                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setRejectModal({ open: false, postId: null })}
                                className="px-4 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-200 transition-colors text-sm"
                            >
                                {t('admin.common.cancel')}
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={rejectMutation.isPending}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-sm flex items-center gap-2 shadow-sm shadow-red-200"
                            >
                                {t('admin.posts.reject')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPosts;
