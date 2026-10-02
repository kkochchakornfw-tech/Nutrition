import { NextResponse } from "next/server";
import { requireApiSession, isResponse } from "@/lib/api-helpers";
import { getFoodExchangeItems } from "@/lib/calorie/foodsRepo";

/** รายการอาหารตาราง 3 + ค่า fac ล่าสุด — ใช้เติมฟอร์มคำนวณแคลอรี่ฝั่ง client */
export async function GET() {
  const session = await requireApiSession();
  if (isResponse(session)) return session;

  return NextResponse.json({ foods: await getFoodExchangeItems() });
}
