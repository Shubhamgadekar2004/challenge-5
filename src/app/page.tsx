'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  type: string;
  totalBudget: number;
  eventDate: string;
  status: string;
  guestCount?: number;
  location?: string;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/login');
      return;
    }
    fetchEvents();
  }, [session, status, router]);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || (!session && status !== 'unauthenticated')) {
    return (
      <div className="container" style={{ paddingTop: '4rem' }}>
        <div className="skeleton skeleton-title" />
        <div className="grid grid-cols-3 gap-6">
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
      </div>
    );
  }

  const typeEmoji: Record<string, string> = {
    WEDDING: '💒',
    BIRTHDAY: '🎂',
    COMMUNITY: '🎪',
  };

  const statusBadge: Record<string, string> = {
    PLANNING: 'badge-info',
    IN_PROGRESS: 'badge-warning',
    COMPLETED: 'badge-success',
  };

  const totalBudget = events.reduce((sum, e) => sum + e.totalBudget, 0);
  const planning = events.filter((e) => e.status === 'PLANNING').length;
  const inProgress = events.filter((e) => e.status === 'IN_PROGRESS').length;
  const completed = events.filter((e) => e.status === 'COMPLETED').length;

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <span className="navbar-brand">🎉 CelebPlan AI</span>
        <ul className="navbar-links">
          <li><Link href="/" className="active">Dashboard</Link></li>
          <li><Link href="/events/new">+ New Event</Link></li>
          <li>
            <button className="btn btn-sm btn-secondary" onClick={() => signOut()}>
              Log Out
            </button>
          </li>
        </ul>
      </nav>

      <div className="container">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <h1>Welcome, {session?.user?.name || 'Planner'}! 👋</h1>
          <p>Your event planning dashboard — powered by AI</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{events.length}</div>
            <div className="stat-label">Total Events</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{planning}</div>
            <div className="stat-label">Planning</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">${totalBudget.toLocaleString()}</div>
            <div className="stat-label">Total Budget</div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
          <h2>Your Events</h2>
          <Link href="/events/new" className="btn btn-primary">
            + Create Event
          </Link>
        </div>

        {loading ? (
          <div className="events-grid">
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </div>
        ) : events.length === 0 ? (
          <div className="card text-center" style={{ padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h3>No events yet</h3>
            <p style={{ marginBottom: '1.5rem' }}>
              Create your first event and let AI help you plan it!
            </p>
            <Link href="/events/new" className="btn btn-primary btn-lg">
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <Link href={`/events/${event.id}`} key={event.id}>
                <div className="event-card">
                  <div className="event-card-header">
                    <div>
                      <span style={{ fontSize: '1.5rem' }}>
                        {typeEmoji[event.type] || '📅'}
                      </span>
                      <h3 style={{ marginTop: '0.5rem' }}>{event.title}</h3>
                    </div>
                    <span className={`badge ${statusBadge[event.status] || 'badge-info'}`}>
                      {event.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="event-card-meta">
                    <span>📅 {new Date(event.eventDate).toLocaleDateString()}</span>
                    <span>💰 ${event.totalBudget.toLocaleString()}</span>
                    {event.guestCount && <span>👥 {event.guestCount} guests</span>}
                    {event.location && <span>📍 {event.location}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
