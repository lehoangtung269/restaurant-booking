import { useEffect, useState } from 'react';
import { CalendarCheck2, Clock3, MapPin, UsersRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../lib/api';
import { clearBookingDraft } from '../lib/bookingDraft';
import { displayDate, money } from '../lib/format';

const bookingCode = (id) => `ME-${String(id).padStart(5, '0')}`;

export function BookingConfirmationPage() {
  const { reservationId } = useParams();
  const [reservation, setReservation] = useState(null);
  const [preOrder, setPreOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    clearBookingDraft();
    api
      .get(`/api/reservations/${reservationId}`)
      .then(({ data }) => {
        if (!ignore) setReservation(data);
      })
      .catch((err) => {
        if (!ignore) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    api
      .get(`/api/pre-orders/${reservationId}`)
      .then(({ data }) => {
        if (!ignore) setPreOrder(data);
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [reservationId]);

  return (
    <main className="booking-page confirmation-page noise" id="main-content">
      {loading ? (
        <section className="confirmation-card skeleton" />
      ) : error ? (
        <section className="confirmation-card">
          <p className="eyebrow gold">Reservation</p>
          <h1>We could not load this booking.</h1>
          <p className="inline-error">{error}</p>
          <Link className="gold-button" to="/booking/tables">
            Start a new reservation
          </Link>
        </section>
      ) : (
        <section className="confirmation-card">
          <CalendarCheck2 className="confirmation-icon" size={42} />
          <p className="eyebrow gold">Reservation confirmed</p>
          <h1>Your table is ready for the evening.</h1>
          <p>
            Maison Edem has confirmed your booking automatically. Our dining room team will prepare the table before
            your arrival.
          </p>
          <div className="confirmation-code">
            <span>Booking code</span>
            <strong>{bookingCode(reservation.id)}</strong>
          </div>

          <div className="confirmation-details">
            <div>
              <CalendarCheck2 size={18} />
              <span>Date</span>
              <strong>{displayDate(reservation.reservation_date)}</strong>
            </div>
            <div>
              <Clock3 size={18} />
              <span>Arrival</span>
              <strong>{String(reservation.start_time).slice(0, 5)}</strong>
            </div>
            <div>
              <UsersRound size={18} />
              <span>Guests</span>
              <strong>{reservation.guest_count}</strong>
            </div>
            <div>
              <MapPin size={18} />
              <span>Table</span>
              <strong>
                {reservation.table_number} / {reservation.area}
              </strong>
            </div>
          </div>

          {preOrder?.items?.length ? (
            <div className="confirmation-preorder">
              <div className="booking-section-heading">
                <h2>Pre-order</h2>
                <strong>{money(preOrder.total_amount)}</strong>
              </div>
              {preOrder.items.map((item) => (
                <div key={item.id}>
                  <span>
                    {item.quantity} x {item.item_name}
                  </span>
                  <small>{item.notes || 'Prepared as listed'}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="confirmation-no-order">No pre-order was added. You can order with the dining room team.</p>
          )}

          <div className="confirmation-actions">
            <Link className="gold-button" to="/booking/history">
              View booking history
            </Link>
            <Link className="booking-secondary-link" to="/">
              Return home
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
