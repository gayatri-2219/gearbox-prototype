const { useMemo, useState } = React;

const FILTERS = [
  {
    id: 1,
    key: "age",
    label: "Patient age (years)",
    type: "number",
    group: "Demographics",
    common: true,
  },
  {
    id: 2,
    key: "diagnosis",
    label: "Diagnosis",
    type: "select",
    group: "Disease",
    common: true,
    options: ["AML", "ALL", "ALAL", "MDS"],
  },
  {
    id: 3,
    key: "everRelapse",
    label: "History of relapse",
    type: "radio",
    group: "Disease",
    common: true,
    options: ["YES", "NO", "NOT_SURE"],
  },
  {
    id: 4,
    key: "currentRelapse",
    label: "Currently in relapse",
    type: "radio",
    group: "Disease",
    options: ["YES", "NO", "NOT_SURE"],
    showIf: [{ id: 3, equals: "YES" }],
  },
  {
    id: 5,
    key: "ecog",
    label: "ECOG / Lansky status",
    type: "select",
    group: "Performance",
    common: true,
    options: ["0", "1", "2", "3"],
  },
  {
    id: 6,
    key: "biomarker",
    label: "Molecular biomarker present",
    type: "radio",
    group: "Biomarkers",
    common: true,
    options: ["YES", "NO", "UNKNOWN"],
  },
  {
    id: 7,
    key: "bmRecent",
    label: "Recent marrow draw available",
    type: "radio",
    group: "Disease",
    options: ["YES", "NO", "NOT_SURE"],
  },
  {
    id: 8,
    key: "bmBlast",
    label: "Recent marrow blast %",
    type: "number",
    group: "Disease",
    showIf: [{ id: 7, equals: "YES" }],
  },
  {
    id: 9,
    key: "priorTransplant",
    label: "Prior stem cell transplant",
    type: "radio",
    group: "History",
    options: ["YES", "NO", "NOT_SURE"],
  },
];

const FILTER_BY_ID = Object.fromEntries(FILTERS.map((f) => [f.id, f]));

const TRIALS = [
  {
    id: "T-AML-101",
    title: "Pediatric AML Relapse Trial",
    nct: "NCT0110101",
    phase: "Phase 3",
    status: "Recruiting",
    sponsor: "University of Chicago Medicine",
    condition: "Relapsed Pediatric AML",
    location: "Chicago, IL + Remote Screening",
    arms: "2 treatment arms",
    summary:
      "Evaluates response and safety of targeted salvage therapy for pediatric AML with prior relapse.",
    keyCriteria: ["Age 1-25 years", "Relapse history required", "Marrow review within 14 days"],
    nextStep: "Schedule marrow review and consent discussion.",
    checks: [
      { filterId: 2, label: "Diagnosis is AML/ALAL", test: (v) => v === "AML" || v === "ALAL", w: 3 },
      { filterId: 1, label: "Age <= 25", test: (v) => Number(v) <= 25, w: 2 },
      { filterId: 3, label: "Relapse history = YES", test: (v) => v === "YES", w: 2 },
      { filterId: 7, label: "Marrow draw available", test: (v) => v === "YES", w: 1 },
    ],
  },
  {
    id: "T-ALL-208",
    title: "Refractory ALL Precision Study",
    nct: "NCT0220208",
    phase: "Phase 2",
    status: "Recruiting",
    sponsor: "NCI Cooperative Group",
    condition: "Refractory ALL / ALAL",
    location: "Bethesda, MD + Partner Sites",
    arms: "Biomarker-stratified cohorts",
    summary:
      "Precision protocol for relapsed or refractory ALL using molecularly guided assignment and response tracking.",
    keyCriteria: ["ALL or ALAL diagnosis", "ECOG <= 2", "Actionable biomarker preferred"],
    nextStep: "Upload latest molecular panel and ECOG assessment.",
    checks: [
      { filterId: 2, label: "Diagnosis is ALL/ALAL", test: (v) => v === "ALL" || v === "ALAL", w: 3 },
      { filterId: 5, label: "ECOG <= 2", test: (v) => Number(v) <= 2, w: 2 },
      { filterId: 6, label: "Biomarker present", test: (v) => v === "YES", w: 2 },
    ],
  },
  {
    id: "T-MDS-330",
    title: "MDS / Early AML Bridging Trial",
    nct: "NCT0330330",
    phase: "Phase 2/3",
    status: "Active, not recruiting",
    sponsor: "Data for the Common Good Network",
    condition: "High-risk MDS / Early AML",
    location: "Multi-center (US Midwest)",
    arms: "Single protocol, adaptive dosing",
    summary:
      "Bridge study for MDS to AML progression with adaptive supportive care and progression monitoring endpoints.",
    keyCriteria: ["MDS or AML diagnosis", "ECOG <= 2", "No active relapse signal"],
    nextStep: "Track progression and open if site slot becomes available.",
    checks: [
      { filterId: 2, label: "Diagnosis is MDS/AML", test: (v) => v === "MDS" || v === "AML", w: 3 },
      { filterId: 5, label: "ECOG <= 2", test: (v) => Number(v) <= 2, w: 2 },
      { filterId: 4, label: "Current relapse NO/NOT_SURE", test: (v) => v === "NO" || v === "NOT_SURE", w: 1 },
    ],
  },
  {
    id: "T-REL-550",
    title: "Relapsed Leukemia Adaptive Protocol",
    nct: "NCT0550550",
    phase: "Phase 1/2",
    status: "Recruiting",
    sponsor: "National Cancer Institute",
    condition: "Relapsed Acute Leukemia",
    location: "National referral centers",
    arms: "Dose-escalation + expansion",
    summary:
      "Adaptive protocol testing novel combinations for relapsed acute leukemia with weekly safety and response review.",
    keyCriteria: ["Relapse history yes", "Biomarker positive", "ECOG <= 2"],
    nextStep: "Confirm biomarker report and submit referral packet.",
    checks: [
      { filterId: 3, label: "Relapse history YES", test: (v) => v === "YES", w: 3 },
      { filterId: 6, label: "Biomarker present", test: (v) => v === "YES", w: 2 },
      { filterId: 5, label: "ECOG <= 2", test: (v) => Number(v) <= 2, w: 1 },
    ],
  },
];

