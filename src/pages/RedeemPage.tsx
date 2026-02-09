import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pointService } from '../services/pointService';
import { useAuth } from '../context/AuthContext';
import { Gift, TrendingUp, Users, Award, ChevronLeft, CheckCircle, Moon } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import RedeemModal from '../components/modals/RedeemModal';
import EarnPointsModal from '../components/modals/EarnPointsModal';

const RedeemPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { success, error } = useToast();


    const [selectedReward, setSelectedReward] = React.useState<any>(null);
    const [showEarnInfo, setShowEarnInfo] = React.useState(false);

    const { data: pointData, isLoading } = useQuery({
        queryKey: ['myPoints'],
        queryFn: () => pointService.getMyPoints().then(res => res.data)
    });

    const redeemMutation = useMutation({
        mutationFn: pointService.redeemReward,
        onSuccess: (data) => {
            success(data.message);
            queryClient.invalidateQueries({ queryKey: ['myPoints'] });
            setSelectedReward(null);
        },
        onError: (err: any) => {
            error(err.response?.data?.message || "Đổi quà thất bại");
            setSelectedReward(null);
        }
    });

    const handleRedeemClick = (item: any) => {
        setSelectedReward(item);
    };

    const handleConfirmRedeem = () => {
        if (selectedReward && !redeemMutation.isPending) {
            redeemMutation.mutate(selectedReward.key);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;

    const { balance } = pointData || { balance: 0 };

    return (
        <div className="min-h-screen bg-pink-50/30 pb-20 font-sans">
            {/* Header / Nav */}
            <div className="container mx-auto px-4 py-6">
                <Link to="/loyalty" className="inline-flex items-center text-gray-500 hover:text-red-600 transition mb-6">
                    <ChevronLeft size={20} /> Trở về trang Loyalty
                </Link>
            </div>

            <div className="container max-w-6xl mx-auto px-4 flex flex-col lg:flex-row gap-8">
                {/* Main Content (Left Side) */}
                <div className="lg:w-2/3">
                    {/* Hero Banner */}
                    <div className="bg-pink-100 rounded-3xl p-8 mb-8 relative overflow-hidden flex items-center">
                        <div className="relative z-10 max-w-md">
                            <span className="bg-red-200 text-red-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">Loyalty Rewards</span>
                            <h1 className="text-4xl font-extrabold text-gray-900 mb-2 leading-tight">
                                Đổi điểm lấy <br /> <span className="text-red-500">Dịch vụ cao cấp</span>
                            </h1>
                            <p className="text-gray-600 mb-6">
                                Tăng cường hiệu quả đăng tin, tiếp cận khách hàng tiềm năng bằng cách đổi điểm tích lũy của bạn.
                            </p>
                            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                                <Award className="text-yellow-500" size={20} fill="currentColor" />
                                <span className="font-bold text-gray-900">{balance.toLocaleString()} Points</span>
                            </div>
                        </div>
                        {/* 3D Illustration Placeholder */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-teal-200 rounded-full blur-3xl opacity-50"></div>
                        <div className="absolute right-10 top-10 w-48 h-48 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transform rotate-12">
                            <img src="/placeholder-3d-character.png" alt="" className="w-32 h-32 object-contain opacity-0" /> {/* Replace with actual image asset if avail */}
                            <Gift size={80} className="text-teal-600" />
                        </div>
                        <div className="absolute bottom-10 right-48 bg-white p-2 rounded-xl shadow-md rotate-[-10deg]">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                        </div>
                    </div>

                    {/* Main Content (Left Side) - Direct Rewards Grid (No Tabs) */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Các gói quy đổi phổ biến</h2>
                            <p className="text-gray-400 text-xs">Điểm hết hạn vào cuối chu kỳ thanh toán.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <RewardCardBig
                                item={{
                                    key: 'ITEM_POST_PUSH',
                                    title: "Đẩy Tin (1 lần)",
                                    subtitle: "Đẩy tin lên đầu trang",
                                    desc: "Tin của bạn sẽ được đẩy lên đầu trang danh sách tìm kiếm.",
                                    points: 50,
                                    icon: TrendingUp,
                                    color: "text-cyan-500",
                                    tag: "HOT"
                                }}
                                onRedeem={handleRedeemClick}
                                canRedeem={balance >= 50}
                            />

                            <RewardCardBig
                                item={{
                                    key: 'LEAD_CREDIT',
                                    title: "Xem 1 Lead",
                                    subtitle: "Mở khóa SĐT khách",
                                    desc: "Mở khóa số điện thoại của khách hàng quan tâm đến tin đăng.",
                                    points: 50,
                                    icon: Users,
                                    color: "text-green-500"
                                }}
                                onRedeem={handleRedeemClick}
                                canRedeem={balance >= 50}
                            />

                            <RewardCardBig
                                item={{
                                    key: 'ITEM_VIP_BRONZE_1DAY',
                                    title: "VIP Bronze (1 Ngày)",
                                    subtitle: "Up VIP Bronze cho 1 tin",
                                    desc: "Nâng cấp tin lên VIP Bronze trong 24h, hiển thị nổi bật hơn.",
                                    points: 500,
                                    icon: Award,
                                    color: "text-amber-700"
                                }}
                                onRedeem={handleRedeemClick}
                                canRedeem={balance >= 500}
                            />

                            <RewardCardBig
                                item={{
                                    key: 'ITEM_VIP_SILVER_3DAY',
                                    title: "VIP Silver (3 Ngày)",
                                    subtitle: "Up VIP Silver cho 1 tin",
                                    desc: "Nâng cấp tin lên VIP Silver trong 3 ngày, tiếp cận nhiều khách hàng hơn.",
                                    points: 1000,
                                    icon: Award,
                                    color: "text-gray-500",
                                    tag: "PHỔ BIẾN"
                                }}
                                onRedeem={handleRedeemClick}
                                canRedeem={balance >= 1000}
                            />

                            <RewardCardBig
                                item={{
                                    key: 'ITEM_VIP_GOLD_7DAY',
                                    title: "VIP Gold (7 Ngày)",
                                    subtitle: "Up VIP Gold cho 1 tin",
                                    desc: "Nâng cấp tin lên VIP Gold trong 7 ngày, hiệu quả cao nhất.",
                                    points: 2000,
                                    icon: Award,
                                    color: "text-yellow-500"
                                }}
                                onRedeem={handleRedeemClick}
                                canRedeem={balance >= 2000}
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar (Right Side) */}
                <div className="lg:w-1/3 space-y-6">
                    {/* Balance Card */}
                    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">SỐ DƯ CỦA BẠN</p>
                            <h2 className="text-4xl font-extrabold mb-6">{balance.toLocaleString()} <span className="text-lg font-normal text-slate-400">Points</span></h2>



                            <button
                                onClick={() => setShowEarnInfo(true)}
                                className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-gray-100 transition"
                            >
                                Làm sao để kiếm thêm?
                            </button>
                        </div>
                    </div>



                    {/* Terms Card */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Điều khoản & Điều kiện
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex gap-3 text-sm text-gray-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0"></div>
                                Việc đổi điểm là cuối cùng và không thể hoàn lại sau khi xác nhận.
                            </li>
                            <li className="flex gap-3 text-sm text-gray-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0"></div>
                                Quyền lợi VIP được kích hoạt ngay lập tức sau khi đổi thành công.
                            </li>
                            <li className="flex gap-3 text-sm text-gray-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0"></div>
                                Lượt đăng tin có thời hạn sử dụng 30 ngày kể từ ngày đổi.
                            </li>
                        </ul>

                    </div>

                    {/* Support Card */}
                    <div className="bg-blue-50/50 rounded-3xl p-6 text-center border border-blue-100">
                        <p className="font-bold text-blue-900 mb-1">Cần hỗ trợ về điểm?</p>
                        <p className="text-blue-600/70 text-xs mb-4">Đội ngũ hỗ trợ của chúng tôi hoạt động 24/7</p>
                        <button className="text-rose-500 font-bold text-sm hover:underline">Liên hệ hỗ trợ</button>
                    </div>
                </div>
            </div>

            {/* Redeem Modal */}
            <RedeemModal
                isOpen={!!selectedReward}
                onClose={() => setSelectedReward(null)}
                onConfirm={handleConfirmRedeem}
                item={selectedReward}
                isProcessing={redeemMutation.isPending}
            />

            {/* Earn Points Modal */}
            <EarnPointsModal
                isOpen={showEarnInfo}
                onClose={() => setShowEarnInfo(false)}
            />
        </div>
    );
};

// ... RewardCardBig ...



const RewardCardBig = ({ item, onRedeem, canRedeem }: any) => {
    const Icon = item.icon;
    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition cursor-pointer flex flex-col h-full relative group">
            {item.tag && (
                <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] font-extrabold px-2 py-1 rounded-md tracking-wide">
                    {item.tag}
                </span>
            )}

            <div className="mb-4">
                <div className={`w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4 ${item.color} bg-opacity-10`}>
                    <Icon size={24} className={item.color} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{item.title}</h3>
                <p className="text-gray-400 text-sm mt-1">{item.subtitle}</p>
            </div>

            <div className="mt-auto pt-4 border-t border-dashed border-gray-100">
                <p className="font-extrabold text-gray-900 mb-3">{item.points} <span className="font-normal text-xs text-gray-400">POINTS</span></p>
                <button
                    onClick={() => onRedeem(item)}
                    disabled={!canRedeem}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition
                        ${canRedeem
                            ? 'bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-transparent'}`}
                >
                    {canRedeem ? 'Đổi ngay' : 'Không đủ điểm'}
                </button>
            </div>
        </div>
    );
}


export default RedeemPage;


