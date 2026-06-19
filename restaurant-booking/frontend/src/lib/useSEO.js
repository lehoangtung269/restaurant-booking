import { useEffect } from 'react';

const SITE_NAME = 'Maison Edem';
const DEFAULT_DESCRIPTION =
  'Maison Edem — A botanical fine dining room shaped by fire, herbs, fermentation and seasonal produce. Reserve your table online.';

/**
 * useSEO — Dynamically updates the page title and meta description.
 *
 * @param {object} options
 * @param {string} [options.title]       - Page title (will be suffixed with "| Maison Edem")
 * @param {string} [options.description] - Meta description for this page
 *
 * @example
 *   useSEO({ title: 'Reserve a table', description: 'Choose your evening and book your table at Maison Edem.' });
 */
export function useSEO({ title, description } = {}) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const prevContent = metaDesc.getAttribute('content');
    metaDesc.setAttribute('content', description || DEFAULT_DESCRIPTION);

    return () => {
      document.title = prev;
      if (metaDesc) metaDesc.setAttribute('content', prevContent || DEFAULT_DESCRIPTION);
    };
  }, [title, description]);
}
