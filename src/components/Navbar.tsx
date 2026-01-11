import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" className="logo">
                    <div className="logo-icon">
                        <Package size={20} />
                    </div>
                    <span>EstateMarket</span>
                </Link>
                <div className="nav-links">
                    <Link to="/buy" className="nav-link">Buy</Link>
                    <Link to="/rent" className="nav-link">Rent</Link>
                    <Link to="/post-ad" className="btn btn-primary">Post Ad</Link>
                    <Link to="/login" className="btn btn-outline">Login</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
