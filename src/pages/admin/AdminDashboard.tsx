
import { useQuery } from '@tanstack/react-query';
import { postsAPI, usersAPI, statsAPI } from '../../services/api';
import type { Post, User } from '../../types';
import { Users, Clock, CheckCircle, Eye, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    // Fetch pending posts
    const { data: pendingPosts } = useQuery({
        queryKey: ['admin', 'pending-posts'],
        queryFn: () => postsAPI.getPending(),
        select: (res) => res.data.data as Post[],
    });

    // Fetch users (assuming getAll returns { data: User[] })
    const { data: users } = useQuery({
        queryKey: ['admin', 'users'],
        queryFn: () => usersAPI.getAll(),
        select: (res) => res.data.data as User[], // Check if API wraps in data.data
    });

    // Fetch Admin Overview Stats
    const { data: overviewStats } = useQuery({
        queryKey: ['admin', 'overview-stats'],
        queryFn: () => statsAPI.getAdminOverview(),
        select: (res) => res.data,
    });

    const stats = [
        {
            label: 'Tin chờ duyệt',
            value: pendingPosts?.length || 0,
            icon: Clock,
            color: 'bg-orange-50 text-orange-600',
        },
        {
            label: 'Tổng người dùng',
            value: overviewStats?.totalUsers || 0,
            icon: Users,
            color: 'bg-blue-50 text-blue-600',
        },
        // VIP stat removed as per user request
        {
            label: 'Tổng bài đăng',
            value: overviewStats?.totalPosts || 0,
            icon: CheckCircle,
            color: 'bg-green-50 text-green-600',
        },
        {
            label: 'Lượt xem',
            value: overviewStats?.totalViews || 0,
            icon: Eye,
            color: 'bg-purple-50 text-purple-600',
        },
    ];

    return (
        <div className="space-y-8">


            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Section */}
            <div className="grid gap-8 lg:grid-cols-2">

                {/* Pending Posts List */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Tin chờ duyệt mới nhất</h2>
                        <Link to="/admin/posts" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            Xem tất cả <ArrowRight size={14} />
                        </Link>
                    </div>
                    {pendingPosts && pendingPosts.length > 0 ? (
                        <div className="space-y-4">
                            {pendingPosts.slice(0, 5).map((post) => (
                                <div key={post._id} className="flex items-center gap-4 rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                                    <img
                                        src={post.images?.[0] || 'https://via.placeholder.com/150'}
                                        alt=""
                                        className="h-14 w-20 rounded-lg object-cover bg-gray-200"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-gray-900">{post.title}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Đăng bởi: <span className="font-medium text-gray-700">{(post.userId as User)?.name || 'Unknown'}</span>
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Chờ duyệt</span>
                                            <span className="text-xs text-gray-400">• {post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-40 flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border-dashed border border-gray-200">
                            <Clock className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">Không có tin chờ duyệt</p>
                        </div>
                    )}
                </div>

                {/* New Users List */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Người dùng mới</h2>
                        <Link to="/admin/users" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            Xem tất cả <ArrowRight size={14} />
                        </Link>
                    </div>
                    {users && users.length > 0 ? (
                        <div className="space-y-4">
                            {users.slice(0, 5).map((u) => (
                                <div key={u._id} className="flex items-center gap-4 rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                                        {u.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-gray-900">{u.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                    </div>
                                    <div className="text-xs text-gray-400 font-medium">
                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-40 flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border-dashed border border-gray-200">
                            <Users className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">Không có người dùng mới</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
