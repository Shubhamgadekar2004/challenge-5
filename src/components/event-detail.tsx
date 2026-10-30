import Link from 'next/link';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import type { EventRecord } from '@/types';

type CountdownState = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type BudgetDraft = {
  category: string;
  estimated: string;
  actual: string;
  description: string;
};

type MilestoneDraft = {
  title: string;
  dueDate: string;
  description: string;
};

type VendorDraft = {
  name: string;
  category: string;
  quotedPrice: string;
  contact: string;
  email: string;
};

type EventDetailDashboardProps = {
  event: EventRecord;
  totals: { estimated: number; actual: number; remaining: number };
  countdown: CountdownState;
  budgetDraft: BudgetDraft;
  milestoneDraft: MilestoneDraft;
  vendorDraft: VendorDraft;
  ideasCategory: string;
  ideas: Array<{ idea: string; description: string; estimatedCost: string }>;
  budgetOptimization: {
    savings: Array<{ category: string; suggestion: string; potentialSaving: number }>;
    totalPotentialSaving: number;
  } | null;
  vendorSuggestions: {
    vendors: Array<{ category: string; priority: string; notes: string; suggestedBudgetRange: string }>;
  } | null;
  chat: Array<{ role: 'user' | 'assistant'; text: string }>;
  chatInput: string;
  chatLoading: boolean;
  busyAction: string;
  setBudgetDraft: Dispatch<SetStateAction<BudgetDraft>>;
  setMilestoneDraft: Dispatch<SetStateAction<MilestoneDraft>>;
  setVendorDraft: Dispatch<SetStateAction<VendorDraft>>;
  setIdeasCategory: Dispatch<SetStateAction<string>>;
  setChatInput: Dispatch<SetStateAction<string>>;
  onAddBudgetItem: (e: FormEvent) => void;
  onAddMilestone: (e: FormEvent) => void;
  onAddVendor: (e: FormEvent) => void;
  onToggleMilestone: (item: EventRecord['milestones'][number]) => void;
  onUpdateVendorStatus: (vendor: EventRecord['vendors'][number], status: string) => void;
  onRunBudgetOptimize: () => void;
  onRunGeneratePlan: () => void;
  onRunSuggestIdeas: () => void;
  onRunVendorRecommend: () => void;
  onSendChat: (e: FormEvent) => void;
  onExportBudgetCsv: () => void;
};

