import React, { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { timelineMilestones } from '../data/siteContent';

export const JourneyTimeline: React.FC = () => {
  const [activeMilestonePos, setActiveMilestonePos] = useState<number>(6); // default to 2018 (career start)
  const gridCirclesRef = useRef<HTMLDivElement>(null);
  const timelineAnimatingRef = useRef(false);

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

  const activeMilestone =
    timelineMilestones.find((m) => m.pos === activeMilestonePos) || timelineMilestones[5];

  return (
    <section className="journey-timeline" id="journey">
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
    </section>
  );
};

export default JourneyTimeline;

