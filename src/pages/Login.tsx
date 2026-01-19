import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const { login, googleLogin } = useAuth();

    const handleGoogleLoginSuccess = async (credentialResponse: any) => {
        try {
            if (credentialResponse.credential) {
                const result = await googleLogin(credentialResponse.credential);
                if (result.success) {
                    setSuccess('Google Login successful! Redirecting...');
                    setTimeout(() => {
                        navigate('/');
                    }, 1000);
                } else {
                    setError(result.error || 'Google Login failed');
                }
            }
        } catch (err) {
            setError('Google Login failed');
        }
    };

    const onSubmit = async (data: any) => {
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
        } catch (err) {
            setError('Login failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            {/* Toast Notifications */}
            {success && (
                <div className="toast toast-success fixed top-4 right-4 z-50">
                    <span>✓</span> {success}
                </div>
            )}
            {error && (
                <div className="toast toast-error fixed top-4 right-4 z-50">
                    <span>⚠</span> {error}
                </div>
            )}

            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                    <p className="text-gray-500 mt-2">Sign in to manage your properties or find your next home.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1">
                        <label className="block text-sm font-bold text-gray-700">Email Address</label>
                        <input
                            type="email"
                            placeholder="e.g. name@company.com"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            {...register('email', { required: 'Email is required' })}
                        />
                        {errors.email && <span className="text-sm text-red-500">{errors.email.message as string}</span>}
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-bold text-gray-700">Password</label>
                            <Link to="#" className="text-sm text-blue-600 font-semibold hover:text-blue-700">Forgot password?</Link>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-12"
                                {...register('password', { required: 'Password is required' })}
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
                        Sign in
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500 font-medium">OR</span>
                    </div>
                </div>

                <div className="flex justify-center w-full">
                    <GoogleLogin
                        onSuccess={handleGoogleLoginSuccess}
                        onError={() => setError("Google Login Failed")}
                        theme="outline"
                        size="large"
                        width="100%"
                        text="continue_with"
                        shape="rectangular"
                    />
                </div>

                <div className="text-center mt-6">
                    <p className="text-gray-600">
                        Don't have an account? <Link to="/register" className="text-blue-600 font-bold hover:text-blue-700 ml-1">Create account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
