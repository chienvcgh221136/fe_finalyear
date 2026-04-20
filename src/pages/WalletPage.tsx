
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { parseNotificationMessage } from '../utils/notificationParser';
import { useAuth } from '../context/AuthContext';
import { walletAPI, withdrawAPI } from '../services/api';
import type { Wallet, Transaction } from '../types';
import { CreditCard, History, Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, X, Copy, CheckCircle, Clock } from 'lucide-react';
import { formatVND } from '../utils/currencyUtils';

// CONSTANTS - REPLACE WITH YOUR ACTUAL INFO
const BANK_INFO = {
    BANK_ID: 'MB',
    ACCOUNT_NO: '0943285591', // Thay bằng số tài khoản của bạn
    ACCOUNT_NAME: 'PHAM VAN CHIEN', // Thay bằng tên tài khoản của bạn
};

const COMMON_BANKS = [
    'Vietcombank', 'Techcombank', 'MBBank', 'ACB', 'VPBank', 'TPBank',
    'BIDV', 'Agribank', 'VietinBank', 'Sacombank', 'VIB', 'HDBank', 'MSB', 'OCB'
];

const WalletPage = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState('');
    const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [latestTxId, setLatestTxId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Withdraw State
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [withdrawStep, setWithdrawStep] = useState<'FORM' | 'OTP'>('FORM');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [otp, setOtp] = useState('');
    const [bankDetails, setBankDetails] = useState({
        bankName: '',
        accountNumber: '',
        accountHolder: ''
    });

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
    }, [transactions, isTopupModalOpen, latestTxId, queryClient]);

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

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInitiateWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await withdrawAPI.request(Number(withdrawAmount));
            setWithdrawStep('OTP');
        } catch (error: any) {
            alert(error.response?.data?.message || t('common.error_occurred'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await withdrawAPI.verify(otp, Number(withdrawAmount), bankDetails);
            setIsWithdrawModalOpen(false);
            setWithdrawStep('FORM');
            setWithdrawAmount('');
            setOtp('');
            setBankDetails({ bankName: '', accountNumber: '', accountHolder: '' });
            alert(t('wallet.withdraw_success_msg'));
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        } catch (error: any) {
            alert(error.response?.data?.message || t('wallet.withdraw_verify_failed'));
        }
    };

    const formatCurrency = (val: number) => formatVND(val);

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US');

    const transferContent = `TOPUP ${user?._id} `;
    const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.BANK_ID}-${BANK_INFO.ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_INFO.ACCOUNT_NAME)}`;

    if (loadingWallet) return <div className="p-8 text-center">{t('common.loading')}</div>;

    return (
        <div className="w-full px-4 md:px-8 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-3">
                <WalletIcon className="text-blue-600" size={32} />
                {t('wallet.title')}
            </h1>

            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 mb-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                <div className="relative z-10 w-full md:w-auto">
                    <p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-wider">{t('wallet.balance_label')}</p>
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
                        {t('wallet.topup_btn')}
                    </button>
                    <button
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="bg-blue-500/30 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-500/40 transition-all flex items-center gap-2 backdrop-blur-sm border border-white/20"
                    >
                        <ArrowUpRight size={20} />
                        {t('wallet.withdraw_btn')}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <ArrowDownLeft size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">{t('wallet.total_topup')}</p>
                        <div className="text-xl font-bold text-gray-900">{formatCurrency(wallet?.totalTopup || 0)}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">{t('wallet.total_spent')}</p>
                        <div className="text-xl font-bold text-gray-900">{formatCurrency(wallet?.totalSpent || 0)}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <ArrowUpRight size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">{t('wallet.total_withdrawn')}</p>
                        <div className="text-xl font-bold text-gray-900">{formatCurrency(wallet?.totalWithdrawn || 0)}</div>
                    </div>
                </div>
            </div>

            {/* Transactions History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <History size={20} className="text-gray-500" />
                        {t('wallet.history_title')}
                    </h2>
                </div>

                {loadingTransactions ? (
                    <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
                ) : transactions?.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">{t('wallet.no_transactions')}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">{t('wallet.col_type')}</th>
                                    <th className="px-6 py-4 font-semibold">{t('wallet.col_amount')}</th>
                                    <th className="px-6 py-4 font-semibold">{t('wallet.col_description')}</th>
                                    <th className="px-6 py-4 font-semibold">{t('wallet.col_time')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((tx) => (
                                    <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${['TOPUP', 'REFUND'].includes(tx.type) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {['TOPUP', 'REFUND'].includes(tx.type) ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 font-bold ${['TOPUP', 'REFUND'].includes(tx.type) ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'TOPUP' || tx.type === 'REFUND' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {parseNotificationMessage(tx.description, t)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-medium">{formatDate(tx.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {/* Pagination UI */}
                {transactions && transactions.length > ITEMS_PER_PAGE && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-center items-center gap-4">
                        <button
                            onClick={() => {
                                setCurrentPage(p => Math.max(1, p - 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-50 transition-all font-medium"
                        >
                            {t('admin.common.prev', { defaultValue: 'Trang trước' })}
                        </button>
                        <span className="text-sm font-medium text-gray-600 px-4">
                            {t('admin.common.page_display', { defaultValue: 'Hiển thị trang' })} {currentPage} / {Math.ceil(transactions.length / ITEMS_PER_PAGE)}
                        </span>
                        <button
                            onClick={() => {
                                setCurrentPage(p => Math.min(Math.ceil(transactions.length / ITEMS_PER_PAGE), p + 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={currentPage === Math.ceil(transactions.length / ITEMS_PER_PAGE)}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-50 transition-all font-medium"
                        >
                            {t('admin.common.next', { defaultValue: 'Trang sau' })}
                        </button>
                    </div>
                )}
            </div>

            {/* Topup Modal */}
            {isTopupModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                            <h3 className="text-xl font-bold text-gray-800">
                                {showQR ? t('wallet.qr_title') : t('wallet.topup_modal_title')}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto">
                            {!showQR ? (
                                <form onSubmit={handleTopup} className="p-6">
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('wallet.topup_amount_label')}</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-bold text-lg text-gray-900"
                                                placeholder={t('wallet.topup_amount_placeholder')}
                                                min="10000"
                                                autoFocus
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{t('common.currency')}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 ml-1">{t('wallet.min_topup')}</p>
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
                                            {t('wallet.topup_cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                                        >
                                            {t('wallet.topup_continue')}
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
                                                alt={t('wallet.qr_title')}
                                                className="w-64 h-64 object-contain"
                                            />
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">{t('wallet.qr_subtitle')}</p>
                                    </div>

                                    {/* Bank Info Details */}
                                    <div className="bg-blue-50 rounded-xl p-4 mb-6 space-y-3 border border-blue-100">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{t('wallet.bank_name')}</span>
                                            <span className="font-bold text-gray-900">{BANK_INFO.BANK_ID}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{t('wallet.account_no')}</span>
                                            <span className="font-bold text-gray-900 flex items-center gap-2">
                                                {BANK_INFO.ACCOUNT_NO}
                                                <Copy size={14} className="cursor-pointer text-blue-600" onClick={() => { navigator.clipboard.writeText(BANK_INFO.ACCOUNT_NO); alert(t('wallet.copy_success')); }} />
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{t('wallet.account_holder')}</span>
                                            <span className="font-bold text-gray-900">{BANK_INFO.ACCOUNT_NAME}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{t('wallet.amount')}</span>
                                            <span className="font-bold text-blue-600">{formatCurrency(Number(amount))}</span>
                                        </div>
                                        <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
                                            <span className="text-gray-500">{t('wallet.transfer_content')}</span>
                                            <span className="font-bold text-red-600 flex items-center gap-2">
                                                {transferContent}
                                                <Copy size={14} className="cursor-pointer text-blue-600" onClick={() => { navigator.clipboard.writeText(transferContent); alert(t('wallet.copy_success')); }} />
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg mb-6">
                                        <strong>{t('common.note')}:</strong> {t('wallet.qr_note')} <strong>{transferContent}</strong>.
                                    </div>

                                    <div className="text-center mt-4">
                                        <button
                                            onClick={handleCloseModal}
                                            className="text-gray-500 hover:text-gray-700 font-medium text-sm underline"
                                        >
                                            {t('wallet.qr_close')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Withdraw Modal */}
            {isWithdrawModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                            <h3 className="text-xl font-extrabold text-gray-900">{t('wallet.withdraw_modal_title')}</h3>
                            <button onClick={() => setIsWithdrawModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Steps Indicator */}
                        <div className="px-6 pt-6">
                            <div className="bg-gray-100 p-1 rounded-xl flex">
                                <div className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-all ${withdrawStep === 'FORM' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
                                    {t('wallet.withdraw_step_1')}
                                </div>
                                <div className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-all ${withdrawStep === 'OTP' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
                                    {t('wallet.withdraw_step_2')}
                                </div>
                            </div>
                        </div>

                        <div className="overflow-y-auto p-6">
                            {withdrawStep === 'FORM' ? (
                                <form onSubmit={handleInitiateWithdraw} className="space-y-6">
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900 mb-2">{t('wallet.withdraw_info_title')}</h4>
                                        <p className="text-gray-500 text-sm mb-6">{t('wallet.withdraw_info_subtitle')}</p>

                                        {/* Amount Input */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">{t('wallet.withdraw_amount_label')}</label>
                                            <div className="relative group">
                                                <input
                                                    type="number"
                                                    required
                                                    min="50000"
                                                    value={withdrawAmount}
                                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 outline-none font-bold text-3xl text-gray-900 transition-all placeholder:text-gray-300"
                                                    placeholder="0"
                                                />
                                                <span className="absolute right-24 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">{t('common.currency')}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setWithdrawAmount(wallet?.balance?.toString() || '0')}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                                >
                                                    {t('wallet.withdraw_max')}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">{t('wallet.withdraw_available')}: <span className="font-bold text-gray-700">{formatCurrency(wallet?.balance || 0)}</span></p>
                                            {Number(withdrawAmount) > (wallet?.balance || 0) && (
                                                <p className="text-red-500 text-xs font-bold mt-1">⚠️ {t('wallet.withdraw_error_limit')}</p>
                                            )}
                                        </div>

                                        {/* Bank Info */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">{t('wallet.withdraw_bank_label')}</label>

                                            {/* Bank Form Fields styled as a 'New Account' card */}
                                            <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-4 space-y-3 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="col-span-2">
                                                        <label className="block text-xs font-bold text-gray-500 mb-1">{t('wallet.bank_name')}</label>
                                                        <select
                                                            value={COMMON_BANKS.includes(bankDetails.bankName) ? bankDetails.bankName : 'other'}
                                                            onChange={(e) => {
                                                                if (e.target.value === 'other') {
                                                                    setBankDetails({ ...bankDetails, bankName: '' });
                                                                } else {
                                                                    setBankDetails({ ...bankDetails, bankName: e.target.value });
                                                                }
                                                            }}
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                                                        >
                                                            <option value="" disabled>{t('wallet.withdraw_bank_placeholder')}</option>
                                                            {COMMON_BANKS.map(bank => (
                                                                <option key={bank} value={bank}>{bank}</option>
                                                            ))}
                                                            <option value="other">{t('wallet.withdraw_bank_other')}</option>
                                                        </select>

                                                        {(!COMMON_BANKS.includes(bankDetails.bankName) || bankDetails.bankName === '') && (
                                                            <input
                                                                type="text"
                                                                required
                                                                value={bankDetails.bankName}
                                                                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none animate-in fade-in slide-in-from-top-1"
                                                                placeholder={t('wallet.withdraw_bank_other_placeholder')}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="col-span-2 md:col-span-1">
                                                        <label className="block text-xs font-bold text-gray-500 mb-1">{t('wallet.withdraw_account_no')}</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={bankDetails.accountNumber}
                                                            onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                                                            placeholder={t('wallet.withdraw_account_no_placeholder')}
                                                        />
                                                    </div>
                                                    <div className="col-span-2 md:col-span-1">
                                                        <label className="block text-xs font-bold text-gray-500 mb-1">{t('wallet.withdraw_account_holder')}</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={bankDetails.accountHolder}
                                                            onChange={(e) => setBankDetails({ ...bankDetails, accountHolder: e.target.value })}
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                                            placeholder={t('wallet.withdraw_account_holder_placeholder')}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Alert */}
                                    <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start text-sm text-blue-800">
                                        <CheckCircle size={20} className="shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold mb-1">{t('wallet.withdraw_processing_title')}</p>
                                            <p className="opacity-90">{t('wallet.withdraw_processing_desc')} <span className="font-bold">{t('wallet.withdraw_fee_free')}</span>.</p>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex gap-4 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsWithdrawModalOpen(false)}
                                            disabled={isSubmitting}
                                            className="flex-1 py-3 px-6 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || Number(withdrawAmount) > (wallet?.balance || 0) || Number(withdrawAmount) < 50000}
                                            className="flex-1 py-3 px-6 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Clock size={18} className="animate-spin" />
                                                    {t('common.processing')}
                                                </>
                                            ) : (
                                                <>
                                                    {t('wallet.withdraw_btn_verify')}
                                                    <ArrowUpRight size={18} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyWithdraw} className="space-y-6">
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900 mb-2">{t('wallet.withdraw_otp_title')}</h4>
                                        <p className="text-gray-500 text-sm mb-6">{t('wallet.withdraw_otp_subtitle')}</p>

                                        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-6">
                                            <p className="text-sm text-yellow-800 flex items-center gap-2">
                                                <Clock size={16} />
                                                {t('wallet.withdraw_otp_expire')}
                                            </p>
                                        </div>

                                        <div className="flex justify-center mb-8">
                                            <input
                                                type="text"
                                                required
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                className="w-full max-w-[300px] px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none text-center text-4xl font-mono tracking-[0.5em] text-gray-800 transition-all"
                                                maxLength={6}
                                                placeholder="••••••"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setWithdrawStep('FORM')}
                                            className="flex-1 py-3 px-6 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                        >
                                            {t('wallet.withdraw_back')}
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-3 px-6 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 shadow-lg shadow-green-500/30 transition-all"
                                        >
                                            {t('wallet.withdraw_confirm')}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-300 transform">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 animate-bounce">
                                <CheckCircle size={48} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('wallet.success_title')}</h3>
                            <p className="text-gray-500 mb-8">
                                {t('wallet.success_desc')}
                            </p>
                            <button
                                onClick={() => setShowSuccess(false)}
                                className="w-full px-6 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                            >
                                {t('wallet.success_btn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletPage;
