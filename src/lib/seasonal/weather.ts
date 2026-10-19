export interface WeatherData {
  temperature: number;
  humidity: number;
  weatherCode: number;
  isDay: boolean;
  conditionText: string;
  conditionIcon: string;
  accentColor?: string;
  glowColor?: string;
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

// In-memory server cache with 20-min TTL for each coordinate pair
const weatherCache = new Map<string, { data: WeatherData; expiresAt: number }>();

function mapWmoCode(
  code: number,
  isDay: boolean = true,
  temp?: number
): { text: string; icon: string; accentColor: string; glowColor: string } {
  // Freezing / extreme cold
  if (typeof temp === 'number' && temp <= 4) {
    return {
      text: code >= 71 && code <= 86 ? 'Snowfall' : 'Freezing Cold',
      icon: '❄️',
      accentColor: '#38bdf8',
      glowColor: 'rgba(56, 189, 248, 0.25)',
    };
  }

  // 0: Clear sky / Sun
  if (code === 0) {
    if (typeof temp === 'number' && temp >= 38) {
      return {
        text: 'Hot & Sunny',
        icon: '☀️',
        accentColor: '#f59e0b',
        glowColor: 'rgba(245, 158, 11, 0.25)',
      };
    }
    return isDay
      ? { text: 'Clear Sky', icon: '☀️', accentColor: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.25)' }
      : { text: 'Clear Night', icon: '🌙', accentColor: '#818cf8', glowColor: 'rgba(129, 140, 248, 0.25)' };
  }

  // 1-2: Partly cloudy
  if (code === 1 || code === 2) {
    return isDay
      ? { text: 'Partly Cloudy', icon: '⛅', accentColor: '#38bdf8', glowColor: 'rgba(56, 189, 248, 0.2)' }
      : { text: 'Partly Cloudy', icon: '☁️', accentColor: '#94a3b8', glowColor: 'rgba(148, 163, 184, 0.2)' };
  }

  // 3: Overcast / Cloudy
  if (code === 3) {
    return {
      text: 'Cloudy',
      icon: '☁️',
      accentColor: '#94a3b8',
      glowColor: 'rgba(148, 163, 184, 0.2)',
    };
  }

  // 45, 48: Fog / Mist
  if (code === 45 || code === 48) {
    return {
      text: 'Fog / Mist',
      icon: '🌫️',
      accentColor: '#cbd5e1',
      glowColor: 'rgba(203, 213, 225, 0.25)',
    };
  }

  // 51, 53, 55: Drizzle
  if (code >= 51 && code <= 55) {
    return {
      text: 'Light Drizzle',
      icon: '🌦️',
      accentColor: '#06b6d4',
      glowColor: 'rgba(6, 182, 212, 0.25)',
    };
  }

  // 56, 57, 66, 67: Freezing rain
  if (code === 56 || code === 57 || code === 66 || code === 67) {
    return {
      text: 'Freezing Rain',
      icon: '🌨️',
      accentColor: '#38bdf8',
      glowColor: 'rgba(56, 189, 248, 0.25)',
    };
  }

  // 61, 63, 65: Rain
  if (code >= 61 && code <= 65) {
    return {
      text: 'Raining',
      icon: '🌧️',
      accentColor: '#0ea5e9',
      glowColor: 'rgba(14, 165, 233, 0.25)',
    };
  }

  // 71, 73, 75, 77: Snow
  if (code >= 71 && code <= 77) {
    return {
      text: 'Snowing',
      icon: '❄️',
      accentColor: '#38bdf8',
      glowColor: 'rgba(56, 189, 248, 0.25)',
    };
  }

  // 80, 81, 82: Rain Showers
  if (code >= 80 && code <= 82) {
    return {
      text: 'Rain Showers',
      icon: '🌧️',
      accentColor: '#06b6d4',
      glowColor: 'rgba(6, 182, 212, 0.25)',
    };
  }

  // 85, 86: Snow showers
  if (code === 85 || code === 86) {
    return {
      text: 'Snow Showers',
      icon: '🌨️',
      accentColor: '#38bdf8',
      glowColor: 'rgba(56, 189, 248, 0.25)',
    };
  }

  // 95, 96, 99: Thunderstorm
  if (code >= 95) {
    return {
      text: 'Thunderstorm',
      icon: '⛈️',
      accentColor: '#a855f7',
      glowColor: 'rgba(168, 85, 247, 0.25)',
    };
  }

  // Cold / chill check
  if (typeof temp === 'number' && temp <= 10) {
    return {
      text: 'Cold',
      icon: '❄️',
      accentColor: '#38bdf8',
      glowColor: 'rgba(56, 189, 248, 0.25)',
    };
  }

  return {
    text: 'Fair Weather',
    icon: isDay ? '🌤️' : '🌙',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.2)',
  };
}

