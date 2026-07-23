# High-Performance Modular CMS Manager

A perfect, highly modular, and highly performant CMS database structure and type definition system. Ideal for modern frameworks like Next.js (App Router / Server Actions), Nuxt, Remix, Node.js, and any PostgreSQL-backed backend.

This schema lets you build versatile web pages, blog posts, portfolios, or news articles with rich multimedia assets, downloadable files, external references, and customizable category hierarchies.

---

## 🚀 Key Features

- **Multi-Post Types**: Build any content architecture (Blogs, Events, Portfolio, Pages, Products) using the `post_types` table.
- **Hierarchical Categories**: Parent-child relationship with unique constraints ensures a robust taxonomy.
- **Rich Media Support**: Native fields for featured image, gallery images array (`text[]`), and YouTube embedding (`featured_youtube`), plus a dedicated `post_media` table for discrete image, audio, or video resources.
- **Unified Document System**: The `post_files` table manages downloads such as PDFs, Zip archives, and Excel sheets.
- **Actionable External Links**: Create annotated links with flexible targets using the `post_links` table.
- **Optimal JSON Aggregation**: Highly optimized SQL queries pull a complete post with *all* its relations in a single, high-performance database query.
- **Performance Tuned**: Exhaustive indexes on all query paths, foreign key cascading, and automated modification timestamp triggers.
- **Full TypeScript Support**: Out-of-the-box interfaces mapped exactly to PostgreSQL models.

---

## 📂 File Architecture

The `next-cms-manager` directory is structured as follows:

```bash
next-cms-manager/
├── schema.sql    # The complete PostgreSQL schema definition, indexes, and triggers
├── queries.sql   # Ready-to-use, optimized SQL query templates (JSON-aggregated)
└── types.ts      # TypeScript interfaces mapped to the database structure
```

---

## 🛠️ Installation Guide

Follow these steps to integrate this module into any backend or database setup.

### Step 1: Run the Database Schema
Execute the queries in `schema.sql` against your PostgreSQL database. You can do this via:
- **CLI (psql)**:
  ```bash
  psql -h localhost -U myuser -d mydb -f next-cms-manager/schema.sql
  ```
- **Prisma or Drizzle**: Write custom migrations using the SQL statements inside `schema.sql`.
- **Supabase/Hasura**: Paste the schema SQL inside the SQL editor console.

### Step 2: Use the Types in Your Project
Import the types directly into your Next.js API Routes, Server Actions, or Express Controllers:

```typescript
import { HydratedPost, PostStatus } from './next-cms-manager/types';

export async function getPostDetail(slug: string, typeSlug: string): Promise<HydratedPost | null> {
  // Use your database client (pg, knex, drizzle, etc.) to run the query from queries.sql
  const query = `...`; // copy query #1 from queries.sql
  const res = await db.query(query, [slug, typeSlug]);
  return res.rows[0] || null;
}
```

---

## 🧩 Relational Diagram View

```text
  ┌────────────────┐
  │   post_types   │
  └───────┬────────┘
          │ (1:N)
          ├────────────────────────┐
          ▼                        ▼
  ┌────────────────┐       ┌───────────────┐
  │     posts      │       │  categories   │
  └───────┬────────┘       └───────┬───────┘
          │                        │
          │ (Many-to-Many via)     │
          │ ┌────────────────────┐ │
          └─►   post_categories  ◄─┘
            └────────────────────┘
          │
          ├────────────────────────┬───────────────────────┐
          ▼                        ▼                       ▼
  ┌───────────────┐        ┌───────────────┐       ┌───────────────┐
  │  post_media   │        │  post_files   │       │  post_links   │
  │ (images,      │        │ (downloads,   │       │ (URLs, target,│
  │  vids, audio) │        │  PDFs, Zips)  │       │  accessibility)     │
  └───────────────┘        └───────────────┘       └───────────────┘
```

---

## 💎 Design Choices Explained

### Why UUIDs?
We use `uuid_generate_v4()` for primary keys to make the system secure, highly portable, and merger-friendly. It also avoids ID prediction leaks in URLs.

### Why `jsonb` Metadata?
Rather than creating rigid tables for every custom use case, the `metadata` column in the `posts` table uses a standard `JSONB` data type. This allows developer-defined key-value stores for SEO fields (e.g., `seo_title`, `og_image`), post settings, or custom styling parameters.

### Why separate `post_media`, `post_files`, and `post_links`?
- **Separation of Concerns**: Users browse media files differently than standard document links.
- **Type-Safety and Metadata**: Files require `mime_type` and `file_size` for rendering badges. Media requires `alt_text` for accessibility. Links require custom targets (like `_blank` vs `_self`).
- **Ordering**: Each relation table contains a `sort_order` field so content managers can order them exactly as needed.
