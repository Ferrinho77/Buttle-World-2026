import LiveMatchCard from "./LiveMatchCard";
import LiveStandings from "./LiveStandings";

export default function LiveCenter({
  t,
  matches,
  realResults,
  matchEvents,
  lastLiveSync,
  liveSyncStatus,
  liveSyncMode,
  nextLiveSyncAt,
  formatMatchDateTime,
  trTeamLabel,
  groups,
  getGroupStandings,
}) {
  const sortedMatches = [...matches].sort(
    (a, b) => new Date(a.kickoff || "2099-01-01") - new Date(b.kickoff || "2099-01-01")
  );

  const liveMatches = sortedMatches.filter((match) => {
    const result = realResults[match.id];
    return result && !result.finished;
  });

  const finishedMatches = sortedMatches.filter((match) => realResults[match.id]?.finished).slice(-6);
  const nextMatches = sortedMatches
    .filter((match) => !realResults[match.id] && new Date(match.kickoff || "2099-01-01") >= new Date())
    .slice(0, 6);

  const focusMatches = liveMatches.length > 0 ? liveMatches : nextMatches;

  return (
    <>
      <h2>🔴 Live Match Center</h2>

      <div className="live-center-hero">
        <div>
          <h3>Centro partite live</h3>
          <p>
            Step 10C attivo: sincronizzazione intelligente API. Durante i live aggiorna ogni 10 minuti, fuori live ogni 1 ora.
          </p>
        </div>
        <div className="live-center-sync">
          <strong>{liveMatches.length}</strong>
          <span>{liveSyncMode === "live" ? "Sync 10 min" : "Sync 1 ora"}</span>
          {lastLiveSync && (
            <small>
              🔄 Ultimo aggiornamento: {lastLiveSync.toLocaleTimeString()}
              {liveSyncStatus ? ` — ${liveSyncStatus}` : ""}
            </small>
          )}
          {nextLiveSyncAt && (
            <small>⏭️ Prossimo controllo: {nextLiveSyncAt.toLocaleTimeString()}</small>
          )}
        </div>
      </div>

      <div className="live-kpi-grid">
        <div className="live-kpi-card">
          <strong>{liveMatches.length}</strong>
          <span>Partite live</span>
        </div>
        <div className="live-kpi-card">
          <strong>{finishedMatches.length}</strong>
          <span>Finali recenti</span>
        </div>
        <div className="live-kpi-card">
          <strong>{nextMatches.length}</strong>
          <span>Prossime partite</span>
        </div>
      </div>

      <div className="live-center-grid">
        <section className="live-panel">
          <h3>{liveMatches.length > 0 ? "Partite live" : "Prossime partite"}</h3>

          {focusMatches.length === 0 ? (
            <div className="live-empty-card">
              <strong>Nessuna partita live</strong>
              <p>Quando l’admin inserirà un risultato live, apparirà qui automaticamente.</p>
            </div>
          ) : (
            <div className="live-match-list">
              {focusMatches.map((match) => (
                <LiveMatchCard
                  key={match.id}
                  match={match}
                  result={realResults[match.id]}
                  events={matchEvents?.[match.id] || []}
                  formatMatchDateTime={formatMatchDateTime}
                  trTeamLabel={trTeamLabel}
                />
              ))}
            </div>
          )}
        </section>

        <section className="live-panel">
          <h3>Ultimi risultati</h3>

          {finishedMatches.length === 0 ? (
            <div className="live-empty-card">
              <strong>Nessun risultato finale</strong>
              <p>I risultati finali confermati saranno visibili in questa area.</p>
            </div>
          ) : (
            <div className="live-match-list compact">
              {finishedMatches.map((match) => (
                <LiveMatchCard
                  key={match.id}
                  match={match}
                  result={realResults[match.id]}
                  events={matchEvents?.[match.id] || []}
                  formatMatchDateTime={formatMatchDateTime}
                  trTeamLabel={trTeamLabel}
                  compact
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <LiveStandings
        groups={groups}
        getGroupStandings={getGroupStandings}
        trTeamLabel={trTeamLabel}
        t={t}
      />
    </>
  );
}
