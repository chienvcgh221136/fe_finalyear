import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LocalizedLink from '../components/common/LocalizedLink';
import { authService } from '../services/api';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '../context/ToastContext';

import PasswordStrength, { calculatePasswordStrength } from '../components/ui/PasswordStrength';

const Register = () => {
    const { t } = useTranslation();
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const { success, error } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const password = watch('password', '');

    const onSubmit = async (data: any) => {
        try {
            const score = calculatePasswordStrength(data.password);
            if (score < 70) {
                error(t('auth.password_weak'));
                return;
            }

            if (data.password !== data.confirmPassword) {
                error(t('auth.password_mismatch'));
                return;
            }

            const payload = {
                name: data.name,
                email: data.email,
                phone: data.phone,
                password: data.password
            };

            const response = await authService.register(payload);

            if (response.data.success) {
                success(t('auth.register_success'));
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                error(response.data.message || t('auth.register_error'));
            }
        } catch (err: any) {
            console.error('Registration Error:', err);
            error(err.response?.data?.message || t('auth.register_generic_error'));
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen ml-auto mr-auto">

            <div className="auth-container" style={{ maxWidth: '500px' }}>
                <div className="auth-header">
                    <h2 className="auth-title">{t('auth.register_title')}</h2>
                    <p className="auth-subtitle">{t('auth.register_subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-group">
                        <label className="form-label">{t('auth.full_name')}</label>
                        <input
                            type="text"
                            placeholder={t('auth.name_placeholder')}
                            className="form-input"
                            {...register('name', { required: t('auth.name_required') })}
                        />
                        {errors.name && <span className="text-sm" style={{ color: 'var(--error)' }}>{errors.name.message as string}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('auth.email')}</label>
                        <input
                            type="email"
                            placeholder={t('auth.email_placeholder')}
                            className="form-input"
                            {...register('email', {
                                required: t('auth.email_required'),
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: t('auth.email_invalid')
                                }
                            })}
                        />
                        {errors.email && <span className="text-sm" style={{ color: 'var(--error)' }}>{errors.email.message as string}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('auth.phone')}</label>
                        <input
                            type="tel"
                            placeholder={t('auth.phone_placeholder')}
                            className="form-input"
                            {...register('phone', { required: t('auth.phone_required') })}
                        />
                        {errors.phone && <span className="text-sm" style={{ color: 'var(--error)' }}>{errors.phone.message as string}</span>}
                    </div>

                    <div className="flex gap-4">
                        <div className="form-group flex-grow">
                            <label className="form-label">{t('auth.password')}</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="........"
                                    className="form-input"
                                    {...register('password', { required: t('auth.password_required'), minLength: { value: 6, message: t('auth.password_min_length') } })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="password-toggle"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <PasswordStrength password={password} />
                            {errors.password && <span className="text-sm" style={{ color: 'var(--error)' }}>{errors.password.message as string}</span>}
                        </div>

                        <div className="form-group flex-grow">
                            <label className="form-label">{t('auth.confirm_password')}</label>
                            <div className="password-input-wrapper">
                                <input
                                    type="password"
                                    placeholder="........"
                                    className="form-input"
                                    {...register('confirmPassword', {
                                        required: t('auth.confirm_password_required'),
                                        validate: (val: string) => {
                                            if (watch('password') != val) {
                                                return t('auth.password_mismatch');
                                            }
                                        }
                                    })}
                                />
                            </div>
                            {errors.confirmPassword && <span className="text-sm" style={{ color: 'var(--error)' }}>{errors.confirmPassword.message as string}</span>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        style={{ marginTop: '1rem' }}
                    >
                        {t('auth.btn_register')}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {t('auth.agree_terms')} <LocalizedLink to="#" className="text-primary font-bold">{t('auth.terms')}</LocalizedLink> {t('auth.and')} <LocalizedLink to="#" className="text-primary font-bold">{t('auth.privacy_policy')}</LocalizedLink> {t('auth.of_us')}
                    </p>

                    <div className="text-center text-sm text-gray-600 mt-6">
                        {t('auth.already_have_account')} <LocalizedLink to="/login" className="text-primary font-bold">{t('auth.btn_login_now')}</LocalizedLink>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;