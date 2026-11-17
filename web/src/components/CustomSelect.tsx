import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  minMenuWidth?: number;
  align?: 'left' | 'right';
  clearOnSelect?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  ariaLabel,
  size = 'md',
  disabled = false,
  className = '',
  triggerClassName = '',
  minMenuWidth,
  align = 'left',
  clearOnSelect = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;
    const menuW = Math.max(rect.width, minMenuWidth || rect.width);

    let left = rect.left;
    if (align === 'right' || left + menuW > window.innerWidth - 12) {
      left = Math.max(12, rect.right - menuW);
    }

    setMenuStyle({
      position: 'fixed',
      top: openUp ? undefined : `${rect.bottom + 4}px`,
      bottom: openUp ? `${window.innerHeight - rect.top + 4}px` : undefined,
      left: `${left}px`,
      width: `${menuW}px`,
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: openUp ? `${Math.min(280, spaceAbove - 16)}px` : `${Math.min(280, spaceBelow - 16)}px`,
      zIndex: 9999,
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, align, minMenuWidth]);

  return (
    <div className={`select-shell ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        className={`select-trigger ${size === 'sm' ? 'select-trigger--sm' : ''} ${triggerClassName}`.trim()}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="select-trigger-text">{displayText}</span>
        <ChevronDown size={size === 'sm' ? 14 : 16} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="select-menu"
            style={menuStyle}
            role="listbox"
            aria-label={ariaLabel}
          >
            {options.map((opt) => {
              const isSelected = !clearOnSelect && opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`select-option ${isSelected ? 'is-selected' : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="select-option-label">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="select-option-sublabel">{opt.sublabel}</span>
                  )}
                  <Check size={15} />
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
