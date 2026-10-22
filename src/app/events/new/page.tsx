'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';

const EVENT_TYPES = [
  { value: 'WEDDING', label: 'Wedding', icon: '💒' },
  { value: 'BIRTHDAY', label: 'Birthday', icon: '🎂' },
  { value: 'COMMUNITY', label: 'Community', icon: '🎪' },
] as const;

type EventType = (typeof EVENT_TYPES)[number]['value'];

type NewEventForm = {
  type: EventType;
  title: string;
  eventDate: string;
  totalBudget: string;
  guestCount: string;
  location: string;
  theme: string;
  notes: string;
};

export default function NewEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createWithAI, setCreateWithAI] = useState(true);
  const [form, setForm] = useState<NewEventForm>({
    type: 'WEDDING',
    title: '',
    eventDate: '',
    totalBudget: '',
    guestCount: '',
    location: '',
    theme: '',
    notes: '',
  });

  const canProceedDetails = useMemo(() => {
    return form.title.trim() && form.eventDate && Number(form.totalBudget) > 0;
  }, [form.title, form.eventDate, form.totalBudget]);

  const setField = (name: keyof NewEventForm, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const applyAiPlan = async (eventId: string) => {
    const aiRes = await fetch('/api/ai/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    });

    if (!aiRes.ok) {
      return;
    }

    const aiData = await aiRes.json();
    const plan = aiData.plan as {
      budgetBreakdown?: Array<{ category: string; amount: number; tips?: string }>;
      milestones?: Array<{ title: string; description?: string; daysBeforeEvent?: number }>;
      vendorCategories?: Array<{ category: string }>;
    };

    const requests: Promise<Response>[] = [];

    for (const item of plan.budgetBreakdown ?? []) {
      requests.push(
        fetch(`/api/events/${eventId}/budget`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: item.category,
            estimated: item.amount,
            description: item.tips ?? '',
            status: 'PENDING',
          }),
        })
      );
    }

    const eventDate = new Date(form.eventDate);
    for (const [idx, milestone] of (plan.milestones ?? []).entries()) {
      const due = new Date(eventDate);
      const offset = Number(milestone.daysBeforeEvent ?? 0);
      due.setDate(due.getDate() - (Number.isFinite(offset) ? offset : 0));

      requests.push(
        fetch(`/api/events/${eventId}/timeline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: milestone.title,
            description: milestone.description ?? '',
            dueDate: due.toISOString(),
            sortOrder: idx,
          }),
        })
      );
    }

    for (const category of plan.vendorCategories ?? []) {
      requests.push(
        fetch(`/api/events/${eventId}/vendors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${category.category} Vendor`,
            category: category.category,
            status: 'RESEARCHING',
          }),
        })
      );
    }

    await Promise.allSettled(requests);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          eventDate: form.eventDate,
          totalBudget: Number(form.totalBudget),
          guestCount: form.guestCount ? Number(form.guestCount) : undefined,
          location: form.location || undefined,
          theme: form.theme || undefined,
          notes: form.notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to create event');
        return;
      }

      if (createWithAI && data.event?.id) {
        await applyAiPlan(data.event.id);
      }

      router.push(`/events/${data.event.id}`);
    } catch {
      setError('Network error while creating event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
        <h1>Create New Event</h1>
        <Link href="/" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="wizard-container">
        <div className="wizard-steps" aria-label="Creation progress">
          <div className={`wizard-step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`wizard-connector ${step >= 2 ? 'active' : ''}`} />
          <div className={`wizard-step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`wizard-connector ${step >= 3 ? 'active' : ''}`} />
          <div className={`wizard-step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        <form className="card" onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <h2>Select Event Type</h2>
              <div className="event-type-grid">
                {EVENT_TYPES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`event-type-card ${form.type === item.value ? 'selected' : ''}`}
                    onClick={() => setField('type', item.value)}
                    aria-pressed={form.type === item.value}
                  >
                    <span className="event-type-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="event-type-name">{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <span />
                <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <h2>Event Details</h2>
              <div className="input-group">
                <label htmlFor="title">Event Title</label>
                <input
                  id="title"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="A dreamy garden wedding"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label htmlFor="eventDate">Event Date</label>
                  <input
                    id="eventDate"
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => setField('eventDate', e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="totalBudget">Total Budget ($)</label>
                  <input
                    id="totalBudget"
                    type="number"
                    min={1}
                    step={1}
                    value={form.totalBudget}
                    onChange={(e) => setField('totalBudget', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label htmlFor="guestCount">Guest Count</label>
                  <input
                    id="guestCount"
                    type="number"
                    min={1}
                    step={1}
                    value={form.guestCount}
                    onChange={(e) => setField('guestCount', e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    value={form.location}
                    onChange={(e) => setField('location', e.target.value)}
                    placeholder="City, venue, or neighborhood"
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="theme">Theme</label>
                <input
                  id="theme"
                  value={form.theme}
                  onChange={(e) => setField('theme', e.target.value)}
                  placeholder="Rustic, Minimal, Tropical, Vintage..."
                />
              </div>

              <div className="input-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="Dietary restrictions, accessibility, goals, constraints..."
                />
              </div>

              <div className="flex justify-between">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setStep(3)}
                  disabled={!canProceedDetails}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6">
              <h2>Review and Create</h2>
              <div className="card" style={{ padding: '1rem' }}>
                <p><strong>Type:</strong> {EVENT_TYPES.find((t) => t.value === form.type)?.label}</p>
                <p><strong>Title:</strong> {form.title}</p>
                <p><strong>Date:</strong> {form.eventDate}</p>
                <p><strong>Budget:</strong> ${Number(form.totalBudget || 0).toLocaleString()}</p>
                <p><strong>Guests:</strong> {form.guestCount || 'Not set'}</p>
                <p><strong>Location:</strong> {form.location || 'Not set'}</p>
                <p><strong>Theme:</strong> {form.theme || 'Not set'}</p>
              </div>

              <label className="flex items-center gap-2" style={{ color: 'var(--clr-text-muted)' }}>
                <input
                  type="checkbox"
                  checked={createWithAI}
                  onChange={(e) => setCreateWithAI(e.target.checked)}
                />
                Auto-generate budget items, milestones, and vendor checklist with AI
              </label>

              {error && (
                <div className="error-msg" role="alert">
                  {error}
                </div>
              )}

              <div className="flex justify-between">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating Event...' : 'Create Event'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
