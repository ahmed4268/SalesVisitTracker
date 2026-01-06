'use client';

import { useState, InputHTMLAttributes } from 'react';
import Icon from '../../../components/ui/AppIcon';

interface AnimatedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  type?: 'text' | 'email' | 'password';
  iconName?: string;
  error?: string;
}

export default function AnimatedInput({
  label,
  type = 'text',
  iconName,
  error,
  className = '',
  ...props
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="relative">
      <div
        className={`relative transition-all duration-300 ${
          isFocused ? 'transform scale-[1.02]' : ''
        }`}
      >
        <div className="relative">
          {iconName && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
              <Icon
                name={iconName as any}
                size={20}
                className={`transition-colors duration-300 ${
                  isFocused ? 'text-violet-400' : 'text-slate-400'
                }`}
              />
            </div>
          )}
          <input
            type={inputType}
            className={`w-full px-4 ${iconName ? 'pl-16' : ''} ${
              type === 'password' ? 'pr-12' : ''
            } py-4 bg-white/5 border-2 ${
              error
                ? 'border-red-400/50'
                : isFocused
                ? 'border-violet-400/50'
                : 'border-white/10'
            } rounded-xl text-white placeholder-transparent focus:outline-none transition-all duration-300 ${className}`}
            placeholder={label}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          <label
            className={`absolute left-4 ${
              iconName ? 'left-16' : ''
            } transition-all duration-300 pointer-events-none ${
              isFocused || props.value
                ? '-top-2.5 text-xs bg-slate-900 px-2 text-violet-400'
                : 'top-1/2 -translate-y-1/2 text-sm text-slate-400'
            }`}
          >
            {label}
          </label>
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-400 transition-colors duration-300"
            >
              <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={20} />
            </button>
          )}
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-400 flex items-center gap-1 animate-slide-in-from-top">
            <Icon name="ExclamationCircleIcon" size={14} />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}