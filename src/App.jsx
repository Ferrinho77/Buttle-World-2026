import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import logo from "./assets/Logo.png";
import "./App.css";
import { matches, groups, knockoutRounds, topScorers } from "./data";
import { translations } from "./translations";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetMode, setResetMode] = useState(() => window.location.hash.includes("type=recovery") || window.location.search.includes("type=recovery"));
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [settingsUsername, setSettingsUsername] = useState("");
  const [avatarIcon, setAvatarIcon] = useState(localStorage.getItem("avatarIcon") || "⚽");
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem("avatarUrl") || "");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedPredictionUser, setSelectedPredictionUser] = useState("__all__");
  const [adminMatchFilter, setAdminMatchFilter] = useState("all");
  const [lastLiveSync, setLastLiveSync] = useState(null);
  const [liveSyncStatus, setLiveSyncStatus] = useState("");
  const [nowTick, setNowTick] = useState(new Date());
  const [language, setLanguage] = useState(localStorage.getItem("lang") || "it");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [leagueName, setLeagueName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [usersSubTab, setUsersSubTab] = useState("match");
  const [showDashboardSettings, setShowDashboardSettings] = useState(false);
  const [editingLeagueId, setEditingLeagueId] = useState(null);
  const [editingLeagueName, setEditingLeagueName] = useState("");
  const [leagueSettings, setLeagueSettings] = useState({
    exact_score_points: 3,
    outcome_points: 1,
    top_scorer_points: 10,
    exact_score_mode: "standard",
    prediction_lock_mode: "match",
    qualification_bonus_mode: "round",
    qualification_fixed_points: 3,
    exact_easy_points: 3,
    exact_medium_points: 5,
    exact_hard_points: 8,
    enable_qualification_bonus: false,
    enable_group_positions_bonus: false,
    bonus_round32_points: 1,
    bonus_round16_points: 2,
    bonus_quarter_points: 4,
    bonus_semi_points: 6,
    bonus_final_points: 8,
    bonus_champion_points: 15,
    bonus_group_exact_points: 3,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [predictions, setPredictions] = useState({});
  const [bonusPredictions, setBonusPredictions] = useState({});
  const [allBonusPredictions, setAllBonusPredictions] = useState([]);
  const [allPredictions, setAllPredictions] = useState([]);
  const [realResults, setRealResults] = useState({});
  const [selectedTopScorer, setSelectedTopScorer] = useState("");
  const [finalTopScorer, setFinalTopScorer] = useState("");
  const [topScorerGoalsPlayer, setTopScorerGoalsPlayer] = useState("");
  const [topScorerGoals, setTopScorerGoals] = useState("");
  const [players, setPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [topScorerSearch, setTopScorerSearch] = useState("");
  const [allTopScorerPredictions, setAllTopScorerPredictions] = useState([]);
  const selectableTopScorers = Array.from(new Set([
    ...topScorers,
    ...players.map((p) => p.label),
  ])).sort((a, b) => a.localeCompare(b));
  const filteredTopScorers = selectableTopScorers.filter((player) =>
    player.toLowerCase().includes(topScorerSearch.toLowerCase())
  );
  const t = translations[language] || translations.it;

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);
  const allTeams = groups.flatMap((group) => group.teams);
  const qualificationRounds = [
    { key: "round32", label: "Sedicesimi", count: 32, pointsKey: "bonus_round32_points" },
    { key: "round16", label: "Ottavi", count: 16, pointsKey: "bonus_round16_points" },
    { key: "quarter", label: "Quarti", count: 8, pointsKey: "bonus_quarter_points" },
    { key: "semi", label: "Semifinali", count: 4, pointsKey: "bonus_semi_points" },
    { key: "final", label: "Finale", count: 2, pointsKey: "bonus_final_points" },
  ];

  function trRoundName(name) {
    const map = {
      "Sedicesimi": t.roundOf32,
      "Ottavi": t.roundOf16,
      "Quarti": t.quarterFinals,
      "Semifinali": t.semiFinals,
      "Finale 3° posto": t.thirdPlaceFinal,
      "Finale": t.final,
    };
    return map[name] || name;
  }

  function trGroupName(name) {
    return String(name).replace("Gruppo", t.group);
  }

  function trDate(value) {
    return value === "Da definire" ? t.toBeDefined : value;
  }

  function formatMatchDateTime(match) {
    if (!match?.kickoff) return trDate(match?.date || "Da definire");
    const locale = language === "ro" ? "ro-RO" : language === "en" ? "en-GB" : "it-IT";
    const d = new Date(match.kickoff);
    if (Number.isNaN(d.getTime())) return trDate(match?.date || "Da definire");
    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  }

  function trTeamLabel(value) {
    let text = String(value || "");
    text = text.replace(/Migliore 3ª/g, t.bestThird);
    text = text.replace(/Vincente/g, t.winner);
    text = text.replace(/Perdente/g, t.loser);
    return text;
  }

  function renderResultStatus(matchId) {
    const result = realResults[matchId];
    if (result?.finished) {
      return <p style={{ color: "#18c964", fontWeight: "bold" }}>✅ {t.confirmed}</p>;
    }
    if (result) {
      return <p style={{ color: "#1d7fff", fontWeight: "bold" }}>🔵 {t.live}</p>;
    }
    return <p style={{ color: "#f5a524", fontWeight: "bold" }}>🟡 {t.pending}</p>;
  }

  function renderRealResult(matchId, compact = false) {
    const result = realResults[matchId];
    if (!result) return compact ? null : <p style={{ color: "#9fb1c8" }}>{t.realResult}: -</p>;
    const label = result.finished ? t.finalResult : t.liveResult;
    const status = result.finished ? `✅ ${t.confirmed}` : `🔵 ${t.live}`;
    const content = `${label}: ${result.home_score} - ${result.away_score} ${status}`;
    return compact
      ? <small style={{ display: "block", color: result.finished ? "#18c964" : "#58a6ff", marginTop: 4 }}>{content}</small>
      : <p style={{ color: result.finished ? "#18c964" : "#58a6ff", fontWeight: "bold" }}>{content}</p>;
  }

  function renderUsersRealResultCell(matchId) {
    const result = realResults[matchId];
    if (!result) {
      return <td style={{ textAlign: "center", color: "#9fb1c8", fontWeight: "bold" }}>-</td>;
    }
    if (result.finished) {
      return (
        <td style={{ background: "#f4f6fb", color: "#0f172a", textAlign: "center", fontWeight: "bold" }}>
          <div>⚪ {t.finalResult}</div>
          <div>{result.home_score}-{result.away_score}</div>
        </td>
      );
    }
    return (
      <td style={{ background: "#7f1d1d", color: "white", textAlign: "center", fontWeight: "bold" }}>
        <div>🔴 {t.liveResult}</div>
        <div>{result.home_score}-{result.away_score}</div>
      </td>
    );
  }

  const topScorerPredictionPrefix = "topscorer::";
  const topScorerFinalPrefix = () => `topscorer-final-${selectedLeague?.id || "global"}::`;
  const topScorerGoalsPrefix = () => `topscorer-goals-${selectedLeague?.id || "global"}::`;
  const encodeTopScorer = (player) => encodeURIComponent(player || "");
  const decodeTopScorer = (value) => decodeURIComponent(String(value || ""));
  const isTopScorerPrediction = (matchId) => String(matchId || "").startsWith(topScorerPredictionPrefix);

  function getTopScorerFromMatchId(matchId) {
    return decodeTopScorer(String(matchId || "").replace(topScorerPredictionPrefix, ""));
  }

  function getTopScorerPredictions() {
    const map = {};

    // Sistema corretto: tabella dedicata top_scorer_predictions.
    // Non leggiamo più le vecchie righe in predictions, così non rimane fisso Messi/Wirtz.
    allTopScorerPredictions.forEach((p) => {
      const name = p.username || p.user_email || t.user;
      if (p.player) map[name] = p.player;
    });

    return map;
  }

  function getFinalTopScorer() {
    const prefix = topScorerFinalPrefix();
    const key = Object.keys(realResults).find((id) => String(id).startsWith(prefix));
    return key ? decodeTopScorer(key.replace(prefix, "")) : "";
  }

  function getTopScorerGoalsRanking() {
    const prefix = topScorerGoalsPrefix();
    return Object.entries(realResults)
      .filter(([id]) => String(id).startsWith(prefix))
      .map(([id, row]) => ({
        player: decodeTopScorer(String(id).replace(prefix, "")),
        goals: Number(row?.home_score || 0),
        finished: !!row?.finished,
      }))
      .filter((row) => row.player && row.goals >= 0)
      .sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player));
  }

  function getCurrentTopScorer() {
    return getFinalTopScorer() || getTopScorerGoalsRanking()[0]?.player || "";
  }

  function renderTopScorerRankingBox() {
    const ranking = getTopScorerGoalsRanking().slice(0, 5);
    const finalScorer = getFinalTopScorer();
    const isTournamentFinal = !!finalScorer;

    return (
      <div className="league-box">
        <h3>🏆 {t.topScorerRanking}</h3>
        {finalScorer && <p style={{ color: "#18c964", fontWeight: "bold" }}>✅ {t.finalTopScorer}: {finalScorer}</p>}
        {ranking.length === 0 ? (
          <p>{t.noTopScorerData}</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t.position}</th>
                  <th>{t.player || t.selectPlayer}</th>
                  <th>{t.goals}</th>
                  <th>{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((row, index) => (
                  <tr key={row.player} style={index === 0 ? { background: "rgba(245, 165, 36, 0.16)", fontWeight: "bold" } : {}}>
                    <td>{index + 1}</td>
                    <td>{row.player}</td>
                    <td>{row.goals}</td>
                    <td style={{ color: isTournamentFinal ? "#f4f6fb" : "#ff4d4f", fontWeight: "bold" }}>
                      {isTournamentFinal ? `⚪ ${t.finalResult}` : `🔴 ${t.liveResult}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }



  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setResetMode(true);
        if (session?.user) setUser(session.user);
      }
    });
    checkUser(); loadRealResults(); loadPlayers();
    return () => authListener?.subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Live sync intelligente:
  // - prima sincronizzazione all'apertura della lega
  // - se ci sono partite LIVE: sincronizza ogni 10 minuti
  // - se non ci sono partite LIVE: sincronizza ogni 2 ore
  // Tutti gli utenti leggono da Supabase: la richiesta API viene fatta solo dalla Edge Function.
  useEffect(() => {
    if (!user) return;
    syncLiveResults(true);
  }, [user, selectedLeague?.id]);

  useEffect(() => {
    if (!user) return;
    const hasLiveMatches = Object.values(realResults || {}).some((result) => result && !result.finished);
    const refreshMs = hasLiveMatches ? 10 * 60 * 1000 : 2 * 60 * 60 * 1000;
    const timer = setInterval(() => syncLiveResults(true), refreshMs);
    return () => clearInterval(timer);
  }, [user, selectedLeague?.id, Object.values(realResults || {}).some((result) => result && !result.finished)]);

  async function loadPlayers() {
    setPlayersLoading(true);
    const { data, error } = await supabase
      .from("players")
      .select("id,name,team,flag,position,is_active,sort_order")
      .eq("is_active", true)
      .order("team", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (!error && Array.isArray(data) && data.length) {
      const formatted = data.map((player) => ({
        ...player,
        label: `${player.flag ? `${player.flag} ` : ""}${player.name}${player.team ? ` (${player.team})` : ""}`,
      }));
      setPlayers(formatted);
    } else {
      setPlayers([]);
    }
    setPlayersLoading(false);
  }

  function isPredictionLocked(match) {
    if (leagueSettings.prediction_lock_mode === "tournament") return isTournamentStarted();
    if (!match.kickoff) return false;
    return new Date() >= new Date(match.kickoff);
  }

  function getTournamentStartDate() {
    const validDates = matches
      .map((match) => new Date(match.kickoff))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a - b);
    return validDates[0] || null;
  }

  function getCountdownParts(targetDate) {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const diffMs = target.getTime() - nowTick.getTime();
    if (Number.isNaN(target.getTime()) || diffMs <= 0) {
      return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { expired: false, days, hours, minutes, seconds };
  }

  function renderCountdownBox(parts) {
    if (!parts) return null;
    if (parts.expired) return <strong className="countdown-expired">🔒 Pronostici chiusi</strong>;
    return (
      <div className="countdown-box">
        <span><strong>{parts.days}</strong><small>giorni</small></span>
        <span><strong>{String(parts.hours).padStart(2, "0")}</strong><small>ore</small></span>
        <span><strong>{String(parts.minutes).padStart(2, "0")}</strong><small>min</small></span>
        <span><strong>{String(parts.seconds).padStart(2, "0")}</strong><small>sec</small></span>
      </div>
    );
  }

  function isTournamentStarted() {
    const start = getTournamentStartDate();
    return !!start && new Date() >= start;
  }

  function formatTournamentStart() {
    const start = getTournamentStartDate();
    if (!start) return t.toBeDefined;
    const locale = language === "ro" ? "ro-RO" : language === "en" ? "en-GB" : "it-IT";
    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(start);
  }

  function uniquePredictions() {
    const map = {};
    allPredictions.forEach((p) => {
      const key = `${p.user_id}_${p.match_id}`;
      map[key] = { ...p, username: p.username || p.user_email || "Utente" };
    });
    return Object.values(map);
  }

  function getUsersInLeague() {
    return Array.from(new Set([
      ...uniquePredictions().map((p) => p.username || "Utente"),
      ...allBonusPredictions.map((p) => p.username || p.user_email || "Utente"),
      ...allTopScorerPredictions.map((p) => p.username || p.user_email || "Utente"),
    ]));
  }

  function getPredictionColor(prediction, real) {
    if (!real?.finished || !prediction) return "rgba(255,255,255,0.06)";
    const ph = prediction.home_score, pa = prediction.away_score;
    const rh = real.home_score, ra = real.away_score;
    if (ph === rh && pa === ra) return "#18c964";
    const predWinner = ph > pa ? "H" : ph < pa ? "A" : "D";
    const realWinner = rh > ra ? "H" : rh < ra ? "A" : "D";
    return predWinner === realWinner ? "#f5a524" : "rgba(255,255,255,0.08)";
  }


  function getExactScoreDifficulty(home, away) {
    const h = Number(home);
    const a = Number(away);
    const total = h + a;
    const diff = Math.abs(h - a);
    const easy = new Set(["0-0", "1-0", "0-1", "1-1", "2-0", "0-2", "2-1", "1-2"]);
    const medium = new Set(["2-2", "3-0", "0-3", "3-1", "1-3", "3-2", "2-3"]);
    const key = `${h}-${a}`;
    if (easy.has(key)) return "easy";
    if (medium.has(key)) return "medium";
    if (total >= 5 || h >= 4 || a >= 4 || diff >= 3) return "hard";
    return "medium";
  }

  function getExactScorePoints(home, away) {
    if (leagueSettings.exact_score_mode !== "bands") return Number(leagueSettings.exact_score_points || 0);
    const difficulty = getExactScoreDifficulty(home, away);
    if (difficulty === "easy") return Number(leagueSettings.exact_easy_points || 0);
    if (difficulty === "medium") return Number(leagueSettings.exact_medium_points || 0);
    return Number(leagueSettings.exact_hard_points || 0);
  }

  function calculatePoints(prediction, real) {
    if (!real) return 0;
    const ph = Number(prediction.home_score), pa = Number(prediction.away_score);
    const rh = Number(real.home_score), ra = Number(real.away_score);
    if (ph === rh && pa === ra) return getExactScorePoints(rh, ra);
    const predWinner = ph > pa ? "H" : ph < pa ? "A" : "D";
    const realWinner = rh > ra ? "H" : rh < ra ? "A" : "D";
    return predWinner === realWinner ? Number(leagueSettings.outcome_points || 0) : 0;
  }


  function getFinishedCountForGroup(groupName) {
    return matches.filter((m) => m.group === groupName && realResults[m.id]).length;
  }

  function getQualifiedTeam(seed) {
    const clean = String(seed).trim();
    const match = clean.match(/^([12])([A-L])$/);
    if (!match) return clean;
    const position = Number(match[1]) - 1;
    const groupName = `Gruppo ${match[2]}`;
    if (getFinishedCountForGroup(groupName) < 6) return clean;
    return getGroupStandings(groupName)[position]?.team || clean;
  }

  function getBestThirdTeams() {
    const thirds = [];
    groups.forEach((group) => {
      if (getFinishedCountForGroup(group.name) < 6) return;
      const third = getGroupStandings(group.name)[2];
      if (third) thirds.push(third);
    });
    return thirds.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
  }

  function getKnockoutKickoff(round, index) {
    const schedule = {
      "Sedicesimi": ["2026-06-28", "2026-06-28", "2026-06-29", "2026-06-29", "2026-06-30", "2026-06-30", "2026-07-01", "2026-07-01", "2026-07-02", "2026-07-02", "2026-07-03", "2026-07-03", "2026-07-03", "2026-07-03", "2026-07-03", "2026-07-03"],
      "Ottavi": ["2026-07-04", "2026-07-04", "2026-07-05", "2026-07-05", "2026-07-06", "2026-07-06", "2026-07-07", "2026-07-07"],
      "Quarti": ["2026-07-09", "2026-07-10", "2026-07-11", "2026-07-11"],
      "Semifinali": ["2026-07-14", "2026-07-15"],
      "Finale 3° posto": ["2026-07-18"],
      "Finale": ["2026-07-19"],
    };
    const date = schedule[round]?.[index];
    if (!date) return null;
    const hour = index % 2 === 0 ? "18:00:00" : "21:00:00";
    return `${date}T${hour}`;
  }

  function buildKnockoutMatches() {
    const prefixByRound = {
      Sedicesimi: "S",
      Ottavi: "O",
      Quarti: "Q",
      Semifinali: "SF",
      "Finale 3° posto": "F3",
      Finale: "F",
    };
    let thirdIndex = 0;
    const bestThirds = getBestThirdTeams();
    const codeMap = {};

    const resolveToken = (token) => {
      const clean = String(token).trim();
      if (clean.includes("Migliore 3ª")) {
        const team = bestThirds[thirdIndex]?.team || `Migliore 3ª ${thirdIndex + 1}`;
        thirdIndex += 1;
        return team;
      }

      const winner = clean.match(/^Vincente\s+(.+)$/i);
      if (winner) {
        const source = codeMap[winner[1].trim()];
        if (!source) return clean;
        const result = realResults[source.id];
        if (!result?.finished) return clean;
        if (Number(result.home_score) === Number(result.away_score)) return clean;
        return Number(result.home_score) > Number(result.away_score) ? source.home : source.away;
      }

      const loser = clean.match(/^Perdente\s+(.+)$/i);
      if (loser) {
        const source = codeMap[loser[1].trim()];
        if (!source) return clean;
        const result = realResults[source.id];
        if (!result?.finished) return clean;
        if (Number(result.home_score) === Number(result.away_score)) return clean;
        return Number(result.home_score) > Number(result.away_score) ? source.away : source.home;
      }

      return getQualifiedTeam(clean);
    };

    const list = [];
    knockoutRounds.forEach((round) => {
      const prefix = prefixByRound[round.round] || "K";
      round.matches.forEach((label, index) => {
        const [homeRaw, awayRaw] = label.split(" - ").map((x) => x.trim());
        const code = prefix === "F" ? "F" : prefix === "F3" ? "F3" : `${prefix}${index + 1}`;
        const item = {
          id: `ko-${code.toLowerCase()}`,
          code,
          round: round.round,
          group: round.round,
          date: null,
          kickoff: getKnockoutKickoff(round.round, index),
          homeRaw,
          awayRaw,
          home: resolveToken(homeRaw),
          away: resolveToken(awayRaw),
        };
        codeMap[code] = item;
        list.push(item);
      });
    });
    return list;
  }


  function getWinnerFromMatch(matchId) {
    const ko = buildKnockoutMatches().find((m) => m.id === matchId);
    const result = realResults[matchId];
    if (!ko || !result?.finished || Number(result.home_score) === Number(result.away_score)) return "";
    return Number(result.home_score) > Number(result.away_score) ? ko.home : ko.away;
  }

  function getLoserFromMatch(matchId) {
    const ko = buildKnockoutMatches().find((m) => m.id === matchId);
    const result = realResults[matchId];
    if (!ko || !result?.finished || Number(result.home_score) === Number(result.away_score)) return "";
    return Number(result.home_score) > Number(result.away_score) ? ko.away : ko.home;
  }

  function getActualQualificationTeams(key) {
    const knockoutMatches = buildKnockoutMatches();
    if (key === "round32") {
      const qualified = [];
      groups.forEach((group) => {
        if (getFinishedCountForGroup(group.name) >= 6) {
          qualified.push(...getGroupStandings(group.name).slice(0, 2).map((r) => r.team));
        }
      });
      qualified.push(...getBestThirdTeams().slice(0, 8).map((r) => r.team));
      return Array.from(new Set(qualified));
    }
    const roundMap = { round16: "Sedicesimi", quarter: "Ottavi", semi: "Quarti", final: "Semifinali" };
    const roundName = roundMap[key];
    if (!roundName) return [];
    return knockoutMatches
      .filter((m) => m.round === roundName)
      .map((m) => getWinnerFromMatch(m.id))
      .filter(Boolean);
  }

  function getActualChampion() {
    return getWinnerFromMatch("ko-f") || "";
  }

  function getBonusValue(type, key, source = bonusPredictions) {
    const row = source[`${type}::${key}`];
    if (!row) return type === "qualification" ? [] : type === "group_position" ? [] : "";
    return row;
  }

  function setBonusValue(type, key, value) {
    setBonusPredictions({ ...bonusPredictions, [`${type}::${key}`]: value });
  }

  function getBonusPredictionMapForUser(name) {
    const map = {};
    allBonusPredictions
      .filter((p) => (p.username || p.user_email || "Utente") === name)
      .forEach((p) => {
        const val = p.prediction_value;
        map[`${p.prediction_type}::${p.prediction_key}`] = Array.isArray(val) ? val : val?.teams || val?.positions || val?.team || val || [];
      });
    return map;
  }

  function getBonusPointsForUser(name) {
    const map = getBonusPredictionMapForUser(name);
    let qualificationPoints = 0;
    let groupPoints = 0;

    if (leagueSettings.enable_qualification_bonus) {
      qualificationRounds.forEach((round) => {
        const predicted = map[`qualification::${round.key}`] || [];
        const actual = getActualQualificationTeams(round.key);
        const roundPoints = leagueSettings.qualification_bonus_mode === "fixed" ? Number(leagueSettings.qualification_fixed_points || 0) : Number(leagueSettings[round.pointsKey] || 0);
        qualificationPoints += predicted.filter((team) => actual.includes(team)).length * roundPoints;
      });
      const champion = map[`qualification::champion`] || "";
      if (champion && champion === getActualChampion()) qualificationPoints += Number(leagueSettings.bonus_champion_points || 0);
    }

    if (leagueSettings.enable_group_positions_bonus) {
      groups.forEach((group) => {
        const predicted = map[`group_position::${group.name}`] || [];
        if (getFinishedCountForGroup(group.name) < 6) return;
        const actual = getGroupStandings(group.name).map((r) => r.team);
        predicted.forEach((team, index) => {
          if (!team) return;
          if (team === actual[index]) groupPoints += Number(leagueSettings.bonus_group_exact_points || 0);
        });
      });
    }

    return { qualificationPoints, groupPoints, totalBonus: qualificationPoints + groupPoints };
  }

  function getBonusCellColor(type, key, team, index = null) {
    if (!team) return "rgba(255,255,255,0.06)";
    if (type === "qualification") {
      if (key === "champion") return getActualChampion() && team === getActualChampion() ? "#18c964" : "rgba(255,255,255,0.06)";
      return getActualQualificationTeams(key).includes(team) ? "#18c964" : "rgba(255,255,255,0.06)";
    }
    if (type === "group_position") {
      if (getFinishedCountForGroup(key) < 6) return "rgba(255,255,255,0.06)";
      const actual = getGroupStandings(key).map((r) => r.team);
      return team === actual[index] ? "#18c964" : "rgba(255,255,255,0.06)";
    }
    return "rgba(255,255,255,0.06)";
  }

  function getQualificationSourceTeams(roundKey) {
    if (roundKey === "round32") return allTeams;
    const prevMap = { round16: "round32", quarter: "round16", semi: "quarter", final: "semi", champion: "final" };
    const prevKey = prevMap[roundKey];
    const prevValues = getBonusValue("qualification", prevKey) || [];
    return prevValues.filter(Boolean);
  }

  function getAvailableTeamsForSelection(currentList, currentIndex, sourceTeams = allTeams) {
    const selected = (currentList || []).filter((_, i) => i !== currentIndex).filter(Boolean);
    return sourceTeams.filter((team) => !selected.includes(team));
  }

  function getRanking() {
    const ranking = {};
    const topScorerPredictions = getTopScorerPredictions();
    const finalScorer = getFinalTopScorer();

    uniquePredictions().forEach((p) => {
      if (isTopScorerPrediction(p.match_id)) return;
      const name = p.username || t.user;
      const real = realResults[p.match_id];
      const points = calculatePoints(p, real);
      if (!ranking[name]) ranking[name] = { name, matchPoints: 0, qualificationBonus: 0, groupBonus: 0, topScorerPoints: 0, total: 0, exact: 0, outcome: 0, topScorer: topScorerPredictions[name] || "" };
      ranking[name].matchPoints += points;
      if (real && p) {
        const ph = p.home_score, pa = p.away_score;
        const rh = real.home_score, ra = real.away_score;
        if (ph === rh && pa === ra) ranking[name].exact += 1;
        else {
          const predWinner = ph > pa ? "H" : ph < pa ? "A" : "D";
          const realWinner = rh > ra ? "H" : rh < ra ? "A" : "D";
          if (predWinner === realWinner) ranking[name].outcome += 1;
        }
      }
    });

    Object.entries(topScorerPredictions).forEach(([name, player]) => {
      if (!ranking[name]) ranking[name] = { name, matchPoints: 0, qualificationBonus: 0, groupBonus: 0, topScorerPoints: 0, total: 0, exact: 0, outcome: 0, topScorer: player };
      ranking[name].topScorer = player;
    });

    getUsersInLeague().forEach((name) => {
      if (!ranking[name]) ranking[name] = { name, matchPoints: 0, qualificationBonus: 0, groupBonus: 0, topScorerPoints: 0, total: 0, exact: 0, outcome: 0, topScorer: topScorerPredictions[name] || "" };
    });

    Object.values(ranking).forEach((row) => {
      const bonus = getBonusPointsForUser(row.name);
      row.qualificationBonus = bonus.qualificationPoints;
      row.groupBonus = bonus.groupPoints;
      row.topScorerPoints = finalScorer && row.topScorer === finalScorer ? leagueSettings.top_scorer_points : 0;
      row.total = row.matchPoints + row.qualificationBonus + row.groupBonus + row.topScorerPoints;
    });

    return Object.values(ranking).sort((a, b) => b.total - a.total || b.matchPoints - a.matchPoints || b.exact - a.exact || b.outcome - a.outcome);
  }

  function getGroupStandings(groupName) {
    const group = groups.find((g) => g.name === groupName);
    if (!group) return [];
    const table = {};
    group.teams.forEach((team) => table[team] = { team, points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0 });
    matches.filter((m) => m.group === groupName).forEach((match) => {
      const result = realResults[match.id];
      if (!result) return;
      const home = table[match.home], away = table[match.away];
      if (!home || !away) return;
      home.played++; away.played++;
      home.gf += result.home_score; home.ga += result.away_score;
      away.gf += result.away_score; away.ga += result.home_score;
      if (result.home_score > result.away_score) { home.won++; away.lost++; home.points += 3; }
      else if (result.home_score < result.away_score) { away.won++; home.lost++; away.points += 3; }
      else { home.drawn++; away.drawn++; home.points++; away.points++; }
    });
    Object.values(table).forEach((row) => row.gd = row.gf - row.ga);
    return Object.values(table).sort((a,b) => b.points-a.points || b.gd-a.gd || b.gf-a.gf);
  }

  async function saveProfile(userData, name) {
    await supabase.from("profiles").upsert({ id: userData.id, email: userData.email, username: name || userData.email.split("@")[0], language: language || "it" });
  }

  async function loadProfile(userId) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) { setMessage(error.message); return; }
    if (data?.username) { setUsername(data.username); setSettingsUsername(data.username); }
    if (data?.avatar_icon) { setAvatarIcon(data.avatar_icon); localStorage.setItem("avatarIcon", data.avatar_icon); }
    if (data?.avatar_url) { setAvatarUrl(data.avatar_url); localStorage.setItem("avatarUrl", data.avatar_url); }
    const savedLang = localStorage.getItem("lang");
    const profileLang = data?.language;
    const nextLang = savedLang || profileLang || "it";
    setLanguage(nextLang);
    localStorage.setItem("lang", nextLang);
  }

  async function updateSettings() {
    localStorage.setItem("avatarIcon", avatarIcon);
    localStorage.setItem("avatarUrl", avatarUrl || "");
    const nameToSave = settingsUsername || username || user.email.split("@")[0];
    const { error } = await supabase.from("profiles").upsert({ id: user.id, email: user.email, username: nameToSave, language, avatar_icon: avatarIcon, avatar_url: avatarUrl || null });
    if (error) { setMessage(error.message); return; }
    await supabase.from("predictions").update({ username: nameToSave, user_email: user.email }).eq("user_id", user.id);
    setUsername(nameToSave); setSettingsUsername(nameToSave);
    if (selectedLeague) await loadAllPredictions(selectedLeague.id);
    setMessage(`${t.settingsSaved} ✅`);
  }

  async function uploadAvatarFile(event) {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) { setMessage("Carica solo file PNG o JPG"); return; }
    if (file.size > 2 * 1024 * 1024) { setMessage("Immagine troppo grande: massimo 2 MB"); return; }
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const filePath = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true, contentType: file.type });
    if (error) { setMessage(error.message); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data?.publicUrl || "";
    setAvatarUrl(publicUrl);
    localStorage.setItem("avatarUrl", publicUrl);
    await supabase.from("profiles").upsert({ id: user.id, email: user.email, username: settingsUsername || username || user.email.split("@")[0], language, avatar_icon: avatarIcon, avatar_url: publicUrl });
    setMessage("Avatar aggiornato ✅");
  }

  function clearAvatarImage() {
    setAvatarUrl("");
    localStorage.removeItem("avatarUrl");
  }

  function AvatarBadge({ size = "normal", clickable = false }) {
    const cls = `avatar-badge avatar-${size} ${clickable ? "avatar-clickable" : ""}`;
    const content = avatarUrl ? <img src={avatarUrl} alt="avatar" /> : <span>{avatarIcon}</span>;
    if (clickable) return <button type="button" className={cls} onClick={() => setShowAvatarPicker(true)}>{content}</button>;
    return <span className={cls}>{content}</span>;
  }

  async function updatePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) { setMessage(t.fillPasswordFields); return; }
    if (newPassword.length < 6) { setMessage(t.passwordMinLength); return; }
    if (newPassword !== confirmPassword) { setMessage(t.passwordsDoNotMatch); return; }
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
    if (loginError) { setMessage(t.currentPasswordWrong); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setMessage(error.message); return; }
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setMessage(`${t.passwordUpdated} ✅`);
  }

  async function loadLeagues(userId) {
    const { data: memberships } = await supabase.from("league_members").select("*").eq("user_id", userId);
    const leagueIds = memberships?.map((m) => m.league_id) || [];
    if (leagueIds.length === 0) { setLeagues([]); return; }
    const { data: leaguesData } = await supabase.from("leagues").select("*").in("id", leagueIds);
    setLeagues(leaguesData || []);
  }

  async function loadLeagueSettings(leagueId) {
    const { data } = await supabase.from("leagues").select("*").eq("id", leagueId).single();
    if (data) {
      setLeagueSettings({
        exact_score_points: data.exact_score_points ?? 3,
        outcome_points: data.outcome_points ?? 1,
        top_scorer_points: data.top_scorer_points ?? 10,
        enable_qualification_bonus: data.enable_qualification_bonus ?? false,
        enable_group_positions_bonus: data.enable_group_positions_bonus ?? false,
        exact_score_mode: data.exact_score_mode ?? "standard",
        prediction_lock_mode: data.prediction_lock_mode ?? "match",
        qualification_bonus_mode: data.qualification_bonus_mode ?? "round",
        qualification_fixed_points: data.qualification_fixed_points ?? 3,
        exact_easy_points: data.exact_easy_points ?? 3,
        exact_medium_points: data.exact_medium_points ?? 5,
        exact_hard_points: data.exact_hard_points ?? 8,
        bonus_round32_points: data.bonus_round32_points ?? 1,
        bonus_round16_points: data.bonus_round16_points ?? 2,
        bonus_quarter_points: data.bonus_quarter_points ?? 4,
        bonus_semi_points: data.bonus_semi_points ?? 6,
        bonus_final_points: data.bonus_final_points ?? 8,
        bonus_champion_points: data.bonus_champion_points ?? 15,
        bonus_group_exact_points: data.bonus_group_exact_points ?? 3,
      });
      setIsAdmin(data.owner_id === user.id);
    }
  }

  async function saveLeagueSettings() {
    const { error } = await supabase.from("leagues").update(leagueSettings).eq("id", selectedLeague.id);
    if (error) { setMessage(error.message); return; }
    await loadLeagueSettings(selectedLeague.id);
    setMessage(`${t.leagueSettingsSaved} ✅`);
  }

  async function loadPredictions(userId, leagueId = selectedLeague?.id) {
    let query = supabase.from("predictions").select("*").eq("user_id", userId);
    if (leagueId) query = query.eq("league_id", leagueId);
    const { data, error } = await query;
    if (error) { setMessage(error.message); return; }

    const formatted = {};
    data?.filter((p) => !isTopScorerPrediction(p.match_id)).forEach((p) => {
      formatted[p.match_id] = { home_score: p.home_score, away_score: p.away_score };
    });
    setPredictions(formatted);

    // Il capocannoniere viene caricato da loadTopScorerPrediction(),
    // così non resta più bloccato su vecchie scelte salvate nella tabella predictions.
  }

  async function loadAllPredictions(leagueId) {
    if (!leagueId) return;
    const { data } = await supabase.from("predictions").select("*").eq("league_id", leagueId);
    setAllPredictions(data || []);
  }

  async function loadTopScorerPrediction(userId, leagueId) {
    if (!userId || !leagueId) return;
    const { data, error } = await supabase
      .from("top_scorer_predictions")
      .select("player")
      .eq("user_id", userId)
      .eq("league_id", leagueId)
      .maybeSingle();

    if (!error && data?.player) {
      setSelectedTopScorer(data.player);
      return;
    }

    // Non usiamo più le vecchie righe in predictions: evitano duplicati e valori fissi.
    setSelectedTopScorer("");
  }

  async function loadAllTopScorerPredictions(leagueId) {
    if (!leagueId) return;
    const { data, error } = await supabase
      .from("top_scorer_predictions")
      .select("*")
      .eq("league_id", leagueId);

    if (!error) {
      setAllTopScorerPredictions(data || []);
      return;
    }

    // Se la tabella non esiste ancora, l'app resta funzionante usando il vecchio fallback.
    setAllTopScorerPredictions([]);
  }


  async function loadBonusPredictions(userId, leagueId) {
    if (!userId || !leagueId) return;
    const { data, error } = await supabase
      .from("bonus_predictions")
      .select("*")
      .eq("user_id", userId)
      .eq("league_id", leagueId);
    if (error) { setBonusPredictions({}); return; }
    const formatted = {};
    data?.forEach((row) => {
      const val = row.prediction_value;
      formatted[`${row.prediction_type}::${row.prediction_key}`] = Array.isArray(val) ? val : val?.teams || val?.positions || val?.team || val || [];
    });
    setBonusPredictions(formatted);
  }

  async function loadAllBonusPredictions(leagueId) {
    if (!leagueId) return;
    const { data, error } = await supabase.from("bonus_predictions").select("*").eq("league_id", leagueId);
    if (!error) setAllBonusPredictions(data || []);
  }

  async function syncLiveResults(silent = false) {
    try {
      setLiveSyncStatus(silent ? "" : "Sincronizzazione live in corso...");
      const { data, error } = await supabase.functions.invoke("sync-live-results", {
        body: { league_id: selectedLeague?.id || null }
      });
      if (error) throw error;
      await loadRealResults(true);
      const updated = data?.updated ?? 0;
      const skipped = data?.skipped ?? 0;
      setLiveSyncStatus(`Live sync OK: ${updated} aggiornati${skipped ? `, ${skipped} non mappati` : ""}`);
      if (!silent) setMessage("Risultati live sincronizzati ✅");
    } catch (error) {
      // Fallback: se Edge Function/API non è configurata, non blocchiamo l'app.
      await loadRealResults(true);
      setLiveSyncStatus("Live API non configurata: uso risultati Admin/Supabase");
      if (!silent) setMessage(error?.message || "Live API non configurata");
    }
  }

  async function loadRealResults(silent = false) {
    const { data, error } = await supabase.from("real_results").select("*");
    if (error) {
      if (!silent) setMessage(error.message);
      return;
    }
    const formatted = {};
    data?.forEach((r) => formatted[r.match_id] = r);
    setRealResults(formatted);
    setLastLiveSync(new Date());
  }

  async function saveRealResult(matchId, home, away, finished = true) {
    if (home === "" || away === "") { setMessage(t.enterRealResult); return; }
    const homeScore = Number(home);
    const awayScore = Number(away);
    if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0 || homeScore > 20 || awayScore > 20) {
      setMessage("Inserisci uno score valido da 0 a 20");
      return;
    }
    const { error } = await supabase.from("real_results").upsert({ match_id: matchId, home_score: homeScore, away_score: awayScore, finished });
    if (error) { setMessage(error.message); return; }
    await loadRealResults();
    if (selectedLeague?.id) {
      await loadAllPredictions(selectedLeague.id);
      await loadAllBonusPredictions(selectedLeague.id);
      await loadAllTopScorerPredictions(selectedLeague.id);
    }
    setMessage(finished ? `${t.resultConfirmed} ✅` : `${t.liveResultSaved} 🔵`);
  }

  async function recalculateLeagueData() {
    await loadRealResults();
    if (selectedLeague?.id) {
      await loadAllPredictions(selectedLeague.id);
      await loadAllBonusPredictions(selectedLeague.id);
      await loadAllTopScorerPredictions(selectedLeague.id);
      await loadLeagueSettings(selectedLeague.id);
    }
    setMessage("Classifica ricalcolata ✅");
  }


  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (data.user) { setUser(data.user); await loadProfile(data.user.id); loadLeagues(data.user.id); loadPredictions(data.user.id); }
  }

  async function signUp() {
    if (!username) { setMessage(t.enterUsername); return; }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setMessage(error.message); return; }
    if (data.user) await saveProfile(data.user, username);
    setMessage(`${t.registrationCompleted} ✅`);
  }

  async function signIn() {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMessage(error.message); return; }
    setUser(data.user); await loadProfile(data.user.id); loadLeagues(data.user.id); loadPredictions(data.user.id);
    setMessage(`${t.loginCompleted} ⚽`);
  }

  async function resetPassword() {
    if (!email) { setMessage(t.enterEmailForReset || "Inserisci la tua email per recuperare la password"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#reset-password`,
    });
    if (error) { setMessage(error.message); return; }
    setMessage(t.passwordResetSent || "Email recupero password inviata ✅");
  }

  async function submitResetPassword() {
    if (!resetNewPassword || !resetConfirmPassword) { setMessage(t.fillPasswordFields || "Compila nuova password e conferma"); return; }
    if (resetNewPassword.length < 6) { setMessage(t.passwordMinLength || "La nuova password deve avere almeno 6 caratteri"); return; }
    if (resetNewPassword !== resetConfirmPassword) { setMessage(t.passwordsDoNotMatch || "Le nuove password non coincidono"); return; }
    const { error } = await supabase.auth.updateUser({ password: resetNewPassword });
    if (error) { setMessage(error.message); return; }
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetMode(false);
    window.history.replaceState({}, document.title, window.location.origin);
    await supabase.auth.signOut();
    setUser(null);
    setMessage(t.passwordUpdatedLoginAgain || "Password aggiornata ✅ Ora effettua il login con la nuova password.");
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null); setSelectedLeague(null); setLeagues([]); setUsername(""); setSettingsUsername("");
  }

  async function createLeague() {
    if (!leagueName) { setMessage(t.enterLeagueName); return; }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const { data, error } = await supabase.from("leagues").insert({ name: leagueName, code, owner_id: user.id, exact_score_points: 3, outcome_points: 1, top_scorer_points: 10, prediction_lock_mode: "match", qualification_bonus_mode: "round", qualification_fixed_points: 3, enable_qualification_bonus: false, enable_group_positions_bonus: false }).select().single();
    if (error) { setMessage(error.message); return; }
    await supabase.from("league_members").insert({ league_id: data.id, user_id: user.id, role: "admin" });
    setLeagueName(""); loadLeagues(user.id); setMessage(`${t.leagueCreated} ✅ ${t.code}: ${code}`);
  }

  async function joinLeague() {
    const { data: league, error } = await supabase.from("leagues").select("*").eq("code", joinCode).single();
    if (error || !league) { setMessage(t.codeNotFound); return; }
    await supabase.from("league_members").insert({ league_id: league.id, user_id: user.id, role: "member" });
    setJoinCode(""); loadLeagues(user.id); setMessage(`${t.joinedLeague} ✅`);
  }


  async function renameLeague(leagueId) {
    if (!editingLeagueName.trim()) { setMessage(t.enterNewLeagueName); return; }
    const { error } = await supabase.from("leagues").update({ name: editingLeagueName.trim() }).eq("id", leagueId).eq("owner_id", user.id);
    if (error) { setMessage(error.message); return; }
    setEditingLeagueId(null); setEditingLeagueName("");
    await loadLeagues(user.id);
    setMessage(`${t.leagueNameUpdated} ✅`);
  }

  async function deleteLeague(league) {
    const isOwner = league.owner_id === user.id;
    const ok = window.confirm(isOwner ? `Sei sicuro di voler cancellare definitivamente la lega "${league.name}"?\nQuesta azione non può essere annullata.` : `${t.confirmLeaveLeague} "${league.name}"?`);
    if (!ok) return;

    if (isOwner) {
      await supabase.from("predictions").delete().eq("league_id", league.id);
      await supabase.from("league_members").delete().eq("league_id", league.id);
      const { error } = await supabase.from("leagues").delete().eq("id", league.id).eq("owner_id", user.id);
      if (error) { setMessage(error.message); return; }
      setMessage(`${t.leagueDeleted} ✅`);
    } else {
      const { error } = await supabase.from("league_members").delete().eq("league_id", league.id).eq("user_id", user.id);
      if (error) { setMessage(error.message); return; }
      setMessage(`${t.leftLeague} ✅`);
    }
    await loadLeagues(user.id);
  }

  function openLeague(league) {
    setSelectedLeague(league);
    setActiveTab("home");
    loadAllPredictions(league.id);
    loadAllTopScorerPredictions(league.id);
    loadAllBonusPredictions(league.id);
    loadLeagueSettings(league.id);
    if (user?.id) {
      loadPredictions(user.id, league.id);
      loadTopScorerPrediction(user.id, league.id);
      loadBonusPredictions(user.id, league.id);
    }
  }

  function normalizeScoreInput(value) {
    if (value === "") return "";
    const n = Math.max(0, Math.min(20, Number(value)));
    return Number.isNaN(n) ? "" : n;
  }

  function updatePrediction(matchId, field, value) {
    setPredictions({ ...predictions, [matchId]: { ...predictions[matchId], [field]: normalizeScoreInput(value) } });
  }

  function clearMatchPredictions(matchList) {
    if (!window.confirm("Vuoi cancellare tutti i pronostici di questa pagina?")) return;
    const next = { ...predictions };
    matchList.forEach((match) => { if (!isPredictionLocked(match)) delete next[match.id]; });
    setPredictions(next);
  }

  function clearBonusSection(type) {
    if (isTournamentStarted()) { setMessage("Pronostici bloccati: il torneo è già iniziato 🔒"); return; }
    if (!window.confirm("Vuoi cancellare tutti i pronostici di questa pagina?")) return;
    const next = { ...bonusPredictions };
    Object.keys(next).forEach((key) => { if (key.startsWith(`${type}::`)) delete next[key]; });
    setBonusPredictions(next);
  }

  function clearTopScorerPredictionLocal() {
    if (isTournamentStarted()) { setMessage(t.topScorerPredictionLocked); return; }
    if (!window.confirm("Vuoi cancellare il pronostico capocannoniere?")) return;
    setSelectedTopScorer("");
  }

  async function saveAllPredictions(matchList = matches) {
    const rows = matchList.filter((match) => {
      const p = predictions[match.id];
      return p && p.home_score !== undefined && p.home_score !== "" && p.away_score !== undefined && p.away_score !== "" && !isPredictionLocked(match);
    }).map((match) => {
      const p = predictions[match.id];
      return { user_id: user.id, username: username || user.email.split("@")[0], user_email: user.email, league_id: selectedLeague.id, match_id: match.id, home_score: Number(p.home_score), away_score: Number(p.away_score), points: 0 };
    });
    if (rows.length === 0) { setMessage(t.enterAtLeastOnePrediction); return; }
    const { error } = await supabase.from("predictions").upsert(rows, { onConflict: "user_id,league_id,match_id" });
    if (error) { setMessage(error.message); return; }
    loadPredictions(user.id, selectedLeague.id); loadAllPredictions(selectedLeague.id); setMessage(`${t.predictionsSaved} ✅`);
  }


  async function saveBonusPredictions() {
    if (isTournamentStarted()) { setMessage("Pronostici bonus bloccati: il torneo è già iniziato 🔒"); return; }
    if (!selectedLeague?.id || !user?.id) return;
    const rows = [];
    Object.entries(bonusPredictions).forEach(([compoundKey, value]) => {
      const [prediction_type, prediction_key] = compoundKey.split("::");
      if (!prediction_type || !prediction_key) return;
      const cleanValue = Array.isArray(value) ? value.filter(Boolean) : value;
      if (Array.isArray(cleanValue) && cleanValue.length === 0) return;
      if (!Array.isArray(cleanValue) && !cleanValue) return;
      rows.push({
        user_id: user.id,
        league_id: selectedLeague.id,
        username: username || user.email.split("@")[0],
        user_email: user.email,
        prediction_type,
        prediction_key,
        prediction_value: cleanValue,
        updated_at: new Date().toISOString(),
      });
    });
    if (rows.length === 0) { setMessage("Inserisci almeno un pronostico bonus"); return; }
    const { error } = await supabase
      .from("bonus_predictions")
      .upsert(rows, { onConflict: "user_id,league_id,prediction_type,prediction_key" });
    if (error) { setMessage(`${error.message} - Esegui prima bonus_predictions_fixed.sql in Supabase.`); return; }
    await loadBonusPredictions(user.id, selectedLeague.id);
    await loadAllBonusPredictions(selectedLeague.id);
    setMessage("Pronostici bonus salvati ✅");
  }

  async function saveTopScorerPrediction() {
    if (isTournamentStarted()) { setMessage(t.topScorerPredictionLocked); return; }
    if (!selectedTopScorer) { setMessage(t.selectPlayerMessage); return; }
    if (!selectedLeague?.id || !user?.id) { setMessage(t.selectPlayerMessage); return; }

    const payload = {
      user_id: user.id,
      league_id: selectedLeague.id,
      username: username || user.email.split("@")[0],
      user_email: user.email,
      player: selectedTopScorer,
      updated_at: new Date().toISOString(),
    };

    // Sistema corretto: una sola riga per utente e lega.
    // Questo elimina definitivamente il problema del valore fisso su Messi/Wirtz
    // e l'errore duplicate key della tabella predictions.
    const { error } = await supabase
      .from("top_scorer_predictions")
      .upsert(payload, { onConflict: "user_id,league_id" });

    if (error) {
      setMessage(`${error.message} - Esegui prima il file SQL top_scorer_predictions.sql in Supabase.`);
      return;
    }

    // Pulizia opzionale delle vecchie scelte salvate nel sistema precedente.
    await supabase
      .from("predictions")
      .delete()
      .eq("league_id", selectedLeague.id)
      .eq("user_id", user.id)
      .like("match_id", `${topScorerPredictionPrefix}%`);

    await loadTopScorerPrediction(user.id, selectedLeague.id);
    await loadAllTopScorerPredictions(selectedLeague.id);
    await loadAllPredictions(selectedLeague.id);
    setMessage(`${t.predictionsSaved} ✅`);
  }

  async function saveFinalTopScorer() {
    if (!finalTopScorer) { setMessage(t.selectPlayerMessage); return; }
    const prefix = topScorerFinalPrefix();
    await supabase.from("real_results").delete().like("match_id", `${prefix}%`);
    const { error } = await supabase.from("real_results").insert({
      match_id: `${prefix}${encodeTopScorer(finalTopScorer)}`,
      home_score: 0,
      away_score: 0,
      finished: true,
    });
    if (error) { setMessage(error.message); return; }
    await loadRealResults();
    await loadAllPredictions(selectedLeague.id);
    setMessage(`${t.resultConfirmed}: ${finalTopScorer} ✅`);
  }

  async function saveTopScorerGoals() {
    if (!topScorerGoalsPlayer) { setMessage(t.selectPlayerMessage); return; }
    if (topScorerGoals === "" || Number(topScorerGoals) < 0) { setMessage(t.enterRealResult); return; }
    const prefix = topScorerGoalsPrefix();
    const { error } = await supabase.from("real_results").upsert({
      match_id: `${prefix}${encodeTopScorer(topScorerGoalsPlayer)}`,
      home_score: Number(topScorerGoals),
      away_score: 0,
      finished: false,
    });
    if (error) { setMessage(error.message); return; }
    await loadRealResults();
    setMessage(`${t.liveResultSaved}: ${topScorerGoalsPlayer} (${topScorerGoals}) 🔵`);
  }

  if (resetMode) {
    return (
      <div className="page"><div className="card">
        <img src={logo} alt="logo" className="logo" />
        <h1 className="app-title small-title">{t.resetPasswordTitle || "Reset Password"}</h1>
        <p className="bonus-help">{t.resetPasswordHelp || "Inserisci la nuova password e confermala."}</p>
        <input type="password" placeholder={t.newPassword} value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} />
        <input type="password" placeholder={t.confirmPassword} value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)} />
        <button onClick={submitResetPassword} className="btn blue">{t.updatePassword}</button>
        <button type="button" onClick={() => { setResetMode(false); window.history.replaceState({}, document.title, window.location.origin); }} className="btn">{t.cancel}</button>
        <p>{message}</p>
      </div></div>
    );
  }

  if (!user) {
    return (
      <div className="page"><div className="card">
        <img src={logo} alt="logo" className="logo" />
        <h1 className="app-title login-title">{t.appTitle}</h1>
        <input placeholder={t.username} value={username} onChange={(e) => setUsername(e.target.value)} />
        <input placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder={t.password} value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={signUp} className="btn green">{t.register}</button>
        <button onClick={signIn} className="btn blue">{t.login}</button>
        <button type="button" onClick={resetPassword} className="link-button">{t.forgotPassword || "Hai dimenticato la password?"}</button>
        <p>{message}</p>
      </div></div>
    );
  }

  if (selectedLeague) {
    const ranking = getRanking();
    const users = getUsersInLeague();
    const filteredUsers = selectedPredictionUser === "__all__" ? users : users.filter((name) => name === selectedPredictionUser);
    const knockoutMatches = buildKnockoutMatches();
    const topScorerPredictions = getTopScorerPredictions();
    const confirmedTopScorer = getFinalTopScorer();
    const allDisplayMatches = [...matches, ...knockoutMatches];
    const adminDisplayMatches = [...allDisplayMatches]
      .sort((a, b) => new Date(a.kickoff || "2099-01-01") - new Date(b.kickoff || "2099-01-01"))
      .filter((m) => {
        const result = realResults[m.id];
        if (adminMatchFilter === "pending") return !result;
        if (adminMatchFilter === "live") return result && !result.finished;
        if (adminMatchFilter === "final") return result?.finished;
        return true;
      });
    const liveMatchesHome = allDisplayMatches.filter((m) => realResults[m.id] && !realResults[m.id]?.finished).slice(0, 5);
    const nextMatchesHome = allDisplayMatches
      .filter((m) => !realResults[m.id]?.finished && m.kickoff && new Date(m.kickoff) >= new Date())
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))
      .slice(0, 5);
    const leaderPT = [...ranking].sort((a, b) => (b.qualificationBonus || 0) - (a.qualificationBonus || 0))[0];
    const leaderPG = [...ranking].sort((a, b) => (b.groupBonus || 0) - (a.groupBonus || 0))[0];
    const leaderRE = [...ranking].sort((a, b) => (b.exact || 0) - (a.exact || 0))[0];
    const nextMatch = nextMatchesHome[0];
    const tournamentStartDate = getTournamentStartDate();
    const countdownTargetMatch = leagueSettings.prediction_lock_mode === "tournament" ? null : nextMatch;
    const countdownTargetDate = leagueSettings.prediction_lock_mode === "tournament" ? tournamentStartDate : countdownTargetMatch?.kickoff;
    const countdownParts = getCountdownParts(countdownTargetDate);

    return (
      <div className="page"><div className="card wide-card league-card">
        <div className="league-top-actions">
          <button onClick={() => setSelectedLeague(null)} className="back-dashboard-btn">⬅ {t.backToDashboard}</button>
        </div>
        <img src={logo} alt="logo" className="logo" />
        <h1 className="app-title league-title">{selectedLeague.name}</h1>
        <p>{t.leagueCode}: {selectedLeague.code}</p>

        <div className="tabs">
          <button onClick={() => setActiveTab("home")}>🏠 {t.leagueHome || "Home Lega"}</button>
          <button onClick={() => setActiveTab("partite")}>{t.groupPredictions}</button>
          <button onClick={() => setActiveTab("eliminazione")}>{t.knockoutPredictions}</button>
          <button onClick={() => setActiveTab("passaggio-turno")}>Passaggio Turno</button>
          <button onClick={() => setActiveTab("piazzamento-gironi")}>Piazzamento Gironi</button>
          <button onClick={() => setActiveTab("capocannoniere")}>{t.topScorer}</button>
          <button onClick={() => setActiveTab("utenti")}>{t.usersPredictions}</button>
          <button onClick={() => setActiveTab("classifica")}>{t.participantsRanking}</button>
          <button onClick={() => setActiveTab("gironi")}>{t.groupRanking}</button>
          <button onClick={() => setActiveTab("tabellone")}>{t.bracket}</button>
          <button onClick={() => setActiveTab("settings")}>{t.settings}</button>
          {isAdmin && <button onClick={() => setActiveTab("admin")}>{t.admin}</button>}
          {isAdmin && <button onClick={() => setActiveTab("league-settings")}>{t.leagueSettings}</button>}
          <button onClick={() => setActiveTab("regole")}>{t.rules}</button>
        </div>

        {activeTab === "home" && <>
          <h2>🏠 {t.leagueHome || "Home Lega"}</h2>
          {lastLiveSync && <p className="live-sync-info">🔄 {t.lastUpdate || "Ultimo aggiornamento"}: {lastLiveSync.toLocaleTimeString()} {liveSyncStatus ? `— ${liveSyncStatus}` : ""}</p>}

          {ranking.length > 0 && <div className="home-hero-grid">
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
          </div>}

          <div className="home-hero-grid">
            <div className="home-panel">
              <h3>🔴 LIVE</h3>
              {liveMatchesHome.length === 0 ? <p>{t.noLiveMatches || "Nessuna partita live"}</p> : liveMatchesHome.map((m) => (
                <div key={m.id} className="home-match-card live-card">
                  <strong>{trTeamLabel(m.home)} - {trTeamLabel(m.away)}</strong>
                  {renderRealResult(m.id)}
                </div>
              ))}
            </div>
            <div className="home-panel">
              <h3>⏳ {t.nextMatches || "Prossime partite"}</h3>
              {nextMatchesHome.length === 0 ? <p>{t.toBeDefined}</p> : nextMatchesHome.map((m) => (
                <div key={m.id} className="home-match-card">
                  <strong>{trTeamLabel(m.home)} - {trTeamLabel(m.away)}</strong>
                  <small>📅 {formatMatchDateTime(m)}</small>
                </div>
              ))}
            </div>
          </div>

          {countdownTargetDate && <div className="home-panel countdown-panel">
            <h3>⏳ {leagueSettings.prediction_lock_mode === "tournament" ? "Chiusura pronostici torneo" : "Prossima chiusura pronostico"}</h3>
            {leagueSettings.prediction_lock_mode === "tournament" ? (
              <p>Prima partita del torneo</p>
            ) : (
              <p>{countdownTargetMatch ? `${trTeamLabel(countdownTargetMatch.home)} - ${trTeamLabel(countdownTargetMatch.away)}` : "Prossima partita"}</p>
            )}
            <strong>{leagueSettings.prediction_lock_mode === "tournament" ? tournamentStartDate?.toLocaleString() : countdownTargetMatch ? formatMatchDateTime(countdownTargetMatch) : "-"}</strong>
            {renderCountdownBox(countdownParts)}
          </div>}

          <div className="home-panel quick-rules-panel">
            <h3>📜 {t.rules}</h3>
            <p><strong>RE</strong> = {t.exactScore}; <strong>SC</strong> = {t.correctOutcome}; <strong>PT</strong> = {t.qualificationBonus || "Passaggio Turno"}; <strong>PG</strong> = {t.groupPlacementBonus || "Piazzamento Gironi"}; <strong>CC</strong> = {t.topScorer}.</p>
            <p>{leagueSettings.prediction_lock_mode === "tournament"
              ? "I pronostici match si bloccano all’inizio della prima partita del torneo."
              : "I pronostici match si bloccano al calcio d’inizio della relativa partita."}</p>
          </div>
        </>}

        {activeTab === "regole" && <>
          <h2>{t.rulesTitle}</h2>
          <div className="league-box rules-box">
            <h3>⚽ Pronostici partite</h3>
            <p>{leagueSettings.prediction_lock_mode === "tournament"
              ? "I pronostici di tutte le partite devono essere compilati prima del calcio d’inizio della prima partita del torneo. Dopo l’inizio del torneo non saranno più modificabili."
              : "I pronostici delle singole partite sono modificabili fino al calcio d’inizio della relativa partita."}</p>
            <p>🟢 Verde = risultato esatto. 🟡 Giallo = segno corretto.</p>
            <h3>🎯 Risultato esatto</h3>
            <p>Modalità attuale: <strong>{leagueSettings.exact_score_mode === "bands" ? "A fasce" : "Standard"}</strong>.</p>
            {leagueSettings.exact_score_mode === "bands" ? <p>Facili: {leagueSettings.exact_easy_points} pt — Medi: {leagueSettings.exact_medium_points} pt — Difficili: {leagueSettings.exact_hard_points} pt.</p> : <p>Tutti i risultati esatti valgono <strong>{leagueSettings.exact_score_points} pt</strong>.</p>}
            <p>Segno corretto: <strong>{leagueSettings.outcome_points} pt</strong>.</p>
            <h3>🏆 Passaggio Turno (PT)</h3>
            <p>Gli utenti pronosticano squadre qualificate a sedicesimi, ottavi, quarti, semifinali, finale e vincitrice mondiale. Il pronostico si blocca all’inizio della prima partita del torneo.</p>
            <h3>📊 Piazzamento Gironi (PG)</h3>
            <p>Gli utenti pronosticano la posizione 1ª, 2ª, 3ª e 4ª di ogni girone. Si prende bonus solo per la posizione esatta.</p>
            <h3>⚽ Capocannoniere</h3>
            <p>Il capocannoniere vale <strong>{leagueSettings.top_scorer_points} pt</strong> e si blocca all’inizio del torneo.</p>
            <h3>🧮 Classifica</h3>
            <p>Tot = punti totali, RE = risultati esatti, SC = segni corretti, PT = bonus passaggio turno, PG = bonus piazzamento gironi, CC = bonus capocannoniere.</p>
          </div>
        </>}

        {activeTab === "settings" && <>
          <h2>{t.settings}</h2>
          <div className="league-box">
            <label>{t.username}</label>
            <input value={settingsUsername} onChange={(e) => setSettingsUsername(e.target.value)} />
            <label>{t.language}</label>
            <select value={language} onChange={(e) => { setLanguage(e.target.value); localStorage.setItem("lang", e.target.value); }}>
              <option value="it">Italiano</option><option value="en">English</option><option value="ro">Română</option>
            </select>
            <button className="btn green" onClick={updateSettings}>{t.saveSettings}</button>
          </div>
          <div className="league-box">
            <h3>{t.updatePassword}</h3>
            <input type="password" placeholder={t.currentPassword} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <input type="password" placeholder={t.newPassword} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <input type="password" placeholder={t.confirmPassword} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <button className="btn blue" onClick={updatePassword}>{t.updatePassword}</button>
          </div>
        </>}

        {activeTab === "league-settings" && isAdmin && <>
          <h2>{t.leagueSettings}</h2>
          <div className="league-box live-api-box">
            <h3>🌐 Live API</h3>
            <p>La sincronizzazione automatica usa la Supabase Edge Function <strong>sync-live-results</strong>: ogni 10 minuti quando ci sono partite LIVE, ogni 2 ore quando non ci sono partite LIVE. Se non configuri la chiave API, l'app continua a funzionare con i risultati inseriti dall'Admin.</p>
            <p><strong>Stato:</strong> {liveSyncStatus || "In attesa della prima sincronizzazione"}</p>
          </div>
          <div className="league-box">
            <h3>⚽ Punti partite</h3>
            <div className="bonus-settings-grid">
              <label>{t.correctOutcome}<input min="0" max="20" type="number" value={leagueSettings.outcome_points} onChange={(e) => setLeagueSettings({ ...leagueSettings, outcome_points: Number(e.target.value) })} /></label>
              <label>{t.topScorerPoints}<input min="0" max="50" type="number" value={leagueSettings.top_scorer_points} onChange={(e) => setLeagueSettings({ ...leagueSettings, top_scorer_points: Number(e.target.value) })} /></label>
            </div>
            <label>Modalità compilazione pronostici partite</label>
            <select value={leagueSettings.prediction_lock_mode || "match"} onChange={(e) => setLeagueSettings({ ...leagueSettings, prediction_lock_mode: e.target.value })}>
              <option value="match">Una per una: ogni partita si blocca al proprio calcio d’inizio</option>
              <option value="tournament">Tutte prima: tutte le partite si bloccano all’inizio del torneo</option>
            </select>
            <label>Modalità risultato esatto</label>
            <select value={leagueSettings.exact_score_mode || "standard"} onChange={(e) => setLeagueSettings({ ...leagueSettings, exact_score_mode: e.target.value })}>
              <option value="standard">Standard: tutti i risultati esatti uguali</option>
              <option value="bands">A fasce: facile / medio / difficile</option>
            </select>
            {leagueSettings.exact_score_mode === "bands" ? <div className="bonus-settings-grid">
              <label>Facili<br/><small>0-0, 1-0, 0-1, 1-1, 2-0, 0-2, 2-1, 1-2</small><input min="0" max="50" type="number" value={leagueSettings.exact_easy_points} onChange={(e) => setLeagueSettings({ ...leagueSettings, exact_easy_points: Number(e.target.value) })} /></label>
              <label>Medi<br/><small>2-2, 3-0, 0-3, 3-1, 1-3, 3-2, 2-3</small><input min="0" max="50" type="number" value={leagueSettings.exact_medium_points} onChange={(e) => setLeagueSettings({ ...leagueSettings, exact_medium_points: Number(e.target.value) })} /></label>
              <label>Difficili<br/><small>3-3, 4+ gol, 5+ gol, risultati rari</small><input min="0" max="50" type="number" value={leagueSettings.exact_hard_points} onChange={(e) => setLeagueSettings({ ...leagueSettings, exact_hard_points: Number(e.target.value) })} /></label>
            </div> : <div className="bonus-settings-grid"><label>{t.exactScorePoints}<input min="0" max="50" type="number" value={leagueSettings.exact_score_points} onChange={(e) => setLeagueSettings({ ...leagueSettings, exact_score_points: Number(e.target.value) })} /></label></div>}
          </div>
          <div className="league-box">
            <h3>🏆 Bonus facoltativi</h3>
            <label className="switch-row"><input type="checkbox" checked={!!leagueSettings.enable_qualification_bonus} onChange={(e) => setLeagueSettings({ ...leagueSettings, enable_qualification_bonus: e.target.checked })} /> Attiva passaggio turno</label>
            {leagueSettings.enable_qualification_bonus && <>
              <label>Modalità bonus passaggio turno</label>
              <select value={leagueSettings.qualification_bonus_mode || "round"} onChange={(e) => setLeagueSettings({ ...leagueSettings, qualification_bonus_mode: e.target.value })}>
                <option value="fixed">Punteggio fisso per ogni squadra indovinata</option>
                <option value="round">Punteggio diverso per tappa</option>
              </select>
              {leagueSettings.qualification_bonus_mode === "fixed" ? <div className="bonus-settings-grid">
                <label>Punti fissi per ogni squadra qualificata<input min="0" max="50" type="number" value={leagueSettings.qualification_fixed_points} onChange={(e) => setLeagueSettings({ ...leagueSettings, qualification_fixed_points: Number(e.target.value) })} /></label>
                <label>Vincente Mondiale<input min="0" max="100" type="number" value={leagueSettings.bonus_champion_points} onChange={(e) => setLeagueSettings({ ...leagueSettings, bonus_champion_points: Number(e.target.value) })} /></label>
              </div> : <div className="bonus-settings-grid">
                {qualificationRounds.map((round) => <label key={round.key}>{round.label}<input min="0" max="50" type="number" value={leagueSettings[round.pointsKey]} onChange={(e) => setLeagueSettings({ ...leagueSettings, [round.pointsKey]: Number(e.target.value) })} /></label>)}
                <label>Vincente Mondiale<input min="0" max="100" type="number" value={leagueSettings.bonus_champion_points} onChange={(e) => setLeagueSettings({ ...leagueSettings, bonus_champion_points: Number(e.target.value) })} /></label>
              </div>}
            </>}
            <label className="switch-row"><input type="checkbox" checked={!!leagueSettings.enable_group_positions_bonus} onChange={(e) => setLeagueSettings({ ...leagueSettings, enable_group_positions_bonus: e.target.checked })} /> Attiva piazzamento gironi</label>
            {leagueSettings.enable_group_positions_bonus && <div className="bonus-settings-grid"><label>Posizione esatta nel girone<input min="0" max="50" type="number" value={leagueSettings.bonus_group_exact_points} onChange={(e) => setLeagueSettings({ ...leagueSettings, bonus_group_exact_points: Number(e.target.value) })} /></label></div>}
          </div>
          <button className="btn green" onClick={saveLeagueSettings}>{t.saveLeagueSettings}</button>
        </>}

        {activeTab === "partite" && <>
          <h2>{t.groupStagePredictions}</h2>
          {[...matches].sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff)).map((match) => {
            const locked = isPredictionLocked(match);
            return <div key={match.id} className={`match-box ${locked ? "locked" : ""}`}>
              <p>📅 {formatMatchDateTime(match)}</p><strong>{trTeamLabel(match.home)} - {trTeamLabel(match.away)}</strong>
              {locked && <p>{t.predictionLocked} 🔒</p>}
              {renderRealResult(match.id)}
              {renderResultStatus(match.id)}
              <div className="score-row">
                <input disabled={locked} type="number" min="0" max="20" placeholder={trTeamLabel(match.home)} value={predictions[match.id]?.home_score ?? ""} onChange={(e) => updatePrediction(match.id, "home_score", e.target.value)} />
                <input disabled={locked} type="number" min="0" max="20" placeholder={trTeamLabel(match.away)} value={predictions[match.id]?.away_score ?? ""} onChange={(e) => updatePrediction(match.id, "away_score", e.target.value)} />
              </div>
            </div>;
          })}
          <button onClick={saveAllPredictions} className="btn green">{t.saveAllPredictions}</button>
          <button onClick={() => clearMatchPredictions(matches)} className="btn danger">🗑 Cancella Tutto</button>
        </>}

        {activeTab === "utenti" && <>
          <h2>{t.usersPredictions}</h2>
          <div className="subtabs">
            <button className={usersSubTab === "match" ? "active" : ""} onClick={() => setUsersSubTab("match")}>Pronostici Match</button>
            <button className={usersSubTab === "pt" ? "active" : ""} onClick={() => setUsersSubTab("pt")}>Pronostici PT Utenti</button>
            <button className={usersSubTab === "pg" ? "active" : ""} onClick={() => setUsersSubTab("pg")}>Pronostici PG Utenti</button>
          </div>
          <div className="user-filter-box">
            <label>Visualizza utente</label>
            <select value={selectedPredictionUser} onChange={(e) => setSelectedPredictionUser(e.target.value)}>
              <option value="__all__">Tutti gli utenti</option>
              {users.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          {usersSubTab === "match" && <><div className="grid-scroll"><table className="predictions-grid">
            <thead><tr><th className="sticky-col sticky-head">{t.match}</th><th className="sticky-head">{t.realResult}</th>{filteredUsers.map((name) => <th key={name} className="sticky-head"><div>{name}</div><small>{t.predictedTopScorer}</small></th>)}</tr></thead>
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
          {usersSubTab === "pt" && leagueSettings.enable_qualification_bonus && <div className="league-box"><h3>✅ Pronostici PT Utenti</h3><div className="grid-scroll"><table className="predictions-grid"><thead><tr><th className="sticky-col sticky-head">Utente</th>{qualificationRounds.map((r) => <th className="sticky-head" key={r.key}>{r.label}</th>)}<th className="sticky-head">Vincente</th></tr></thead><tbody>{filteredUsers.map((name) => { const map = getBonusPredictionMapForUser(name); return <tr key={name}><td className="sticky-col">{name}</td>{qualificationRounds.map((r) => <td key={r.key}>{(map[`qualification::${r.key}`] || []).map((team) => <div key={team} className="mini-chip" style={{ background: getBonusCellColor("qualification", r.key, team) }}>{team}</div>)}</td>)}<td><div className="mini-chip" style={{ background: getBonusCellColor("qualification", "champion", map[`qualification::champion`]) }}>{map[`qualification::champion`] || "-"}</div></td></tr>; })}</tbody></table></div></div>}
          {usersSubTab === "pg" && leagueSettings.enable_group_positions_bonus && <div className="league-box"><h3>📊 Pronostici PG Utenti</h3><div className="grid-scroll"><table className="predictions-grid"><thead><tr><th className="sticky-col sticky-head">Utente</th>{groups.map((g) => <th className="sticky-head" key={g.name}>{trGroupName(g.name)}</th>)}</tr></thead><tbody>{filteredUsers.map((name) => { const map = getBonusPredictionMapForUser(name); return <tr key={name}><td className="sticky-col">{name}</td>{groups.map((g) => <td key={g.name}>{(map[`group_position::${g.name}`] || []).map((team, idx) => <div key={`${team}-${idx}`} className="mini-chip" style={{ background: getBonusCellColor("group_position", g.name, team, idx) }}>{idx + 1}. {team}</div>)}</td>)}</tr>; })}</tbody></table></div></div>}
        </>}

        {activeTab === "classifica" && <>
          <h2>{t.participantsRanking}</h2>
          {lastLiveSync && <p className="live-sync-info">🔄 {t.liveSyncActive || "Live sync"}: {lastLiveSync.toLocaleTimeString()} {liveSyncStatus ? `— ${liveSyncStatus}` : ""}</p>}
          {ranking.length > 0 && <div className="podium-ranking">
            {ranking.slice(0, 3).map((row, index) => (
              <div key={row.name} className={`podium-card podium-${index + 1}`}>
                <div className="podium-medal">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</div>
                <div className="podium-avatar"><AvatarBadge size="large" /></div>
                <strong>{row.name}</strong>
                <span>{row.total} pt</span>
              </div>
            ))}
          </div>}
          {ranking.length === 0 ? <p>{t.noPointsYet}</p> : <div className="table-wrapper"><table>
            <thead><tr>
              <th>{t.position}</th>
              <th>{t.participant || t.user}</th>
              <th>Tot</th>
              <th>RE</th>
              <th>SC</th>
              <th>PT</th>
              <th>PG</th>
              <th>CC</th>
            </tr></thead>
            <tbody>{ranking.map((row, index) => (
              <tr key={row.name} style={index === 0 ? { background: "rgba(245, 165, 36, 0.18)", fontWeight: "bold" } : {}}>
                <td>{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}</td>
                <td>{row.name}</td>
                <td><strong>{row.total}</strong></td>
                <td>{row.exact}</td>
                <td>{row.outcome}</td>
                <td>{row.qualificationBonus}</td>
                <td>{row.groupBonus}</td>
                <td>{row.topScorerPoints}</td>
              </tr>
            ))}</tbody>
          </table></div>}
          <div className="league-box"><p><strong>Legenda:</strong> Tot = Punti Totali; RE = Risultati Esatti; SC = Segni Corretti; PT = Bonus Passaggio Turno; PG = Bonus Piazzamento Gironi; CC = Bonus Capocannoniere.</p></div>
        </>}

        {activeTab === "gironi" && <>
          <h2>{t.groupRanking}</h2>
          {lastLiveSync && <p className="live-sync-info">🔄 {t.liveGroupRanking || "Classifica gironi live"}: {lastLiveSync.toLocaleTimeString()} {liveSyncStatus ? `— ${liveSyncStatus}` : ""}</p>}
          {groups.map((group) => <div key={group.name} className="league-box group-table-box">
            <h3>{trGroupName(group.name)}</h3><div className="table-wrapper"><table>
              <thead><tr><th>{t.position}</th><th>{t.team}</th><th>{t.pts}</th><th>{t.played}</th><th>{t.won}</th><th>{t.drawn}</th><th>{t.lost}</th><th>{t.goalsFor}</th><th>{t.goalsAgainst}</th><th>{t.goalDiff}</th><th>{t.avgGoals}</th></tr></thead>
              <tbody>{getGroupStandings(group.name).map((row, index) => <tr key={row.team}><td>{index + 1}</td><td>{row.team}</td><td>{row.points}</td><td>{row.played}</td><td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td><td>{row.gf}</td><td>{row.ga}</td><td>{row.gd}</td><td>{row.played > 0 ? (row.gf / row.played).toFixed(2) : "0.00"}</td></tr>)}</tbody>
            </table></div></div>)}
        </>}

        {activeTab === "tabellone" && <>
          <h2>{t.finalBracket}</h2>
          <div className="tournament-bracket">
            {knockoutRounds.map((round) => (
              <div key={round.round} className="tournament-round">
                <div className="round-title">{trRoundName(round.round)}</div>
                <div className="round-matches">
                  {knockoutMatches.filter((m) => m.round === round.round).map((m) => {
                    const real = realResults[m.id];
                    const isFinal = real?.finished;
                    return (
                      <div key={m.id} className={`bracket-card ${isFinal ? "final-card" : ""}`}>
                        <div className="bracket-card-head">
                          <span>{m.code}</span>
                          <small>📅 {formatMatchDateTime(m)}</small>
                        </div>
                        <div className="team-line">
                          <span>{trTeamLabel(m.home)}</span>
                          <strong>{real?.home_score ?? "-"}</strong>
                        </div>
                        <div className="team-line">
                          <span>{trTeamLabel(m.away)}</span>
                          <strong>{real?.away_score ?? "-"}</strong>
                        </div>
                        <div className="bracket-status">{renderRealResult(m.id, true)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>}

        {activeTab === "eliminazione" && <>
          <h2>{t.knockoutStagePredictions}</h2>
          <div className="league-box"><p>{t.knockoutInfo}</p></div>
          <div className="tournament-bracket predictions-bracket">
            {knockoutRounds.map((round) => (
              <div key={round.round} className="tournament-round">
                <div className="round-title">{trRoundName(round.round)}</div>
                <div className="round-matches">
                  {knockoutMatches.filter((match) => match.round === round.round).map((match) => {
                    const locked = isPredictionLocked(match);
                    return (
                      <div key={match.id} className={`bracket-card prediction-card ${locked ? "locked" : ""}`}>
                        <div className="bracket-card-head">
                          <span>{match.code}</span>
                          <small>📅 {formatMatchDateTime(match)}</small>
                        </div>
                        <div className="prediction-team-row">
                          <span>{trTeamLabel(match.home)}</span>
                          <input disabled={locked} type="number" min="0" max="20" value={predictions[match.id]?.home_score ?? ""} onChange={(e) => updatePrediction(match.id, "home_score", e.target.value)} />
                        </div>
                        <div className="prediction-team-row">
                          <span>{trTeamLabel(match.away)}</span>
                          <input disabled={locked} type="number" min="0" max="20" value={predictions[match.id]?.away_score ?? ""} onChange={(e) => updatePrediction(match.id, "away_score", e.target.value)} />
                        </div>
                        <div className="bracket-status">
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
          <button onClick={() => saveAllPredictions(knockoutMatches)} className="btn green">{t.saveKnockoutPredictions}</button>
          <button onClick={() => clearMatchPredictions(knockoutMatches)} className="btn danger">🗑 Cancella Tutto</button>
        </>}


        {activeTab === "passaggio-turno" && <>
          <h2>Passaggio Turno</h2>
          <div className="league-box">
            <p style={{ color: isTournamentStarted() ? "#f5a524" : "#9fb1c8" }}>
              {isTournamentStarted() ? "🔒 Pronostici bloccati: il torneo è già iniziato" : `Compilabile fino al calcio d’inizio della prima partita: ${formatTournamentStart()}`}
            </p>
          </div>
          {!leagueSettings.enable_qualification_bonus && <div className="league-box"><p>Bonus non attivo in questa lega. L’amministratore può attivarlo da Impostazioni Lega.</p></div>}
          {leagueSettings.enable_qualification_bonus && qualificationRounds.map((round) => {
            const values = getBonusValue("qualification", round.key);
            return <div key={round.key} className="league-box bonus-section">
              <h3>{round.label} <small>({round.count} squadre - {(leagueSettings.qualification_bonus_mode === "fixed" ? leagueSettings.qualification_fixed_points : leagueSettings[round.pointsKey])} pt ciascuna)</small></h3>
              <div className="bonus-select-grid">
                {Array.from({ length: round.count }).map((_, index) => {
                  const sourceTeams = getQualificationSourceTeams(round.key);
                  return <select key={index} disabled={isTournamentStarted() || (round.key !== "round32" && sourceTeams.length === 0)} value={values[index] || ""} onChange={(e) => {
                    const next = [...values]; next[index] = e.target.value; setBonusValue("qualification", round.key, next);
                  }}>
                    <option value="">Squadra {index + 1}</option>
                    {getAvailableTeamsForSelection(values, index, sourceTeams).map((team) => <option key={team} value={team}>{team}</option>)}
                  </select>;
                })}
              </div>
            </div>;
          })}
          {leagueSettings.enable_qualification_bonus && <div className="league-box bonus-section">
            <h3>🏆 Vincente Mondiale <small>({leagueSettings.bonus_champion_points} pt)</small></h3>
            <select disabled={isTournamentStarted()} value={getBonusValue("qualification", "champion") || ""} onChange={(e) => setBonusValue("qualification", "champion", e.target.value)}>
              <option value="">Seleziona vincente</option>{getAvailableTeamsForSelection([], -1, getQualificationSourceTeams("champion")).map((team) => <option key={team} value={team}>{team}</option>)}
            </select>
          </div>}
          <button disabled={isTournamentStarted()} className="btn green" onClick={saveBonusPredictions}>Salva Passaggio Turno</button>
          <button disabled={isTournamentStarted()} className="btn danger" onClick={() => clearBonusSection("qualification")}>🗑 Cancella Tutto</button>
        </>}

        {activeTab === "piazzamento-gironi" && <>
          <h2>Piazzamento Gironi</h2>
          <div className="league-box">
            <p style={{ color: isTournamentStarted() ? "#f5a524" : "#9fb1c8" }}>
              {isTournamentStarted() ? "🔒 Pronostici bloccati: il torneo è già iniziato" : `Compilabile fino al calcio d’inizio della prima partita: ${formatTournamentStart()}`}
            </p>
          </div>
          {!leagueSettings.enable_group_positions_bonus && <div className="league-box"><p>Bonus non attivo in questa lega. L’amministratore può attivarlo da Impostazioni Lega.</p></div>}
          {leagueSettings.enable_group_positions_bonus && groups.map((group) => {
            const values = getBonusValue("group_position", group.name);
            return <div key={group.name} className="league-box bonus-section">
              <h3>{trGroupName(group.name)}</h3>
              <div className="bonus-select-grid compact">
                {[0, 1, 2, 3].map((index) => <label key={index}>{index + 1}° posizione
                  <select disabled={isTournamentStarted()} value={values[index] || ""} onChange={(e) => { const next = [...values]; next[index] = e.target.value; setBonusValue("group_position", group.name, next); }}>
                    <option value="">Seleziona squadra</option>{group.teams.filter((team) => !values.filter((_, i) => i !== index).includes(team)).map((team) => <option key={team} value={team}>{team}</option>)}
                  </select>
                </label>)}
              </div>
            </div>;
          })}
          <button disabled={isTournamentStarted()} className="btn green" onClick={saveBonusPredictions}>Salva Piazzamento Gironi</button>
          <button disabled={isTournamentStarted()} className="btn danger" onClick={() => clearBonusSection("group_position")}>🗑 Cancella Tutto</button>
        </>}

        {activeTab === "capocannoniere" && <>
          <h2>{t.topScorer}</h2>
          <div className="league-box">
            <p style={{ color: isTournamentStarted() ? "#f5a524" : "#9fb1c8" }}>
              {isTournamentStarted()
                ? `🔒 ${t.topScorerPredictionLocked}`
                : `${t.topScorerPredictionCloses}: ${formatTournamentStart()}`}
            </p>
          </div>
          <input
            disabled={isTournamentStarted()}
            placeholder={t.searchPlayer || "Cerca giocatore"}
            value={topScorerSearch}
            onChange={(e) => setTopScorerSearch(e.target.value)}
          />
          <select disabled={isTournamentStarted()} value={selectedTopScorer} onChange={(e) => setSelectedTopScorer(e.target.value)}>
            <option value="">{t.selectPlayer}</option>{filteredTopScorers.map((player) => <option key={player} value={player}>{player}</option>)}
          </select>
          <small style={{ display: "block", color: "#9fb1c8", marginBottom: 10 }}>
            {playersLoading ? t.loadingPlayers : `${filteredTopScorers.length}/${selectableTopScorers.length} ${t.playersAvailable || "giocatori disponibili"}`}
          </small>
          <button disabled={isTournamentStarted()} className="btn green" onClick={saveTopScorerPrediction}>{t.saveTopScorer}</button>
          {renderTopScorerRankingBox()}
        </>}

        {activeTab === "admin" && isAdmin && <>
          <h2>🛠️ Admin Panel</h2>
          <div className="admin-dashboard-grid">
            <div className="admin-stat-card"><span>🔴 LIVE</span><strong>{allDisplayMatches.filter((m) => realResults[m.id] && !realResults[m.id]?.finished).length}</strong></div>
            <div className="admin-stat-card"><span>✅ FINAL</span><strong>{allDisplayMatches.filter((m) => realResults[m.id]?.finished).length}</strong></div>
            <div className="admin-stat-card"><span>🟡 DA INSERIRE</span><strong>{allDisplayMatches.filter((m) => !realResults[m.id]).length}</strong></div>
            <div className="admin-stat-card"><span>🏆 UTENTI</span><strong>{users.length}</strong></div>
          </div>

          <div className="admin-toolbar league-box">
            <div>
              <label>Filtro partite</label>
              <select value={adminMatchFilter} onChange={(e) => setAdminMatchFilter(e.target.value)}>
                <option value="all">Tutte</option>
                <option value="pending">Da inserire</option>
                <option value="live">Live</option>
                <option value="final">Finali</option>
              </select>
            </div>
            <button className="btn blue" onClick={() => syncLiveResults(false)}>🌐 Sincronizza risultati live ora</button>
          <button className="btn blue" onClick={recalculateLeagueData}>🔄 Ricalcola classifica</button>
          </div>

          <div className="admin-section-title">
            <h3>{t.insertRealResults}</h3>
            <p className="bonus-help">I risultati LIVE aggiornano subito classifica partecipanti, classifica gironi e tabellone. I risultati FINAL rendono i punti definitivi.</p>
          </div>

          <div className="admin-match-grid">
            {adminDisplayMatches.map((match) => {
              const result = realResults[match.id];
              const statusClass = result?.finished ? "admin-final" : result ? "admin-live" : "admin-pending";
              const statusLabel = result?.finished ? "✅ FINAL" : result ? "🔴 LIVE" : "🟡 PENDING";
              return (
                <div key={match.id} className={`match-box admin-match-card ${statusClass}`}>
                  <div className="admin-match-head">
                    <span>{statusLabel}</span>
                    <small>📅 {formatMatchDateTime(match)}</small>
                  </div>
                  <strong>{trTeamLabel(match.home)} - {trTeamLabel(match.away)}</strong>
                  {renderRealResult(match.id)}
                  <div className="score-row">
                    <input id={`rh-${match.id}`} type="number" min="0" max="20" placeholder={t.home} defaultValue={result?.home_score ?? ""} />
                    <input id={`ra-${match.id}`} type="number" min="0" max="20" placeholder={t.away} defaultValue={result?.away_score ?? ""} />
                  </div>
                  <div className="admin-actions-row">
                    <button className="btn blue" onClick={() => saveRealResult(match.id, document.getElementById(`rh-${match.id}`).value, document.getElementById(`ra-${match.id}`).value, false)}>{t.saveLiveResult}</button>
                    <button className="btn green" onClick={() => saveRealResult(match.id, document.getElementById(`rh-${match.id}`).value, document.getElementById(`ra-${match.id}`).value, true)}>{t.confirmFinalResult}</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="admin-two-columns">
            <div className="league-box">
              <h3>🔴 {t.topScorerRanking}</h3>
              <p className="bonus-help">Aggiorna i gol provvisori dei capocannonieri durante il torneo.</p>
              <select value={topScorerGoalsPlayer} onChange={(e) => setTopScorerGoalsPlayer(e.target.value)}>
                <option value="">{t.selectPlayer}</option>{selectableTopScorers.map((player) => <option key={player} value={player}>{player}</option>)}
              </select>
              <input type="number" min="0" max="30" placeholder={t.goals} value={topScorerGoals} onChange={(e) => setTopScorerGoals(e.target.value)} />
              <button className="btn blue" onClick={saveTopScorerGoals}>{t.saveTopScorerGoals}</button>
            </div>
            <div className="league-box">
              <h3>{t.finalTopScorer}</h3>
              <p>{t.confirmed}: {confirmedTopScorer || "-"}</p>
              <select value={finalTopScorer} onChange={(e) => setFinalTopScorer(e.target.value)}>
                <option value="">{t.selectPlayer}</option>{selectableTopScorers.map((player) => <option key={player} value={player}>{player}</option>)}
              </select>
              <button className="btn green" onClick={saveFinalTopScorer}>{t.confirmFinalResult}</button>
            </div>
          </div>
        </>}

        <p>{message}</p>
      </div></div>
    );
  }

  return (
    <div className="page"><div className="card">
      <img src={logo} alt="logo" className="logo" />
      <h1 className="app-title dashboard-title">{t.appTitle}</h1><p className="avatar-user"><AvatarBadge size="large" clickable /> <span>{t.user}: {username}</span></p>
      <button onClick={() => setShowDashboardSettings(!showDashboardSettings)} className="btn blue">{t.settings}</button>
      {showDashboardSettings && <>
        <div className="league-box">
          <h3>{t.settings}</h3>
          <label>{t.username}</label>
          <input value={settingsUsername} onChange={(e) => setSettingsUsername(e.target.value)} />
          <label>{t.language}</label>
          <select value={language} onChange={(e) => { setLanguage(e.target.value); localStorage.setItem("lang", e.target.value); }}>
            <option value="it">Italiano</option><option value="en">English</option><option value="ro">Română</option>
          </select>
          <button className="btn green" onClick={updateSettings}>{t.saveSettings}</button>
        </div>
        <div className="league-box">
          <h3>{t.updatePassword}</h3>
          <input type="password" placeholder={t.currentPassword} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <input type="password" placeholder={t.newPassword} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <input type="password" placeholder={t.confirmPassword} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <button className="btn blue" onClick={updatePassword}>{t.updatePassword}</button>
        </div>
      </>}
      {showAvatarPicker && <div className="modal-backdrop">
        <div className="avatar-modal">
          <h3>Personalizza icona profilo</h3>
          <div className="avatar-preview"><AvatarBadge size="xl" /></div>
          <p className="bonus-help">Scegli un avatar oppure carica una foto PNG/JPG.</p>
          <div className="avatar-grid pretty">
            {["🦁","🐺","🦅","🐉","👑","🏆","⚽","🔥","⚡","🎯","🧤","🛡️"].map((icon) => <button type="button" key={icon} className={`avatar-option ${!avatarUrl && avatarIcon === icon ? "active" : ""}`} onClick={() => { setAvatarIcon(icon); clearAvatarImage(); }}>{icon}</button>)}
          </div>
          <label className="upload-avatar-label">📷 Carica foto PNG/JPG
            <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={uploadAvatarFile} />
          </label>
          {avatarUrl && <button type="button" className="btn danger" onClick={clearAvatarImage}>Rimuovi foto</button>}
          <div className="modal-actions">
            <button type="button" className="btn blue" onClick={() => setShowAvatarPicker(false)}>Chiudi</button>
            <button type="button" className="btn green" onClick={async () => { await updateSettings(); setShowAvatarPicker(false); }}>Salva avatar</button>
          </div>
        </div>
      </div>}
      <div className="dashboard-action-box">
        <h2>{t.createLeague}</h2>
        <input placeholder={t.leagueName} value={leagueName} onChange={(e) => setLeagueName(e.target.value)} />
        <button onClick={createLeague} className="btn green">{t.createLeague}</button>
      </div>
      <div className="dashboard-action-box">
        <h2>{t.joinLeague}</h2>
        <input placeholder={t.inviteCode} value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
        <button onClick={joinLeague} className="btn blue">{t.joinLeague}</button>
      </div>
      <h2>{t.myLeagues}</h2>
      {leagues.map((league) => {
        const isOwner = league.owner_id === user.id;
        return <div key={league.id} className="league-box">
          {editingLeagueId === league.id ? <>
            <input value={editingLeagueName} onChange={(e) => setEditingLeagueName(e.target.value)} />
            <button className="btn green" onClick={() => renameLeague(league.id)}>{t.saveLeagueName}</button>
            <button className="btn" onClick={() => { setEditingLeagueId(null); setEditingLeagueName(""); }}>{t.cancel}</button>
          </> : <>
            <div onClick={() => openLeague(league)} style={{ cursor: "pointer" }}><strong>{league.name}</strong><p>{t.code}: {league.code}</p></div>
            {isOwner && <button className="btn blue" onClick={() => { setEditingLeagueId(league.id); setEditingLeagueName(league.name); }}>{t.changeName}</button>}
            <button className="btn" onClick={() => deleteLeague(league)}>{isOwner ? t.deleteLeague : t.leaveLeague}</button>
          </>}
        </div>;
      })}
      <button onClick={logout} className="btn">{t.logout}</button>
      <p>{message}</p>
    </div></div>
  );
}

export default App;
