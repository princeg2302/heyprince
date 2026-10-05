'use client';

import React, { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { timelineMilestones } from '../data/siteContent';

export const JourneyTimeline: React.FC = () => {
  const [activeMilestonePos, setActiveMilestonePos] = useState<number>(6); // default to 2018 (career start)
  const [showFullList, setShowFullList] = useState<boolean>(false);
  const gridCirclesRef = useRef<HTMLDivElement>(null);
  const timelineAnimatingRef = useRef(false);
  const yearsTrackRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Desktop milestone click with GSAP dotted circle tween
  const handleTimelineMilestoneClick = (pos: number, leftStyle: string) => {
    if (timelineAnimatingRef.current || activeMilestonePos === pos) return;
    timelineAnimatingRef.current = true;

    if (gridCirclesRef.current) {
      gsap.to(gridCirclesRef.current, {
        left: leftStyle,
        scale: 1,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => {
          setActiveMilestonePos(pos);
          timelineAnimatingRef.current = false;
        },
      });
    } else {
      setActiveMilestonePos(pos);
      timelineAnimatingRef.current = false;
    }
  };

  // Mobile milestone selection with smooth center scroll
  const handleMobileYearSelect = (pos: number) => {
    setActiveMilestonePos(pos);
  };

  // Auto scroll active pill to center on mobile
  useEffect(() => {
    if (!yearsTrackRef.current) return;
    const activePill = yearsTrackRef.current.querySelector('.mobile-year-pill.active') as HTMLElement;
    if (activePill) {
      activePill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeMilestonePos]);

  // Stepper controls
  const currentIndex = timelineMilestones.findIndex((m) => m.pos === activeMilestonePos);
  const activeMilestone = timelineMilestones[currentIndex >= 0 ? currentIndex : 5];

  const handlePrevMilestone = () => {
    if (currentIndex > 0) {
      setActiveMilestonePos(timelineMilestones[currentIndex - 1].pos);
    }
  };

  const handleNextMilestone = () => {
    if (currentIndex < timelineMilestones.length - 1) {
      setActiveMilestonePos(timelineMilestones[currentIndex + 1].pos);
    }
  };

  // Touch swipe support for card
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    touchStartXRef.current = null;
    if (diff > 45) {
      // Swiped left -> next
      handleNextMilestone();
    } else if (diff < -45) {
      // Swiped right -> prev
      handlePrevMilestone();
    }
  };

  return (
    <section className="journey-timeline" id="journey">
      {/* =========================================================================
          DESKTOP VIEW (>= 992px) — 100% ORIGINAL GSAP GRID LAYOUT (UNTOUCHED)
          ========================================================================= */}
      <div className="journey-desktop-grid">
        <div className="timeline-wrapper">
          <div className="timeline-grid-wrapper">
            <div className="timeline-grid">
              <div className="grid__container">
                <div className="grid__section">
                  {timelineMilestones.map((milestone) => {
                    const isActive = activeMilestonePos === milestone.pos;
                    return (
                      <div
                        key={milestone.pos}
                        className={`grid__x ${isActive ? 'current-active-x' : ''}`}
                        data-pos={milestone.pos}
                        style={{ left: milestone.left }}
                      >
                        <div className="grid__x-line"></div>
                        <div
                          className={`grid__x-label ${isActive ? 'active' : ''}`}
                          data-cursor-text="Click Me"
                          onClick={() => handleTimelineMilestoneClick(milestone.pos, milestone.left)}
                        >
                          {milestone.year}
                        </div>
                        <div
                          className="grid__x-text"
                          style={{
                            display: isActive ? 'flex' : 'none',
                            opacity: isActive ? 1 : 0,
                          }}
                        >
                          <div className="grid__x-text-line"></div>
                          <div className="grid__x-text-content">{milestone.text}</div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Dotted Circle Indicator (Exact from WordPress) */}
                  <div
                    className="grid__circles"
                    ref={gridCirclesRef}
                    style={{ left: activeMilestone.left }}
                  >
                    <div className="grid__circles-wrapper">
                      <svg
                        width="434"
                        height="434"
                        viewBox="0 0 434 434"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          id="grid-circle-big"
                          cx="217"
                          cy="217"
                          r="208.5"
                          stroke="currentColor"
                          strokeWidth="17"
                          strokeDasharray="1 15"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="timeline-text">
            <div className="container">
              <h2>MY JOURNEY</h2>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE & TABLET VIEW (< 992px) — DEDICATED, TOUCH-FRIENDLY RESPONSIVE UI
          ========================================================================= */}
      <div className="journey-mobile-timeline">
        <div className="container">
          <div className="mobile-timeline-header text-center">
            <div className="timeline-badge">
              <span className="badge-pulse"></span>
              CAREER MILESTONES
            </div>
            <h2>MY JOURNEY</h2>
            <p className="mobile-timeline-subtitle">
              A decade of relentless learning, engineering, and digital craft.
            </p>
          </div>

          {/* Horizontal Scrollable Year Pill Tabs */}
          <div className="mobile-years-slider-wrapper">
            <div className="mobile-years-track" ref={yearsTrackRef}>
              {timelineMilestones.map((m) => {
                const isActive = activeMilestonePos === m.pos;
                return (
                  <button
                    key={m.pos}
                    type="button"
                    className={`mobile-year-pill ${isActive ? 'active' : ''}`}
                    onClick={() => handleMobileYearSelect(m.pos)}
                    aria-label={`View milestone for year ${m.year}`}
                  >
                    {m.year}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Featured Active Milestone Card */}
          <div
            className="mobile-milestone-card"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="card-top-glow"></div>

            <div className="milestone-card-header">
              <div className="card-year-group">
                <span className="card-year-badge">{activeMilestone.year}</span>
                <span className="card-milestone-tag">
                  Phase {activeMilestone.pos.toString().padStart(2, '0')}
                </span>
              </div>
              <div className="card-counter">
                <span className="current-num">{activeMilestone.pos.toString().padStart(2, '0')}</span>
                <span className="slash">/</span>
                <span className="total-num">{timelineMilestones.length.toString().padStart(2, '0')}</span>
              </div>
            </div>

            <div className="card-progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(activeMilestone.pos / timelineMilestones.length) * 100}%` }}
              ></div>
            </div>

            <p className="milestone-card-description">{activeMilestone.text}</p>

            {/* Stepper Navigation Footer */}
            <div className="milestone-card-footer">
              <button
                type="button"
                className="milestone-nav-btn prev-btn"
                onClick={handlePrevMilestone}
                disabled={currentIndex === 0}
                aria-label="Previous milestone"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span>Prev</span>
              </button>

              {/* Milestone Indicator Dots */}
              <div className="milestone-dots">
                {timelineMilestones.map((m) => (
                  <button
                    key={m.pos}
                    type="button"
                    className={`milestone-dot ${activeMilestonePos === m.pos ? 'active' : ''}`}
                    onClick={() => setActiveMilestonePos(m.pos)}
                    aria-label={`Go to ${m.year}`}
                  />
                ))}
              </div>

              <button
                type="button"
                className="milestone-nav-btn next-btn"
                onClick={handleNextMilestone}
                disabled={currentIndex === timelineMilestones.length - 1}
                aria-label="Next milestone"
              >
                <span>Next</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>

          {/* Interactive Toggle: Expand Full Vertical Timeline */}
          <div className="timeline-expand-action text-center">
            <button
              type="button"
              className="btn-toggle-timeline-list"
              onClick={() => setShowFullList(!showFullList)}
            >
              <span>{showFullList ? 'Hide Complete Timeline' : 'View Full Journey Timeline (10 Years)'}</span>
              <svg
                className={`toggle-chevron ${showFullList ? 'rotated' : ''}`}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          {/* Full Vertical Timeline View (when expanded) */}
          {showFullList && (
            <div className="mobile-vertical-timeline-list">
              {timelineMilestones.map((m) => {
                const isItemActive = activeMilestonePos === m.pos;
                return (
                  <div
                    key={m.pos}
                    className={`vertical-timeline-item ${isItemActive ? 'active-item' : ''}`}
                    onClick={() => setActiveMilestonePos(m.pos)}
                  >
                    <div className="timeline-node">
                      <span className="node-dot"></span>
                      <span className="node-line"></span>
                    </div>
                    <div className="timeline-item-content">
                      <div className="item-year-row">
                        <span className="item-year">{m.year}</span>
                        {isItemActive && <span className="item-active-tag">Active</span>}
                      </div>
                      <p className="item-text">{m.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default JourneyTimeline;
