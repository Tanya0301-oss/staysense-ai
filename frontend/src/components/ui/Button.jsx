import React from 'react';

/**
 * Button Component
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'danger'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} disabled - Whether the button is disabled
 * @param {function} onClick - Click handler
 * @param {React.ReactNode} children - Button content
 * @param {string} [className] - Additional CSS classes
 * @param {string} [type] - HTML button type attribute
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children,
  className = '',
  type = 'button',
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer select-none';

  const variants = {
    primary:
      'text-gray-900 border font-semibold hover:brightness-95 focus:ring-amber-400 shadow-sm',
    secondary:
      'bg-[var(--color-card)] hover:bg-gray-100/60 text-[var(--color-text-primary)] border border-[var(--color-border)] focus:ring-gray-300',
    ghost:
      'bg-transparent hover:bg-gray-100/40 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus:ring-gray-300',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white border border-rose-700/30 focus:ring-rose-400 shadow-sm',
  };

  const primaryStyle = variant === 'primary'
    ? { background: '#FBBF24', borderColor: 'rgba(251,191,36,0.4)' }
    : {};

  const secondaryStyle = variant === 'secondary'
    ? { background: 'var(--color-card)', borderColor: 'var(--color-border)' }
    : {};

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const disabledClass = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${disabledClass} ${className}`}
      style={{ ...primaryStyle, ...secondaryStyle }}
      {...rest}
    >
      {children}
    </button>
  );
}
