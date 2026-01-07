import fetch from "node-fetch";

export const getAccessToken = async () => {
  const clientId = process.env.KROGER_CLIENT_ID;
  const clientSecret = process.env.KROGER_CLIENT_SECRET;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(
    "https://api.kroger.com/v1/connect/oauth2/token",
    {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials&scope=product.compact"
    }
  );

  const data = await res.json();
  return data.access_token;
};

export const getStore = async (token) => {
  const res = await fetch(
    "https://api.kroger.com/v1/locations?filter.zipCode=45202&filter.limit=1",
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await res.json();
  return data.data[0].locationId;
};

export const searchProducts = async (token, locationId, term) => {
  const res = await fetch(
    `https://api.kroger.com/v1/products?filter.term=${term}&filter.locationId=${locationId}&filter.limit=5`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await res.json();
  return data.data;
};

