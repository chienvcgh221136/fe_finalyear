import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vipAPI, postsAPI } from '../services/api';

import { Crown, Clock, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const VipManagement = () => {
    // Queries
    const { data: myVipRes, isLoading: loadingVip } = useQuery({
        queryKey: ['vip', 'me'],
        queryFn: vipAPI.getMyVip
    });

    const { data: myPostsRes, isLoading: loadingPosts } = useQuery({
        queryKey: ['posts', 'me'],
        queryFn: postsAPI.getMyPosts
    });



    const queryClient = useQueryClient();
    const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
    const [actionLoading, setActionLoading] = useState(false);

    // Derived State
    const myVip = myVipRes?.data?.data || myVipRes?.data || {};
    const posts = myPostsRes?.data?.data || myPostsRes?.data || [];

    const activePosts = useMemo(() => {
        return posts.filter((p: any) => p.status === 'ACTIVE');
    }, [posts]);

    // Format Helpers
    const isVipActive = myVip.isActive && new Date(myVip.expiredAt) > new Date();
    const packageInfo = myVip.packageId;
    const dailyUsed = myVip.dailyUsedSlots || 0;

    const limitMap: Record<string, number> = { 'BASIC': 5, 'PRO': 10, 'PREMIUM': 20 };
    // Calculate Total Limits (Base + Bonus) -> Fix: Add back used bonus so limit appears static
    const baseLimit = isVipActive ? (packageInfo?.postLimit || limitMap[myVip.vipType?.replace('VIP ', '').toUpperCase()] || 0) : 0;
    const limit = baseLimit + (myVip.bonusPushCredits || 0) + Math.max(0, dailyUsed - baseLimit);

    // For leads:
    const dailyViewedPhones = myVip.todayViewedPhones || 0;
    const baseViewLimit = isVipActive ? (myVip.limitViewPhone || 0) : 0;
    const limitViewPhone = baseViewLimit + (myVip.bonusLeadCredits || 0) + Math.max(0, dailyViewedPhones - baseViewLimit);

    // Remaining time text
    const timeRemainingText = useMemo(() => {
        if (!myVip.expiredAt) return 'Đã hết hạn';
        const diff = new Date(myVip.expiredAt).getTime() - new Date().getTime();

        if (diff <= 0) return 'Đã hết hạn';

        const hours = Math.ceil(diff / (1000 * 60 * 60));
        if (hours < 24) {
            return `Còn ${hours} giờ`;
        }

        const days = Math.ceil(diff / (1000 * 3600 * 24));
        return `Còn ${days} ngày`;
    }, [myVip.expiredAt]);


    // Handlers
    const toggleSelection = (id: string) => {
        if (selectedPosts.includes(id)) {
            setSelectedPosts(selectedPosts.filter(pid => pid !== id));
        } else {
            setSelectedPosts([...selectedPosts, id]);
        }
    };

    const attachVipMutation = useMutation({
        mutationFn: (ids: string[]) => vipAPI.attach(ids),
        onSuccess: (res) => {
            alert(res.data.message || "Attached VIP successfully!");
            queryClient.invalidateQueries({ queryKey: ['posts', 'me'] });
            queryClient.invalidateQueries({ queryKey: ['vip', 'me'] });
            setSelectedPosts([]);
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || "Failed to attach VIP.");
        }
    });

    const detachVipMutation = useMutation({
        mutationFn: (ids: string[]) => vipAPI.detach(ids),
        onSuccess: (res) => {
            alert(res.data.message || "Detached VIP successfully!");
            queryClient.invalidateQueries({ queryKey: ['posts', 'me'] });
            queryClient.invalidateQueries({ queryKey: ['vip', 'me'] });
            setSelectedPosts([]);
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || "Failed to detach VIP.");
        }
    });

    const handleAttach = () => {
        if (selectedPosts.length === 0) return;
        // Check VIP or Bonus
        const hasBonus = (myVip.bonusPushCredits || 0) > 0;
        if (!isVipActive && !hasBonus) {
            alert("Bạn chưa đăng ký gói VIP hoặc hết lượt đẩy tin.");
            return;
        }
        if (dailyUsed + selectedPosts.length > limit) {
            alert(`Bạn chỉ còn ${limit - dailyUsed} lượt gắn VIP hôm nay. Bạn đang chọn ${selectedPosts.length} tin.`);
            return;
        }
        setActionLoading(true);
        attachVipMutation.mutate(selectedPosts, {
            onSettled: () => setActionLoading(false)
        });
    };

    const handleDetach = () => {
        if (selectedPosts.length === 0) return;
        if (!window.confirm("Lưu ý: Gỡ VIP sẽ KHÔNG hoàn lại lượt gắn VIP đã trừ trong ngày hôm nay. Bạn có chắc chắn?")) return;

        setActionLoading(true);
        detachVipMutation.mutate(selectedPosts, {
            onSettled: () => setActionLoading(false)
        });
    };


    if (loadingVip || loadingPosts) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

    // Show full UI for all users, even without VIP
    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            <div className="w-full px-4 md:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Quản lý VIP</h1>
                        <p className="text-gray-500">Tối ưu hóa hiển thị tin đăng của bạn</p>
                    </div>
                    <Link to="/profile?tab=vip" className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 transition">
                        Lịch sử & Gói cước
                    </Link>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Status Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Gói hiện tại</p>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">{myVip.vipType}</h2>
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 w-fit px-3 py-1 rounded-full text-sm font-bold">
                                <Clock size={16} />
                                <span>{timeRemainingText}</span>
                            </div>
                        </div>
                        <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-blue-50 to-transparent"></div>
                        <Crown className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-100" size={80} />
                    </div>

                    {/* Slots Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Hạn mức hôm nay</p>
                                <h2 className="text-3xl font-bold text-gray-900">
                                    {dailyUsed}<span className="text-gray-400 text-2xl">/{limit}</span>
                                </h2>
                            </div>
                            <div className="text-right">
                                <span className="text-blue-600 font-bold text-lg">{Math.max(0, limit - dailyUsed)}</span>
                                <p className="text-xs text-gray-400 font-medium">chưa sử dụng</p>
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                            <div
                                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (dailyUsed / limit) * 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-400">Hạn mức sẽ được làm mới lúc 00:00 hằng ngày.</p>
                    </div>

                    {/* Leads Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 md:col-span-2 lg:col-span-1">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Xem SĐT hôm nay</p>
                                <h2 className="text-3xl font-bold text-gray-900">
                                    {dailyViewedPhones}<span className="text-gray-400 text-2xl">/{limitViewPhone}</span>
                                </h2>
                            </div>
                            <div className="text-right">
                                <span className="text-purple-600 font-bold text-lg">{Math.max(0, limitViewPhone - dailyViewedPhones)}</span>
                                <p className="text-xs text-gray-400 font-medium">lượt còn lại</p>
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                            <div
                                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${limitViewPhone > 0 ? Math.min(100, (dailyViewedPhones / limitViewPhone) * 100) : 0}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-400">Dùng để xem số điện thoại người đăng tin.</p>
                    </div>


                </div>

                {/* List Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h3 className="font-bold text-gray-900 text-xl">Danh sách tin đang hiển thị ({activePosts.length})</h3>

                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={handleAttach}
                                disabled={selectedPosts.length === 0 || actionLoading || dailyUsed >= limit}
                                className="flex-1 md:flex-none px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                            >
                                <Crown size={18} /> Gắn VIP ({selectedPosts.length})
                            </button>
                            <button
                                onClick={handleDetach}
                                disabled={selectedPosts.length === 0 || actionLoading}
                                className="flex-1 md:flex-none px-6 py-2 border border-red-200 text-red-600 bg-red-50 font-bold rounded-xl hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Gỡ VIP
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-left">
                                <tr>
                                    <th className="p-4 w-12">
                                        {/* Select All Checkbox could go here */}
                                    </th>
                                    <th className="p-4 text-sm font-bold text-gray-500 uppercase">Tin đăng</th>
                                    <th className="p-4 text-sm font-bold text-gray-500 uppercase">Trạng thái</th>
                                    <th className="p-4 text-sm font-bold text-gray-500 uppercase">Trạng thái VIP</th>
                                    <th className="p-4 text-sm font-bold text-gray-500 uppercase text-right">Giá</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {activePosts.map((post: any) => {
                                    const isVip = post.vip?.isActive;
                                    const isSelected = selectedPosts.includes(post._id);

                                    return (
                                        <tr key={post._id} className={`hover:bg-blue-50/30 transition ${isSelected ? 'bg-blue-50/50' : ''}`}>
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelection(post._id)}
                                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                                        {post.images?.[0] && <img src={post.images[0]} className="w-full h-full object-cover" alt="" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 line-clamp-1">{post.title}</h4>
                                                        <p className="text-xs text-gray-500">Đăng ngày: {new Date(post.createdAt).toLocaleDateString('vi-VN')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">
                                                    ACTIVE
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {isVip ? (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                                                            <Crown size={16} className="fill-blue-600" />
                                                            VIP ACTIVE
                                                        </div>
                                                        <span className="text-xs text-gray-500">
                                                            {post.vip?.vipType || myVip.vipType}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm italic">None</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right font-bold text-gray-900">
                                                {post.price >= 1000000000
                                                    ? `${(post.price / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} Tỷ`
                                                    : `${(post.price / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} Triệu`
                                                }
                                            </td>
                                        </tr>
                                    );
                                })}
                                {activePosts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-gray-500 italic">
                                            Bạn chưa có tin đăng nào đang hiển thị (ACTIVE).
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VipManagement;
