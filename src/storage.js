import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = url && key ? createClient(url, key) : null;

const memory = new Map();

function defaults(id, name) {
  return { telegram_id: String(id), name: name || "User", nickname: null, tone: "normal", intensity: "normal", mode: "auto", mood: "neutral", recent: [], interactions: 0 };
}

export async function getUser(id, name) {
  const key = String(id);
  if (memory.has(key)) return memory.get(key);
  if (!supabase) { const u = defaults(id, name); memory.set(key, u); return u; }
  const { data, error } = await supabase.from("niva_users").select("*").eq("telegram_id", key).maybeSingle();
  if (error) console.error("Supabase getUser:", error.message);
  if (data) { memory.set(key, data); return data; }
  const u = defaults(id, name);
  const { data: inserted, error: insertError } = await supabase.from("niva_users").insert(u).select().single();
  if (insertError) console.error("Supabase insert:", insertError.message);
  const result = inserted || u; memory.set(key, result); return result;
}

export async function saveUser(id, patch) {
  const key = String(id);
  const current = memory.get(key) || defaults(id, patch.name);
  const next = { ...current, ...patch, telegram_id: key };
  memory.set(key, next);
  if (supabase) {
    const { error } = await supabase.from("niva_users").upsert(next, { onConflict: "telegram_id" });
    if (error) console.error("Supabase saveUser:", error.message);
  }
  return next;
}
