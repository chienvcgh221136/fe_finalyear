import React from 'react';
import { X, Award, CheckCircle } from 'lucide-react';

interface RedeemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    item: {
        key: string;
        title: string;
        desc: string;
        points: number;
        icon: any;
        color: string;
    } | null;
    isProcessing: boolean;
}

const RedeemModal: React.FC<RedeemModalProps> = ({ isOpen, onClose, onConfirm, item, isProcessing }) => {
    if (!isOpen || !item) return null;

    const Icon = item.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition z-10"
                >
                    <X size={20} />
                </button>

                {/* Header Image/Icon Area */}
                <div className={`h-32 ${item.color.replace('text-', 'bg-').replace('50', '100')} flex items-center justify-center relative`}>
                    <div className="absolute inset-0 bg-white/20" /> {/* Pattern overlay if needed */}
                    <div className={`w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center ${item.color} relative z-10`}>
                        <Icon size={40} />
                    </div>
                </div>

                <div className="p-8 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Xác nhận đổi quà</h3>
                    <p className="text-gray-500 mb-6">
                        Bạn có chắc chắn muốn sử dụng <span className="font-bold text-gray-900">{item.points} điểm</span> để đổi gói <br />
                        <span className="font-bold text-blue-600 text-lg">"{item.title}"</span> không?
                    </p>

                    <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left border border-gray-100">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="text-green-500 mt-0.5 shrink-0" size={18} />
                            <p className="text-sm text-gray-600">{item.desc || "Quyền lợi đặc biệt"}</p>
                        </div>
                        <div className="flex items-start gap-3 mt-3">
                            <CheckCircle className="text-green-500 mt-0.5 shrink-0" size={18} />
                            <p className="text-sm text-gray-600">Quà tặng sẽ được áp dụng ngay lập tức</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-6 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                            disabled={isProcessing}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-3 px-6 rounded-xl font-bold text-white shadow-lg shadow-red-200 transition flex items-center justify-center gap-2
                                ${isProcessing
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600'}`
                            }
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Đang xử lý...' : 'Xác nhận đổi'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RedeemModal;
