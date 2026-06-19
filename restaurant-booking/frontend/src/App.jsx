import { Outlet, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PrivateRoute, StaffRoute } from './components/PrivateRoute';
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
    <ErrorBoundary>
      <Routes>
        {/* ── Staff portal (no public header/footer) ── */}
        <Route
          path="/staff"
          element={
            <StaffRoute>
              <ErrorBoundary message="The staff portal encountered an error.">
                <StaffPage />
              </ErrorBoundary>
            </StaffRoute>
          }
        />

        {/* ── Public pages with header/footer ── */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />

          {/* Booking — open to all (auth check happens inside BookingPage before confirming) */}
          <Route path="/booking/tables" element={<BookingPage />} />

          {/* Protected — requires CUSTOMER login */}
          <Route
            path="/profile"
            element={
              <PrivateRoute roles={['CUSTOMER']}>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/booking/pre-order/:reservationId"
            element={
              <PrivateRoute roles={['CUSTOMER']}>
                <PreOrderPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/booking/confirm/:reservationId"
            element={
              <PrivateRoute roles={['CUSTOMER']}>
                <BookingConfirmationPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/booking/history"
            element={
              <PrivateRoute roles={['CUSTOMER']}>
                <BookingHistoryPage />
              </PrivateRoute>
            }
          />
        </Route>

        {/* ── Auth pages (no header/footer) ── */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/staff/login" element={<StaffLoginPage />} />
        </Route>

        {/* ── 404 ── */}
        <Route element={<PublicLayout />}>
          <Route path="*" element={<ComingSoonPage title="Page not found" text="Route này chưa tồn tại." />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
