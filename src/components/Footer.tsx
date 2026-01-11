import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Linkedin, Send, Package } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
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
                                Helping million of people find their perfect home since 2010. The most trusted marketplace for real estate.
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
                            <h4 className="footer-heading">Marketplace</h4>
                            <div className="footer-links">
                                <Link to="/buy" className="footer-link">Buy Property</Link>
                                <Link to="/rent" className="footer-link">Rent Property</Link>
                                <Link to="/sell" className="footer-link">Sell Property</Link>
                                <Link to="/post-ad" className="footer-link">Post an Ad</Link>
                                <Link to="/vip" className="footer-link">VIP Memberships</Link>
                            </div>
                        </div>

                        {/* Column 3: Support */}
                        <div>
                            <h4 className="footer-heading">Support</h4>
                            <div className="footer-links">
                                <Link to="/help" className="footer-link">Help Center</Link>
                                <Link to="/terms" className="footer-link">Terms of Service</Link>
                                <Link to="/privacy" className="footer-link">Privacy Policy</Link>
                                <Link to="/cookie" className="footer-link">Cookie Policy</Link>
                                <Link to="/safety" className="footer-link">Safety Tips</Link>
                            </div>
                        </div>

                        {/* Column 4: Newsletter */}
                        <div>
                            <h4 className="footer-heading">Newsletter</h4>
                            <p className="text-secondary" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Get the latest property deals and news in your inbox.</p>
                            <form className="newsletter-form">
                                <input
                                    type="email"
                                    placeholder="Your email address"
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
                    <p>&copy; 2024 EstateMarket Inc. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
