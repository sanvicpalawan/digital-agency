import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import {
  ArrowRight, ArrowUp, ArrowUpRight, BatteryCharging, Bot, CheckCircle2,
  ChevronDown, ChevronRight, Clock3, Cloud, Cpu, CreditCard, ExternalLink,
  Globe, ImagePlus, LockKeyhole, LogIn, LogOut, Mail, MapPin, Menu,
  MessageCircle, Moon, Palette, PanelRightClose, Radio, RotateCcw, Save,
  Scale, Share2, Shield, ShieldCheck, SlidersHorizontal, Sun, Type, Upload,
  Wifi, X,
} from 'lucide-react';
import {
  getCloudAssetUrl,
  isSupabaseConfigured,
  loadCloudSettings,
  persistCloudSettings,
  removeCloudAsset,
  supabase,
  uploadCloudAsset,
} from './lib/supabase';

type Theme = 'light' | 'dark';
type MediaType = 'image' | 'video';
type AdminTab = 'content' | 'media' | 'design' | 'packages' | 'faq' | 'footer';
type CloudState = 'local' | 'connecting' | 'ready' | 'published' | 'unauthenticated' | 'error';
type Pillar = { title: string; description: string; points: string[] };
type ServicePackage = { name: string; price: string; priceSub: string; description: string; tag: string; features: string[]; featured: boolean };
type FaqItem = { question: string; answer: string };
type SocialPlatform = 'Facebook' | 'Instagram' | 'GitHub' | 'YouTube' | 'Website' | 'LinkedIn' | 'X';
type SocialLink = { platform: SocialPlatform; url: string };
type WebsiteLink = { label: string; url: string };

type SiteSettings = {
  branding: { name: string; tagline: string; logoAssetId?: string };
  header: { links: string[]; cta: string };
  hero: { badge: string; titleLineOne: string; titleLineTwo: string; titleAccent: string; subtitle: string; primaryCta: string; secondaryCta: string; assetId?: string; assetType?: MediaType };
  about: { eyebrow: string; title: string; missionTitle: string; mission: string; aboutTitle: string; description: string; assetId?: string; assetType?: MediaType };
  pillars: { eyebrow: string; title: string; subtitle: string; items: Pillar[] };
  packages: { eyebrow: string; title: string; subtitle: string; items: ServicePackage[] };
  process: { eyebrow: string; title: string; subtitle: string; steps: string[] };
  faq: { eyebrow: string; title: string; items: FaqItem[] };
  footer: {
    eyebrow: string; headline: string; subtext: string; cta: string; email: string;
    whatsapp: string; deskHours: string; responseSla: string; location: string;
    coordinates: string; copyright: string; badges: string[]; socialLinks: SocialLink[];
    websites: WebsiteLink[]; assetId?: string; assetType?: MediaType;
  };
  palette: { accent: string; accentDark: string; lightBackground: string; lightHeading: string; lightBody: string; darkBackground: string; darkHeading: string; darkBody: string };
  fonts: { heading: string; body: string; brand: string };
};

const STORAGE_KEY = 'merqato-site-settings-v1';
const ASSET_DB = 'merqato-backoffice-assets';
const ASSET_STORE = 'files';
const FONT_OPTIONS = [
  { label: 'Inter', value: "'Inter', ui-sans-serif, system-ui, sans-serif" },
  { label: 'System Sans', value: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { label: 'Questrial', value: "'Questrial', 'Inter', sans-serif" },
  { label: 'Futura', value: "'Futura', 'Futura PT', 'Century Gothic', 'Questrial', sans-serif" },
];

const DEFAULT_SETTINGS: SiteSettings = {
  branding: { name: 'merQato.digital', tagline: 'Building Operational Systems from Paradise' },
  header: { links: ['Pillars', 'Packages', 'Process'], cta: 'Build Your System' },
  hero: {
    badge: 'Palawan, Philippines | Global Capability', titleLineOne: 'Building Operational', titleLineTwo: 'Systems', titleAccent: 'from Paradise',
    subtitle: 'Resilient, high-performance digital infrastructure bridging physical operations with automated Web, AI Agent, and Social Media systems.', primaryCta: 'Explore Packages', secondaryCta: 'Our Process',
  },
  about: {
    eyebrow: '01 / About', title: 'Tropical Digital Infrastructure', missionTitle: 'Our Mission',
    mission: 'To engineer resilient, high-performance digital infrastructure from Palawan for global businesses and local enterprise alike, bridging physical operations with automated Web, AI Agent, and Social Media systems.',
    aboutTitle: 'About Us',
    description: 'Based on the island of Palawan, merQato.digital designs and deploys end-to-end digital operations for clients operating locally and internationally. By combining modern web engineering, autonomous AI workflows, and targeted social media automation, merQato.digital helps companies streamline daily operations, manage customer communication automatically, and scale efficiently without needing large back-office teams.',
  },
  pillars: {
    eyebrow: '02 / Pillars', title: 'Core Operational Pillars', subtitle: 'Three integrated systems working in concert to automate and scale your digital operations.',
    items: [
      { title: 'Web Systems', description: 'High-speed, responsive websites and web applications built for conversion, booking engines, and customer portals.', points: ['Conversion-optimized UX', 'Booking and reservation engines', 'Secure client portals'] },
      { title: 'Autonomous AI Agents', description: '24/7 concierges and automated backend workflows handling inquiries, reservations, and multi-channel support.', points: ['Always-on customer concierge', 'Multi-channel support', 'Automated backend workflows'] },
      { title: 'Social Media Systems', description: 'Content distribution models and automated lead intake funnels designed for consistent brand reach and customer acquisition.', points: ['Automated content workflows', 'Lead intake funnels', 'Consistent brand reach'] },
    ],
  },
  packages: {
    eyebrow: '03 / Packages', title: 'Service Packages', subtitle: 'Three tiers of digital infrastructure, designed to scale with your operation.',
    items: [
      { name: 'Starter Deployment', price: 'Starting', priceSub: 'Custom Quote', description: 'Core web presence buildout, initial social media system setup, basic inquiry and lead capture automation.', tag: 'Best for new ventures or businesses needing a modern, automated baseline presence', features: ['High-performance website build', 'Initial social media system setup', 'Basic inquiry and lead capture automation', 'Mobile-responsive design', 'Core analytics integration'], featured: false },
      { name: 'Operational Suite', price: 'Scaled', priceSub: 'Custom Quote', description: 'Full custom web application or guest/client portal with a custom-trained AI Agent handling 24/7 operations.', tag: 'Best for established operators looking to automate guest, client, or sales operations', features: ['Full custom web application or client portal', 'Custom-trained AI Agent for 24/7 service, FAQs and booking intake', 'Automated social distribution and content workflow', 'Multi-channel systems integration', 'Advanced analytics and reporting', 'Priority support SLAs'], featured: true },
      { name: 'Enterprise Infrastructure', price: 'Custom', priceSub: 'Bespoke Pricing', description: 'End-to-end custom system architecture with multi-agent AI networks and managed site reliability.', tag: 'Best for multi-location operations, resorts, transit platforms, or high-volume global brands', features: ['End-to-end custom system architecture', 'Multi-agent AI networks for complex, multi-tier workflows', 'Managed site reliability and security', 'Digital infrastructure maintenance', 'Ongoing retainer for continuous optimization', 'Dedicated account management'], featured: false },
    ],
  },
  process: { eyebrow: '04 / Process', title: 'How We Work', subtitle: 'A rigorous, four-phase methodology delivering production-grade infrastructure.', steps: ['Discovery and System Audit', 'Custom Architecture', 'Deployment and Integration', 'Ongoing Managed Operations'] },
  faq: {
    eyebrow: '05 / FAQ', title: 'Frequently Asked Questions',
    items: [
      { question: 'Who do you work with?', answer: 'We partner with ambitious island enterprises, hospitality operators, service businesses, and global companies that need durable digital operations.' },
      { question: 'Can you integrate with our current tools?', answer: 'Yes. Every architecture begins with an audit of your existing tools, communication channels, and operational constraints so we can integrate without unnecessary disruption.' },
      { question: 'Do you offer support after launch?', answer: 'Yes. Our managed operations option provides ongoing monitoring, security, optimization, and strategic improvements after deployment.' },
    ],
  },
  footer: {
    eyebrow: 'Get in Touch',
    headline: 'Ready to Upgrade Your Operational Infrastructure?',
    subtext: 'Partner with merQato.digital to automate and scale your digital systems.',
    cta: 'Initiate System Audit',
    email: 'hello@merqato.digital',
    whatsapp: '+63 917 530 9000',
    deskHours: 'Monday to Saturday, 08:00 to 18:00 PHT',
    responseSla: '< 2 Hours Daytime Response',
    location: 'Headquartered in Palawan, Philippines | Serving Global Enterprise',
    coordinates: 'Puerto Princesa • El Nido • Coron',
    badges: ['LOCAL-FIRST', 'WHATSAPP-READY', 'STARLINK & SOLAR RESILIENT'],
    socialLinks: [
      { platform: 'Facebook', url: 'https://facebook.com/' },
      { platform: 'Instagram', url: 'https://instagram.com/' },
      { platform: 'GitHub', url: 'https://github.com/' },
      { platform: 'YouTube', url: 'https://youtube.com/' },
    ],
    websites: [{ label: 'merQato.digital', url: 'https://merqato.digital' }],
    copyright: 'merQato.digital. All rights reserved.',
  },
  palette: { accent: '#D31027', accentDark: '#B91C1C', lightBackground: '#FFFFFF', lightHeading: '#0B0F17', lightBody: '#475569', darkBackground: '#0B0F17', darkHeading: '#F1F5F9', darkBody: '#CBD5E1' },
  fonts: { heading: "'Inter', ui-sans-serif, system-ui, sans-serif", body: "'Inter', ui-sans-serif, system-ui, sans-serif", brand: "'Futura', 'Futura PT', 'Century Gothic', 'Questrial', sans-serif" },
};

const copySettings = (settings: SiteSettings) => JSON.parse(JSON.stringify(settings)) as SiteSettings;

function normalizeSettings(saved?: Partial<SiteSettings> | null): SiteSettings {
  const base = copySettings(DEFAULT_SETTINGS);
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    branding: { ...base.branding, ...saved.branding },
    header: { ...base.header, ...saved.header },
    hero: { ...base.hero, ...saved.hero },
    about: { ...base.about, ...saved.about },
    pillars: { ...base.pillars, ...saved.pillars },
    packages: { ...base.packages, ...saved.packages },
    process: { ...base.process, ...saved.process },
    faq: { ...base.faq, ...saved.faq },
    footer: {
      ...base.footer,
      ...saved.footer,
      badges: saved.footer?.badges ?? base.footer.badges,
      socialLinks: saved.footer?.socialLinks ?? base.footer.socialLinks,
      websites: saved.footer?.websites ?? base.footer.websites,
    },
    palette: { ...base.palette, ...saved.palette },
    fonts: { ...base.fonts, ...saved.fonts },
  };
}

function readStoredSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return normalizeSettings();
    const parsed = JSON.parse(saved) as Partial<SiteSettings>;
    return normalizeSettings(parsed);
  } catch { return normalizeSettings(); }
}

function openAssetDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ASSET_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(ASSET_STORE)) request.result.createObjectStore(ASSET_STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveAsset(file: File) {
  const db = await openAssetDb();
  const id = crypto.randomUUID ? crypto.randomUUID() : `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return new Promise<string>((resolve, reject) => {
    const transaction = db.transaction(ASSET_STORE, 'readwrite');
    transaction.objectStore(ASSET_STORE).put({ id, file, name: file.name, type: file.type });
    transaction.oncomplete = () => { db.close(); resolve(id); };
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getAssetUrl(id: string) {
  const db = await openAssetDb();
  return new Promise<string | undefined>((resolve, reject) => {
    const transaction = db.transaction(ASSET_STORE, 'readonly');
    const request = transaction.objectStore(ASSET_STORE).get(id);
    request.onsuccess = () => { db.close(); resolve(request.result?.file ? URL.createObjectURL(request.result.file as Blob) : undefined); };
    request.onerror = () => reject(request.error);
  });
}

async function removeAsset(id: string) {
  const db = await openAssetDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(ASSET_STORE, 'readwrite');
    transaction.objectStore(ASSET_STORE).delete(id);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => reject(transaction.error);
  });
}

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem('merqato-theme') === 'dark' ? 'dark' : 'light');
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); localStorage.setItem('merqato-theme', theme); }, [theme]);
  return [theme, () => setTheme((current) => current === 'light' ? 'dark' : 'light')];
}

function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(readStoredSettings);
  const [cloudState, setCloudState] = useState<CloudState>(isSupabaseConfigured ? 'connecting' : 'local');
  const hydratedFromCloud = useRef(!isSupabaseConfigured);
  const skipNextCloudSave = useRef(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    loadCloudSettings<SiteSettings>()
      .then((cloudSettings) => {
        if (!active) return;
        // An empty seeded row should not overwrite the complete local default site.
        if (cloudSettings && cloudSettings.branding && cloudSettings.hero) setSettings(normalizeSettings(cloudSettings));
        setCloudState('ready');
      })
      .catch(() => active && setCloudState('error'))
      .finally(() => { hydratedFromCloud.current = true; });
    return () => { active = false; };
  }, []);

  const publish = async () => {
    if (!isSupabaseConfigured) return false;
    try {
      const saved = await persistCloudSettings(settings);
      setCloudState(saved ? 'published' : 'unauthenticated');
      return saved;
    } catch {
      setCloudState('error');
      return false;
    }
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (!isSupabaseConfigured || !hydratedFromCloud.current) return;
    if (skipNextCloudSave.current) {
      skipNextCloudSave.current = false;
      return;
    }
    const timer = window.setTimeout(() => { void publish(); }, 800);
    return () => window.clearTimeout(timer);
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--user-light-bg', settings.palette.lightBackground);
    root.setProperty('--user-light-heading', settings.palette.lightHeading);
    root.setProperty('--user-light-body', settings.palette.lightBody);
    root.setProperty('--user-dark-bg', settings.palette.darkBackground);
    root.setProperty('--user-dark-heading', settings.palette.darkHeading);
    root.setProperty('--user-dark-body', settings.palette.darkBody);
    root.setProperty('--user-accent', settings.palette.accent);
    root.setProperty('--user-accent-dark', settings.palette.accentDark);
  }, [settings.palette]);
  return [settings, setSettings, cloudState, publish] as const;
}

function useAssetUrls(settings: SiteSettings) {
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});
  const assetKey = [settings.branding.logoAssetId, settings.hero.assetId, settings.about.assetId, settings.footer.assetId].filter(Boolean).join('|');
  useEffect(() => {
    const ids = assetKey ? assetKey.split('|') : [];
    let live = true;
    let created: string[] = [];
    Promise.all(ids.map(async (id) => ({
      id,
      url: id.startsWith('remote:') ? getCloudAssetUrl(id) : await getAssetUrl(id),
    }))).then((items) => {
      if (!live) { items.forEach((item) => item.url && !item.id.startsWith('remote:') && URL.revokeObjectURL(item.url)); return; }
      const next: Record<string, string> = {};
      items.forEach(({ id, url }) => { if (url) { next[id] = url; created.push(url); } });
      setAssetUrls(next);
    }).catch(() => setAssetUrls({}));
    return () => { live = false; created.forEach((url) => URL.revokeObjectURL(url)); };
  }, [assetKey]);
  return assetUrls;
}

function BrandName({ name }: { name: string }) {
  const q = name.indexOf('Q');
  const dot = name.indexOf('.');
  if (q === -1) return <>{name}</>;
  return <>{name.slice(0, q)}<span className="brand-accent-text">Q</span>{name.slice(q + 1, dot === -1 ? undefined : dot)}{dot !== -1 && <span className="brand-accent-text">{name.slice(dot)}</span>}</>;
}

function LogoMark({ settings, logoSrc, size = 'md', onActivate }: { settings: SiteSettings; logoSrc?: string; size?: 'sm' | 'md'; onActivate?: () => void }) {
  const markWidth = size === 'sm' ? 36 : 46;
  const markHeight = size === 'sm' ? 20 : 25;
  const wordmarkSize = size === 'sm' ? '14px' : '17px';
  const content = (
    <div className="flex items-center gap-2 min-w-0 max-w-full">
      {logoSrc ? (
        <img src={logoSrc} alt="" className="object-contain object-left flex-shrink-0" style={{ width: markWidth, height: markHeight }} />
      ) : (
        <svg className="flex-shrink-0" width={markWidth} height={markHeight} viewBox="0 0 124 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="merqato-red" x1="0" y1="0" x2="110" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--crimson)" />
              <stop offset="1" stopColor="var(--crimson-dark)" />
            </linearGradient>
          </defs>
          <path d="M0 0H27V8L59 56H40L17 27H0V0Z" fill="url(#merqato-red)" />
          <path d="M33 0H60V8L92 56H73L50 27H33V0Z" fill="url(#merqato-red)" />
          <path d="M66 0H93V8L117 43H124V56H105V48L83 27H66V0Z" fill="url(#merqato-red)" />
        </svg>
      )}
      <span className="brand-wordmark leading-none brand-heading truncate min-w-0" style={{ fontSize: wordmarkSize, fontFamily: settings.fonts.brand }}>
        <BrandName name={settings.branding.name} />
      </span>
    </div>
  );
  return onActivate ? (
    <button type="button" className="flex items-center gap-2 min-w-0 max-w-full text-left rounded-md" aria-label="Open merQato.digital backoffice" onClick={onActivate}>
      {content}
    </button>
  ) : (
    <div className="flex items-center gap-2 min-w-0 max-w-full">{content}</div>
  );
}

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return <button onClick={onToggle} aria-label="Toggle color theme" className="theme-toggle w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0">{theme === 'light' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}</button>;
}

function Navigation({ settings, theme, onToggle, onLogoClick, logoSrc }: { settings: SiteSettings; theme: Theme; onToggle: () => void; onLogoClick: () => void; logoSrc?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const routes = ['#pillars', '#packages', '#process'];
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 20); onScroll(); window.addEventListener('scroll', onScroll); return () => window.removeEventListener('scroll', onScroll); }, []);
  return <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 max-w-full overflow-x-hidden ${scrolled ? 'nav-scrolled' : 'bg-transparent'}`}><nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex items-center justify-between h-20 gap-2"><LogoMark settings={settings} logoSrc={logoSrc} onActivate={onLogoClick} /><div className="hidden md:flex items-center gap-1 min-w-0">{settings.header.links.map((label, index) => <a key={`${label}-${index}`} href={routes[index] || '#top'} className="text-sm font-medium text-slate-600 dark:text-white/65 hover:text-slate-900 dark:hover:text-white transition-colors tracking-wide px-3 lg:px-4 py-2 rounded-lg hover:bg-slate-100/70 dark:hover:bg-white/5 whitespace-nowrap">{label}</a>)}<div className="ml-2 lg:ml-3 flex items-center gap-2 lg:gap-3 flex-shrink-0"><ThemeToggle theme={theme} onToggle={onToggle} /><a href="#contact" className="btn-primary text-white text-sm font-semibold px-4 lg:px-5 py-2.5 rounded-lg inline-flex items-center gap-2 whitespace-nowrap">{settings.header.cta}<ArrowUpRight className="w-4 h-4" /></a></div></div><div className="md:hidden flex items-center gap-2 flex-shrink-0"><ThemeToggle theme={theme} onToggle={onToggle} /><button className="text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">{mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button></div></div>{mobileOpen && <div className="md:hidden pb-6 pt-2 mobile-nav"><div className="flex flex-col gap-1">{settings.header.links.map((label, index) => <a key={`${label}-${index}`} href={routes[index] || '#top'} onClick={() => setMobileOpen(false)} className="text-slate-700 dark:text-white/75 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 px-3 py-3 rounded-lg text-sm font-medium transition-colors">{label}</a>)}<a href="#contact" onClick={() => setMobileOpen(false)} className="btn-primary text-white text-sm font-semibold px-4 py-3 rounded-lg inline-flex items-center justify-center gap-2 mt-3">{settings.header.cta}<ArrowUpRight className="w-4 h-4" /></a></div></div>}</nav></header>;
}

function MediaLayer({ src, type, alt = '', zIndex = 'z-0' }: { src?: string; type?: MediaType; alt?: string; zIndex?: string }) {
  if (!src) return null;
  return type === 'video' ? <video className={`absolute inset-0 w-full h-full object-cover ${zIndex}`} src={src} autoPlay muted loop playsInline aria-label={alt} /> : <img className={`absolute inset-0 w-full h-full object-cover ${zIndex}`} src={src} alt={alt} />;
}

function SectionHeading({ eyebrow, title, subtitle, font }: { eyebrow: string; title: string; subtitle?: string; font: string }) {
  return (
    <div className="max-w-3xl mb-12 sm:mb-16">
      <div className="inline-flex items-center gap-3 mb-4 sm:mb-6">
        <div className="h-px w-12 brand-accent-bg flex-shrink-0" />
        <span className="section-label">{eyebrow}</span>
      </div>
      <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold brand-heading tracking-tight leading-tight break-words" style={{ fontFamily: font }}>
        {title}
      </h2>
      {subtitle && <p className="brand-copy text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mt-4 sm:mt-6 break-words">{subtitle}</p>}
    </div>
  );
}

