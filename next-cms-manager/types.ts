// ==========================================
// TypeScript definitions for Modular CMS
// Ideal for Next.js, React, or Node.js backends
// ==========================================

export type PostStatus = 'draft' | 'published' | 'archived' | 'scheduled';
export type MediaType = 'image' | 'video' | 'audio';
export type LinkTarget = '_blank' | '_self' | '_parent' | '_top';

export interface PostType {
  id: string; // UUID
  slug: string;
  name: string;
  description: string | null;
  created_at: string; // ISO Timestamp
  updated_at: string; // ISO Timestamp
}

export interface Category {
  id: string; // UUID
  post_type_id: string; // UUID references PostType
  parent_id: string | null; // UUID references parent Category
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string; // UUID
  post_type_id: string; // UUID references PostType
  title: string;
  slug: string;
  desc: string | null; // Short summary
  content: string | null; // Rich body, markdown or editor JSON
  status: PostStatus;
  featured_image: string | null;
  gallery_images: string[] | null;
  featured_youtube: string | null;
  metadata: Record<string, any> | null; // JSONB for custom keys/SEO
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostCategory {
  post_id: string;
  category_id: string;
  post_type_id: string;
}

export interface PostMedia {
  id: string; // UUID
  post_id: string; // UUID references Post
  media_type: MediaType;
  url: string;
  title: string | null;
  alt_text: string | null;
  mime_type: string | null;
  file_size: number | null; // In bytes
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PostFile {
  id: string; // UUID
  post_id: string; // UUID references Post
  url: string;
  title: string;
  description: string | null;
  mime_type: string | null;
  file_size: number | null; // In bytes
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PostLink {
  id: string; // UUID
  post_id: string; // UUID references Post
  url: string;
  title: string;
  description: string | null;
  target: LinkTarget;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Highly useful hydrated type representing the full payload of a single post page
export interface HydratedPost extends Post {
  post_type_name: string;
  post_type_slug: string;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
  }>;
  media: Array<{
    id: string;
    media_type: MediaType;
    url: string;
    title: string | null;
    alt_text: string | null;
    mime_type: string | null;
    file_size: number | null;
  }>;
  files: Array<{
    id: string;
    url: string;
    title: string;
    description: string | null;
    mime_type: string | null;
    file_size: number | null;
  }>;
  links: Array<{
    id: string;
    url: string;
    title: string;
    description: string | null;
    target: LinkTarget;
  }>;
}

// Hydrated summary type ideal for feed listings / indexes
export interface PostListItem extends Pick<Post, 'id' | 'title' | 'slug' | 'desc' | 'status' | 'featured_image' | 'published_at' | 'created_at'> {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}
