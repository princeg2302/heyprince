import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const avatarsDir = path.resolve(dirname, '../../public/assets/avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

interface AvatarSpec {
  id: string;
  name: string;
  role: string;
  primary: string;
  secondary: string;
  bg: string;
  accent: string;
  initials: string;
}

const avatars: AvatarSpec[] = [
  {
    id: 'alex-vance',
    name: 'Alex Vance',
    role: 'Chief of Staff',
    primary: '#6366f1',
    secondary: '#818cf8',
    bg: '#0f172a',
    accent: '#38bdf8',
    initials: 'AV',
  },
  {
    id: 'elena-rostova',
    name: 'Elena Rostova',
    role: 'Head of Search',
    primary: '#10b981',
    secondary: '#34d399',
    bg: '#064e3b',
    accent: '#a7f3d0',
    initials: 'ER',
  },
  {
    id: 'marcus-sterling',
    name: 'Marcus Sterling',
    role: 'Content Creator',
    primary: '#a855f7',
    secondary: '#c084fc',
    bg: '#3b0764',
    accent: '#f3e8ff',
    initials: 'MS',
  },
  {
    id: 'liam-thorne',
    name: 'Liam Thorne',
    role: 'Lead Scout',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    bg: '#1e3a8a',
    accent: '#93c5fd',
    initials: 'LT',
  },
  {
    id: 'david-chen',
    name: 'David Chen',
    role: 'Site Sentinel',
    primary: '#f59e0b',
    secondary: '#fbbf24',
    bg: '#78350f',
    accent: '#fde68a',
    initials: 'DC',
  },
  {
    id: 'sophia-reynolds',
    name: 'Sophia Reynolds',
    role: 'Client Partner',
    primary: '#ec4899',
    secondary: '#f472b6',
    bg: '#831843',
    accent: '#fbcfe8',
    initials: 'SR',
  },
];

for (const a of avatars) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="bg-${a.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${a.bg}"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>
    <linearGradient id="grad-${a.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${a.primary}"/>
      <stop offset="100%" stop-color="${a.secondary}"/>
    </linearGradient>
    <filter id="glow-${a.id}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  
  <rect width="200" height="200" rx="100" fill="url(#bg-${a.id})"/>
  <circle cx="100" cy="100" r="96" fill="none" stroke="url(#grad-${a.id})" stroke-width="3" stroke-dasharray="6 4" opacity="0.7"/>
  
  <polygon points="100,28 162,64 162,136 100,172 38,136 38,64" fill="none" stroke="${a.accent}" stroke-width="1.5" opacity="0.3" filter="url(#glow-${a.id})"/>
  
  <ellipse cx="100" cy="80" rx="34" ry="40" fill="url(#grad-${a.id})" filter="url(#glow-${a.id})"/>
  
  <rect x="74" y="72" width="52" height="12" rx="6" fill="#ffffff" opacity="0.95"/>
  <circle cx="100" cy="78" r="3.5" fill="${a.primary}"/>

  <path d="M48,175 C48,138 72,126 100,126 C128,126 152,138 152,175 Z" fill="url(#grad-${a.id})" opacity="0.9"/>
  <path d="M70,140 L100,165 L130,140" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.6"/>

  <rect x="55" y="164" width="90" height="22" rx="11" fill="#030712" stroke="url(#grad-${a.id})" stroke-width="1.5"/>
  <text x="100" y="179" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">${a.initials} | AI</text>
</svg>`;

  fs.writeFileSync(path.join(avatarsDir, `${a.id}.svg`), svg, 'utf8');
  fs.writeFileSync(path.join(avatarsDir, `${a.id}.webp`), svg, 'utf8');
  console.info(`✅ Generated humanoid avatar for ${a.name} (${a.id})`);
}
