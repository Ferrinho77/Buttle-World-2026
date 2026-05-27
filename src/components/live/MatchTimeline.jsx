function minuteToProgress(minute, finished) {
  if (finished) return 100;
  if (!minute || minute === "PRE") return 0;
  if (minute === "HT") return 50;
  if (minute === "90+") return 96;

  const clean = Number(String(minute).replace("'", ""));
  if (Number.isNaN(clean)) return 0;
  return Math.max(2, Math.min(100, Math.round((clean / 90) * 100)));
}

export default function MatchTimeline({ result, minute }) {
  const progress = minuteToProgress(minute, result?.finished);

  return (
    <div className="pro-match-timeline">
      <div className="timeline-labels">
        <span>0'</span>
        <span>45'</span>
        <span>90'</span>
      </div>

      <div className="pro-timeline-track">
        <div className="pro-timeline-progress" style={{ width: `${progress}%` }} />
        <span className="timeline-dot" style={{ left: `${progress}%` }} />
      </div>

      <div className="timeline-current">
        {result ? (result.finished ? "Partita conclusa" : `Minuto live: ${minute || "LIVE"}`) : "In attesa del calcio d’inizio"}
      </div>
    </div>
  );
}