export function detectCalendarSeason(monthIndex: number, latitude: number = 28.6): SeasonalTheme {
  // If in southern hemisphere (latitude < 0), invert seasons by 6 months
  const effectiveMonth = latitude < 0 ? (monthIndex + 6) % 12 : monthIndex;

  // Month is 0-indexed (0 = Jan, 9 = Oct)
  if (effectiveMonth === 9 || effectiveMonth === 10) return SEASONAL_THEMES.autumn; // Oct-Nov
  if (effectiveMonth === 11 || effectiveMonth === 0 || effectiveMonth === 1) return SEASONAL_THEMES.winter; // Dec-Feb
  if (effectiveMonth === 2 || effectiveMonth === 3) return SEASONAL_THEMES.spring; // Mar-Apr
  if (effectiveMonth === 4 || effectiveMonth === 5) return SEASONAL_THEMES.summer; // May-Jun
  return SEASONAL_THEMES.monsoon; // Jul-Sep
}

export async function fetchLiveWeather(lat: number, lon: number): Promise<WeatherData | null> {
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const now = Date.now();
  const cached = weatherCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  // Prune cache if it grows large
  if (weatherCache.size > 200) {
    for (const [key, value] of weatherCache.entries()) {
      if (value.expiresAt <= now) weatherCache.delete(key);
    }
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

    const tempRounded = Math.round(curr.temperature_2m);
    const isDay = Boolean(curr.is_day);
    const condition = mapWmoCode(curr.weather_code, isDay, tempRounded);

    const weatherData: WeatherData = {
      temperature: tempRounded,
      humidity: Math.round(curr.relative_humidity_2m),
      weatherCode: curr.weather_code,
      isDay,
      conditionText: condition.text,
      conditionIcon: condition.icon,
      accentColor: condition.accentColor,
      glowColor: condition.glowColor,
    };

    // Cache for 20 minutes
    weatherCache.set(cacheKey, {
      data: weatherData,
      expiresAt: now + 20 * 60 * 1000,
    });

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

  const rawCity = config.city || 'Yamunanagar, India';
  const cityName = rawCity.split(',')[0].trim() || 'Current Location';
  const lat = config.latitude ?? 30.1;
  const lon = config.longitude ?? 77.28;
  const month = new Date().getMonth();
  const calendarSeason = detectCalendarSeason(month, lat);

  if (!isEnabled || mode === 'disabled') {
    return {
      enabled: false,
      mode: 'disabled',
      city: rawCity,
      season: calendarSeason,
      displayPillText: '',
      tooltipText: '',
      source: 'fallback',
    };
  }

  // Manual mode: directly return admin chosen season if explicit
  if (mode === 'manual' && config.manualTheme && SEASONAL_THEMES[config.manualTheme]) {
    const manualSeason = SEASONAL_THEMES[config.manualTheme];
    return {
      enabled: true,
      mode: 'manual',
      city: rawCity,
      season: manualSeason,
      weather: null,
      displayPillText: cityName,
      tooltipText: `${manualSeason.greeting} in ${rawCity}`,
      source: 'fallback',
    };
  }

  // Auto mode: fetch live dynamic weather from Open-Meteo
  const liveWeather = await fetchLiveWeather(lat, lon);

  if (liveWeather) {
    return {
      enabled: true,
      mode: 'auto',
      city: rawCity,
      season: calendarSeason,
      weather: liveWeather,
      // Pill text displays ONLY temperature and location (ZERO season name)
      displayPillText: `${liveWeather.temperature}°C ${cityName}`,
      tooltipText: `${liveWeather.conditionText}, ${liveWeather.temperature}°C in ${rawCity} • Click to detect GPS location`,
      source: 'live',
    };
  }

  // Graceful fallback when weather API is offline or stale
  return {
    enabled: true,
    mode: 'auto',
    city: rawCity,
    season: calendarSeason,
    weather: null,
    displayPillText: cityName,
    tooltipText: `Weather in ${rawCity} • Click to detect GPS location`,
    source: 'fallback',
  };
}

