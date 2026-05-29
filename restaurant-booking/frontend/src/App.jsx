import { Outlet, Route, Routes } from 'react-router-dom';
import { PublicFooter } from './components/PublicFooter';
import { PublicHeader } from './components/PublicHeader';
import { LoginPage, RegisterPage, StaffLoginPage } from './pages/AuthPages';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { ProfilePage } from './pages/ProfilePage';
import { StaffPage } from './pages/StaffPage';

function PublicLayout() {
  return (
    <>
      <PublicHeader />
      <Outlet />
      <PublicFooter />
    </>
  );
}

function AuthLayout() {
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/staff" element={<StaffPage />} />

      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/booking/tables"
          element={
            <ComingSoonPage
              title="Booking flow"
              text="Phan tiep theo se dung /api/tables/availability de chon ban va tao reservation."
            />
          }
        />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/staff/login" element={<StaffLoginPage />} />
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="*" element={<ComingSoonPage title="Page not found" text="Route nay chua ton tai." />} />
      </Route>
    </Routes>
  );
}
