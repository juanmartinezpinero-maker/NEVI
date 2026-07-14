import { createClient } from "@/lib/supabase/server";

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number | null;
  dietaryNotes: string | null;
}

export async function getHouseholdId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();
  if (error || !data) throw new Error("No se encontró tu familia");

  return data.household_id;
}

export async function getHousehold(): Promise<Household | null> {
  const supabase = await createClient();

  let householdId: string;
  try {
    householdId = await getHouseholdId();
  } catch {
    return null;
  }

  const { data, error } = await supabase
    .from("households")
    .select("id, name, invite_code, member_count, dietary_notes")
    .eq("id", householdId)
    .single();
  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    inviteCode: data.invite_code,
    memberCount: data.member_count,
    dietaryNotes: data.dietary_notes,
  };
}

export async function renameHousehold(name: string) {
  const supabase = await createClient();
  const householdId = await getHouseholdId();

  const { error } = await supabase.from("households").update({ name }).eq("id", householdId);
  if (error) throw new Error(error.message);
}

export async function updateHouseholdPreferences(input: {
  memberCount: number | null;
  dietaryNotes: string;
}) {
  const supabase = await createClient();
  const householdId = await getHouseholdId();

  const { error } = await supabase
    .from("households")
    .update({ member_count: input.memberCount, dietary_notes: input.dietaryNotes || null })
    .eq("id", householdId);
  if (error) throw new Error(error.message);
}

export async function joinHousehold(inviteCode: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: targetHouseholdId, error: findError } = await supabase.rpc(
    "find_household_by_invite_code",
    { code: inviteCode.trim() },
  );
  if (findError || !targetHouseholdId) {
    throw new Error("Código de invitación no válido");
  }

  const { error } = await supabase
    .from("household_members")
    .update({ household_id: targetHouseholdId })
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
}
