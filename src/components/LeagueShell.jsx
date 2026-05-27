export default function LeagueShell({
  logo,
  selectedLeague,
  t,
  menuOpen,
  setMenuOpen,
  menuItems,
  activeTab,
  setActiveTab,
  activeMenuItem,
  showQuickActions,
  quickClear,
  quickSave,
  onBack,
  children,
}) {
  return (
    <div className="page league-page">
      {menuOpen && <div className="menu-backdrop" onClick={() => setMenuOpen(false)}></div>}

      <aside className={`side-menu ${menuOpen ? "open" : ""}`}>
        <div className="side-menu-head">
          <img src={logo} alt="logo" />
          <div>
            <strong>{selectedLeague.name}</strong>
            <small>{t.leagueCode}: {selectedLeague.code}</small>
          </div>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Chiudi menu">✕</button>
        </div>

        <div className="side-menu-list">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={activeTab === item.key ? "active" : ""}
              onClick={() => {
                setActiveTab(item.key);
                setMenuOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>
      </aside>

      <div className="card wide-card league-card">
        <div className="league-sticky-header">
          <div className="league-header-main">
            <button onClick={onBack} className="icon-header-btn back-icon" title={t.backToDashboard}>←</button>
            <img src={logo} alt="logo" className="mini-logo" />
            <div className="league-header-title">
              <h1>{selectedLeague.name}</h1>
              <small>{t.leagueCode}: {selectedLeague.code}</small>
            </div>

            {showQuickActions && <div className="quick-actions">
              <button type="button" className="quick-icon danger" onClick={quickClear} title="Cancella">🗑️</button>
              <button type="button" className="quick-icon save" onClick={quickSave} title="Salva">💾</button>
            </div>}
          </div>

          <div className="league-header-sub">
            <button type="button" className="menu-trigger" onClick={() => setMenuOpen(true)}>☰</button>
            <div className="active-section-title"><span>{activeMenuItem.icon}</span>{activeMenuItem.label}</div>
          </div>
        </div>

        <div className="league-content">
          {children}
        </div>
      </div>
    </div>
  );
}
