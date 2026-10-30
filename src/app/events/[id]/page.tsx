/**
 * @file Event detail dashboard for budgets, milestones, vendors, and AI planning tools.
 * @module app/events/[id]
 */
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import type { BudgetItem, EventRecord, Milestone, Vendor } from '@/types';
import { EventDetailDashboard } from '@/components/event-detail';

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
  const [chat, setChat] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: 'Share your event planning question and I will help with practical next steps.' },
  ]);

  const [busyAction, setBusyAction] = useState('');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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

  useEffect(() => {
    if (!event?.eventDate) return;

    const updateCountdown = () => {
      const diff = new Date(event.eventDate).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [event?.eventDate]);

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

  const updateVendorStatus = async (vendor: Vendor, status: string) => {
    if (!eventId) return;
    await fetch(`/api/events/${eventId}/vendors`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: vendor.id, status }),
    });
    await loadEvent();
  };

  const exportBudgetCsv = () => {
    if (!event?.budgetItems.length) return;

    const rows = [
      ['Category', 'Description', 'Estimated', 'Actual', 'Status'],
      ...event.budgetItems.map((item) => [
        item.category,
        item.description ?? '',
        String(item.estimated ?? ''),
        String(item.actual ?? ''),
        item.status,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${event.title.toLowerCase().replace(/\s+/g, '-')}-budget.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
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
    <EventDetailDashboard
      event={event}
      totals={totals}
      countdown={countdown}
      budgetDraft={budgetDraft}
      milestoneDraft={milestoneDraft}
      vendorDraft={vendorDraft}
      ideasCategory={ideasCategory}
      ideas={ideas}
      budgetOptimization={budgetOptimization}
      vendorSuggestions={vendorSuggestions}
      chat={chat}
      chatInput={chatInput}
      chatLoading={chatLoading}
      busyAction={busyAction}
      setBudgetDraft={setBudgetDraft}
      setMilestoneDraft={setMilestoneDraft}
      setVendorDraft={setVendorDraft}
      setIdeasCategory={setIdeasCategory}
      setChatInput={setChatInput}
      onAddBudgetItem={addBudgetItem}
      onAddMilestone={addMilestone}
      onAddVendor={addVendor}
      onToggleMilestone={toggleMilestone}
      onUpdateVendorStatus={updateVendorStatus}
      onRunBudgetOptimize={runBudgetOptimize}
      onRunGeneratePlan={runGeneratePlan}
      onRunSuggestIdeas={runSuggestIdeas}
      onRunVendorRecommend={runVendorRecommend}
      onSendChat={sendChat}
      onExportBudgetCsv={exportBudgetCsv}
    />
  );
}
