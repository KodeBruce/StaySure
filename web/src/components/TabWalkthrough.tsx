import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  House,
  Search as SearchIcon,
  GitCompareArrows,
  ClipboardList,
  Heart,
  ArrowRight,
  X,
  Check
} from 'lucide-react';
import './tab-walkthrough.css';

export const WALKTHROUGH_STORAGE_KEY = 'staysure_walkthrough_dismissed';

export interface WalkthroughStep {
  id: 'home' | 'search' | 'compare' | 'applications' | 'saved';
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  summary: string;
}

const STEPS: WalkthroughStep[] = [
  {
    id: 'home',
    label: 'Home',
    icon: House,
    title: 'Explore Accommodations',
    summary: 'Browse verified student residences near your campus, explore available room types, check transparent monthly rates, and view 3D virtual tours.'
  },
  {
    id: 'search',
    label: 'Search',
    icon: SearchIcon,
    title: 'Interactive Map View',
    summary: 'View residences on an interactive map with walking distance to campus, university radius filters, and live individual price pins.'
  },
  {
    id: 'compare',
    label: 'Compare',
    icon: GitCompareArrows,
    title: 'Side-by-Side Comparison',
    summary: 'Select up to 3 accommodations to compare monthly rent, room sizes, NSFAS funding approval, and amenities in one side-by-side view.'
  },
  {
    id: 'applications',
    label: 'Applications',
    icon: ClipboardList,
    title: 'Direct Applications',
    summary: 'Submit direct housing applications and monitor your verification and acceptance status in real-time without middleman fees.'
  },
  {
    id: 'saved',
    label: 'Saved',
    icon: Heart,
    title: 'Your Shortlist',
    summary: 'Save favourite residences to your personal wishlist for quick access, room availability updates, and instant comparison.'
  }
];

export const TabWalkthrough: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [cardPos, setCardPos] = useState<{
      top?: number;
      bottom?: number;
      left: number;
      arrowLeft: number;
      isBottomNav: boolean;
    } | null>(null);

    const activeElementRef = useRef<HTMLElement | null>(null);

// Open only when the student chooses the walkthrough from the footer.
useEffect(() => {
  const handleOpen = () => {
    setCurrentStepIndex(0);
    setIsOpen(true);
  };
  window.addEventListener('staysure-open-walkthrough', handleOpen);
  return () => window.removeEventListener('staysure-open-walkthrough', handleOpen);
}, []);

  // Measure active tab and position the card & outline
  const updateActiveTab = useCallback(() => {
    if (!isOpen) return;
    const step = STEPS[currentStepIndex];
    if (!step) return;

    // Find visible tab element matching step.id
    const candidates = document.querySelectorAll<HTMLElement>(
      `[data-walkthrough-tab="${step.id}"]`
    );

    let target: HTMLElement | null = null;
      for (const el of candidates) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        if (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden'
        ) {
          target = el;
          break;
        }
      }

      // Clean up previous elevated element
      if (activeElementRef.current && activeElementRef.current !== target) {
        activeElementRef.current.classList.remove('walkthrough-active-tab');
      }

      if (target) {
        target.classList.add('walkthrough-active-tab');
        activeElementRef.current = target;

        const rect = target.getBoundingClientRect();
        const isBottomNav = rect.top > window.innerHeight / 2;
        const cardWidth = Math.min(340, window.innerWidth - 32);

      // Center card horizontally on target tab
      const targetCenter = rect.left + rect.width / 2;
          const left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, targetCenter - cardWidth / 2));
          // Arrow points directly at targetCenter relative to card
          const arrowLeft = Math.max(20, Math.min(cardWidth - 20, targetCenter - left - 7));

          if(isBottomNav) {
            // Position above bottom floating nav
            const bottom = window.innerHeight - rect.top + 16;
            setCardPos({ bottom, left, arrowLeft, isBottomNav: true });
          } else {
            // Position below desktop topnav
            const top = rect.bottom + 16;
            setCardPos({ top, left, arrowLeft, isBottomNav: false });
          }
        } else {
          // Fallback center
          setCardPos({
            top: 100,
            left: Math.max(16, (window.innerWidth - Math.min(340, window.innerWidth - 32)) / 2),
          arrowLeft: 40,
          isBottomNav: false
        });
      }
    }, [isOpen, currentStepIndex]);

  // Manage body class & reposition listeners
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('walkthrough-active');
      updateActiveTab();

      const handleResize = () => updateActiveTab();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize, true);

      return () => {
        document.body.classList.remove('walkthrough-active');
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize, true);
        if (activeElementRef.current) {
          activeElementRef.current.classList.remove('walkthrough-active-tab');
          activeElementRef.current = null;
        }
      };
    } else {
      document.body.classList.remove('walkthrough-active');
      if (activeElementRef.current) {
        activeElementRef.current.classList.remove('walkthrough-active-tab');
        activeElementRef.current = null;
      }
    }
}, [isOpen, updateActiveTab]);

