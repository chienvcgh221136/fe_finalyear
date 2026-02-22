import React from 'react';
import { Gift, TrendingUp, Users, Award, Moon, CheckCircle } from 'lucide-react';

interface EarnPointsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EarnPointsModal: React.FC<EarnPointsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-3xl w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-2">Trung tâm Nhiệm vụ</h2>
                        <p className="text-blue-100">Hoàn thành các nhiệm vụ bên dưới để nhận điểm thưởng hấp dẫn.</p>
                    </div>
                    {/* Decorative */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <button onClick={onClose} className="absolute top-6 right-6 text-white/80 hover:text-white transition bg-white/10 p-2 rounded-full backdrop-blur-md">
                        <CheckCircle size={20} className="rotate-45" />
                    </button>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-6">
                        {/* Currently Active Methods */}
                        <div>
                            <h3 className="text-gray-900 font-bold text-lg mb-4 flex items-center gap-2">
                                <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                                Nhiệm vụ khả dụng
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <EarnCard
                                    icon={Gift}
                                    title="Nạp tiền lần đầu"
                                    points="+200"
                                    desc="Tặng ngay 200 điểm thưởng + điểm theo số tiền nạp cho giao dịch đầu tiên"
                                    color="text-indigo-600"
                                    bgColor="bg-indigo-100"
                                    fullWidth
                                />
                                <EarnCard
                                    icon={Award}
                                    title="Điểm danh hàng ngày"
                                    points="+10"
                                    desc="Đăng nhập vào hệ thống mỗi ngày"
                                    color="text-blue-500"
                                    bgColor="bg-blue-50"
                                />
                                <EarnCard
                                    icon={TrendingUp}
                                    title="Đăng tin mới"
                                    points="+50"
                                    desc="Đăng tin bất động sản thành công"
                                    color="text-indigo-500"
                                    bgColor="bg-indigo-50"
                                />
                                <EarnCard
                                    icon={TrendingUp}
                                    title="Nạp tiền / Mua VIP"
                                    points="1:1000"
                                    desc="Nhận 1 điểm cho mỗi 1.000đ thanh toán"
                                    color="text-blue-500"
                                    bgColor="bg-blue-50"
                                />
                            </div>
                        </div>

                        {/* Coming Soon Methods */}
                        <div>
                            <h3 className="text-gray-400 font-bold text-lg mb-4 flex items-center gap-2">
                                <span className="w-2 h-8 bg-gray-300 rounded-full"></span>
                                Sắp ra mắt
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
                                <EarnCard
                                    icon={Users}
                                    title="Giới thiệu bạn bè"
                                    points="+200"
                                    desc="Mời bạn bè đăng ký tài khoản mới"
                                    color="text-purple-500"
                                    bgColor="bg-purple-50"
                                />
                                <EarnCard
                                    icon={Moon}
                                    title="Chia sẻ tin đăng"
                                    points="+5"
                                    desc="Chia sẻ tin lên mạng xã hội"
                                    color="text-pink-500"
                                    bgColor="bg-pink-50"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full mt-8 bg-blue-50 text-blue-700 font-bold py-4 rounded-xl hover:bg-blue-100 transition"
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
};

const EarnCard = ({ icon: Icon, title, points, desc, color, bgColor, fullWidth }: any) => (
    <div className={`flex items-start gap-4 p-4 rounded-2xl border border-gray-100 hover:shadow-md transition ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
        <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ${bgColor} ${color}`}>
            <Icon size={24} />
        </div>
        <div>
            <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-gray-900">{title}</h4>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bgColor} ${color}`}>{points} Points</span>
            </div>
            <p className="text-sm text-gray-500 leading-snug">{desc}</p>
        </div>
    </div>
);

export default EarnPointsModal;
