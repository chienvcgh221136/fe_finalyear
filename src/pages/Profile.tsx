import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { usersAPI, postsAPI } from '../services/api';
import { FileText, Heart, LogOut, Edit, User as UserIcon, Calendar, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, logout, updateUser } = useAuth();
    const activeTab = searchParams.get('tab') || 'profile';

    const [success, setSuccess] = useState(''); // Add success state

    const [isEditing, setIsEditing] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        phone: user?.phone || '', // Corrected to phone
    });

    const { data: myPostsResponse, isLoading: loadingPosts } = useQuery({
        queryKey: ['posts', 'me'],
        queryFn: () => postsAPI.getMyPosts(),
        enabled: activeTab === 'posts',
    });

    // Safety check for data structure
    const myPosts = myPostsResponse?.data?.data || myPostsResponse?.data || [];

    const handleTabChange = (tab: string) => {
        setSearchParams({ tab });
    };

    const updateProfileMutation = useMutation({
        mutationFn: (data: any) => usersAPI.updateProfile(data),
        onSuccess: (res) => {
            updateUser(res.data.data || res.data);
            setIsEditing(false);
            setSuccess('Cập nhật thông tin thành công!'); // Set success message
            setTimeout(() => setSuccess(''), 3000); // Clear after 3s
        },
    });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const StatusBadge = ({ status }: { status: string }) => {
        // ... implementation
        let color = "bg-gray-100 text-gray-800";
        let label = "Unknown";
        if (status === 'ACTIVE') { color = "bg-green-100 text-green-800"; label = "Đang hiển thị"; }
        return <span className={`px-2 py-1 rounded text-xs font-bold ${color}`}>{label}</span>
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="grid gap-6 md:grid-cols-[280px_1fr]">

                    {/* Sidebar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit sticky top-24">
                        <div className="p-6 text-center border-b border-gray-100">
                            {/* Avatar */}
                            <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4 border-4 border-white shadow-lg">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-1">{user?.name}</h3>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                        <nav className="p-4 space-y-1">
                            {[
                                { id: 'profile', label: 'Thông tin cá nhân', icon: UserIcon },
                                { id: 'posts', label: 'Tin của tôi', icon: FileText },
                                { id: 'favorites', label: 'Tin đã lưu', icon: Heart },
                                { id: 'appointments', label: 'Lịch hẹn', icon: Calendar },
                                { id: 'wallet', label: 'Ví & VIP', icon: Wallet },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleTabChange(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === item.id
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <item.icon size={18} />
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                        <div className="p-4 border-t border-gray-100 mt-2">
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                                <LogOut size={18} />
                                Đăng xuất
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        {activeTab === 'profile' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h2>
                                    {!isEditing && (
                                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
                                            <Edit size={16} />
                                            Chỉnh sửa
                                        </button>
                                    )}
                                </div>

                                {success && (
                                    <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        {success}
                                    </div>
                                )}

                                <div className="space-y-4 max-w-lg">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                                        <input
                                            type="text"
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="text"
                                            value={user?.email}
                                            disabled
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                        <input
                                            type="text"
                                            value={profileForm.phone}
                                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                                        />
                                    </div>
                                    {isEditing && (
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => updateProfileMutation.mutate(profileForm)}
                                                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Lưu thay đổi
                                            </button>
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'posts' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Tin đăng của tôi</h2>
                                    <Link to="/post-ad" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                        Đăng tin mới
                                    </Link>
                                </div>
                                {loadingPosts ? (
                                    <div className="py-12 text-center text-gray-500">Loading...</div>
                                ) : myPosts.length > 0 ? (
                                    <div className="space-y-4">
                                        {myPosts.map((post: any) => (
                                            <div key={post._id} className="flex gap-4 border border-gray-100 rounded-xl p-4 hover:border-blue-100 transition-colors">
                                                <div className="w-32 h-24 bg-gray-200 rounded-lg shrink-0 overflow-hidden">
                                                    {post.images?.[0] && <img src={post.images[0]} className="w-full h-full object-cover" alt="" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h3 className="font-bold text-gray-900 truncate pr-4">{post.title}</h3>
                                                        <StatusBadge status={post.status || 'PENDING'} />
                                                    </div>
                                                    <p className="text-blue-600 font-bold mb-2">{(post.price / 1e9).toFixed(2)} tỷ</p>
                                                    <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                                        <Link to={`/posts/${post._id}`} className="text-blue-600 hover:underline">Xem tin</Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>Bạn chưa có tin đăng nào</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'favorites' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Tin đã lưu</h2>
                                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>Chức năng đang cập nhật</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appointments' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Lịch hẹn</h2>
                                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>Bạn chưa có lịch hẹn nào</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'wallet' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Ví & VIP</h2>
                                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>Chức năng đang cập nhật</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
