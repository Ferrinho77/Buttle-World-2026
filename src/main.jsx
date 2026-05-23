import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Trophy, Users, Plus, LogOut, Mail, ShieldCheck } from "lucide-react";
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
  const [inviteEmail, setInviteEmail] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [authForm, setAuthForm] = useState({ email: "", password: "", username: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) setScreen("home");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setScreen(session ? "home" : "login");
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadProfile();
      loadLeagues();
    }
  }, [session]);

  async function loadProfile() {
    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    setProfile(data);
  }

  async function register() {
    if (!authForm.username) return alert("Inserisci username.");
    const { data, error } = await supabase.auth.signUp({
      email: authForm.email,
      password: authForm.password,
      options: { data: { username: authForm.username } },
    });

    if (error) return alert(error.message);

    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        email: authForm.email,
        username: authForm.username,
      });
    }

    alert("Account creato. Controlla la mail se Supabase richiede conferma.");
  }

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email: authForm.email,
      password: authForm.password,
    });
    if (error) alert(error.message);
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function createLeague() {
    if (!leagueName.trim()) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from("leagues")
      .insert({ name: leagueName, invite_code: code, admin_id: session.user.id })
      .select()
      .single();

    if (error) return alert(error.message);

    await supabase.from("league_members").insert({
      league_id: data.id,
      user_id: session.user.id,
      email: session.user.email,
      username: profile?.username || session.user.email,
      role: "admin",
      status: "active",
    });

    setLeagueName("");
    loadLeagues();
  }

  async function loadLeagues() {
    const { data } = await supabase
      .from("league_members")
      .select("league_id, role, status, leagues(*)")
      .eq("email", session.user.email);

    setLeagues((data || []).map((x) => ({ ...x.leagues, role: x.role, member_status: x.status })));
  }

  async function openLeague(league) {
    setSelectedLeague(league);
    setScreen("league");
    const { data } = await supabase
      .from("league_members")
      .select("*")
      .eq("league_id", league.id)
      .order("created_at", { ascending: true });

    setMembers(data || []);
  }

  async function inviteMember() {
    if (!inviteEmail || !selectedLeague) return;

    const { error } = await supabase.from("league_members").insert({
      league_id: selectedLeague.id,
      email: inviteEmail,
      role: "player",
      status: "invited",
    });

    if (error) return alert(error.message);

    setInviteEmail("");
    openLeague(selectedLeague);
    alert("Invito registrato. Nella versione completa partirà anche la mail automatica.");
  }

  const ranking = useMemo(() => {
    return members
      .map((m) => ({ ...m, total: Number(m.result_points || 0) + Number(m.top_scorer_bonus || 0) }))
      .sort((a, b) => b.total - a.total);
  }, [members]);

  if (!session) {
    return (
      <div className="app">
        <div className="card hero">
          <Trophy size={42} />
          <h1>Fanta World Cup</h1>
          <p>Crea una lega, invita gli amici e gioca al Mondiale.</p>
        </div>

        <div className="card">
          <h2>Login / Registrazione</h2>
          <input placeholder="Email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
          <input placeholder="Username per il gioco" value={authForm.username} onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })} />
          <input placeholder="Password" type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
          <button onClick={login}>Accedi</button>
          <button className="secondary" onClick={register}>Crea account</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="card header">
        <div>
          <h1>Fanta World Cup</h1>
          <p>{profile?.username || session.user.email}</p>
        </div>
        <button className="iconButton" onClick={logout}><LogOut size={18} /></button>
      </div>

      {screen === "home" && (
        <>
          <div className="card">
            <h2>Crea una lega</h2>
            <input placeholder="Nome lega" value={leagueName} onChange={(e) => setLeagueName(e.target.value)} />
            <button onClick={createLeague}><Plus size={18} /> Crea lega</button>
          </div>

          <div className="card">
            <h2>Le tue leghe</h2>
            {leagues.length === 0 && <p>Nessuna lega presente.</p>}
            {leagues.map((league) => (
              <div className="leagueRow" key={league.id} onClick={() => openLeague(league)}>
                <div>
                  <b>{league.name}</b>
                  <small>Codice: {league.invite_code}</small>
                </div>
                <span>{league.role}</span>
              </div>
            ))}
          </div>

          <div className="card rules">
            <h2><ShieldCheck size={18} /> Regole</h2>
            <p>Risultato esatto: <b>{scoringRules.exactScore}</b> punti</p>
            <p>Segno corretto: <b>{scoringRules.correctSign}</b> punti</p>
            <p>Capocannoniere: <b>{scoringRules.topScorerBonus}</b> punti</p>
          </div>
        </>
      )}

      {screen === "league" && selectedLeague && (
        <>
          <button className="secondary" onClick={() => setScreen("home")}>← Torna alle leghe</button>

          <div className="card">
            <h2>{selectedLeague.name}</h2>
            <p>Codice invito: <b>{selectedLeague.invite_code}</b></p>
          </div>

          {selectedLeague.role === "admin" && (
            <div className="card">
              <h2><Mail size={18} /> Invita partecipante</h2>
              <input placeholder="email@esempio.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              <button onClick={inviteMember}>Invita</button>
            </div>
          )}

          <div className="card">
            <h2><Users size={18} /> Classifica</h2>
            {ranking.map((m, idx) => (
              <div className="rankingRow" key={m.id}>
                <span>{idx + 1}. {m.username || m.email}</span>
                <b>{m.total}</b>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
