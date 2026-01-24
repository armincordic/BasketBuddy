import { NextRequest, NextResponse } from "next/server";
import {
  getAccessToken,
  getStore,
  getProductById,
  normalizeKrogerProduct,
} from "@/lib/kroger";

export async function GET(req: NextRequest) {
  try {
    const zip = req.nextUrl.searchParams.get("zip") ?? "";
    const idsParam = req.nextUrl.searchParams.get("ids") ?? "";
    const ids = idsParam ? idsParam.split(",") : [];

    if (ids.length === 0) return NextResponse.json([]);

    const token = await getAccessToken();
    const locationId = await getStore(token, zip);

    const products = await Promise.all(
      ids.map(async (id) => {
        try {
          const raw = await getProductById(token, id, locationId);
          return normalizeKrogerProduct(raw);
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json(products.filter(Boolean));
  } catch (err) {
    console.error(err);
    return NextResponse.json([]);
  }
}
