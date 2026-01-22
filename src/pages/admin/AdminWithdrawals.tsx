import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { withdrawAPI } from '../../services/api';
import { CheckCircle, XCircle, Clock, AlertCircle, Search, Filter, DollarSign, Wallet, ArrowUpRight } from 'lucide-react';

const AdminWithdrawals = () => {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [actionNote, setActionNote] = useState('');
    const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'PAID' | null>(null);

    const { data: requests, isLoading } = useQuery({
        queryKey: ['admin_withdrawals', statusFilter],
        queryFn: async () => {
            const res = await withdrawAPI.getAll(statusFilter);
            return res.data.requests;
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, note }: { id: string, status: string, note?: string }) => {
            return await withdrawAPI.updateStatus(id, status, note);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_withdrawals'] });
            setSelectedRequest(null);
            setActionType(null);
            setActionNote('');
            alert('Cập nhật trạng thái thành công!');
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    });

    const handleAction = (request: any, type: 'APPROVE' | 'REJECT' | 'PAID') => {
        setSelectedRequest(request);
        setActionType(type);
        setActionNote('');
    };

    const confirmAction = () => {
        if (!selectedRequest || !actionType) return;

        // Map actionType to Status Enum
        let status = 'PENDING';
        if (actionType === 'APPROVE') status = 'APPROVED';
        if (actionType === 'REJECT') status = 'REJECTED';
        if (actionType === 'PAID') status = 'PAID';

        updateStatusMutation.mutate({
            id: selectedRequest._id,
            status,
            note: actionNote
        });
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <span className="px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-800 text-xs font-bold border border-yellow-200 inline-flex items-center gap-1.5 shadow-sm"><Clock size={14} /> CHỜ DUYỆT</span>;
            case 'APPROVED': return <span className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 inline-flex items-center gap-1.5 shadow-sm"><CheckCircle size={14} /> ĐÃ DUYỆT</span>;
            case 'REJECTED': return <span className="px-3 py-1.5 rounded-lg bg-red-100 text-red-800 text-xs font-bold border border-red-200 inline-flex items-center gap-1.5 shadow-sm"><XCircle size={14} /> TỪ CHỐI</span>;
            case 'PAID': return <span className="px-3 py-1.5 rounded-lg bg-green-100 text-green-800 text-xs font-bold border border-green-200 inline-flex items-center gap-1.5 shadow-sm"><DollarSign size={14} /> ĐÃ THANH TOÁN</span>;
            default: return status;
        }
    };

    // Calculate Stats
    const stats = useMemo(() => {
        if (!requests) return { pendingAmount: 0, pendingCount: 0, avgTime: 0, requestsGrowth: 0 };

        const pendingReqs = requests.filter((r: any) => r.status === 'PENDING');
        const pendingAmount = pendingReqs.reduce((acc: number, r: any) => acc + r.amount, 0);
        const pendingCount = pendingReqs.length;

        // Avg Processing Time (Completed requests only)
        const processedReqs = requests.filter((r: any) => (r.status === 'APPROVED' || r.status === 'PAID' || r.status === 'REJECTED') && r.processedAt);
        let avgTime = 0;
        if (processedReqs.length > 0) {
            const totalTimeMs = processedReqs.reduce((acc: number, r: any) => {
                const start = new Date(r.requestedAt).getTime();
                const end = new Date(r.processedAt).getTime();
                return acc + (end - start);
            }, 0);
            avgTime = totalTimeMs / processedReqs.length / (1000 * 60 * 60); // Hours
        }

        // Trends (Last 7 days vs Previous 7 Days volume)
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const thisWeekReqs = requests.filter((r: any) => new Date(r.requestedAt) >= sevenDaysAgo);
        const lastWeekReqs = requests.filter((r: any) => new Date(r.requestedAt) >= fourteenDaysAgo && new Date(r.requestedAt) < sevenDaysAgo);

        const requestsGrowth = lastWeekReqs.length === 0 ? (thisWeekReqs.length > 0 ? 100 : 0) : ((thisWeekReqs.length - lastWeekReqs.length) / lastWeekReqs.length) * 100;

        return { pendingAmount, pendingCount, avgTime, requestsGrowth };
    }, [requests]);

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
                        Quản lý Rút tiền
                    </h1>
                    <p className="text-gray-500 text-sm">Xử lý các yêu cầu thanh toán chờ duyệt từ người dùng</p>
                </div>
                <button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['admin_withdrawals'] })}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-bold shadow-md shadow-blue-500/20 text-sm flex items-center gap-2"
                >
                    <Clock size={16} /> Làm mới
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
                    <div>
                        <p className="text-gray-500 font-medium text-sm mb-1">Tổng tiền chờ duyệt</p>
                        <h3 className="text-3xl font-extrabold text-gray-900 mb-1">{formatCurrency(stats.pendingAmount).replace('₫', '')} <span className="text-sm font-semibold text-gray-500">VNĐ</span></h3>
                        <div className="flex items-center gap-1">
                            <div className={`text-xs font-bold flex items-center gap-1 ${stats.pendingAmount > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                                <AlertCircle size={12} /> {stats.pendingAmount > 0 ? 'Cần xử lý ngay' : 'Không có yêu cầu'}
                            </div>
                        </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <Wallet size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
                    <div>
                        <p className="text-gray-500 font-medium text-sm mb-1">Yêu cầu rút tiền (7 ngày)</p>
                        <h3 className="text-3xl font-extrabold text-gray-900 mb-1">{requests?.filter((r: any) => new Date(r.requestedAt) > new Date(Date.now() - 7 * 86400000)).length || 0} <span className="text-sm font-semibold text-gray-500">Yêu cầu</span></h3>
                        <p className={`${stats.requestsGrowth >= 0 ? 'text-green-500' : 'text-red-500'} text-xs font-bold flex items-center gap-1`}>
                            {stats.requestsGrowth >= 0 ? <ArrowUpRight size={12} /> : <ArrowUpRight size={12} className="rotate-90" />}
                            {Math.abs(stats.requestsGrowth).toFixed(0)}% so với tuần trước
                        </p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
                        <Clock size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
                    <div>
                        <p className="text-gray-500 font-medium text-sm mb-1">Thời gian xử lý TB</p>
                        <h3 className="text-3xl font-extrabold text-gray-900 mb-1">{stats.avgTime.toFixed(1)} <span className="text-sm font-semibold text-gray-500">giờ</span></h3>
                        <p className="text-green-500 text-xs font-bold">Hiệu suất xử lý</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                        <CheckCircle size={24} />
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex justify-between items-center mb-6 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm ID, Ngân hàng hoặc Số tiền..."
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent outline-none text-sm font-medium text-gray-700"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-lg px-4 py-2.5 outline-none hover:bg-gray-100 transition-colors cursor-pointer appearance-none"
                    >
                        <option value="ALL">7 ngày qua</option>
                        <option value="PENDING">Chờ duyệt</option>
                        <option value="APPROVED">Đã duyệt</option>
                        <option value="PAID">Đã thanh toán</option>
                        <option value="REJECTED">Từ chối</option>
                    </select>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                        <Filter size={14} /> Lọc
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
                ) : requests?.length === 0 ? (
                    <div className="p-20 text-center text-gray-400 flex flex-col items-center">
                        <div className="bg-gray-50 p-4 rounded-full mb-4">
                            <Search size={32} className="opacity-50" />
                        </div>
                        Không tìm thấy yêu cầu rút tiền nào
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Người dùng</th>
                                    <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Số tiền (VNĐ)</th>
                                    <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Thông tin ngân hàng</th>
                                    <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Ngày yêu cầu</th>
                                    <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {requests.map((req: any) => (
                                    <tr key={req._id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 uppercase shrink-0">
                                                    ID
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900 font-mono">#USR-{req.userId?._id?.slice(-5).toUpperCase()}</p>
                                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{req.userId?.name}</p>
                                                    <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase">Đại lý Cấp 1</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="text-base font-extrabold text-gray-900">
                                                {formatCurrency(req.amount).replace('₫', '')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-blue-600 uppercase">{req.bank.bankName}</p>
                                                <p className="text-sm font-mono font-medium text-gray-700">{req.bank.accountNumber}</p>
                                                <p className="text-xs text-gray-500 uppercase font-medium">{req.bank.accountHolder}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="text-xs font-medium text-gray-600">
                                                <p className="font-bold text-gray-900">{new Date(req.requestedAt).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit', year: 'numeric' })}</p>
                                                <p>{new Date(req.requestedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            {getStatusBadge(req.status)}
                                        </td>
                                        <td className="px-6 py-4 align-top text-right">
                                            <div className="flex justify-end gap-2 opacity-100 group-hover:opacity-100 transition-opacity">
                                                {req.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(req, 'APPROVE')}
                                                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                                                        >
                                                            <CheckCircle size={14} /> Duyệt
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(req, 'REJECT')}
                                                            className="px-4 py-2 bg-white border border-gray-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                                        >
                                                            Từ chối
                                                        </button>
                                                    </>
                                                )}
                                                {req.status === 'APPROVED' && (
                                                    <button
                                                        onClick={() => handleAction(req, 'PAID')}
                                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                                                    >
                                                        <DollarSign size={14} /> Đã CK
                                                    </button>
                                                )}
                                                <button className="p-2 text-gray-400 hover:text-gray-600">
                                                    <Search size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Reject/Approve/Pay Modal */}
            {selectedRequest && actionType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-sans">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${actionType === 'REJECT' ? 'bg-red-100 text-red-600' :
                                actionType === 'PAID' ? 'bg-green-100 text-green-600' :
                                    'bg-blue-100 text-blue-600'
                                }`}>
                                {actionType === 'REJECT' ? <XCircle size={24} /> :
                                    actionType === 'PAID' ? <DollarSign size={24} /> :
                                        <CheckCircle size={24} />}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {actionType === 'REJECT' && 'Từ chối yêu cầu'}
                                    {actionType === 'APPROVE' && 'Duyệt yêu cầu'}
                                    {actionType === 'PAID' && 'Xác nhận đã thanh toán'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {actionType === 'REJECT' ? 'Hành động này sẽ hoàn tiền lại cho người dùng.' : 'Tiếp tục với bước tiếp theo.'}
                                </p>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 bg-gray-50/50">
                            {/* Request Summary Card */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mã Yêu Cầu</p>
                                        <p className="font-mono font-bold text-gray-900">#WR-{selectedRequest._id.slice(-5).toUpperCase()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Số tiền</p>
                                        <p className="font-bold text-blue-600 text-lg">{formatCurrency(selectedRequest.amount)}</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-gray-100 mt-2 flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">
                                        {selectedRequest.userId?.name.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{selectedRequest.userId?.name} • Đại lý Cấp 1</span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-2">
                                Vui lòng nhập lý do hoặc ghi chú cho hành động này. Ghi chú này sẽ được gửi đến email và thông báo của người dùng.
                            </p>

                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-800 mb-2 flex justify-between">
                                    Ghi chú Admin (Lý do)
                                    <span className="text-xs font-normal text-gray-400">{actionNote.length} / 500 ký tự</span>
                                </label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none shadow-sm min-h-[120px]"
                                    placeholder={actionType === 'REJECT' ? "Ví dụ: Thông tin ngân hàng không chính xác hoặc số dư không đủ..." : "Thêm ghi chú..."}
                                    value={actionNote}
                                    onChange={(e) => setActionNote(e.target.value)}
                                    maxLength={500}
                                ></textarea>
                            </div>

                            {actionType === 'REJECT' && (
                                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3 text-orange-800 text-sm mb-6">
                                    <AlertCircle size={20} className="shrink-0 text-orange-600" />
                                    <p className="font-medium">
                                        Từ chối yêu cầu này sẽ hoàn lại số tiền vào ví khả dụng của người dùng. Hành động này không thể hoàn tác.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    {actionType === 'REJECT' ? 'Giữ trạng thái chờ' : 'Hủy'}
                                </button>
                                <button
                                    onClick={confirmAction}
                                    className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95 ${actionType === 'REJECT' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' :
                                        actionType === 'PAID' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' :
                                            'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                                        }`}
                                >
                                    {actionType === 'REJECT' && 'Từ chối yêu cầu'}
                                    {actionType === 'APPROVE' && 'Duyệt & Thanh toán'}
                                    {actionType === 'PAID' && 'Xác nhận đã CK'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWithdrawals;
