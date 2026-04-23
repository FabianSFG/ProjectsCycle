import { useState } from "react";
import Head from "next/head";

export default function Home() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!idea.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const priorityClass = (p) => {
    if (!p) return "badge-low";
    const v = p.toLowerCase();
    if (v === "high") return "badge-high";
    if (v === "medium") return "badge-medium";
    return "badge-low";
  };

  const catClass = (c) => `cat-${(c ?? "").replace(/\s+/g, "")}`;

  const maxHours = result
    ? Math.max(...(result.estimation?.breakdown ?? []).map((b) => b.hours), 1)
    : 1;

  const totalToolsCost = result
    ? (result.tools ?? []).reduce((s, t) => s + (t.monthly_cost ?? 0), 0)
    : 0;

  return (
    <>
      <Head>
        <title>ProjectsCycle — AI Proposal Generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container">
        <header>
          <h1>ProjectsCycle</h1>
          <p>Turn your idea into a full AI-powered software proposal</p>
        </header>

        {/* ── Input ── */}
        <section className="input-section">
          <form onSubmit={handleSubmit}>
            <label htmlFor="idea">Describe your project idea</label>
            <textarea
              id="idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. A SaaS platform for managing freelance projects — clients, invoices, time tracking, and payments via Stripe."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !idea.trim()}>
              {loading ? (
                <><span className="spinner" />Generating proposal…</>
              ) : (
                "Generate Proposal"
              )}
            </button>
          </form>
        </section>

        {error && <div className="error-msg">{error}</div>}

        {result && (
          <div className="result">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              <button 
                onClick={() => window.print()} 
                style={{ 
                  background: 'var(--accent)', 
                  color: 'white', 
                  padding: '0.6rem 1.2rem', 
                  borderRadius: '6px', 
                  border: 'none', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download PDF Report
              </button>
            </div>

            {/* ── Summary ── */}
            <div className="card">
              <div className="card-title">Executive Summary</div>
              <p className="summary-text">{result.summary}</p>
            </div>

            {/* ── Totals bar ── */}
            {result.totals && (
              <div className="totals-bar">
                <div className="total-tile accent">
                  <div className="t-label">Total Project Cost</div>
                  <div className="t-value">
                    ${(result.totals.grand_total ?? result.cost ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="total-tile">
                  <div className="t-label">Team Cost</div>
                  <div className="t-value">
                    ${(result.totals.team_total_cost ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="total-tile warning">
                  <div className="t-label">Tools / Month</div>
                  <div className="t-value">
                    ${(result.totals.tools_monthly_cost ?? totalToolsCost).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* ── Epics ── */}
            {result.epics?.length > 0 && (
              <div className="card">
                <div className="card-title">Epics & User Stories</div>
                <div className="epics-list">
                  {result.epics.map((epic, i) => (
                    <div key={i} className="epic-card">
                      <div className="epic-header">
                        <span className="epic-name">{epic.name}</span>
                        <div className="epic-meta">
                          <span className={`badge badge-type`}>{epic.type}</span>
                          <span className={`badge badge-role`}>{epic.role}</span>
                          <span className={`badge ${priorityClass(epic.priority)}`}>
                            {epic.priority}
                          </span>
                          {epic.estimated_hours > 0 && (
                            <span className="epic-hours">{epic.estimated_hours}h</span>
                          )}
                        </div>
                      </div>
                      <div className="epic-body">
                        {epic.user_stories?.length > 0 && (
                          <div>
                            <div className="epic-section-title">User Stories</div>
                            <ul className="story-list">
                              {epic.user_stories.map((s, j) => (
                                <li key={j}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {epic.acceptance_criteria?.length > 0 && (
                          <div>
                            <div className="epic-section-title">Acceptance Criteria</div>
                            <ul className="criteria-list">
                              {epic.acceptance_criteria.map((c, j) => (
                                <li key={j}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Architecture ── */}
            <div className="card">
              <div className="card-title">Tech Stack & Architecture</div>
              <div className="stack-list">
                {result.architecture?.stack?.map((tech, i) => (
                  <span key={i} className="stack-tag">{tech}</span>
                ))}
              </div>
              {result.architecture?.description && (
                <p className="arch-desc">{result.architecture.description}</p>
              )}
            </div>

            {/* ── AI Architecture ── */}
            {result.ai_architecture && (
              <div className="card">
                <div className="card-title">AI Architecture</div>
                {result.ai_architecture.components?.length > 0 && (
                  <div className="ai-components">
                    {result.ai_architecture.components.map((comp, i) => (
                      <div key={i} className="ai-component">
                        <div>
                          <strong>{comp.name}</strong>
                          <span>{comp.role}</span>
                        </div>
                        {comp.model && (
                          <span className="ai-model-tag">{comp.model}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {result.ai_architecture.description && (
                  <p className="arch-desc">{result.ai_architecture.description}</p>
                )}
                {result.ai_architecture.data_flow && (
                  <div className="ai-flow">
                    <strong style={{ color: "var(--text)", display: "block", marginBottom: "0.4rem" }}>
                      Data Flow
                    </strong>
                    {result.ai_architecture.data_flow}
                  </div>
                )}
              </div>
            )}

            {/* ── Team & Pay ── */}
            {result.team?.length > 0 && (
              <div className="card">
                <div className="card-title">Team & Compensation</div>
                <table className="team-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Allocation</th>
                      <th>Rate / hr</th>
                      <th>Total Cost</th>
                      <th>Tools</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.team.map((member, i) => (
                      <tr key={i}>
                        <td><strong>{member.role}</strong></td>
                        <td>{member.allocation}</td>
                        <td className="rate-cell">${member.hourly_rate}/hr</td>
                        <td className="cost-cell">${(member.total_cost ?? 0).toLocaleString()}</td>
                        <td>
                          <div className="team-tools">
                            {(member.tools ?? []).map((tool, j) => (
                              <span key={j} className="tool-pill">{tool}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Tools Budget ── */}
            {result.tools?.length > 0 && (
              <div className="card">
                <div className="card-title">Tools & Monthly Budget</div>
                <table className="tools-table">
                  <thead>
                    <tr>
                      <th>Tool</th>
                      <th>Category</th>
                      <th>Purpose</th>
                      <th>$/month</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.tools.map((tool, i) => (
                      <tr key={i}>
                        <td><strong>{tool.name}</strong></td>
                        <td>
                          <span className={`cat-badge ${catClass(tool.category)}`}>
                            {tool.category}
                          </span>
                        </td>
                        <td style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                          {tool.purpose}
                        </td>
                        <td className="cost-cell">
                          {tool.monthly_cost === 0 ? "Free" : `$${tool.monthly_cost}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="tools-total">
                  Total monthly tools cost:{" "}
                  <strong>${totalToolsCost.toLocaleString()}</strong>
                </div>
              </div>
            )}

            {/* ── Estimation ── */}
            {result.estimation && (
              <div className="card">
                <div className="card-title">Hour Estimation by Role</div>
                <div className="estimation-header">
                  <span style={{ color: "var(--muted)", fontSize: "0.88rem" }}>Total hours</span>
                  <span className="total-hours">{result.estimation.total_hours}h</span>
                </div>
                {result.estimation.breakdown?.map((item, i) => (
                  <div key={i} className="breakdown-bar">
                    <div className="bar-label">
                      <span>{item.role}</span>
                      <span>{item.hours}h</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${Math.round((item.hours / maxHours) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Vibe Coding ── */}
            {result.vibe_coding && (
              <div className="card">
                <div className="card-title">Vibe Coding — AI Development Savings</div>
                <div className="vibe-stats">
                  <div className="vibe-stat">
                    <div className="vs-label">Time Saved</div>
                    <div className="vs-value">{result.vibe_coding.time_saved_percent}%</div>
                  </div>
                  <div className="vibe-stat">
                    <div className="vs-label">Fewer Developers</div>
                    <div className="vs-value">{result.vibe_coding.dev_savings_percent}%</div>
                  </div>
                </div>
                {result.vibe_coding.description && (
                  <p className="vibe-desc">{result.vibe_coding.description}</p>
                )}
                {result.vibe_coding.optimizations?.length > 0 && (
                  <>
                    <div className="epic-section-title" style={{ marginBottom: "0.5rem" }}>
                      AI Optimizations
                    </div>
                    <ul className="optim-list">
                      {result.vibe_coding.optimizations.map((opt, i) => (
                        <li key={i}>{opt}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* ── Traditional vs AI Comparison ── */}
            {result.comparison && (
              <div className="card">
                <div className="card-title">Traditional vs AI-Powered Development</div>
                <div className="comparison-grid">
                  <div className="comp-col">
                    <div className="comp-col-title trad">Traditional Approach</div>
                    <div className="comp-row">
                      <span className="c-label">Hours</span>
                      <span className="c-val trad-val">
                        {(result.comparison.traditional?.hours ?? 0).toLocaleString()}h
                      </span>
                    </div>
                    <div className="comp-row">
                      <span className="c-label">Cost</span>
                      <span className="c-val trad-val">
                        ${(result.comparison.traditional?.cost ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="comp-row">
                      <span className="c-label">Team Size</span>
                      <span className="c-val trad-val">
                        {result.comparison.traditional?.team_size} people
                      </span>
                    </div>
                    <div className="comp-row">
                      <span className="c-label">Timeline</span>
                      <span className="c-val trad-val">
                        {result.comparison.traditional?.timeline}
                      </span>
                    </div>
                  </div>
                  <div className="comp-col ai-col">
                    <div className="comp-col-title ai">AI-Powered Approach</div>
                    <div className="comp-row">
                      <span className="c-label">Hours</span>
                      <span className="c-val ai-val">
                        {(result.comparison.ai_powered?.hours ?? 0).toLocaleString()}h
                      </span>
                    </div>
                    <div className="comp-row">
                      <span className="c-label">Cost</span>
                      <span className="c-val ai-val">
                        ${(result.comparison.ai_powered?.cost ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="comp-row">
                      <span className="c-label">Team Size</span>
                      <span className="c-val ai-val">
                        {result.comparison.ai_powered?.team_size} people
                      </span>
                    </div>
                    <div className="comp-row">
                      <span className="c-label">Timeline</span>
                      <span className="c-val ai-val">
                        {result.comparison.ai_powered?.timeline}
                      </span>
                    </div>
                  </div>
                </div>

                {result.comparison.savings && (
                  <div className="savings-banner">
                    <div className="sav-item">
                      <div className="sav-label">Hours Saved</div>
                      <div className="sav-val">
                        {(result.comparison.savings.hours ?? 0).toLocaleString()}h
                      </div>
                    </div>
                    <div className="sav-item">
                      <div className="sav-label">Cost Saved</div>
                      <div className="sav-val">
                        ${(result.comparison.savings.cost ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="sav-item">
                      <div className="sav-label">Savings</div>
                      <div className="sav-val">{result.comparison.savings.percent}%</div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </>
  );
}
