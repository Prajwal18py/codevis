// src/utils/supabase.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL    = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON   = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Auth helpers ───────────────────────────────────────────────
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signInWithGitHub() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── Save analysis result ───────────────────────────────────────
export async function saveResult({ type, title, lang, result, userId }) {
  const { data, error } = await supabase.from("saved_results").insert({
    user_id:    userId,
    type,           // "lc" | "oop"
    title,          // problem name or "OOP Analysis"
    lang,           // "cpp" | "python"
    result_json:    result,
    created_at:     new Date().toISOString(),
  });
  if (error) throw error;
  return data;
}

// ── Get user's history ─────────────────────────────────────────
export async function getHistory(userId) {
  const { data, error } = await supabase
    .from("saved_results")
    .select("id, type, title, lang, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

// ── Get single saved result ────────────────────────────────────
export async function getSavedResult(id) {
  const { data, error } = await supabase
    .from("saved_results")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// ── Delete saved result ────────────────────────────────────────
export async function deleteResult(id) {
  const { error } = await supabase
    .from("saved_results")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ── Save quiz score ────────────────────────────────────────────
export async function saveQuizScore({ userId, topic, score, total }) {
  const { error } = await supabase.from("quiz_scores").insert({
    user_id:    userId,
    topic,
    score,
    total,
    pct:        Math.round((score / total) * 100),
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ── Get quiz scores ────────────────────────────────────────────
export async function getQuizScores(userId) {
  const { data, error } = await supabase
    .from("quiz_scores")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data;
}

// ── Streak tracking ────────────────────────────────────────────
export async function updateStreak(userId) {
  const today = new Date().toISOString().slice(0, 10); // "2026-03-11"

  // Get existing streak record
  const { data } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!data) {
    // First time — create streak
    await supabase.from("streaks").insert({
      user_id:      userId,
      current:      1,
      longest:      1,
      last_date:    today,
      updated_at:   new Date().toISOString(),
    });
    return { current: 1, longest: 1 };
  }

  const last = data.last_date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (last === today) return { current: data.current, longest: data.longest }; // already updated today

  const newCurrent = last === yesterdayStr ? data.current + 1 : 1; // continues or resets
  const newLongest = Math.max(newCurrent, data.longest);

  await supabase.from("streaks").update({
    current:    newCurrent,
    longest:    newLongest,
    last_date:  today,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);

  return { current: newCurrent, longest: newLongest };
}

export async function getStreak(userId) {
  const { data } = await supabase
    .from("streaks")
    .select("current, longest, last_date")
    .eq("user_id", userId)
    .single();
  if (!data) return { current: 0, longest: 0 };
  // If last activity wasn't today or yesterday, streak is broken
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  if (data.last_date !== today && data.last_date !== yesterdayStr) {
    return { current: 0, longest: data.longest };
  }
  return { current: data.current, longest: data.longest };
}