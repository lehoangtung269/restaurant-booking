import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * A highly polished, custom dark-themed dropdown selector that matches the Maison Edem aesthetics.
 * It mocks the native change event so that it works seamlessly with existing state update handlers.
 */
export function CustomSelect({ value, onChange, options, disabled, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value)) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (onChange) {
      onChange({ target: { value: val } });
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
    >
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedOption ? selectedOption.label : 'Chọn...'}</span>
        <ChevronDown size={15} className="custom-select-arrow" />
      </button>

      {isOpen && (
        <ul className="custom-select-options" role="listbox">
          {options.map((opt) => (
            <li
              key={opt.value}
              className={`custom-select-option ${String(opt.value) === String(value) ? 'is-selected' : ''}`}
              role="option"
              aria-selected={String(opt.value) === String(value)}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
