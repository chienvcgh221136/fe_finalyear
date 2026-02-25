import React from 'react';
import { X, ShieldAlert, Clock, Coins, Info, CheckCircle2 } from 'lucide-react';

interface PointTermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PointTermsModal: React.FC<PointTermsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                <ShieldAlert size={28} className="text-yellow-300" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight">Điều khoản Điểm thưởng</h2>
                        </div>
                        <p className="text-blue-100/80 text-sm font-medium">Quy định và cách thức hoạt động của hệ thống điểm EstateHub</p>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md z-20"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-10">
                        {/* Section 1: Definition */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Info size={20} className="text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">1. Điểm thưởng là gì?</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed pl-13">
                                Điểm thưởng là đơn vị khuyến khích dành cho cộng đồng EstateHub. Bạn có thể sử dụng điểm để đổi các gói VIP, lượt đẩy tin, lượt xem số điện thoại và các đặc quyền khác trên hệ thống.
                                <span className="block mt-2 font-bold text-blue-600">Lưu ý: Điểm thưởng không có giá trị quy đổi thành tiền mặt.</span>
                            </p>
                        </section>

                        {/* Section 2: Earning Rules */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <Coins size={20} className="text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">2. Cách tích lũy điểm</h3>
                            </div>
                            <div className="space-y-3 pl-13">
                                <TermItem title="Nạp tiền / Mua gói VIP" content="Mỗi 1.000đ thanh toán nhận ngay 1 điểm thưởng." />
                                <TermItem title="Nạp tiền lần đầu" content="Ưu đãi tặng thêm 200 điểm cho giao dịch đầu tiên." />
                                <TermItem title="Hoạt động hàng ngày" content="Đăng nhập nhận 10đ, Đăng tin thành công nhận 50đ." />
                                <TermItem title="Sự kiện đặc biệt" content="Nhận điểm từ các chương trình khuyến mãi hoặc quà tặng từ Admin." />
                            </div>
                        </section>

                        {/* Section 3: Expiry Rules */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-amber-50 rounded-lg">
                                    <Clock size={20} className="text-amber-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">3. Thời hạn sử dụng</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-13">
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <h4 className="font-bold text-amber-900 mb-1">Hạn Anniversary</h4>
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        Áp dụng cho điểm từ Nạp tiền/VIP. Hết hạn vào đúng Ngày kỷ niệm của tài khoản hàng năm.
                                    </p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <h4 className="font-bold text-emerald-900 mb-1">Hạn Vĩnh viễn</h4>
                                    <p className="text-xs text-emerald-700 leading-relaxed">
                                        Áp dụng cho điểm từ nhiệm vụ (đăng nhập, đăng tin). Không bao giờ hết hạn.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 4: Violation Policy */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-50 rounded-lg">
                                    <ShieldAlert size={20} className="text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">4. Quy định vi phạm</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed mb-4 pl-13">
                                Mọi hành vi gian lận hoặc vi phạm quy định cộng đồng sẽ bị xử lý nghiêm khắc thông qua việc trừ điểm thưởng theo 5 cấp độ:
                            </p>
                            <div className="space-y-2 pl-13">
                                <TermList index="Cấp 1" content="Nhắc nhở vi phạm (Trừ 0 điểm)." />
                                <TermList index="Cấp 2" content="Cảnh cáo lần 2 (Trừ 15% tổng điểm)." />
                                <TermList index="Cấp 3" content="Cảnh cáo lần 3 (Trừ 30% tổng điểm)." />
                                <TermList index="Cấp 4" content="Cảnh cáo lần 4 (Trừ 50% tổng điểm)." />
                                <TermList index="Cấp 5" content="Vi phạm nghiêm trọng (Trừ 100% & Khóa tài khoản)." />
                            </div>
                        </section>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    >
                        Tôi đã hiểu các điều khoản
                    </button>
                </div>
            </div>
        </div>
    );
};

const TermItem = ({ title, content }: { title: string, content: string }) => (
    <div className="flex gap-3">
        <CheckCircle2 size={16} className="text-blue-500 mt-1 shrink-0" />
        <div>
            <h4 className="text-sm font-bold text-gray-800">{title}</h4>
            <p className="text-sm text-gray-500">{content}</p>
        </div>
    </div>
);

const TermList = ({ index, content }: { index: string, content: string }) => (
    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
        <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-1 rounded-md uppercase shrink-0">{index}</span>
        <span className="text-sm text-gray-700 font-medium">{content}</span>
    </div>
);

export default PointTermsModal;
