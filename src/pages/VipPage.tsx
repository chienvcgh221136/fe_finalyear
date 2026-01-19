import { useQuery, useMutation } from '@tanstack/react-query';
import { vipAPI } from '../services/api';
import type { VipPackage } from '../types';
import { useAuth } from '../context/AuthContext';
import { Check, Crown, Zap, Shield, Star, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VipPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data: packages, isLoading: loadingPackages } = useQuery({
        queryKey: ['vipPackages'],
        queryFn: async () => {
            const res = await vipAPI.getPackages();
            return res.data.data as VipPackage[];
        },
    });

    const buyMutation = useMutation({
        mutationFn: (packageId: string) => vipAPI.purchase(packageId),
        onSuccess: async () => {
            // Refresh User Data to get newly purchased VIP status if strictly needed
            // Usually auth context holds User.vip
            // We can manually refetch specific parts or just force page reload or invalidate user query
            alert('Nâng cấp VIP thành công!');
            // Ideally fetch updated user profile
            if (user) {
                // Trigger a profile refresh ideally, or manually update local user state if we knew the new expiry
                // For now, simpler to navigate or refresh
                navigate('/profile');
                // Or navigate(0) to reload
            }
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || 'Lỗi mua VIP. Vui lòng kiểm tra số dư.');
        },
    });

    const handleBuy = (pkg: VipPackage) => {
        if (!confirm(`Bạn có chắc muốn mua gói ${pkg.name} với giá ${pkg.price.toLocaleString()} VNĐ?`)) return;
        buyMutation.mutate(pkg._id);
    };



    if (loadingPackages) return <div className="p-12 text-center text-gray-500">Loading packages...</div>;

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 font-bold text-sm uppercase tracking-wider mb-4">
                    <Crown size={18} /> Premium Membership
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                    Nâng cấp tài khoản <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600">Pro</span>
                </h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                    Tiếp cận hàng triệu khách hàng tiềm năng, hiển thị tin đăng ở vị trí ưu tiên và chốt giao dịch nhanh chóng hơn.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative items-start">
                {packages?.map((pkg, idx) => {
                    const isPopular = idx === 1; // Assuming middle one is popular/Gold
                    const isActive = user?.vip?.isActive && user.vip.packageId === pkg._id; // Actually comparing ID is safer
                    // Or compare names/types

                    return (
                        <div
                            key={pkg._id}
                            className={`relative rounded-3xl p-8 transition-all duration-300 ${isPopular
                                ? 'bg-gray-900 text-white shadow-2xl scale-105 z-10 border-2 border-yellow-500/50'
                                : 'bg-white text-gray-900 shadow-xl border border-gray-100 hover:-translate-y-2'
                                }`}
                        >
                            {isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg uppercase tracking-wide">
                                    Phổ biến nhất
                                </div>
                            )}

                            {isActive && (
                                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                                    <Check size={12} /> Đang sử dụng
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className={`text-xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-gray-900'}`}>{pkg.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold">{pkg.price.toLocaleString()}</span>
                                    <span className={`text-sm font-medium ${isPopular ? 'text-gray-400' : 'text-gray-500'}`}>VNĐ / {pkg.durationDays} ngày</span>
                                </div>
                            </div>

                            {pkg.description && (
                                <p className={`text-sm mb-6 ${isPopular ? 'text-gray-200' : 'text-gray-500'}`}>
                                    {pkg.description}
                                </p>
                            )}

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <div className={`p-1 rounded-full ${isPopular ? 'bg-gray-800 text-yellow-500' : 'bg-blue-50 text-blue-600'}`}>
                                        <Zap size={16} />
                                    </div>
                                    <span className="font-medium text-sm">Điểm ưu tiên: <strong className={isPopular ? 'text-yellow-400' : 'text-blue-600'}>+{pkg.priorityScore}</strong></span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`p-1 rounded-full ${isPopular ? 'bg-gray-800 text-yellow-500' : 'bg-blue-50 text-blue-600'}`}>
                                        <Clock size={16} />
                                    </div>
                                    <span className="font-medium text-sm">Thời hạn: {pkg.durationDays} ngày</span>
                                </div>
                                {pkg.limitViewPhone && pkg.limitViewPhone > 0 && (
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1 rounded-full ${isPopular ? 'bg-gray-800 text-yellow-500' : 'bg-blue-50 text-blue-600'}`}>
                                            <Shield size={16} />
                                            {/* Ideally Phone icon but Shield is imported, can reuse or import Phone */}
                                        </div>
                                        <span className="font-medium text-sm">Xem SĐT: <strong>{pkg.limitViewPhone}</strong> lượt/ngày</span>
                                    </div>
                                )}

                                {pkg.perks && pkg.perks.length > 0 ? (
                                    pkg.perks.map((perk, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className={`p-1 rounded-full ${isPopular ? 'bg-gray-800 text-yellow-500' : 'bg-blue-50 text-blue-600'}`}>
                                                <Star size={16} />
                                            </div>
                                            <span className="font-medium text-sm">{perk}</span>
                                        </div>
                                    ))
                                ) : (
                                    <>
                                        {/* Fallback if no perks defined (legacy) */}
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1 rounded-full ${isPopular ? 'bg-gray-800 text-yellow-500' : 'bg-blue-50 text-blue-600'}`}>
                                                <Star size={16} />
                                            </div>
                                            <span className="font-medium text-sm">Huy hiệu VIP</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={() => handleBuy(pkg)}
                                disabled={isActive || buyMutation.isPending}
                                className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${isActive
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                    : isPopular
                                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:shadow-orange-500/30'
                                        : 'bg-gray-900 text-white hover:bg-black'
                                    }`}
                            >
                                {buyMutation.isPending ? 'Đang xử lý...' : isActive ? 'Đang kích hoạt' : 'Mua ngay'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VipPage;
