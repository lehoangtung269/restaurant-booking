import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { money } from '../lib/format';
import { fallbackMenuItems, fallbackReviews, heroImages } from '../data/fallbackData';
import { useSEO } from '../lib/useSEO';

const tastingPaths = [
  {
    title: 'Garden opening',
    description:
      'The evening begins with raw, clean flavours — young herbs picked that morning, chilled broths, citrus snow and micro greens that awaken the palate before the fire courses arrive.',
    image:
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80',
    menuFilter: 'tasting',
  },
  {
    title: 'Fire and smoke',
    description:
      'The second chapter moves to the open flame — aged beef, ember-cooked duck and smoked marrow sauce. Every plate carries the warmth and depth of our fire room.',
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    menuFilter: 'fire',
  },
  {
    title: 'Cellar sauces',
    description:
      'Slow reductions, aged vinegars, fermented pastes — our cellar holds the concentrated essence of every season. These sauces tie the fire courses to the garden courses.',
    image:
      'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=600&q=80',
    menuFilter: 'tasting',
  },
  {
    title: 'Sweet herbs',
    description:
      'The final path is gentle: poached fruit, toasted hay, malt cream, edible flowers. Desserts that feel like an extension of the garden rather than an indulgence.',
    image:
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
    menuFilter: 'dessert',
  },
];

function usePreviewData() {
  const menuQuery = useQuery({
    queryKey: ['home-menu-preview'],
    queryFn: async () => (await api.get('/api/menu/items')).data,
    retry: false,
  });
  const reviewQuery = useQuery({
    queryKey: ['home-reviews'],
    queryFn: async () => (await api.get('/api/reviews?limit=3')).data,
    retry: false,
  });

  return {
    menu: menuQuery.data?.length ? menuQuery.data.slice(0, 3) : fallbackMenuItems.slice(1, 4),
    reviews: reviewQuery.data?.length ? reviewQuery.data.slice(0, 2) : fallbackReviews,
  };
}

export function HomePage() {
  const { menu, reviews } = usePreviewData();
  const [activePath, setActivePath] = useState(null);
  useSEO({
    title: 'Fine Dining Restaurant',
    description: 'Maison Edem — A botanical dining room shaped by fire, herbs, fermentation and seasonal produce. Reserve your table online.',
  });

  return (
    <main className="noise">
      <section className="hero-section">
        <div className="floating-leaf leaf-one" />
        <div className="floating-leaf leaf-two" />
        <div className="floating-leaf leaf-three" />

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow gold">Fine dining restaurant</p>
            <p>A botanical dining room shaped by fire, herbs, fermentation and seasonal produce.</p>
          </div>

          <div className="hero-title-wrap">
            <p className="eyebrow leaf">New seasonal menu</p>
            <h1 className="hero-title">
              EDEN
              <span>AFTER</span>
              <span>DARK</span>
            </h1>
            <div className="hero-actions">
              <Link className="gold-button" to="/booking/tables">
                Reserve now
              </Link>
              <Link className="ghost-button" to="/menu">
                Explore menu
              </Link>
            </div>
          </div>

          <div className="hero-image-mask">
            <img src={heroImages.plate} alt="Dark fine dining plate" />
          </div>
        </div>
      </section>

      <section className="marquee-band">
        <div className="marquee-track">
          <span>Seasonal tasting</span>
          <span>Botanical cocktails</span>
          <span>Fire room</span>
          <span>Private dining</span>
          <span>Late supper</span>
          <span>Seasonal tasting</span>
          <span>Botanical cocktails</span>
          <span>Fire room</span>
          <span>Private dining</span>
          <span>Late supper</span>
        </div>
      </section>

      <section id="story" className="section-grid story-section">
        <div>
          <p className="eyebrow gold">Our story</p>
          <h2>A wild garden, served with restraint.</h2>
        </div>
        <div className="body-copy">
          <p>
            Maison Edem is built around contrast: a dark room, warm light, fragrant herbs and plates that move
            between raw freshness and open fire depth.
          </p>
          <div className="gold-line" />
          <p>Every course is arranged as a chapter. Leaves, smoke, citrus and aged sauces appear quietly.</p>
        </div>
      </section>

      <section className="atmosphere-section">
        <div className="wide-image">
          <img src={heroImages.interior} alt="Restaurant interior" />
        </div>
        <div>
          <p className="eyebrow leaf">Atmosphere</p>
          <h2>Low light. Slow service. Sharp details.</h2>
          <p className="body-copy">
            The room is intimate by design: dark timber, linen, bronze, candlelight and a clear view into the pass.
          </p>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow gold">Signature plates</p>
            <h2>Menu fragments</h2>
          </div>
          <p>A preview of the tasting format. The real menu changes with market produce and fermentation calendar.</p>
        </div>
        <div className="dish-grid">
          {menu.map((item, index) => (
            <article className={`dish-card ${index === 1 ? 'dish-card--lower' : ''}`} key={item.id}>
              <div className="dish-image">
                <img
                  src={item.image_url || fallbackMenuItems[index]?.image_url || '/placeholder-dish.svg'}
                  alt={item.name}
                  onError={(e) => { e.currentTarget.src = '/placeholder-dish.svg'; }}
                />
              </div>
              <div className="dish-content">
                <div>
                  <h3>{item.name}</h3>
                  <strong>{money(item.price)}</strong>
                </div>
                <p>{item.description || 'Seasonal plate from the Maison Edem kitchen.'}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="tasting-band">
        <div>
          <p className="eyebrow leaf">Tasting structure</p>
          <h2>Four paths through the evening.</h2>
        </div>
        <div className="menu-lines">
          {tastingPaths.map((path, index) => {
            const isOpen = activePath === index;
            return (
              <div className={`menu-line-wrap ${isOpen ? 'menu-line-wrap--open' : ''}`} key={path.title}>
                <button
                  className="menu-line menu-line--interactive"
                  type="button"
                  onClick={() => setActivePath(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span>{path.title}</span>
                  <div className="menu-line-right">
                    <small>{String(index + 1).padStart(2, '0')}</small>
                    <span className={`menu-line-icon ${isOpen ? 'menu-line-icon--open' : ''}`}>+</span>
                  </div>
                </button>
                <div className={`menu-line-panel ${isOpen ? 'menu-line-panel--open' : ''}`}>
                  <div className="menu-line-panel-inner">
                    <div className="menu-line-panel-image">
                      <img src={path.image} alt={path.title} />
                    </div>
                    <div className="menu-line-panel-content">
                      <p>{path.description}</p>
                      <Link className="gold-button" to={`/menu`}>
                        View on menu →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="reserve-panel-section">
        <div className="reserve-panel">
          <div>
            <p className="eyebrow gold">Reservations</p>
            <h2>Book the dark garden table.</h2>
            <p>
              Choose an evening, share your guest count and we will confirm the table with the seasonal tasting
              proposal.
            </p>
          </div>
          <div className="review-stack">
            {reviews.map((review) => (
              <blockquote key={review.id}>
                <p>{review.comment}</p>
                <cite>{review.customer_name || review.user_name || 'Maison guest'}</cite>
              </blockquote>
            ))}
            <Link className="gold-button" to="/booking/tables">
              Request table
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
