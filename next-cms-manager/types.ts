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
  description?: string;
  created_at: string; // ISO Timestamp
  updated_at: string; // ISO Timestamp
}

export interface Category {
  id: string; // UUID
  post_type_id: string; // UUID references PostType
  parent_id?: string | null; // UUID references parent Category
  slug: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string; // UUID
  post_type_id: string; // UUID references PostType
  title: string;
  slug: string;
  desc?: string; // Short summary
  content?: string; // Rich body, markdown or editor JSON
  status: PostStatus;
  featured_image?: string;
  gallery_images: string[];
  featured_youtube?: string;
  metadata: Record<string, any>; // JSONB for custom keys/SEO
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostCategory {
  post_id: string;
  category_id: string;
}

export interface PostMedia {
  id: string; // UUID
  post_id: string; // UUID references Post
  media_type: MediaType;
  url: string;
  title?: string;
  alt_text?: string;
  mime_type?: string;
  file_size?: number; // In bytes
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PostFile {
  id: string; // UUID
  post_id: string; // UUID references Post
  url: string;
  title: string;
  description?: string;
  mime_type?: string;
  file_size?: number; // In bytes
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PostLink {
  id: string; // UUID
  post_id: string; // UUID references Post
  url: string;
  title: string;
  description?: string;
  target: LinkTarget;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Highly useful hydrated type representing the full payload of a single post page
export interface HydratedPost extends Post {
  post_type_name: string;
  post_type_slug: string;
  categories: Array<Pick<Category, 'id' | 'name' | 'slug' | 'parent_id'>>;
  media: Array<Pick<PostMedia, 'id' | 'media_type' | 'url' | 'title' | 'alt_text' | 'mime_type' | 'file_size'>>;
  files: Array<Pick<PostFile, 'id' | 'url' | 'title' | 'description' | 'mime_type' | 'file_size'>>;
  links: Array<Pick<PostLink, 'id' | 'url' | 'title' | 'description' | 'target'>>;
}

// Hydrated summary type ideal for feed listings / indexes
export interface PostListItem extends Pick<Post, 'id' | 'title' | 'slug' | 'desc' | 'status' | 'featured_image' | 'published_at' | 'created_at'> {
  categories: Array<Pick<Category, 'id' | 'name' | 'slug'>>;
}
