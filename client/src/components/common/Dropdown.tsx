import React, { useState, useRef, useEffect } from 'react';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ options, value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        setHighlighted((h) => (h + 1) % options.length);
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setHighlighted((h) => (h - 1 + options.length) % options.length);
        e.preventDefault();
      } else if (e.key === 'Enter' && highlighted >= 0) {
        onChange(options[highlighted].value);
        setOpen(false);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, highlighted, options, onChange]);

  useEffect(() => {
    if (open) setHighlighted(options.findIndex((opt) => opt.value === value));
  }, [open, value, options]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="w-full text-left px-4 py-2 border border-gray-200 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {options.find((opt) => opt.value === value)?.label || (
          <span className="text-gray-400">{placeholder || 'Select...'}</span>
        )}
        <span className="float-right text-gray-400 ml-2">▼</span>
      </button>
      <div
        className={`absolute mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg z-50 transition-all duration-200 ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ transitionProperty: 'opacity, transform' }}
        tabIndex={-1}
        role="listbox"
      >
        {options.map((opt, idx) => (
          <div
            key={opt.value}
            className={`px-4 py-2 cursor-pointer text-gray-700 select-none ${
              value === opt.value ? 'bg-blue-50 font-medium' : ''
            } ${highlighted === idx ? 'bg-gray-100' : ''}`}
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
            }}
            onMouseEnter={() => setHighlighted(idx)}
            role="option"
            aria-selected={value === opt.value}
          >
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dropdown;
