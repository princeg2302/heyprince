import React from 'react';
import { FaUserCheck, FaBolt, FaCode, FaHandshake } from 'react-icons/fa6';

export const WhyChooseUs: React.FC = () => {
  const points = [
    {
      icon: <FaUserCheck size={22} style={{ color: '#00f2fe' }} />,
      title: 'Direct Senior Engineering',
      desc: 'No non-technical account managers or outsourced junior contractors. You collaborate directly with a senior engineer who writes and ships your code.',
    },
    {
      icon: <FaBolt size={22} style={{ color: '#d40027' }} />,
      title: 'Obsessive Speed Standard',
      desc: 'We engineer for sub-500ms server response times (TTFB) and perfect Core Web Vitals to maximize search ranking and user conversion.',
    },
    {
      icon: <FaCode size={22} style={{ color: '#10b981' }} />,
      title: '100% Client Code Ownership',
      desc: 'All source code, database architectures, and intellectual property belong completely to you upon project milestone completion. Zero vendor lock-in.',
    },
    {
      icon: <FaHandshake size={22} style={{ color: '#f59e0b' }} />,
      title: 'Transparent Milestone Pricing',
      desc: 'Clear scope, fixed milestone deliverables, and honest scoping without hidden agency retainers or surprise change orders.',
    },
  ];

  return (
    <section
      className="py-5"
      style={{
        background: '#0b0b0f',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div className="container py-5">
        <div className="row g-5 align-items-center">
          <div className="col-lg-5">
            <div
              className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3"
              style={{
                background: 'rgba(212, 0, 39, 0.12)',
                border: '1px solid rgba(212, 0, 39, 0.3)',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d40027' }}></span>
              <span
                style={{
                  color: '#d40027',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                }}
              >
                The HeyPrince Advantage
              </span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(32px, 3.8vw, 46px)',
                color: '#ffffff',
                fontWeight: 800,
                lineHeight: 1.25,
                marginBottom: '20px',
              }}
            >
              Why Forward-Thinking Businesses Partner With HeyPrince
            </h2>

            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '17px', lineHeight: 1.7, marginBottom: '24px' }}>
              Traditional agencies often charge enterprise fees only to delegate your project to junior contractors. At HeyPrince, you partner directly with a senior engineer who takes personal accountability for architecture, code quality, and business ROI.
            </p>

            <div
              className="p-3 rounded-3"
              style={{
                background: '#07080a',
                border: '1px solid rgba(255, 255, 255, 0.07)',
              }}
            >
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
                    className="w-100 p-4 rounded-4 d-flex flex-column justify-content-between agency-card-dark"
                  >
                    <div>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '16px',
                        }}
                      >
                        {pt.icon}
                      </div>
                      <h3 style={{ fontSize: '18px', color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}>
                        {pt.title}
                      </h3>
                      <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6, margin: 0 }}>
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

export default WhyChooseUs;
