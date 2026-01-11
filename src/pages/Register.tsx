import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();


    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError('');
                if (success) {

                    setSuccess('');
                }
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const onSubmit = async (data: any) => {
        setError('');
        setSuccess('');
        try {
            if (data.password !== data.confirmPassword) {
                setError('Passwords do not match');
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
                setSuccess('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(response.data.message || 'Registration failed');
            }
        } catch (err: any) {
            console.error('Registration Error:', err);
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            {/* Toast Notifications */}
            {success && (
                <div className="toast toast-success">
                    <span>✓</span> {success}
                </div>
            )}
            {error && (
                <div className="toast toast-error">
                    <span>⚠</span> {error}
                </div>
            )}

            <div className="auth-container" style={{ maxWidth: '500px' }}>
                <div className="auth-header">
                    <h2 className="auth-title">Create your Account</h2>
                    <p className="auth-subtitle">Join thousands of home buyers and renters today.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            className="form-input"
                            {...register('name', { required: 'Name is required' })}
                        />
                        {errors.name && <span className="text-sm" style={{ color: 'var(--error)' }}>{errors.name.message as string}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            placeholder="email@example.com"
                            className="form-input"
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Invalid email address"
                                }
                            })}
                        />
                        {errors.email && <span className="text-sm" style={{ color: 'var(--error)' }}>{errors.email.message as string}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                            type="tel"
                            placeholder="(555) 000-0000"
                            className="form-input"
                            {...register('phone', { required: 'Phone is required' })}
                        />
                        {errors.phone && <span className="text-sm" style={{ color: 'var(--error)' }}>{errors.phone.message as string}</span>}
                    </div>

                    <div className="flex gap-4">
                        <div className="form-group flex-grow">
                            <label className="form-label">Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="........"
                                    className="form-input"
                                    {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 chars' } })}
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
                            <label className="form-label">Confirm Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type="password"
                                    placeholder="........"
                                    className="form-input"
                                    {...register('confirmPassword', {
                                        required: 'Confirm Password is required',
                                        validate: (val: string) => {
                                            if (watch('password') != val) {
                                                return "Passwords do not match";
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
                        Register Account
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        By clicking register, you agree to our <Link to="#" className="text-primary font-bold">Terms of Service</Link> and <Link to="#" className="text-primary font-bold">Privacy Policy</Link>.
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        Already have an account? <Link to="/login" className="text-primary font-bold">Log in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;