import React from 'react';

export function Input({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  leadingIcon: LeadingIcon,
  ...props
}) {
  const inputId = id || name;

  return (
    <div className="w-full text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        {LeadingIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <LeadingIcon className="h-4 w-4" />
          </div>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`block w-full rounded-md text-sm border transition-colors bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
            LeadingIcon ? 'pl-9' : ''
          } ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500 text-red-900'
              : 'border-slate-300 focus:border-gov-600 focus:ring-gov-600'
          } ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''} ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

export default Input;
