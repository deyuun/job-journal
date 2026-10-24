import { useEffect, useState } from 'react';
import {
  type Application,
  deleteApplication,
  getApplications,
  updateDate,
  updateStage,
} from '../api';

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

  async function load() {
    const data = await getApplications();
    setApps(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStageChange(id: number, stage: string) {
    await updateStage(id, stage);
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

  function toggleExpanded(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
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
                          onClick={() => toggleExpanded(app.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          {app.company}
                        </div>

                        <div
                          className='ledger-role'
                          onClick={() => toggleExpanded(app.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          {app.role}
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
                              whiteSpace: 'pre-wrap',
                              maxHeight: 220,
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
