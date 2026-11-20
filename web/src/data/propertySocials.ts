import records from './researchProperties.json';

export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok';
export interface PropertySocialLink {
  platform: SocialPlatform | 'website';
  label: string;
  url: string;
  providerAccount?: boolean;
}

type SocialSource = { id?: string; provider?: string; contact?: string; website?: string; sources?: string[] };
const labels: Record<SocialPlatform, string> = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok' };

export function getPropertyWebsiteLink(item: SocialSource): PropertySocialLink | null {
  // Only the dedicated website field establishes a website link. Research notes
  // can also contain institution or map URLs that are not the property's site.
  const website = item.website?.trim();
  if (!website || !/^https?:\/\//i.test(website)) return null;
  try {
    const url = new URL(website);
    if (url.username || url.password) return null;
    const host = url.hostname.replace(/^www\./, '');
    if (['instagram.com', 'facebook.com', 'tiktok.com'].some(domain => host === domain || host.endsWith(`.${domain}`))) return null;
    return { platform: 'website', label: 'Website', url: url.toString() };
  } catch { return null; }
}

function suppliedLinks(item: SocialSource): PropertySocialLink[] {
  const links = new Map<SocialPlatform, PropertySocialLink>();
  const add = (platform: SocialPlatform, url: string) => {
    if (!links.has(platform)) links.set(platform, { platform, label: labels[platform], url });
  };
  const contact = item.contact ?? '';
  // Use supplied account handles, never a guessed account based on a residence name.
  for (const [platform, pattern] of [
    ['instagram', /\b(?:IG|Instagram):\s*@?([a-z\d._]+)/i],
    ['facebook', /\b(?:FB|Facebook):\s*@?([a-z\d._-]+)/i],
    ['tiktok', /\bTikTok:\s*@?([a-z\d._]+)/i]
  ] as const) {
    const handle = contact.match(pattern)?.[1].replace(/\.+$/, '');
    if (handle && !/^https?$/i.test(handle)) {
      add(platform, `https://www.${platform}.com/${platform === 'tiktok' ? '@' : ''}${handle}/`);
    }
  }
  for (const text of [item.website ?? '', ...(item.sources ?? []), contact]) {
    for (const match of text.matchAll(/https?:\/\/[^\s<>"|]+/gi)) {
      try {
        const url = new URL(match[0].replace(/[.,;)]+$/, ''));
        const host = url.hostname.replace(/^www\./, '');
        const platform = (['instagram', 'facebook', 'tiktok'] as const).find(name => host === `${name}.com`);
        if (!platform || url.pathname === '/' || /\/(?:share|sharer|reel|reels|watch|videos|posts|stories)\b/i.test(url.pathname)) continue;
        url.protocol = 'https:';
        url.search = '';
        url.hash = '';
        add(platform, url.toString());
      } catch { /* A source note may contain prose rather than a complete URL. */ }
    }
  }
  return [...links.values()];
}

export function getPropertySocialLinks(item: SocialSource): PropertySocialLink[] {
  const own = suppliedLinks(item);
  if (own.length || !item.provider || /^(?:independent|private|unknown|not |digsconnect)/i.test(item.provider)) return own;
  // A documented provider account can also serve its other residences. Keep that
  // distinction in the link label, and never share accounts across generic groups.
  const provider = records.find(record => record.id !== item.id && record.provider === item.provider && suppliedLinks(record).length);
  return provider ? suppliedLinks(provider).map(link => ({ ...link, providerAccount: true })) : [];
}
