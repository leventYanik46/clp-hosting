import type { PaginateFunction } from 'astro';
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Post } from '~/types';
import { APP_BLOG } from 'astrowind:config';
import { cleanSlug, trimSlash, BLOG_BASE, POST_PERMALINK_PATTERN, CATEGORY_BASE, TAG_BASE } from './permalinks';
import { supportedLang } from '~/utils/lib/languageParser';
import config from '~/config/config.json';

const generatePermalink = async ({
  id,
  slug,
  publishDate,
  category,
}: {
  id: string;
  slug: string;
  publishDate: Date;
  category: string | undefined;
}) => {
  const year = String(publishDate.getFullYear()).padStart(4, '0');
  const month = String(publishDate.getMonth() + 1).padStart(2, '0');
  const day = String(publishDate.getDate()).padStart(2, '0');
  const hour = String(publishDate.getHours()).padStart(2, '0');
  const minute = String(publishDate.getMinutes()).padStart(2, '0');
  const second = String(publishDate.getSeconds()).padStart(2, '0');

  const permalink = POST_PERMALINK_PATTERN.replace('%slug%', slug)
    .replace('%id%', id)
    .replace('%category%', category || '')
    .replace('%year%', year)
    .replace('%month%', month)
    .replace('%day%', day)
    .replace('%hour%', hour)
    .replace('%minute%', minute)
    .replace('%second%', second);

  return permalink
    .split('/')
    .map((el) => trimSlash(el))
    .filter((el) => !!el)
    .join('/');
};

const getNormalizedPost = async (post: CollectionEntry<'post'>): Promise<Post> => {
  const { id, slug: rawSlug = '', data } = post;
  const { Content, remarkPluginFrontmatter } = await post.render();

  const {
    publishDate: rawPublishDate = new Date(),
    updateDate: rawUpdateDate,
    title,
    excerpt,
    image,
    tags: rawTags = [],
    category: rawCategory,
    author,
    draft = false,
    // allow editors to set a language or array of languages on the post frontmatter
    lang: rawLang = undefined,
    metadata = {},
  } = data;

  const slug = cleanSlug(rawSlug); // cleanSlug(rawSlug.split('/').pop());
  const publishDate = new Date(rawPublishDate);
  const updateDate = rawUpdateDate ? new Date(rawUpdateDate) : undefined;

  const category = rawCategory
    ? {
        slug: cleanSlug(rawCategory),
        title: rawCategory,
      }
    : undefined;

  const tags = rawTags.map((tag: string) => ({
    slug: cleanSlug(tag),
    title: tag,
  }));

  return {
    id: id,
    slug: slug,
    permalink: await generatePermalink({ id, slug, publishDate, category: category?.slug }),

    publishDate: publishDate,
    updateDate: updateDate,

    title: title,
    excerpt: excerpt,
    image: image,

    category: category,
    tags: tags,
    author: author,

    draft: draft,

    metadata,

    Content: Content,
    // or 'content' in case you consume from API

    readingTime: remarkPluginFrontmatter?.readingTime,
    // normalize lang to either a string or array
    lang: rawLang,
  };
};

const load = async function (): Promise<Array<Post>> {
  const posts = await getCollection('post');
  const normalizedPosts = posts.map(async (post) => await getNormalizedPost(post));

  const results = (await Promise.all(normalizedPosts))
    .sort((a, b) => b.publishDate.valueOf() - a.publishDate.valueOf())
    .filter((post) => !post.draft);

  return results;
};

let _posts: Array<Post>;

/** */
export const isBlogEnabled = APP_BLOG.isEnabled;
export const isRelatedPostsEnabled = APP_BLOG.isRelatedPostsEnabled;
export const isBlogListRouteEnabled = APP_BLOG.list.isEnabled;
export const isBlogPostRouteEnabled = APP_BLOG.post.isEnabled;
export const isBlogCategoryRouteEnabled = APP_BLOG.category.isEnabled;
export const isBlogTagRouteEnabled = APP_BLOG.tag.isEnabled;

