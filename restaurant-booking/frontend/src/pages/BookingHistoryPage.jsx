import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, Clock3, Search, ShoppingBag, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/authContextValue';
import { api, getErrorMessage } from '../lib/api';
import { displayDate, money } from '../lib/format';

const bookingCode = (id) => `ME-${String(id).padStart(5, '0')}`;

export function BookingHistoryPage() {
  const { isAuthenticated } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [preOrders, setPreOrders] = useState({});
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    let ignore = false;
    const loadHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/api/reservations/my');
        if (ignore) return;
        setReservations(data);

        const settled = await Promise.allSettled(
          data.slice(0, 20).map((reservation) => api.get(`/api/pre-orders/${reservation.id}`)),
        );
        if (ignore) return;

        const nextPreOrders = {};
        settled.forEach((result) => {
          if (result.status === 'fulfilled') {
            nextPreOrders[result.value.data.reservation_id] = result.value.data;
          }
        });
        setPreOrders(nextPreOrders);
      } catch (err) {
        if (!ignore) setError(getErrorMessage(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadHistory();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return reservations;
    return reservations.filter((reservation) =>
      [
        bookingCode(reservation.id),
        reservation.table_number,
        reservation.area,
        reservation.status,
        reservation.reservation_date,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [query, reservations]);

  if (!isAuthenticated) {
    return (
      <main className="booking-page booking-history-page noise" id="main-content">
        <section className="confirmation-card">
          <p className="eyebrow gold">Booking history</p>
          <h1>Sign in to see your reservations.</h1>
          <p>Your Maison Edem account keeps the booking code, table details and pre-order summary together.</p>
          <div className="confirmation-actions">
            <Link className="gold-button" to="/login?returnTo=/booking/history">
              Sign in
            </Link>
            <Link className="booking-secondary-link" to="/register?returnTo=/booking/history">
              Create account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-page booking-history-page noise" id="main-content">
      <section className="booking-intro">
        <p className="eyebrow gold">Booking history</p>
        <h1>Your reservations</h1>
        <p>Review confirmed tables, booking codes and any dishes prepared before arrival.</p>
      </section>

      <section className="history-shell">
        <div className="history-toolbar">
          <div className="booking-input-wrap history-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search code, table, status"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Link className="gold-button" to="/booking/tables">
            New reservation
          </Link>
        </div>

        {error && <p className="inline-error">{error}</p>}

        {loading ? (
          <div className="history-list">
            {[1, 2, 3].map((item) => (
              <div className="history-card skeleton" key={item} />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="history-list">
            {filtered.map((reservation) => {
              const preOrder = preOrders[reservation.id];
              return (
                <article className="history-card" key={reservation.id}>
                  <div className="history-card-main">
                    <div>
                      <p className="eyebrow leaf">{bookingCode(reservation.id)}</p>
                      <h2>
                        {reservation.table_number} / {reservation.area}
                      </h2>
                    </div>
                    <span className={`status-pill status-${String(reservation.status).toLowerCase()}`}>
                      {reservation.status}
                    </span>
                  </div>

                  <div className="history-meta">
                    <span>
                      <CalendarCheck2 size={16} />
                      {displayDate(reservation.reservation_date)}
                    </span>
                    <span>
                      <Clock3 size={16} />
                      {String(reservation.start_time).slice(0, 5)}
                    </span>
                    <span>
                      <UsersRound size={16} />
                      {reservation.guest_count} guests
                    </span>
                  </div>

                  {preOrder?.items?.length ? (
                    <div className="history-preorder">
                      <div>
                        <ShoppingBag size={16} />
                        <strong>{preOrder.items.length} pre-order dishes</strong>
                      </div>
                      <span>{money(preOrder.total_amount)}</span>
                    </div>
                  ) : (
                    <p className="history-no-preorder">No pre-order dishes saved.</p>
                  )}

                  <div className="history-actions">
                    <Link className="booking-secondary-link" to={`/booking/confirm/${reservation.id}`}>
                      View reservation
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="booking-empty history-empty">
            <strong>No reservation found.</strong>
            <p>Try another booking code or create a new reservation.</p>
          </div>
        )}
      </section>
    </main>
  );
}
