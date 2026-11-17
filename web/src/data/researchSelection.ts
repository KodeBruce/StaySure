import { useEffect, useState } from 'react';

export type ResearchList = 'saved' | 'compare';
const prefix = 'staysure_research_';

export function readResearchIds(list: ResearchList): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(prefix + list) || '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function useResearchSelection(list: ResearchList) {
  const [ids, setIds] = useState<string[]>(() => readResearchIds(list));
  useEffect(() => {
    const sync = () => setIds(readResearchIds(list));
    window.addEventListener('staysure-research-selection', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('staysure-research-selection', sync); window.removeEventListener('storage', sync); };
  }, [list]);
  function toggle(id: string) {
    const current = readResearchIds(list);
    if (list === 'compare' && !current.includes(id) && current.length >= 3) return;
    const next = current.includes(id) ? current.filter(value => value !== id) : [...current, id].slice(-100);
    localStorage.setItem(prefix + list, JSON.stringify(next));
    setIds(next);
    window.dispatchEvent(new Event('staysure-research-selection'));
  }
  function clear() {
    localStorage.removeItem(prefix + list);
    setIds([]);
    window.dispatchEvent(new Event('staysure-research-selection'));
  }
  return { ids, toggle, clear };
}
