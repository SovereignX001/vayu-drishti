const API = import.meta.env.VITE_API_URL || '/api'

export async function askDrishti(question, lat, lon) {
  const res = await fetch(`${API}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, lat, lon }),
  })
  if (!res.ok) throw new Error('Backend error')
  return (await res.json()).answer
}

export async function getForecast(lat, lon) {
  const res = await fetch(`${API}/forecast?lat=${lat}&lon=${lon}`)
  if (!res.ok) throw new Error('Backend error')
  return res.json()
}

export async function getMetrics() {
  const res = await fetch(`${API}/metrics`)
  if (!res.ok) throw new Error('Backend error')
  return res.json()
}

export async function getNationalAnalytics() {
  const res = await fetch(`${API}/analytics/national`)
  if (!res.ok) throw new Error('Backend error')
  return res.json()
}

export async function classifyAqi(aqi_value) {
  const res = await fetch(`${API}/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ aqi_value }),
  })
  if (!res.ok) throw new Error('Backend error')
  return res.json()
}