const API = import.meta.env.VITE_API_URL || '/api'

const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000 // 6 hours

function saveCache(key, data) {
  try {
    const payload = {
      timestamp: Date.now(),
      data,
    }
    localStorage.setItem(`vayu_cache_${key}`, JSON.stringify(payload))
  } catch {
    // Ignore localStorage write failures (e.g. quota, private browsing)
  }
}

function getCache(key) {
  try {
    const raw = localStorage.getItem(`vayu_cache_${key}`)
    if (!raw) return null
    const payload = JSON.parse(raw)
    if (!payload || !payload.timestamp || !payload.data) return null
    if (Date.now() - payload.timestamp > CACHE_MAX_AGE_MS) {
      localStorage.removeItem(`vayu_cache_${key}`)
      return null
    }
    return payload
  } catch {
    return null
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000, timeoutMessage = 'Request timed out') {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    })

    if (!res.ok) {
      let detail = ''
      try {
        const body = await res.json()
        detail = body.detail || body.message || ''
      } catch {
        // Body was not JSON
      }
      throw new Error(detail || `Server returned error (${res.status})`)
    }

    return res
  } catch (err) {
    if (err.name === 'AbortError' || controller.signal.aborted) {
      throw new Error(timeoutMessage)
    }
    if (err.message && (err.message.includes('Server returned') || (err.message.length > 0 && err.name !== 'TypeError'))) {
      throw err
    }
    throw new Error("Can't reach the server. Please verify the backend is running.")
  } finally {
    clearTimeout(timer)
  }
}

export async function askDrishti(question, lat, lon) {
  const res = await fetchWithTimeout(
    `${API}/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, lat, lon }),
    },
    15000,
    'The AI took too long to respond. Please try again.'
  )
  return (await res.json()).answer
}

export async function getForecast(lat, lon) {
  const cacheKey = `forecast_${Number(lat).toFixed(2)}_${Number(lon).toFixed(2)}`
  try {
    const res = await fetchWithTimeout(
      `${API}/forecast?lat=${lat}&lon=${lon}`,
      {},
      10000,
      'Forecast service timed out. Please try again.'
    )
    const data = await res.json()
    saveCache(cacheKey, data)
    return data
  } catch (err) {
    const cached = getCache(cacheKey)
    if (cached) {
      return {
        ...cached.data,
        stale: true,
        savedAt: cached.timestamp,
      }
    }
    throw err
  }
}

export async function getMetrics() {
  const cacheKey = 'metrics'
  try {
    const res = await fetchWithTimeout(
      `${API}/metrics`,
      {},
      10000,
      'Metrics service timed out. Please try again.'
    )
    const data = await res.json()
    saveCache(cacheKey, data)
    return data
  } catch (err) {
    const cached = getCache(cacheKey)
    if (cached) {
      return {
        ...cached.data,
        stale: true,
        savedAt: cached.timestamp,
      }
    }
    throw err
  }
}

export async function getNationalAnalytics() {
  const cacheKey = 'national_analytics'
  try {
    const res = await fetchWithTimeout(
      `${API}/analytics/national`,
      {},
      10000,
      'National analytics service timed out. Please try again.'
    )
    const data = await res.json()
    saveCache(cacheKey, data)
    return data
  } catch (err) {
    const cached = getCache(cacheKey)
    if (cached) {
      return {
        ...cached.data,
        stale: true,
        savedAt: cached.timestamp,
      }
    }
    throw err
  }
}

export async function classifyAqi(aqi_value) {
  const res = await fetchWithTimeout(
    `${API}/classify`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aqi_value }),
    },
    10000,
    'Classification service timed out. Please try again.'
  )
  return res.json()
}

export async function getLiveAqiByCoords(lat, lon) {
  const latitude = Number(lat)
  const longitude = Number(lon)
  if (isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Invalid coordinates for live telemetry')
  }

  const cacheKey = `live_aqi_${latitude.toFixed(2)}_${longitude.toFixed(2)}`

  try {
    const [aqiRes, weatherRes] = await Promise.all([
      fetchWithTimeout(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide`,
        {},
        10000,
        'Live air quality service timed out.'
      ),
      fetchWithTimeout(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weather_code`,
        {},
        10000,
        'Live weather service timed out.'
      ),
    ])

    const aqiData = await aqiRes.json()
    const weatherData = await weatherRes.json()

    const currentAqi = aqiData.current || {}
    const currentWeather = weatherData.current || {}

    const windDirDeg = currentWeather.wind_direction_10m
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const windDirLabel = windDirDeg != null ? dirs[Math.round(windDirDeg / 45) % 8] : 'NW'

    const result = {
      aqi: currentAqi.us_aqi != null ? Math.round(currentAqi.us_aqi) : null,
      pm25: currentAqi.pm2_5 != null ? Math.round(currentAqi.pm2_5) : null,
      pm10: currentAqi.pm10 != null ? Math.round(currentAqi.pm10) : null,
      no2: currentAqi.nitrogen_dioxide != null ? Math.round(currentAqi.nitrogen_dioxide) : null,
      o3: currentAqi.ozone != null ? Math.round(currentAqi.ozone) : null,
      so2: currentAqi.sulphur_dioxide != null ? Math.round(currentAqi.sulphur_dioxide) : null,
      temp: currentWeather.temperature_2m != null ? Math.round(currentWeather.temperature_2m) : null,
      humidity: currentWeather.relative_humidity_2m != null ? Math.round(currentWeather.relative_humidity_2m) : null,
      windSpeed: currentWeather.wind_speed_10m != null ? Math.round(currentWeather.wind_speed_10m * 10) / 10 : null,
      windDir: `${windDirLabel} ${windDirDeg != null ? `${Math.round(windDirDeg)}°` : ''}`.trim(),
      precip: currentWeather.precipitation != null ? currentWeather.precipitation : 0,
      weatherCode: currentWeather.weather_code,
    }

    saveCache(cacheKey, result)
    return result
  } catch (err) {
    const cached = getCache(cacheKey)
    if (cached) {
      return {
        ...cached.data,
        stale: true,
        savedAt: cached.timestamp,
      }
    }
    throw err
  }
}
