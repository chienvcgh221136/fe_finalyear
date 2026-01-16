import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsAPI } from '../../services/api';
import {
    Search, CheckCircle, XCircle, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminReports = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: reports, isLoading } = useQuery({
        queryKey: ['admin', 'reports'],
        queryFn: () => reportsAPI.getAll(),
        select: (res) => res.data.data
    });

    const resolveMutation = useMutation({
        mutationFn: reportsAPI.resolve,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
            alert("Report resolved");
        }
    });

    const rejectMutation = useMutation({
        mutationFn: reportsAPI.reject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
            alert("Report rejected");
        }
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

    const filteredReports = reports?.filter((r: any) =>
        r.postId?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reporterId?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reported Posts</h1>
                    <p className="text-gray-500">Review and take action on listings flagged by the community.</p>
                </div>
            </div>

            {/* Stats - Optional, skipping for now based on image focus */}

            {/* Table Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search reports..."
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
                                <th className="px-6 py-4">Post Title</th>
                                <th className="px-6 py-4">Reporter</th>
                                <th className="px-6 py-4">Reason</th>
                                <th className="px-6 py-4">Reports</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading reports...</td>
                                </tr>
                            ) : filteredReports?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center p-4">
                                            <CheckCircle className="text-green-500 mb-2" size={32} />
                                            <p>No pending reports!</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredReports?.map((report: any) => (
                                    <tr key={report._id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded bg-gray-200 shrink-0 overflow-hidden">
                                                    {/* Ideally show post image here if populated */}
                                                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold">P</div>
                                                </div>
                                                <div>
                                                    <Link to={`/post/${report.postId?._id}`} target="_blank" className="font-bold text-gray-900 line-clamp-1 hover:text-blue-600">
                                                        {report.postId?.title || 'Unknown Post'}
                                                    </Link>
                                                    <p className="text-xs text-gray-400 font-mono mt-0.5">ID: #{report._id.slice(-6).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{report.reporterId?.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500">{report.reporterId?.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-start gap-1">
                                                {getReasonBadge(report.reason)}
                                                {report.description && (
                                                    <span className="text-xs text-gray-500 line-clamp-1 italic max-w-[200px]" title={report.description}>
                                                        "{report.description}"
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* Mock report count or severity bar */}
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">1</span>
                                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-red-400 w-[10%]"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 text-xs rounded-full font-bold
                                                ${report.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                    report.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                                                        'bg-gray-100 text-gray-500'}`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100">
                                                <Link
                                                    to={`/post/${report.postId?._id}`}
                                                    target="_blank"
                                                    title="View Post"
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                {report.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => resolveMutation.mutate(report._id)}
                                                            title="Resolve (No Action)"
                                                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => rejectMutation.mutate(report._id)} // In backend this is 'reject', meaning ignore report? Or ban post?
                                                            // Usually 'Resolve' means "Issue Fixed" or "Post Taken Down".
                                                            // 'Reject' means "Report Invalid".
                                                            // Backend has 'resolveReport' and 'rejectReport'.
                                                            // Let's assume Resolve = Valid Report, Reject = Invalid Report.
                                                            title="Reject Report (Invalid)"
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer Pagination (Simple placeholder) */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50">
                    <span className="text-xs text-gray-500">Showing all records</span>
                    <div className="flex gap-1">
                        <button className="px-3 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded hover:bg-gray-50" disabled>Previous</button>
                        <button className="px-3 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded hover:bg-gray-50" disabled>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
