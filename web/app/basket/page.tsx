"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Cookies from "js-cookie";
import {
  getSavedItems,
  addSavedItem,
  deleteSavedItem
} from "@/lib/api";

type Product = {
  externalID: string;
  name: string;
  price: number;
  image_url: string;
  source: string;
};

type SavedItem = {
  external_id: string;
  quantity: number;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/®|™/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function Basket() {
  const router = useRouter();

  const [isReady, setIsReady] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<Product[]>([]);

  /* ---------- AUTH READY ---------- */
  useEffect(() => {
    supabase.auth.getSession().then(() => {
      setIsReady(true);
    });
  }, []);

  /* ---------- LOAD BASKET ---------- */
  useEffect(() => {
    if (!isReady) return;

    getSavedItems().then((items: SavedItem[]) => {
      const map: Record<string, number> = {};
      items.forEach(i => {
        if (i.quantity > 0) {
          map[i.external_id] = i.quantity;
        }
      });
      setQuantities(map);
    });
  }, [isReady]);

  const ids = useMemo(() => Object.keys(quantities), [quantities]);

  /* ---------- FETCH PRODUCTS ---------- */
  useEffect(() => {
    if (ids.length === 0) return;

    const zip = Cookies.get("zip");
    fetch(
      `/api/products?ids=${ids.join(",")}&zip=${zip ?? ""}`
    )
      .then(res => res.json())
      .then(setProducts);
  }, [ids]);

  /* ---------- MUTATIONS ---------- */
  function inc(id: string) {
    setQuantities(q => ({
      ...q,
      [id]: (q[id] ?? 0) + 1
    }));
    addSavedItem(id, 1);
  }

  function dec(id: string) {
    setQuantities(q => {
      const current = q[id] ?? 0;
      if (current <= 1) {
        const n = { ...q };
        delete n[id];
        return n;
      }
      return { ...q, [id]: current - 1 };
    });
    deleteSavedItem(id);
  }

  const visibleProducts = products.filter(
    p => (quantities[p.externalID] ?? 0) > 0
  );

  const total = visibleProducts.reduce(
    (sum, p) => sum + p.price * quantities[p.externalID],
    0
  );

  /* ---------- UI ---------- */
  return (
  <div className="min-h-screen bg-(--parchment) flex justify-center px-6 py-8">
    <div className="w-full max-w-3xl flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-center text-(--charcoal)">
        Your Basket
      </h1>

      {visibleProducts.length === 0 ? (
        <p className="text-center text-(--charcoal)">
          Your basket is empty.
        </p>
      ) : (
        <ul className="flex flex-col gap-6">
          {visibleProducts.map(p => {
            const krogerUrl = `https://www.kroger.com/p/${slugify(
              p.name
            )}/${p.externalID}`;

            return (
              <li
                key={p.externalID}
                className="flex gap-4 p-4 rounded bg-white border border-(--dust)"
              >
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-28 h-28 object-contain"
                />

                <div className="flex flex-col flex-1 gap-2">
                  <p className="font-medium text-(--charcoal)">
                    {p.name}
                  </p>

                  <p className="text-sm text-(--slateblue)">
                    ${p.price.toFixed(2)}
                  </p>

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => dec(p.externalID)}
                      className="px-3 py-1 rounded border border-(--dust) text-(--charcoal)"
                    >
                      −
                    </button>

                    <span className="text-(--charcoal)">
                      {quantities[p.externalID]}
                    </span>

                    <button
                      onClick={() => inc(p.externalID)}
                      className="px-3 py-1 rounded border border-(--dust)] text-(--charcoal)"
                    >
                      +
                    </button>
                  </div>

                  <a
                    href={krogerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 text-sm text-(--slateblue) hover:underline"
                  >
                    View on Kroger
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex justify-between items-center mt-4">
        <h2 className="text-xl font-semibold text-(--charcoal)">
          Total: ${total.toFixed(2)}
        </h2>

        <button
          onClick={() => router.push("/search")}
          className="px-4 py-2 rounded bg-(--slateblue) text-white
                     hover:bg-(--teal) transition"
        >
          Back to Search
        </button>
      </div>
    </div>
  </div>
);

}
