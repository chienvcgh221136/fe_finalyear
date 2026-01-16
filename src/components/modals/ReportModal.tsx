import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { reportsAPI } from '../../services/api';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
}

const REASONS = [
    { value: 'SCAM', label: 'Fraudulent listing or scam', sub: 'Suspected fake accounts or deceptive behavior' },
    { value: 'WRONG_INFO', label: 'Incorrect information', sub: 'Details do not match the actual property' },
    { value: 'DUPLICATE', label: 'Duplicate listing', sub: 'This property is listed multiple times' },
    { value: 'SPAM', label: 'Offensive content or images', sub: 'Content violates community guidelines' },
    { value: 'OTHER', label: 'Other', sub: 'Something else not listed above' },
];

const ReportModal = ({ isOpen, onClose, postId }: ReportModalProps) => {
    const [reason, setReason] = useState<string>('');
    const [description, setDescription] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const mutation = useMutation({
        mutationFn: (data: { reason: string; description: string }) => reportsAPI.create(postId, data),
        onSuccess: () => {
            setSubmitted(true);
            setTimeout(() => {
                setSubmitted(false);
                setReason('');
                setDescription('');
                onClose();
            }, 2000);
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to submit report');
        }
    });

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!reason) return;
        mutation.mutate({ reason, description });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">Report Listing</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900">Report Submitted</h4>
                            <p className="text-gray-500 mt-1">Thank you for helping keep our marketplace safe.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500 mb-6">
                                Please select the reason for reporting this property. Your feedback helps us maintain a safe marketplace.
                            </p>

                            <div className="space-y-3">
                                {REASONS.map((r) => (
                                    <label
                                        key={r.value}
                                        className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${reason === r.value
                                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="mt-0.5">
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${reason === r.value ? 'border-blue-600' : 'border-gray-300'
                                                }`}>
                                                {reason === r.value && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                            </div>
                                            <input
                                                type="radio"
                                                name="reason"
                                                value={r.value}
                                                checked={reason === r.value}
                                                onChange={(e) => setReason(e.target.value)}
                                                className="hidden"
                                            />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-medium text-gray-900">{r.label}</span>
                                            {r.sub && <span className="block text-xs text-gray-500 mt-0.5">{r.sub}</span>}
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Additional details (Optional)
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none"
                                    rows={3}
                                    placeholder="Provide any additional context here..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!submitted && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!reason || mutation.isPending}
                            className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {mutation.isPending ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportModal;