function Hero({ settings, heroSrc }: { settings: SiteSettings; heroSrc?: string }) {
  const { hero } = settings;
  const hasMedia = Boolean(heroSrc);
  return (
    <section id="top" className="relative min-h-screen flex items-center justify-center pt-28 sm:pt-32 pb-16 sm:pb-20 overflow-hidden max-w-full">
      {/* Background image/video */}
      {hasMedia && (
        <>
          <MediaLayer src={heroSrc} type={hero.assetType} alt="merQato.digital hero" zIndex="z-0" />
          {/* Soft vignette overlay */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-white/50 via-white/20 to-white/70 dark:from-[#0B0F17]/50 dark:via-[#0B0F17]/10 dark:to-[#0B0F17]/70 pointer-events-none" />
          <div className="absolute inset-0 z-[2] grid-overlay opacity-30 pointer-events-none" />
        </>
      )}
      {!hasMedia && (
        <>
          <div className="absolute inset-0 grid-overlay pointer-events-none z-0" />
          <div className="absolute inset-0 radial-glow pointer-events-none z-0" />
        </>
      )}
      <div className="absolute inset-0 radial-glow pointer-events-none z-[1]" />
      <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden pointer-events-none z-[1]">
        <svg className="absolute -right-40 top-1/4" width="600" height="600" viewBox="0 0 600 600" fill="none" aria-hidden="true">
          <path d="M0 600 L600 0 L600 600 Z" fill="var(--crimson)" opacity="0.05" />
          <path d="M-100 600 L500 0 L500 600 Z" stroke="var(--crimson)" strokeOpacity="0.25" strokeWidth="1" fill="none" />
        </svg>
      </div>
      {/* Content */}
      <div className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {hasMedia && <div className="absolute inset-x-0 -top-10 -bottom-10 z-[-1] backdrop-blur-[2px]" />}
        <div className="inline-flex items-center gap-2 mb-8 sm:mb-10 fade-in-up max-w-full">
          <div className={`relative px-4 sm:px-5 py-2 rounded-full brand-accent-soft brand-accent-border border max-w-full ${hasMedia ? 'backdrop-blur-md bg-white/70 dark:bg-[#0B0F17]/70' : ''}`}>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="w-1.5 h-1.5 rounded-full brand-accent-bg pulse-slow flex-shrink-0" />
              <span className="font-mono text-[0.65rem] sm:text-[0.7rem] font-medium tracking-[0.16em] sm:tracking-[0.2em] brand-accent-text uppercase break-words">{hero.badge}</span>
            </div>
          </div>
        </div>
        <h1 className={`text-3xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold leading-[1.08] tracking-tight brand-heading mb-6 sm:mb-8 fade-in-up break-words max-w-full ${hasMedia ? 'drop-shadow-hero' : ''}`} style={{ animationDelay: '0.1s', fontFamily: settings.fonts.heading }}>
          {hero.titleLineOne}<br />{hero.titleLineTwo}{' '}
          <span className="relative inline-block">
            <span className="relative z-10">{hero.titleAccent}</span>
            <span className="absolute bottom-1 left-0 right-0 h-3 brand-accent-soft -skew-x-6 z-0" />
          </span>
        </h1>
        <p className={`max-w-2xl mx-auto brand-copy text-sm sm:text-base md:text-lg leading-relaxed mb-8 sm:mb-12 fade-in-up rounded-xl px-4 sm:px-6 py-3 break-words ${hasMedia ? 'bg-white/50 dark:bg-[#0B0F17]/50 backdrop-blur-md' : ''}`} style={{ animationDelay: '0.2s' }}>
          {hero.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 fade-in-up w-full max-w-md sm:max-w-none mx-auto" style={{ animationDelay: '0.3s' }}>
          <a href="#packages" className="btn-primary text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg inline-flex items-center justify-center gap-2 text-sm crimson-glow w-full sm:w-auto">{hero.primaryCta}<ArrowRight className="w-4 h-4 flex-shrink-0" /></a>
          <a href="#process" className={`btn-secondary font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg inline-flex items-center justify-center gap-2 text-sm w-full sm:w-auto ${hasMedia ? 'backdrop-blur-md bg-white/70 dark:bg-white/15' : ''}`}>{hero.secondaryCta}<ChevronRight className="w-4 h-4 flex-shrink-0" /></a>
        </div>
      </div>
    </section>
  );
}

function About({ settings, aboutSrc }: { settings: SiteSettings; aboutSrc?: string }) {
  const { about } = settings;
  return (
    <section id="about" className="relative py-20 sm:py-24 lg:py-32 overflow-hidden max-w-full">
      <div className="absolute inset-0 grid-overlay opacity-60 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={about.eyebrow} title={about.title} font={settings.fonts.heading} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
          <div className="glass-card rounded-2xl p-6 sm:p-8 lg:p-10">
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className="w-10 h-10 rounded-lg icon-chip flex items-center justify-center flex-shrink-0"><Shield className="w-5 h-5 brand-accent-text" /></div>
              <h3 className="text-base sm:text-lg font-semibold brand-heading tracking-tight break-words" style={{ fontFamily: settings.fonts.heading }}>{about.missionTitle}</h3>
            </div>
            <p className="brand-copy leading-relaxed text-sm sm:text-[15px] break-words">{about.mission}</p>
          </div>
          <div className="glass-card rounded-2xl p-6 sm:p-8 lg:p-10">
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className="w-10 h-10 rounded-lg icon-chip flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 brand-accent-text" /></div>
              <h3 className="text-base sm:text-lg font-semibold brand-heading tracking-tight break-words" style={{ fontFamily: settings.fonts.heading }}>{about.aboutTitle}</h3>
            </div>
            <p className="brand-copy leading-relaxed text-sm sm:text-[15px] break-words">{about.description}</p>
          </div>
        </div>
        {aboutSrc && (
          <div className="relative mt-8 sm:mt-10 h-56 sm:h-64 md:h-80 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm max-w-full">
            <MediaLayer src={aboutSrc} type={about.assetType} alt="Digital infrastructure work" zIndex="z-0" />
            <div className="absolute inset-0 z-[1] bg-gradient-to-t from-white/40 via-transparent to-white/20 dark:from-[#0B0F17]/40 dark:via-transparent dark:to-[#0B0F17]/20 pointer-events-none" />
          </div>
        )}
      </div>
    </section>
  );
}

const pillarIcons = [Globe, Bot, Share2];
function Pillars({ settings }: { settings: SiteSettings }) {
  const { pillars } = settings;
  return (
    <section id="pillars" className="relative py-20 sm:py-24 lg:py-32 bg-slate-50/50 dark:bg-transparent overflow-hidden max-w-full">
      <div className="absolute inset-0 grid-overlay opacity-50 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={pillars.eyebrow} title={pillars.title} subtitle={pillars.subtitle} font={settings.fonts.heading} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {pillars.items.map((pillar, index) => {
            const Icon = pillarIcons[index] || Globe;
            return (
              <div key={`${pillar.title}-${index}`} className="glass-card rounded-2xl p-6 sm:p-8 hover-lift relative overflow-hidden group">
                <div className="absolute top-6 right-6 step-watermark text-4xl sm:text-5xl font-bold group-hover:text-[var(--crimson-soft)] transition-colors select-none pointer-events-none">0{index + 1}</div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl icon-chip flex items-center justify-center mb-6 sm:mb-7 transition-colors group-hover:bg-[var(--crimson-soft)] flex-shrink-0">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 brand-accent-text" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold brand-heading mb-3 sm:mb-4 tracking-tight break-words" style={{ fontFamily: settings.fonts.heading }}>{pillar.title}</h3>
                <p className="brand-copy leading-relaxed text-sm sm:text-[14.5px] mb-6 break-words">{pillar.description}</p>
                <ul className="space-y-2.5">
                  {pillar.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-xs sm:text-[13.5px] brand-copy break-words">
                      <CheckCircle2 className="w-4 h-4 brand-accent-text flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Packages({ settings }: { settings: SiteSettings }) {
  const { packages } = settings;
  return (
    <section id="packages" className="relative py-20 sm:py-24 lg:py-32 overflow-hidden max-w-full">
      <div className="absolute inset-0 grid-overlay opacity-40 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={packages.eyebrow} title={packages.title} subtitle={packages.subtitle} font={settings.fonts.heading} />
        {/* Packages stack on mobile and tablet, 3 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {packages.items.map((pkg, index) => (
            <div key={`${pkg.name}-${index}`} className={`relative rounded-2xl p-6 sm:p-8 lg:p-9 flex flex-col hover-lift ${pkg.featured ? 'glass-card-crimson lg:scale-[1.02] lg:-my-2 z-10' : 'glass-card'}`}>
              {pkg.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="brand-accent-bg text-white text-[10px] sm:text-[10.5px] font-bold tracking-[0.15em] uppercase px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                    Most Capable
                  </div>
                </div>
              )}
              <div className="mb-5 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold brand-heading tracking-tight mb-1 break-words" style={{ fontFamily: settings.fonts.heading }}>{pkg.name}</h3>
                <div className="flex items-baseline gap-2 mt-3 flex-wrap">
                  <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${pkg.featured ? 'brand-accent-text' : 'brand-heading'}`}>{pkg.price}</span>
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-white/45 font-medium">{pkg.priceSub}</span>
                </div>
              </div>
              <p className="brand-copy text-xs sm:text-sm leading-relaxed mb-5 min-h-[50px] break-words">{pkg.description}</p>
              <div className={`text-[11.5px] sm:text-[12px] leading-relaxed px-3.5 py-3 rounded-lg mb-6 sm:mb-7 border break-words ${pkg.featured ? 'brand-accent-soft brand-accent-border brand-copy' : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/5 brand-copy'}`}>{pkg.tag}</div>
              <div className={`h-px mb-6 ${pkg.featured ? 'bg-[var(--crimson-border)]' : 'bg-slate-200/70 dark:bg-white/5'}`} />
              <ul className="space-y-3 mb-8 flex-grow">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm brand-copy break-words">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 brand-accent-text" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a href="#contact" className={`w-full text-center font-semibold text-sm px-6 py-3.5 rounded-lg inline-flex items-center justify-center gap-2 transition-all ${pkg.featured ? 'btn-primary text-white crimson-glow' : 'btn-secondary'}`}>
                Get Started<ArrowRight className="w-4 h-4 flex-shrink-0" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const processIcons = [Radio, Cpu, Globe, Shield];
function Process({ settings }: { settings: SiteSettings }) {
  const { process } = settings;
  return (
    <section id="process" className="relative py-20 sm:py-24 lg:py-32 bg-slate-50/50 dark:bg-transparent overflow-hidden max-w-full">
      <div className="absolute inset-0 grid-overlay opacity-50 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={process.eyebrow} title={process.title} subtitle={process.subtitle} font={settings.fonts.heading} />
        {/* Desktop only (lg) */}
        <div className="hidden lg:block">
          <div className="relative">
            <div className="absolute top-[46px] left-0 right-0 h-px process-connector" />
            <div className="absolute top-[44px] left-0 right-0 h-0.5 process-line" />
            <div className="grid grid-cols-4 gap-6">
              {process.steps.map((step, index) => {
                const Icon = processIcons[index] || Radio;
                const num = String(index + 1).padStart(2, '0');
                return (
                  <div key={`${step}-${index}`} className="relative flex flex-col items-center text-center">
                    <div className="relative z-10 w-[56px] h-[56px] rounded-full process-circle flex items-center justify-center mb-6">
                      <Icon className="w-5 h-5 text-slate-500 dark:text-white/50" strokeWidth={1.75} />
                    </div>
                    <div className="absolute top-[20px] -right-2 z-20">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full brand-accent-bg text-white text-[10px] font-bold border-2 border-white dark:border-[#0B0F17] shadow-sm">
                        {index + 1}
                      </span>
                    </div>
                    <span className="text-xs font-mono brand-accent-text font-medium tracking-widest mb-2">{num}</span>
                    <h4 className="text-sm lg:text-base font-semibold brand-heading leading-snug max-w-[200px] break-words" style={{ fontFamily: settings.fonts.heading }}>{step}</h4>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Mobile and Tablet: completely stacked vertical timeline */}
        <div className="lg:hidden space-y-0 max-w-xl">
          {process.steps.map((step, index) => {
            const Icon = processIcons[index] || Radio;
            return (
              <div key={`${step}-${index}`} className="relative pl-12 pb-10 last:pb-0">
                {index < process.steps.length - 1 && <div className="absolute left-[22px] top-11 bottom-0 w-px process-connector" />}
                <div className="absolute left-0 top-0 w-11 h-11 rounded-full bg-white dark:bg-[#0B0F17] border-2 brand-accent-border flex items-center justify-center shadow-sm flex-shrink-0">
                  <Icon className="w-4 h-4 brand-accent-text" strokeWidth={1.75} />
                </div>
                <span className="text-xs font-mono brand-accent-text font-medium tracking-widest mb-1 block">{String(index + 1).padStart(2, '0')}</span>
                <h4 className="text-base font-semibold brand-heading leading-snug break-words" style={{ fontFamily: settings.fonts.heading }}>{step}</h4>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FAQ({ settings }: { settings: SiteSettings }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { faq } = settings;
  return (
    <section id="faq" className="relative py-20 sm:py-24 lg:py-32 overflow-hidden max-w-full">
      <div className="absolute inset-0 grid-overlay opacity-40 pointer-events-none" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={faq.eyebrow} title={faq.title} font={settings.fonts.heading} />
        <div className="border-t border-slate-200 dark:border-white/10">
          {faq.items.map((item, index) => {
            const open = index === openIndex;
            return (
              <div key={`${item.question}-${index}`} className="border-b border-slate-200 dark:border-white/10">
                <button type="button" onClick={() => setOpenIndex(open ? null : index)} className="w-full py-5 sm:py-6 flex items-center justify-between gap-4 text-left">
                  <span className="text-sm sm:text-base md:text-lg font-semibold brand-heading break-words pr-2" style={{ fontFamily: settings.fonts.heading }}>{item.question}</span>
                  <ChevronDown className={`w-5 h-5 brand-accent-text flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <p className="brand-copy text-sm sm:text-[15px] leading-relaxed pb-6 max-w-3xl break-words">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FooterCTA({ settings, footerSrc }: { settings: SiteSettings; footerSrc?: string }) {
  const { footer } = settings;
  const hasMedia = Boolean(footerSrc);
  return (
    <section id="contact" className="relative py-20 sm:py-24 lg:py-32 overflow-hidden max-w-full">
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl glass-card-crimson p-6 sm:p-10 md:p-16 text-center max-w-full">
          {hasMedia ? (
            <>
              <MediaLayer src={footerSrc} type={footer.assetType} alt="Palawan operations" zIndex="z-0" />
              <div className="absolute inset-0 z-[1] bg-gradient-to-b from-white/70 via-white/50 to-white/80 dark:from-[#0B0F17]/70 dark:via-[#0B0F17]/40 dark:to-[#0B0F17]/80 pointer-events-none" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 grid-overlay opacity-40 pointer-events-none z-0" />
              <div className="absolute -top-32 -right-32 w-80 h-80 brand-accent-soft rounded-full blur-3xl pointer-events-none z-0" />
            </>
          )}
          <div className="relative z-10 max-w-full">
            <span className="section-label tracking-widest">{footer.eyebrow}</span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold brand-heading tracking-tight leading-tight mt-6 sm:mt-8 mb-4 sm:mb-6 drop-shadow-sm break-words" style={{ fontFamily: settings.fonts.heading }}>
              {footer.headline}
            </h2>
            <p className="brand-copy text-sm sm:text-base sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed backdrop-blur-sm bg-white/40 dark:bg-[#0B0F17]/40 rounded-xl px-4 sm:px-6 py-3 break-words">
              {footer.subtext}
            </p>
            <a href={`mailto:${footer.email}`} className="btn-primary text-white font-semibold px-8 sm:px-10 py-3.5 sm:py-4 rounded-lg inline-flex items-center justify-center gap-2.5 text-sm crimson-glow-lg w-full sm:w-auto">
              {footer.cta}<ArrowRight className="w-4 h-4 flex-shrink-0" />
            </a>
            <div className="mt-8 sm:mt-12 inline-flex items-center justify-center gap-2 text-slate-500 dark:text-white/45 text-xs sm:text-sm backdrop-blur-sm bg-white/30 dark:bg-[#0B0F17]/30 rounded-full px-4 py-2 max-w-full break-words">
              <MapPin className="w-4 h-4 brand-accent-text flex-shrink-0" /><span className="truncate sm:whitespace-normal">{footer.location}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type LegalDocument = 'privacy' | 'terms' | 'sla';

const LEGAL_DOCUMENTS: Record<LegalDocument, { title: string; reference: string; icon: typeof ShieldCheck; sections: { heading: string; body: string }[] }> = {
  privacy: {
    title: 'Privacy Policy',
    reference: 'Philippine Data Privacy Act of 2012 (RA 10173)',
    icon: ShieldCheck,
    sections: [
      { heading: 'Data stewardship', body: 'merQato.digital acts as a responsible personal information controller for inquiry and engagement records it collects directly, and as a personal information processor when operating client systems. Processing follows transparency, legitimate purpose, and proportionality principles under Republic Act No. 10173 and its implementing rules.' },
      { heading: 'Information and purpose', body: 'We may process identity, business contact, project, billing, device, and communication information to respond to inquiries, perform system audits, deliver contracted services, maintain security, satisfy legal duties, and improve operational reliability. We do not sell personal information.' },
      { heading: 'Processors, transfers, and safeguards', body: 'Approved cloud, communications, analytics, and payment providers may process limited data under contractual safeguards. Where infrastructure routes data outside the Philippines, we use appropriate technical and contractual measures, least-privilege access, encryption in transit, and controlled administrative access.' },
      { heading: 'Retention and data-subject rights', body: 'Records are retained only for operational, contractual, security, and statutory requirements, then securely deleted or anonymized. Data subjects may request access, correction, erasure, objection, portability, or withdrawal of consent by contacting the Island Desk. Requests are verified before action to protect account security.' },
    ],
  },
  terms: {
    title: 'Terms of Engagement & IP',
    reference: 'Professional Services, Delivery, and Ownership Framework',
    icon: Scale,
    sections: [
      { heading: 'Engagement and scope', body: 'Services commence under an accepted proposal, statement of work, or written authorization defining scope, milestones, client dependencies, fees, and acceptance criteria. Material scope changes require written change approval and may affect delivery dates and fees.' },
      { heading: 'Client responsibilities', body: 'Clients provide timely access, accurate operating information, lawful content, approvals, and authorized credentials. Client delays, incomplete materials, third-party approvals, or infrastructure outside merQato.digital control may revise the delivery schedule.' },
      { heading: 'Intellectual property', body: 'Upon full payment, the client owns approved, bespoke final deliverables expressly identified in the engagement. Each party retains its pre-existing intellectual property. merQato.digital retains reusable frameworks, methods, know-how, utilities, and non-client-specific components while granting the client the licenses necessary to operate the delivered system.' },
      { heading: 'Confidentiality, third parties, and liability', body: 'Both parties protect confidential information using reasonable care. Third-party platforms remain governed by their own terms and availability. Liability allocation, warranties, termination, dispute procedure, and governing law are controlled by the signed engagement document, which prevails over this website summary.' },
    ],
  },
  sla: {
    title: 'Island SLA & Brownout Uptime',
    reference: 'Resilience, Incident Response, and Service Continuity',
    icon: BatteryCharging,
    sections: [
      { heading: 'Resilience architecture', body: 'Production systems may use geographically distributed cloud services, edge caching, monitored backups, Starlink or terrestrial connectivity, solar and battery contingency, and offline-first synchronization where included in the selected package and statement of work.' },
      { heading: 'Availability target', body: 'Managed production services target the availability stated in the client agreement. Availability calculations exclude approved maintenance, client-caused incidents, force majeure, upstream platform outages, domain or billing suspension, and services not managed by merQato.digital.' },
      { heading: 'Brownouts and degraded connectivity', body: 'Local power loss does not automatically interrupt cloud-hosted public services. Island operations can continue through configured power and connectivity failover, but physical-site uptime depends on the client maintaining approved batteries, network hardware, fuel or solar capacity, and safe equipment conditions.' },
      { heading: 'Incident handling and recovery', body: 'Priority incidents are acknowledged according to the contracted response window. We triage impact, stabilize service, communicate material status, restore from validated backups where required, and complete a post-incident review for qualifying events. No architecture can guarantee uninterrupted operation in every circumstance.' },
    ],
  },
};

function LegalModal({ document, onClose }: { document: LegalDocument; onClose: () => void }) {
  const content = LEGAL_DOCUMENTS[document];
  const Icon = content.icon;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/55 backdrop-blur-md p-3 sm:p-6 overflow-y-auto overflow-x-hidden flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="legal-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="w-full max-w-3xl my-auto bg-white dark:bg-[#101722] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden max-w-full break-words">
        <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-200 dark:border-white/10 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl brand-accent-soft brand-accent-border border flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 brand-accent-text" />
            </div>
            <div className="min-w-0">
              <span className="section-label">Governance Desk</span>
              <h2 id="legal-title" className="text-lg sm:text-2xl font-bold brand-heading mt-1 break-words">{content.title}</h2>
              <p className="text-xs brand-accent-text font-medium mt-0.5 break-words">{content.reference}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center brand-copy hover:brand-heading hover:bg-slate-50 dark:hover:bg-white/5 flex-shrink-0" aria-label="Close legal document">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 sm:px-8 py-6 sm:py-7 space-y-6 sm:space-y-7 max-h-[75vh] overflow-y-auto">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h3 className="text-sm font-bold brand-heading mb-1.5 break-words">{section.heading}</h3>
              <p className="text-xs sm:text-sm brand-copy leading-6 sm:leading-7 break-words">{section.body}</p>
            </section>
          ))}
          <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-3.5 sm:p-4 text-[11px] sm:text-xs brand-copy leading-relaxed break-words">
            Last reviewed: {new Date().getFullYear()}. This web summary supports transparency and does not replace the signed engagement, data processing agreement, or legal advice for a specific matter.
          </div>
        </div>
      </div>
    </div>
  );
}

function FacebookIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function YoutubeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <polygon points="10 15 15 12 10 9 10 15" />
    </svg>
  );
}

function WebsiteIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function LinkedinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 4l11.733 16h4.267l-11.733-16zM4 20l6.768-6.768m2.464-2.464L20 4" />
    </svg>
  );
}

function renderSocialIcon(platform: SocialPlatform, className = 'w-4 h-4') {
  switch (platform) {
    case 'Facebook': return <FacebookIcon className={className} />;
    case 'Instagram': return <InstagramIcon className={className} />;
    case 'GitHub': return <GithubIcon className={className} />;
    case 'YouTube': return <YoutubeIcon className={className} />;
    case 'LinkedIn': return <LinkedinIcon className={className} />;
    case 'X': return <XIcon className={className} />;
    case 'Website':
    default:
      return <WebsiteIcon className={className} />;
  }
}

function StudioFooter({ settings, logoSrc, onAdminRequest }: { settings: SiteSettings; logoSrc?: string; onAdminRequest: () => void }) {
  const [clock, setClock] = useState(() => new Date());
  const [legalDocument, setLegalDocument] = useState<LegalDocument | null>(null);
  const { footer } = settings;
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const phtTime = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(clock);
  const phtDate = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: '2-digit', year: 'numeric' }).format(clock);
  const whatsappHref = `https://wa.me/${footer.whatsapp.replace(/\D/g, '')}`;
  const studioLinks = [
    ['Home', '#top'], ['About', '#about'], ['Pillars', '#pillars'], ['Reviews', '#about'],
    ['Pricing', '#packages'], ['FAQ', '#faq'], ['Inquiry', '#contact'],
  ];
  const capabilityLinks = [
    ['Island Resort & Tour Websites', '#pillars'], ['24/7 WhatsApp Booking Bots', '#pillars'],
    ['Offline & Low-Bandwidth Sync', '#pillars'], ['Automated Calendars & Sheets', '#process'],
    ['GCash / Maya / Stripe Checkout', '#packages'],
  ];

  return <>
    <footer className="relative overflow-hidden border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080c13] max-w-full">
      <div className="absolute inset-0 grid-overlay opacity-40 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20">
        {/* Studio profile */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-10 pb-10 sm:pb-12 border-b border-slate-200 dark:border-white/10">
          <div>
            <LogoMark settings={settings} logoSrc={logoSrc} />
            <p className="mt-4 sm:mt-5 max-w-xl text-xs sm:text-sm lg:text-[15px] leading-6 sm:leading-7 brand-copy break-words">
              {settings.branding.tagline}. We design resilient Web, AI Agent, and social operations for enterprises working across islands and international markets.
            </p>
            <div className="flex flex-wrap gap-2 mt-5 sm:mt-6">
              {footer.badges.map((badge) => (
                <span key={badge} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-2.5 py-1.5 font-mono text-[9px] font-semibold tracking-[0.11em] brand-copy break-words">
                  <ShieldCheck className="w-3 h-3 brand-accent-text flex-shrink-0" />
                  <span>{badge}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="lg:text-right">
            <p className="section-label">Studio Network</p>
            <div className="flex flex-wrap lg:justify-end gap-2 mt-3 sm:mt-4">
              {footer.socialLinks.filter((item) => item.url).map((item, index) => (
                <a key={`${item.platform}-${index}`} href={item.url} target="_blank" rel="noreferrer" title={item.platform} aria-label={item.platform} className="footer-icon-link group flex-shrink-0">
                  {renderSocialIcon(item.platform, "w-4 h-4 transition-transform group-hover:scale-110")}
                </a>
              ))}
            </div>
            <div className="flex flex-wrap lg:justify-end gap-x-4 gap-y-2 mt-4 sm:mt-5">
              {footer.websites.filter((item) => item.url).map((item, index) => (
                <a key={`${item.label}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold brand-copy hover:brand-accent-text transition-colors break-words">
                  <WebsiteIcon className="w-3.5 h-3.5 brand-accent-text flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                  <ExternalLink className="w-3 h-3 opacity-60 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Telemetry strip - completely stacked on mobile, 2x2 on tablet, 4 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1fr_1.2fr_1.4fr_auto] border-b border-slate-200 dark:border-white/10 w-full max-w-full">
          <div className="footer-telemetry-cell">
            <Clock3 className="w-4 h-4 brand-accent-text flex-shrink-0" />
            <div className="min-w-0">
              <span className="footer-kicker">Palawan Station / PHT</span>
              <strong className="footer-value font-mono truncate">{phtTime} <span className="font-sans font-normal opacity-60">{phtDate}</span></strong>
            </div>
          </div>
          <div className="footer-telemetry-cell">
            <span className="relative flex w-2 h-2 flex-shrink-0">
              <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
              <span className="relative rounded-full bg-emerald-500 w-2 h-2" />
            </span>
            <div className="min-w-0">
              <span className="footer-kicker">Operational Status</span>
              <strong className="footer-value text-emerald-700 dark:text-emerald-400 truncate">Systems 100% Operational</strong>
            </div>
          </div>
          <div className="footer-telemetry-cell">
            <MapPin className="w-4 h-4 brand-accent-text flex-shrink-0" />
            <div className="min-w-0">
              <span className="footer-kicker">Headquarters Coordinates</span>
              <strong className="footer-value break-words">{footer.coordinates}</strong>
            </div>
          </div>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="footer-telemetry-cell justify-center hover:bg-white dark:hover:bg-white/5 transition-colors cursor-pointer">
            <ArrowUp className="w-4 h-4 brand-accent-text flex-shrink-0" />
            <span className="text-xs font-semibold brand-heading">Back to top</span>
          </button>
        </div>

        {/* Directory - completely stacked on mobile, 2 columns on tablet, 4 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-10 py-10 sm:py-14 w-full max-w-full">
          <div>
            <h3 className="footer-column-title">Capabilities & Solutions</h3>
            <ul className="space-y-3">
              {capabilityLinks.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="footer-directory-link break-words">
                    <ChevronRight className="w-3 h-3 brand-accent-text flex-shrink-0" />
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="footer-column-title">Studio Directory</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              {studioLinks.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="footer-directory-link break-words">{label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="footer-column-title">Island Desk & Inquiries</h3>
            <div className="space-y-3.5">
              <a href={`mailto:${footer.email}`} className="footer-contact-row break-all">
                <Mail className="w-4 h-4 brand-accent-text flex-shrink-0 mt-0.5" />
                <span>{footer.email}</span>
              </a>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="footer-contact-row break-words">
                <MessageCircle className="w-4 h-4 brand-accent-text flex-shrink-0 mt-0.5" />
                <span>{footer.whatsapp}</span>
              </a>
              <div className="footer-contact-row break-words">
                <Clock3 className="w-4 h-4 brand-accent-text flex-shrink-0 mt-0.5" />
                <span>{footer.deskHours}</span>
              </div>
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400 break-words">
                {footer.responseSla}
              </div>
              <div className="flex items-center gap-2 pt-0.5 text-[10px] font-mono tracking-wide brand-copy flex-wrap">
                <CreditCard className="w-3.5 h-3.5 brand-accent-text flex-shrink-0" />
                <span>GCASH • MAYA • STRIPE</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="footer-column-title">Governance & Legal Desk</h3>
            <div className="space-y-1.5">
              {([['privacy', 'Privacy Policy (RA 10173)', ShieldCheck], ['terms', 'Terms of Engagement & IP', Scale], ['sla', 'Island SLA & Brownout Uptime', BatteryCharging]] as const).map(([document, label, Icon]) => (
                <button key={document} type="button" onClick={() => setLegalDocument(document)} className="footer-legal-button">
                  <Icon className="w-4 h-4 brand-accent-text flex-shrink-0" />
                  <span className="truncate">{label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-auto opacity-45 flex-shrink-0" />
                </button>
              ))}
            </div>
            <button type="button" onClick={onAdminRequest} className="mt-5 w-full rounded-lg border border-slate-300 dark:border-white/15 px-3 py-2.5 inline-flex items-center justify-center gap-2 text-xs font-semibold brand-heading hover:border-[var(--crimson)] hover:text-[var(--crimson)] transition-colors">
              <LockKeyhole className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Admin Passkey Terminal</span>
            </button>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-white/10 py-6 sm:py-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left w-full">
          <p className="text-xs brand-copy break-words">© {new Date().getFullYear()} {footer.copyright}</p>
          <div className="flex items-center justify-center gap-2 text-[10px] font-mono tracking-[0.08em] brand-copy">
            <Wifi className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>PALAWAN EDGE STATION ONLINE</span>
          </div>
        </div>
      </div>
    </footer>
    {legalDocument && <LegalModal document={legalDocument} onClose={() => setLegalDocument(null)} />}
  </>;
}

function InputField({ label, value, onChange, multiline = false, hint }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; hint?: string }) {
  return <label className="block"><span className="admin-label">{label}</span>{multiline ? <textarea className="admin-textarea" value={value} onChange={(event) => onChange(event.target.value)} /> : <input className="admin-input" value={value} onChange={(event) => onChange(event.target.value)} />}{hint && <span className="block mt-1.5 text-[11px] text-slate-500 dark:text-white/40">{hint}</span>}</label>;
}

function EditorGroup({ title, children }: { title: string; children: ReactNode }) {
  return <section className="pb-8 mb-8 border-b border-slate-200 dark:border-white/10"><h3 className="text-sm font-bold brand-heading mb-5">{title}</h3><div className="space-y-4">{children}</div></section>;
}

function AssetControl({ title, detail, src, type, imageOnly = false, onUpload, onClear }: { title: string; detail: string; src?: string; type?: MediaType; imageOnly?: boolean; onUpload: (file: File) => void; onClear: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return <div className="border-b border-slate-200 dark:border-white/10 pb-6 mb-6 last:border-0"><div className="flex items-start justify-between gap-4 mb-3"><div><h3 className="text-sm font-semibold brand-heading">{title}</h3><p className="text-xs brand-copy mt-1">{detail}</p></div>{src && <button type="button" onClick={onClear} className="text-xs font-semibold text-rose-600 hover:text-rose-700">Remove</button>}</div><button type="button" onClick={() => inputRef.current?.click()} className="asset-dropzone relative h-28 w-full rounded-xl overflow-hidden flex items-center justify-center">{src ? <>{type === 'video' ? <video src={src} className="absolute inset-0 w-full h-full object-cover" muted /> : <img src={src} alt="Selected asset" className="absolute inset-0 w-full h-full object-cover" />}<span className="relative z-10 bg-white/90 dark:bg-[#0B0F17]/90 brand-heading px-3 py-1.5 rounded-md text-xs font-semibold">Replace file</span></> : <span className="flex flex-col items-center gap-2 brand-copy text-xs"><Upload className="w-5 h-5 brand-accent-text" />Upload from device</span>}</button><input ref={inputRef} className="hidden" type="file" accept={imageOnly ? 'image/*' : 'image/*,video/*'} onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file); event.currentTarget.value = ''; }} /></div>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block w-full">
      <span className="admin-label">{label}</span>
      <div className="flex items-center gap-2 w-full">
        <input className="h-10 w-12 flex-shrink-0 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent p-1 cursor-pointer" type="color" value={value} onChange={(event) => onChange(event.target.value)} />
        <input className="admin-input font-mono uppercase flex-1 min-w-0" value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </label>
  );
}

function AuthenticationModal({ onClose, onUnlock }: { onClose: () => void; onUnlock: () => void }) {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState('');
  const expectedPasskey = import.meta.env.VITE_ADMIN_PASSKEY;
  const submit = (event: FormEvent) => { event.preventDefault(); if (!expectedPasskey) { setError('Admin access is not configured. Set VITE_ADMIN_PASSKEY in your environment.'); return; } if (passkey === expectedPasskey) onUnlock(); else setError('That passkey is not recognized.'); };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/30 dark:bg-black/65 backdrop-blur-sm overflow-x-hidden">
      <form onSubmit={submit} className="w-full max-w-sm max-w-[92vw] bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl p-6 sm:p-7 break-words">
        <div className="flex items-center justify-between mb-6">
          <div className="w-10 h-10 rounded-lg brand-accent-soft flex items-center justify-center flex-shrink-0">
            <LockKeyhole className="w-5 h-5 brand-accent-text" />
          </div>
          <button type="button" onClick={onClose} aria-label="Close passkey prompt" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <h2 className="text-lg sm:text-xl font-bold brand-heading break-words">Backoffice Access</h2>
        <p className="brand-copy text-xs sm:text-sm leading-relaxed mt-1.5 mb-5 break-words">Enter the administrator passkey to manage the site.</p>
        <InputField label="Passkey" value={passkey} onChange={(value) => { setPasskey(value); setError(''); }} />
        {error && <p className="text-xs sm:text-sm text-rose-600 mt-2.5 break-words">{error}</p>}
        <button className="btn-primary text-white w-full mt-5 py-2.5 sm:py-3 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2">
          Enter Backoffice<ArrowRight className="w-4 h-4 flex-shrink-0" />
        </button>
      </form>
    </div>
  );
}

function CloudSync({
  cloudState,
  userEmail,
  onSignIn,
  onSignOut,
  onPublish,
}: {
  cloudState: CloudState;
  userEmail?: string;
  onSignIn: (email: string, password: string) => Promise<string | undefined>;
  onSignOut: () => Promise<void>;
  onPublish: () => Promise<boolean>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');

  if (!isSupabaseConfigured) {
    return (
      <p className="text-[11px] text-slate-500 dark:text-white/40 inline-flex items-center gap-1.5 leading-relaxed break-words">
        <Cloud className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Local preview. Add Supabase environment variables to publish.</span>
      </p>
    );
  }

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    const error = await onSignIn(email, password);
    setNotice(error || 'Cloud session established.');
    if (!error) setPassword('');
  };

  if (userEmail) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 truncate">
          <Cloud className="w-3.5 h-3.5 flex-shrink-0" />Cloud ready: {userEmail}
        </span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => { void onPublish(); }} className="text-xs font-semibold brand-accent-text hover:opacity-75 cursor-pointer">Publish</button>
          <button type="button" onClick={() => { void onSignOut(); }} className="text-xs text-slate-500 dark:text-white/45 hover:text-rose-600 inline-flex items-center gap-1 cursor-pointer">
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={signIn} className="flex flex-col gap-2 w-full">
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <input className="w-full sm:flex-1 h-8 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2 text-[11px] brand-heading outline-none focus:border-[var(--crimson)] min-w-0" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" required />
        <input className="w-full sm:flex-1 h-8 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2 text-[11px] brand-heading outline-none focus:border-[var(--crimson)] min-w-0" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" required />
      </div>
      <button className="btn-primary py-1.5 px-3 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1 w-full flex-shrink-0">
        <LogIn className="w-3.5 h-3.5 flex-shrink-0" />Cloud sign in
      </button>
      {notice && <span className={`text-[10px] break-words ${notice === 'Cloud session established.' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>{notice}</span>}
      {cloudState === 'error' && <span className="text-[10px] text-rose-600 break-words">Cloud connection error. Confirm the project variables and schema.</span>}
    </form>
  );
}

function Backoffice({ settings, setSettings, assetUrls, onClose, onUpload, onClearAsset, onReset, cloudState, userEmail, onCloudSignIn, onCloudSignOut, onPublish }: { settings: SiteSettings; setSettings: React.Dispatch<React.SetStateAction<SiteSettings>>; assetUrls: Record<string, string>; onClose: () => void; onUpload: (slot: 'logo' | 'hero' | 'about' | 'footer', file: File) => void; onClearAsset: (slot: 'logo' | 'hero' | 'about' | 'footer') => void; onReset: () => void; cloudState: CloudState; userEmail?: string; onCloudSignIn: (email: string, password: string) => Promise<string | undefined>; onCloudSignOut: () => Promise<void>; onPublish: () => Promise<boolean> }) {
  const [tab, setTab] = useState<AdminTab>('content');
  const update = (callback: (current: SiteSettings) => SiteSettings) => setSettings((current) => callback(current));
  const tabs: { id: AdminTab; label: string; icon: typeof Type }[] = [{ id: 'content', label: 'Content', icon: Type }, { id: 'media', label: 'Media', icon: ImagePlus }, { id: 'design', label: 'Design', icon: Palette }, { id: 'packages', label: 'Packages', icon: SlidersHorizontal }, { id: 'faq', label: 'FAQ', icon: ChevronDown }, { id: 'footer', label: 'Footer', icon: Mail }];
  const replacePillar = (index: number, pillar: Pillar) => update((current) => ({ ...current, pillars: { ...current.pillars, items: current.pillars.items.map((item, itemIndex) => itemIndex === index ? pillar : item) } }));
  const replacePackage = (index: number, pkg: ServicePackage) => update((current) => ({ ...current, packages: { ...current.packages, items: current.packages.items.map((item, itemIndex) => itemIndex === index ? pkg : item) } }));
  return (
    <aside className="admin-panel fixed top-0 right-0 z-[60] w-full sm:w-[510px] max-w-full h-[100dvh] flex flex-col overflow-x-hidden">
      <div className="px-4 sm:px-6 pt-5 border-b border-slate-200 dark:border-white/10 w-full">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full brand-accent-bg flex-shrink-0" />
              <span className="section-label truncate">Live Backoffice</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold brand-heading mt-0.5 truncate">Site Control Center</h2>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center text-slate-600 dark:text-white/70 flex-shrink-0" aria-label="Close backoffice">
            <PanelRightClose className="w-5 h-5" />
          </button>
        </div>
        {/* All tabs stacked/grid without any horizontal scroll */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pb-3 w-full">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center justify-center gap-1 px-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all w-full truncate ${
                tab === id
                  ? 'bg-[var(--crimson)] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200/70 dark:hover:bg-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-6 w-full">
        {tab === 'content' && <ContentEditor settings={settings} update={update} replacePillar={replacePillar} />}
        {tab === 'media' && <><p className="brand-copy text-xs sm:text-sm leading-relaxed mb-6 break-words">Assets are stored in this browser's private backoffice library and remain available after a refresh.</p><AssetControl title="Logo Mark" detail="Image files only. It replaces the crimson mark while keeping the editable Futura wordmark." imageOnly src={settings.branding.logoAssetId ? assetUrls[settings.branding.logoAssetId] : undefined} type="image" onUpload={(file) => onUpload('logo', file)} onClear={() => onClearAsset('logo')} /><AssetControl title="Hero Media" detail="Use a high-resolution image or a muted MP4 for the full-bleed hero." src={settings.hero.assetId ? assetUrls[settings.hero.assetId] : undefined} type={settings.hero.assetType} onUpload={(file) => onUpload('hero', file)} onClear={() => onClearAsset('hero')} /><AssetControl title="About Section Media" detail="Image or video displayed below the mission and company profile." src={settings.about.assetId ? assetUrls[settings.about.assetId] : undefined} type={settings.about.assetType} onUpload={(file) => onUpload('about', file)} onClear={() => onClearAsset('about')} /><AssetControl title="Footer CTA Media" detail="Image or video used behind the system audit call-to-action." src={settings.footer.assetId ? assetUrls[settings.footer.assetId] : undefined} type={settings.footer.assetType} onUpload={(file) => onUpload('footer', file)} onClear={() => onClearAsset('footer')} /></>}
        {tab === 'design' && <DesignEditor settings={settings} update={update} />}
        {tab === 'packages' && <PackagesEditor settings={settings} update={update} replacePackage={replacePackage} />}
        {tab === 'faq' && <FaqEditor settings={settings} update={update} />}
        {tab === 'footer' && <FooterEditor settings={settings} update={update} />}
      </div>
      <div className="border-t border-slate-200 dark:border-white/10 px-4 sm:px-6 py-4 w-full">
        <CloudSync cloudState={cloudState} userEmail={userEmail} onSignIn={onCloudSignIn} onSignOut={onCloudSignOut} onPublish={onPublish} />
        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[11px] text-slate-500 dark:text-white/40 inline-flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5 flex-shrink-0" />Saved automatically
          </span>
          <button type="button" onClick={onReset} className="text-xs font-semibold text-slate-600 dark:text-white/60 hover:text-rose-600 inline-flex items-center gap-1.5 cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />Reset site
          </button>
        </div>
      </div>
    </aside>
  );
}

function ContentEditor({ settings, update, replacePillar }: { settings: SiteSettings; update: (callback: (current: SiteSettings) => SiteSettings) => void; replacePillar: (index: number, pillar: Pillar) => void }) {
  return (
    <>
      <EditorGroup title="Brand and Header">
        <InputField label="Brand name" value={settings.branding.name} onChange={(value) => update((current) => ({ ...current, branding: { ...current.branding, name: value } }))} />
        <InputField label="Brand tagline" value={settings.branding.tagline} onChange={(value) => update((current) => ({ ...current, branding: { ...current.branding, tagline: value } }))} />
        <InputField label="Header CTA" value={settings.header.cta} onChange={(value) => update((current) => ({ ...current, header: { ...current.header, cta: value } }))} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {settings.header.links.map((link, index) => (
            <InputField key={index} label={`Nav ${index + 1}`} value={link} onChange={(value) => update((current) => ({ ...current, header: { ...current.header, links: current.header.links.map((item, itemIndex) => itemIndex === index ? value : item) } }))} />
          ))}
        </div>
      </EditorGroup>
      <EditorGroup title="Hero">
        <InputField label="Location badge" value={settings.hero.badge} onChange={(value) => update((current) => ({ ...current, hero: { ...current.hero, badge: value } }))} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField label="Heading line one" value={settings.hero.titleLineOne} onChange={(value) => update((current) => ({ ...current, hero: { ...current.hero, titleLineOne: value } }))} />
          <InputField label="Heading line two" value={settings.hero.titleLineTwo} onChange={(value) => update((current) => ({ ...current, hero: { ...current.hero, titleLineTwo: value } }))} />
        </div>
        <InputField label="Heading accent" value={settings.hero.titleAccent} onChange={(value) => update((current) => ({ ...current, hero: { ...current.hero, titleAccent: value } }))} />
        <InputField label="Hero description" multiline value={settings.hero.subtitle} onChange={(value) => update((current) => ({ ...current, hero: { ...current.hero, subtitle: value } }))} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField label="Primary button" value={settings.hero.primaryCta} onChange={(value) => update((current) => ({ ...current, hero: { ...current.hero, primaryCta: value } }))} />
          <InputField label="Secondary button" value={settings.hero.secondaryCta} onChange={(value) => update((current) => ({ ...current, hero: { ...current.hero, secondaryCta: value } }))} />
        </div>
      </EditorGroup>
      <EditorGroup title="About">
        <InputField label="Section label" value={settings.about.eyebrow} onChange={(value) => update((current) => ({ ...current, about: { ...current.about, eyebrow: value } }))} />
        <InputField label="Section title" value={settings.about.title} onChange={(value) => update((current) => ({ ...current, about: { ...current.about, title: value } }))} />
        <InputField label="Mission title" value={settings.about.missionTitle} onChange={(value) => update((current) => ({ ...current, about: { ...current.about, missionTitle: value } }))} />
        <InputField label="Mission copy" multiline value={settings.about.mission} onChange={(value) => update((current) => ({ ...current, about: { ...current.about, mission: value } }))} />
        <InputField label="About title" value={settings.about.aboutTitle} onChange={(value) => update((current) => ({ ...current, about: { ...current.about, aboutTitle: value } }))} />
        <InputField label="About copy" multiline value={settings.about.description} onChange={(value) => update((current) => ({ ...current, about: { ...current.about, description: value } }))} />
      </EditorGroup>
      <EditorGroup title="Pillars and Process">
        <InputField label="Pillars label" value={settings.pillars.eyebrow} onChange={(value) => update((current) => ({ ...current, pillars: { ...current.pillars, eyebrow: value } }))} />
        <InputField label="Pillars title" value={settings.pillars.title} onChange={(value) => update((current) => ({ ...current, pillars: { ...current.pillars, title: value } }))} />
        <InputField label="Pillars intro" multiline value={settings.pillars.subtitle} onChange={(value) => update((current) => ({ ...current, pillars: { ...current.pillars, subtitle: value } }))} />
        {settings.pillars.items.map((pillar, index) => (
          <div key={index} className="pt-3 border-t border-slate-200 dark:border-white/10">
            <InputField label={`Pillar ${index + 1} title`} value={pillar.title} onChange={(value) => replacePillar(index, { ...pillar, title: value })} />
            <div className="mt-3">
              <InputField label="Description" multiline value={pillar.description} onChange={(value) => replacePillar(index, { ...pillar, description: value })} />
            </div>
            <div className="mt-3">
              <InputField label="Feature bullets" multiline hint="One feature per line" value={pillar.points.join('\n')} onChange={(value) => replacePillar(index, { ...pillar, points: value.split('\n').filter(Boolean) })} />
            </div>
          </div>
        ))}
        <InputField label="Process label" value={settings.process.eyebrow} onChange={(value) => update((current) => ({ ...current, process: { ...current.process, eyebrow: value } }))} />
        <InputField label="Process title" value={settings.process.title} onChange={(value) => update((current) => ({ ...current, process: { ...current.process, title: value } }))} />
        {settings.process.steps.map((step, index) => (
          <InputField key={index} label={`Step ${index + 1}`} value={step} onChange={(value) => update((current) => ({ ...current, process: { ...current.process, steps: current.process.steps.map((item, itemIndex) => itemIndex === index ? value : item) } }))} />
        ))}
      </EditorGroup>
      <EditorGroup title="Footer CTA">
        <InputField label="Section label" value={settings.footer.eyebrow} onChange={(value) => update((current) => ({ ...current, footer: { ...current.footer, eyebrow: value } }))} />
        <InputField label="Headline" multiline value={settings.footer.headline} onChange={(value) => update((current) => ({ ...current, footer: { ...current.footer, headline: value } }))} />
        <InputField label="Supporting copy" multiline value={settings.footer.subtext} onChange={(value) => update((current) => ({ ...current, footer: { ...current.footer, subtext: value } }))} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField label="CTA label" value={settings.footer.cta} onChange={(value) => update((current) => ({ ...current, footer: { ...current.footer, cta: value } }))} />
          <InputField label="Email" value={settings.footer.email} onChange={(value) => update((current) => ({ ...current, footer: { ...current.footer, email: value } }))} />
        </div>
        <InputField label="Location" value={settings.footer.location} onChange={(value) => update((current) => ({ ...current, footer: { ...current.footer, location: value } }))} />
        <InputField label="Copyright" value={settings.footer.copyright} onChange={(value) => update((current) => ({ ...current, footer: { ...current.footer, copyright: value } }))} />
      </EditorGroup>
    </>
  );
}

function DesignEditor({ settings, update }: { settings: SiteSettings; update: (callback: (current: SiteSettings) => SiteSettings) => void }) {
  const color = (key: keyof SiteSettings['palette']) => (value: string) => update((current) => ({ ...current, palette: { ...current.palette, [key]: value } }));
  return (
    <>
      <EditorGroup title="Color Palette">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ColorField label="Primary accent" value={settings.palette.accent} onChange={color('accent')} />
          <ColorField label="Accent shade" value={settings.palette.accentDark} onChange={color('accentDark')} />
          <ColorField label="Light background" value={settings.palette.lightBackground} onChange={color('lightBackground')} />
          <ColorField label="Light heading" value={settings.palette.lightHeading} onChange={color('lightHeading')} />
          <ColorField label="Light body" value={settings.palette.lightBody} onChange={color('lightBody')} />
          <ColorField label="Dark background" value={settings.palette.darkBackground} onChange={color('darkBackground')} />
          <ColorField label="Dark heading" value={settings.palette.darkHeading} onChange={color('darkHeading')} />
          <ColorField label="Dark body" value={settings.palette.darkBody} onChange={color('darkBody')} />
        </div>
      </EditorGroup>
      <EditorGroup title="Typography">
        <p className="brand-copy text-xs leading-relaxed break-words">Futura is used for the merQato.digital wordmark. The browser uses the closest licensed local Futura family, with a clean professional fallback where Futura is not installed.</p>
        {(['heading', 'body', 'brand'] as const).map((key) => (
          <label key={key} className="block w-full">
            <span className="admin-label">{key} font</span>
            <select className="admin-select" value={settings.fonts[key]} onChange={(event) => update((current) => ({ ...current, fonts: { ...current.fonts, [key]: event.target.value } }))}>
              {FONT_OPTIONS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
            </select>
          </label>
        ))}
      </EditorGroup>
    </>
  );
}

function PackagesEditor({ settings, update, replacePackage }: { settings: SiteSettings; update: (callback: (current: SiteSettings) => SiteSettings) => void; replacePackage: (index: number, pkg: ServicePackage) => void }) {
  return (
    <>
      <EditorGroup title="Packages Heading">
        <InputField label="Section label" value={settings.packages.eyebrow} onChange={(value) => update((current) => ({ ...current, packages: { ...current.packages, eyebrow: value } }))} />
        <InputField label="Section title" value={settings.packages.title} onChange={(value) => update((current) => ({ ...current, packages: { ...current.packages, title: value } }))} />
        <InputField label="Section intro" multiline value={settings.packages.subtitle} onChange={(value) => update((current) => ({ ...current, packages: { ...current.packages, subtitle: value } }))} />
      </EditorGroup>
      {settings.packages.items.map((pkg, index) => (
        <EditorGroup key={index} title={`Package ${index + 1}`}>
          <InputField label="Package name" value={pkg.name} onChange={(value) => replacePackage(index, { ...pkg, name: value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField label="Pricing label" value={pkg.price} onChange={(value) => replacePackage(index, { ...pkg, price: value })} />
            <InputField label="Pricing note" value={pkg.priceSub} onChange={(value) => replacePackage(index, { ...pkg, priceSub: value })} />
          </div>
          <InputField label="Description" multiline value={pkg.description} onChange={(value) => replacePackage(index, { ...pkg, description: value })} />
          <InputField label="Best-for note" multiline value={pkg.tag} onChange={(value) => replacePackage(index, { ...pkg, tag: value })} />
          <InputField label="Included features" multiline hint="One feature per line" value={pkg.features.join('\n')} onChange={(value) => replacePackage(index, { ...pkg, features: value.split('\n').filter(Boolean) })} />
          <label className="flex items-center gap-2 text-sm brand-copy cursor-pointer">
            <input type="checkbox" checked={pkg.featured} onChange={(event) => replacePackage(index, { ...pkg, featured: event.target.checked })} className="accent-[var(--crimson)]" />
            <span>Feature this package</span>
          </label>
        </EditorGroup>
      ))}
    </>
  );
}

function FaqEditor({ settings, update }: { settings: SiteSettings; update: (callback: (current: SiteSettings) => SiteSettings) => void }) {
  return <><EditorGroup title="FAQ Heading"><InputField label="Section label" value={settings.faq.eyebrow} onChange={(value) => update((current) => ({ ...current, faq: { ...current.faq, eyebrow: value } }))} /><InputField label="Section title" value={settings.faq.title} onChange={(value) => update((current) => ({ ...current, faq: { ...current.faq, title: value } }))} /></EditorGroup>{settings.faq.items.map((item, index) => <EditorGroup key={index} title={`Question ${index + 1}`}><InputField label="Question" value={item.question} onChange={(value) => update((current) => ({ ...current, faq: { ...current.faq, items: current.faq.items.map((currentItem, itemIndex) => itemIndex === index ? { ...currentItem, question: value } : currentItem) } }))} /><InputField label="Answer" multiline value={item.answer} onChange={(value) => update((current) => ({ ...current, faq: { ...current.faq, items: current.faq.items.map((currentItem, itemIndex) => itemIndex === index ? { ...currentItem, answer: value } : currentItem) } }))} /><button type="button" onClick={() => update((current) => ({ ...current, faq: { ...current.faq, items: current.faq.items.filter((_, itemIndex) => itemIndex !== index) } }))} className="text-xs font-semibold text-rose-600 hover:text-rose-700">Remove question</button></EditorGroup>)}<button type="button" onClick={() => update((current) => ({ ...current, faq: { ...current.faq, items: [...current.faq.items, { question: 'New question', answer: 'Add the answer here.' }] } }))} className="btn-secondary px-4 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2"><ChevronDown className="w-4 h-4" />Add question</button></>;
}

function FooterEditor({ settings, update }: { settings: SiteSettings; update: (callback: (current: SiteSettings) => SiteSettings) => void }) {
  const editFooter = (values: Partial<SiteSettings['footer']>) => update((current) => ({ ...current, footer: { ...current.footer, ...values } }));
  return <>
    <EditorGroup title="Studio Profile & Contact">
      <InputField label="Footer CTA label" value={settings.footer.eyebrow} onChange={(value) => editFooter({ eyebrow: value })} />
      <InputField label="Footer headline" multiline value={settings.footer.headline} onChange={(value) => editFooter({ headline: value })} />
      <InputField label="Footer supporting text" multiline value={settings.footer.subtext} onChange={(value) => editFooter({ subtext: value })} />
      <InputField label="CTA button" value={settings.footer.cta} onChange={(value) => editFooter({ cta: value })} />
      <InputField label="Contact email" value={settings.footer.email} onChange={(value) => editFooter({ email: value })} />
      <InputField label="WhatsApp number" value={settings.footer.whatsapp} onChange={(value) => editFooter({ whatsapp: value })} hint="Include country code, for example +63 917 000 0000" />
      <InputField label="Desk hours" value={settings.footer.deskHours} onChange={(value) => editFooter({ deskHours: value })} />
      <InputField label="Response SLA" value={settings.footer.responseSla} onChange={(value) => editFooter({ responseSla: value })} />
      <InputField label="Location statement" multiline value={settings.footer.location} onChange={(value) => editFooter({ location: value })} />
      <InputField label="Headquarters coordinates" value={settings.footer.coordinates} onChange={(value) => editFooter({ coordinates: value })} />
      <InputField label="Trust badges" multiline hint="One badge per line" value={settings.footer.badges.join('\n')} onChange={(value) => editFooter({ badges: value.split('\n').filter(Boolean) })} />
      <InputField label="Copyright text" value={settings.footer.copyright} onChange={(value) => editFooter({ copyright: value })} />
    </EditorGroup>

    <EditorGroup title="Social Media & Global Profiles">
      <p className="brand-copy text-xs leading-relaxed -mt-2 mb-4 break-words">Add, reorder, or update social links with modern Lucide vector icons for Facebook, Instagram, GitHub, YouTube, Website, and more.</p>
      {settings.footer.socialLinks.map((social, index) => (
        <div key={index} className="rounded-xl border border-slate-200 dark:border-white/10 p-3 sm:p-3.5 bg-slate-50/50 dark:bg-white/[0.02] space-y-3 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F17] flex items-center justify-center brand-accent-text flex-shrink-0">
                {renderSocialIcon(social.platform, 'w-3.5 h-3.5')}
              </span>
              <span className="text-xs font-semibold brand-heading truncate">{social.platform}</span>
            </div>
            <button type="button" onClick={() => editFooter({ socialLinks: settings.footer.socialLinks.filter((_, itemIndex) => itemIndex !== index) })} className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer flex-shrink-0">Remove</button>
          </div>
          <div className="flex flex-col sm:grid sm:grid-cols-[130px_1fr] gap-2 items-stretch sm:items-end w-full">
            <label className="block w-full">
              <span className="admin-label">Platform</span>
              <select
                className="admin-select"
                value={social.platform}
                onChange={(event) => editFooter({ socialLinks: settings.footer.socialLinks.map((item, itemIndex) => itemIndex === index ? { ...item, platform: event.target.value as SocialPlatform } : item) })}
              >
                {(['Facebook', 'Instagram', 'GitHub', 'YouTube', 'Website', 'LinkedIn', 'X'] as SocialPlatform[]).map((platform) => <option key={platform} value={platform}>{platform}</option>)}
              </select>
            </label>
            <div className="w-full min-w-0">
              <InputField label="Profile / Target URL" value={social.url} onChange={(value) => editFooter({ socialLinks: settings.footer.socialLinks.map((item, itemIndex) => itemIndex === index ? { ...item, url: value } : item) })} />
            </div>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" onClick={() => editFooter({ socialLinks: [...settings.footer.socialLinks, { platform: 'Facebook', url: 'https://facebook.com/' }] })} className="btn-secondary px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"><FacebookIcon className="w-3.5 h-3.5 brand-accent-text" />+ Facebook</button>
        <button type="button" onClick={() => editFooter({ socialLinks: [...settings.footer.socialLinks, { platform: 'Instagram', url: 'https://instagram.com/' }] })} className="btn-secondary px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"><InstagramIcon className="w-3.5 h-3.5 brand-accent-text" />+ Instagram</button>
        <button type="button" onClick={() => editFooter({ socialLinks: [...settings.footer.socialLinks, { platform: 'GitHub', url: 'https://github.com/' }] })} className="btn-secondary px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"><GithubIcon className="w-3.5 h-3.5 brand-accent-text" />+ GitHub</button>
        <button type="button" onClick={() => editFooter({ socialLinks: [...settings.footer.socialLinks, { platform: 'YouTube', url: 'https://youtube.com/' }] })} className="btn-secondary px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"><YoutubeIcon className="w-3.5 h-3.5 brand-accent-text" />+ YouTube</button>
        <button type="button" onClick={() => editFooter({ socialLinks: [...settings.footer.socialLinks, { platform: 'Website', url: 'https://' }] })} className="btn-secondary px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"><WebsiteIcon className="w-3.5 h-3.5 brand-accent-text" />+ Website URL</button>
      </div>
    </EditorGroup>

    <EditorGroup title="Website Directory (Multiple Domains & Client Portals)">
      <p className="brand-copy text-xs leading-relaxed -mt-2 mb-4 break-words">Add multiple website links or booking platforms for island enterprise client portals.</p>
      {settings.footer.websites.map((website, index) => (
        <div key={index} className="rounded-xl border border-slate-200 dark:border-white/10 p-3 sm:p-3.5 bg-slate-50/50 dark:bg-white/[0.02] space-y-2.5 w-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium brand-accent-text inline-flex items-center gap-1.5"><WebsiteIcon className="w-3.5 h-3.5" />Site {index + 1}</span>
            <button type="button" onClick={() => editFooter({ websites: settings.footer.websites.filter((_, itemIndex) => itemIndex !== index) })} className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer">Remove</button>
          </div>
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2.5 w-full">
            <InputField label="Site Label" value={website.label} onChange={(value) => editFooter({ websites: settings.footer.websites.map((item, itemIndex) => itemIndex === index ? { ...item, label: value } : item) })} />
            <InputField label="Site URL" value={website.url} onChange={(value) => editFooter({ websites: settings.footer.websites.map((item, itemIndex) => itemIndex === index ? { ...item, url: value } : item) })} />
          </div>
        </div>
      ))}
      <button type="button" onClick={() => editFooter({ websites: [...settings.footer.websites, { label: 'Client Portal', url: 'https://portal.merqato.digital' }] })} className="btn-secondary px-4 py-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"><Globe className="w-3.5 h-3.5 brand-accent-text" />Add website</button>
    </EditorGroup>
  </>;
}

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [settings, setSettings, cloudState, publish] = useSiteSettings();
  const [adminOpen, setAdminOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [cloudUserEmail, setCloudUserEmail] = useState<string | undefined>();
  const clicks = useRef(0);
  const clickTimeout = useRef<number | undefined>(undefined);
  const assetUrls = useAssetUrls(settings);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setCloudUserEmail(data.session?.user.email));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setCloudUserEmail(session?.user.email));
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogoClick = () => { clicks.current += 1; window.clearTimeout(clickTimeout.current); clickTimeout.current = window.setTimeout(() => { clicks.current = 0; }, 750); if (clicks.current === 3) { clicks.current = 0; window.clearTimeout(clickTimeout.current); setAuthOpen(true); } };
  const uploadAsset = async (slot: 'logo' | 'hero' | 'about' | 'footer', file: File) => {
    const allowed = file.type.startsWith('image/') || (slot !== 'logo' && file.type.startsWith('video/'));
    if (!allowed) return;
    try {
      const id = isSupabaseConfigured ? await uploadCloudAsset(file) : await saveAsset(file);
      const assetType: MediaType = file.type.startsWith('video/') ? 'video' : 'image';
      setSettings((current) => {
        if (slot === 'logo') return { ...current, branding: { ...current.branding, logoAssetId: id } };
        if (slot === 'hero') return { ...current, hero: { ...current.hero, assetId: id, assetType } };
        if (slot === 'about') return { ...current, about: { ...current.about, assetId: id, assetType } };
        return { ...current, footer: { ...current.footer, assetId: id, assetType } };
      });
    } catch (error) {
      window.alert(error instanceof Error ? `Unable to upload asset: ${error.message}` : 'Unable to upload asset. Sign in to Supabase first.');
    }
  };
  const clearAsset = (slot: 'logo' | 'hero' | 'about' | 'footer') => {
    const oldId = slot === 'logo' ? settings.branding.logoAssetId : slot === 'hero' ? settings.hero.assetId : slot === 'about' ? settings.about.assetId : settings.footer.assetId;
    if (oldId) {
      const remove = oldId.startsWith('remote:') ? removeCloudAsset(oldId) : removeAsset(oldId);
      remove.catch(() => undefined);
    }
    setSettings((current) => {
      if (slot === 'logo') return { ...current, branding: { ...current.branding, logoAssetId: undefined } };
      if (slot === 'hero') return { ...current, hero: { ...current.hero, assetId: undefined, assetType: undefined } };
      if (slot === 'about') return { ...current, about: { ...current.about, assetId: undefined, assetType: undefined } };
      return { ...current, footer: { ...current.footer, assetId: undefined, assetType: undefined } };
    });
  };
  const cloudSignIn = async (email: string, password: string) => {
    if (!supabase) return 'Supabase is not configured.';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message;
  };
  const cloudSignOut = async () => { if (supabase) await supabase.auth.signOut(); };
  const resetSite = () => { if (window.confirm('Reset all text, packages, FAQs, colors, and fonts to the original site? Uploaded files are not removed from the browser library.')) setSettings(copySettings(DEFAULT_SETTINGS)); };
  const logoSrc = settings.branding.logoAssetId ? assetUrls[settings.branding.logoAssetId] : undefined;
  return <div className="relative min-h-screen bg-[var(--bg-primary)] brand-heading overflow-x-hidden transition-colors duration-300" style={{ fontFamily: settings.fonts.body }}><Navigation settings={settings} theme={theme} onToggle={toggleTheme} onLogoClick={handleLogoClick} logoSrc={logoSrc} /><main><Hero settings={settings} heroSrc={settings.hero.assetId ? assetUrls[settings.hero.assetId] : undefined} /><About settings={settings} aboutSrc={settings.about.assetId ? assetUrls[settings.about.assetId] : undefined} /><Pillars settings={settings} /><Packages settings={settings} /><Process settings={settings} /><FAQ settings={settings} /><FooterCTA settings={settings} footerSrc={settings.footer.assetId ? assetUrls[settings.footer.assetId] : undefined} /></main><StudioFooter settings={settings} logoSrc={logoSrc} onAdminRequest={() => setAuthOpen(true)} />{authOpen && <AuthenticationModal onClose={() => setAuthOpen(false)} onUnlock={() => { setAuthOpen(false); setAdminOpen(true); }} />}{adminOpen && <Backoffice settings={settings} setSettings={setSettings} assetUrls={assetUrls} onClose={() => setAdminOpen(false)} onUpload={uploadAsset} onClearAsset={clearAsset} onReset={resetSite} cloudState={cloudState} userEmail={cloudUserEmail} onCloudSignIn={cloudSignIn} onCloudSignOut={cloudSignOut} onPublish={publish} />}</div>;
}