import { useEffect, useState } from 'react';
import {
  type Application,
  deleteApplication,
  getApplications,
  PLATFORMS,
  updateDate,
  updateStage,
  updateDetails,
  TimelineItem,
  getTimeline,
  addNote,
  updateNote,
  deleteNote,

} from '../api';

const linkButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--pine)',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'IBM Plex Mono, monospace',
  marginRight: 8,
}

function timelineDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-Us', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const PLATFORM_COLORS: Record<string, string> = {
  LinkedIn: "#0A66C2",
  Facebook: "#1877F2",
  Upwork: "#14A800",
  Indeed: "#2164F3",
  Kalibrr: "#2D6CDF",
  Jobstreet: "#0D3880",
  Naukrigulf: "#509e6e",   
  FreeUp: "var(--ink-soft)",      // TODO: add brand hex
  Gigcx: "var(--ink-soft)",       // TODO: add brand hex
  Galasya: "var(--ink-soft)",     // TODO: add brand hex
  BossJob: "var(--ink-soft)",     // TODO: add brand hex
  OnlineJobs: "var(--ink-soft)",  // TODO: add brand hex
  JobsLin: "var(--ink-soft)",     // TODO: add brand hex
  Uplilft: "var(--ink-soft)",     // TODO: add brand hex
  Others: "var(--ink-soft)",
}

function platformColor(platform: string): string {
  const color = PLATFORM_COLORS[platform];

  if (color) {
    return color
  }
  return "var(--ink-soft)";
}

type DetailsDraft = {
  id: number;
  platform: string;
  jobUrl: string;
}

const STAGES = [
  'applied',
  'screen',
  'assessment',
  'interview',
  'final',
  'offer',
  'rejected',
  'ghosted',
];

type MonthGroup = {
  key: string; // "2026-10", used to match and open/close groups
  label: string; // "October 2026", what shows on screen
  apps: Application[];
};

function tabClass(stage: string) {
  if (['interview', 'final', 'offer'].includes(stage)) {
    return 'moving';
  }
  if (['rejected', 'ghosted'].includes(stage)) {
    return 'stalled';
  }

  return 'waiting';
}

// "2026-10" for a date, using your local calendar (not UTC)
function monthKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

// The API sends applications request first, so the months are created
// newest first too and nothing needs sorting here
function groupByMonth(apps: Application[]): MonthGroup[] {
  const groups: MonthGroup[] = [];

  for (const app of apps) {
    const date = new Date(app.dateApplied);
    const key = monthKey(date);

    const existing = groups.find((group) => group.key === key);
    if (existing) {
      existing.apps.push(app);
    } else {
      groups.push({
        key,
        label: date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
        apps: [app],
      });
    }
  }

  return groups;
}

// "2 interview, 1 rejected", in the same order as the STAGES list
function stageSummary(apps: Application[]): string {
  const parts: string[] = [];

  for (const stage of STAGES) {
    const count = apps.filter((app) => app.currentStage === stage).length;

    if (count > 0) {
      parts.push(`${count} ${stage}`);
    }
  }

  return parts.join(', ');
}

function countLabel(count: number): string {
  if (count === 1) {
    return '1 application';
  }

  return `${count} applications`;
}

