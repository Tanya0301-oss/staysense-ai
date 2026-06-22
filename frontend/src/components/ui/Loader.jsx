import React from 'react';

/**
 * Loader Component
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} [color] - Tailwind text-color class for the spinner; defaults to accent yellow
 * @param {string} [label] - Accessible label (screen-reader only)
 */
export default function Loader({
  size = 'md',
  color = 'text-[#FFB703]',
  label = 'Loading…',
}) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-[3px]',
    lg: 'w-11 h-11 border-4',
  };

  const dim = sizes[size] || sizes.md;

  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block ${dim} rounded-full border-current border-t-transparent animate-spin ${color}`}
    />
  );
}
