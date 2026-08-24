import React, { createContext, useContext, useEffect, useState } from 'react';
import fallbackData from '../data/siteData.json';
import { supabase } from './supabaseClient';

const ContentContext = createContext(fallbackData);

// Loads live content from Supabase and merges it over the bundled
// siteData.json, so the site still renders if the database is unreachable.
export function ContentProvider({ children }) {
  const [content, setContent] = useState(fallbackData);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [sections, missions, posts, gallery] = await Promise.all([
          supabase.from('site_content').select('key, data'),
          supabase.from('missions').select('slug, name, status, sort_order, data').order('sort_order'),
          supabase.from('posts').select('*').order('published_at', { ascending: false }),
          supabase.from('gallery').select('*').order('sort_order'),
        ]);

        if (cancelled) return;

        const merged = { ...fallbackData };

        if (!sections.error && sections.data?.length) {
          for (const row of sections.data) {
            merged[row.key] = row.data;
          }
        }

        if (!missions.error && missions.data?.length) {
          const missionMap = {};
          for (const row of missions.data) {
            missionMap[row.slug] = { ...row.data, slug: row.slug, name: row.name, status: row.status };
          }
          merged.missions = missionMap;
        }

        if (!posts.error && posts.data?.length) {
          merged.updates = posts.data.map((post) => ({
            id: post.id,
            title: post.title,
            category: post.category,
            date: post.date_display,
            summary: post.summary,
            body: post.body,
            image: post.image_url,
          }));
        }

        if (!gallery.error && gallery.data?.length) {
          merged.gallery = gallery.data;
          merged.home_gallery = gallery.data;
        }

        setContent(merged);
      } catch {
        // Network/API failure: keep rendering the bundled fallback content.
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}

export function useSiteData() {
  return useContext(ContentContext);
}
