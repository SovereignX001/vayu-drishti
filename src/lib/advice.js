export function getAqiCategory(aqi) {
  if (aqi == null || isNaN(aqi)) return { label: 'Unavailable', severity: 'unknown', color: '#64748B' }
  const val = Number(aqi)
  if (val <= 50) return { label: 'Good', severity: 'good', color: '#00B37E' }
  if (val <= 100) return { label: 'Satisfactory', severity: 'good', color: '#10B981' }
  if (val <= 200) return { label: 'Moderate', severity: 'moderate', color: '#F59E0B' }
  if (val <= 300) return { label: 'Poor', severity: 'poor', color: '#EA580C' }
  if (val <= 400) return { label: 'Very Poor', severity: 'severe', color: '#DC2626' }
  return { label: 'Severe', severity: 'severe', color: '#991B1B' }
}

export function getAdvice(aqi, weather = {}, locationName = 'Current Area') {
  const cat = getAqiCategory(aqi)
  const loc = locationName || 'Local Airshed'
  const tempStr = weather?.temp != null ? `${weather.temp}°C` : ''
  const windStr = weather?.windSpeed != null ? `${weather.windSpeed} km/h` : ''

  if (aqi == null || isNaN(aqi)) {
    return {
      category: cat,
      picnic: {
        title: 'DATA UNAVAILABLE',
        description: `Live air quality data for ${loc} is currently connecting.`,
        tag: 'Connecting...',
        isGood: false,
      },
      commute: {
        title: 'PROCEED WITH NORMAL CAUTION',
        description: `Check live telemetry before extended road travel around ${loc}.`,
        tag: 'Caution',
        isGood: false,
      },
      windows: {
        title: 'CHECK LOCAL AIR BEFORE OPENING',
        description: 'Verify current particulate levels before prolonged natural ventilation.',
        tag: 'Check Air',
        isGood: false,
      },
      forecastTip: `Atmospheric telemetry updating for ${loc}.`,
    }
  }

  const val = Number(aqi)

  if (val <= 50) {
    return {
      category: cat,
      picnic: {
        title: 'PERFECT DAY FOR A PICNIC',
        description: `Clean air at AQI ${val} in ${loc}${tempStr ? ` (${tempStr})` : ''}. Ideal for morning jogs, children playing, and outdoor dining.`,
        tag: 'Great for Outdoor Activities',
        isGood: true,
      },
      commute: {
        title: 'UNMASKED COMMUTE SAFE',
        description: `Low pollutant exposure throughout ${loc}. Walking and cycling are safe without a mask.`,
        tag: 'Safe for All Commuters',
        isGood: true,
      },
      windows: {
        title: 'OPEN THEM UP',
        description: `Excellent natural ventilation${windStr ? ` with a ${windStr} breeze` : ''}. Fresh air will help clear indoor stale air.`,
        tag: 'Ideal for Ventilation',
        isGood: true,
      },
      forecastTip: `Air quality remains clean and breathable across ${loc}. Enjoy outdoor plans.`,
    }
  }

  if (val <= 100) {
    return {
      category: cat,
      picnic: {
        title: 'SAFE FOR OUTDOOR OUTINGS',
        description: `Air is satisfactory at AQI ${val} in ${loc}. Most citizens can freely enjoy parks, walks, and sports.`,
        tag: 'Suitable for Outings',
        isGood: true,
      },
      commute: {
        title: 'NORMAL TRAVEL ACCEPTABLE',
        description: `Fine particulate exposure is within standard limits around ${loc}. Sensitive asthmatics should take easy paces.`,
        tag: 'Standard Commute',
        isGood: true,
      },
      windows: {
        title: 'VENTILATE FREELY',
        description: `Good window for natural air exchange in ${loc}. Outdoor air will not compromise indoor wellness.`,
        tag: 'Safe to Open Windows',
        isGood: true,
      },
      forecastTip: `Satisfactory atmospheric dispersion across ${loc}. Routine outdoor travel approved.`,
    }
  }

  if (val <= 200) {
    return {
      category: cat,
      picnic: {
        title: 'MODERATE OUTING CONDITIONS',
        description: `AQI ${val} in ${loc}. Sensitive individuals (asthma, young kids, elderly) should limit prolonged heavy cardio.`,
        tag: 'Reduce Heavy Exertion',
        isGood: false,
        isModerate: true,
      },
      commute: {
        title: 'WEAR AN N95 MASK IN HEAVY TRAFFIC',
        description: `Elevated particulate levels along transit corridors in ${loc}. Mask recommended on two-wheelers and in auto-rickshaws.`,
        tag: 'Mask Recommended',
        isGood: false,
        isModerate: true,
      },
      windows: {
        title: 'LIMIT WINDOW VENTILATION',
        description: `Keep windows closed during peak traffic hours. Afternoon ventilation is preferable${windStr ? ` if wind stays near ${windStr}` : ''}.`,
        tag: 'Brief Ventilation Only',
        isGood: false,
        isModerate: true,
      },
      forecastTip: `Particulate matter is elevated at AQI ${val} in ${loc}. Sensitive individuals should schedule outdoor tasks for midday.`,
    }
  }

  if (val <= 300) {
    return {
      category: cat,
      picnic: {
        title: 'NOT A GOOD DAY FOR A PICNIC',
        description: `Poor air quality at AQI ${val} in ${loc}. Avoid outdoor parks and sports; shift family gatherings indoors.`,
        tag: 'Avoid Public Parks',
        isGood: false,
        isSevere: true,
      },
      commute: {
        title: 'TRAVEL WITH AN N95 MASK',
        description: `High PM2.5 in ${loc}. Wear a certified N95 respirator on road commutes and keep car air on cabin recirculation.`,
        tag: 'N95 Mask Mandatory',
        isGood: false,
        isSevere: true,
      },
      windows: {
        title: 'KEEP WINDOWS SEALED',
        description: `Outdoor pollutants will degrade indoor air in ${loc}. Run HEPA air purifiers on medium to high mode.`,
        tag: 'Run HEPA Purifiers',
        isGood: false,
        isSevere: true,
      },
      forecastTip: `Poor air quality across ${loc} (AQI ${val}). Restrict outdoor exposure and protect vulnerable family members.`,
    }
  }

  return {
    category: cat,
    picnic: {
      title: 'HAZARDOUS — STAY INDOORS',
      description: `Severe pollution spike (AQI ${val}) in ${loc}. Extreme respiratory hazard. Cancel all outdoor athletic and park activities.`,
      tag: 'Hazardous Air Alert',
      isGood: false,
      isSevere: true,
    },
    commute: {
      title: 'DELAY NON-ESSENTIAL TRAVEL',
      description: `Dense particulate smoke in ${loc}. If travel is unavoidable, wear an airtight N95/FFP2 mask and keep vehicle windows sealed.`,
      tag: 'Delay Travel If Possible',
      isGood: false,
      isSevere: true,
    },
    windows: {
      title: 'KEEP HOMES TIGHTLY SEALED',
      description: `Toxic surface boundary layer across ${loc}. Seal door and window gaps; operate HEPA purifiers continuously on boost mode.`,
      tag: 'Full Seal & Purify',
      isGood: false,
      isSevere: true,
    },
    forecastTip: `Severe emergency air conditions in ${loc} (AQI ${val}). Everyone should minimize outdoor breathing exposure.`,
  }
}
