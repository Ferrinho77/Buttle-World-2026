export default function ParticipantsRanking({
  t,
  lastLiveSync,
  liveSyncStatus,
  ranking,
  AvatarBadge,
}) {
  return (
    <>
      <h2>{t.participantsRanking}</h2>

      {lastLiveSync && (
        <p className="live-sync-info">
          🔄 {t.liveSyncActive || "Live sync"}: {lastLiveSync.toLocaleTimeString()}
          {liveSyncStatus ? `— ${liveSyncStatus}` : ""}
        </p>
      )}

      {ranking.length > 0 && (
        <div className="podium-ranking">
          {ranking.slice(0, 3).map((row, index) => (
            <div key={row.name} className={`podium-card podium-${index + 1}`}>
              <div className="podium-medal">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
              </div>
              <div className="podium-avatar">
                <AvatarBadge size="large" />
              </div>
              <strong>{row.name}</strong>
              <span>{row.total} pt</span>
            </div>
          ))}
        </div>
      )}

      {ranking.length === 0 ? (
        <p>{t.noPointsYet}</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t.position}</th>
                <th>{t.participant || t.user}</th>
                <th>Tot</th>
                <th>RE</th>
                <th>SC</th>
                <th>PT</th>
                <th>PG</th>
                <th>CC</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((row, index) => (
                <tr
                  key={row.name}
                  style={
                    index === 0
                      ? {
                          background: "rgba(245, 165, 36, 0.18)",
                          fontWeight: "bold",
                        }
                      : {}
                  }
                >
                  <td>
                    {index === 0
                      ? "🥇"
                      : index === 1
                        ? "🥈"
                        : index === 2
                          ? "🥉"
                          : index + 1}
                  </td>
                  <td>{row.name}</td>
                  <td>
                    <strong>{row.total}</strong>
                  </td>
                  <td>{row.exact}</td>
                  <td>{row.outcome}</td>
                  <td>{row.qualificationBonus}</td>
                  <td>{row.groupBonus}</td>
                  <td>{row.topScorerPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="league-box">
        <p>
          <strong>Legenda:</strong> Tot = Punti Totali; RE = Risultati Esatti; SC = Segni Corretti; PT = Bonus Qualificate; PG = Bonus Classifica Gruppi; CC = Bonus Golden Boot.
        </p>
      </div>
    </>
  );
}
