export default function LiveStandings({ groups, getGroupStandings, trTeamLabel, t }) {
  return (
    <section className="live-panel live-standings-panel">
      <h3>📊 {t.liveGroupRanking || "Classifica gironi live"}</h3>

      <div className="live-standings-grid">
        {groups.slice(0, 6).map((group) => {
          const standings = getGroupStandings(group.name).slice(0, 4);

          return (
            <div className="live-standing-card" key={group.name}>
              <h4>{group.name}</h4>
              <table>
                <thead>
                  <tr>
                    <th>{t.team}</th>
                    <th>Pt</th>
                    <th>DR</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => (
                    <tr key={row.team}>
                      <td>{trTeamLabel(row.team)}</td>
                      <td><strong>{row.points}</strong></td>
                      <td>{row.gd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </section>
  );
}
