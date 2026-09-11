import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../lib/api';
import { money } from '../lib/format';

export function PreOrderPage() {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    Promise.all([api.get(`/api/reservations/${reservationId}`), api.get('/api/menu/items')])
      .then(([reservationRes, menuRes]) => {
        if (ignore) return;
        setReservation(reservationRes.data);
        setItems(menuRes.data.filter((item) => item.is_available === true));
      })
      .catch((err) => {
        if (!ignore) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [reservationId]);

  const selectedItems = useMemo(
    () =>
      items
        .filter((item) => cart[item.id]?.quantity > 0)
        .map((item) => ({ ...item, quantity: cart[item.id].quantity, notes: cart[item.id].notes || '' })),
    [cart, items],
  );

  const total = selectedItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const updateItem = (id, patch) => {
    setCart((current) => ({
      ...current,
      [id]: { quantity: 0, notes: '', ...current[id], ...patch },
    }));
  };

  const changeQuantity = (item, delta) => {
    const next = Math.max(0, (cart[item.id]?.quantity || 0) + delta);
    updateItem(item.id, { quantity: next });
  };

  const submit = async () => {
    if (!selectedItems.length) {
      setError('Choose at least one dish or continue without a pre-order.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/api/pre-orders', {
        reservation_id: Number(reservationId),
        items: selectedItems.map((item) => ({
          menu_item_id: Number(item.id),
          quantity: item.quantity,
          notes: item.notes.trim() || undefined,
        })),
      });
      navigate(`/booking/confirm/${reservationId}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="booking-page noise" id="main-content">
      <section className="booking-intro preorder-intro">
        <p className="eyebrow gold">Optional pre-order</p>
        <h1>Prepare the first courses</h1>
        <p>Your table is confirmed. Add dishes now or continue directly to the reservation summary.</p>
      </section>

      <section className="preorder-shell">
        <div className="preorder-menu">
          <div className="booking-section-heading">
            <div>
              <p className="eyebrow leaf">Kitchen selection</p>
              <h2>Available dishes</h2>
            </div>
            <UtensilsCrossed size={20} />
          </div>
          {error && <p className="inline-error">{error}</p>}
          {loading ? (
            <div className="preorder-grid">
              {[1, 2, 3, 4].map((item) => (
                <div className="preorder-card skeleton" key={item} />
              ))}
            </div>
          ) : items.length ? (
            <div className="preorder-grid">
              {items.map((item) => {
                const quantity = cart[item.id]?.quantity || 0;
                return (
                  <article className="preorder-card" key={item.id}>
                    <div className="preorder-card-copy">
                      <h3>{item.name}</h3>
                      <p>{item.description || 'Seasonal preparation from the Maison Edem kitchen.'}</p>
                      <strong>{money(item.price)}</strong>
                    </div>
                    <div className="quantity-control">
                      <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => changeQuantity(item, -1)}>
                        <Minus size={15} />
                      </button>
                      <span>{quantity}</span>
                      <button type="button" aria-label={`Add one ${item.name}`} onClick={() => changeQuantity(item, 1)}>
                        <Plus size={15} />
                      </button>
                    </div>
                    {quantity > 0 && (
                      <label>
                        <span>Kitchen note</span>
                        <input
                          maxLength="255"
                          placeholder="Optional note for this dish"
                          value={cart[item.id]?.notes || ''}
                          onChange={(event) => updateItem(item.id, { notes: event.target.value })}
                        />
                      </label>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="booking-empty">
              <strong>No dishes are currently available.</strong>
              <p>You can continue without a pre-order and complete your reservation.</p>
            </div>
          )}
        </div>

        <aside className="booking-summary preorder-summary">
          <ShoppingBag size={22} />
          <p className="eyebrow gold">Pre-order summary</p>
          <h2>{selectedItems.length ? `${selectedItems.length} selected` : 'No dishes yet'}</h2>
          {reservation && (
            <p className="preorder-reservation">
              {reservation.table_number} / {String(reservation.start_time).slice(0, 5)}
            </p>
          )}
          <div className="preorder-summary-list">
            {selectedItems.map((item) => (
              <div key={item.id}>
                <span>
                  {item.quantity} x {item.name}
                </span>
                <strong>{money(Number(item.price) * item.quantity)}</strong>
              </div>
            ))}
          </div>
          <div className="preorder-total">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          <button className="gold-button full" type="button" disabled={submitting || !selectedItems.length} onClick={submit}>
            {submitting ? 'Saving...' : 'Save pre-order'}
          </button>
          <Link className="booking-secondary-link" to={`/booking/confirm/${reservationId}`}>
            Continue without pre-order
          </Link>
        </aside>
      </section>
    </main>
  );
}
