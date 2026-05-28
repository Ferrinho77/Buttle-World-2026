export default function UsersPredictions({
  t,
  usersSubTab,
  setUsersSubTab,
  selectedPredictionUser,
  setSelectedPredictionUser,
  users,
  filteredUsers,
  confirmedTopScorer,
  getCurrentTopScorer,
  topScorerPredictions,
  matches,
  knockoutMatches,
  trTeamLabel,
  formatMatchDateTime,
  renderUsersRealResultCell,
  uniquePredictions,
  realResults,
  calculatePoints,
  getPredictionColor,
  leagueSettings,
  qualificationRounds,
  getBonusPredictionMapForUser,
  getBonusCellColor,
  groups,
  trGroupName,
}) {
  return <>

          <h2>{t.usersPredictions}</h2>
          <div className="subtabs">
            <button className={usersSubTab === "match" ? "active" : ""} onClick={() => setUsersSubTab("match")}>Match</button>
            <button className={usersSubTab === "pt" ? "active" : ""} onClick={() => setUsersSubTab("pt")}>Qualificate</button>
            <button className={usersSubTab === "pg" ? "active" : ""} onClick={() => setUsersSubTab("pg")}>Classifica Gruppi</button>
          </div>
          <div className="user-filter-box">
            <label>Visualizza utente</label>
            <select value={selectedPredictionUser} onChange={(e) => setSelectedPredictionUser(e.target.value)}>
              <option value="__all__">Tutti gli utenti</option>
              {users.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          {usersSubTab === "match" && <><div className="grid-scroll users-mobile-table"><table className="predictions-grid users-predictions-table">
            <thead><tr><th className="sticky-col sticky-head">{t.match}</th><th className="sticky-head">{t.realResult}</th>{filteredUsers.map((name) => <th key={name} className="sticky-head">{name}</th>)}</tr></thead>
            <tbody>
              <tr>
                <td className="sticky-col"><strong>🏆 {t.topScorer}</strong></td>
                <td style={{ textAlign: "center", fontWeight: "bold", color: confirmedTopScorer ? "#18c964" : "#58a6ff" }}>
                  <div>{getCurrentTopScorer() || "-"}</div>
                  {getCurrentTopScorer() && <small>{confirmedTopScorer ? `✅ ${t.finalTopScorer}` : `🔵 ${t.provisionalTopScorer}`}</small>}
                </td>
                {filteredUsers.map((name) => <td key={name} style={{ textAlign: "center", fontWeight: "bold" }}>{topScorerPredictions[name] || "-"}</td>)}
              </tr>
              {[...matches, ...knockoutMatches].map((match) => <tr key={match.id}>
              <td className="sticky-col">
                <div>{trTeamLabel(match.home)} - {trTeamLabel(match.away)}</div>
                <small style={{ display: "block", color: "#9fb1c8", marginTop: 4 }}>📅 {formatMatchDateTime(match)}</small>
              </td>
              {renderUsersRealResultCell(match.id)}
              {filteredUsers.map((name) => {
                const prediction = uniquePredictions().find((p) => p.match_id === match.id && p.username === name);
                const real = realResults[match.id];
                const points = prediction && real?.finished ? calculatePoints(prediction, real) : null;
                return <td key={name} style={{ background: getPredictionColor(prediction, real), fontWeight: "bold", textAlign: "center" }}>
                  <div>{prediction ? `${prediction.home_score}-${prediction.away_score}` : "-"}</div>
                  {real && <small style={{ display: "block", marginTop: 4 }}>{real.finished && points !== null ? `${t.points}: ${points}` : `🔵 ${t.live}`}</small>}
                </td>;
              })}
            </tr>)}
            </tbody>
          </table></div>
          <div className="league-box"><p>🟩 {t.exactLegend}</p><p>🟨 {t.outcomeLegend}</p></div></>}
          {usersSubTab === "pt" && leagueSettings.enable_qualification_bonus && <div className="league-box"><h3>✅ Pronostici PT Utenti</h3><div className="grid-scroll users-mobile-table"><table className="predictions-grid users-predictions-table"><thead><tr><th className="sticky-col sticky-head">Utente</th>{qualificationRounds.map((r) => <th className="sticky-head" key={r.key}>{r.label}</th>)}<th className="sticky-head">Vincente</th></tr></thead><tbody>{filteredUsers.map((name) => { const map = getBonusPredictionMapForUser(name); return <tr key={name}><td className="sticky-col">{name}</td>{qualificationRounds.map((r) => <td key={r.key}>{(map[`qualification::${r.key}`] || []).map((team) => <div key={team} className="mini-chip" style={{ background: getBonusCellColor("qualification", r.key, team) }}>{team}</div>)}</td>)}<td><div className="mini-chip" style={{ background: getBonusCellColor("qualification", "champion", map[`qualification::champion`]) }}>{map[`qualification::champion`] || "-"}</div></td></tr>; })}</tbody></table></div></div>}
          {usersSubTab === "pg" && leagueSettings.enable_group_positions_bonus && <div className="league-box"><h3>📊 Classifica Gruppi</h3><div className="grid-scroll users-mobile-table"><table className="predictions-grid pg-vertical-grid"><thead><tr><th className="sticky-col sticky-head">Gruppo / posizione</th>{filteredUsers.map((name) => <th className="sticky-head" key={name}>{name}</th>)}</tr></thead><tbody>{groups.flatMap((g) => [0, 1, 2, 3].map((idx) => <tr key={`${g.name}-${idx}`}><td className="sticky-col"><strong>{trGroupName(g.name)}</strong><small>{idx + 1}° posizione</small></td>{filteredUsers.map((name) => { const map = getBonusPredictionMapForUser(name); const team = (map[`group_position::${g.name}`] || [])[idx]; return <td key={name} style={{ textAlign: "center" }}>{team ? <div className="mini-chip" style={{ background: getBonusCellColor("group_position", g.name, team, idx) }}>{team}</div> : "-"}</td>; })}</tr>))}</tbody></table></div></div>}

  </>;
}
