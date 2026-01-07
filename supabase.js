import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export const storeProducts = async (products) => {
  for (const p of products) {
    const item =
      Array.isArray(p.items) && p.items.length > 0
        ? p.items[0]
        : null;

    const { error } = await supabase
      .from("products")
      .insert({
        name: p.description ?? "Unknown product",
        brand: p.brand ?? null,
        source: "kroger",
        external_id: p.productId,
        price: item?.price?.promo ?? item?.price?.regular ?? null,
        image_url: null
      });

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      throw error; 
    }
  }
};

    
  


