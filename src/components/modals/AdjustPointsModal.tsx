import React, { useState, useCallback, useMemo } from 'react';
import { X, Check, Lock, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdjustPointsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number, description: string, penaltyLevel?: number) => void;
    user: any;
    isLoading: boolean;
}

const AdjustPointsModal: React.FC<AdjustPointsModalProps> = ({ isOpen, onClose, onConfirm, user, isLoading }) => {
    const { t } = useTranslation();

    const QUICK_REASONS = useMemo(() => {
        const reasons = [
            { label: t('admin.points.adjustment_reasons.profile'), text: "admin.points.adjustment_reasons.profile", amount: '500' },
            { label: t('admin.points.adjustment_reasons.compensation'), text: "admin.points.adjustment_reasons.compensation", amount: '1000' },
            { label: t('admin.points.adjustment_reasons.active_user'), text: "admin.points.adjustment_reasons.active_user", amount: '2000' },
        ];

        if (user?.isProfileRewardGiven) {
            return reasons.filter(r => r.text !== "admin.points.adjustment_reasons.profile");
        }
        return reasons;
    }, [t, user?.isProfileRewardGiven]);

    // 1. State definitions
    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'add' | 'subtract'>('add');
    const [penaltyLevel, setPenaltyLevel] = useState<number | null>(null);

    // Memoize unhandled violations check
    const hasUnhandledViolations = useMemo(() => {
        if (!user) return false;
        return (user.violationCount || 0) > (user.handledViolations || 0);
    }, [user]);

    // 2. Helper function to apply penalty level logic
    const applyPenaltyLevel = useCallback((level: number) => {
        if (!user) return;
        setPenaltyLevel(level);
        let deductAmount = 0;
        let reasonKey = "";
        const currentPoints = user.points || 0;

        switch (level) {
            case 1:
                deductAmount = 0;
                reasonKey = "admin.points.adjustment_reasons.violation_warning";
                break;
            case 2:
                deductAmount = Math.ceil(currentPoints * 0.15);
                reasonKey = "admin.points.adjustment_reasons.violation_deduct_15";
                break;
            case 3:
                deductAmount = Math.ceil(currentPoints * 0.30);
                reasonKey = "admin.points.adjustment_reasons.violation_deduct_30";
                break;
            case 4:
                deductAmount = Math.ceil(currentPoints * 0.50);
                reasonKey = "admin.points.adjustment_reasons.violation_deduct_50";
                break;
            case 5:
                deductAmount = currentPoints;
                reasonKey = "admin.points.adjustment_reasons.violation_ban";
                break;
            default:
                break;
        }

        setAmount(deductAmount.toString());
        setDescription(reasonKey);
    }, [user]);

    // 3. Mode Toggle Logic
    const handleTypeChange = (newType: 'add' | 'subtract') => {
        setType(newType);
        if (newType === 'add') {
            setAmount('');
            setDescription('');
            setPenaltyLevel(null);
        } else if (newType === 'subtract' && hasUnhandledViolations) {
            const count = user.violationCount || 0;
            const autoLevel = Math.max(1, Math.min(count, 5));
            applyPenaltyLevel(autoLevel);
        }
    };

    // Handler for quick reason selection
    const handleQuickReasonClick = (reason: typeof QUICK_REASONS[0]) => {
        setDescription(reason.text);
        if (reason.amount) {
            setAmount(reason.amount);
        }
    };

    if (!isOpen || !user) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseInt(amount);
        if (isNaN(numAmount)) return;

        const finalAmount = type === 'add' ? numAmount : -numAmount;
        const finalDesc = description || `Admin adjusted points: ${type === 'add' ? '+' : '-'}${numAmount}`;
        onConfirm(finalAmount, finalDesc, penaltyLevel || undefined);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-fade-in shadow-2xl shadow-indigo-500/10 border border-white/20">
                {/* Header - Fixed */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0 bg-white/80 backdrop-blur-md z-20">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${type === 'add' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {type === 'add' ? <Sparkles size={22} /> : <Lock size={22} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-900 leading-tight">{t('admin.points.adjust_title')}</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5 opacity-60">Admin Controller</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all active:scale-95">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Wrapper */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    {/* Scrollable Area */}
                    <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-7">
                        {/* User Info Card */}
                        <div className="flex items-center gap-4 bg-gradient-to-br from-gray-50 to-white p-5 rounded-[24px] border border-gray-100 shadow-sm">
                            <img
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`}
                                alt={user.name}
                                className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md"
                            />
                            <div className="flex-1">
                                <div className="font-black text-gray-900 text-lg line-clamp-1">{user.name}</div>
                                <div className="text-sm text-gray-400 font-bold mt-0.5">
                                    {t('admin.points.balance')}: <span className="text-indigo-600 font-black">{(user.points || 0).toLocaleString()}</span> PTS
                                </div>
                                <div className="flex gap-2 mt-2.5">
                                    <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider shadow-sm border
                                        ${hasUnhandledViolations ? 'bg-red-500 text-white border-red-400' : 'bg-gray-100 text-gray-400 border-gray-200'}
                                    `}>
                                        {t('admin.reports.table_bad_post')}: {user.violationCount || 0}
                                    </span>
                                    <span className="text-[9px] px-2.5 py-1 bg-green-500 text-white rounded-lg font-black uppercase tracking-wider shadow-sm border border-green-400">
                                        {t('admin.points.handled')}: {user.handledViolations || 0}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Mode & Details */}
                        <div className="space-y-6">
                            {/* Type Toggle */}
                            <div className="space-y-3">
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{t('admin.points.adjust_title', 'Chế độ điều chỉnh')}</label>
                                <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-100/80 rounded-[20px] border border-gray-200/50">
                                    <button
                                        type="button"
                                        onClick={() => handleTypeChange('add')}
                                        className={`py-3 rounded-[16px] text-xs font-black transition-all duration-300 ${type === 'add'
                                            ? 'bg-white text-green-600 shadow-xl shadow-green-500/10 scale-[1.02] border border-green-100'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        {t('admin.points.mode_add')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTypeChange('subtract')}
                                        disabled={!hasUnhandledViolations}
                                        className={`py-3 rounded-[16px] text-xs font-black transition-all duration-300 ${type === 'subtract'
                                            ? 'bg-white text-red-600 shadow-xl shadow-red-500/10 scale-[1.02] border border-red-100'
                                            : !hasUnhandledViolations
                                                ? 'text-gray-300 cursor-not-allowed opacity-30'
                                                : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        {t('admin.points.mode_subtract')}
                                    </button>
                                </div>
                            </div>

                            {/* Penalty Section (Subtract) */}
                            {type === 'subtract' && hasUnhandledViolations && (
                                <div className="space-y-4 animate-in fade-in zoom-in duration-500 bg-red-50/30 p-4 rounded-[24px] border border-red-100/50">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="block text-[11px] font-black text-red-400 uppercase tracking-[0.2em]">{t('admin.points.penalty_level', 'Cấp độ phạt')}</label>
                                        <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black animate-pulse">AUTO-LEVEL</span>
                                    </div>
                                    <div className="grid grid-cols-5 gap-2.5">
                                        {[1, 2, 3, 4, 5].map((level) => (
                                            <div
                                                key={level}
                                                className={`relative h-11 rounded-[16px] border-2 font-black transition-all flex items-center justify-center text-sm shadow-sm
                                                    ${penaltyLevel === level
                                                        ? 'bg-red-600 text-white border-red-600 ring-4 ring-red-100'
                                                        : 'bg-white text-gray-200 border-gray-100 opacity-40'
                                                    }`}
                                            >
                                                L{level}
                                            </div>
                                        ))}
                                    </div>
                                    {penaltyLevel && (
                                        <div className="p-4 bg-white rounded-2xl border border-red-100 shadow-sm">
                                            <p className="text-[11px] text-red-600 font-black flex items-center gap-2 uppercase italic mb-1">
                                                <span>⚠️ {t('admin.points.penalty_level')}:</span>
                                            </p>
                                            <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                                                {t(`admin.points.adjustment_reasons.violation_desc_${penaltyLevel}`)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Quick Selection (Add) */}
                            {type === 'add' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-3 duration-500 bg-indigo-50/20 p-4 rounded-[24px] border border-indigo-100/50">
                                    <label className="block text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1">{t('admin.points.quick_reason', 'Gợi ý lý do nhanh')}</label>
                                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar flex-nowrap -mx-1 px-1">
                                        {QUICK_REASONS.map((reason) => (
                                            <button
                                                key={reason.label}
                                                type="button"
                                                onClick={() => handleQuickReasonClick(reason)}
                                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black border-2 transition-all active:scale-95 flex flex-col items-center gap-0.5 min-w-[140px] shrink-0
                                                    ${description === reason.text
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                                                        : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200 hover:text-indigo-600 shadow-sm'
                                                    }`}
                                            >
                                                <span className="truncate w-full text-center">{reason.label}</span>
                                                {reason.amount && <span className={`text-[9px] font-black ${description === reason.text ? 'text-indigo-200' : 'text-indigo-400'}`}>+{reason.amount}</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Inputs */}
                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{t('admin.points.amount', 'Số điểm thay đổi')}</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === '-' || e.key === 'e') e.preventDefault();
                                            }}
                                            className="w-full pl-6 pr-16 py-4 bg-gray-50 border-2 border-gray-100 rounded-[20px] focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/50 outline-none transition-all font-black text-xl text-gray-800"
                                            placeholder="0"
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 bg-white px-2 py-1 rounded-lg border border-gray-100">PTS</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{t('admin.common.description')}</label>
                                    <textarea
                                        required
                                        value={description.includes('.') ? t(description) : description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-[20px] focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/50 outline-none transition-all min-h-[120px] text-sm font-bold resize-none leading-relaxed text-gray-700"
                                        placeholder={t('admin.points.desc_placeholder')}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Fixed */}
                    <div className="p-5 border-t border-gray-100 bg-white/80 backdrop-blur-md shrink-0 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 text-gray-400 font-black text-[11px] hover:bg-gray-50 rounded-[20px] transition-all active:scale-95 uppercase tracking-widest border border-transparent hover:border-gray-100"
                        >
                            {t('admin.common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`flex-[2.5] py-4 rounded-[20px] text-white font-black text-[11px] shadow-xl active:scale-95 transition-all disabled:opacity-30 disabled:grayscale uppercase tracking-[0.2em]
                                ${type === 'add' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'}
                            `}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <Check size={18} strokeWidth={4} />
                                    <span>{type === 'add' ? t('admin.points.confirm_add') : t('admin.points.confirm_subtract')}</span>
                                </div>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                    height: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
};

export default AdjustPointsModal;
