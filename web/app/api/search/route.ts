import { NextRequest, NextResponse } from "next/server";
import {
  getAccessToken,
  getStore,
  searchProducts,
  normalizeKrogerProduct,
} from "@/lib/kroger";

export async function GET(req: NextRequest) {
  try {
    const zip = req.nextUrl.searchParams.get("zip");
    const term = req.nextUrl.searchParams.get("term");

    if (!zip || !term) {
      return NextResponse.json(
        { error: "zip and term are required" },
        { status: 400 }
      );
    }

    const token = await getAccessToken();
    const locationId = await getStore(token, zip);
    const products = await searchProducts(token, locationId, term);

    return NextResponse.json(products.map(normalizeKrogerProduct));
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}
