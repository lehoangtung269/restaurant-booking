import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { money } from '../lib/format';
import { fallbackCategories, fallbackMenuItems, heroImages } from '../data/fallbackData';
import { useSEO } from '../lib/useSEO';

const groupMeta = {
  TASTING: { label: 'Tasting course', badge: '7 course / seasonal' },
  FIRE: { label: 'Fire room', badge: 'Open flame' },
  DESSERT: { label: 'Dessert', badge: 'Sweet herbs' },
  DRINK: { label: 'Botanical drinks', badge: 'Pairings' },
  DRINKS: { label: 'Botanical drinks', badge: 'Pairings' },
};

export function MenuPage() {
  const [active, setActive] = useState('all');
  useSEO({
    title: 'Seasonal Menu',
    description: 'Explore the Maison Edem seasonal tasting menu — fire room plates, desserts and botanical drinks.',
  });
  const categoriesQuery = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => (await api.get('/api/menu/categories')).data,
    retry: false,
  });
  const itemsQuery = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => (await api.get('/api/menu/items')).data,
    retry: false,
  });

  const categories = categoriesQuery.data?.length ? categoriesQuery.data : fallbackCategories;
  const items = itemsQuery.data?.length ? itemsQuery.data : fallbackMenuItems;

  const grouped = useMemo(() => {
    const result = new Map();
    items.forEach((item) => {
      const category = categories.find((cat) => String(cat.id) === String(item.category_id));
      const key = category?.code || item.category_name || 'TASTING';
      if (active !== 'all' && String(key).toLowerCase() !== active) return;
      if (!result.has(key)) result.set(key, []);
      result.get(key).push(item);
    });
    return [...result.entries()];
  }, [active, categories, items]);

  return (
    <main className="noise">
      <section className="menu-hero">
        <div>
          <p className="eyebrow gold">Seasonal tasting</p>
          <h1>Menu of the dark garden</h1>
          <p>
            A complete menu experience for the dining room: tasting courses, fire-room plates, desserts and
            botanical drinks.
          </p>
        </div>
        <div className="menu-hero-image">
          <img src={heroImages.menu} alt="Fine dining menu dish" />
        </div>
      </section>

      <section className="filter-band">
        <button className={active === 'all' ? 'active' : ''} type="button" onClick={() => setActive('all')}>
          All
        </button>
        {categories.map((category) => (
          <button
            className={active === String(category.code).toLowerCase() ? 'active' : ''}
            key={category.id}
            type="button"
            onClick={() => setActive(String(category.code).toLowerCase())}
          >
            {category.name}
          </button>
        ))}
      </section>

      <section className="menu-content-grid">
        <aside>
          <p className="eyebrow leaf">Chef's rhythm</p>
          <h2>Small movements through smoke, herbs and cream.</h2>
          <p>
            Each section can become a standalone order or part of the evening tasting. Prices reflect the current
            backend menu when available.
          </p>
        </aside>

        <div className="menu-groups">
          {grouped.map(([key, groupItems]) => {
            const meta = groupMeta[key] || { label: key, badge: 'Seasonal' };
            return (
              <section className="menu-group" key={key}>
                <div className="menu-group-head">
                  <h3>{meta.label}</h3>
                  <span>{meta.badge}</span>
                </div>
                {groupItems.map((item) => (
                  <article className="menu-row" key={item.id}>
                    <div>
                      <h4>{item.name}</h4>
                      <p>{item.description || 'Seasonal plate from the kitchen.'}</p>
                    </div>
                    <strong>{money(item.price)}</strong>
                  </article>
                ))}
              </section>
            );
          })}
        </div>
      </section>

      <section className="featured-section">
        <div className="section-heading-row">
          <h2>Featured plates</h2>
          <Link className="gold-button" to="/booking/tables">
            Book tasting
          </Link>
        </div>
        <div className="dish-grid">
          {items.slice(0, 3).map((item) => (
            <article className="dish-card" key={item.id}>
              <div className="dish-image">
                <img
                  src={item.image_url || heroImages.menu}
                  alt={item.name}
                  onError={(e) => { e.currentTarget.src = '/placeholder-dish.svg'; }}
                />
              </div>
              <div className="dish-content">
                <h3>{item.name}</h3>
                <p>{item.description || 'A quiet course from the dark garden menu.'}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
