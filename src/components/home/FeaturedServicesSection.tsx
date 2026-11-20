import React from 'react';
import Link from 'next/link';
import { ServiceData } from '@/data/servicesData';
import {
  FaArrowRight,
  FaBrain,
  FaWordpress,
  FaReact,
  FaPhp,
  FaPython,
  FaMagnifyingGlass,
  FaPalette,
  FaCode,
  FaBolt,
  FaLayerGroup,
} from 'react-icons/fa6';

interface FeaturedServicesSectionProps {
  services: ServiceData[];
}

function renderServiceIcon(iconName: string) {
  switch (iconName) {
    case 'FaBrain':
      return <FaBrain size={24} />;
    case 'FaWordpress':
      return <FaWordpress size={24} />;
    case 'FaReact':
      return <FaReact size={24} />;
    case 'FaPhp':
      return <FaPhp size={24} />;
    case 'FaPython':
      return <FaPython size={24} />;
    case 'FaMagnifyingGlass':
      return <FaMagnifyingGlass size={24} />;
    case 'FaPalette':
      return <FaPalette size={24} />;
    default:
      return <FaCode size={24} />;
  }
}

export const FeaturedServicesSection: React.FC<FeaturedServicesSectionProps> = ({ services }) => {
  const displayServices = services && services.length > 0 ? services.slice(0, 6) : [];

  return (
    <section className="py-5" id="services" style={{ background: '#12141c', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <div className="container py-5">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-5 gap-3">
          <div>
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3" style={{ background: 'rgba(229, 57, 53, 0.12)', border: '1px solid rgba(229, 57, 53, 0.3)' }}>
              <FaLayerGroup size={12} className="text-accent" />
              <span style={{ color: '#e53935', fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Live Services Ecosystem</span>
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 46px)', color: '#ffffff', fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
              Specialized Engineering Solutions
            </h2>
          </div>
          <div>
            <Link 
              href="/services" 
              className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill text-decoration-none"
              style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.15)', fontSize: '14.5px', fontWeight: 600, transition: 'all 0.2s ease' }}
            >
              <span>View All Services</span>
              <FaArrowRight size={13} className="text-accent" />
            </Link>
          </div>
        </div>

        <div className="row g-4">
          {displayServices.map((service) => {
            const isFeatured = service.isFeatured;
            return (
              <div key={service.slug} className="col-lg-4 col-md-6 col-12 d-flex">
                <Link
                  href={`/services/${service.slug}/`}
                  className="w-100 text-decoration-none d-flex flex-column justify-content-between rounded-4 p-4"
                  style={{
                    background: isFeatured 
                      ? 'radial-gradient(circle at top right, #1f2538 0%, #0e111a 100%)' 
                      : '#181b24',
                    border: isFeatured 
                      ? '1.5px solid rgba(0, 242, 254, 0.45)' 
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isFeatured 
                      ? '0 12px 35px rgba(0, 242, 254, 0.1)' 
                      : '0 8px 24px rgba(0, 0, 0, 0.3)',
                    transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                  }}
                >
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div 
                        style={{ 
                          width: '48px', 
                          height: '48px', 
                          borderRadius: '12px', 
                          background: isFeatured ? 'rgba(0, 242, 254, 0.15)' : 'rgba(229, 57, 53, 0.15)', 
                          color: isFeatured ? '#00f2fe' : '#e53935', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}
                      >
                        {renderServiceIcon(service.iconName)}
                      </div>
                      {service.featuredBadge ? (
                        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#00f2fe', background: 'rgba(0, 242, 254, 0.1)', padding: '4px 10px', borderRadius: '100px', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
                          {service.featuredBadge}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {service.category}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '20px', color: '#ffffff', fontWeight: 700, marginBottom: '10px', lineHeight: 1.3 }}>
                      {service.title}
                    </h3>

                    <p style={{ fontSize: '14.5px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6, marginBottom: '20px' }}>
                      {service.tagline}
                    </p>

                    {service.deliverables && service.deliverables.length > 0 && (
                      <div className="mb-4">
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                          Core Deliverables:
                        </div>
                        <ul className="list-unstyled m-0" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {service.deliverables.slice(0, 3).map((d, dIdx) => (
                            <li key={dIdx} className="d-flex align-items-center gap-2" style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)' }}>
                              <FaBolt size={10} className="text-accent flex-shrink-0" />
                              <span className="text-truncate">{d.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 d-flex align-items-center justify-content-between" style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: isFeatured ? '#00f2fe' : '#ffffff' }}>
                      View Full Architecture
                    </span>
                    <FaArrowRight size={13} style={{ color: isFeatured ? '#00f2fe' : '#e53935' }} />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
