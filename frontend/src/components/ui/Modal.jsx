import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal Component
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {string} title - Title displayed in the modal header
 * @param {React.ReactNode} children - Modal body content
 * @param {function} onClose - Called when the modal should close (backdrop click or X button)
 * @param {string} [maxWidth] - Tailwind max-width class, defaults to 'max-w-md'
 */
export default function Modal({
  isOpen,
  title,
  children,
  onClose,
  maxWidth = 'max-w-md',
}) {
  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`
          relative w-full ${maxWidth}
          bg-[var(--color-card)] border border-[var(--color-border)]
          rounded-xl shadow-2xl overflow-hidden
          animate-fade-in
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2
            id="modal-title"
            className="text-sm font-bold text-[var(--color-text-primary)]"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-gray-100/50 transition-colors"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
