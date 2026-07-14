import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const URGENT_THRESHOLD_DAYS = 2;

interface UrgentItem {
  name: string;
  icon: string;
  daysRemaining: number;
}

function daysRemainingFrom(lastPurchasedAt: string, cycleDays: number): number {
  const last = new Date(lastPurchasedAt);
  const now = new Date();
  const lastUtc = Date.UTC(last.getFullYear(), last.getMonth(), last.getDate());
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const daysSincePurchase = Math.floor((nowUtc - lastUtc) / MS_PER_DAY);
  return cycleDays - daysSincePurchase;
}

function buildEmailHtml(items: UrgentItem[]): string {
  const rows = items
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .map((item) => {
      const status =
        item.daysRemaining <= 0
          ? "toca comprarlo ya"
          : `se acaba en ${item.daysRemaining} ${item.daysRemaining === 1 ? "día" : "días"}`;
      return `<li>${item.icon} <strong>${item.name}</strong> — ${status}</li>`;
    })
    .join("");

  return `<p>Hola,</p><p>Según tu ritmo de compra, esto se te va a acabar pronto:</p><ul>${rows}</ul><p>Abre nevi para ver la lista completa.</p>`;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const resend = getResendClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("household_id, name, icon, cycle_days, last_purchased_at");
  if (error || !products) {
    return NextResponse.json({ sent: 0, error: error?.message }, { status: 500 });
  }

  const urgentByHousehold = new Map<string, UrgentItem[]>();
  for (const p of products) {
    const daysRemaining = daysRemainingFrom(p.last_purchased_at, p.cycle_days);
    if (daysRemaining > URGENT_THRESHOLD_DAYS) continue;

    const list = urgentByHousehold.get(p.household_id) ?? [];
    list.push({ name: p.name, icon: p.icon, daysRemaining });
    urgentByHousehold.set(p.household_id, list);
  }

  let sent = 0;
  for (const [householdId, items] of urgentByHousehold) {
    const { data: members } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", householdId);
    if (!members || members.length === 0) continue;

    const html = buildEmailHtml(items);

    for (const member of members) {
      const { data: userData } = await supabase.auth.admin.getUserById(member.user_id);
      const email = userData?.user?.email;
      if (!email) continue;

      await resend.emails.send({
        from: "nevi <onboarding@resend.dev>",
        to: email,
        subject: "Esto se te acaba pronto 🧺",
        html,
      });
      sent++;
    }
  }

  return NextResponse.json({ sent });
}
