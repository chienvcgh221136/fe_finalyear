import React from 'react';
import { Gift, TrendingUp, Users, Award, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EarnPointsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EarnPointsModal: React.FC<EarnPointsModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-3xl w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-2">{t('loyalty.missions.center_title')}</h2>
                        <p className="text-blue-100">{t('loyalty.missions.center_subtitle')}</p>
                    </div>
                    {/* Decorative */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <button onClick={onClose} className="absolute top-6 right-6 text-white/80 hover:text-white transition bg-white/10 p-2 rounded-full backdrop-blur-md z-20">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-6">
                        {/* Currently Active Methods */}
                        <div>
                            <h3 className="text-gray-900 font-bold text-lg mb-4 flex items-center gap-2">
                                <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                                {t('loyalty.missions.available_tasks')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <EarnCard
                                    icon={Gift}
                                    title={t('loyalty.missions.first_deposit_title')}
                                    points="+200"
                                    desc={t('loyalty.missions.first_deposit_desc')}
                                    color="text-indigo-600"
                                    bgColor="bg-indigo-100"
                                    fullWidth
                                    t={t}
                                />
                                <EarnCard
                                    icon={Award}
                                    title={t('loyalty.missions.daily_login_title')}
                                    points="+10"
                                    desc={t('loyalty.missions.daily_login_desc')}
                                    color="text-blue-500"
                                    bgColor="bg-blue-50"
                                    t={t}
                                />
                                <EarnCard
                                    icon={TrendingUp}
                                    title={t('loyalty.missions.new_post_title')}
                                    points="+50"
                                    desc={t('loyalty.missions.new_post_desc')}
                                    color="text-indigo-500"
                                    bgColor="bg-indigo-50"
                                    t={t}
                                />
                                <EarnCard
                                    icon={TrendingUp}
                                    title={t('loyalty.missions.vip_purchase_title')}
                                    points="1:1000"
                                    desc={t('loyalty.missions.vip_purchase_desc')}
                                    color="text-blue-500"
                                    bgColor="bg-blue-50"
                                    t={t}
                                />
                                <EarnCard
                                    icon={Users}
                                    title={t('loyalty.missions.update_profile_title')}
                                    points="+500"
                                    desc={t('loyalty.missions.update_profile_desc')}
                                    color="text-purple-600"
                                    bgColor="bg-purple-50"
                                    t={t}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    >
                        {t('loyalty.missions.btn_understood')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const EarnCard = ({ icon: Icon, title, points, desc, color, bgColor, fullWidth, t }: any) => (
    <div className={`flex items-start gap-4 p-4 rounded-2xl border border-gray-100 hover:shadow-md transition ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
        <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ${bgColor} ${color}`}>
            <Icon size={24} />
        </div>
        <div>
            <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-gray-900">{title}</h4>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bgColor} ${color}`}>{points} {t('loyalty.col_points')}</span>
            </div>
            <p className="text-sm text-gray-500 leading-snug">{desc}</p>
        </div>
    </div>
);

export default EarnPointsModal;
