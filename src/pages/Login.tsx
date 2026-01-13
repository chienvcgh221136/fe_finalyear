import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const onSubmit = async (data: any) => {
        setError('');
        setSuccess('');
        try {
            const result = await login(data.email, data.password);

            if (result.success) {
                setSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    navigate('/');
                }, 1000);
            } else {
                setError(result.error || 'Login failed');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
        }
    };

    // Auto-dismiss error after 3 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

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

            <div className="auth-container">
                <div className="auth-header">
                    <h2 className="auth-title">Sign in to EstateMarket</h2>
                    <p className="auth-subtitle">Enter your details to proceed.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            placeholder="e.g. name@company.com"
                            className="form-input"
                            {...register('email', { required: 'Email is required' })}
                        />
                        {errors.email && <span className="text-sm" style={{ color: 'var(--error)' }}>{errors.email.message as string}</span>}
                    </div>

                    <div className="form-group">
                        <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                            <Link to="#" className="text-primary text-sm font-bold">Forgot password?</Link>
                        </div>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="form-input"
                                {...register('password', { required: 'Password is required' })}
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

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                    >
                        Login
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don't have an account? <Link to="/register" className="text-primary font-bold">Register now</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
