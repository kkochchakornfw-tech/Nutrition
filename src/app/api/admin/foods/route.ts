import { NextResponse } from "next/server";
import { requireAdminApiSession, isResponse } from "@/lib/api-helpers";
import { listFoodExchangeItemsAdmin } from "@/lib/calorie/foodsRepo";

export async function GET() {
  const session = await requireAdminApiSession();
  if (isResponse(session)) return session;

  return NextResponse.json({ foods: await listFoodExchangeItemsAdmin() });
}
