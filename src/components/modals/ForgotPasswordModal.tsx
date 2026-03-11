import React, { useState, useEffect } from 'react';
import { Mail, Phone, Lock, ShieldCheck, ArrowLeft, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PasswordStrength, { calculatePasswordStrength } from '../ui/PasswordStrength';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'EMAIL' | 'PHONE' | 'OTP' | 'RESET';

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState<Step>('EMAIL');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(60);
    const { success, error } = useToast();

    useEffect(() => {
        let interval: any;
        if (step === 'OTP' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    if (!isOpen) return null;

    const handleCheckEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await authService.forgotPassword.checkEmail(email);
            if (res.data.success) {
                setStep('PHONE');
            }
        } catch (err: any) {
            error(err.response?.data?.message || t('auth.email_invalid'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await authService.forgotPassword.sendOTP(email, phone);
            if (res.data.success) {
                success(t('auth.otp_sent'));
                setStep('OTP');
                setTimer(60);
            }
        } catch (err: any) {
            error(err.response?.data?.message || t('auth.phone_required'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpCode = otp.join('');
        if (otpCode.length < 6) return error(t('auth.otp_required'));

        setIsLoading(true);
        try {
            const res = await authService.forgotPassword.verifyOTP(email, otpCode);
            if (res.data.success) {
                setStep('RESET');
            }
        } catch (err: any) {
            error(err.response?.data?.message || t('auth.invalid_otp'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        const score = calculatePasswordStrength(newPassword);
        if (score < 70) {
            error(t('auth.password_weak'));
            return;
        }

        if (newPassword !== confirmPassword) return error(t('auth.password_mismatch'));
        if (newPassword.length < 8) return error(t('auth.password_min_length'));

        setIsLoading(true);
        try {
            const res = await authService.forgotPassword.reset({
                email,
                otp: otp.join(''),
                newPassword
            });
            if (res.data.success) {
                success(t('auth.reset_success_login'));
                onClose();
                resetModal();
            }
        } catch (err: any) {
            error(err.response?.data?.message || t('auth.error_occurred'));
        } finally {
            setIsLoading(false);
        }
    };

    const resetModal = () => {
        setStep('EMAIL');
        setEmail('');
        setPhone('');
        setOtp(['', '', '', '', '', '']);
        setNewPassword('');
        setConfirmPassword('');
    };

    const renderStep = () => {
        switch (step) {
            case 'EMAIL':
                return (
                    <form onSubmit={handleCheckEmail} className="space-y-6">
                        <div className="text-center mb-8">
                            <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                                <Mail className="text-blue-400" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">{t('auth.forgot_password_title')}</h2>
                            <p className="text-gray-400 mt-2">{t('auth.forgot_password_desc')}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider ml-1">{t('auth.email')}</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@gmail.com"
                                    className="w-full bg-[#1A1D21] border border-gray-700/50 rounded-xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                                />
                            </div>
                        </div>
                        <button
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : t('auth.continue')}
                        </button>
                    </form>
                );
            case 'PHONE':
                return (
                    <form onSubmit={handleSendOTP} className="space-y-6">
                        <div className="text-center mb-8">
                            <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                                <Phone className="text-blue-400" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">{t('auth.verify_phone_title')}</h2>
                            <p className="text-gray-400 mt-2">{t('auth.verify_phone_desc', { email })}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider ml-1">{t('auth.phone')}</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold border-r border-gray-700 pr-3">VN</span>
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="09x xxx xxxx"
                                    className="w-full bg-[#1A1D21] border border-gray-700/50 rounded-xl py-4 pl-16 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setStep('EMAIL')}
                                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-4 rounded-xl transition-all border border-gray-700/50"
                            >
                                {t('common.back')}
                            </button>
                            <button
                                disabled={isLoading}
                                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : t('auth.send_otp')}
                            </button>
                        </div>
                    </form>
                );
            case 'OTP':
                return (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <div className="text-center mb-8">
                            <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                                <ShieldCheck className="text-blue-400" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">{t('auth.enter_otp_title')}</h2>
                            <p className="text-gray-400 mt-2">{t('auth.enter_otp_desc', { email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3") })}</p>
                        </div>
                        <div className="flex justify-center gap-3">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    id={`otp-${i}`}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    className="w-12 h-14 bg-[#1A1D21] border border-gray-700/50 rounded-xl text-center text-xl font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            ))}
                        </div>
                        <div className="text-center">
                            {timer > 0 ? (
                                <p className="text-gray-500 text-sm">{t('auth.resend_otp_after', { timer })}</p>
                            ) : (
                                <button type="button" onClick={handleSendOTP} className="text-blue-400 text-sm font-bold hover:underline">
                                    {t('auth.resend_otp_now')}
                                </button>
                            )}
                        </div>
                        <button
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : t('common.confirm')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('PHONE')}
                            className="w-full text-gray-400 text-sm flex items-center justify-center gap-2 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={16} /> {t('auth.change_info')}
                        </button>
                    </form>
                );
            case 'RESET':
                return (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div className="text-center mb-8">
                            <div className="bg-green-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                                <Lock className="text-green-400" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">{t('auth.reset_password_title')}</h2>
                            <p className="text-gray-400 mt-2">{t('auth.reset_password_desc')}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider ml-1">{t('auth.new_password')}</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="********"
                                    className="w-full bg-[#1A1D21] border border-gray-700/50 rounded-xl py-4 pl-12 pr-12 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <PasswordStrength password={newPassword} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider ml-1">{t('auth.confirm_password')}</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="********"
                                    className="w-full bg-[#1A1D21] border border-gray-700/50 rounded-xl py-4 pl-12 pr-12 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <button
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-4"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : t('auth.finish')}
                        </button>
                    </form>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className="bg-[#0F1115] w-full max-w-md relative z-10 p-8 rounded-[2rem] border border-gray-800 shadow-2xl animate-in fade-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors bg-gray-800/50 p-2 rounded-full"
                >
                    <X size={18} />
                </button>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 mb-10">
                    {[1, 2, '✓'].map((s, i) => {
                        const currentIdx = ['EMAIL', 'PHONE', 'OTP', 'RESET'].indexOf(step);
                        const isActive = i <= (currentIdx > 2 ? 2 : currentIdx);
                        return (
                            <React.Fragment key={i}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${isActive ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-gray-800 text-gray-600 border border-gray-700'
                                    }`}>
                                    {s}
                                </div>
                                {i < 2 && (
                                    <div className={`w-12 h-[2px] rounded-full transition-all duration-500 ${i < currentIdx ? 'bg-blue-600' : 'bg-gray-800'
                                        }`}></div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {renderStep()}

                <div className="mt-8 pt-6 border-t border-gray-800/50 text-center">
                    <p className="text-gray-500 text-sm">
                        {t('common.back')} <button onClick={onClose} className="text-blue-500 font-bold hover:underline">{t('auth.btn_login')}</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordModal;

