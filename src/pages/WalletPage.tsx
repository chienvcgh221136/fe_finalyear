
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { walletAPI } from '../services/api';
import type { Wallet, Transaction } from '../types';
import { CreditCard, History, Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, X, Copy, CheckCircle } from 'lucide-react';

// CONSTANTS - REPLACE WITH YOUR ACTUAL INFO
const BANK_INFO = {
    BANK_ID: 'MB',
    ACCOUNT_NO: '0943285591', // Thay bằng số tài khoản của bạn
    ACCOUNT_NAME: 'PHAM VAN CHIEN', // Thay bằng tên tài khoản của bạn
};

const WalletPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState('');
    const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [latestTxId, setLatestTxId] = useState<string | null>(null);

    // Fetch Wallet Data
    const { data: wallet, isLoading: loadingWallet } = useQuery({
        queryKey: ['wallet'],
        queryFn: async () => {
            const res = await walletAPI.getMe();
            return res.data as Wallet;
        },
    });

    // Fetch Transactions
    const { data: transactions, isLoading: loadingTransactions } = useQuery({
        queryKey: ['transactions'],
        queryFn: async () => {
            const res = await walletAPI.getTransactions();
            return res.data.data as Transaction[];
        },
        refetchInterval: isTopupModalOpen ? 3000 : false, // Poll when modal is open
    });

    // Watch for new transactions to show success
    useEffect(() => {
        if (transactions && transactions.length > 0) {
            const currentLatestId = transactions[0]._id;

            // Initial Load
            if (latestTxId === null) {
                setLatestTxId(currentLatestId);
                return;
            }

            // Detected new transaction
            if (currentLatestId !== latestTxId) {
                // Check if it's a TOPUP
                if (transactions[0].type === 'TOPUP') {
                    if (isTopupModalOpen) {
                        queryClient.invalidateQueries({ queryKey: ['wallet'] });
                        setIsTopupModalOpen(false);
                        setShowQR(false);
                        setAmount('');
                        setShowSuccess(true);
                    }
                }
                setLatestTxId(currentLatestId);
            }
        } else if (transactions && transactions.length === 0) {
            // Handle case where zero transactions exist initially
            if (latestTxId === null) {
                setLatestTxId("empty"); // Mark as initialized but empty
            }
        }
    }, [transactions, isTopupModalOpen, latestTxId]);

    const handleTopup = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) return;
        setShowQR(true);
    };

    const handleCloseModal = () => {
        setIsTopupModalOpen(false);
        setShowQR(false);
        setAmount('');
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('vi-VN');

    const transferContent = `NAPTIEN ${user?._id} `;
    const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.BANK_ID}-${BANK_INFO.ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_INFO.ACCOUNT_NAME)}`;

    if (loadingWallet) return <div className="p-8 text-center">Loading wallet...</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <h1 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-3">
                <WalletIcon className="text-blue-600" size={32} />
                Ví của tôi
            </h1>

            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 mb-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                <div className="relative z-10 w-full md:w-auto">
                    <p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-wider">Số dư khả dụng</p>
                    <div className="text-4xl md:text-5xl font-extrabold mb-2 text-white drop-shadow-sm">
                        {formatCurrency(wallet?.balance || 0)}
                    </div>
                </div>

                <div className="relative z-10 flex gap-4 w-full md:w-auto">
                    <button
                        onClick={() => { setIsTopupModalOpen(true); setShowSuccess(false); }}
                        className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg active:scale-95"
                    >
                        <Plus size={20} />
                        Nạp tiền
                    </button>
                    {/* Placeholder Withdraw Button */}
                    <button className="bg-blue-500/30 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-500/40 transition-all flex items-center gap-2 backdrop-blur-sm border border-white/20">
                        <ArrowUpRight size={20} />
                        Rút tiền
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <ArrowDownLeft size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Tổng tiền nạp</p>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(wallet?.totalTopup || 0)}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Tổng tiền đã chi</p>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(wallet?.totalSpent || 0)}</div>
                    </div>
                </div>
            </div>

            {/* Transactions History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <History size={20} className="text-gray-500" />
                        Lịch sử giao dịch
                    </h2>
                </div>

                {loadingTransactions ? (
                    <div className="p-8 text-center text-gray-500">Loading history...</div>
                ) : transactions?.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">Chưa có giao dịch nào</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Loại giao dịch</th>
                                    <th className="px-6 py-4 font-semibold">Số tiền</th>
                                    <th className="px-6 py-4 font-semibold">Mô tả</th>
                                    <th className="px-6 py-4 font-semibold">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions?.map((tx) => (
                                    <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${tx.type === 'TOPUP' ? 'bg-green-100 text-green-700' :
                                                'bg-red-100 text-red-700'
                                                }`}>
                                                {tx.type === 'TOPUP' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 font-bold ${tx.type === 'TOPUP' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'TOPUP' ? '+' : ''}{formatCurrency(tx.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{tx.description}</td>
                                        <td className="px-6 py-4 text-gray-500 font-medium">{formatDate(tx.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Topup Modal */}
            {isTopupModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">
                                {showQR ? 'Thông tin chuyển khoản' : 'Nạp tiền vào ví'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {!showQR ? (
                            <form onSubmit={handleTopup} className="p-6">
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Số tiền muốn nạp (VNĐ)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-bold text-lg text-gray-900"
                                            placeholder="VD: 500000"
                                            min="10000"
                                            autoFocus
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">VNĐ</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 ml-1">Tối thiểu 10.000 VNĐ</p>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    {[100000, 200000, 500000].map(val => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setAmount(val.toString())}
                                            className="px-2 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
                                        >
                                            {formatCurrency(val)}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                                    >
                                        Tiếp tục
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-6">
                                {/* QR Code Section */}
                                <div className="text-center mb-6">
                                    <div className="bg-white p-2 rounded-xl border border-gray-200 inline-block shadow-sm">
                                        <img
                                            src={qrUrl}
                                            alt="Mã QR chuyển khoản"
                                            className="w-64 h-64 object-contain"
                                        />
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">Quét mã QR để thanh toán tự động</p>
                                </div>

                                {/* Bank Info Details */}
                                <div className="bg-blue-50 rounded-xl p-4 mb-6 space-y-3 border border-blue-100">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Ngân hàng</span>
                                        <span className="font-bold text-gray-900">{BANK_INFO.BANK_ID}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Số tài khoản</span>
                                        <span className="font-bold text-gray-900 flex items-center gap-2">
                                            {BANK_INFO.ACCOUNT_NO}
                                            <Copy size={14} className="cursor-pointer text-blue-600" onClick={() => navigator.clipboard.writeText(BANK_INFO.ACCOUNT_NO)} />
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Chủ tài khoản</span>
                                        <span className="font-bold text-gray-900">{BANK_INFO.ACCOUNT_NAME}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Số tiền</span>
                                        <span className="font-bold text-blue-600">{formatCurrency(Number(amount))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
                                        <span className="text-gray-500">Nội dung CK</span>
                                        <span className="font-bold text-red-600 flex items-center gap-2">
                                            {transferContent}
                                            <Copy size={14} className="cursor-pointer text-blue-600" onClick={() => navigator.clipboard.writeText(transferContent)} />
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg mb-6">
                                    <strong>Lưu ý:</strong> Vui lòng nhập chính xác nội dung chuyển khoản <strong>{transferContent}</strong> để tiền được cộng tự động vào ví.
                                </div>

                                <div className="text-center mt-4">
                                    <button
                                        onClick={handleCloseModal}
                                        className="text-gray-500 hover:text-gray-700 font-medium text-sm underline"
                                    >
                                        Đóng cửa sổ này
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Success Success Check Modal */}
            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-300 transform">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 animate-bounce">
                                <CheckCircle size={48} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h3>
                            <p className="text-gray-500 mb-8">
                                Số tiền đã được cộng vào tài khoản của bạn.
                            </p>
                            <button
                                onClick={() => setShowSuccess(false)}
                                className="w-full px-6 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                            >
                                Tuyệt vời
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletPage;

