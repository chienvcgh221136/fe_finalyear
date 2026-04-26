import LocalizedLink from './common/LocalizedLink';
import { Facebook, Instagram, Twitter, Linkedin, Send, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import HelpModal from './modals/HelpModal';

const Footer = () => {
    const { t } = useTranslation();
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [activeHelpTab, setActiveHelpTab] = useState('help_center');

    const openHelp = (tab: string) => {
        setActiveHelpTab(tab);
        setIsHelpOpen(true);
    };

    return (
        <footer className="footer">
            <div className="w-full px-4 md:px-8">
                {/* Top Section */}
                <div className="footer-top">
                    <div className="grid-4">
                        {/* Column 1: Brand & Desc */}
                        <div>
                            <LocalizedLink to="/" className="logo" style={{ marginBottom: '1.5rem' }}>
                                <div className="logo-icon">
                                    <Package size={20} />
                                </div>
                                <span className="font-bold text-xl">EstateMarket</span>
                            </LocalizedLink>
                            <p className="text-secondary" style={{ marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                {t('footer.description', 'Giúp hàng triệu người tìm được ngôi nhà mơ ước từ năm 2010. Nền tảng giao dịch bất động sản tin cậy nhất.')}
                            </p>
                            <div className="flex gap-4">
                                <a href="https://www.facebook.com/pham.chien.746132" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
                                    <Facebook size={20} color="var(--text-secondary)" />
                                </a>
                                <a href="https://www.instagram.com/cu_cieens/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
                                    <Instagram size={20} color="var(--text-secondary)" />
                                </a>
                                <a href="#" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
                                    <Twitter size={20} color="var(--text-secondary)" />
                                </a>
                                <a href="https://www.linkedin.com/in/pham-chien-120411404/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
                                    <Linkedin size={20} color="var(--text-secondary)" />
                                </a>
                            </div>
                        </div>

                        {/* Column 2: Marketplace */}
                        <div>
                            <h4 className="footer-heading">{t('footer.explore', 'Khám phá')}</h4>
                            <div className="footer-links">
                                <LocalizedLink to="/buy" className="footer-link">{t('common.buy', 'Mua nhà')}</LocalizedLink>
                                <LocalizedLink to="/rent" className="footer-link">{t('common.rent', 'Thuê nhà')}</LocalizedLink>
                                <LocalizedLink to="/post-ad" className="footer-link">{t('common.post_ad', 'Đăng tin')}</LocalizedLink>
                                <LocalizedLink to="/loyalty" className="footer-link">{t('navbar.points', 'Điểm thưởng')}</LocalizedLink>
                            </div>
                        </div>

                        <div>
                            <h4 className="footer-heading">{t('footer.support', 'Hỗ trợ')}</h4>
                            <div className="footer-links">
                                <button onClick={() => openHelp('help_center')} className="footer-link text-left">{t('footer.help_center', 'Trung tâm trợ giúp')}</button>
                                <button onClick={() => openHelp('terms')} className="footer-link text-left">{t('auth.terms', 'Điều khoản dịch vụ')}</button>
                                <button onClick={() => openHelp('privacy')} className="footer-link text-left">{t('auth.privacy_policy', 'Chính sách bảo mật')}</button>
                                <button onClick={() => openHelp('cookie')} className="footer-link text-left">{t('footer.cookie_policy', 'Chính sách Cookie')}</button>

                            </div>
                        </div>

                        {/* Column 4: Newsletter */}
                        <div>
                            <h4 className="footer-heading">{t('footer.newsletter', 'Nhận tin mới')}</h4>
                            <p className="text-secondary" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>{t('footer.newsletter_desc', 'Nhận các tin đăng và ưu đãi mới nhất.')}</p>
                            <form className="newsletter-form">
                                <input
                                    type="email"
                                    placeholder={t('auth.email_placeholder', 'Email của bạn')}
                                    className="newsletter-input"
                                />
                                <button type="submit" className="newsletter-btn">
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="footer-bottom">
                    <p>&copy; 2026 EstateMarket Inc. All rights reserved.</p>
                </div>
            </div>

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                initialTab={activeHelpTab}
            />
        </footer>
    );
};

export default Footer;
