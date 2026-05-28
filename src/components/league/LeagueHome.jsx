export default function LeagueHome({
  t,
  lastLiveSync,
  liveSyncStatus,
  ranking,
  leaderRE,
  leaderPT,
  leaderPG,
  getCurrentTopScorer,
  liveMatchesHome,
  nextMatchesHome,
  trTeamLabel,
  renderRealResult,
  formatMatchDateTime,
  countdownTargetDate,
  countdownTargetMatch,
  tournamentStartDate,
  countdownParts,
  renderCountdownBox,
  leagueSettings,
}) {
  return (
    <>
      <h2>🏠 {t.leagueHome || "Home Lega"}</h2>
      {lastLiveSync && (
        <p className="live-sync-info">
          🔄 {t.lastUpdate || "Ultimo aggiornamento"}: {lastLiveSync.toLocaleTimeString()} {liveSyncStatus ? `— ${liveSyncStatus}` : ""}
        </p>
      )}

      {ranking.length > 0 && (
        <div className="home-hero-grid">
          <div className="home-panel podium-panel">
            <h3>🏆 {t.participantsRanking}</h3>
            <div className="podium-ranking compact-podium">
              {ranking.slice(0, 3).map((row, index) => (
                <div key={row.name} className={`podium-card podium-${index + 1}`}>
                  <div className="podium-medal">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</div>
                  <strong>{row.name}</strong>
                  <span>{row.total} pt</span>
                </div>
              ))}
            </div>
          </div>

          <div className="home-panel">
            <h3>⚡ Leader</h3>
            <p><strong>RE:</strong> {leaderRE?.name || "-"} {leaderRE ? `(${leaderRE.exact})` : ""}</p>
            <p><strong>PT:</strong> {leaderPT?.name || "-"} {leaderPT ? `(${leaderPT.qualificationBonus})` : ""}</p>
            <p><strong>PG:</strong> {leaderPG?.name || "-"} {leaderPG ? `(${leaderPG.groupBonus})` : ""}</p>
            <p><strong>CC:</strong> {getCurrentTopScorer() || "-"}</p>
          </div>
        </div>
      )}

      <div className="home-hero-grid">
        <div className="home-panel">
          <h3>🔴 LIVE</h3>
          {liveMatchesHome.length === 0 ? (
            <p>{t.noLiveMatches}</p>
          ) : (
            liveMatchesHome.map((m) => (
              <div key={m.id} className="home-match-card live-card">
                <strong>{trTeamLabel(m.home)} - {trTeamLabel(m.away)}</strong>
                {renderRealResult(m.id)}
              </div>
            ))
          )}
        </div>
        <div className="home-panel">
          <h3>⏳ {t.nextMatches}</h3>
          {nextMatchesHome.length === 0 ? (
            <p>{t.toBeDefined}</p>
          ) : (
            nextMatchesHome.map((m) => (
              <div key={m.id} className="home-match-card">
                <strong>{trTeamLabel(m.home)} - {trTeamLabel(m.away)}</strong>
                <small>📅 {formatMatchDateTime(m)}</small>
              </div>
            ))
          )}
        </div>
      </div>

      {countdownTargetDate && (
        <div className="home-panel countdown-panel">
          <h3>⏳ {leagueSettings.prediction_lock_mode === "tournament" ? "Chiusura pronostici torneo" : "Prossima chiusura pronostico"}</h3>
          {leagueSettings.prediction_lock_mode === "tournament" ? (
            <p>{t.firstTournamentMatch || 'Prima partita del torneo'}</p>
          ) : (
            <p>{countdownTargetMatch ? `${trTeamLabel(countdownTargetMatch.home)} - ${trTeamLabel(countdownTargetMatch.away)}` : "Prossima partita"}</p>
          )}
          <strong>{leagueSettings.prediction_lock_mode === "tournament" ? tournamentStartDate?.toLocaleString() : countdownTargetMatch ? formatMatchDateTime(countdownTargetMatch) : "-"}</strong>
          {renderCountdownBox(countdownParts)}
        </div>
      )}

      <div className="home-panel quick-rules-panel">
        <h3>📜 {t.rules}</h3>
        <p><strong>RE</strong> = {t.exactScore}; <strong>SC</strong> = {t.correctOutcome}; <strong>PT</strong> = {t.qualificationBonus || t.qualificationStage}; <strong>PG</strong> = {t.groupPlacementBonus || t.groupPlacement}; <strong>CC</strong> = {t.topScorer}.</p>
        <p>{leagueSettings.prediction_lock_mode === "tournament"
          ? "I pronostici match si bloccano all’inizio della prima partita del torneo."
          : "I pronostici match si bloccano al calcio d’inizio della relativa partita."}</p>
      </div>
    </>
  );
}
