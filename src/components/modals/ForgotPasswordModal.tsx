import React, { useState, useEffect } from 'react';
import { Mail, Phone, Lock, ShieldCheck, ArrowLeft, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PasswordStrength, { calculatePasswordStrength } from '../ui/PasswordStrength';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'EMAIL' | 'PHONE' | 'OTP' | 'RESET';

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
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
            error(err.response?.data?.message || 'Email không hợp lệ');
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
                success('Mã OTP đã được gửi');
                setStep('OTP');
                setTimer(60);
            }
        } catch (err: any) {
            error(err.response?.data?.message || 'Số điện thoại không đúng');
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
        if (otpCode.length < 6) return error('Vui lòng nhập đủ 6 số');

        setIsLoading(true);
        try {
            const res = await authService.forgotPassword.verifyOTP(email, otpCode);
            if (res.data.success) {
                setStep('RESET');
            }
        } catch (err: any) {
            error(err.response?.data?.message || 'Mã OTP không đúng');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        const score = calculatePasswordStrength(newPassword);
        if (score < 70) {
            error('Mật khẩu của bạn quá yếu. Vui lòng đạt ít nhất 70% mức độ an toàn.');
            return;
        }

        if (newPassword !== confirmPassword) return error('Mật khẩu không khớp');
        if (newPassword.length < 8) return error('Mật khẩu phải có ít nhất 8 ký tự');

        setIsLoading(true);
        try {
            const res = await authService.forgotPassword.reset({
                email,
                otp: otp.join(''),
                newPassword
            });
            if (res.data.success) {
                success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
                onClose();
                resetModal();
            }
        } catch (err: any) {
            error(err.response?.data?.message || 'Có lỗi xảy ra');
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
                            <h2 className="text-2xl font-bold text-white">Quên mật khẩu?</h2>
                            <p className="text-gray-400 mt-2">Nhập email của bạn để bắt đầu khôi phục mật khẩu.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider ml-1">Email</label>
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
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Tiếp tục'}
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
                            <h2 className="text-2xl font-bold text-white">Xác minh số điện thoại</h2>
                            <p className="text-gray-400 mt-2">Số điện thoại phải khớp với email <span className="text-blue-400">{email}</span></p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider ml-1">Số điện thoại</label>
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
                                Quay lại
                            </button>
                            <button
                                disabled={isLoading}
                                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Gửi mã OTP'}
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
                            <h2 className="text-2xl font-bold text-white">Nhập mã OTP</h2>
                            <p className="text-gray-400 mt-2">Mã 6 số đã được gửi đến email <span className="text-blue-400 font-bold">{email.replace(/(.{2})(.*)(@.*)/, "$1***$3")}</span></p>
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
                                <p className="text-gray-500 text-sm">Gửi lại mã sau ({timer}s)</p>
                            ) : (
                                <button type="button" onClick={handleSendOTP} className="text-blue-400 text-sm font-bold hover:underline">
                                    Gửi lại mã ngay
                                </button>
                            )}
                        </div>
                        <button
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Xác nhận'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('PHONE')}
                            className="w-full text-gray-400 text-sm flex items-center justify-center gap-2 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={16} /> Thay đổi thông tin
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
                            <h2 className="text-2xl font-bold text-white">Đặt lại mật khẩu</h2>
                            <p className="text-gray-400 mt-2">Vui lòng nhập mật khẩu mới của bạn.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider ml-1">Mật khẩu mới</label>
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
                            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider ml-1">Xác nhận mật khẩu</label>
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
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Hoàn tất'}
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
                        Quay lại <button onClick={onClose} className="text-blue-500 font-bold hover:underline">Đăng nhập</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordModal;
