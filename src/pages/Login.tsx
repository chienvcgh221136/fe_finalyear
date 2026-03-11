import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LocalizedLink from '../components/common/LocalizedLink';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { useToast } from '../context/ToastContext';
import ForgotPasswordModal from '../components/modals/ForgotPasswordModal';

const Login = () => {
    const { t } = useTranslation();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const navigate = useNavigate();
    const { login, googleLogin } = useAuth();
    const { success, error } = useToast();

    const handleGoogleLoginSuccess = async (credentialResponse: any) => {
        try {
            if (credentialResponse.credential) {
                const result = await googleLogin(credentialResponse.credential);
                if (result.success) {
                    success(t('auth.login_google_success'));
                    setTimeout(() => {
                        navigate('/');
                    }, 1000);
                } else {
                    error(result.error || t('auth.login_google_error'));
                }
            }
        } catch (err) {
            error(t('auth.login_google_error'));
        }
    };

    const onSubmit = async (data: any) => {
        try {
            const result = await login(data.email, data.password);
            if (result.success) {
                success(t('auth.login_success'));
                setTimeout(() => {
                    navigate('/');
                }, 1000);
            } else {
                error(result.error || t('auth.login_error'));
            }
        } catch (err) {
            error(t('auth.login_error'));
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">{t('auth.login_title')}</h2>
                    <p className="text-gray-500 mt-2">{t('auth.login_subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1">
                        <label className="block text-sm font-bold text-gray-700">{t('auth.email')}</label>
                        <input
                            type="email"
                            placeholder={t('auth.email_placeholder')}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            {...register('email', { required: t('auth.email_required') })}
                        />
                        {errors.email && <span className="text-sm text-red-500">{errors.email.message as string}</span>}
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-bold text-gray-700">{t('auth.password')}</label>
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(true)}
                                className="text-sm text-blue-600 font-semibold hover:text-blue-700 bg-transparent"
                            >
                                {t('auth.forgot_password')}
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder={t('auth.password_placeholder')}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-12"
                                {...register('password', { required: t('auth.password_required') })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.password && <span className="text-sm text-red-500">{errors.password.message as string}</span>}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors shadow-sm mt-2"
                    >
                        {t('auth.btn_login')}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500 font-medium">{t('auth.or')}</span>
                    </div>
                </div>

                <div className="flex justify-center w-full">
                    <GoogleLogin
                        onSuccess={handleGoogleLoginSuccess}
                        onError={() => error(t('auth.login_google_error'))}
                        theme="outline"
                        size="large"
                        width="100%"
                        text="continue_with"
                        shape="rectangular"
                    />
                </div>

                <div className="text-center mt-6">
                    <p className="text-gray-600">
                        {t('auth.no_account')} <LocalizedLink to="/register" className="text-blue-600 font-bold hover:text-blue-700 ml-1">{t('auth.btn_register_now')}</LocalizedLink>
                    </p>
                </div>
            </div>

            <ForgotPasswordModal
                isOpen={showForgotModal}
                onClose={() => setShowForgotModal(false)}
            />
        </div>
    );
};


export default Login;
