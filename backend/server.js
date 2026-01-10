import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import {
  getAccessToken,
  getStore,
  searchProducts,
  getProductById,
  normalizeKrogerProduct
} from "./kroger.js";
import { supabase } from "./supabaseAdmin.js";

dotenv.config();

const app = express();
const PORT = 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend/public")));

async function getUserFromReq(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  return supabase.auth.getUser(token);
}

/* ---------- SEARCH ---------- */
app.get("/api/search", async (req, res) => {
  try {
    const token = await getAccessToken();
    const locationId = await getStore(token);
    const products = await searchProducts(token, locationId, req.query.term);
    res.json(products.map(normalizeKrogerProduct));
  } catch {
    res.status(500).json([]);
  }
});

/* ---------- PRODUCTS ---------- */
app.get("/api/products", async (req, res) => {
  try {
    const ids = req.query.ids?.split(",") ?? [];
    if (ids.length === 0) return res.json([]);

    const token = await getAccessToken();
    const locationId = await getStore(token);

    const products = await Promise.all(
      ids.map(async id => {
        try {
          const raw = await getProductById(token, id, locationId);
          return normalizeKrogerProduct(raw);
        } catch {
          return null;
        }
      })
    );

    res.json(products.filter(Boolean));
  } catch {
    res.json([]);
  }
});

/* ---------- SAVED ITEMS ---------- */
app.get("/api/saved-items", async (req, res) => {
  const { data: { user } } = await getUserFromReq(req);
  if (!user) return res.status(401).json([]);

  const { data } = await supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", user.id);

  res.json(data ?? []);
});

app.post("/api/saved-items", async (req, res) => {
  const { data: { user } } = await getUserFromReq(req);
  if (!user) return res.sendStatus(401);

  const { externalID, source, name, image_url, price } = req.body;

  const { data: existing } = await supabase
    .from("saved_items")
    .select("quantity")
    .eq("user_id", user.id)
    .eq("external_id", externalID)
    .eq("source", source)
    .single();

  if (existing) {
    await supabase
      .from("saved_items")
      .update({ quantity: existing.quantity + 1 })
      .eq("user_id", user.id)
      .eq("external_id", externalID)
      .eq("source", source);
  } else {
    await supabase.from("saved_items").insert({
      user_id: user.id,
      external_id: externalID,
      source,
      name,
      image_url,
      price_snapshot: price,
      quantity: 1
    });
  }

  res.sendStatus(200);
});

app.delete("/api/saved-items/:id", async (req, res) => {
  const { data: { user } } = await getUserFromReq(req);
  if (!user) return res.sendStatus(401);

  const { data: row } = await supabase
    .from("saved_items")
    .select("quantity")
    .eq("user_id", user.id)
    .eq("external_id", req.params.id)
    .single();

  if (!row) return res.sendStatus(200);

  if (row.quantity > 1) {
    await supabase
      .from("saved_items")
      .update({ quantity: row.quantity - 1 })
      .eq("user_id", user.id)
      .eq("external_id", req.params.id);
  } else {
    await supabase
      .from("saved_items")
      .delete()
      .eq("user_id", user.id)
      .eq("external_id", req.params.id);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
