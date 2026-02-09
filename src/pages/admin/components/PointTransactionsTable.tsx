import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pointsAPI } from '../../../services/api';

const PointTransactionsTable = () => {
    const [page, setPage] = useState(1);
    const [filterType, setFilterType] = useState('ALL'); // ALL, EARN, SPEND

    // Fetch logs
    const { data: logsData, isLoading } = useQuery({
        queryKey: ['admin', 'point-logs', page, filterType],
        queryFn: () => pointsAPI.getAllLogs({
            page,
            limit: 20,
            type: filterType === 'ALL' ? undefined : filterType
        }),
        select: (res) => res.data
    });

    return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-gray-900">Lịch sử giao dịch</h2>

                <div className="flex items-center gap-3">
                    <select
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="ALL">Tất cả giao dịch</option>
                        <option value="EARN">Nạp/Nhận điểm</option>
                        <option value="SPEND">Tiêu điểm</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-6 py-4 font-medium">Người dùng</th>
                            <th className="px-6 py-4 font-medium">Hành động</th>
                            <th className="px-6 py-4 font-medium">Số điểm</th>
                            <th className="px-6 py-4 font-medium">Chi tiết</th>
                            <th className="px-6 py-4 font-medium">Thời gian</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Đang tải...</td>
                            </tr>
                        ) : logsData?.data?.length > 0 ? (
                            logsData.data.map((log: any) => (
                                <tr key={log._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {log.userId?.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{log.userId?.name || 'Deleted User'}</p>
                                                <p className="text-xs text-gray-500">{log.userId?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${log.type === 'EARN'
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-red-50 text-red-700'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 font-bold ${log.type === 'EARN' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {log.type === 'EARN' ? '+' : '-'}{log.points}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {log.description || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    Không có dữ liệu
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {logsData?.pagination && logsData.pagination.total > 1 && (
                <div className="border-t border-gray-100 p-4 flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50"
                    >
                        Trước
                    </button>
                    <span className="text-sm text-gray-600">
                        Trang {page} / {logsData.pagination.total}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(logsData.pagination.total, p + 1))}
                        disabled={page === logsData.pagination.total}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50"
                    >
                        Sau
                    </button>
                </div>
            )}
        </div>
    );
};

export default PointTransactionsTable;
