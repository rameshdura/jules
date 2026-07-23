-- ==========================================
-- PostgreSQL Modular CMS Schema
-- Highly Modular, Scalable & Easy to Install
-- ==========================================

-- Enable extension for generating UUIDs if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trigger Function to update 'updated_at' column automatically
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. POST TYPES TABLE
-- Allows defining different types of content (e.g. 'blog', 'portfolio', 'news', 'page')
CREATE TABLE IF NOT EXISTS post_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CATEGORIES TABLE
-- Supports hierarchical categories per post type
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_type_id UUID NOT NULL REFERENCES post_types(id) ON DELETE CASCADE,
    parent_id UUID,
    slug VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Enforce that (id, post_type_id) is unique to allow composite foreign key reference
    CONSTRAINT unique_category_id_and_type UNIQUE (id, post_type_id),
    -- Strictly enforce that the parent category must belong to the exact same post type
    CONSTRAINT fk_category_parent FOREIGN KEY (parent_id, post_type_id) REFERENCES categories(id, post_type_id) ON DELETE SET NULL,
    -- Prevent simple self-referencing cycle
    CONSTRAINT chk_category_parent_not_self CHECK (parent_id <> id),
    CONSTRAINT unique_category_slug_per_post_type UNIQUE (post_type_id, slug)
);

-- 3. POSTS TABLE
-- Core posts containing title, description, and key media options
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_type_id UUID NOT NULL REFERENCES post_types(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    "desc" TEXT, -- Short description or summary
    content TEXT, -- Full body content (Markdown, HTML, or Rich-Text JSON)
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'scheduled')),
    featured_image TEXT, -- Main feature image URL
    gallery_images TEXT[] DEFAULT '{}', -- Array of extra images for a gallery
    featured_youtube VARCHAR(255), -- YouTube video ID or URL
    metadata JSONB DEFAULT '{}'::jsonb, -- Extra metadata for custom extensibility (SEO, settings, etc.)
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Enforce that (id, post_type_id) is unique to allow composite foreign key reference in junction table
    CONSTRAINT unique_post_id_and_type UNIQUE (id, post_type_id),
    CONSTRAINT unique_post_slug_per_post_type UNIQUE (post_type_id, slug)
);

-- 4. POST CATEGORIES JUNCTION TABLE
-- Many-to-many relationship between posts and categories.
-- Enforces that a post can only be linked to categories of the exact same post type!
CREATE TABLE IF NOT EXISTS post_categories (
    post_id UUID NOT NULL,
    category_id UUID NOT NULL,
    post_type_id UUID NOT NULL,
    PRIMARY KEY (post_id, category_id),
    -- Ensure both refer to the same post_type_id via composite FKs
    CONSTRAINT fk_post_categories_post FOREIGN KEY (post_id, post_type_id) REFERENCES posts(id, post_type_id) ON DELETE CASCADE,
    CONSTRAINT fk_post_categories_category FOREIGN KEY (category_id, post_type_id) REFERENCES categories(id, post_type_id) ON DELETE CASCADE
);

-- 5. POST MEDIA TABLE
-- Handles specific media attachments such as images, videos, audio with rich parameters
CREATE TABLE IF NOT EXISTS post_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('image', 'video', 'audio')),
    url TEXT NOT NULL,
    title VARCHAR(255), -- Optional title/caption
    alt_text VARCHAR(255), -- Accessibility alt text
    mime_type VARCHAR(100), -- e.g., 'image/png', 'video/mp4', 'audio/mp3'
    file_size INTEGER, -- File size in bytes
    sort_order INTEGER NOT NULL DEFAULT 0, -- Ordering priority
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. POST FILES TABLE
-- Handles non-media downloads (e.g. PDF, zip, docx, csv)
CREATE TABLE IF NOT EXISTS post_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title VARCHAR(255) NOT NULL, -- Anchor text or display name
    description TEXT, -- Description of the document/file
    mime_type VARCHAR(100), -- e.g. 'application/pdf', 'application/zip'
    file_size INTEGER, -- File size in bytes
    sort_order INTEGER NOT NULL DEFAULT 0, -- Ordering priority
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. POST LINKS TABLE
-- External reference links with customizable titles/anchors
CREATE TABLE IF NOT EXISTS post_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title VARCHAR(255) NOT NULL, -- Clickable text
    description TEXT, -- Supplementary notes/tooltip
    target VARCHAR(50) NOT NULL DEFAULT '_blank' CHECK (target IN ('_blank', '_self', '_parent', '_top')),
    sort_order INTEGER NOT NULL DEFAULT 0, -- Ordering priority
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- Idempotent Triggers for 'updated_at' auto-update
-- ==========================================

DROP TRIGGER IF EXISTS update_post_types_modtime ON post_types;
CREATE TRIGGER update_post_types_modtime BEFORE UPDATE ON post_types FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_categories_modtime ON categories;
CREATE TRIGGER update_categories_modtime BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_posts_modtime ON posts;
CREATE TRIGGER update_posts_modtime BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_post_media_modtime ON post_media;
CREATE TRIGGER update_post_media_modtime BEFORE UPDATE ON post_media FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_post_files_modtime ON post_files;
CREATE TRIGGER update_post_files_modtime BEFORE UPDATE ON post_files FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_post_links_modtime ON post_links;
CREATE TRIGGER update_post_links_modtime BEFORE UPDATE ON post_links FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- Indexes for performance tuning
-- ==========================================

-- Indexes on Post Types
CREATE INDEX IF NOT EXISTS idx_post_types_slug ON post_types(slug);

-- Indexes on Categories
CREATE INDEX IF NOT EXISTS idx_categories_post_type ON categories(post_type_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Indexes on Posts
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type_id);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);

-- Indexes on Junction and Relations
CREATE INDEX IF NOT EXISTS idx_post_categories_post ON post_categories(post_id);
CREATE INDEX IF NOT EXISTS idx_post_categories_category ON post_categories(category_id);

-- Indexes on Attachments
CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_post_media_sort ON post_media(sort_order);

CREATE INDEX IF NOT EXISTS idx_post_files_post ON post_files(post_id);
CREATE INDEX IF NOT EXISTS idx_post_files_sort ON post_files(sort_order);

CREATE INDEX IF NOT EXISTS idx_post_links_post ON post_links(post_id);
CREATE INDEX IF NOT EXISTS idx_post_links_sort ON post_links(sort_order);
