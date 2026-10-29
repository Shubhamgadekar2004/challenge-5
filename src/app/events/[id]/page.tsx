'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type BudgetItem = {
  id: string;
  category: string;
  description?: string | null;
  estimated?: number | null;
  actual?: number | null;
  status: string;
};

type Milestone = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  completed: boolean;
  sortOrder?: number | null;
};

type Vendor = {
  id: string;
  name: string;
  category: string;
  contact?: string | null;
  email?: string | null;
  quotedPrice?: number | null;
  status: string;
  notes?: string | null;
};

type EventRecord = {
  id: string;
  title: string;
  type: string;
  totalBudget: number;
  eventDate: string;
  location?: string | null;
  guestCount?: number | null;
  theme?: string | null;
  notes?: string | null;
  status: string;
  budgetItems: BudgetItem[];
  milestones: Milestone[];
  vendors: Vendor[];
};

type ChatMessage = { role: 'user' | 'assistant'; text: string };

const VENDOR_STATUSES = ['RESEARCHING', 'CONTACTED', 'BOOKED', 'CONFIRMED', 'CANCELLED'] as const;

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = params?.id;

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [budgetDraft, setBudgetDraft] = useState({ category: '', estimated: '', actual: '', description: '' });
  const [milestoneDraft, setMilestoneDraft] = useState({ title: '', dueDate: '', description: '' });
  const [vendorDraft, setVendorDraft] = useState({ name: '', category: '', quotedPrice: '', contact: '', email: '' });

  const [ideasCategory, setIdeasCategory] = useState('decor and theme');
  const [ideas, setIdeas] = useState<Array<{ idea: string; description: string; estimatedCost: string }>>([]);
  const [budgetOptimization, setBudgetOptimization] = useState<{
    savings: Array<{ category: string; suggestion: string; potentialSaving: number }>;
    totalPotentialSaving: number;
  } | null>(null);
  const [vendorSuggestions, setVendorSuggestions] = useState<{
    vendors: Array<{ category: string; priority: string; notes: string; suggestedBudgetRange: string }>;
  } | null>(null);

  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Share your event planning question and I will help with practical next steps.' },
  ]);

  const [busyAction, setBusyAction] = useState('');

  const totals = useMemo(() => {
    const estimated = event?.budgetItems.reduce((sum, item) => sum + (item.estimated ?? 0), 0) ?? 0;
    const actual = event?.budgetItems.reduce((sum, item) => sum + (item.actual ?? 0), 0) ?? 0;
    return { estimated, actual, remaining: (event?.totalBudget ?? 0) - actual };
  }, [event]);

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    setError('');
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to load event');
        setLoading(false);
        return;
      }
      setEvent(data.event);
    } catch {
      setError('Network error while loading event');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  const addBudgetItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    const res = await fetch(`/api/events/${eventId}/budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: budgetDraft.category,
        estimated: budgetDraft.estimated ? Number(budgetDraft.estimated) : undefined,
        actual: budgetDraft.actual ? Number(budgetDraft.actual) : undefined,
        description: budgetDraft.description || undefined,
      }),
    });

    if (res.ok) {
      setBudgetDraft({ category: '', estimated: '', actual: '', description: '' });
      await loadEvent();
    }
  };

  const addMilestone = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    const sortOrder = event?.milestones.length ?? 0;
    const res = await fetch(`/api/events/${eventId}/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: milestoneDraft.title,
        description: milestoneDraft.description || undefined,
        dueDate: milestoneDraft.dueDate || undefined,
        sortOrder,
      }),
    });

    if (res.ok) {
      setMilestoneDraft({ title: '', dueDate: '', description: '' });
      await loadEvent();
    }
  };

  const toggleMilestone = async (item: Milestone) => {
    if (!eventId) return;
    await fetch(`/api/events/${eventId}/timeline`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id, completed: !item.completed }),
    });
    await loadEvent();
  };

  const addVendor = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    const res = await fetch(`/api/events/${eventId}/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: vendorDraft.name,
        category: vendorDraft.category,
        quotedPrice: vendorDraft.quotedPrice ? Number(vendorDraft.quotedPrice) : undefined,
        contact: vendorDraft.contact || undefined,
        email: vendorDraft.email || undefined,
      }),
    });

    if (res.ok) {
      setVendorDraft({ name: '', category: '', quotedPrice: '', contact: '', email: '' });
      await loadEvent();
    }
  };

  const updateVendorStatus = async (vendor: Vendor, status: (typeof VENDOR_STATUSES)[number]) => {
    if (!eventId) return;
    await fetch(`/api/events/${eventId}/vendors`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: vendor.id, status }),
    });
    await loadEvent();
  };

  const runGeneratePlan = async () => {
    if (!eventId) return;
    setBusyAction('generate-plan');
    try {
      const res = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (!res.ok) return;

      const requests: Promise<Response>[] = [];
      for (const item of data.plan?.budgetBreakdown ?? []) {
        requests.push(
          fetch(`/api/events/${eventId}/budget`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category: item.category,
              estimated: item.amount,
              description: item.tips,
            }),
          })
        );
      }

      for (const [index, m] of (data.plan?.milestones ?? []).entries()) {
        requests.push(
          fetch(`/api/events/${eventId}/timeline`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: m.title,
              description: m.description,
              sortOrder: index,
            }),
          })
        );
      }

      for (const v of data.plan?.vendorCategories ?? []) {
        requests.push(
          fetch(`/api/events/${eventId}/vendors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `${v.category} Vendor`,
              category: v.category,
            }),
          })
        );
      }

      await Promise.allSettled(requests);
      await loadEvent();
    } finally {
      setBusyAction('');
    }
  };

  const runSuggestIdeas = async () => {
    if (!eventId) return;
    setBusyAction('ideas');
    try {
      const res = await fetch('/api/ai/suggest-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, category: ideasCategory }),
      });
      const data = await res.json();
      if (res.ok) {
        setIdeas(data.ideas ?? []);
      }
    } finally {
      setBusyAction('');
    }
  };

  const runBudgetOptimize = async () => {
    if (!eventId) return;
    setBusyAction('optimize');
    try {
      const res = await fetch('/api/ai/budget-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (res.ok) {
        setBudgetOptimization(data.optimization);
      }
    } finally {
      setBusyAction('');
    }
  };

  const runVendorRecommend = async () => {
    if (!eventId) return;
    setBusyAction('vendors');
    try {
      const res = await fetch('/api/ai/vendor-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (res.ok) {
        setVendorSuggestions(data.recommendations);
      }
    } finally {
      setBusyAction('');
    }
  };

  const sendChat = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventId || !chatInput.trim() || chatLoading) return;

    const nextUser = { role: 'user' as const, text: chatInput.trim() };
    setChat((prev) => [...prev, nextUser]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, message: nextUser.text }),
      });
      const data = await res.json();
      if (res.ok) {
        setChat((prev) => [...prev, { role: 'assistant', text: data.response }]);
      } else {
        setChat((prev) => [...prev, { role: 'assistant', text: data.error || 'Unable to answer right now.' }]);
      }
    } catch {
      setChat((prev) => [...prev, { role: 'assistant', text: 'Network error while contacting AI assistant.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-card" style={{ marginBottom: '1rem' }} />
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <Link href="/" className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
          Back
        </Link>
        <div className="error-msg" role="alert">
          {error || 'Event not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>{event.title}</h1>
          <p>
            {event.type} · {new Date(event.eventDate).toLocaleDateString()} · ${event.totalBudget.toLocaleString()}
          </p>
        </div>
        <Link href="/" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-value">${totals.estimated.toLocaleString()}</div>
          <div className="stat-label">Estimated Spend</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${totals.actual.toLocaleString()}</div>
          <div className="stat-label">Actual Spend</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{event.milestones.filter((m) => m.completed).length}/{event.milestones.length}</div>
          <div className="stat-label">Milestones Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{event.vendors.length}</div>
          <div className="stat-label">Vendors</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6" style={{ alignItems: 'start' }}>
        <section className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
            <h2>Budget Tracker</h2>
            <button className="btn btn-secondary btn-sm" onClick={runBudgetOptimize} disabled={busyAction === 'optimize'}>
              {busyAction === 'optimize' ? 'Optimizing...' : 'AI Optimize'}
            </button>
          </div>

          <form className="grid grid-cols-2 gap-4" onSubmit={addBudgetItem}>
            <input
              placeholder="Category"
              value={budgetDraft.category}
              onChange={(e) => setBudgetDraft((prev) => ({ ...prev, category: e.target.value }))}
              required
            />
            <input
              type="number"
              min={0}
              placeholder="Estimated"
              value={budgetDraft.estimated}
              onChange={(e) => setBudgetDraft((prev) => ({ ...prev, estimated: e.target.value }))}
            />
            <input
              type="number"
              min={0}
              placeholder="Actual"
              value={budgetDraft.actual}
              onChange={(e) => setBudgetDraft((prev) => ({ ...prev, actual: e.target.value }))}
            />
            <button className="btn btn-primary" type="submit">Add Item</button>
          </form>

          {event.budgetItems.length === 0 ? (
            <p style={{ marginTop: '1rem' }}>No budget items yet.</p>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              {event.budgetItems.map((item) => (
                <div key={item.id} className="budget-item">
                  <div>
                    <strong>{item.category}</strong>
                    <p>{item.description || 'No notes'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>Est: ${(item.estimated ?? 0).toLocaleString()}</div>
                    <div>Act: ${(item.actual ?? 0).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {budgetOptimization && (
            <div className="card" style={{ marginTop: '1rem', padding: '1rem' }}>
              <h3>Potential Savings: ${budgetOptimization.totalPotentialSaving.toLocaleString()}</h3>
              {budgetOptimization.savings.map((item, idx) => (
                <p key={`${item.category}-${idx}`}>
                  <strong>{item.category}:</strong> {item.suggestion} (${item.potentialSaving.toLocaleString()})
                </p>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2 style={{ marginBottom: '1rem' }}>Timeline & Milestones</h2>

          <form className="grid grid-cols-2 gap-4" onSubmit={addMilestone}>
            <input
              placeholder="Milestone title"
              value={milestoneDraft.title}
              onChange={(e) => setMilestoneDraft((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <input
              type="date"
              value={milestoneDraft.dueDate}
              onChange={(e) => setMilestoneDraft((prev) => ({ ...prev, dueDate: e.target.value }))}
            />
            <input
              placeholder="Description"
              value={milestoneDraft.description}
              onChange={(e) => setMilestoneDraft((prev) => ({ ...prev, description: e.target.value }))}
            />
            <button className="btn btn-primary" type="submit">Add Milestone</button>
          </form>

          <div className="timeline" style={{ marginTop: '1rem' }}>
            {event.milestones.length === 0 ? (
              <p>No milestones yet.</p>
            ) : (
              event.milestones.map((item) => (
                <div key={item.id} className={`milestone-card ${item.completed ? 'completed' : ''}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description || 'No description'}</p>
                      <p>{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No due date'}</p>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => toggleMilestone(item)}>
                      {item.completed ? 'Reopen' : 'Complete'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-6" style={{ marginTop: '1.5rem', alignItems: 'start' }}>
        <section className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
            <h2>Vendor Checklist</h2>
            <button className="btn btn-secondary btn-sm" onClick={runVendorRecommend} disabled={busyAction === 'vendors'}>
              {busyAction === 'vendors' ? 'Thinking...' : 'AI Recommend'}
            </button>
          </div>

          <form className="grid grid-cols-2 gap-4" onSubmit={addVendor}>
            <input
              placeholder="Vendor name"
              value={vendorDraft.name}
              onChange={(e) => setVendorDraft((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <input
              placeholder="Category"
              value={vendorDraft.category}
              onChange={(e) => setVendorDraft((prev) => ({ ...prev, category: e.target.value }))}
              required
            />
            <input
              placeholder="Contact"
              value={vendorDraft.contact}
              onChange={(e) => setVendorDraft((prev) => ({ ...prev, contact: e.target.value }))}
            />
            <input
              type="email"
              placeholder="Email"
              value={vendorDraft.email}
              onChange={(e) => setVendorDraft((prev) => ({ ...prev, email: e.target.value }))}
            />
            <input
              type="number"
              min={0}
              placeholder="Quoted Price"
              value={vendorDraft.quotedPrice}
              onChange={(e) => setVendorDraft((prev) => ({ ...prev, quotedPrice: e.target.value }))}
            />
            <button className="btn btn-primary" type="submit">Add Vendor</button>
          </form>

          <div style={{ marginTop: '1rem' }}>
            {event.vendors.length === 0 ? (
              <p>No vendors added yet.</p>
            ) : (
              event.vendors.map((vendor) => (
                <div className="vendor-card" key={vendor.id}>
                  <div>
                    <h3>{vendor.name}</h3>
                    <p>{vendor.category}</p>
                    <p>{vendor.quotedPrice ? `$${vendor.quotedPrice.toLocaleString()}` : 'No quote'}</p>
                  </div>
                  <select
                    value={vendor.status}
                    onChange={(e) => updateVendorStatus(vendor, e.target.value as (typeof VENDOR_STATUSES)[number])}
                  >
                    {VENDOR_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              ))
            )}
          </div>

          {vendorSuggestions && (
            <div className="card" style={{ marginTop: '1rem', padding: '1rem' }}>
              <h3>AI Vendor Categories</h3>
              {vendorSuggestions.vendors.map((item, idx) => (
                <p key={`${item.category}-${idx}`}>
                  <strong>{item.category}</strong> ({item.priority}) - {item.suggestedBudgetRange}
                </p>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-6">
          <div className="card">
            <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
              <h2>AI Planner Actions</h2>
              <button className="btn btn-primary btn-sm" onClick={runGeneratePlan} disabled={busyAction === 'generate-plan'}>
                {busyAction === 'generate-plan' ? 'Generating...' : 'Generate Full Plan'}
              </button>
            </div>

            <div className="flex gap-4 items-center">
              <input
                value={ideasCategory}
                onChange={(e) => setIdeasCategory(e.target.value)}
                placeholder="Ideas category"
              />
              <button className="btn btn-secondary" onClick={runSuggestIdeas} disabled={busyAction === 'ideas'}>
                {busyAction === 'ideas' ? 'Generating...' : 'Suggest Ideas'}
              </button>
            </div>

            {ideas.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                {ideas.map((item, idx) => (
                  <div key={`${item.idea}-${idx}`} className="card" style={{ marginBottom: '0.75rem', padding: '0.75rem' }}>
                    <h3>{item.idea}</h3>
                    <p>{item.description}</p>
                    <p>{item.estimatedCost}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ai-chat-container">
            <div className="ai-chat-header">
              <strong>AI Event Assistant</strong>
            </div>
            <div className="ai-chat-messages">
              {chat.map((msg, idx) => (
                <div key={`${msg.role}-${idx}`} className={`ai-message ${msg.role}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <form className="ai-chat-input" onSubmit={sendChat}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about timeline, budget, vendors, or ideas..."
              />
              <button className="btn btn-primary" type="submit" disabled={chatLoading}>
                {chatLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
