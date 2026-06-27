import { useCallback, useMemo, useState } from 'react';
import { CalendarCheck2, Clock3, Search, ShoppingBag, Star, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/authContextValue';
import { useToast } from '../contexts/ToastContext';
import { api, getErrorMessage } from '../lib/api';
import { displayDate, money } from '../lib/format';
import { useApi } from '../lib/useApi';

const bookingCode = (id) => `ME-${String(id).padStart(5, '0')}`;

export function BookingHistoryPage() {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [preOrders, setPreOrders] = useState({});
  const [reviewsByReservation, setReviewsByReservation] = useState({});
  const [reviewForms, setReviewForms] = useState({});
  const [reviewSavingId, setReviewSavingId] = useState(null);
  const [query, setQuery] = useState('');

  const { data: reservations = [], loading, error } = useApi(
    useCallback(async () => {
      if (!isAuthenticated) return [];
      const { data } = await api.get('/api/reservations/my');
      const reviewsRequest = api.get('/api/reviews/my');

      const settled = await Promise.allSettled(
        data.slice(0, 20).map((res) => api.get(`/api/pre-orders/${res.id}`))
      );

      const nextPreOrders = {};
      settled.forEach((result) => {
        if (result.status === 'fulfilled') {
          nextPreOrders[result.value.data.reservation_id] = result.value.data;
        }
      });
      setPreOrders(nextPreOrders);

      const reviews = await reviewsRequest.then((res) => res.data).catch(() => []);
      setReviewsByReservation(
        Object.fromEntries(reviews.map((review) => [Number(review.reservation_id), review])),
      );
      return data;
    }, [isAuthenticated]),
    isAuthenticated
  );

  const updateReviewForm = (reservationId, field, value) => {
    setReviewForms((cur) => ({
      ...cur,
      [reservationId]: {
        rating: 5,
        comment: '',
        ...cur[reservationId],
        [field]: value,
      },
    }));
  };

  const submitReview = async (event, reservationId) => {
    event.preventDefault();
    const draft = reviewForms[reservationId] || { rating: 5, comment: '' };
    setReviewSavingId(reservationId);

    try {
      const { data } = await api.post('/api/reviews', {
        reservation_id: reservationId,
        rating: Number(draft.rating),
        comment: draft.comment.trim() || undefined,
      });
      setReviewsByReservation((cur) => ({ ...cur, [reservationId]: data }));
      setReviewForms((cur) => {
        const next = { ...cur };
        delete next[reservationId];
        return next;
      });
      toast.success('Cảm ơn bạn đã gửi đánh giá.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReviewSavingId(null);
    }
  };

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
              const review = reviewsByReservation[Number(reservation.id)];
              const reviewDraft = reviewForms[reservation.id] || { rating: 5, comment: '' };
              const canReview = reservation.status === 'COMPLETED' && !review;
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

                  {review ? (
                    <div className="history-review">
                      <div className="history-review-head">
                        <span>
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              size={15}
                              fill={index < Number(review.rating) ? 'currentColor' : 'none'}
                            />
                          ))}
                        </span>
                        <strong>Đánh giá của bạn</strong>
                      </div>
                      {review.comment && <p>{review.comment}</p>}
                      {review.manager_reply && (
                        <blockquote>
                          <span>Phản hồi nhà hàng</span>
                          {review.manager_reply}
                        </blockquote>
                      )}
                    </div>
                  ) : canReview ? (
                    <form className="history-review-form" onSubmit={(event) => submitReview(event, reservation.id)}>
                      <label>
                        Điểm đánh giá
                        <select
                          value={reviewDraft.rating}
                          onChange={(event) => updateReviewForm(reservation.id, 'rating', event.target.value)}
                        >
                          {[5, 4, 3, 2, 1].map((rating) => (
                            <option value={rating} key={rating}>{rating} sao</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Cảm nhận của bạn
                        <textarea
                          value={reviewDraft.comment}
                          onChange={(event) => updateReviewForm(reservation.id, 'comment', event.target.value)}
                          maxLength={1000}
                          placeholder="Món ăn, phục vụ hoặc không gian có điều gì đáng nhớ?"
                        />
                      </label>
                      <button className="gold-button" type="submit" disabled={reviewSavingId === reservation.id}>
                        {reviewSavingId === reservation.id ? 'Đang gửi...' : 'Gửi đánh giá'}
                      </button>
                    </form>
                  ) : null}

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
