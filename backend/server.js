import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"

import {
  getAccessToken,
  getStore,
  searchProducts,
  getProductById,
  normalizeKrogerProduct
} from "./kroger.js"

import { supabase } from "./supabaseAdmin.js"
import { getNearbySupermarkets } from "./storeLocator.js"

dotenv.config()

const app = express()
const PORT = 3001

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/* ---------- GLOBAL MIDDLEWARE ---------- */
app.use(cors())
app.use(express.json())

// DEBUG: prove requests reach Express
app.use((req, res, next) => {
  console.log("EXPRESS HIT:", req.method, req.url)
  next()
})

/* ---------- AUTH HELPER ---------- */
async function getUserFromReq(req) {
  const authHeader = req.headers.authorization
  const token = authHeader?.replace("Bearer ", "")
  return supabase.auth.getUser(token)
}

/* ---------- SEARCH ---------- */
app.get("/api/search", async (req, res) => {
  try {
    const token = await getAccessToken()
    const locationId = await getStore(token)
    const products = await searchProducts(token, locationId, req.query.term)
    res.json(products.map(normalizeKrogerProduct))
  } catch (err) {
    console.error(err)
    res.status(500).json([])
  }
})

/* ---------- PRODUCTS ---------- */
app.get("/api/products", async (req, res) => {
  try {
    const ids = req.query.ids?.split(",") ?? []
    if (ids.length === 0) return res.json([])

    const token = await getAccessToken()
    const locationId = await getStore(token)

    const products = await Promise.all(
      ids.map(async id => {
        try {
          const raw = await getProductById(token, id, locationId)
          return normalizeKrogerProduct(raw)
        } catch {
          return null
        }
      })
    )

    res.json(products.filter(Boolean))
  } catch (err) {
    console.error(err)
    res.json([])
  }
})

/* ---------- SAVED ITEMS ---------- */
app.get("/api/saved-items", async (req, res) => {
  const { data: { user } } = await getUserFromReq(req)
  if (!user) return res.status(401).json([])

  const { data } = await supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", user.id)

  res.json(data ?? [])
})

app.post("/api/saved-items", async (req, res) => {
  const { data: { user } } = await getUserFromReq(req)
  if (!user) return res.sendStatus(401)

  const { externalID, source, name, image_url, price } = req.body

  const { data: existing } = await supabase
    .from("saved_items")
    .select("quantity")
    .eq("user_id", user.id)
    .eq("external_id", externalID)
    .eq("source", source)
    .single()

  if (existing) {
    await supabase
      .from("saved_items")
      .update({ quantity: existing.quantity + 1 })
      .eq("user_id", user.id)
      .eq("external_id", externalID)
      .eq("source", source)
  } else {
    await supabase.from("saved_items").insert({
      user_id: user.id,
      external_id: externalID,
      source,
      name,
      image_url,
      price_snapshot: price,
      quantity: 1
    })
  }

  res.sendStatus(200)
})

app.delete("/api/saved-items/:id", async (req, res) => {
  const { data: { user } } = await getUserFromReq(req)
  if (!user) return res.sendStatus(401)

  const { data: row } = await supabase
    .from("saved_items")
    .select("quantity")
    .eq("user_id", user.id)
    .eq("external_id", req.params.id)
    .single()

  if (!row) return res.sendStatus(200)

  if (row.quantity > 1) {
    await supabase
      .from("saved_items")
      .update({ quantity: row.quantity - 1 })
      .eq("user_id", user.id)
      .eq("external_id", req.params.id)
  } else {
    await supabase
      .from("saved_items")
      .delete()
      .eq("user_id", user.id)
      .eq("external_id", req.params.id)
  }

  res.sendStatus(200)
})

/* ---------- STORES ---------- */
app.get("/api/stores", async (req, res) => {
  const zip = req.query.zip
  if (!zip) return res.status(400).json({ error: "zip is required" })

  try {
    const stores = await getNearbySupermarkets(zip)
    res.json(stores)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "failed to fetch stores" })
  }
})

/* ---------- REVERSE GEOCODE ---------- */
app.post("/api/reverse-geocode", async (req, res) => {
  console.log("REVERSE BODY:", req.body)

  const { lat, lng } = req.body
  if (lat == null || lng == null) {
    return res.status(400).json({ error: "lat/lng required" })
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`

    const r = await fetch(url, {
      headers: {
        "User-Agent": "BasketBuddy/0.1 (contact: armincordic@outlook.com)",
        "Accept": "application/json"
      }
    })

    if (!r.ok) {
      console.error("Nominatim error:", r.status)
      return res.status(500).json({ error: "reverse lookup failed" })
    }

    const data = await r.json()
    const zip = data?.address?.postcode

    if (!zip) {
      return res.status(404).json({ error: "ZIP not found" })
    }

    res.json({ zip })
  } catch (err) {
    console.error("Reverse geocode failed:", err)
    res.status(500).json({ error: "Reverse geocode failed" })
  }
})

/* ---------- START ---------- */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
