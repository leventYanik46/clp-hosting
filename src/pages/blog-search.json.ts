import { getBlogSearchIndex } from '~/utils/blog';

export const prerender = true;

export const GET = async () => {
  const searchIndex = await getBlogSearchIndex();

  return new Response(JSON.stringify(searchIndex), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
