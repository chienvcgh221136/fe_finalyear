import { useState } from 'react';
import { Trash2, CheckCircle, XCircle, Eye, MessageSquare, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsAPI, usersAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ChatViewerModal from '../../components/modals/ChatViewerModal';
import LocalizedLink from '../../components/common/LocalizedLink';
import { useTranslation } from 'react-i18next';

const AdminReports = () => {
    const { t } = useTranslation();
    const { success, error } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'POST' | 'USER'>('POST');

    // State for viewing chat
    const [viewChatId, setViewChatId] = useState<string | null>(null);
    const [viewChatTargetUser, setViewChatTargetUser] = useState<string>('');

    const { data: reports, isLoading } = useQuery({
        queryKey: ['admin', 'reports'],
        queryFn: () => reportsAPI.getAll(),
        select: (res) => res.data.data
    });

    const resolveMutation = useMutation({
        mutationFn: reportsAPI.resolve,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
            success("Đã giải quyết báo cáo");
        },
        onError: () => error("Có lỗi xảy ra khi giải quyết báo cáo")
    });

    const rejectMutation = useMutation({
        mutationFn: reportsAPI.reject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
            success("Đã từ chối báo cáo");
        },
        onError: () => error("Có lỗi xảy ra khi từ chối báo cáo")
    });

    const banMutation = useMutation({
        mutationFn: usersAPI.ban,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
            success("Đã cấm người dùng thành công");
        },
        onError: () => error("Có lỗi xảy ra khi cấm người dùng")
    });

    const deleteReportMutation = useMutation({
        mutationFn: reportsAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
            success("Đã xóa lịch sử báo cáo");
        },
        onError: () => error("Có lỗi xảy ra khi xóa báo cáo")
    });

    // Helper to get color/label for reason
    const getReasonBadge = (reason: string) => {
        const styles: any = {
            'SCAM': 'bg-red-100 text-red-700',
            'WRONG_INFO': 'bg-orange-100 text-orange-700',
            'DUPLICATE': 'bg-gray-100 text-gray-700',
            'SPAM': 'bg-purple-100 text-purple-700',
            'OTHER': 'bg-blue-100 text-blue-700'
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${styles[reason] || 'bg-gray-100'}`}>
                {reason.replace('_', ' ')}
            </span>
        );
    };

    const filteredReports = reports?.filter((r: any) => {
        const matchesTab = activeTab === 'POST'
            ? (!r.type || r.type === 'POST')
            : r.type === 'USER';

        if (!matchesTab) return false;

        const searchLower = searchTerm.toLowerCase();

        if (activeTab === 'POST') {
            return (
                r.postId?.title?.toLowerCase().includes(searchLower) ||
                r.reporterId?.name?.toLowerCase().includes(searchLower)
            );
        } else {
            return (
                r.targetUserId?.name?.toLowerCase().includes(searchLower) ||
                r.targetUserId?.email?.toLowerCase().includes(searchLower) ||
                r.reporterId?.name?.toLowerCase().includes(searchLower)
            );
        }
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Báo cáo vi phạm</h1>
                    <p className="text-gray-500">Xem xét và xử lý các báo cáo từ cộng đồng.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'POST'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('POST')}
                >
                    Báo cáo bài đăng
                </button>
                <button
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'USER'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('USER')}
                >
                    Báo cáo người dùng
                </button>
            </div>

            {/* Table Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm báo cáo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm outline-none"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                {activeTab === 'POST' ? (
                                    <>
                                        <th className="px-6 py-4">Bài đăng</th>
                                        <th className="px-6 py-4">Người báo cáo</th>
                                        <th className="px-6 py-4">Lý do</th>
                                        <th className="px-6 py-4">Số lượng</th>
                                        <th className="px-6 py-4 text-center">Trạng thái</th>
                                        <th className="px-6 py-4 text-right">Thao tác</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-6 py-4">Người bị báo cáo</th>
                                        <th className="px-6 py-4">Người báo cáo</th>
                                        <th className="px-6 py-4">Lý do</th>
                                        <th className="px-6 py-4">Chi tiết</th>
                                        <th className="px-6 py-4">Số lượng</th>
                                        <th className="px-6 py-4 text-center">Trạng thái</th>
                                        <th className="px-6 py-4 text-right">Thao tác</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={activeTab === 'POST' ? 6 : 7} className="px-6 py-12 text-center text-gray-500">Đang tải báo cáo...</td>
                                </tr>
                            ) : filteredReports?.length === 0 ? (
                                <tr>
                                    <td colSpan={activeTab === 'POST' ? 6 : 7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center p-4">
                                            <CheckCircle className="text-green-500 mb-2" size={32} />
                                            <p>Không có báo cáo chờ xử lý!</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredReports?.map((report: any) => (
                                    <tr key={report._id} className="group hover:bg-slate-50 transition-colors">
                                        {activeTab === 'POST' ? (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded bg-gray-200 shrink-0 overflow-hidden">
                                                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold">P</div>
                                                    </div>
                                                    <div>
                                                        <LocalizedLink to={`/post/${report.postId?._id}`} target="_blank" className="font-bold text-gray-900 line-clamp-1 hover:text-blue-600">
                                                            {report.postId?.title || t('admin.reports.post_not_exist', 'Bài đăng không tồn tại')}
                                                        </LocalizedLink>
                                                        <p className="text-xs text-gray-400 font-mono mt-0.5">ID: #{report._id.slice(-6).toUpperCase()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        ) : (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                                        {report.targetUserId?.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <LocalizedLink to={`/user/${report.targetUserId?._id}`} target="_blank" className="font-bold text-gray-900 hover:text-blue-600">
                                                            {report.targetUserId?.name || t('admin.reports.user_not_exist', 'Người dùng không tồn tại')}
                                                        </LocalizedLink>
                                                        <p className="text-xs text-gray-500">{report.targetUserId?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{report.reporterId?.name || 'Ẩn danh'}</p>
                                                <p className="text-xs text-gray-500">{report.reporterId?.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-start gap-1">
                                                {getReasonBadge(report.reason)}
                                                {activeTab === 'POST' && report.description && (
                                                    <span className="text-xs text-gray-500 line-clamp-1 italic max-w-[200px]" title={report.description}>
                                                        "{report.description}"
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Details Column (User Only) */}
                                        {activeTab === 'USER' && (
                                            <td className="px-6 py-4">
                                                {report.description ? (
                                                    <p className="text-sm text-gray-600 line-clamp-2" title={report.description}>
                                                        {report.description}
                                                    </p>
                                                ) : (
                                                    <span className="text-gray-400 text-sm italic">Không có mô tả</span>
                                                )}
                                            </td>
                                        )}

                                        {/* Violation Count Column */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${(activeTab === 'POST' ? report.postId?.userId?.violationCount : report.targetUserId?.violationCount) >= 5
                                                    ? 'text-red-600' : 'text-gray-900'
                                                    }`}>
                                                    {(activeTab === 'POST' ? report.postId?.userId?.violationCount : report.targetUserId?.violationCount) || 0}
                                                </span>
                                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${(activeTab === 'POST' ? report.postId?.userId?.violationCount : report.targetUserId?.violationCount) >= 5
                                                            ? 'bg-red-600' : 'bg-blue-400'
                                                            }`}
                                                        style={{ width: `${Math.min((((activeTab === 'POST' ? report.postId?.userId?.violationCount : report.targetUserId?.violationCount) || 0) / 5) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                                {(activeTab === 'POST' ? report.postId?.userId?.violationCount : report.targetUserId?.violationCount) >= 5 && (
                                                    <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold">WARNING</span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 text-xs rounded-full font-bold
                                                ${report.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                    report.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                                                        'bg-gray-100 text-gray-500'}`}>
                                                {report.status === 'PENDING' ? 'Chờ xử lý' : report.status === 'RESOLVED' ? 'Đã giải quyết' : 'Đã từ chối'}
                                            </span>
                                            {/* Banned label */}
                                            {((activeTab === 'POST' && report.postId?.userId?.isBanned) ||
                                                (activeTab === 'USER' && report.targetUserId?.isBanned)) && (
                                                    <div className="mt-1">
                                                        <span className="text-[10px] bg-gray-800 text-white px-1.5 py-0.5 rounded">BANNED</span>
                                                    </div>
                                                )}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100">
                                                {activeTab === 'POST' && (
                                                    <LocalizedLink
                                                        to={`/post/${report.postId?._id}`}
                                                        target="_blank"
                                                        title={t('common.view_post', 'View Post')}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                    >
                                                        <Eye size={16} />
                                                    </LocalizedLink>
                                                )}
                                                {report.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => resolveMutation.mutate(report._id)}
                                                            title="Giải quyết (Xác nhận vi phạm)"
                                                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => rejectMutation.mutate(report._id)}
                                                            title="Từ chối (Báo cáo sai)"
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </>
                                                )}


                                                {/* Ban Button */}
                                                {(() => {
                                                    const targetUser = activeTab === 'POST' ? report.postId?.userId : report.targetUserId;
                                                    const shouldShowBan = activeTab === 'USER' || (targetUser?.violationCount >= 5);

                                                    if (shouldShowBan && !targetUser?.isBanned) {
                                                        return (
                                                            <button
                                                                onClick={() => {
                                                                    if (window.confirm(`Bạn có chắc chắn muốn cấm người dùng ${targetUser?.name}?`)) {
                                                                        banMutation.mutate(targetUser?._id);
                                                                    }
                                                                }}
                                                                title="Cấm người dùng"
                                                                className="p-1.5 text-white bg-red-600 hover:bg-red-700 rounded shadow-sm ml-2"
                                                            >
                                                                <span className="text-xs font-bold px-1">BAN</span>
                                                            </button>
                                                        );
                                                    }
                                                    return null;
                                                })()}

                                                {/* Delete Report History Button */}
                                                {(report.status === 'RESOLVED' || report.status === 'REJECTED') && (
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) {
                                                                deleteReportMutation.mutate(report._id);
                                                            }
                                                        }}
                                                        title="Xóa báo cáo"
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded shadow-sm"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}

                                                {/* View Chat Button */}
                                                {activeTab === 'USER' && report.chatRoomId && (
                                                    <button
                                                        onClick={() => {
                                                            setViewChatId(report.chatRoomId?._id || report.chatRoomId);
                                                            setViewChatTargetUser(report.targetUserId?.name || 'User');
                                                        }}
                                                        title="Xem đoạn chat"
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded shadow-sm ml-2"
                                                    >
                                                        <MessageSquare size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Chat Viewer Modal */}
            <ChatViewerModal
                isOpen={!!viewChatId}
                onClose={() => setViewChatId(null)}
                chatRoomId={viewChatId || ''}
                targetUserName={viewChatTargetUser}
            />
        </div>
    );
};

export default AdminReports;
