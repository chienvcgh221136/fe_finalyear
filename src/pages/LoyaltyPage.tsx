import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pointService } from '../services/pointService';
import { useAuth } from '../context/AuthContext';
import { Gift, TrendingUp, Users, Clock, ChevronRight, Award, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EarnPointsModal from '../components/modals/EarnPointsModal';
import PointTermsModal from '../components/modals/PointTermsModal';
import UseItemModal from '../components/modals/UseItemModal';
import { useToast } from '../context/ToastContext';

const LoyaltyPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { success, error } = useToast();
    const queryClient = useQueryClient();

    const [showTasks, setShowTasks] = React.useState(false);
    const [showTerms, setShowTerms] = React.useState(false);
    const [selectedItem, setSelectedItem] = React.useState<any>(null);

    const { data: pointData, isLoading } = useQuery({
        queryKey: ['myPoints'],
        queryFn: () => pointService.getMyPoints().then(res => res.data)
    });

    const useItemMutation = useMutation({
        mutationFn: pointService.useItem,
        onSuccess: (data) => {
            success(data.message);
            queryClient.invalidateQueries({ queryKey: ['myPoints'] });
            queryClient.invalidateQueries({ queryKey: ['vip', 'me'] }); // Refetch VIP data for VIP Management
            setSelectedItem(null);
        },
        onError: (err: any) => {
            error(err.response?.data?.message || "Sử dụng vật phẩm thất bại");
        }
    });

    const handleItemClick = (key: string, label: string, icon: any, color: string, count: number) => {
        if (count <= 0) return;
        setSelectedItem({ key, label, icon, color, count });
    };

    const handleConfirmUse = (data: { postId: string, quantity: number }) => {
        if (selectedItem && !useItemMutation.isPending) {
            useItemMutation.mutate({
                itemKey: selectedItem.key,
                postId: data.postId,
                quantity: data.quantity
            });
        }
    };

    // Auto-scroll handler
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;

    const { balance, history, inventory = {}, expiringSoon = { total: 0, batches: [] } } = pointData || { balance: 0, history: [], inventory: {}, expiringSoon: { total: 0, batches: [] } };
    const filteredHistory = (history || []).filter((log: any) => log.points > 0 || log.action === 'EXPIRED');

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Compact Header Section */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white pt-6 pb-24 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 animate-pulse text-white">
                    <Award size={200} />
                </div>
                {/* Decorative circles */}
                <div className="absolute top-6 left-10 w-24 h-24 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-6 right-20 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl"></div>

                <div className="container max-w-5xl mx-auto relative z-10">
                    <div className="flex flex-col items-center">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full mb-3 border border-white/20">
                                <Award size={12} className="text-yellow-300" />
                                <p className="text-blue-50 font-medium tracking-wide text-[10px] uppercase">Hội viên EstateHub</p>
                            </div>
                            <h1 className="text-2xl font-bold mb-0.5">Xin chào, {user?.name}!</h1>
                            <p className="text-sm text-blue-100 opacity-70">Cảm ơn bạn đã đồng hành cùng chúng tôi</p>
                        </div>

                        <div className="flex justify-center items-center relative py-2">
                            {/* Smaller Circular Point Display */}
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-300 to-yellow-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative w-40 h-40 rounded-full border-4 border-white/10 flex flex-col items-center justify-center bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md shadow-xl">
                                    <Award size={24} className="mb-1 text-yellow-300 drop-shadow-lg" />
                                    <span className="text-4xl font-black text-white tracking-tight drop-shadow-md">{balance}</span>
                                    <span className="text-[10px] font-bold text-blue-100 mt-1 uppercase tracking-widest opacity-80">Điểm tiêu dùng</span>
                                </div>
                            </div>
                        </div>

                        {/* Tighter Quick Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8 w-full max-w-2xl mx-auto text-white">
                            <div onClick={() => navigate('/loyalty/redeem')} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center cursor-pointer hover:bg-white/20 hover:-translate-y-0.5 transition duration-300">
                                <div className="w-8 h-8 mx-auto mb-2 bg-blue-500/30 rounded-full flex items-center justify-center">
                                    <Gift size={16} className="text-white" />
                                </div>
                                <span className="text-xs font-bold block">Đổi quà</span>
                            </div>

                            <div onClick={() => setShowTasks(true)} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center cursor-pointer hover:bg-white/20 hover:-translate-y-0.5 transition duration-300">
                                <div className="w-8 h-8 mx-auto mb-2 bg-indigo-500/30 rounded-full flex items-center justify-center">
                                    <Award size={16} className="text-white" />
                                </div>
                                <span className="text-xs font-bold block">Nhiệm vụ</span>
                            </div>

                            <div onClick={() => scrollToSection('history-section')} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center cursor-pointer hover:bg-white/20 hover:-translate-y-0.5 transition duration-300">
                                <div className="w-8 h-8 mx-auto mb-2 bg-emerald-500/30 rounded-full flex items-center justify-center">
                                    <Clock size={16} className="text-white" />
                                </div>
                                <span className="text-xs font-bold block">Lịch sử</span>
                            </div>

                            <div onClick={() => setShowTerms(true)} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center cursor-pointer hover:bg-white/20 hover:-translate-y-0.5 transition duration-300">
                                <div className="w-8 h-8 mx-auto mb-2 bg-amber-500/30 rounded-full flex items-center justify-center">
                                    <ShieldCheck size={16} className="text-white" />
                                </div>
                                <span className="text-xs font-bold block">Điều khoản</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container max-w-5xl mx-auto px-4 -mt-20 relative z-20 space-y-10">
                {/* Expiring Points Warning */}
                {expiringSoon.total > 0 && (
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-3xl shadow-md">
                        <div className="flex items-start gap-4">
                            <div className="bg-orange-100 p-2 rounded-full">
                                <Clock size={20} className="text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-orange-900 font-bold mb-1">
                                    {expiringSoon.total.toLocaleString()} điểm sắp hết hạn
                                </h4>
                                <p className="text-orange-700 text-sm leading-relaxed">
                                    Bạn đang có {expiringSoon.total.toLocaleString()} điểm sẽ hết hạn vào {expiringSoon.expiryDay}/{expiringSoon.expiryMonth}{expiringSoon.year ? `/${expiringSoon.year}` : ''} tới đây. Hãy tranh thủ đổi lấy những phần quà hấp dẫn trước khi quá hạn nhé.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Inventory Section (New) */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                            <Gift size={20} className="text-gray-400" /> Kho quà của bạn
                        </h3>
                        <button onClick={() => navigate('/loyalty/redeem')} className="text-sm text-blue-600 font-bold hover:underline">
                            Đổi thêm quà
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InventoryItem
                            icon={TrendingUp}
                            color="bg-cyan-100 text-cyan-600"
                            label="Đẩy tin"
                            count={inventory.postPush || 0}
                            onClick={() => handleItemClick('ITEM_POST_PUSH', 'Đẩy tin', TrendingUp, 'bg-cyan-100 text-cyan-600', inventory.postPush)}
                        />
                        <InventoryItem
                            icon={Users}
                            color="bg-green-100 text-green-600"
                            label="Xem Lead"
                            count={inventory.leadCredit || 0}
                            onClick={() => handleItemClick('LEAD_CREDIT', 'Xem Lead', Users, 'bg-green-100 text-green-600', inventory.leadCredit)}
                        />
                        <InventoryItem
                            icon={Award}
                            color="bg-amber-100 text-amber-700"
                            label="VIP Bronze (1 Ngày)"
                            count={inventory.vipBronze1Day || 0}
                            onClick={() => handleItemClick('ITEM_VIP_BRONZE_1DAY', 'VIP Bronze (1 Ngày)', Award, 'bg-amber-100 text-amber-700', inventory.vipBronze1Day)}
                        />
                        <InventoryItem
                            icon={Award}
                            color="bg-gray-200 text-gray-600"
                            label="VIP Silver (3 Ngày)"
                            count={inventory.vipSilver3Day || 0}
                            onClick={() => handleItemClick('ITEM_VIP_SILVER_3DAY', 'VIP Silver (3 Ngày)', Award, 'bg-gray-200 text-gray-600', inventory.vipSilver3Day)}
                        />
                        <InventoryItem
                            icon={Award}
                            color="bg-yellow-100 text-yellow-600"
                            label="VIP Gold (7 Ngày)"
                            count={inventory.vipGold7Day || 0}
                            onClick={() => handleItemClick('ITEM_VIP_GOLD_7DAY', 'VIP Gold (7 Ngày)', Award, 'bg-yellow-100 text-yellow-600', inventory.vipGold7Day)}
                        />
                    </div>
                </div>

                {/* Redeem Link Section */}
                <div id="redeem-section" className="scroll-mt-24">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition cursor-pointer"
                        onClick={() => navigate('/loyalty/redeem')}
                    >
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Kho quà tặng & Dịch vụ</h2>
                            <p className="text-gray-500">Sử dụng điểm tích lũy để đổi lấy các lượt đăng tin, xem lead và quyền lợi VIP.</p>
                        </div>
                        <button className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition flex items-center gap-2 whitespace-nowrap">
                            Khám phá ngay <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* History Table */}
                <div id="history-section" className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden scroll-mt-24">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                <Clock size={20} className="text-gray-400" /> Lịch sử hoạt động
                            </h3>
                            <p className="text-gray-500 text-sm mt-1">Theo dõi biến động số dư của bạn</p>
                        </div>
                        <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none shadow-sm">
                            <option>Gần đây nhất</option>
                            <option>Tháng này</option>
                            <option>Tháng trước</option>
                        </select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100/50 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-8 py-5">Hoạt động</th>
                                    <th className="px-8 py-5">Thời gian</th>
                                    <th className="px-8 py-5 text-right">Điểm</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredHistory.length > 0 ? filteredHistory.map((log: any) => (
                                    <tr key={log._id} className="hover:bg-gray-50/80 transition duration-150 group">
                                        <td className="px-8 py-5 font-medium text-gray-900 group-hover:text-blue-600 transition">
                                            {formatAction(log.action)}
                                        </td>
                                        <td className="px-8 py-5 text-gray-500">
                                            {new Date(log.createdAt).toLocaleDateString('vi-VN')} <span className="text-gray-300 mx-2">|</span> {new Date(log.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-8 py-5 text-right font-bold text-base flex flex-col items-end">
                                            <div className={`${log.type === 'EARN' ? 'text-green-600' : 'text-orange-500'}`}>
                                                {log.type === 'EARN' ? '+' : '-'}{log.points}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-16 text-center text-gray-400 flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                <Clock size={32} className="text-gray-300" />
                                            </div>
                                            Chưa có lịch sử giao dịch nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <EarnPointsModal isOpen={showTasks} onClose={() => setShowTasks(false)} />
            <PointTermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
            <UseItemModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                onConfirm={handleConfirmUse}
                item={selectedItem}
                isProcessing={useItemMutation.isPending}
            />
        </div>
    );
};

const InventoryItem = ({ icon: Icon, color, label, count, onClick }: any) => (
    <div
        onClick={onClick}
        className={`flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-transparent group transition
            ${count > 0 ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-100 hover:shadow-md' : 'cursor-not-allowed opacity-60'}
        `}
    >
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                <Icon size={20} />
            </div>
            <span className={`font-medium transition ${count > 0 ? 'text-gray-700 group-hover:text-blue-700' : 'text-gray-400'}`}>{label}</span>
        </div>
        <span className={`font-extrabold text-xl ${count > 0 ? 'text-gray-900' : 'text-gray-400'}`}>{count}</span>
    </div>
);

const formatAction = (action: string) => {
    switch (action) {
        case 'POST_CREATED': return 'Đăng tin mới';
        case 'VIP_PURCHASE': return 'Mua/Gia hạn VIP';
        case 'DAILY_LOGIN': return 'Điểm danh hàng ngày';
        case 'REDEEM_LEAD_CREDIT': return 'Đổi lượt xem Lead';
        case 'REDEEM_ITEM_POST_PUSH': return 'Đổi lượt Đẩy Tin';
        case 'REDEEM_ITEM_VIP_BRONZE_1DAY': return 'Đổi VIP Bronze 1 Ngày';
        case 'REDEEM_ITEM_VIP_SILVER_3DAY': return 'Đổi VIP Silver 3 Ngày';
        case 'REDEEM_ITEM_VIP_GOLD_7DAY': return 'Đổi VIP Gold 7 Ngày';
        case 'EXPIRED': return 'Điểm hết hạn';
        case 'ADMIN_ADJUSTMENT': return 'Admin điều chỉnh';
        default: return action;
    }
};

export default LoyaltyPage;