export const blogListRobots = APP_BLOG.list.robots;
export const blogPostRobots = APP_BLOG.post.robots;
export const blogCategoryRobots = APP_BLOG.category.robots;
export const blogTagRobots = APP_BLOG.tag.robots;

export const blogPostsPerPage = APP_BLOG?.postsPerPage;

/** */
export const fetchPosts = async (): Promise<Array<Post>> => {
  if (!_posts) {
    _posts = await load();
  }

  return _posts;
};

/** */
export const findPostsBySlugs = async (slugs: Array<string>): Promise<Array<Post>> => {
  if (!Array.isArray(slugs)) return [];

  const posts = await fetchPosts();

  return slugs.reduce(function (r: Array<Post>, slug: string) {
    posts.some(function (post: Post) {
      return slug === post.slug && r.push(post);
    });
    return r;
  }, []);
};

/** */
export const findPostsByIds = async (ids: Array<string>): Promise<Array<Post>> => {
  if (!Array.isArray(ids)) return [];

  const posts = await fetchPosts();

  return ids.reduce(function (r: Array<Post>, id: string) {
    posts.some(function (post: Post) {
      return id === post.id && r.push(post);
    });
    return r;
  }, []);
};

/** */
export const findLatestPosts = async ({ count }: { count?: number }): Promise<Array<Post>> => {
  const _count = count || 4;
  const posts = await fetchPosts();

  return posts ? posts.slice(0, _count) : [];
};

/** */
export const getStaticPathsBlogList = async ({ paginate }: { paginate: PaginateFunction }) => {
  if (!isBlogEnabled || !isBlogListRouteEnabled) return [];
  const posts = await fetchPosts();

  const defaultLang = config.settings.default_language;
  const languages = supportedLang; // e.g. ["", "en", "tr"] when default is root
  console.log('getStaticPathsBlogList languages', languages);

  return languages.flatMap((langPrefix) => {
    const langCode = langPrefix === '' ? defaultLang : langPrefix;
    const filtered = posts.filter((post) => {
      const postLang = post.lang;
      if (Array.isArray(postLang)) return postLang.includes(langCode);
      if (typeof postLang === 'string') return postLang === langCode;
      return langCode === defaultLang;
    });

    const blogParam = BLOG_BASE ? (langPrefix ? `${langPrefix}/${BLOG_BASE}` : `${BLOG_BASE}`) : undefined;

    return paginate(filtered, {
      params: { blog: blogParam },
      pageSize: blogPostsPerPage,
      props: { lang: langCode },
    });
  });
};

/** */
export const getStaticPathsBlogPost = async () => {
  if (!isBlogEnabled || !isBlogPostRouteEnabled) return [];
  const posts = await fetchPosts();
  const defaultLang = config.settings.default_language;
  const defaultLangInSubdir = config.settings.default_language_in_subdir;
  return posts.flatMap((post) => {
    const postLang = post.lang;
    const langs = Array.isArray(postLang) ? postLang : postLang ? [postLang] : [defaultLang];
    const prefixes = langs.map((code) => {
      if (code === defaultLang && !defaultLangInSubdir) return '';
      return code;
    });

    return prefixes.map((prefix) => ({
      params: {
        blog: prefix ? `${prefix}/${post.permalink}` : post.permalink,
      },
      props: { post, lang: prefix === '' ? defaultLang : prefix, pathPrefix: prefix },
    }));
  });
};

