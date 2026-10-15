import type { MetadataRoute } from 'next';

// Installable app for the shop tablets (floor, kitchen). Temporary icons (vol. 09, step 4); the
// customer sites keep the shop's own logo as icon (layout metadata).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Atable — espace pro',
    short_name: 'Atable',
    description: 'Commandes à table : salle, cuisine et gestion du commerce.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#FFFFFF',
    theme_color: '#1F4D3A',
    lang: 'fr',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
