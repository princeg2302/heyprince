import React from 'react';
import { FaUserCheck, FaGaugeHigh, FaCodeCommit, FaLock } from 'react-icons/fa6';

export const WhyChooseUs: React.FC = () => {
  const points = [
    {
      icon: <FaUserCheck size={24} className="text-accent" />,
      title: 'Direct Senior Engineering Partnership',
      desc: 'You work directly with an experienced technical architect. No junior account managers, no game of telephone, and no translation delays between business goals and codebase commits.',
    },
    {
      icon: <FaGaugeHigh size={24} className="text-accent" />,
      title: 'Performance-First Engineering Standard',
      desc: 'Speed is not an afterthought. We engineer for sub-second TTFB, 95+ Google Lighthouse scores, and zero layout shifts from the very first pull request.',
    },
    {
      icon: <FaCodeCommit size={24} className="text-accent" />,
      title: '100% Custom Code, Zero Theme Bloat',
      desc: 'We never wrap generic pre-built templates or install dozens of fragile plugins. Every component and API route is hand-crafted for your exact operational requirements.',
    },
    {
      icon: <FaLock size={24} className="text-accent" />,
      title: 'Complete IP & Codebase Ownership',
      desc: 'You own every line of code, database schema, design asset, and configuration file upon delivery. No vendor lock-in and no proprietary licensing restrictions.',
    },
  ];

  return (
    <section className="py-5" style={{ background: '#12141c', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <div className="container py-5">
        <div className="row g-5 align-items-center">
          <div className="col-lg-5">
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3" style={{ background: 'rgba(229, 57, 53, 0.12)', border: '1px solid rgba(229, 57, 53, 0.3)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e53935' }}></span>
              <span style={{ color: '#e53935', fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Why HeyPrince</span>
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 46px)', color: '#ffffff', fontWeight: 800, lineHeight: 1.2, marginBottom: '20px' }}>
              Practical Differentiation Without Agency Hype
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '17px', lineHeight: 1.7, marginBottom: '24px' }}>
              Traditional agencies often charge enterprise fees only to delegate your project to junior contractors. At HeyPrince, you partner directly with a senior engineer who takes personal accountability for architecture, code quality, and business ROI.
            </p>
            <div className="p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: 600 }}>
                &ldquo;Engineering software that works in production matters infinitely more than endless slide decks.&rdquo;
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                Prince, Senior Full-Stack Engineer &amp; IT Consultant
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="row g-4">
              {points.map((pt, idx) => (
                <div key={idx} className="col-md-6 col-12 d-flex">
                  <div 
                    className="w-100 p-4 rounded-4" 
                    style={{ 
                      background: '#181b24', 
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div className="mb-3">
                        {pt.icon}
                      </div>
                      <h3 style={{ fontSize: '18px', color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}>
                        {pt.title}
                      </h3>
                      <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6, margin: 0 }}>
                        {pt.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