const PATIENT_POOL = [
  {
    id: "P-1",
    name: "Patient 1",
    age: 12,
    gender: "Female",
    race: "Asian",
    values: { 1: "12", 2: "AML", 3: "YES", 5: "1", 6: "NO", 7: "YES", 8: "24" },
  },
  {
    id: "P-2",
    name: "Patient 2",
    age: 17,
    gender: "Male",
    race: "White",
    values: { 1: "17", 2: "ALL", 3: "YES", 5: "2", 6: "YES", 7: "NO" },
  },
  {
    id: "P-3",
    name: "Patient 3",
    age: 9,
    gender: "Female",
    race: "Black",
    values: { 1: "9", 2: "ALAL", 3: "YES", 5: "0", 6: "YES", 7: "YES", 8: "18" },
  },
  {
    id: "P-4",
    name: "Patient 4",
    age: 28,
    gender: "Male",
    race: "Hispanic",
    values: { 1: "28", 2: "MDS", 3: "NO", 5: "1", 6: "UNKNOWN", 7: "NOT_SURE" },
  },
  {
    id: "P-5",
    name: "Patient 5",
    age: 14,
    gender: "Female",
    race: "White",
    values: { 1: "14", 2: "ALL", 3: "YES", 5: "1", 6: "YES", 7: "YES", 8: "31" },
  },
  {
    id: "P-6",
    name: "Patient 6",
    age: 19,
    gender: "Male",
    race: "Asian",
    values: { 1: "19", 2: "AML", 3: "YES", 5: "2", 6: "NO", 7: "YES", 8: "12" },
  },
  {
    id: "P-7",
    name: "Patient 7",
    age: 16,
    gender: "Female",
    race: "Black",
    values: { 1: "16", 2: "ALL", 3: "YES", 5: "2", 6: "YES", 7: "NO" },
  },
  {
    id: "P-8",
    name: "Patient 8",
    age: 11,
    gender: "Male",
    race: "Hispanic",
    values: { 1: "11", 2: "ALAL", 3: "YES", 5: "1", 6: "YES", 7: "YES", 8: "35" },
  },
  {
    id: "P-9",
    name: "Patient 9",
    age: 23,
    gender: "Male",
    race: "Asian",
    values: { 1: "23", 2: "AML", 3: "NOT_SURE", 5: "3", 6: "NO", 7: "NO" },
  },
  {
    id: "P-10",
    name: "Patient 10",
    age: 32,
    gender: "Female",
    race: "White",
    values: { 1: "32", 2: "MDS", 3: "NO", 5: "2", 6: "UNKNOWN", 7: "NOT_SURE" },
  },
];

function evaluateTrial(trial, values) {
  let weightedPass = 0;
  let total = 0;
  let failCount = 0;
  let pendingCount = 0;

  const checks = trial.checks.map((check) => {
    total += check.w;
    const value = values[check.filterId];
    if (value === undefined || value === "") {
      pendingCount += 1;
      return { ...check, status: "pending" };
    }
    if (check.test(value)) {
      weightedPass += check.w;
      return { ...check, status: "pass" };
    }
    failCount += 1;
    return { ...check, status: "fail" };
  });

  let status = "matched";
  if (failCount > 0) status = "unmatched";
  else if (pendingCount > 0) status = "undetermined";

  return {
    fit: total ? Math.round((weightedPass / total) * 100) : 0,
    status,
    checks,
  };
}

function statusLabel(status) {
  if (status === "matched") return "Matched";
  if (status === "undetermined") return "Need Data";
  return "Not Matched";
}

function splitChecks(checks) {
  return {
    pass: checks.filter((c) => c.status === "pass"),
    fail: checks.filter((c) => c.status === "fail"),
    pending: checks.filter((c) => c.status === "pending"),
  };
}

function collectDependencies(filterId, visited = new Set()) {
  if (visited.has(filterId)) return new Set();
  visited.add(filterId);

  const filter = FILTER_BY_ID[filterId];
  const deps = new Set();
  if (!filter || !filter.showIf) return deps;

  filter.showIf.forEach((rule) => {
    deps.add(rule.id);
    collectDependencies(rule.id, visited).forEach((x) => deps.add(x));
  });

  return deps;
}

function isFilterEnabled(filter, values) {
  if (!filter.showIf || filter.showIf.length === 0) return true;
  return filter.showIf.every((rule) => values[rule.id] === rule.equals);
}

