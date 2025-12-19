import express from "express";
import dotenv from "dotenv";
import { getAccessToken, getStore, searchProducts } from "./kroger.js";

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

    const results = products.map(p => {
      const price = p.items[0].price;
      return {
        name: p.description,
        price: price?.promo || price?.regular
      };
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Failed to search products" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
