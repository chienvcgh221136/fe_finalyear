import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Linkedin, Send, Package } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="w-full px-4 md:px-8">
                {/* Top Section */}
                <div className="footer-top">
                    <div className="grid-4">
                        {/* Column 1: Brand & Desc */}
                        <div>
                            <Link to="/" className="logo" style={{ marginBottom: '1.5rem' }}>
                                <div className="logo-icon">
                                    <Package size={20} />
                                </div>
                                <span className="font-bold text-xl">EstateMarket</span>
                            </Link>
                            <p className="text-secondary" style={{ marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                Giúp hàng triệu người tìm được ngôi nhà mơ ước từ năm 2010. Nền tảng giao dịch bất động sản tin cậy nhất.
                            </p>
                            <div className="flex gap-4">
                                {/* Placeholders for icons as simple links if needed, or stick to Lucide */}
                                <Facebook size={20} color="var(--text-secondary)" />
                                <Instagram size={20} color="var(--text-secondary)" />
                                <Twitter size={20} color="var(--text-secondary)" />
                                <Linkedin size={20} color="var(--text-secondary)" />
                            </div>
                        </div>

                        {/* Column 2: Marketplace */}
                        <div>
                            <h4 className="footer-heading">Khám phá</h4>
                            <div className="footer-links">
                                <Link to="/buy" className="footer-link">Mua nhà</Link>
                                <Link to="/rent" className="footer-link">Thuê nhà</Link>
                                <Link to="/sell" className="footer-link">Bán nhà</Link>
                                <Link to="/post-ad" className="footer-link">Đăng tin</Link>
                                <Link to="/vip" className="footer-link">Gói VIP</Link>
                            </div>
                        </div>

                        {/* Column 3: Support */}
                        <div>
                            <h4 className="footer-heading">Hỗ trợ</h4>
                            <div className="footer-links">
                                <Link to="/help" className="footer-link">Trung tâm trợ giúp</Link>
                                <Link to="/terms" className="footer-link">Điều khoản dịch vụ</Link>
                                <Link to="/privacy" className="footer-link">Chính sách bảo mật</Link>
                                <Link to="/cookie" className="footer-link">Chính sách Cookie</Link>
                                <Link to="/safety" className="footer-link">Mẹo an toàn</Link>
                            </div>
                        </div>

                        {/* Column 4: Newsletter */}
                        <div>
                            <h4 className="footer-heading">Nhận tin mới</h4>
                            <p className="text-secondary" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Nhận các tin đăng và ưu đãi mới nhất.</p>
                            <form className="newsletter-form">
                                <input
                                    type="email"
                                    placeholder="Email của bạn"
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
        </footer>
    );
};

export default Footer;
