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
  saveAllPredictions,
  clearMatchPredictions,
}) {
  return (
    <>
      <h2>{t.knockoutStagePredictions}</h2>
      <div className="league-box solid-info-box">
        <p>{t.knockoutInfo}</p>
      </div>

      <div className="tournament-bracket predictions-bracket">
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

                      <div className="prediction-team-row">
                        <span>{trTeamLabel(match.home)}</span>
                        <input
                          disabled={locked}
                          type="number"
                          min="0"
                          max="20"
                          value={predictions[match.id]?.home_score ?? ""}
                          onChange={(e) => updatePrediction(match.id, "home_score", e.target.value)}
                        />
                      </div>

                      <div className="prediction-team-row">
                        <span>{trTeamLabel(match.away)}</span>
                        <input
                          disabled={locked}
                          type="number"
                          min="0"
                          max="20"
                          value={predictions[match.id]?.away_score ?? ""}
                          onChange={(e) => updatePrediction(match.id, "away_score", e.target.value)}
                        />
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
