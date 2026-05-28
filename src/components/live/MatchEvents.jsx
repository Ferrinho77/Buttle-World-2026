function eventIcon(type, detail) {
  const t = String(type || "").toLowerCase();
  const d = String(detail || "").toLowerCase();

  if (t.includes("goal") || d.includes("goal")) return "⚽";
  if (t.includes("card") && d.includes("red")) return "🟥";
  if (t.includes("card")) return "🟨";
  if (t.includes("subst")) return "🔄";
  if (t.includes("var")) return "📺";
  return "•";
}

function normalizeRealEvent(event) {
  return {
    minute: event.elapsed ?? "",
    extra: event.extra ?? null,
    icon: eventIcon(event.event_type, event.detail),
    side: "neutral",
    title: event.event_type || "Evento",
    detail: [
      event.player_name,
      event.assist_name ? `assist: ${event.assist_name}` : "",
      event.detail,
      event.team_name ? `(${event.team_name})` : "",
    ].filter(Boolean).join(" · "),
  };
}

function buildMockEvents(match, result, trTeamLabel) {
  if (!result) return [];

  const homeGoals = Number(result.home_score || 0);
  const awayGoals = Number(result.away_score || 0);
  const events = [];

  const homeName = trTeamLabel(match.home);
  const awayName = trTeamLabel(match.away);

  const homeMinutes = [18, 39, 67, 83, 90];
  const awayMinutes = [24, 52, 74, 88, 90];

  for (let i = 0; i < homeGoals; i += 1) {
    events.push({
      minute: homeMinutes[i] || 90,
      icon: "⚽",
      side: "home",
      title: `Gol ${homeName}`,
      detail: "Simulated event: waiting for real event data",
    });
  }

  for (let i = 0; i < awayGoals; i += 1) {
    events.push({
      minute: awayMinutes[i] || 90,
      icon: "⚽",
      side: "away",
      title: `Gol ${awayName}`,
      detail: "Simulated event: waiting for real event data",
    });
  }

  return events.sort((a, b) => a.minute - b.minute);
}

export default function MatchEvents({ t, match, result, events = [], trTeamLabel }) {
  if (!result) {
    return (
      <div className="match-events pro-events">
        <div className="event-empty">
          <strong>{t.timelineUnavailable || 'Timeline unavailable'}</strong>
          <small>{t.matchEventsEmpty}</small>
        </div>
      </div>
    );
  }

  const realEvents = events.map(normalizeRealEvent);
  const shownEvents = realEvents.length > 0 ? realEvents : buildMockEvents(match, result, trTeamLabel);
  const isReal = realEvents.length > 0;

  return (
    <div className="match-events pro-events">
      <div className="events-title-row">
        <strong>{t.matchEvents}</strong>
        <small>{isReal ? "API-Football" : (t.simulatedFallback || "Simulated fallback")}</small>
      </div>

      {shownEvents.length === 0 ? (
        <div className="event-empty">
          <strong>{t.noEvents || 'No events'}</strong>
          <small>{t.noMajorEvents}</small>
        </div>
      ) : (
        <div className="event-feed">
          {shownEvents.map((event, index) => (
            <div key={`${event.minute}-${event.title}-${index}`} className={`event-row ${event.side}`}>
              <span className="event-minute">
                {event.minute}{event.minute !== "" ? "'" : ""}{event.extra ? `+${event.extra}` : ""}
              </span>
              <span className="event-icon">{event.icon}</span>
              <div>
                <strong>{event.title}</strong>
                <small>{event.detail}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
