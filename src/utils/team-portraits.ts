import type { ImageFit } from './images-optimization';

/**
 * Deliberate exception to the site-wide image defaults (WebP quality 70, candidates
 * capped at 2x the layout width). Team portraits are the one place we trade bytes
 * for fidelity: quality 90, candidates up to 1440px so 2x/3x screens get native
 * pixels, and `fit: 'cover'` so the CDN returns exactly the requested dimensions
 * instead of letterboxing an image the browser then has to stretch.
 *
 * Used by the bio pages under /our-team/*. The card on /team applies the same
 * policy inline in components/widgets/teamcard.astro, with widths tuned to its box.
 */
const BIO_PORTRAIT_OVERRIDES = {
  widths: [360, 480, 640, 800, 960, 1440],
  quality: 90,
  fit: 'cover' as ImageFit,
};

/** Merge the high-quality overrides into a bio page's `profile.image`. */
export const bioPortraitImage = <T extends object>(image: T | undefined) =>
  image ? { ...image, ...BIO_PORTRAIT_OVERRIDES } : image;
