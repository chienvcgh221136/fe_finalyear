import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Register = () => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const { success, error } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const onSubmit = async (data: any) => {
        try {
            if (data.password !== data.confirmPassword) {
                error('Mật khẩu không khớp');
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
                success('Đăng ký thành công! Đang chuyển hướng đến đăng nhập...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                error(response.data.message || 'Đăng ký thất bại');
            }
        } catch (err: any) {
            console.error('Registration Error:', err);
            error(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen ml-auto mr-auto">

            <div className="auth-container" style={{ maxWidth: '500px' }}>
                <div className="auth-header">
                    <h2 className="auth-title">Tạo tài khoản mới</h2>
                    <p className="auth-subtitle">Tham gia cùng hàng ngàn người mua và thuê nhà ngay hôm nay.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-group">
                        <label className="form-label">Họ và Tên</label>
                        <input
                            type="text"
                            placeholder="Nguyễn Văn A"
                            className="form-input"
                            {...register('name', { required: 'Vui lòng nhập họ tên' })}
                        />
                        {errors.name && <span className="text-sm" style={{ color: 'var(--error)' }}>{errors.name.message as string}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            placeholder="email@example.com"
                            className="form-input"
                            {...register('email', {
                                required: 'Vui lòng nhập Email',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Email không hợp lệ"
                                }
                            })}
                        />
                        {errors.email && <span className="text-sm" style={{ color: 'var(--error)' }}>{errors.email.message as string}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Số điện thoại</label>
                        <input
                            type="tel"
                            placeholder="(09) 000-0000"
                            className="form-input"
                            {...register('phone', { required: 'Vui lòng nhập số điện thoại' })}
                        />
                        {errors.phone && <span className="text-sm" style={{ color: 'var(--error)' }}>{errors.phone.message as string}</span>}
                    </div>

                    <div className="flex gap-4">
                        <div className="form-group flex-grow">
                            <label className="form-label">Mật khẩu</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="........"
                                    className="form-input"
                                    {...register('password', { required: 'Vui lòng nhập mật khẩu', minLength: { value: 6, message: 'Tối thiểu 6 ký tự' } })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="password-toggle"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <span className="text-sm" style={{ color: 'var(--error)' }}>{errors.password.message as string}</span>}
                        </div>

                        <div className="form-group flex-grow">
                            <label className="form-label">Xác nhận mật khẩu</label>
                            <div className="password-input-wrapper">
                                <input
                                    type="password"
                                    placeholder="........"
                                    className="form-input"
                                    {...register('confirmPassword', {
                                        required: 'Vui lòng xác nhận mật khẩu',
                                        validate: (val: string) => {
                                            if (watch('password') != val) {
                                                return "Mật khẩu không khớp";
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
                        Đăng ký tài khoản
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Bằng việc đăng ký, bạn đồng ý với <Link to="#" className="text-primary font-bold">Điều khoản</Link> và <Link to="#" className="text-primary font-bold">Chính sách bảo mật</Link> của chúng tôi.
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        Đã có tài khoản? <Link to="/login" className="text-primary font-bold">Đăng nhập</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;