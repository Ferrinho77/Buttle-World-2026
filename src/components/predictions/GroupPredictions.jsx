export default function GroupPredictions({
  t,
  matches,
  predictions,
  isPredictionLocked,
  formatMatchDateTime,
  trTeamLabel,
  getPredictionLockText,
  renderRealResult,
  renderResultStatus,
  updatePrediction,
  saveAllPredictions,
  clearMatchPredictions,
}) {
  const sortedMatches = [...matches].sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

  return (
    <>
      <h2>{t.groupStagePredictions}</h2>
      <div className="group-predictions-list group-predictions-scroll">
        {sortedMatches.map((match) => {
          const locked = isPredictionLocked(match);

          return (
            <div key={match.id} className={`match-box ${locked ? "locked" : ""}`}>
              <p>📅 {formatMatchDateTime(match)}</p>
              <strong>{trTeamLabel(match.home)} - {trTeamLabel(match.away)}</strong>
              <p className="prediction-lock-note">
                {locked ? `${t.predictionLocked} 🔒` : getPredictionLockText(match)}
              </p>
              {renderRealResult(match.id)}
              {renderResultStatus(match.id)}
              <div className="score-row">
                <input
                  disabled={locked}
                  type="number"
                  min="0"
                  max="20"
                  placeholder={trTeamLabel(match.home)}
                  value={predictions[match.id]?.home_score ?? ""}
                  onChange={(e) => updatePrediction(match.id, "home_score", e.target.value)}
                />
                <input
                  disabled={locked}
                  type="number"
                  min="0"
                  max="20"
                  placeholder={trTeamLabel(match.away)}
                  value={predictions[match.id]?.away_score ?? ""}
                  onChange={(e) => updatePrediction(match.id, "away_score", e.target.value)}
                />
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={saveAllPredictions} className="btn green legacy-action">
        {t.saveAllPredictions}
      </button>
      <button onClick={() => clearMatchPredictions(matches)} className="btn danger legacy-action">
        🗑 Cancella Tutto
      </button>
    </>
  );
}
