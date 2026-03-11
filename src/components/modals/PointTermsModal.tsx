import React from 'react';
import { X, ShieldAlert, Clock, Coins, Info, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PointTermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PointTermsModal: React.FC<PointTermsModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                <ShieldAlert size={28} className="text-yellow-300" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight">{t('loyalty.terms.modal_title')}</h2>
                        </div>
                        <p className="text-blue-100/80 text-sm font-medium">{t('loyalty.terms.modal_subtitle')}</p>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md z-20"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-10">
                        {/* Section 1: Definition */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Info size={20} className="text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">{t('loyalty.terms.section_1_title')}</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed pl-13">
                                {t('loyalty.terms.section_1_desc')}
                                <span className="block mt-2 font-bold text-blue-600">{t('loyalty.terms.section_1_note')}</span>
                            </p>
                        </section>

                        {/* Section 2: Earning Rules */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <Coins size={20} className="text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">{t('loyalty.terms.section_2_title')}</h3>
                            </div>
                            <div className="space-y-3 pl-13">
                                <TermItem title={t('loyalty.missions.vip_purchase_title')} content={t('loyalty.missions.vip_purchase_desc')} />
                                <TermItem title={t('loyalty.missions.first_deposit_title')} content={t('loyalty.missions.first_deposit_desc')} />
                                <TermItem title={t('loyalty.missions.daily_login_title')} content={t('loyalty.missions.daily_login_desc')} />
                                <TermItem title={t('loyalty.missions.new_post_title')} content={t('loyalty.missions.new_post_desc')} />
                                <TermItem title={t('loyalty.missions.update_profile_title')} content={t('loyalty.missions.update_profile_desc')} />
                            </div>
                        </section>

                        {/* Section 3: Expiry Rules */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-amber-50 rounded-lg">
                                    <Clock size={20} className="text-amber-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">{t('loyalty.terms.section_3_title')}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-13">
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <h4 className="font-bold text-amber-900 mb-1">{t('loyalty.terms.term_anniversary_title')}</h4>
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        {t('loyalty.terms.term_anniversary_desc')}
                                    </p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <h4 className="font-bold text-emerald-900 mb-1">{t('loyalty.terms.term_permanent_title')}</h4>
                                    <p className="text-xs text-emerald-700 leading-relaxed">
                                        {t('loyalty.terms.term_permanent_desc')}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 4: Violation Policy */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-50 rounded-lg">
                                    <ShieldAlert size={20} className="text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">{t('loyalty.terms.section_4_title')}</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed mb-4 pl-13">
                                {t('loyalty.terms.section_4_desc')}
                            </p>
                            <div className="space-y-2 pl-13">
                                <TermList index="LEVEL 1" content={t('loyalty.terms.level_1')} />
                                <TermList index="LEVEL 2" content={t('loyalty.terms.level_2')} />
                                <TermList index="LEVEL 3" content={t('loyalty.terms.level_3')} />
                                <TermList index="LEVEL 4" content={t('loyalty.terms.level_4')} />
                                <TermList index="LEVEL 5" content={t('loyalty.terms.level_5')} />
                            </div>
                        </section>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    >
                        {t('loyalty.terms.btn_understood_terms')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const TermItem = ({ title, content }: { title: string, content: string }) => (
    <div className="flex gap-3">
        <CheckCircle2 size={16} className="text-blue-500 mt-1 shrink-0" />
        <div>
            <h4 className="text-sm font-bold text-gray-800">{title}</h4>
            <p className="text-sm text-gray-500">{content}</p>
        </div>
    </div>
);

const TermList = ({ index, content }: { index: string, content: string }) => (
    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
        <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-1 rounded-md uppercase shrink-0">{index}</span>
        <span className="text-sm text-gray-700 font-medium">{content}</span>
    </div>
);

export default PointTermsModal;