// Keyboard navigation
useEffect(() => {
  if (!isOpen) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleBack();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isOpen, currentStepIndex]);

const handleNext = () => {
  if (currentStepIndex < STEPS.length - 1) {
    setCurrentStepIndex(prev => prev + 1);
  } else {
    handleDontShowAgain();
  }
};

const handleBack = () => {
  if (currentStepIndex > 0) {
    setCurrentStepIndex(prev => prev - 1);
  }
};

const handleClose = () => {
  setIsOpen(false);
};

const handleDontShowAgain = () => {
  localStorage.setItem(WALKTHROUGH_STORAGE_KEY, 'true');
  handleClose();
};

if (!isOpen) return null;

const currentStep = STEPS[currentStepIndex];
const StepIcon = currentStep.icon;
const isFirst = currentStepIndex === 0;
const isLast = currentStepIndex === STEPS.length - 1;

return createPortal(
    <>
    {/* Blurred Backdrop */}
    <div
      className="walkthrough-backdrop"
      onClick={handleClose}
      aria-hidden="true"
    />

      {/* Popover Card */ }
      {cardPos && (
      <div
        className={`walkthrough-card ${cardPos.isBottomNav ? 'arrow-bottom' : 'arrow-top'}`}
        style={{
            top: cardPos.top !== undefined ? `${cardPos.top}px` : undefined,
          bottom: cardPos.bottom !== undefined ? `${cardPos.bottom}px` : undefined,
          left: `${cardPos.left}px`,
          ['--arrow-left' as any]: `${cardPos.arrowLeft}px`
        }}
    role="dialog"
    aria-modal="true"
    aria-label={`Walkthrough: ${currentStep.title}`}
        >
    <div className="walkthrough-card-topline">
      <div className="walkthrough-badge-wrap">
        <div className="walkthrough-icon-box">
          <StepIcon size={16} strokeWidth={2.4} />
        </div>
        <span className="walkthrough-badge">
          {currentStep.label} · {currentStepIndex + 1}/{STEPS.length}
        </span>
      </div>
      <button
        type="button"
        className="walkthrough-close"
        onClick={handleClose}
        aria-label="Close walkthrough"
        title="Close for now"
      >
        <X size={15} />
      </button>
    </div>

      <h3 className="walkthrough-title">{currentStep.title}</h3>
      <p className="walkthrough-summary">{currentStep.summary}</p>

      {/* Progress Indicators */}
      <div className="walkthrough-progress" aria-hidden="true">
        {STEPS.map((step, idx) => (
          <div
            key={step.id}
            className={`walkthrough-dot ${idx <= currentStepIndex ? 'is-active' : ''}`}
          />
        ))}
      </div>

      {/* Footer Actions */}
      <div className="walkthrough-actions">
        <button
          type="button"
          className="walkthrough-btn-dismiss"
          onClick={handleDontShowAgain}
          title="Never show this walkthrough again"
        >
          Don't show again
        </button>

              <div className="walkthrough-nav-btns">
                {!isFirst && (
                  <button
                    type="button"
                    className="walkthrough-btn-back"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  className="walkthrough-btn-next"
                  onClick={handleNext}
                >
                  {isLast ? (
                    <>
                      <Check size={14} strokeWidth={2.4} /> Got it
                    </>
                  ) : (
                    <>
                      Next <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
          </div>
        </div>
      )}
    </>,
    document.body
    );
};
