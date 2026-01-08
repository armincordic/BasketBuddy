import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getAccessToken, getStore, searchProducts } from "./kroger.js";
import { storeProducts } from "./supabaseAdmin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config();

const app = express();
const PORT = 3000;

app.use(
  express.static(
    path.join(__dirname, "../frontend/public")
  )
);

app.get("/search", async (req, res) => {
  const term = req.query.term;

  if (!term) {
    return res.status(400).json({ error: "Missing search term" });
  }

  try {
    const token = await getAccessToken();
    const locationId = await getStore(token);
    const products = await searchProducts(token, locationId, term);
    await storeProducts(products);


  const results = products.map(p => {
  const item =
    Array.isArray(p.items) && p.items.length > 0
      ? p.items[0]
      : null;
    
    
  return {
    name: p.description ?? "Unknown product",
    brand: p?.brand,
    source: "Kroger",
    externalID: p?.productId,
    price: item?.price?.promo ?? item?.price?.regular ?? null,
    image_url: p.images?.[0]?.sizes?.find(s => s.size === "medium")?.url ?? null
  };



  


});


    res.json(results);
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({ error: "Failed to search products" });
  }

  
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
