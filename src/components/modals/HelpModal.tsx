import React, { useState } from 'react';
import { X, HelpCircle, Shield, Lock, Info, Mail, ChevronRight, ShieldCheck, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: string;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, initialTab = 'help_center' }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(initialTab);

    if (!isOpen) return null;

    const tabs = [
        { id: 'help_center', label: t('footer_modal.tabs.help_center', 'Trung tâm trợ giúp'), icon: HelpCircle },
        { id: 'terms', label: t('footer_modal.tabs.terms', 'Điều khoản'), icon: Shield },
        { id: 'privacy', label: t('footer_modal.tabs.privacy', 'Chính sách bảo mật'), icon: Lock },
        { id: 'cookie', label: t('footer_modal.tabs.cookie', 'Chính sách Cookie'), icon: Info },
        { id: 'safety', label: t('footer_modal.tabs.safety', 'Mẹo an toàn'), icon: ShieldCheck },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'help_center':
                return (
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 mb-6">
                            <h3 className="text-xl font-bold text-blue-900 mb-2">{t('footer_modal.content.help_center_title', 'Chào mừng bạn đến với trung tâm trợ giúp')}</h3>
                            <p className="text-blue-700 leading-relaxed">
                                {t('footer_modal.content.help_center_desc', 'Chúng tôi ở đây để giúp bạn có trải nghiệm mua bán bất động sản an toàn và hiệu quả nhất.')}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                                <h4 className="font-bold mb-1">Cần hỗ trợ về tài khoản?</h4>
                                <p className="text-sm text-gray-500">Hướng dẫn đăng ký, đăng nhập và bảo mật thông tin.</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                                <h4 className="font-bold mb-1">Giao dịch & Thanh toán?</h4>
                                <p className="text-sm text-gray-500">Tìm hiểu về nạp tiền, ví điện tử và rút tiền.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'terms':
                return (
                    <div className="prose prose-blue max-w-none">
                        <h3 className="text-xl font-bold mb-4">{t('footer_modal.content.terms_title', 'Điều khoản sử dụng')}</h3>
                        <p className="text-gray-600 mb-4">{t('footer_modal.content.terms_desc', 'Bằng việc sử dụng dụng EstateMarket, bạn đồng ý tuân thủ các quy định...')}</p>
                        <ul className="space-y-2 text-gray-600 list-disc pl-5">
                            <li>Quy định về việc đăng tin chính xác, không spam.</li>
                            <li>Trách nhiệm của người bán và người mua.</li>
                            <li>Chính sách xử lý vi phạm điểm thưởng và khóa tài khoản.</li>
                        </ul>
                    </div>
                );
            case 'privacy':
                return (
                    <div className="prose prose-blue max-w-none">
                        <h3 className="text-xl font-bold mb-4">{t('footer_modal.content.privacy_title', 'Chính sách bảo mật')}</h3>
                        <p className="text-gray-600">{t('footer_modal.content.privacy_desc', 'Chúng tôi cam kết bảo mật thông tin cá nhân và dữ liệu giao dịch của bạn.')}</p>
                    </div>
                );
            case 'cookie':
                return (
                    <div className="prose prose-blue max-w-none">
                        <h3 className="text-xl font-bold mb-4">{t('footer_modal.content.cookie_title', 'Chính sách Cookie')}</h3>
                        <p className="text-gray-600">{t('footer_modal.content.cookie_desc', 'Hệ thống sử dụng Cookie để ghi nhớ phiên đăng nhập và tùy chọn của bạn.')}</p>
                    </div>
                );
            case 'safety':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                            <ShieldCheck className="text-yellow-600" size={32} />
                            <div>
                                <h3 className="font-bold text-yellow-900">{t('footer_modal.content.safety_title', 'Hướng dẫn giao dịch an toàn')}</h3>
                                <p className="text-sm text-yellow-700">{t('footer_modal.content.safety_desc', 'Hãy luôn kiểm tra giấy tờ pháp lý chính chủ trước khi giao dịch.')}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[
                                "Luôn gặp mặt trực tiếp tại nơi công cộng.",
                                "Yêu cầu xem bản gốc giấy tờ nhà đất.",
                                "Không chuyển tiền/đặt cọc khi chưa xác thực thông tin.",
                                "Cẩn thận với những tin đăng có giá rẻ bất thường."
                            ].map((tip, idx) => (
                                <div key={idx} className="flex gap-3 items-start">
                                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">{idx + 1}</div>
                                    <p className="text-gray-600 text-sm leading-relaxed">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md" 
                onClick={onClose}
            ></motion.div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[2.5rem] w-full max-w-4xl relative z-10 overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh] md:h-[700px]"
            >
                {/* Sidebar */}
                <div className="w-full md:w-80 bg-gray-50 border-r border-gray-100 flex flex-col">
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <HelpCircle size={24} />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-gray-900">{t('footer_modal.title', 'Hỗ trợ')}</h2>
                        </div>

                        <div className="space-y-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                                            activeTab === tab.id 
                                            ? 'bg-white text-blue-600 shadow-md shadow-gray-200/50' 
                                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                        }`}
                                    >
                                        <Icon size={20} className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'} />
                                        <span className="font-bold text-sm tracking-wide">{tab.label}</span>
                                        {activeTab === tab.id && <motion.div layoutId="activeDot" className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-auto" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-auto p-6">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-3xl text-white relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="p-2 bg-white/20 rounded-lg w-fit mb-3">
                                    <Mail size={18} />
                                </div>
                                <h4 className="font-bold text-sm mb-1">{t('footer_modal.contact_info', 'Liên hệ Admin')}</h4>
                                <p className="text-[10px] text-blue-100/70 mb-3 leading-relaxed">Cần hỗ trợ trực tiếp? Hãy gửi mail cho chúng tôi!</p>
                                <a 
                                    href="mailto:chienboybu1092004@gmail.com" 
                                    className="block w-full py-2 bg-white text-blue-600 text-center rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors"
                                >
                                    chienboybu1092004@gmail.com
                                </a>
                            </div>
                            <Mail className="absolute -right-4 -bottom-4 text-white/10 group-hover:rotate-12 transition-transform duration-500" size={80} />
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    <div className="flex items-center justify-between p-6 border-b border-gray-50">
                        <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                            <span>{t('footer_modal.title', 'Hỗ trợ')}</span>
                            <ChevronRight size={12} />
                            <span className="text-blue-600">{tabs.find(t => t.id === activeTab)?.label}</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-all duration-300"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderContent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer Info */}
                    <div className="p-6 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400 font-medium">
                        <div className="flex items-center gap-1">
                            <Shield size={12} />
                            <span>Bảo mật bởi EstateMarket AI</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Heart size={12} className="text-red-400" />
                            <span>Cảm ơn bạn đã tin tưởng</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default HelpModal;
