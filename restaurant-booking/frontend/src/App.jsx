import { Outlet, Route, Routes } from 'react-router-dom';
import { PublicFooter } from './components/PublicFooter';
import { PublicHeader } from './components/PublicHeader';
import { LoginPage, RegisterPage, StaffLoginPage } from './pages/AuthPages';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { BookingHistoryPage } from './pages/BookingHistoryPage';
import { BookingPage } from './pages/BookingPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { PreOrderPage } from './pages/PreOrderPage';
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
        <Route path="/booking/tables" element={<BookingPage />} />
        <Route path="/booking/pre-order/:reservationId" element={<PreOrderPage />} />
        <Route path="/booking/confirm/:reservationId" element={<BookingConfirmationPage />} />
        <Route path="/booking/history" element={<BookingHistoryPage />} />
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
