import express from "express";
import dotenv from "dotenv";
import { getAccessToken, getStore, searchProducts } from "./kroger.js";
import { storeProducts } from "./supabase.js";

dotenv.config();

const app = express();
const PORT = 3000;

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
    imageurl: null
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
