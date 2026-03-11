import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, useParams, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './i18n';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Search from './pages/Search';
import PostDetail from './pages/PostDetail';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import CreatePost from './pages/CreatePost';
import SEO from './components/SEO';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPosts from './pages/admin/AdminPosts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminVipPackages from './pages/admin/AdminVipPackages';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminPoints from './pages/admin/AdminPoints';
import Chat from './pages/Chat';
import VipManagement from './pages/VipManagement';
import LoyaltyPage from './pages/LoyaltyPage';
import RedeemPage from './pages/RedeemPage';
import Chatbot from './components/chatbot/Chatbot';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './utils/pathUtils';
import { safeLocalStorage } from './utils/storageUtils';

const LanguageWrapper = () => {
  const { lng } = useParams();
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (lng && SUPPORTED_LANGUAGES.includes(lng)) {
      if (i18n.language !== lng) {
        i18n.changeLanguage(lng);
      }
    }
  }, [lng, i18n]);

  if (!lng || !SUPPORTED_LANGUAGES.includes(lng)) {
    const savedLng = safeLocalStorage.getItem('i18nextLng') || DEFAULT_LANGUAGE;
    const targetLng = SUPPORTED_LANGUAGES.includes(savedLng) ? savedLng : DEFAULT_LANGUAGE;
    const cleanPath = location.pathname.replace(/^\/(vi|en)/, '');
    const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return <Navigate to={`/${targetLng}${finalPath === '/' ? '' : finalPath}${location.search}`} replace />;
  }

  return (
    <>
      <SEO />
      <Outlet />
    </>
  );
};

// Catch-all redirect for routes without language prefix
const RootRedirect = () => {
  const location = useLocation();
  const savedLng = safeLocalStorage.getItem('i18nextLng') || DEFAULT_LANGUAGE;
  const targetLng = SUPPORTED_LANGUAGES.includes(savedLng) ? savedLng : DEFAULT_LANGUAGE;

  // If the path already starts with a supported language, don't redirect again
  const firstSegment = location.pathname.split('/')[1];
  if (SUPPORTED_LANGUAGES.includes(firstSegment)) {
    return null; // Let the other routes handle it
  }

  return <Navigate to={`/${targetLng}${location.pathname}${location.search}`} replace />;
};

const MainLayout = () => {
  const location = useLocation();
  const isChatPage = location.pathname.includes('/chat');
  const isProfilePage = location.pathname.includes('/profile');
  const isLoyaltyPage = location.pathname.includes('/loyalty');
  const isSearchPage = location.pathname.includes('/buy') || location.pathname.includes('/rent') || location.pathname.includes('/search');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Chatbot />
      {!isChatPage && !isProfilePage && !isLoyaltyPage && !isSearchPage && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={`/${DEFAULT_LANGUAGE}`} replace />} />

        <Route path="/:lng" element={<LanguageWrapper />}>
          {/* Main Application Layout */}
          <Route element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="buy" element={<Search />} />
            <Route path="rent" element={<Search />} />
            <Route path="search" element={<Search />} />

            <Route
              path="post/:id"
              element={
                <ProtectedRoute>
                  <PostDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="user/:userId" element={<UserProfile />} />
            <Route
              path="post-ad"
              element={
                <ProtectedRoute>
                  <CreatePost />
                </ProtectedRoute>
              }
            />
            <Route
              path="chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="vip-management"
              element={
                <ProtectedRoute>
                  <VipManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="loyalty"
              element={
                <ProtectedRoute>
                  <LoyaltyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="loyalty/redeem"
              element={
                <ProtectedRoute>
                  <RedeemPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Admin Layout */}
          <Route
            path="admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="posts" element={<AdminPosts />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="vip" element={<AdminVipPackages />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="withdrawals" element={<AdminWithdrawals />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="points" element={<AdminPoints />} />
          </Route>
        </Route>

        {/* Catch-all for any other path that doesn't start with /lng */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
