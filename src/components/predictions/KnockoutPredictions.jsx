function isSlotLabel(value) {
  const text = String(value || "").trim();

  if (!text) return true;
  if (/^\d+[A-L](,[A-L])*$/i.test(text.replace(/\s+/g, ""))) return true;
  if (text.toLowerCase().includes("migliore")) return true;
  if (text.toLowerCase().includes("best")) return true;
  if (text.toLowerCase().includes("vincente")) return true;
  if (text.toLowerCase().includes("winner")) return true;
  if (text.toLowerCase().includes("loser")) return true;
  if (text.toLowerCase().includes("perdente")) return true;

  return false;
}

function TeamSlotRealBox({ slot, team, trTeamLabel }) {
  const hasRealTeam = team && !isSlotLabel(team);

  return (
    <div className="slot-real-box">
      <div className="slot-line">
        <span>{slot || "-"}</span>
      </div>
      <div className="real-line">
        <span>{hasRealTeam ? trTeamLabel(team) : "-"}</span>
      </div>
    </div>
  );
}

export default function KnockoutPredictions({
  t,
  knockoutRounds,
  knockoutMatches,
  predictions,
  isPredictionLocked,
  formatMatchDateTime,
  trTeamLabel,
  trRoundName,
  getPredictionLockText,
  renderRealResult,
  renderResultStatus,
  updatePrediction,
  missingPredictionClass,
  saveAllPredictions,
  clearMatchPredictions,
}) {
  return (
    <>
      <h2>{t.knockoutStagePredictions}</h2>
      <div className="league-box solid-info-box">
        <p>
          In questa sezione si pronostica il risultato della Fase Finale. Prima della definizione dei gironi vedi gli slot ufficiali; quando saranno disponibili, vedrai anche le squadre reali.
        </p>
      </div>

      <div className="tournament-bracket predictions-bracket simple-final-stage">
        {knockoutRounds.map((round) => (
          <div key={round.round} className="tournament-round">
            <div className="round-title">{trRoundName(round.round)}</div>
            <div className="round-matches">
              {knockoutMatches
                .filter((match) => match.round === round.round)
                .map((match) => {
                  const locked = isPredictionLocked(match);

                  return (
                    <div key={match.id} className={`bracket-card prediction-card ${locked ? "locked" : ""}`}>
                      <div className="bracket-card-head">
                        <span>{match.code}</span>
                        <small>📅 {formatMatchDateTime(match)}</small>
                      </div>

                      <div className="slot-real-grid">
                        <TeamSlotRealBox
                          slot={match.home_slot || match.home}
                          team={match.home}
                          trTeamLabel={trTeamLabel}
                        />
                        <TeamSlotRealBox
                          slot={match.away_slot || match.away}
                          team={match.away}
                          trTeamLabel={trTeamLabel}
                        />
                      </div>

                      <div className="simple-score-row">
                        <label>
                          <span>Risultato 1</span>
                          <input
                            className={missingPredictionClass?.(match.id, "home_score") || ""}
                            disabled={locked}
                            type="number"
                            min="0"
                            max="20"
                            value={predictions[match.id]?.home_score ?? ""}
                            onChange={(e) => updatePrediction(match.id, "home_score", e.target.value)}
                          />
                        </label>

                        <label>
                          <span>Risultato 2</span>
                          <input
                            className={missingPredictionClass?.(match.id, "away_score") || ""}
                            disabled={locked}
                            type="number"
                            min="0"
                            max="20"
                            value={predictions[match.id]?.away_score ?? ""}
                            onChange={(e) => updatePrediction(match.id, "away_score", e.target.value)}
                          />
                        </label>
                      </div>

                      <div className="bracket-status">
                        <small className="prediction-lock-note">
                          {locked ? `${t.predictionLocked} 🔒` : getPredictionLockText(match)}
                        </small>
                        {renderRealResult(match.id)}
                        {renderResultStatus(match.id)}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => saveAllPredictions(knockoutMatches)} className="btn green legacy-action">
        {t.saveKnockoutPredictions}
      </button>
      <button onClick={() => clearMatchPredictions(knockoutMatches)} className="btn danger legacy-action">
        🗑 Cancella Tutto
      </button>
    </>
  );
}
