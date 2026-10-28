import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  icon: Icon,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed rounded-md shadow-sm';

  const variants = {
    primary: 'bg-gov-700 text-white hover:bg-gov-800 focus-visible:ring-gov-700 border border-gov-800',
    secondary: 'bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400 border border-slate-300',
    outline: 'bg-transparent text-gov-700 hover:bg-gov-50 focus-visible:ring-gov-600 border border-gov-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 border border-red-700',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 shadow-none'
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5'
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 text-current" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}

export default Button;
