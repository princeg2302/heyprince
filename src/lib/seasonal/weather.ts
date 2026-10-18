export interface WeatherData {
  temperature: number;
  humidity: number;
  weatherCode: number;
  isDay: boolean;
  conditionText: string;
  conditionIcon: string;
}

export interface SeasonalTheme {
  id: 'autumn' | 'winter' | 'spring' | 'summer' | 'monsoon';
  label: string;
  emoji: string;
  accentColor: string;
  glowColor: string;
  greeting: string;
}

export interface SeasonalResponse {
  enabled: boolean;
  mode: 'auto' | 'manual' | 'disabled';
  city: string;
  season: SeasonalTheme;
  weather?: WeatherData | null;
  displayPillText: string;
  tooltipText: string;
  source: 'live' | 'cache' | 'fallback';
}

const SEASONAL_THEMES: Record<string, SeasonalTheme> = {
  autumn: {
    id: 'autumn',
    label: 'Autumn Harvest',
    emoji: '🍂',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    greeting: 'Crisp Autumn Vibes',
  },
  winter: {
    id: 'winter',
    label: 'Winter Frost',
    emoji: '❄️',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.25)',
    greeting: 'Winter Clarity',
  },
  spring: {
    id: 'spring',
    label: 'Spring Bloom',
    emoji: '🌸',
    accentColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.25)',
    greeting: 'Spring Awakening',
  },
  summer: {
    id: 'summer',
    label: 'Summer Glow',
    emoji: '☀️',
    accentColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.25)',
    greeting: 'Summer Energy',
  },
  monsoon: {
    id: 'monsoon',
    label: 'Monsoon Mist',
    emoji: '🌧️',
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.25)',
    greeting: 'Monsoon Rhythms',
  },
};

// In-memory server cache with 30-min TTL
let cachedWeather: {
  lat: number;
  lon: number;
  data: WeatherData;
  expiresAt: number;
} | null = null;

function mapWmoCode(code: number): { text: string; icon: string } {
  if (code === 0) return { text: 'Clear Sky', icon: '☀️' };
  if (code >= 1 && code <= 3) return { text: 'Partly Cloudy', icon: '⛅' };
  if (code === 45 || code === 48) return { text: 'Misty / Fog', icon: '🌫️' };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { text: 'Rain Showers', icon: '🌧️' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { text: 'Light Snow / Frost', icon: '❄️' };
  if (code >= 95) return { text: 'Thunderstorm', icon: '⛈️' };
  return { text: 'Fair Weather', icon: '🌤️' };
}

export function detectCalendarSeason(monthIndex: number): SeasonalTheme {
  // Month is 0-indexed (0 = Jan, 9 = Oct)
  if (monthIndex === 9 || monthIndex === 10) return SEASONAL_THEMES.autumn; // Oct-Nov
  if (monthIndex === 11 || monthIndex === 0 || monthIndex === 1) return SEASONAL_THEMES.winter; // Dec-Feb
  if (monthIndex === 2 || monthIndex === 3) return SEASONAL_THEMES.spring; // Mar-Apr
  if (monthIndex === 4 || monthIndex === 5) return SEASONAL_THEMES.summer; // May-Jun
  return SEASONAL_THEMES.monsoon; // Jul-Sep
}

export async function fetchLiveWeather(lat: number, lon: number): Promise<WeatherData | null> {
  const now = Date.now();
  if (cachedWeather && cachedWeather.lat === lat && cachedWeather.lon === lon && cachedWeather.expiresAt > now) {
    return cachedWeather.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,is_day`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'HeyPrince-Website-Weather/1.0 (+https://heyprince.in)',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const curr = json.current;
    if (!curr) return null;

    const condition = mapWmoCode(curr.weather_code);
    const weatherData: WeatherData = {
      temperature: Math.round(curr.temperature_2m),
      humidity: Math.round(curr.relative_humidity_2m),
      weatherCode: curr.weather_code,
      isDay: Boolean(curr.is_day),
      conditionText: condition.text,
      conditionIcon: condition.icon,
    };

    // Cache for 30 minutes
    cachedWeather = {
      lat,
      lon,
      data: weatherData,
      expiresAt: now + 30 * 60 * 1000,
    };

    return weatherData;
  } catch (err) {
    console.warn('[Open-Meteo] Live weather fetch failed, using fallback:', err);
    return null;
  }
}

export async function getSeasonalPresentation(config: {
  enabled?: boolean;
  mode?: 'auto' | 'manual' | 'disabled';
  manualTheme?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}): Promise<SeasonalResponse> {
  const isEnabled = config.enabled ?? true;
  const mode = config.mode || 'auto';

  if (!isEnabled || mode === 'disabled') {
    return {
      enabled: false,
      mode: 'disabled',
      city: config.city || 'Delhi, India',
      season: SEASONAL_THEMES.autumn,
      displayPillText: '',
      tooltipText: '',
      source: 'fallback',
    };
  }

  const city = config.city || 'Delhi, India';
  const lat = config.latitude || 28.6139;
  const lon = config.longitude || 77.2090;

  // Manual mode: directly return admin chosen season
  if (mode === 'manual' && config.manualTheme && SEASONAL_THEMES[config.manualTheme]) {
    const manualSeason = SEASONAL_THEMES[config.manualTheme];
    return {
      enabled: true,
      mode: 'manual',
      city,
      season: manualSeason,
      weather: null,
      displayPillText: `${manualSeason.emoji} ${manualSeason.label}`,
      tooltipText: `${manualSeason.greeting} • Mode: Manual theme`,
      source: 'fallback',
    };
  }

  // Auto mode: fetch live weather from Open-Meteo
  const liveWeather = await fetchLiveWeather(lat, lon);
  const month = new Date().getMonth();
  const calendarSeason = detectCalendarSeason(month);

  if (liveWeather) {
    return {
      enabled: true,
      mode: 'auto',
      city,
      season: calendarSeason,
      weather: liveWeather,
      displayPillText: `${liveWeather.conditionIcon} ${liveWeather.temperature}°C ${city.split(',')[0]} • ${calendarSeason.emoji} ${calendarSeason.label}`,
      tooltipText: `${liveWeather.conditionText}, ${liveWeather.temperature}°C • ${calendarSeason.greeting} in ${city}`,
      source: 'live',
    };
  }

  // Graceful fallback when weather API is offline or stale
  return {
    enabled: true,
    mode: 'auto',
    city,
    season: calendarSeason,
    weather: null,
    displayPillText: `${calendarSeason.emoji} ${calendarSeason.label}`,
    tooltipText: `${calendarSeason.greeting} • ${city}`,
    source: 'fallback',
  };
}