function Header({ route, setRoute, isAuth, userName, onLogout }) {
  const guestItems = [{ id: "about", label: "ABOUT GEARBOx" }];
  const userItems = [
    { id: "dashboard", label: "DASHBOARD" },
    { id: "matching", label: "FIND A TRIAL" },
    { id: "trialPatient", label: "TRIAL TO PATIENT" },
    { id: "monitoring", label: "CONTINUOUS TRACKING" },
    { id: "about", label: "ABOUT GEARBOx" },
  ];

  const items = isAuth ? userItems : guestItems;

  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="logo-wrap" type="button" onClick={() => setRoute(isAuth ? "dashboard" : "landing")}>
          <img src="./assets/gearbox-logo.svg" alt="GEARBOx" />
        </button>

        <nav className="main-nav">
          {items.map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${route === item.id ? "active" : ""}`}
              type="button"
              onClick={() => setRoute(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          {isAuth ? (
            <>
              <span className="user-pill">Dr. {userName}</span>
              <button className="btn btn-outline" type="button" onClick={onLogout}>
                LOG OUT
              </button>
            </>
          ) : (
            <button className="btn btn-primary" type="button" onClick={() => setRoute("login")}>LOG IN</button>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="partners-row">
        <img src="./assets/uchicago-logo.svg" alt="University of Chicago" />
        <img src="./assets/d4cg-logo.png" alt="Data for the Common Good" />
        <img src="./assets/nih-logo.jpg" alt="National Cancer Institute" />
        <img src="./assets/ici-logo.png" alt="Innovation in Cancer Informatics" />
        <img src="./assets/lls-logo.svg" alt="PedAL" />
      </div>
      <div className="footer-links">
        <span>About GEARBOx</span>
        <span>Terms</span>
        <span>Privacy Notice</span>
        <span>Contact</span>
      </div>
      <p className="copyright">© {new Date().getFullYear()} The University of Chicago</p>
    </footer>
  );
}

function LandingPage({ onGetStarted }) {
  return (
    <>
      <section className="landing-hero">
        <img className="beehive-bg" src="./assets/pedal-beehives.png" alt="" />
        <img className="gear-bg" src="./assets/gear-icon.svg" alt="" />

        <div className="hero-copy">
          <h1>
            Find <strong>clinical trials</strong>
            <br />
            for your <strong>patients</strong>.
            <br />
            Instantly.
          </h1>
          <p>
            GEARBOx <span>Genomic Eligibility AlgoRithm for Better Outcomes</span> helps clinicians rapidly
            match relapsed or refractory patients to appropriate clinical trials.
          </p>
          <button className="btn btn-primary btn-large" type="button" onClick={onGetStarted}>
            GET STARTED
          </button>
        </div>
      </section>

      <section className="landing-section">
        <h2>Proposed Post-Project Experience</h2>
        <p>
          Same trusted GEARBOx theme and workflow, with a modern trial matching page where users search and select
          only relevant filters instead of scrolling a long question column.
        </p>
        <div className="shots-row">
          <img src="./assets/match-screenshot-left.png" alt="Matching screenshot left" />
          <img src="./assets/match-screenshot-right.png" alt="Matching screenshot right" />
        </div>
      </section>
    </>
  );
}

function LoginPage({ authMode, setAuthMode, onSubmit }) {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <img className="auth-watermark" src="./assets/gear-icon.svg" alt="" />
        <img className="auth-logo" src="./assets/gearbox-logo.svg" alt="GEARBOx" />
        <h2>{authMode === "login" ? "Log in to your account" : "Create your account"}</h2>

        <div className="auth-switch">
          <button
            className={`switch-btn ${authMode === "login" ? "active" : ""}`}
            type="button"
            onClick={() => setAuthMode("login")}
          >
            Login
          </button>
          <button
            className={`switch-btn ${authMode === "register" ? "active" : ""}`}
            type="button"
            onClick={() => setAuthMode("register")}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          {authMode === "register" && (
            <label>
              Full name
              <input required name="name" placeholder="Dr. Jane Doe" />
            </label>
          )}
          <label>
            Work email
            <input required name="email" placeholder="doctor@hospital.org" />
          </label>
          <label>
            Password
            <input required type="password" name="password" placeholder="Enter password" />
          </label>

          <button className="btn btn-primary" type="submit">
            {authMode === "login" ? "LOGIN TO DASHBOARD" : "CREATE ACCOUNT"}
          </button>
        </form>

        <p className="helper-text">
          Prototype mode: enter any values. This demonstrates the expected UI after project implementation.
        </p>
      </div>
    </section>
  );
}

function AboutPage() {
  return (
    <section className="about-page">
      <h1>About GEARBOx</h1>

      <div className="about-splash">
        <p>
          <strong>GEARBOx</strong> provides clinicians near-instant matching to open clinical trials for their
          patients.
        </p>
      </div>

      <article className="about-section">
        <p>
          There are currently limited resources for a clinician to match their patients against open clinical trials.
          <strong>
            {" "}GEARBOx aims to solve that by providing clinicians near-instant matching to open trials
          </strong>
          , based on patient clinical and genomic testing, and information abstracted from trial protocols.
        </p>
        <p>
          GEARBOx is developed by the University of Chicago Data for the Common Good team with funding from the
          Pediatric Acute Leukemia Master Clinical Trial (Blood Cancer United PedAL), The Fund for Innovation in
          Cancer Informatics, and the National Cancer Institute.
        </p>
      </article>

      <article className="about-section">
        <h2>Who is GEARBOx for?</h2>
        <p>
          GEARBOx is a decision-support tool used by clinicians and nurse navigators to identify potential clinical
          trials for their patients.
        </p>
      </article>

      <article className="about-section">
        <h2>What information is available on GEARBOx?</h2>
        <p>
          GEARBOx contains trial eligibility criteria, including inclusion and exclusion criteria, abstracted from
          trial protocols. Trial location and enrollment status are periodically updated from ClinicalTrials.gov and
          project sources.
        </p>
      </article>

      <article className="about-section">
        <h2>Terms and conditions</h2>
        <p>
          <a href="https://docs.pedscommons.org/GEARBOxTermsandConditions/" target="_blank" rel="noreferrer">
            Read the GEARBOx Terms and Conditions
          </a>
          {" "}for appropriate use of information on this site and limitations.
        </p>
      </article>

      <article className="about-section">
        <h2>Privacy notice</h2>
        <p>
          <a href="https://docs.pedscommons.org/PcdcPrivacyNotice/" target="_blank" rel="noreferrer">
            Read the Privacy Notice
          </a>
          {" "}to see how Data for the Common Good uses personal data collected when you visit GEARBOx.
        </p>
      </article>

      <article className="about-section">
        <h2>Get regular updates</h2>
        <ul className="about-list">
          <li>
            <a
              href="https://bloodcancerunited.org/about-us/dare-to-dream-project/pedal"
              target="_blank"
              rel="noreferrer"
            >
              Pediatric Acute Leukemia Master Clinical Trial (Blood Cancer United PedAL)
            </a>
          </li>
          <li>
            <a href="http://sam.am/PCDCnews" target="_blank" rel="noreferrer">
              Data for the Common Good (D4CG) newsletter
            </a>
          </li>
        </ul>
      </article>

      <article className="about-section">
        <p>
          If you need help with GEARBOx, email{" "}
          <a href="mailto:gearbox_help@lists.uchicago.edu">gearbox_help@lists.uchicago.edu</a>.
        </p>
      </article>
    </section>
  );
}

function PatientTabs({ patients, selectedPatientId, setSelectedPatientId, addPatient }) {
  return (
    <aside className="patient-sidebar">
      <p className="sidebar-title">PATIENTS</p>
      <div className="patient-list">
        {patients.map((patient) => (
          <button
            key={patient.id}
            className={`patient-btn ${patient.id === selectedPatientId ? "active" : ""}`}
            type="button"
            onClick={() => setSelectedPatientId(patient.id)}
          >
            {patient.name}
          </button>
        ))}
      </div>
      <button className="btn btn-primary" type="button" onClick={addPatient}>
        + ADD PATIENT ({patients.length}/10)
      </button>
    </aside>
  );
}

function DashboardPage({ patients }) {
  const allRows = useMemo(
    () => patients.flatMap((p) => TRIALS.map((t) => evaluateTrial(t, p.values))),
    [patients]
  );

  const matched = allRows.filter((x) => x.status === "matched").length;
  const undetermined = allRows.filter((x) => x.status === "undetermined").length;
  const unmatched = allRows.filter((x) => x.status === "unmatched").length;

  return (
    <section className="dashboard-page">
      <div className="dashboard-hero">
        <h1>Clinical Trial Enrollment Workspace</h1>
        <p>
          Patient-centric matching with transparent rationale and continuous tracking. This is the proposed interface
          after the enhancement project.
        </p>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <p>Matched</p>
          <strong>{matched}</strong>
        </article>
        <article className="metric-card">
          <p>Need data</p>
          <strong>{undetermined}</strong>
        </article>
        <article className="metric-card">
          <p>Not matched</p>
          <strong>{unmatched}</strong>
        </article>
        <article className="metric-card">
          <p>Active trials</p>
          <strong>{TRIALS.length}</strong>
        </article>
      </div>
    </section>
  );
}

function MatchingPage({ selectedPatient, updatePatientValue, resetPatientValues }) {
  const [selectedFilters, setSelectedFilters] = useState(new Set([1, 2, 5]));
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [activeTrialId, setActiveTrialId] = useState(null);
  const [mode, setMode] = useState("selected");

  const values = selectedPatient.values;

  const dependencyFilterIds = useMemo(() => {
    const deps = new Set();
    selectedFilters.forEach((id) => {
      collectDependencies(id).forEach((x) => deps.add(x));
    });
    selectedFilters.forEach((id) => deps.delete(id));
    return deps;
  }, [selectedFilters]);

  const selectedAndDependencyIds = useMemo(
    () => new Set([...selectedFilters, ...dependencyFilterIds]),
    [selectedFilters, dependencyFilterIds]
  );

  const relevantFieldIds = useMemo(() => {
    const ids = new Set(FILTERS.filter((f) => f.common).map((f) => f.id));
    Object.entries(values).forEach(([id, value]) => {
      if (value !== undefined && value !== "") ids.add(Number(id));
    });
    const deps = new Set();
    ids.forEach((id) => {
      collectDependencies(id).forEach((x) => deps.add(x));
    });
    return new Set([...ids, ...deps]);
  }, [values]);

  const renderFieldIds = useMemo(() => {
    if (mode === "all") return new Set(FILTERS.map((f) => f.id));
    if (mode === "relevant") return relevantFieldIds;
    return selectedAndDependencyIds;
  }, [mode, relevantFieldIds, selectedAndDependencyIds]);

  const activeFilters = useMemo(
    () => FILTERS.filter((f) => renderFieldIds.has(f.id)).sort((a, b) => a.label.localeCompare(b.label)),
    [renderFieldIds]
  );

  const searchMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return FILTERS.filter(
      (f) => !selectedFilters.has(f.id) && `${f.label} ${f.group}`.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, selectedFilters]);

  const suggestedFilters = useMemo(
    () => FILTERS.filter((f) => f.common && !selectedFilters.has(f.id)).slice(0, 6),
    [selectedFilters]
  );

  const rows = useMemo(() => TRIALS.map((t) => ({ trial: t, eval: evaluateTrial(t, values) })), [values]);

  const visibleRows = useMemo(() => {
    const filtered = tab === "all" ? rows : rows.filter((row) => row.eval.status === tab);
    return [...filtered].sort((a, b) => b.eval.fit - a.eval.fit);
  }, [rows, tab]);

  const resolvedActiveId = useMemo(() => {
    if (visibleRows.length === 0) return null;
    if (activeTrialId && visibleRows.some((x) => x.trial.id === activeTrialId)) return activeTrialId;
    return visibleRows[0].trial.id;
  }, [visibleRows, activeTrialId]);

  const activeRow = visibleRows.find((x) => x.trial.id === resolvedActiveId) || null;
  const checkGroups = activeRow ? splitChecks(activeRow.eval.checks) : { pass: [], fail: [], pending: [] };

  const answerable = activeFilters.filter((f) => isFilterEnabled(f, values)).length;
  const answered = activeFilters.filter(
    (f) => isFilterEnabled(f, values) && values[f.id] !== undefined && values[f.id] !== ""
  ).length;

  const matchedCount = rows.filter((x) => x.eval.status === "matched").length;
  const passCount = checkGroups.pass.length;
  const failCount = checkGroups.fail.length;
  const pendingCount = checkGroups.pending.length;
  const failedText = checkGroups.fail.map((x) => x.label).join(", ");
  const pendingText = checkGroups.pending.map((x) => x.label).join(", ");

  return (
    <section className="matching-page">
      <div className="module-title-row">
        <div>
          <h1>Patient-to-Trial Matching</h1>
          <p className="module-help">Search filters, answer selected criteria only, and review matches instantly.</p>
        </div>
        <span className="pill">{matchedCount} matched</span>
      </div>

      <div className="patient-summary">
        <div>
          <p className="summary-label">Selected patient</p>
          <h2>{selectedPatient.name}</h2>
          <p>
            Age {selectedPatient.age} • {selectedPatient.gender} • {selectedPatient.race}
          </p>
        </div>
        <p className="summary-inline">
          Criteria answered: <strong>{answered}/{answerable}</strong> • Trials evaluated: <strong>{rows.length}</strong>
        </p>
      </div>

      <div className="match-layout">
        <div className="left-pane">
          <p className="step">1. Search and select filters</p>
          <p className="helper-line">Show mode</p>
          <div className="mode-row">
            {[
              { id: "selected", label: "Selected only" },
              { id: "relevant", label: "Relevant" },
              { id: "all", label: "All fields" },
            ].map((item) => (
              <button
                key={item.id}
                className={`mode-btn ${mode === item.id ? "active" : ""}`}
                type="button"
                onClick={() => setMode(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="helper-line">Search by diagnosis, relapse, biomarker, lab value...</p>
          <div className="search-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search filters (age, diagnosis, relapse...)"
            />
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => {
                const ids = FILTERS.filter((f) => f.common).map((f) => f.id);
                setSelectedFilters(new Set([...selectedFilters, ...ids]));
              }}
            >
              Add Common
            </button>
          </div>

          {query.trim() && (
            <div className="suggest-box">
              {searchMatches.length === 0 ? (
                <div className="suggest-item">No filters found</div>
              ) : (
                searchMatches.map((f) => (
                  <button
                    key={f.id}
                    className="suggest-item"
                    type="button"
                    onClick={() => {
                      setSelectedFilters(new Set([...selectedFilters, f.id]));
                      setQuery("");
                    }}
                  >
                    <strong>{f.label}</strong>
                    <small>{f.group}</small>
                  </button>
                ))
              )}
            </div>
          )}

          <p className="subheading">Suggested filters</p>
          <div className="suggested-row">
            {suggestedFilters.map((filter) => (
              <button
                className="btn btn-outline"
                key={`suggest-${filter.id}`}
                type="button"
                onClick={() => setSelectedFilters(new Set([...selectedFilters, filter.id]))}
              >
                + {filter.label}
              </button>
            ))}
            {suggestedFilters.length === 0 && <div className="empty">No more suggested filters.</div>}
          </div>

          <p className="subheading">Selected filters</p>
          <div className="selected-section">
            {[...selectedFilters].sort((a, b) => a - b).map((id) => {
              const filter = FILTER_BY_ID[id];
              if (!filter) return null;
              return (
                <span key={id} className="chip">
                  {filter.label}
                  <button
                    type="button"
                    onClick={() => {
                      const next = new Set(selectedFilters);
                      next.delete(id);
                      setSelectedFilters(next);
                    }}
                  >
                    ×
                  </button>
                </span>
              );
            })}
            {selectedFilters.size === 0 && (
              <div className="empty">No filters selected. Search and add filters to begin.</div>
            )}
          </div>

          {dependencyFilterIds.size > 0 && (
            <>
              <p className="subheading">Auto-added dependencies</p>
              <div className="chips">
                {[...dependencyFilterIds].sort((a, b) => a - b).map((id) => {
                  const filter = FILTER_BY_ID[id];
                  if (!filter) return null;
                  return (
                    <span key={`dep-${id}`} className="chip auto">
                      {filter.label}
                    </span>
                  );
                })}
              </div>
            </>
          )}

          <div className="action-row">
            <button className="btn btn-outline" type="button" onClick={resetPatientValues}>
              Reset Answers
            </button>
            <button className="btn btn-outline" type="button" onClick={() => setSelectedFilters(new Set([1, 2, 5]))}>
              Reset Filters
            </button>
          </div>

          <p className="step">2. Answer selected criteria</p>
          <div className="form-card compact">
            {activeFilters.length === 0 ? (
              <div className="empty">Select at least one filter to start answering.</div>
            ) : (
              activeFilters.map((f) => {
                const enabled = isFilterEnabled(f, values);
                const value = values[f.id] ?? "";

                return (
                  <div key={f.id} className={`field ${enabled ? "" : "muted"}`}>
                    <label>
                      {f.label}
                      <small>{f.group}</small>
                    </label>

                    {f.type === "number" && (
                      <input
                        type="number"
                        disabled={!enabled}
                        value={value}
                        onChange={(e) => updatePatientValue(f.id, e.target.value)}
                      />
                    )}

                    {f.type === "select" && (
                      <select
                        disabled={!enabled}
                        value={value}
                        onChange={(e) => updatePatientValue(f.id, e.target.value)}
                      >
                        <option value="">Select...</option>
                        {f.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {f.type === "radio" && (
                      <div className="radio-row">
                        {f.options.map((opt) => (
                          <label key={opt}>
                            <input
                              type="radio"
                              disabled={!enabled}
                              checked={value === opt}
                              onChange={() => updatePatientValue(f.id, opt)}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="right-pane">
          <p className="step">3. Review matching trials</p>
          <div className="result-header">
            <div className="tab-row">
              {[
                { id: "all", label: "All" },
                { id: "matched", label: "Matched" },
                { id: "undetermined", label: "Need Data" },
                { id: "unmatched", label: "Not Matched" },
              ].map((item) => (
                <button
                  key={item.id}
                  className={`tab-btn ${tab === item.id ? "active" : ""}`}
                  type="button"
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <span className="pill">{visibleRows.length} trials</span>
          </div>

          <div className="trial-grid">
            {visibleRows.map((row) => (
              <button
                key={row.trial.id}
                className={`trial-tile is-${row.eval.status} ${resolvedActiveId === row.trial.id ? "active" : ""}`}
                type="button"
                onClick={() => setActiveTrialId(row.trial.id)}
              >
                <div className="tile-top">
                  <h4>{row.trial.title}</h4>
                  <span className="score">{row.eval.fit}%</span>
                </div>
                <p className="tile-meta">
                  {row.trial.id} • {row.trial.nct} • {row.trial.phase}
                </p>
                <p className="tile-meta">{row.trial.location}</p>
                <p className="tile-summary">{row.trial.summary}</p>
                <div className="tile-checks">
                  <span>Pass: {row.eval.checks.filter((c) => c.status === "pass").length}</span>
                  <span>Need data: {row.eval.checks.filter((c) => c.status === "pending").length}</span>
                  <span>Fail: {row.eval.checks.filter((c) => c.status === "fail").length}</span>
                </div>
                <div className={`status ${row.eval.status}`}>{statusLabel(row.eval.status)}</div>
              </button>
            ))}
          </div>

          <div className={`trial-detail minimal ${activeRow ? `is-${activeRow.eval.status}` : ""}`}>
            {!activeRow ? (
              <div className="empty">No trials available in this filter.</div>
            ) : (
              <>
                <div className="detail-head">
                  <div>
                    <h3>{activeRow.trial.title}</h3>
                    <p>
                      {activeRow.trial.id} • {activeRow.trial.nct} • {activeRow.trial.phase}
                    </p>
                  </div>
                  <span className={`status ${activeRow.eval.status}`}>{statusLabel(activeRow.eval.status)}</span>
                </div>

                <p className="detail-summary">{activeRow.trial.summary}</p>
                <a
                  className="trial-link"
                  href={`https://clinicaltrials.gov/study/${activeRow.trial.nct}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open on ClinicalTrials.gov
                </a>

                <div className="progress-wrap">
                  <div className="progress-head">
                    <span>Eligibility confidence</span>
                    <strong>{activeRow.eval.fit}%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${activeRow.eval.fit}%` }} />
                  </div>
                </div>

                <div className="detail-basic">
                  <p><strong>Sponsor:</strong> {activeRow.trial.sponsor}</p>
                  <p><strong>Location:</strong> {activeRow.trial.location}</p>
                  <p><strong>Status:</strong> {activeRow.trial.status}</p>
                  <p><strong>Arms:</strong> {activeRow.trial.arms}</p>
                </div>

                <div className="mini-stats">
                  <div>
                    <span>Pass</span>
                    <strong>{passCount}</strong>
                  </div>
                  <div>
                    <span>Need data</span>
                    <strong>{pendingCount}</strong>
                  </div>
                  <div>
                    <span>Fail</span>
                    <strong>{failCount}</strong>
                  </div>
                </div>

                <div className="detail-columns">
                  <div>
                    <h5>Eligibility checks</h5>
                    <ul>
                      {activeRow.eval.checks.map((c, idx) => (
                        <li
                          key={`${c.label}-${idx}`}
                          className={c.status === "pass" ? "ok" : c.status === "fail" ? "no" : "pending"}
                        >
                          {c.status === "pass" ? "OK" : c.status === "fail" ? "NO" : "..."} {c.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {failedText && <div className="note danger">Blocking: {failedText}</div>}
                {pendingText && <div className="note warn">Need data: {pendingText}</div>}

                <div className="next-step">Next step: {activeRow.trial.nextStep}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrialToPatientPage({ patients }) {
  const [trialId, setTrialId] = useState(TRIALS[0].id);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activePatientId, setActivePatientId] = useState(null);

  const selectedTrial = TRIALS.find((t) => t.id === trialId) || TRIALS[0];

  const rows = useMemo(
    () =>
      patients
        .map((p) => ({ patient: p, eval: evaluateTrial(selectedTrial, p.values) }))
        .sort((a, b) => b.eval.fit - a.eval.fit),
    [patients, selectedTrial]
  );

  const visibleRows = useMemo(
    () => (statusFilter === "all" ? rows : rows.filter((r) => r.eval.status === statusFilter)),
    [rows, statusFilter]
  );

  const resolvedActivePatientId = useMemo(() => {
    if (visibleRows.length === 0) return null;
    if (activePatientId && visibleRows.some((x) => x.patient.id === activePatientId)) return activePatientId;
    return visibleRows[0].patient.id;
  }, [visibleRows, activePatientId]);

  const activeRow = visibleRows.find((r) => r.patient.id === resolvedActivePatientId) || null;

  return (
    <section className="module-card">
      <div className="module-title-row">
        <h1>2. Trial-to-Patient Matching</h1>
      </div>

      <div className="match-layout">
        <div className="left-pane">
          <p className="step">Step 1: Select trial</p>
          <select value={trialId} onChange={(e) => setTrialId(e.target.value)}>
            {TRIALS.map((trial) => (
              <option key={trial.id} value={trial.id}>
                {trial.title} ({trial.id})
              </option>
            ))}
          </select>

          <p className="step">Step 2: Filter patients</p>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="matched">Matched</option>
            <option value="undetermined">Need data</option>
            <option value="unmatched">Not matched</option>
          </select>

          <div className="panel-note">
            <h3>{selectedTrial.title}</h3>
            <p>
              {selectedTrial.id} • {selectedTrial.phase} • {selectedTrial.status}
            </p>
            <p>{selectedTrial.summary}</p>
          </div>
        </div>

        <div className="right-pane">
          <p className="step">Step 3: Review patient eligibility</p>

          <div className="results-layout">
            <div className="trial-list">
              {visibleRows.map((row) => (
                <button
                  key={row.patient.id}
                  className={`trial-card is-${row.eval.status} ${resolvedActivePatientId === row.patient.id ? "active" : ""}`}
                  type="button"
                  onClick={() => setActivePatientId(row.patient.id)}
                >
                  <div className="card-head">
                    <div>
                      <h4>{row.patient.name}</h4>
                      <p>{row.patient.id}</p>
                    </div>
                    <span className="pill">{row.eval.fit}%</span>
                  </div>
                  <p>Age {row.patient.age} • {row.patient.gender} • {row.patient.race}</p>
                  <div className={`status ${row.eval.status}`}>{statusLabel(row.eval.status)}</div>
                </button>
              ))}
            </div>

            <div className="trial-detail">
              {!activeRow ? (
                <div className="empty">No patients in selected filter.</div>
              ) : (
                <>
                  <div className="detail-head">
                    <div>
                      <h3>{activeRow.patient.name}</h3>
                      <p>
                        {activeRow.patient.id} • Age {activeRow.patient.age} • {activeRow.patient.gender}
                      </p>
                    </div>
                    <span className={`status ${activeRow.eval.status}`}>{statusLabel(activeRow.eval.status)}</span>
                  </div>

                  <div className="progress-wrap">
                    <div className="progress-head">
                      <span>Patient-trial fit</span>
                      <strong>{activeRow.eval.fit}%</strong>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${activeRow.eval.fit}%` }} />
                    </div>
                  </div>

                  <h5>Criterion-level rationale</h5>
                  <ul>
                    {activeRow.eval.checks.map((c, idx) => (
                      <li
                        key={`${c.label}-${idx}`}
                        className={
                          c.status === "pass" ? "ok" : c.status === "fail" ? "no" : "pending"
                        }
                      >
                        {c.status === "pass" ? "OK" : c.status === "fail" ? "NO" : "..."} {c.label}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const TRACKING_STAGES = [
  "Data Collection",
  "Criteria Review",
  "Eligibility Verified",
  "Ready for Referral",
  "Not Eligible",
];

// Simple utility to keep generated values in range.
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Build deterministic trend points so every card has stable demo data.
function buildTrend(seedKey, fit) {
  const seed = seedKey.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const points = [];
  for (let i = 0; i < 6; i += 1) {
    const drift = ((seed + i * 17) % 9) - 4;
    const value = clamp(fit - 12 + i * 3 + drift, 8, 100);
    points.push(value);
  }
  return points;
}

function getTrackingStage(status, fit, pendingCount) {
  if (status === "matched" && fit >= 90) return "Ready for Referral";
  if (status === "matched") return "Eligibility Verified";
  if (status === "undetermined" && pendingCount > 1) return "Data Collection";
  if (status === "undetermined") return "Criteria Review";
  return "Not Eligible";
}

function TrendSparkline({ points }) {
  const width = 120;
  const height = 36;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max === min ? 1 : max - min;
  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="trend-sparkline" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={path} />
    </svg>
  );
}

function MonitoringPage({ selectedPatient }) {
  // Build one tracking row per trial for the currently selected patient only.
  const items = useMemo(() => {
    const rows = [];
    TRIALS.forEach((trial) => {
      const evaluation = evaluateTrial(trial, selectedPatient.values);
      const pending = evaluation.checks.filter((c) => c.status === "pending").map((c) => c.label);
      const passCount = evaluation.checks.filter((c) => c.status === "pass").length;
      const failCount = evaluation.checks.filter((c) => c.status === "fail").length;

      rows.push({
        id: `${selectedPatient.id}-${trial.id}`,
        patient: selectedPatient,
        trial,
        fit: evaluation.fit,
        pending,
        passCount,
        failCount,
        stage: getTrackingStage(evaluation.status, evaluation.fit, pending.length),
        status: evaluation.status,
        trend: buildTrend(`${selectedPatient.id}-${trial.id}`, evaluation.fit),
      });
    });

    return rows.sort((a, b) => b.fit - a.fit).slice(0, 8);
  }, [selectedPatient]);

  const stageCounts = useMemo(() => {
    const map = Object.fromEntries(TRACKING_STAGES.map((stage) => [stage, 0]));
    items.forEach((item) => {
      map[item.stage] += 1;
    });
    return map;
  }, [items]);

  const avgFit = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.round(items.reduce((sum, item) => sum + item.fit, 0) / items.length);
  }, [items]);

  const pendingTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.pending.length, 0),
    [items]
  );

  const stageTrend = useMemo(() => {
    const values = items.slice(0, 6).map((item) => item.fit);
    return values.length > 1 ? values : [40, 48, 52, 58, 66, 72];
  }, [items]);

  const maxStageCount = Math.max(1, ...Object.values(stageCounts));

  return (
    <section className="module-card">
      <div className="module-title-row">
        <h1>3. Continuous Tracking</h1>
      </div>

      <p className="module-subtitle">
        Showing tracking for <strong>{selectedPatient.name}</strong>. Monitor trial stage and pending criteria for this
        selected patient.
      </p>

      <div className="tracking-kpi-grid">
        <article className="tracking-kpi-card">
          <span>Monitored pairs</span>
          <strong>{items.length}</strong>
        </article>
        <article className="tracking-kpi-card">
          <span>Average fit score</span>
          <strong>{avgFit}%</strong>
        </article>
        <article className="tracking-kpi-card">
          <span>Pending criteria</span>
          <strong>{pendingTotal}</strong>
        </article>
        <article className="tracking-kpi-card">
          <span>Patients tracked</span>
          <strong>1</strong>
        </article>
      </div>

      <div className="tracking-analytics-grid">
        <section className="tracking-panel">
          <h3>Trial stage pipeline</h3>
          <div className="stage-bars">
            {TRACKING_STAGES.map((stage) => (
              <div key={stage} className="stage-row">
                <span>{stage}</span>
                <div className="stage-bar-track">
                  <div
                    className="stage-bar-fill"
                    style={{ width: `${Math.round((stageCounts[stage] / maxStageCount) * 100)}%` }}
                  />
                </div>
                <strong>{stageCounts[stage]}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="tracking-panel">
          <h3>Monitoring trend (fit score)</h3>
          <div className="trend-wrap">
            <TrendSparkline points={stageTrend} />
            <div className="trend-labels">
              <span>6 weeks ago</span>
              <span>Current week</span>
            </div>
          </div>
        </section>
      </div>

      <h3 className="tracking-list-title">Patient tracking board</h3>
      <div className="monitor-grid enhanced">
        {items.map((item) => (
          <article key={item.id} className={`monitor-card stage-${item.status}`}>
            <div className="monitor-head">
              <div>
                <h3>
                  {item.patient.name} → {item.trial.id}
                </h3>
                <p>
                  Age {item.patient.age} • {item.patient.gender} • {item.patient.race}
                </p>
              </div>
              <span className="stage-chip">{item.stage}</span>
            </div>

            <p className="monitor-title">{item.trial.title}</p>
            <div className="monitor-meta-row">
              <span>Fit {item.fit}%</span>
              <span>Pass {item.passCount}</span>
              <span>Fail {item.failCount}</span>
            </div>

            <div className="monitor-progress-track">
              <div className="monitor-progress-fill" style={{ width: `${item.fit}%` }} />
            </div>

            {item.pending.length > 0 ? (
              <div className="note warn">Waiting for: {item.pending.slice(0, 2).join(", ")}</div>
            ) : (
              <div className="note good">No pending criteria. Ready for next action.</div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function App() {
  const [route, setRoute] = useState("landing");
  const [isAuth, setIsAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [userName, setUserName] = useState("Clinician");

  const [patients, setPatients] = useState(PATIENT_POOL.slice(0, 4));
  const [selectedPatientId, setSelectedPatientId] = useState("P-1");

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || patients[0],
    [patients, selectedPatientId]
  );

  function addPatient() {
    setPatients((prev) => {
      if (prev.length >= 10) return prev;
      const next = PATIENT_POOL[prev.length] || {
        id: `P-${prev.length + 1}`,
        name: `Patient ${prev.length + 1}`,
        age: 18,
        gender: "Unknown",
        race: "Unknown",
        values: {},
      };
      return [...prev, next];
    });
  }

  function updatePatientValue(filterId, value) {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== selectedPatient.id) return p;
        const nextValues = { ...p.values };
        if (value === "") delete nextValues[filterId];
        else nextValues[filterId] = value;
        return { ...p, values: nextValues };
      })
    );
  }

  function resetPatientValues() {
    setPatients((prev) => prev.map((p) => (p.id === selectedPatient.id ? { ...p, values: {} } : p)));
  }

  function handleAuth(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get("name") || form.get("email") || "Clinician";
    setUserName(String(name).split("@")[0]);
    setIsAuth(true);
    setRoute("dashboard");
  }

  function handleLogout() {
    setIsAuth(false);
    setRoute("landing");
  }

  const restricted = new Set(["dashboard", "matching", "trialPatient", "monitoring"]);
  const activeRoute = !isAuth && restricted.has(route) ? "login" : route;

  return (
    <div className="app-shell">
      <Header route={activeRoute} setRoute={setRoute} isAuth={isAuth} userName={userName} onLogout={handleLogout} />

      <main className="page-wrap">
        {activeRoute === "landing" && <LandingPage onGetStarted={() => setRoute("login")} />}
        {activeRoute === "login" && <LoginPage authMode={authMode} setAuthMode={setAuthMode} onSubmit={handleAuth} />}
        {activeRoute === "about" && <AboutPage />}

        {isAuth && restricted.has(activeRoute) && (
          <div className="workspace">
            <PatientTabs
              patients={patients}
              selectedPatientId={selectedPatient.id}
              setSelectedPatientId={setSelectedPatientId}
              addPatient={addPatient}
            />

            <div className="workspace-main">
              {activeRoute === "dashboard" && <DashboardPage patients={patients} />}
              {activeRoute === "matching" && (
                <MatchingPage
                  selectedPatient={selectedPatient}
                  updatePatientValue={updatePatientValue}
                  resetPatientValues={resetPatientValues}
                />
              )}
              {activeRoute === "trialPatient" && <TrialToPatientPage patients={patients} />}
            {activeRoute === "monitoring" && <MonitoringPage selectedPatient={selectedPatient} />}
          </div>
        </div>
      )}
      </main>

      <Footer />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
