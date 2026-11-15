"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

type User = { id: string; email: string };
type Topic = { id: string; name: string };
type Note = {
  id: string;
  topicId: string;
  topicName: string;
  title: string;
  question: string;
  sourceText: string;
  explanation: string;
  keyTakeaways: string[];
  codeExamples: string[];
  sourceUrl: string | null;
  createdAt: string;
};
type Flashcard = {
  id: string;
  noteId: string;
  topicName: string;
  noteTitle: string;
  frontQuestion: string;
  backAnswer: string;
  memoryLevel: number;
  nextReviewDate: string;
};
type Stats = { notes: number; cards: number; dueToday: number; topics: number };
type RelatedNote = {
  id: string;
  title: string;
  topicName: string;
  similarity: number;
};
type CreatedNote = {
  note: Note;
  title: string;
  cards: Flashcard[];
  relatedNotes: RelatedNote[];
};
type Section = "overview" | "library" | "review" | "search";

class APIError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function csrfToken() {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("csrf_token="))
    ?.slice("csrf_token=".length);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (method !== "GET" && method !== "HEAD") {
    const token = csrfToken();
    if (token) headers.set("X-CSRF-Token", decodeURIComponent(token));
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      method,
      headers,
      credentials: "include",
    });
  } catch {
    throw new APIError("Could not reach the API. Check that the Go server is running.", 0);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.error?.message ?? body.error?.code ?? message;
    } catch {
      // Keep the HTTP status message when the server response is not JSON.
    }
    throw new APIError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function Icon({
  name,
  size = 18,
}: {
  name: string;
  size?: number;
}) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    library: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
    cards: <><rect x="3" y="5" width="14" height="15" rx="2" /><path d="M7 3h12a2 2 0 0 1 2 2v13" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h7" /></>,
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] ?? paths.book}
    </svg>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function NoteCard({ note }: { note: Note }) {
  return (
    <article className="note-card">
      <div className="note-card-topline">
        <span className="topic-pill">{note.topicName}</span>
        <span className="note-date">{formatDate(note.createdAt)}</span>
      </div>
      <h3>{note.title || note.question}</h3>
      <p className="note-question">{note.question}</p>
      <p className="note-excerpt">{note.explanation}</p>
      <details className="note-details">
        <summary>Read full note</summary>
        <div className="note-detail-content">
          <p>{note.explanation}</p>
          {note.keyTakeaways.length ? (
            <ul>{note.keyTakeaways.map((takeaway, index) => <li key={`${index}-${takeaway}`}>{takeaway}</li>)}</ul>
          ) : null}
          {note.codeExamples.map((example, index) => (
            <pre className="code-example" key={`${index}-${example.slice(0, 24)}`}><code>{example}</code></pre>
          ))}
          {note.sourceText ? <div className="note-source"><strong>Your source notes</strong><p>{note.sourceText}</p></div> : null}
        </div>
      </details>
      <div className="note-card-bottom">
        <span>{note.keyTakeaways.length} key ideas</span>
        {note.sourceUrl ? (
          <a href={note.sourceUrl} target="_blank" rel="noreferrer">
            Open source <Icon name="arrow" size={14} />
          </a>
        ) : null}
      </div>
    </article>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [section, setSection] = useState<Section>("overview");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState<Stats>({ notes: 0, cards: 0, dueToday: 0, topics: 0 });
  const [topicId, setTopicId] = useState("");
  const [question, setQuestion] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [saveToDeck, setSaveToDeck] = useState(true);
  const [createdNote, setCreatedNote] = useState<CreatedNote | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    request<{ user: User }>("/api/auth/me")
      .then((result) => {
        if (active) {
          setLoadingData(true);
          setUser(result.user);
        }
      })
      .catch((cause: unknown) => {
        if (active && (!(cause instanceof APIError) || cause.status !== 401)) {
          setError(cause instanceof Error ? cause.message : "Could not check your session.");
        }
      })
      .finally(() => {
        if (active) setAuthChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([
      request<Topic[]>("/api/topics"),
      request<Note[]>("/api/notes"),
      request<Flashcard[]>("/api/review/due"),
      request<Stats>("/api/stats"),
    ])
      .then(([nextTopics, nextNotes, nextDue, nextStats]) => {
        if (!active) return;
        setTopics(nextTopics);
        setNotes(nextNotes);
        setDueCards(nextDue);
        setStats(nextStats);
        setTopicId((current) => current || nextTopics[0]?.id || "");
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load your library.");
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError("");
    try {
      const result = await request<{ user: User }>(`/api/auth/${authMode === "register" ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      setLoadingData(true);
      setUser(result.user);
      setAuthPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally {
      setWorking(false);
    }
  }

  async function refreshDashboard() {
    const [nextNotes, nextDue, nextStats] = await Promise.all([
      request<Note[]>("/api/notes"),
      request<Flashcard[]>("/api/review/due"),
      request<Stats>("/api/stats"),
    ]);
    setNotes(nextNotes);
    setDueCards(nextDue);
    setStats(nextStats);
  }

  function navigateTo(nextSection: Section) {
    setSection(nextSection);
    setError("");
    if (nextSection === "review") {
      Promise.all([
        request<Flashcard[]>("/api/review/due"),
        request<Stats>("/api/stats"),
      ])
        .then(([nextDue, nextStats]) => {
          setDueCards(nextDue);
          setStats(nextStats);
        })
        .catch((cause: unknown) => {
          setError(cause instanceof Error ? cause.message : "Could not load review cards.");
        });
    }
  }

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError("");
    setCreatedNote(null);
    try {
      const result = await request<CreatedNote>("/api/notes", {
        method: "POST",
        body: JSON.stringify({
          topic_id: topicId,
          question,
          source_text: sourceText,
          source_url: sourceUrl,
          save_to_deck: saveToDeck,
        }),
      });
      setCreatedNote(result);
      setQuestion("");
      setSourceText("");
      setSourceUrl("");
      await refreshDashboard();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create your study note.");
    } finally {
      setWorking(false);
    }
  }

  async function searchLibrary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!searchText.trim()) return;
    setWorking(true);
    setError("");
    try {
      const results = await request<Note[]>(`/api/search?q=${encodeURIComponent(searchText.trim())}`);
      setSearchResults(results);
      setHasSearched(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Search is unavailable.");
    } finally {
      setWorking(false);
    }
  }

  async function gradeCard(grade: "forgot" | "got_it" | "too_easy") {
    const current = dueCards[0];
    if (!current) return;
    setWorking(true);
    setError("");
    try {
      await request(`/api/review/${current.id}`, {
        method: "POST",
        body: JSON.stringify({ grade }),
      });
      setDueCards((cards) => cards.slice(1));
      setRevealed(false);
      setStats((currentStats) => ({
        ...currentStats,
        dueToday: Math.max(0, currentStats.dueToday - 1),
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your review.");
    } finally {
      setWorking(false);
    }
  }

  async function signOut() {
    setWorking(true);
    setError("");
    try {
      await request("/api/auth/logout", { method: "POST" });
      setUser(null);
      setNotes([]);
      setDueCards([]);
      setSection("overview");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign out.");
    } finally {
      setWorking(false);
    }
  }

  if (!authChecked) {
    return <main className="splash-state"><span className="brand-mark"><Icon name="book" size={22} /></span><p>Opening your library…</p></main>;
  }

  if (!user) {
    return (
      <main className="auth-page">
        <section className="auth-story">
          <Link className="brand auth-brand" href="/">
            <span className="brand-mark"><Icon name="book" size={21} /></span>
            <span>second<span className="brand-light">brain</span></span>
          </Link>
          <div className="auth-copy">
            <span className="eyebrow">A quieter way to keep learning</span>
            <h1>Make what you learn<br /><em>stay with you.</em></h1>
            <p>Save the useful bits. Come back to them when it matters. Build a body of knowledge that is yours.</p>
            <div className="auth-benefits">
              <span><Icon name="check" size={16} /> Notes that connect ideas</span>
              <span><Icon name="check" size={16} /> Short, thoughtful recall practice</span>
            </div>
          </div>
          <span className="auth-footnote">Your personal learning space</span>
        </section>
        <section className="auth-form-wrap">
          <form className="auth-form" onSubmit={submitAuth}>
            <span className="eyebrow">{authMode === "login" ? "Welcome back" : "Get started"}</span>
            <h2>{authMode === "login" ? "Sign in to your space" : "Create your account"}</h2>
            <p className="muted">{authMode === "login" ? "Pick up right where you left off." : "A small home for everything you want to remember."}</p>
            {error ? <div className="error-banner" role="alert">{error}</div> : null}
            <label className="field-label" htmlFor="email">Email address</label>
            <input id="email" autoComplete="email" type="email" required value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" />
            <label className="field-label" htmlFor="password">Password</label>
            <input id="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} type="password" minLength={4} maxLength={50} required value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="At least 4 characters" />
            <button className="button button-primary auth-submit" disabled={working} type="submit">
              {working ? "Please wait…" : authMode === "login" ? "Sign in" : "Create account"} <Icon name="arrow" size={16} />
            </button>
            <p className="auth-switch">
              {authMode === "login" ? "New to Second Brain?" : "Already have an account?"}{" "}
              <button type="button" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setError(""); }}>
                {authMode === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </form>
        </section>
      </main>
    );
  }

  const currentCard = dueCards[0];
  const greetingName = user.email.split("@")[0];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="Second Brain home">
          <span className="brand-mark"><Icon name="book" size={21} /></span>
          <span>second<span className="brand-light">brain</span></span>
        </Link>
        <span className="nav-caption">YOUR WORKSPACE</span>
        <nav className="main-nav" aria-label="Main navigation">
          {([
            ["overview", "Overview", "home"],
            ["library", "My library", "library"],
            ["review", "Review cards", "cards"],
            ["search", "Search", "search"],
          ] as const).map(([id, label, icon]) => (
            <button aria-label={label} className={`nav-item ${section === id ? "active" : ""}`} key={id} onClick={() => navigateTo(id)}>
              <Icon name={icon} /><span>{label}</span>
              {id === "review" && stats.dueToday > 0 ? <span className="nav-count">{stats.dueToday}</span> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon"><Icon name="sparkle" size={17} /></span>
            <strong>Little by little</strong>
            <p>Ten focused minutes today beats an hour of cramming later.</p>
          </div>
          <div className="account-row">
            <span className="avatar">{user.email.slice(0, 1).toUpperCase()}</span>
            <span className="account-email">{user.email}</span>
            <button className="icon-button logout-button" onClick={signOut} aria-label="Sign out" title="Sign out" disabled={working}><Icon name="logout" /></button>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumbs">Your workspace <span>/</span> <strong>{section === "overview" ? "Overview" : section === "library" ? "My library" : section === "review" ? "Review cards" : "Search"}</strong></div>
          <span className="topbar-date">{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</span>
        </header>

        <div className="content-wrap">
          {error ? <div className="error-banner page-error" role="alert">{error}<button onClick={() => setError("")} aria-label="Dismiss error">×</button></div> : null}

          {section === "overview" ? (
            <>
              <section className="page-heading">
                <div><span className="eyebrow">YOUR KNOWLEDGE, IN ONE PLACE</span><h1>Good to see you, {greetingName}.</h1><p>Keep following your curiosity. We’ll help the good ideas stick.</p></div>
                <button className="button button-outline" onClick={() => setSection("library")}><Icon name="library" size={16} /> Browse library</button>
              </section>

              <section className="stats-grid" aria-label="Learning overview">
                <article className="stat-card"><span className="stat-icon violet"><Icon name="book" /></span><span className="stat-label">Saved notes</span><strong>{stats.notes}</strong><small>Ideas worth keeping</small></article>
                <article className="stat-card"><span className="stat-icon orange"><Icon name="cards" /></span><span className="stat-label">Quiz cards</span><strong>{stats.cards}</strong><small>Built from your notes</small></article>
                <article className="stat-card"><span className="stat-icon green"><Icon name="clock" /></span><span className="stat-label">Due to review</span><strong>{stats.dueToday}</strong><small>{stats.dueToday === 1 ? "A quick review today" : "Ready when you are"}</small></article>
              </section>

              <div className="dashboard-columns">
                <section className="panel capture-panel">
                  <div className="panel-heading">
                    <div><span className="eyebrow">SAVE SOMETHING NEW</span><h2>Turn a spark into a study note</h2></div>
                    <span className="heading-icon"><Icon name="plus" /></span>
                  </div>
                  <form onSubmit={submitNote} className="capture-form">
                    <label className="field-label" htmlFor="question">What do you want to understand?</label>
                    <input id="question" maxLength={500} required value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="e.g. What problem does a message queue solve?" />
                    <label className="field-label" htmlFor="sourceText">Your notes or transcript <span className="optional-label">optional</span></label>
                    <textarea id="sourceText" maxLength={30000} rows={4} value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="Paste the useful excerpt, your rough notes, or a transcript…" />
                    <div className="form-row">
                      <div className="form-field grow">
                        <label className="field-label" htmlFor="topic">Topic</label>
                        <select id="topic" required value={topicId} onChange={(event) => setTopicId(event.target.value)}>
                          {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
                        </select>
                      </div>
                      <div className="form-field grow">
                        <label className="field-label" htmlFor="sourceUrl">Source link <span className="optional-label">optional</span></label>
                        <input id="sourceUrl" type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" />
                      </div>
                    </div>
                    <label className="toggle-row">
                      <input type="checkbox" checked={saveToDeck} onChange={(event) => setSaveToDeck(event.target.checked)} />
                      <span className="toggle-control" aria-hidden="true" />
                      <span><strong>Save quiz cards</strong><small>Generate recall questions for later review</small></span>
                    </label>
                    <button className="button button-primary create-button" type="submit" disabled={working || loadingData || !topicId}>
                      {working ? <><span className="spinner" /> Making your study note…</> : <><Icon name="sparkle" size={17} /> Create study note <Icon name="arrow" size={16} /></>}
                    </button>
                    <p className="form-helper">AI-created content can be imperfect. Add a source excerpt to keep it grounded.</p>
                  </form>
                </section>

                <aside className="panel review-panel">
                  <div className="panel-heading">
                    <div><span className="eyebrow">A LITTLE PRACTICE</span><h2>Make it memorable</h2></div>
                    <span className="heading-icon warm"><Icon name="cards" /></span>
                  </div>
                  <div className="review-illustration"><Icon name="clock" size={26} /><span className="orbit-dot" /></div>
                  {stats.dueToday > 0 ? (
                    <>
                      <h3>{stats.dueToday} card{stats.dueToday === 1 ? "" : "s"} ready when you are</h3>
                      <p>Take a moment to recall before revealing the answer. That effort helps new ideas settle in.</p>
                      <button className="button button-primary full-button" onClick={() => navigateTo("review")}>Start a review <Icon name="arrow" size={16} /></button>
                    </>
                  ) : (
                    <>
                      <h3>You’re all caught up</h3>
                      <p>When you save notes with quiz cards, they’ll show up here when it’s time to revisit them.</p>
                      <button className="button button-outline full-button" onClick={() => document.getElementById("question")?.focus()}>Save a new idea <Icon name="arrow" size={16} /></button>
                    </>
                  )}
                  <div className="review-note"><Icon name="sparkle" size={15} /><span>Consistency matters more than long sessions.</span></div>
                </aside>
              </div>

              {createdNote ? (
                <section className="panel generated-panel">
                  <div className="generated-heading"><span className="generated-mark"><Icon name="check" /></span><div><span className="eyebrow">STUDY NOTE CREATED</span><h2>{createdNote.note.title}</h2></div><span className="topic-pill">{createdNote.note.topicName}</span></div>
                  <p className="generated-explanation">{createdNote.note.explanation}</p>
                  {createdNote.note.keyTakeaways.length ? <ul className="takeaway-list">{createdNote.note.keyTakeaways.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : null}
                  {createdNote.note.codeExamples.map((example, index) => <pre className="code-example" key={`${index}-${example.slice(0, 24)}`}><code>{example}</code></pre>)}
                  <div className="generated-footer">
                    <span>{createdNote.cards.length ? `${createdNote.cards.length} quiz card${createdNote.cards.length === 1 ? "" : "s"} added — due tomorrow` : "Quiz cards were not saved"}</span>
                    {createdNote.relatedNotes.length ? <span>Connected to {createdNote.relatedNotes.map((item) => item.title).join(", ")}</span> : <span>Saved in your library</span>}
                  </div>
                </section>
              ) : null}

              <section className="recent-section">
                <div className="section-title-row"><div><span className="eyebrow">FRESH IN YOUR LIBRARY</span><h2>Recently saved</h2></div><button className="text-button" onClick={() => setSection("library")}>View all <Icon name="arrow" size={15} /></button></div>
                {notes.length ? <div className="notes-grid">{notes.slice(0, 3).map((note) => <NoteCard key={note.id} note={note} />)}</div> : <div className="empty-panel"><span className="empty-icon"><Icon name="book" size={22} /></span><h3>Your library starts with one good question.</h3><p>Save something you’ve been learning about and it’ll be here when you need it.</p></div>}
              </section>
            </>
          ) : null}

          {section === "library" ? (
            <section className="library-view">
              <div className="page-heading"><div><span className="eyebrow">YOUR PERSONAL KNOWLEDGE BASE</span><h1>My library</h1><p>{stats.notes} notes across {topics.length} topics. Keep the ideas you’ll want to find again.</p></div><button className="button button-primary" onClick={() => setSection("overview")}><Icon name="plus" size={16} /> Add a note</button></div>
              {notes.length ? <div className="notes-grid library-grid">{notes.map((note) => <NoteCard key={note.id} note={note} />)}</div> : <div className="empty-panel"><span className="empty-icon"><Icon name="book" size={22} /></span><h3>Your library is ready for its first idea.</h3><p>Start with a question or something you just learned.</p><button className="button button-primary" onClick={() => setSection("overview")}>Create your first note</button></div>}
            </section>
          ) : null}

          {section === "review" ? (
            <section className="review-view">
              <div className="page-heading"><div><span className="eyebrow">SPACED REPETITION</span><h1>Time to remember</h1><p>Try to recall the answer before you reveal it. Every attempt is practice.</p></div><span className="review-total"><Icon name="cards" /> {dueCards.length} remaining</span></div>
              {currentCard ? (
                <article className="quiz-card">
                  <div className="quiz-meta"><span className="topic-pill">{currentCard.topicName}</span><span>Card {stats.dueToday - dueCards.length + 1} of {stats.dueToday}</span></div>
                  <div className="quiz-content"><span className="eyebrow">QUESTION</span><h2>{currentCard.frontQuestion}</h2>
                    {revealed ? <div className="answer-block"><span className="eyebrow">ANSWER</span><p>{currentCard.backAnswer}</p></div> : <p className="think-prompt">Take a breath and think it through before revealing.</p>}
                  </div>
                  {!revealed ? <button className="button button-primary reveal-button" onClick={() => setRevealed(true)}>Reveal answer <Icon name="arrow" size={16} /></button> : (
                    <div className="grade-actions">
                      <button className="grade-button forgot" disabled={working} onClick={() => gradeCard("forgot")}><span>↺</span><strong>Forgot</strong><small>Again tomorrow</small></button>
                      <button className="grade-button got-it" disabled={working} onClick={() => gradeCard("got_it")}><span><Icon name="check" /></span><strong>Got it</strong><small>Next in {currentCard.memoryLevel < 5 ? [3, 7, 14, 30][currentCard.memoryLevel - 1] : 30} days</small></button>
                      <button className="grade-button too-easy" disabled={working} onClick={() => gradeCard("too_easy")}><span>↑</span><strong>Too easy</strong><small>Skip a level</small></button>
                    </div>
                  )}
                  <div className="quiz-card-footer"><span>From: {currentCard.noteTitle}</span><span>Level {currentCard.memoryLevel} of 5</span></div>
                </article>
              ) : (
                <div className="empty-panel review-complete"><span className="complete-mark"><Icon name="check" size={24} /></span><span className="eyebrow">SESSION COMPLETE</span><h2>You showed up. That counts.</h2><p>{stats.cards ? "Your next cards will be ready on their review dates. Until then, keep exploring." : "Save your first note with quiz cards and they’ll appear here for practice."}</p><button className="button button-primary" onClick={() => setSection("overview")}>Back to overview <Icon name="arrow" size={16} /></button></div>
              )}
              <div className="interval-hint"><Icon name="clock" size={16} /><span>Review intervals grow as you remember: 1 day · 3 days · 7 days · 14 days · 30 days</span></div>
            </section>
          ) : null}

          {section === "search" ? (
            <section className="search-view">
              <div className="page-heading"><div><span className="eyebrow">MEANING, NOT JUST KEYWORDS</span><h1>Find that idea again</h1><p>Search your saved notes with a phrase or a question. Similar concepts can surface too.</p></div></div>
              <form className="search-form" onSubmit={searchLibrary}><Icon name="search" size={20} /><input autoFocus value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="e.g. How do queues make slow work reliable?" /><button className="button button-primary" disabled={working || !searchText.trim()}>{working ? "Searching…" : "Search"}</button></form>
              {hasSearched ? <div className="search-results"><div className="section-title-row"><div><span className="eyebrow">YOUR RESULTS</span><h2>{searchResults.length ? `${searchResults.length} related note${searchResults.length === 1 ? "" : "s"}` : "No notes found yet"}</h2></div></div>{searchResults.length ? <div className="notes-grid">{searchResults.map((note) => <NoteCard key={note.id} note={note} />)}</div> : <p className="muted">Try another phrase, or save a note about this topic first.</p>}</div> : null}
            </section>
          ) : null}
        </div>
        <footer className="app-footer"><span>Keep learning, one idea at a time.</span><span>Second Brain</span></footer>
      </main>
    </div>
  );
}
