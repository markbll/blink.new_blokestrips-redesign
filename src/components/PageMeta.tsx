import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';

const SITE      = 'BlokesTrips';
const BASE_URL  = 'https://blokestrips.com.au';
const OG_IMAGE  = `${BASE_URL}/og-image.jpg`;
const DEFAULT_TITLE = "BlokesTrips — Australia's #1 Group Trip Organiser";
const DEFAULT_DESC  = "Golf trips, fishing getaways, sports weekends — fully organised end-to-end. You bring the crew. We handle absolutely everything else.";

const set = (sel: string, attr: string, val: string) => {
  let el = document.querySelector(sel);
  if (!el) { el = document.createElement(sel.startsWith('meta') ? 'meta' : 'link'); document.head.appendChild(el); }
  (el as any).setAttribute(attr, val);
};

const setMeta   = (name: string, content: string) => { set(`meta[name="${name}"]`, 'content', content); const el = document.querySelector(`meta[name="${name}"]`) || document.createElement('meta'); (el as any).setAttribute('name', name); (el as any).setAttribute('content', content); if (!el.parentNode) document.head.appendChild(el); };
const setProp   = (prop: string, content: string) => { let el = document.querySelector(`meta[property="${prop}"]`); if (!el) { el = document.createElement('meta'); (el as any).setAttribute('property', prop); document.head.appendChild(el); } (el as any).setAttribute('content', content); };
const setLink   = (rel: string, href: string)    => { let el = document.querySelector(`link[rel="${rel}"]`); if (!el) { el = document.createElement('link'); (el as any).setAttribute('rel', rel); document.head.appendChild(el); } (el as any).setAttribute('href', href); };
const setScript = (id: string, data: object)     => { let el = document.getElementById(id); if (!el) { el = document.createElement('script'); el.id = id; (el as any).type = 'application/ld+json'; document.head.appendChild(el); } el.textContent = JSON.stringify(data); };
const rmScript  = (id: string) => { const el = document.getElementById(id); if (el) el.remove(); };

interface PageMetaProps {
  title?:       string;
  description?: string;
  image?:       string;
  schema?:      object | object[];
  schemaId?:    string;
}

export function PageMeta({ title, description, image, schema, schemaId = 'page-schema' }: PageMetaProps) {
  const router  = useRouter();
  const path    = router.state.location.pathname;
  const url     = `${BASE_URL}${path}`;
  const t   = title       || DEFAULT_TITLE;
  const d   = description || DEFAULT_DESC;
  const img = image       || OG_IMAGE;

  useEffect(() => {
    document.title = t;
    setMeta('description', d);
    // OG
    setProp('og:title',       t);
    setProp('og:description', d);
    setProp('og:image',       img);
    setProp('og:url',         url);
    setProp('og:locale',      'en_AU');
    setProp('og:type',        'website');
    setProp('og:site_name',   SITE);
    // Twitter
    setMeta('twitter:card',        'summary_large_image');
    setMeta('twitter:title',       t);
    setMeta('twitter:description', d);
    setMeta('twitter:image',       img);
    // Canonical
    setLink('canonical', url);
    // Schema
    if (schema) {
      if (Array.isArray(schema)) schema.forEach((s, i) => setScript(`${schemaId}-${i}`, s));
      else setScript(schemaId, schema);
    }
    return () => { rmScript(schemaId); if (Array.isArray(schema)) schema.forEach((_, i) => rmScript(`${schemaId}-${i}`)); };
  }, [t, d, img, url, schema, schemaId]);

  return null;
}
