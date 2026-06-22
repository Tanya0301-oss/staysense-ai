import React, { useState } from 'react';
import { Button, Input, Modal, Toast, Loader } from '../components/ui';

/**
 * Showcase Page — demonstrates every UI component in src/components/ui.
 * Route: navigate to 'showcase' via sidebar.
 */
export default function Showcase() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [emailVal, setEmailVal] = useState('');

  const addToast = (type) => {
    const messages = {
      success: 'Review session saved successfully!',
      error: 'Failed to connect to the backend.',
      warning: 'Sentiment confidence is below 70%.',
      info: 'Analyzing 24 new guest reviews…',
    };
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message: messages[type] }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  /* ── Section wrapper ─────────────────────────────── */
  const Section = ({ title, children }) => (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-[var(--color-text-secondary)]">
          {title}
        </h2>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>
      {children}
    </section>
  );

  const Row = ({ children, wrap = true }) => (
    <div className={`flex ${wrap ? 'flex-wrap' : ''} items-center gap-3`}>
      {children}
    </div>
  );

  return (
    <div className="animate-fade-in max-w-3xl mx-auto py-2">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
          Component Library Showcase
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1 font-medium">
          Live demo of every component in{' '}
          <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px] font-mono">
            src/components/ui
          </code>
        </p>
      </div>

      {/* ── BUTTON ─────────────────────────────────────────────── */}
      <Section title="Button">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              Variants
            </p>
            <Row>
              <Button variant="primary" id="btn-primary">Primary</Button>
              <Button variant="secondary" id="btn-secondary">Secondary</Button>
              <Button variant="ghost" id="btn-ghost">Ghost</Button>
              <Button variant="danger" id="btn-danger">Danger</Button>
            </Row>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              Sizes
            </p>
            <Row>
              <Button size="sm" id="btn-sm">Small</Button>
              <Button size="md" id="btn-md">Medium</Button>
              <Button size="lg" id="btn-lg">Large</Button>
            </Row>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              Disabled
            </p>
            <Row>
              <Button variant="primary" disabled id="btn-disabled-primary">Primary</Button>
              <Button variant="secondary" disabled id="btn-disabled-secondary">Secondary</Button>
            </Row>
          </div>
        </div>
      </Section>

      {/* ── INPUT ──────────────────────────────────────────────── */}
      <Section title="Input">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            id="showcase-text"
            label="Text Input"
            placeholder="Type something…"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
          />
          <Input
            id="showcase-email"
            label="Email Input"
            type="email"
            placeholder="you@example.com"
            value={emailVal}
            onChange={(e) => setEmailVal(e.target.value)}
          />
          <Input
            id="showcase-password"
            label="Password Input"
            type="password"
            placeholder="••••••••"
            value=""
            onChange={() => {}}
          />
          <Input
            id="showcase-error"
            label="With Error State"
            placeholder="Invalid input"
            value="bad value"
            onChange={() => {}}
            error="This field contains an invalid value."
          />
        </div>
      </Section>

      {/* ── MODAL ──────────────────────────────────────────────── */}
      <Section title="Modal">
        <Button
          id="modal-open-btn"
          variant="primary"
          onClick={() => setModalOpen(true)}
        >
          Open Modal
        </Button>

        <Modal
          isOpen={modalOpen}
          title="Example Modal"
          onClose={() => setModalOpen(false)}
        >
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              This modal demonstrates the{' '}
              <strong className="text-[var(--color-text-primary)]">Modal</strong>{' '}
              component. It supports backdrop click, <kbd className="text-xs bg-gray-100 px-1 rounded">Esc</kbd>{' '}
              to close, scroll locking, and any children content.
            </p>
            <Input
              id="modal-input"
              label="Guest Name"
              placeholder="e.g. Jane Smith"
              value=""
              onChange={() => {}}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                id="modal-cancel"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                id="modal-confirm"
                onClick={() => setModalOpen(false)}
              >
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      </Section>

      {/* ── TOAST ──────────────────────────────────────────────── */}
      <Section title="Toast">
        <div className="space-y-4">
          <Row>
            {['success', 'error', 'warning', 'info'].map((type) => (
              <Button
                key={type}
                id={`toast-btn-${type}`}
                variant="secondary"
                size="sm"
                onClick={() => addToast(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </Row>
          {toasts.length > 0 && (
            <div className="flex flex-col gap-2 mt-4">
              {toasts.map((t) => (
                <Toast
                  key={t.id}
                  type={t.type}
                  message={t.message}
                  onDismiss={() => removeToast(t.id)}
                />
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* ── LOADER ─────────────────────────────────────────────── */}
      <Section title="Loader">
        <div className="flex items-end gap-6">
          {[
            { size: 'sm', label: 'Small' },
            { size: 'md', label: 'Medium' },
            { size: 'lg', label: 'Large' },
          ].map(({ size, label }) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <Loader size={size} />
              <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                {label}
              </span>
            </div>
          ))}
          {/* Different color example */}
          <div className="flex flex-col items-center gap-2">
            <Loader size="md" color="text-rose-500" />
            <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
              Custom
            </span>
          </div>
        </div>
      </Section>
    </div>
  );
}
