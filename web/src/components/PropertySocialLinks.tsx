import { getPropertySocialLinks, getPropertyWebsiteLink } from '../data/propertySocials';
import './property-social-links.css';

export function PropertySocialLinks({ item }: {
  item: { id?: string; name: string; provider?: string; contact?: string; website?: string; sources?: string[] };
}) {
  const links = getPropertySocialLinks(item);
  const website = getPropertyWebsiteLink(item);
  if (website) links.push(website);
  if (!links.length) return null;
  return <nav className="property-card-socials" aria-label={`Social pages and website for ${item.name}`}>
    {links.map(link => {
      const label = link.platform === 'website'
        ? `Visit ${item.name} website (opens in a new tab)`
        : `${link.providerAccount ? item.provider : item.name} on ${link.label} (opens in a new tab)`;
      return <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer"
        aria-label={label} title={label} onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
        <img src={`/icons/social/${link.platform}.svg`} alt="" aria-hidden="true" width="17" height="17" />
      </a>;
    })}
  </nav>;
}