// (e.g "Sep 14" for the row)
function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function toDateInputValue(iso: string): string {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function ApplicationsList() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Tracks which row (by application id) is currently expanded | null means nothing is expanded
  // null means nothing is expanded
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Which months are open. Starts with only the current month
  const [openMonths, setOpenMonths] = useState<string[]>([
    monthKey(new Date()),
  ]);

  // The platform and link being edited in the open row. null means no edit in progress.
  const [detailsDraft, setDetailsDraft] = useState<DetailsDraft | null>(null);
  const [detailsError, setDetailsError] = useState("");

  // The journal of the open row. appId says which row it belongs to, so a slow
  // load for one row can't show up under another.
  const [timeline, setTimeline] = useState<{ appId: number; items: TimelineItem[] } | null>(null);

  // The text in the "write a note" box
  const [noteDraft, setNoteDraft] = useState('');

  // The note being edited: its id and the text so far. null means none
  const [editingNote, setEditingNote] = useState<{id: number; text: string} | null>(null);

  const [noteError, setNoteError] = useState('');

  async function load() {
    const data = await getApplications();
    setApps(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function loadTimeline(id: number) {
    try {
      const items = await getTimeline(id);
      setTimeline({
        appId: id,
        items
      })
    } catch {
      setTimeline({ appId: id, items: []})
      setNoteError("Couldn't load the journal");
    }
  }

  async function handleAddNote(id: number) {
    const text = noteDraft.trim();

    if (text === '') {
      return;
    }

    try {
      await addNote(id, text);
    } catch {
      setNoteError("Couldn't save the note");
      return
    }

    setNoteDraft('');
    setNoteError('');
    loadTimeline(id);
  }

  async function handleStageChange(id: number, stage: string) {
    await updateStage(id, stage);
    if (expandedId === id) {
      loadTimeline(id);
    }
    load();
  }

  async function handleDateChange(id: number, value: string) {
    if (value === '') {
      return;
    }

    const year = Number(value.slice(0, 4));

    if (year < 2000) {
      return;
    }

    await updateDate(id, value);
    
    // Open the month it moved into
    const newMonth = value.slice(0, 7);
    if (!openMonths.includes(newMonth)) {
      setOpenMonths([...openMonths, newMonth]);
    }
    load();
  }
  async function handleDelete(id: number, company: string) {
    const confirmed = window.confirm(
      `Delete the ${company} application? This can't be undone.`,
    );
    if (!confirmed) {
      return;
    }
    await deleteApplication(id);
    load();
  }

  async function handleDeleteNote(id: number, noteId: number) {
    const confirmed = window.confirm("Delete this note? This can't be undone")

    if (!confirmed) {
      return
    }

    try {
      await deleteNote(id, noteId);
    } catch {
      setNoteError("Couldn't delete the note")
      return
    }

    if (editingNote !== null && editingNote.id === noteId) {
      setEditingNote(null);
    }

    loadTimeline(id);
  }

  async function handleDetailsSave(id: number) {
    if (detailsDraft === null || detailsDraft.id !== id) {
      return;
    }

    const link = detailsDraft.jobUrl.trim();
    if (link !== "" && !link.startsWith("http://") && !link.startsWith("https://")) {
      setDetailsError("The link needs to start with http:// or https://");
      return;
    }

    try {
      await updateDetails(id, detailsDraft.platform, link);
    } catch {
      setDetailsError("Couldn't save the details.")
      return
    }

    setDetailsDraft(null);
    setDetailsError("");
    load();
  }

  async function handleSaveNoteToEdit(id: number) {
    if (editingNote === null) {
      return
    }

    const text = editingNote.text.trim();
    if (text === '') {
      setNoteError("A note can't be empty. Delete it instead");
      return
    }

    try {
      await updateNote(id, editingNote.id, text);
    } catch {
      setNoteError("Couldn't save the change");
      return
    }

    setEditingNote(null);
    setNoteError('');
    loadTimeline(id)
  }

  function toggleExpanded(id: number) {
    // Switching rows, or closing one, drops any unsaved platform/link edit
    setDetailsDraft(null);
    setDetailsError('');
    setNoteDraft('');
    setNoteError('');
    setEditingNote(null);
    setTimeline(null);

    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadTimeline(id);
    }
  }

  function toggleMonth(key: string) {
    if (openMonths.includes(key)) {
      // The group month row is already open, so close it leaving out of the list
      setOpenMonths(openMonths.filter((openKey) => openKey !== key));
    } else {
      setOpenMonths([...openMonths, key]);
    }
  }

  if (loading) {
    return <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>;
  }
  if (apps.length === 0) {
    return (
      <p style={{ color: 'var(--ink-soft)' }}>No applications filed yet.</p>
    );
  }

  const groups = groupByMonth(apps);

  return (
    <div>
      {groups.map((group) => {
        const isMonthOpen = openMonths.includes(group.key);

        let monthSymbol = '+';
        if (isMonthOpen) {
          monthSymbol = '-';
        }

        return (
          <div key={group.key}>
            <div className='month-row' onClick={() => toggleMonth(group.key)}>
              <span className='month-toggle' style={{color: 'var(--pine)'}}>{monthSymbol}</span>
              <span className='month-label'>{group.label}</span>
              <span className='month-count'>
                {countLabel(group.apps.length)}
              </span>
              <span className='month-meta'>{stageSummary(group.apps)}</span>
            </div>

            {isMonthOpen && (
              <div className='month-body'>
                {group.apps.map((app) => {
                  const isExpanded = expandedId === app.id;

                  let toggleSymbol = '+';
                  if (isExpanded) {
                    toggleSymbol = '-';
                  }

                  // What the platform and link inputs show: the draft while you're editing,
                  // otherwise what's saved
                  let platformValue = "";
                  if (app.platform) {
                    platformValue = app.platform;
                  }

                  let linkValue = "";
                  if (app.jobUrl) {
                    linkValue = app.jobUrl;
                  }

                  let isEditingDetails = false;
                  if (detailsDraft !== null && detailsDraft.id === app.id) {
                    platformValue = detailsDraft.platform;
                    linkValue = detailsDraft.jobUrl;
                    isEditingDetails = true;
                  }
                  
                  // Save only appears when there's an edit and a platform is picked
                  let canSaveDetails = false;
                  if (isEditingDetails && platformValue !== "") {
                    canSaveDetails = true;
                  }

                  let openHref = "";
                  if (app.jobUrl && (app.jobUrl.startsWith("http://") || app.jobUrl.startsWith("https://"))) {
                    openHref = app.jobUrl
                  }

                  // The journal for this row, ready once the loaded timeline belongs to it
                  let timelineReady = false;
                  let timelineItems: TimelineItem[] = [];

                  if (timeline !== null && timeline.appId === app.id) {
                    timelineReady = true;
                    timelineItems = timeline.items
                  }

                  return (
                    <div key={app.id}>
                      <div className='ledger-row'>
                        <div className={`tab ${tabClass(app.currentStage)}`} />

                        <span
                          onClick={() => toggleExpanded(app.id)}
                          style={{
                            cursor: 'pointer',
                            fontFamily: 'IBM Plex Mono, monospace',
                            color: 'var(--pine)',
                            width: 14,
                            flexShrink: 0,
                          }}
                        >
                          {toggleSymbol}
                        </span>

                        <div
                          className='ledger-company'
                          title={app.company}
                          onClick={() => toggleExpanded(app.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          {app.company}
                        </div>

                        <div
                          className='ledger-role'
                          title={app.role}
                          onClick={() => toggleExpanded(app.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          {app.role}
                        </div>

                        <div className='ledger-platform'>
                          {app.platform && (
                            <span>
                              <span className='platform-dot' style={{ backgroundColor: platformColor(app.platform)}}
                              />
                              {app.platform}
                            </span>
                          )}
                          {!app.platform && <span style={{ color: "var(--ink-soft)"}}>not set</span>}
                        </div>

                        <div className='ledger-date'>
                          {shortDate(app.dateApplied)}
                        </div>

                        <select
                          className='stage-select'
                          value={app.currentStage}
                          onChange={(e) =>
                            handleStageChange(app.id, e.target.value)
                          }
                        >
                          {STAGES.map((stage) => (
                            <option key={stage} value={stage}>
                              {stage}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleDelete(app.id, app.company)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--rust)',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontFamily: 'IBM Plex Mono, monospace',
                          }}
                          aria-label={`Delete ${app.company} application`}
                        >
                          del
                        </button>
                      </div>

                      {isExpanded && (
                        <div
                          style={{
                            background: 'var(--paper-raised)',
                            border: '1px solid var(--rule)',
                            borderTop: 'none',
                            padding: '16px 20px',
                            fontSize: 14,
                            lineHeight: 1.6,
                          }}
                        >
                          <div
                              style={{
                                marginBottom: 12,
                                fontFamily: 'IBM Plex Mono, monospace',
                                fontSize: 12,
                                color: 'var(--ink-soft)',
                              }}
                            >
                              <label>
                                Applied on{' '}
                                <input
                                  className='date-input'
                                  type='date'
                                  value={toDateInputValue(app.dateApplied)}
                                  onChange={(e) =>
                                    handleDateChange(app.id, e.target.value)
                                  }
                                />
                              </label>
                          </div>
                            
                          <div
                              style={{
                                marginBottom: 12,
                                fontFamily: "IBM Plex Mono, monospace",
                                fontSize: 12,
                                color: "var(--ink-soft)",
                              }}
                            > 
                              <label>
                                Platform{" "}
                                <select
                                  className='detail-input'
                                  value={platformValue}
                                  onChange={(e) => setDetailsDraft({ id: app.id, platform: e.target.value, jobUrl: linkValue})}
                                >
                                  <option value="">Select Platform</option>
                                  {PLATFORMS.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                  ))}
                                </select>
                              </label>
                          </div>

                          <div
                            style={{
                              marginBottom: 12,
                              fontFamily: "IBM Plex Mono, monospace",
                              fontSize: 12,
                              color: "var(--ink-soft)"
                            }}>
                            <label>
                              Link{" "}
                              <input
                                className='detail-input'
                                style={{ width: 280 }}
                                placeholder='https://...'
                                value={linkValue}
                                onChange={(e) => setDetailsDraft({ id: app.id, platform: platformValue, jobUrl: e.target.value})}
                              />
                            </label>
                            {canSaveDetails && (
                              <button
                                onClick={() => handleDetailsSave(app.id)}
                                style={{
                                  marginLeft: 8,
                                  background: "transparent",
                                  border: "none",
                                  color: "var(--pine)",
                                  cursor: "pointer",
                                  fontSize: 12,
                                  fontFamily: "IBM Plex Mono, monospace",
                                }}
                              >
                                save
                              </button>
                            )}
                            {openHref !== "" && (
                              <a
                                href={openHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ marginLeft: 8, color: "var(--pine)" }}
                              >
                                open
                              </a>
                            )}
                          </div>
                          {detailsError !== "" && (
                            <p style={{ color: "var(--rust)", fontSize: 12, margin: "0 0 12px" }}>{detailsError}</p>
                          )}
    
                          <div style={{ marginBottom: 12 }}>
                            <div
                              style={{
                                fontFamily: 'Fraunces, serif',
                                
                                fontSize: 13,
                                color: 'var(--ink-soft)',
                                marginBottom: 6,
                              }}
                            >
                              Journal (notes)
                            </div>

                            {!timelineReady && (
                              <p style={{ color: 'var(--ink-soft)', fontSize: 12, margin: 0 }}>Loading journal...</p>
                            )}

                            {timelineReady && (
                              <div style={{ maxHeight: 220, overflow: 'auto' }}>
                                {timelineItems.map((item) => {
                                  let isEditingThis = false;
                                  let editText = '';
                                  if (editingNote !== null && item.kind === 'note' && editingNote.id === item.id) {
                                    isEditingThis = true;
                                    editText = editingNote.text;
                                  }

                                  return (
                                    <div
                                      key={`${item.kind}-${item.id}`}
                                      style={{
                                        display: 'flex',
                                        gap: 12,
                                        padding: '6px 0',
                                        borderBottom: '1px dotted var(--rule)',
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontFamily: 'IBM Plex Mono, monospace',
                                          fontSize: 12,
                                          color: 'var(--ink-soft)',
                                          width: 96,
                                          flexShrink: 0,
                                        }}
                                      >
                                        {timelineDate(item.date)}
                                      </div>

                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        {item.kind === 'stage' && (
                                          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>
                                            <span
                                              className={`tab ${tabClass(item.text)}`}
                                              style={{ display: 'inline-block', height: 12, marginRight: 8 }}
                                            />
                                            {item.text}
                                          </span>
                                        )}

                                        {item.kind === 'note' && !isEditingThis && (
                                          <div style={{ whiteSpace: 'pre-wrap' }}>{item.text}</div>
                                        )}

                                        {item.kind === 'note' && isEditingThis && (
                                          <div>
                                            <textarea
                                              className='detail-input'
                                              style={{ width: '100%', minHeight: 56, resize: 'vertical' }}
                                              value={editText}
                                              onChange={(e) => setEditingNote({ id: item.id, text: e.target.value })}
                                            />
                                            <button onClick={() => handleSaveNoteToEdit(app.id)} style={linkButtonStyle}>
                                              save
                                            </button>
                                            <button onClick={() => setEditingNote(null)} style={linkButtonStyle}>
                                              cancel
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      {item.kind === 'note' && !isEditingThis && (
                                        <div style={{ flexShrink: 0 }}>
                                          <button
                                            onClick={() => setEditingNote({ id: item.id, text: item.text })}
                                            style={linkButtonStyle}
                                          >
                                            edit
                                          </button>
                                          <button
                                            onClick={() => handleDeleteNote(app.id, item.id)}
                                            style={{ ...linkButtonStyle, color: 'var(--rust)', marginRight: 0 }}
                                          >
                                            del
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <div style={{ marginTop: 8 }}>
                              <textarea
                                className='detail-input'
                                style={{ width: '100%', minHeight: 20, resize: 'vertical' }}
                                placeholder='Write what happened...'
                                value={noteDraft}
                                onChange={(e) => setNoteDraft(e.target.value)}
                              />
                              <button onClick={() => handleAddNote(app.id)} style={linkButtonStyle}>
                                add note
                              </button>
                            </div>

                            {noteError !== '' && (
                              <p style={{ color: 'var(--rust)', fontSize: 12, margin: '6px 0 0' }}>{noteError}</p>
                            )}
                          </div>
                          <div
                              style={{
                                whiteSpace: 'pre-wrap',
                                maxHeight: 300,
                                overflow: 'auto',
                              }}
                            >
                              {app.jobDescription}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
