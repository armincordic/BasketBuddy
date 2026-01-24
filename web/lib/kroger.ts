export async function getAccessToken(): Promise<string> {
  const clientId = process.env.KROGER_CLIENT_ID;
  const clientSecret = process.env.KROGER_CLIENT_SECRET;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.kroger.com/v1/connect/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=product.compact",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kroger token request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("Kroger token response missing access_token");
  }
  return data.access_token;
}

export async function getStore(token: string, zip: string): Promise<string> {
  if (!zip) throw new Error("ZIP is required for store lookup");

  const res = await fetch(
    `https://api.kroger.com/v1/locations?filter.zipCode=${zip}&filter.limit=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kroger store lookup failed: ${text}`);
  }

  const data = await res.json();
  const locationId = data?.data?.[0]?.locationId;
  if (!locationId) {
    throw new Error("No Kroger store found for ZIP");
  }

  return locationId;
}

export async function searchProducts(
  token: string,
  locationId: string,
  term: string
) {
  const res = await fetch(
    `https://api.kroger.com/v1/products?filter.term=${encodeURIComponent(
      term
    )}&filter.locationId=${locationId}&filter.limit=20`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kroger search failed: ${text}`);
  }

  const data = await res.json();
  return data.data ?? [];
}

export async function getProductById(
  token: string,
  productId: string,
  locationId: string
) {
  const res = await fetch(
    `https://api.kroger.com/v1/products/${productId}?filter.locationId=${locationId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch product");
  }

  const json = await res.json();
  return json.data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeKrogerProduct(p: any) {
  const item =
    Array.isArray(p.items) && p.items.length > 0 ? p.items[0] : null;

  return {
    name: p.description ?? "Unknown product",
    brand: p?.brand,
    source: "Kroger",
    externalID: p?.productId,
    price: item?.price?.promo ?? item?.price?.regular ?? null,
    image_url:
      p.images?.find((img: { perspective: string }) => img.perspective === "front")
        ?.sizes?.[0]?.url ?? null,
  };
}
