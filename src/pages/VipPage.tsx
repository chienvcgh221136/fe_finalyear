import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { vipAPI } from '../services/api';
import type { VipPackage } from '../types';
import { useAuth } from '../context/AuthContext';
import { Check, Crown, Zap, Shield, Star, Clock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import UpgradeWizard from '../components/vip/UpgradeWizard';

const VipPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showUpgradeWizard, setShowUpgradeWizard] = useState(false);

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
            alert('Đăng ký VIP thành công!');
            if (user) {
                navigate('/profile');
            }
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || 'Lỗi mua VIP. Vui lòng kiểm tra số dư.');
        },
    });

    const handleBuy = (pkg: VipPackage) => {
        // 1. Check if user already has active VIP
        if (user?.vip?.isActive && user.vip.packageId) {

            // Find current package details to compare price
            const currentPkg = packages?.find(p => p._id === user.vip?.packageId || p.name === user.vip?.vipType);

            if (currentPkg) {
                // Prevent purchasing same package again (already handled by disabled button, but safe measure)
                if (currentPkg._id === pkg._id) return;

                // Check for downgrade (Lower Price)
                if (pkg.price < currentPkg.price) {
                    alert(`Bạn đang sử dụng gói ${currentPkg.name} cao cấp hơn gói này. Vui lòng chờ hết hạn để đăng ký gói thấp hơn.`);
                    return;
                }

                // Check for upgrade (Higher Price)
                if (pkg.price > currentPkg.price) {
                    if (window.confirm("Bạn muốn nâng cấp lên gói VIP cao hơn?")) {
                        setShowUpgradeWizard(true);
                    }
                    return;
                }
            }
        }

        // 2. Normal Purchase Flow (No active VIP or expired)
        if (!confirm(`Bạn có chắc muốn mua gói ${pkg.name} với giá ${pkg.price.toLocaleString()} VNĐ?`)) return;
        buyMutation.mutate(pkg._id);
    };

    const myVip = user?.vip;

    if (loadingPackages) return <div className="p-12 text-center text-gray-500">Đang tải gói dịch vụ...</div>;

    return (
        <div className="w-full px-4 md:px-8 py-12 relative">
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 font-bold text-sm uppercase tracking-wider mb-4">
                    <Crown size={18} /> Premium Membership
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                    Nâng cấp tài khoản <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600">Pro</span>
                </h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-6">
                    Tiếp cận hàng triệu khách hàng tiềm năng, hiển thị tin đăng ở vị trí ưu tiên và chốt giao dịch nhanh chóng hơn.
                </p>
                {myVip?.isActive && (
                    <div className="flex justify-center gap-4">
                        <Link to="/profile?tab=vip-management" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1">
                            <Crown size={20} />
                            Quản lý Slot & Gắn VIP
                        </Link>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative items-start">
                {packages?.map((pkg, idx) => {
                    const isPopular = pkg.isPopular || false;
                    // Check purely by ID if possible, otherwise by name
                    const isActive = user?.vip?.isActive && (user.vip.packageId === pkg._id || user.vip.vipType === pkg.name);

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

            {/* Upgrade Modal */}
            {showUpgradeWizard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <UpgradeWizard
                        onClose={() => setShowUpgradeWizard(false)}
                        onSuccess={() => setShowUpgradeWizard(false)}
                    />
                </div>
            )}
        </div >
    );
};

export default VipPage;
