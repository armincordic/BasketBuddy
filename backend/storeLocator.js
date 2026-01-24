const USER_AGENT = "BasketBuddy/0.1 (contact: armincordic@outlook.com)"
const RADIUS_METERS = 32000

export async function getNearbySupermarkets(zip) {
  const { lat, lng } = await geocodeZip(zip)
  const rawStores = await fetchSupermarkets(lat, lng)
  return normalizeStores(rawStores, lat, lng)
}

async function geocodeZip(zip) {
  const url = `https://nominatim.openstreetmap.org/search?q=${zip}&countrycodes=us&format=json&limit=1`

  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "application/json"
    }
  })

  if (!res.ok) throw new Error("Failed to geocode ZIP")

  const data = await res.json()
  if (!data.length) throw new Error("ZIP not found")

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon)
  }
}

async function fetchSupermarkets(lat, lng) {
  const query = `
[out:json];
(
  node["shop"~"supermarket|grocery|department_store"](around:${RADIUS_METERS},${lat},${lng});
  way["shop"~"supermarket|grocery|department_store"](around:${RADIUS_METERS},${lat},${lng});
  relation["shop"~"supermarket|grocery|department_store"](around:${RADIUS_METERS},${lat},${lng});
);
out center tags;
`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "User-Agent": USER_AGENT
      },
      body: query,
      signal: controller.signal
    })

    if (!res.ok) throw new Error("Failed to fetch supermarkets")

    const data = await res.json()
    return data.elements
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeStores(elements, originLat, originLng) {
  const seen = new Set()
  const stores = []

  for (const el of elements) {
    const rawName = el.tags?.brand ?? el.tags?.name
    if (!rawName) continue

    const chain = normalizeChain(rawName) ?? "Other"

    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    if (!lat || !lng) continue

    const key = `${chain}-${Math.round(lat * 1000)}-${Math.round(lng * 1000)}`
    if (seen.has(key)) continue
    seen.add(key)

    stores.push({
      chain,
      name: rawName,
      lat,
      lng,
      distanceMiles: haversineMiles(originLat, originLng, lat, lng)
    })
  }

  return stores.sort((a, b) => a.distanceMiles - b.distanceMiles)
}

function normalizeChain(name) {
  const n = name.toLowerCase()

  if (n.includes("kroger")) return "Kroger"
  if (n.includes("walmart")) return "Walmart"
  if (n.includes("target")) return "Target"
  if (n.includes("aldi")) return "Aldi"
  if (n.includes("whole foods")) return "Whole Foods"
  if (n.includes("safeway")) return "Safeway"
  if (n.includes("schnucks")) return "Schnucks"
  if (n.includes("hy-vee")) return "Hy-Vee"

  return null
}

function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRad = v => (v * Math.PI) / 180
  const R = 3958.8

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2

  return 2 * R * Math.asin(Math.sqrt(a))
}
