import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import { reportsAPI } from '../../services/api';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
}

const REASONS = [
    { value: 'SCAM', label: 'Lừa đảo', sub: 'Tài khoản giả mạo hoặc hành vi lừa đảo' },
    { value: 'WRONG_INFO', label: 'Sai thông tin', sub: 'Thông tin không khớp với thực tế' },
    { value: 'DUPLICATE', label: 'Tin trùng lặp', sub: 'Bất động sản này được đăng nhiều lần' },
    { value: 'SPAM', label: 'Nội dung không phù hợp', sub: 'Nội dung vi phạm quy tắc cộng đồng' },
    { value: 'OTHER', label: 'Khác', sub: 'Lý do khác không có trong danh sách' },
];

const ReportModal = ({ isOpen, onClose, postId }: ReportModalProps) => {
    const { success: toastSuccess, error: toastError } = useToast();
    const [reason, setReason] = useState<string>('');
    const [description, setDescription] = useState('');

    const mutation = useMutation({
        mutationFn: (data: { reason: string; description: string }) => reportsAPI.create(postId, data),
        onSuccess: () => {
            toastSuccess('Báo cáo thành công! Cảm ơn đóng góp của bạn.');
            setReason('');
            setDescription('');
            onClose();
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Gửi báo cáo thất bại');
        }
    });

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!reason) return;
        mutation.mutate({ reason, description });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-gray-900 text-lg">Báo cáo tin đăng</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Lý do báo cáo</label>
                            <div className="space-y-2">
                                {REASONS.map((r) => (
                                    <label key={r.value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-200 hover:bg-blue-50 transition-all">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${reason === r.value ? 'border-blue-600' : 'border-gray-300'}`}>
                                            {reason === r.value && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                                        </div>
                                        <div>
                                            <span className="block text-sm font-medium text-gray-900">{r.label}</span>
                                            {r.sub && <span className="block text-xs text-gray-500 mt-0.5">{r.sub}</span>}
                                        </div>
                                        <input
                                            type="radio"
                                            name="reason"
                                            value={r.value}
                                            checked={reason === r.value}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="hidden"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Chi tiết thêm (tùy chọn)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
                                placeholder="Mô tả chi tiết vấn đề..."
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={!reason || mutation.isPending}
                                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-red-200 flex items-center justify-center gap-2"
                            >
                                {mutation.isPending ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Đang gửi...</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle size={20} />
                                        <span>Gửi báo cáo</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-3 mt-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                Hủy bỏ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
