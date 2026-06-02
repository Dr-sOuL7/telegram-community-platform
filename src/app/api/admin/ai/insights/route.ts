import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { aiInsightsService } from "@/services/container";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId } = await request.json();
    if (!groupId) return NextResponse.json({ error: "groupId is required" }, { status: 400 });

    await aiInsightsService.generateInsights(groupId);

    return NextResponse.json({ success: true, message: "Insights generated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
