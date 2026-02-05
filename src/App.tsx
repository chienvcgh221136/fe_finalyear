import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
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
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPosts from './pages/admin/AdminPosts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminVipPackages from './pages/admin/AdminVipPackages';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminNotifications from './pages/admin/AdminNotifications';
import Chat from './pages/Chat'; // Added
import VipManagement from './pages/VipManagement'; // Added

const MainLayout = () => {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/chat');
  const isProfilePage = location.pathname.startsWith('/profile');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      {!isChatPage && !isProfilePage && <Footer />}
    </div>
  );
};


function App() {
  return (


    <Router>
      <Routes>
        {/* Main Application Layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/buy" element={<Search />} />
          <Route path="/rent" element={<Search />} />
          <Route path="/search" element={<Search />} />

          <Route
            path="/post/:id"
            element={
              <ProtectedRoute>
                <PostDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route
            path="/post-ad"
            element={
              <ProtectedRoute>
                <CreatePost />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vip-management"
            element={
              <ProtectedRoute>
                <VipManagement />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin Layout */}
        <Route
          path="/admin"
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
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
