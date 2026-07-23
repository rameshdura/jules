-- =========================================================================
-- PostgreSQL Modular CMS Queries
-- Useful for backend APIs (Express, Next.js API Routes, Server Actions, etc.)
-- Includes full JSON aggregation for lightning-fast, high-performance fetching
-- =========================================================================

-- 1. Fetching a single complete post with all its relations nested in JSON
-- This is ideal for a post detail page where you want to fetch everything in 1 query!
-- Replace '$1' with post slug, and '$2' with post type slug
SELECT
    p.id,
    p.title,
    p.slug,
    p."desc",
    p.content,
    p.status,
    p.featured_image,
    p.gallery_images,
    p.featured_youtube,
    p.metadata,
    p.published_at,
    p.created_at,
    p.updated_at,
    pt.name AS post_type_name,
    pt.slug AS post_type_slug,
    -- Aggregate categories
    COALESCE(
        (SELECT json_agg(json_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug,
            'parent_id', c.parent_id
        ))
         FROM post_categories pc
         JOIN categories c ON pc.category_id = c.id
         WHERE pc.post_id = p.id
        ), '[]'::json
    ) AS categories,
    -- Aggregate media attachments
    COALESCE(
        (SELECT json_agg(json_build_object(
            'id', pm.id,
            'media_type', pm.media_type,
            'url', pm.url,
            'title', pm.title,
            'alt_text', pm.alt_text,
            'mime_type', pm.mime_type,
            'file_size', pm.file_size
        ) ORDER BY pm.sort_order ASC)
         FROM post_media pm
         WHERE pm.post_id = p.id
        ), '[]'::json
    ) AS media,
    -- Aggregate non-media files
    COALESCE(
        (SELECT json_agg(json_build_object(
            'id', pf.id,
            'url', pf.url,
            'title', pf.title,
            'description', pf.description,
            'mime_type', pf.mime_type,
            'file_size', pf.file_size
        ) ORDER BY pf.sort_order ASC)
         FROM post_files pf
         WHERE pf.post_id = p.id
        ), '[]'::json
    ) AS files,
    -- Aggregate external links
    COALESCE(
        (SELECT json_agg(json_build_object(
            'id', pl.id,
            'url', pl.url,
            'title', pl.title,
            'description', pl.description,
            'target', pl.target
        ) ORDER BY pl.sort_order ASC)
         FROM post_links pl
         WHERE pl.post_id = p.id
        ), '[]'::json
    ) AS links
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE p.slug = $1 AND pt.slug = $2;


-- 2. Fetching multiple posts for a listing page with pagination and aggregated categories
-- Replace '$1' with post type slug, '$2' with limit, and '$3' with offset
SELECT
    p.id,
    p.title,
    p.slug,
    p."desc",
    p.status,
    p.featured_image,
    p.published_at,
    p.created_at,
    -- Aggregate categories to avoid N+1 query problem
    COALESCE(
        (SELECT json_agg(json_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug
        ))
         FROM post_categories pc
         JOIN categories c ON pc.category_id = c.id
         WHERE pc.post_id = p.id
        ), '[]'::json
    ) AS categories
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.slug = $1 AND p.status = 'published'
ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
LIMIT $2 OFFSET $3;


-- 3. Inserting a Post with a transaction template
-- In Node.js or Postgres drivers, this can be executed within a transaction block.
BEGIN;

-- Insert a post (example variables used)
INSERT INTO posts (post_type_id, title, slug, "desc", content, status, featured_image, gallery_images, featured_youtube, metadata, published_at)
VALUES (
    (SELECT id FROM post_types WHERE slug = 'blog'),
    'My Awesome Modular Post',
    'my-awesome-modular-post',
    'This is a modern modular CMS schema designed for high-performance apps.',
    'Full body content would go here. Supports HTML, Markdown or JSON block editor formats.',
    'published',
    'https://example.com/uploads/hero.jpg',
    ARRAY['https://example.com/uploads/g1.jpg', 'https://example.com/uploads/g2.jpg'],
    'dQw4w9WgXcQ',
    '{"seo_title": "Awesome Modular Post", "seo_description": "Perfect modular structure."}'::jsonb,
    NOW()
) RETURNING id;

-- Associate post with categories (replace [post_id_from_above] and [category_id])
INSERT INTO post_categories (post_id, category_id)
VALUES ('[post_id_from_above]', '[category_id]');

-- Attach media (image, video, or audio)
INSERT INTO post_media (post_id, media_type, url, title, alt_text, mime_type, file_size, sort_order)
VALUES ('[post_id_from_above]', 'image', 'https://example.com/uploads/pic1.jpg', 'Nice Pic', 'A beautiful landscape', 'image/jpeg', 102400, 1);

-- Attach a non-media download file (PDF, Zip)
INSERT INTO post_files (post_id, url, title, description, mime_type, file_size, sort_order)
VALUES ('[post_id_from_above]', 'https://example.com/uploads/manual.pdf', 'Download PDF Guide', 'User manual in PDF format', 'application/pdf', 2048500, 1);

-- Attach an external reference link
INSERT INTO post_links (post_id, url, title, description, target, sort_order)
VALUES ('[post_id_from_above]', 'https://nextjs.org', 'Next.js Official Site', 'Visit official page', '_blank', 1);

COMMIT;


-- 4. Find all posts belonging to a specific category (and its child categories)
-- This recursive CTE fetches the chosen category plus all its subcategories,
-- then joins it to retrieve all associated posts.
WITH RECURSIVE category_tree AS (
    SELECT id, parent_id FROM categories WHERE slug = $1 AND post_type_id = (SELECT id FROM post_types WHERE slug = $2)
    UNION ALL
    SELECT c.id, c.parent_id FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT DISTINCT p.id, p.title, p.slug, p."desc", p.featured_image, p.published_at
FROM posts p
JOIN post_categories pc ON p.id = pc.post_id
WHERE pc.category_id IN (SELECT id FROM category_tree) AND p.status = 'published'
ORDER BY p.published_at DESC NULLS LAST;


-- 5. Full-Text Search across titles, descriptions, and content
-- This query supports flexible keyword searches.
SELECT p.id, p.title, p.slug, p."desc", p.featured_image
FROM posts p
WHERE
    p.post_type_id = (SELECT id FROM post_types WHERE slug = $1)
    AND (
        p.title ILIKE '%' || $2 || '%'
        OR p."desc" ILIKE '%' || $2 || '%'
        OR p.content ILIKE '%' || $2 || '%'
    )
ORDER BY p.created_at DESC;
