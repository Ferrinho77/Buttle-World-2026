// Supabase Edge Function: sync-live-results
// Provider supportato: API-FOOTBALL / API-SPORTS
// Secrets richiesti:
//   supabase secrets set API_FOOTBALL_KEY=xxxxx
// Opzionali:
//   API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
//   API_FOOTBALL_TIMEZONE=Europe/Bucharest
//
// Richiede:
// - match_api_mapping: local_match_id -> provider_fixture_id
// - real_results
// - match_events

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ApiFootballFixture = {
  fixture?: {
    id?: number;
    status?: { short?: string; elapsed?: number | null };
  };
  goals?: { home?: number | null; away?: number | null };
  score?: { fulltime?: { home?: number | null; away?: number | null } };
};

type ApiFootballEvent = {
  time?: { elapsed?: number | null; extra?: number | null };
  team?: { id?: number | null; name?: string | null };
  player?: { id?: number | null; name?: string | null };
  assist?: { id?: number | null; name?: string | null };
  type?: string | null;
  detail?: string | null;
  comments?: string | null;
};

function isFinished(status?: string) {
  return ["FT", "AET", "PEN"].includes(String(status || "").toUpperCase());
}

function normalizeScore(item: ApiFootballFixture) {
  const status = item.fixture?.status?.short || "";
  const elapsed = item.fixture?.status?.elapsed ?? null;
  const home = item.goals?.home ?? item.score?.fulltime?.home ?? 0;
  const away = item.goals?.away ?? item.score?.fulltime?.away ?? 0;
  return {
    home_score: Math.max(0, Math.min(20, Number(home ?? 0))),
    away_score: Math.max(0, Math.min(20, Number(away ?? 0))),
    finished: isFinished(status),
    minute: elapsed,
    status,
  };
}

function buildEventKey(event: ApiFootballEvent, index: number) {
  const elapsed = event.time?.elapsed ?? "";
  const extra = event.time?.extra ?? "";
  const team = event.team?.id ?? event.team?.name ?? "";
  const player = event.player?.id ?? event.player?.name ?? "";
  const type = event.type ?? "";
  const detail = event.detail ?? "";
  return `${elapsed}-${extra}-${team}-${player}-${type}-${detail}-${index}`;
}

function normalizeEvent(
  localMatchId: string,
  providerFixtureId: string,
  event: ApiFootballEvent,
  index: number,
) {
  return {
    match_id: localMatchId,
    provider: "api-football",
    provider_fixture_id: providerFixtureId,
    event_key: buildEventKey(event, index),
    elapsed: event.time?.elapsed ?? null,
    extra: event.time?.extra ?? null,
    team_id: event.team?.id ?? null,
    team_name: event.team?.name ?? null,
    player_id: event.player?.id ?? null,
    player_name: event.player?.name ?? null,
    assist_id: event.assist?.id ?? null,
    assist_name: event.assist?.name ?? null,
    event_type: event.type ?? null,
    detail: event.detail ?? null,
    comments: event.comments ?? null,
    raw: event,
    updated_at: new Date().toISOString(),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const API_KEY = Deno.env.get("API_FOOTBALL_KEY");
    const BASE_URL = Deno.env.get("API_FOOTBALL_BASE_URL") || "https://v3.football.api-sports.io";
    const TIMEZONE = Deno.env.get("API_FOOTBALL_TIMEZONE") || "Europe/Bucharest";

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    if (!API_KEY) {
      return new Response(JSON.stringify({ ok: false, updated: 0, events_updated: 0, skipped: 0, message: "API_FOOTBALL_KEY non configurata" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: mappings, error: mappingError } = await supabase
      .from("match_api_mapping")
      .select("local_match_id, provider_fixture_id")
      .eq("provider", "api-football");

    if (mappingError) throw mappingError;

    let updated = 0;
    let eventsUpdated = 0;
    let skipped = 0;

    for (const row of mappings || []) {
      if (!row.provider_fixture_id || !row.local_match_id) {
        skipped++;
        continue;
      }

      const providerFixtureId = String(row.provider_fixture_id);
      const localMatchId = String(row.local_match_id);

      const fixtureUrl = `${BASE_URL}/fixtures?id=${encodeURIComponent(providerFixtureId)}&timezone=${encodeURIComponent(TIMEZONE)}`;
      const fixtureRes = await fetch(fixtureUrl, { headers: { "x-apisports-key": API_KEY } });

      if (!fixtureRes.ok) {
        skipped++;
        continue;
      }

      const fixturePayload = await fixtureRes.json();
      const fixture = fixturePayload?.response?.[0] as ApiFootballFixture | undefined;

      if (!fixture) {
        skipped++;
        continue;
      }

      const score = normalizeScore(fixture);

      const { error: resultError } = await supabase.from("real_results").upsert({
        match_id: localMatchId,
        home_score: score.home_score,
        away_score: score.away_score,
        finished: score.finished,
        minute: score.minute,
        status: score.status,
        source: "api-football",
        api_last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (resultError) {
        skipped++;
        continue;
      }

      updated++;

      const status = String(score.status || "").toUpperCase();
      const shouldLoadEvents = Boolean(score.minute) || ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "FT", "AET", "PEN"].includes(status);

      if (shouldLoadEvents) {
        const eventsUrl = `${BASE_URL}/fixtures/events?fixture=${encodeURIComponent(providerFixtureId)}`;
        const eventsRes = await fetch(eventsUrl, { headers: { "x-apisports-key": API_KEY } });

        if (eventsRes.ok) {
          const eventsPayload = await eventsRes.json();
          const apiEvents = (eventsPayload?.response || []) as ApiFootballEvent[];

          await supabase.from("match_events").delete().eq("match_id", localMatchId).eq("provider", "api-football");

          if (apiEvents.length > 0) {
            const normalizedEvents = apiEvents.map((event, index) =>
              normalizeEvent(localMatchId, providerFixtureId, event, index)
            );

            const { error: eventsError } = await supabase
              .from("match_events")
              .upsert(normalizedEvents, { onConflict: "match_id,event_key" });

            if (!eventsError) eventsUpdated += normalizedEvents.length;
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, updated, events_updated: eventsUpdated, skipped }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error?.message || error) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
