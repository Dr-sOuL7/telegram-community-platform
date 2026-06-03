import { NextResponse } from "next/server";
import { requireApiRole, ADMIN_ROLES } from "@/lib/auth/dal";
import { recordDashboardAction } from "@/lib/auth/audit";
import { aiInsightsService } from "@/services/container";

export async function POST(request: Request) {
  try {
    // AI generation incurs real cost — restrict to admin tiers (not VIEWER/MODERATOR).
    const gate = await requireApiRole(ADMIN_ROLES);
    if ("response" in gate) return gate.response;

    const { groupId } = await request.json();
    if (!groupId) return NextResponse.json({ error: "groupId is required" }, { status: 400 });

    await aiInsightsService.generateInsights(groupId);

    await recordDashboardAction({
      dashboardUserId: gate.user.id,
      action: "AI_INSIGHTS_GENERATED",
      resourceType: "GROUP",
      resourceId: groupId,
    });

    return NextResponse.json({ success: true, message: "Insights generated successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
