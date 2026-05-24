import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Trophy,
  Users,
  Plus,
  LogOut,
  Mail,
  ShieldCheck,
  CalendarDays,
  Save,
} from "lucide-react";

import { supabase } from "./supabaseClient";
import "./style.css";

const scoringRules = {
  exactScore: 7,
  correctSign: 2,
  topScorerBonus: 5,
};

function App() {
  const [session, setSession] = useState(null);
  const [screen, setScreen] = useState("login");
  const [profile, setProfile] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [members, setMembers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [loading, setLoading] = useState(false);

  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    username: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);

      if (data.session) {
        setScreen("home");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setScreen(session ? "home" : "login");
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadProfile();
      loadLeagues();
    }
  }, [session]);

 async function loadProfile() {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!data) {
    const username =
      session.user.user_metadata?.username || session.user.email;

    const { data: newProfile } = await supabase
      .from("profiles")
      .upsert({
        id: session.user.id,
        email: session.user.email,
        username: username,
      })
      .select()
      .single();

    setProfile(newProfile);
  } else {
    setProfile(data);
  }
}

    if (!data) {
      const username =
        session.user.user_metadata?.username ||
        session.user.email;

      const { data: newProfile, error: insertError } =
        await supabase
          .from("profiles")
          .insert({
            id: session.user.id,
            email: session.user.email,
            username: username,
          })
          .select()
          .single();

      if (insertError) {
        console.error(insertError);
        return;
      }

      setProfile(newProfile);
    } else {
      setProfile(data);
    }
  }

  async function register() {
    if (
      !authForm.email ||
      !authForm.password ||
      !authForm.username
    ) {
      return alert(
        "Inserisci email, username e password."
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email: authForm.email,
      password: authForm.password,
      options: {
        data: {
          username: authForm.username,
        },
      },
    });

    if (error) {
      return alert(error.message);
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: authForm.email,
        username: authForm.username,
      });
    }

    alert("Account creato. Ora puoi accedere.");
  }

  async function login() {
    const { error } =
      await supabase.auth.signInWithPassword({
        email: authForm.email,
        password: authForm.password,
      });

    if (error) {
      alert(error.message);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function createLeague() {
    if (!leagueName.trim()) return;

    setLoading(true);

    const code = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    const { data, error } = await supabase
      .from("leagues")
      .insert({
        name: leagueName,
        invite_code: code,
        admin_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      setLoading(false);
      return alert(error.message);
    }

    await supabase.from("league_members").insert({
      league_id: data.id,
      user_id: session.user.id,
      email: session.user.email,
      username:
        profile?.username || session.user.email,
      role: "admin",
      status: "active",
    });

    setLeagueName("");
    await loadLeagues();
    setLoading(false);
  }

  async function loadLeagues() {
    const { data } = await supabase
      .from("league_members")
      .select("league_id, role, status, leagues(*)")
      .eq("email", session.user.email);

    setLeagues(
      (data || []).map((x) => ({
        ...x.leagues,
        role: x.role,
        member_status: x.status,
      }))
    );
  }

  async function openLeague(league) {
    setSelectedLeague(league);
    setScreen("league");

    await loadLeagueData(league);
  }

  async function loadLeagueData(league) {
    const { data: memberData } = await supabase
      .from("league_members")
      .select("*")
      .eq("league_id", league.id)
      .order("created_at", {
        ascending: true,
      });

    setMembers(memberData || []);

    const {
      data: matchData,
      error: matchError,
    } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", {
  ascending: true,
});

    if (matchError) {
      console.error(matchError);
      setMatches([]);
    } else {
      setMatches(matchData || []);
    }

    const { data: predData } = await supabase
      .from("predictions")
      .select("*")
      .eq("league_id", league.id)
      .eq("user_id", session.user.id);

    const predMap = {};

    (predData || []).forEach((p) => {
      predMap[p.match_id] = {
        id: p.id,
        home_prediction:
          p.home_prediction ?? "",
        away_prediction:
          p.away_prediction ?? "",
        points: p.points ?? 0,
      };
    });

    setPredictions(predMap);
  }

  async function inviteMember() {
    if (!inviteEmail || !selectedLeague)
      return;

    const { error } = await supabase
      .from("league_members")
      .insert({
        league_id: selectedLeague.id,
        email: inviteEmail,
        role: "player",
        status: "invited",
      });

    if (error) {
      return alert(error.message);
    }

    setInviteEmail("");
    openLeague(selectedLeague);

    alert("Invito registrato.");
  }

  function updatePrediction(
    matchId,
    field,
    value
  ) {
    setPredictions((prev) => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || {}),
        [field]: value,
      },
    }));
  }

  async function savePrediction(match) {
    const current =
      predictions[match.id] || {};

    if (
      current.home_prediction === "" ||
      current.away_prediction === ""
    ) {
      return alert(
        "Inserisci entrambi i gol del pronostico."
      );
    }

    const payload = {
      league_id: selectedLeague.id,
      match_id: match.id,
      user_id: session.user.id,
      home_prediction: Number(
        current.home_prediction
      ),
      away_prediction: Number(
        current.away_prediction
      ),
    };

    let error;

    if (current.id) {
      const result = await supabase
        .from("predictions")
        .update(payload)
        .eq("id", current.id);

      error = result.error;
    } else {
      const result = await supabase
        .from("predictions")
        .insert(payload)
        .select()
        .single();

      error = result.error;
    }

    if (error) {
      return alert(error.message);
    }

    alert("Pronostico salvato.");

    await loadLeagueData(selectedLeague);
  }

  const ranking = useMemo(() => {
    return members
      .map((m) => ({
        ...m,
        total:
          Number(m.result_points || 0) +
          Number(m.top_scorer_bonus || 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [members]);

  if (!session) {
    return (
      <div className="app">
        <div className="card hero">
          <Trophy size={42} />
          <h1>Fanta World Cup</h1>

          <p>
            Crea una lega, invita gli amici
            e gioca al Mondiale.
          </p>
        </div>

        <div className="card">
          <h2>Login / Registrazione</h2>

          <input
            placeholder="Email"
            value={authForm.email}
            onChange={(e) =>
              setAuthForm({
                ...authForm,
                email: e.target.value,
              })
            }
          />

          <input
            placeholder="Username per il gioco"
            value={authForm.username}
            onChange={(e) =>
              setAuthForm({
                ...authForm,
                username: e.target.value,
              })
            }
          />

          <input
            placeholder="Password"
            type="password"
            value={authForm.password}
            onChange={(e) =>
              setAuthForm({
                ...authForm,
                password: e.target.value,
              })
            }
          />

          <button onClick={login}>
            Accedi
          </button>

          <button
            className="secondary"
            onClick={register}
          >
            Crea account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="card header">
        <div>
          <h1>Fanta World Cup</h1>

          <p>
            {profile?.username ||
              session.user.email}
          </p>
        </div>

        <button
          className="iconButton"
          onClick={logout}
        >
          <LogOut size={18} />
        </button>
      </div>

      {screen === "home" && (
        <>
          <div className="card">
            <h2>Crea una lega</h2>

            <input
              placeholder="Nome lega"
              value={leagueName}
              onChange={(e) =>
                setLeagueName(e.target.value)
              }
            />

            <button
              disabled={loading}
              onClick={createLeague}
            >
              <Plus size={18} />

              {loading
                ? "Creazione..."
                : "Crea lega"}
            </button>
          </div>

          <div className="card">
            <h2>Le tue leghe</h2>

            {leagues.length === 0 && (
              <p>Nessuna lega presente.</p>
            )}

            {leagues.map((league) => (
              <div
                className="leagueRow"
                key={league.id}
                onClick={() =>
                  openLeague(league)
                }
              >
                <div>
                  <b>{league.name}</b>

                  <small>
                    Codice:{" "}
                    {league.invite_code}
                  </small>
                </div>

                <span>{league.role}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {screen === "league" &&
        selectedLeague && (
          <>
            <button
              className="secondary"
              onClick={() =>
                setScreen("home")
              }
            >
              ← Torna alle leghe
            </button>

            <div className="card">
              <h2>{selectedLeague.name}</h2>

              <p>
                Codice invito:{" "}
                <b>
                  {
                    selectedLeague.invite_code
                  }
                </b>
              </p>
            </div>

            <div className="card">
              <h2>
                <Users size={18} />
                Classifica
              </h2>

              {ranking.map((m, idx) => (
                <div
                  className="rankingRow"
                  key={m.id}
                >
                  <span>
                    {idx + 1}.{" "}
                    {m.username || m.email}
                  </span>

                  <b>{m.total}</b>
                </div>
              ))}
            </div>

            <div className="card">
              <h2>
                <CalendarDays size={18} />
                Pronostici partite
              </h2>

              {matches.length === 0 && (
                <p>
                  Nessuna partita trovata.
                </p>
              )}

              {matches.map((match) => {
                const pred =
                  predictions[match.id] ||
                  {};

                return (
                  <div
                    className="matchCard"
                    key={match.id}
                  >
                    <div className="matchTop">
                      <span>
                        {match.stage}
                      </span>

                      <small>
                        {match.match_date
                          ? new Date(
                              match.match_date
                            ).toLocaleString(
                              "it-IT"
                            )
                          : ""}
                      </small>
                    </div>

                    <div className="teams">
                      <b>
                        {match.home_team}
                      </b>

                      <span>vs</span>

                      <b>
                        {match.away_team}
                      </b>
                    </div>

                    <div className="predictionGrid">
                      <input
                        inputMode="numeric"
                        placeholder="Casa"
                        value={
                          pred.home_prediction ??
                          ""
                        }
                        onChange={(e) =>
                          updatePrediction(
                            match.id,
                            "home_prediction",
                            e.target.value
                          )
                        }
                      />

                      <input
                        inputMode="numeric"
                        placeholder="Fuori"
                        value={
                          pred.away_prediction ??
                          ""
                        }
                        onChange={(e) =>
                          updatePrediction(
                            match.id,
                            "away_prediction",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <button
                      onClick={() =>
                        savePrediction(match)
                      }
                    >
                      <Save size={16} />
                      Salva pronostico
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
    </div>
  );
}

createRoot(
  document.getElementById("root")
).render(<App />);
