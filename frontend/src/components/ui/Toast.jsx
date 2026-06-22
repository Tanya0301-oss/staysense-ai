import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Toast Component
 * @param {string} type - 'success' | 'error' | 'warning' | 'info'
 * @param {string} message - Message text to display
 * @param {number} [duration=4000] - Auto-dismiss delay in milliseconds (0 = no auto-dismiss)
 * @param {function} [onDismiss] - Called when the toast is dismissed
 */
export default function Toast({
  type = 'info',
  message,
  duration = 4000,
  onDismiss,
}) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 250);
  };

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  if (!visible) return null;

  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-emerald-50 border-emerald-300',
      text: 'text-emerald-800',
      iconColor: 'text-emerald-600',
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-rose-50 border-rose-300',
      text: 'text-rose-800',
      iconColor: 'text-rose-600',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-amber-50 border-amber-300',
      text: 'text-amber-800',
      iconColor: 'text-amber-500',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50 border-blue-300',
      text: 'text-blue-800',
      iconColor: 'text-blue-500',
    },
  };

  const { icon: Icon, bg, text, iconColor } = config[type] || config.info;

  return (
    <div
      role="alert"
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg
        text-sm font-medium transition-all duration-250
        ${bg} ${text}
        ${exiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
        animate-fade-in
      `}
      style={{ minWidth: '260px', maxWidth: '380px' }}
    >
      <Icon size={17} className={`shrink-0 mt-0.5 ${iconColor}`} />
      <span className="flex-1 leading-snug">{message}</span>
      <button
        onClick={dismiss}
        className="shrink-0 mt-0.5 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
