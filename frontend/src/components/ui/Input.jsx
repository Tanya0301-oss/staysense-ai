import React from 'react';

/**
 * Input Component
 * @param {string} label - Label text displayed above the input
 * @param {string} placeholder - Placeholder text inside the input
 * @param {string|number} value - Controlled input value
 * @param {function} onChange - Change handler (event) => void
 * @param {string} type - HTML input type ('text' | 'email' | 'password' | 'number' etc.)
 * @param {string} [error] - Optional error message shown below the input
 * @param {string} [id] - HTML id attribute; auto-derived from label if not provided
 * @param {boolean} [disabled] - Whether the input is disabled
 * @param {string} [className] - Additional wrapper CSS classes
 */
export default function Input({
  label,
  placeholder = '',
  value,
  onChange,
  type = 'text',
  error,
  id,
  disabled = false,
  className = '',
  ...rest
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-full px-3 py-2 rounded-md text-sm
          bg-[var(--color-card)] text-[var(--color-text-primary)]
          border transition-colors
          placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-amber-400/60
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error
            ? 'border-rose-400 focus:ring-rose-300/60'
            : 'border-[var(--color-border)] hover:border-gray-400'
          }
        `}
        {...rest}
      />
      {error && (
        <p className="text-xs text-rose-500 font-medium">{error}</p>
      )}
    </div>
  );
}
