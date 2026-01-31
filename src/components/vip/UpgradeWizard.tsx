import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vipAPI } from '../../services/api';
import type { UpgradeInfo, UpgradeOption } from '../../vipTypes';
import { Check, Crown, ArrowRight, Loader, X, AlertCircle } from 'lucide-react';

interface UpgradeWizardProps {
    onClose: () => void;
    onSuccess: () => void;
}

const UpgradeWizard: React.FC<UpgradeWizardProps> = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select, 2: Summary, 3: Success
    const [selectedPackage, setSelectedPackage] = useState<UpgradeOption | null>(null);
    const queryClient = useQueryClient();

    const { data: upgradeInfoData, isLoading, error } = useQuery({
        queryKey: ['vipUpgradeInfo'],
        queryFn: async () => {
            const res = await vipAPI.getUpgradeInfo();
            return res.data.data as UpgradeInfo;
        },
        retry: false
    });

    const upgradeMutation = useMutation({
        mutationFn: (packageId: string) => vipAPI.upgrade(packageId),
        onSuccess: (res) => {
            setStep(3);
            queryClient.invalidateQueries({ queryKey: ['vip', 'me'] });
            queryClient.invalidateQueries({ queryKey: ['userStats'] });
            setTimeout(() => {
                onSuccess();
            }, 3000); // Close after 3s or let user close
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || "Lỗi nâng cấp.");
        }
    });

    const handleSelect = (pkg: UpgradeOption) => {
        setSelectedPackage(pkg);
        setStep(2);
    };

    const handleConfirm = () => {
        if (!selectedPackage) return;
        if (!window.confirm("Xác nhận nâng cấp? Số tiền sẽ được trừ trực tiếp vào ví.")) return;
        upgradeMutation.mutate(selectedPackage.packageId);
    };


    if (isLoading) return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
            <Loader className="animate-spin text-blue-600 mb-4" size={40} />
            <p className="text-gray-500">Đang tính toán chi phí nâng cấp...</p>
        </div>
    );

    if (error || !upgradeInfoData) return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
            <AlertCircle className="text-red-500 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Không thể nâng cấp</h3>
            <p className="text-gray-500 mb-6">{(error as any)?.response?.data?.message || "Đã có lỗi xảy ra hoặc bạn không đủ điều kiện nâng cấp."}</p>
            <button onClick={onClose} className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition font-medium">Đóng</button>
        </div>
    );

    const { currentPackage, upgradeOptions } = upgradeInfoData;

    return (
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Crown className="text-yellow-400 fill-current" /> Nâng cấp VIP
                    </h2>
                    <p className="opacity-90 text-sm mt-1">Chỉ trả phần chênh lệch • Giữ nguyên hạn sử dụng • Hiệu lực tức thì</p>
                </div>
                <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
                {step === 1 && (
                    <div className="space-y-6">
                        {/* Current Package */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-between items-center opacity-70">
                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gói hiện tại</span>
                                <h3 className="text-xl font-bold text-gray-900">{currentPackage.name}</h3>
                                <p className="text-sm text-gray-500">Còn {Number(currentPackage.remainingDays).toFixed(1)} ngày</p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm text-gray-500">Giá trị còn lại</span>
                                <p className="font-bold text-gray-900">{currentPackage.residualValue.toLocaleString()} đ</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px bg-gray-200 flex-1"></div>
                            <span className="text-sm text-gray-400 font-medium">Chọn gói nâng cấp</span>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>

                        {/* Options */}
                        <div className="grid gap-4">
                            {upgradeOptions.map(pkg => (
                                <div key={pkg.packageId} className="border border-blue-100 rounded-xl p-5 hover:border-blue-500 hover:shadow-md transition cursor-pointer group bg-white relative overflow-hidden"
                                    onClick={() => handleSelect(pkg)}>
                                    <div className="flex justify-between items-center relative z-10">
                                        <div>
                                            <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                                                {pkg.name}
                                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">New</span>
                                            </h3>
                                            <ul className="mt-2 space-y-1">
                                                <li className="text-sm text-gray-600 flex items-center gap-2"><Check size={14} className="text-green-500" /> Priority Score: <strong>+{pkg.priorityScore}</strong></li>
                                                <li className="text-sm text-gray-600 flex items-center gap-2"><Check size={14} className="text-green-500" /> Ưu đãi cao cấp hơn</li>
                                            </ul>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-400 line-through">{pkg.price.toLocaleString()} đ</div>
                                            <div className="text-2xl font-bold text-blue-600">{pkg.upgradeCost.toLocaleString()} đ</div>
                                            <p className="text-xs text-blue-500 font-medium mt-1 group-hover:underline">Bấm để chọn</p>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                                </div>
                            ))}

                            {upgradeOptions.length === 0 && (
                                <div className="text-center py-8 text-gray-500 italic">
                                    Hiện tại chưa có gói cao cấp hơn để nâng cấp.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && selectedPackage && (
                    <div className="max-w-md mx-auto">
                        <h3 className="text-xl font-bold text-center mb-6">Xác nhận thanh toán</h3>

                        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Gói mới ({selectedPackage.name})</span>
                                <span className="font-bold">{selectedPackage.price.toLocaleString()} đ</span>
                            </div>
                            <div className="flex justify-between mb-4 text-green-600">
                                <span className="flex items-center gap-1"><AlertCircle size={14} /> Trừ giá trị còn lại (Basic)</span>
                                <span className="font-bold">-{selectedPackage.residualValue.toLocaleString()} đ</span>
                            </div>
                            <div className="border-t border-gray-200 my-4"></div>
                            <div className="flex justify-between items-end">
                                <span className="text-lg font-bold text-gray-900">Tổng thanh toán</span>
                                <span className="text-3xl font-bold text-blue-600">{selectedPackage.upgradeCost.toLocaleString()} đ</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleConfirm}
                                disabled={upgradeMutation.isPending}
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                            >
                                {upgradeMutation.isPending ? <Loader className="animate-spin" /> : "Thanh toán & Nâng cấp ngay"}
                            </button>
                            <button
                                onClick={() => setStep(1)}
                                disabled={upgradeMutation.isPending}
                                className="w-full py-3 text-gray-500 font-medium hover:bg-gray-100 rounded-xl transition"
                            >
                                Quay lại
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                            <Crown size={40} className="fill-current" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Nâng cấp thành công!</h2>
                        <p className="text-gray-500 max-w-xs mx-auto mb-8">
                            Tài khoản của bạn đã được nâng cấp lên <strong>{selectedPackage?.name}</strong>. Quyền lợi mới đã được áp dụng ngay lập tức!
                        </p>
                        <button onClick={onSuccess} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition">
                            Tuyệt vời!
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpgradeWizard;