export function EventDetailDashboard({
  event,
  totals,
  countdown,
  budgetDraft,
  milestoneDraft,
  vendorDraft,
  ideasCategory,
  ideas,
  budgetOptimization,
  vendorSuggestions,
  chat,
  chatInput,
  chatLoading,
  busyAction,
  setBudgetDraft,
  setMilestoneDraft,
  setVendorDraft,
  setIdeasCategory,
  setChatInput,
  onAddBudgetItem,
  onAddMilestone,
  onAddVendor,
  onToggleMilestone,
  onUpdateVendorStatus,
  onRunBudgetOptimize,
  onRunGeneratePlan,
  onRunSuggestIdeas,
  onRunVendorRecommend,
  onSendChat,
  onExportBudgetCsv,
}: EventDetailDashboardProps) {
  const vendorStatusOptions = ['RESEARCHING', 'CONTACTED', 'BOOKED', 'CONFIRMED', 'CANCELLED'] as const;

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

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div className="flex items-center justify-between gap-4" style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Countdown to Event</h2>
          <span className="badge badge-info">{new Date(event.eventDate).toLocaleDateString()}</span>
        </div>
        <div className="countdown" aria-live="polite">
          {[
            ['Days', countdown.days],
            ['Hours', countdown.hours],
            ['Minutes', countdown.minutes],
            ['Seconds', countdown.seconds],
          ].map(([label, value]) => (
            <div key={label as string} className="countdown-item">
              <span className="countdown-value">{value}</span>
              <span className="countdown-label">{label}</span>
            </div>
          ))}
        </div>
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
          <div className="stat-value">
            {event.milestones.filter((m) => m.completed).length}/{event.milestones.length}
          </div>
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
            <div className="flex gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={onRunBudgetOptimize}
                disabled={busyAction === 'optimize'}
                role="status"
                aria-live="polite"
              >
                {busyAction === 'optimize' ? 'Optimizing...' : 'AI Optimize'}
              </button>
              <button className="btn btn-secondary btn-sm" type="button" onClick={onExportBudgetCsv}>
                Export CSV
              </button>
            </div>
          </div>

          <form className="grid grid-cols-2 gap-4" onSubmit={onAddBudgetItem}>
            <div className="field">
              <label htmlFor="budget-category">Category</label>
              <input
                id="budget-category"
                value={budgetDraft.category}
                onChange={(e) => setBudgetDraft((prev) => ({ ...prev, category: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="budget-estimated">Estimated</label>
              <input
                id="budget-estimated"
                type="number"
                min={0}
                value={budgetDraft.estimated}
                onChange={(e) => setBudgetDraft((prev) => ({ ...prev, estimated: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="budget-actual">Actual</label>
              <input
                id="budget-actual"
                type="number"
                min={0}
                value={budgetDraft.actual}
                onChange={(e) => setBudgetDraft((prev) => ({ ...prev, actual: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="budget-description">Notes</label>
              <input
                id="budget-description"
                value={budgetDraft.description}
                onChange={(e) => setBudgetDraft((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <button className="btn btn-primary" type="submit">
              Add Item
            </button>
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

          <form className="grid grid-cols-2 gap-4" onSubmit={onAddMilestone}>
            <div className="field">
              <label htmlFor="milestone-title">Title</label>
              <input
                id="milestone-title"
                value={milestoneDraft.title}
                onChange={(e) => setMilestoneDraft((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="milestone-date">Due date</label>
              <input
                id="milestone-date"
                type="date"
                value={milestoneDraft.dueDate}
                onChange={(e) => setMilestoneDraft((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="milestone-description">Description</label>
              <input
                id="milestone-description"
                value={milestoneDraft.description}
                onChange={(e) => setMilestoneDraft((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <button className="btn btn-primary" type="submit">
              Add Milestone
            </button>
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
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onToggleMilestone(item)}
                      role="status"
                      aria-live="polite"
                    >
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
            <button
              className="btn btn-secondary btn-sm"
              onClick={onRunVendorRecommend}
              disabled={busyAction === 'vendors'}
              role="status"
              aria-live="polite"
            >
              {busyAction === 'vendors' ? 'Thinking...' : 'AI Recommend'}
            </button>
          </div>

          <form className="grid grid-cols-2 gap-4" onSubmit={onAddVendor}>
            <div className="field">
              <label htmlFor="vendor-name">Vendor name</label>
              <input
                id="vendor-name"
                value={vendorDraft.name}
                onChange={(e) => setVendorDraft((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="vendor-category">Category</label>
              <input
                id="vendor-category"
                value={vendorDraft.category}
                onChange={(e) => setVendorDraft((prev) => ({ ...prev, category: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="vendor-contact">Contact</label>
              <input
                id="vendor-contact"
                value={vendorDraft.contact}
                onChange={(e) => setVendorDraft((prev) => ({ ...prev, contact: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="vendor-email">Email</label>
              <input
                id="vendor-email"
                type="email"
                value={vendorDraft.email}
                onChange={(e) => setVendorDraft((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="vendor-price">Quoted price</label>
              <input
                id="vendor-price"
                type="number"
                min={0}
                value={vendorDraft.quotedPrice}
                onChange={(e) => setVendorDraft((prev) => ({ ...prev, quotedPrice: e.target.value }))}
              />
            </div>
            <button className="btn btn-primary" type="submit">
              Add Vendor
            </button>
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
                  <div>
                    <label htmlFor={`vendor-status-${vendor.id}`}>Status</label>
                    <select
                      id={`vendor-status-${vendor.id}`}
                      value={vendor.status}
                      aria-label={`Vendor status for ${vendor.name}`}
                      onChange={(e) => onUpdateVendorStatus(vendor, e.target.value)}
                    >
                      {vendorStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
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
              <button
                className="btn btn-primary btn-sm"
                onClick={onRunGeneratePlan}
                disabled={busyAction === 'generate-plan'}
                role="status"
                aria-live="polite"
              >
                {busyAction === 'generate-plan' ? 'Generating...' : 'Generate Full Plan'}
              </button>
            </div>

            <div className="flex gap-4 items-center">
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="ideas-category">Ideas category</label>
                <input
                  id="ideas-category"
                  value={ideasCategory}
                  onChange={(e) => setIdeasCategory(e.target.value)}
                  placeholder="Ideas category"
                />
              </div>
              <button
                className="btn btn-secondary"
                onClick={onRunSuggestIdeas}
                disabled={busyAction === 'ideas'}
                role="status"
                aria-live="polite"
              >
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
            <div className="ai-chat-messages" aria-live="polite" aria-atomic="false">
              {chat.map((msg, idx) => (
                <div key={`${msg.role}-${idx}`} className={`ai-message ${msg.role}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <form className="ai-chat-input" onSubmit={onSendChat}>
              <label htmlFor="chat-input" className="sr-only">
                Ask the AI assistant
              </label>
              <input
                id="chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about timeline, budget, vendors, or ideas..."
              />
              <button className="btn btn-primary" type="submit" disabled={chatLoading} role="status" aria-live="polite">
                {chatLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