/** */
export const getStaticPathsBlogCategory = async ({ paginate }: { paginate: PaginateFunction }) => {
  if (!isBlogEnabled || !isBlogCategoryRouteEnabled) return [];

  const posts = await fetchPosts();
  const categories = {};
  posts.map((post) => {
    if (post.category?.slug) {
      categories[post.category?.slug] = post.category;
    }
  });

  const defaultLang = config.settings.default_language;
  return Array.from(Object.keys(categories)).flatMap((categorySlug) => {
    // derive set of language codes present in posts, fallback to default
    const langCodes = Array.from(
      new Set(
        posts.flatMap((p) => {
          const pl = p.lang;
          if (Array.isArray(pl)) return pl;
          if (typeof pl === 'string') return [pl];
          return [defaultLang];
        })
      )
    );

    const prefixes = langCodes.map((code) => (code === defaultLang ? '' : code));

    return prefixes.flatMap((prefix) =>
      paginate(
        posts.filter((post) => {
          if (!post.category?.slug || categorySlug !== post.category.slug) return false;
          const postLang = post.lang;
          const code = prefix === '' ? defaultLang : prefix;
          if (Array.isArray(postLang)) return postLang.includes(code);
          if (typeof postLang === 'string') return postLang === code;
          return code === defaultLang;
        }),
        {
          params: { category: categorySlug, blog: CATEGORY_BASE ? (prefix ? `${prefix}/${CATEGORY_BASE}` : `${CATEGORY_BASE}`) : undefined },
          pageSize: blogPostsPerPage,
          props: { category: categories[categorySlug], lang: prefix === '' ? defaultLang : prefix },
        }
      )
    );
  });
};

/** */
export const getStaticPathsBlogTag = async ({ paginate }: { paginate: PaginateFunction }) => {
  if (!isBlogEnabled || !isBlogTagRouteEnabled) return [];

  const posts = await fetchPosts();
  const tags = {};
  posts.map((post) => {
    if (Array.isArray(post.tags)) {
      post.tags.map((tag) => {
        tags[tag?.slug] = tag;
      });
    }
  });

  const defaultLang = config.settings.default_language;
  return Array.from(Object.keys(tags)).flatMap((tagSlug) => {
    const langCodes = Array.from(
      new Set(
        posts.flatMap((p) => {
          const pl = p.lang;
          if (Array.isArray(pl)) return pl;
          if (typeof pl === 'string') return [pl];
          return [defaultLang];
        })
      )
    );

    const prefixes = langCodes.map((code) => (code === defaultLang ? '' : code));

    return prefixes.flatMap((prefix) =>
      paginate(
        posts.filter((post) => {
          if (!Array.isArray(post.tags) || !post.tags.find((elem) => elem.slug === tagSlug)) return false;
          const postLang = post.lang;
          const code = prefix === '' ? defaultLang : prefix;
          if (Array.isArray(postLang)) return postLang.includes(code);
          if (typeof postLang === 'string') return postLang === code;
          return code === defaultLang;
        }),
        {
          params: { tag: tagSlug, blog: TAG_BASE ? (prefix ? `${prefix}/${TAG_BASE}` : `${TAG_BASE}`) : undefined },
          pageSize: blogPostsPerPage,
          props: { tag: tags[tagSlug], lang: prefix === '' ? defaultLang : prefix },
        }
      )
    );
  });
};

/** */
export async function getRelatedPosts(originalPost: Post, maxResults: number = 4): Promise<Post[]> {
  const allPosts = await fetchPosts();
  const originalTagsSet = new Set(originalPost.tags ? originalPost.tags.map((tag) => tag.slug) : []);

  const postsWithScores = allPosts.reduce((acc: { post: Post; score: number }[], iteratedPost: Post) => {
    if (iteratedPost.slug === originalPost.slug) return acc;

    let score = 0;
    if (iteratedPost.category && originalPost.category && iteratedPost.category.slug === originalPost.category.slug) {
      score += 5;
    }

    if (iteratedPost.tags) {
      iteratedPost.tags.forEach((tag) => {
        if (originalTagsSet.has(tag.slug)) {
          score += 1;
        }
      });
    }

    acc.push({ post: iteratedPost, score });
    return acc;
  }, []);

  postsWithScores.sort((a, b) => b.score - a.score);

  const selectedPosts: Post[] = [];
  let i = 0;
  while (selectedPosts.length < maxResults && i < postsWithScores.length) {
    selectedPosts.push(postsWithScores[i].post);
    i++;
  }

  return selectedPosts;
}
