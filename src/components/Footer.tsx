import React from 'react';
import { FaLinkedinIn, FaInstagram, FaWhatsapp } from 'react-icons/fa6';

export const Footer: React.FC = () => {
  return (
    <footer id="footer" className="footer-main">
      <div className="footer-content">
        <div className="container">
          <h2>Caffeine + Code = <span className="text-red">Catch up?</span></h2>
          <a href="mailto:it@heyprince.in" className="footer-mailto">
            it@heyprince.in
          </a>
          <div className="footer-row justify-content-end row">
            <div className="col-md-8">
              <img
                className="cards-indicator"
                src="https://heyprince.in/wp-content/uploads/2025/02/card-indicate.png"
                alt="Interactive service cards indicator"
                loading="lazy"
                decoding="async"
                width="170"
                height="80"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              {/* 6 Interactive Stacked Footer Cards (Exact IDs from WordPress style.css) */}
              <div className="footer-cards-container">
                <div className="footer-card card-black" id="footer-card-1">
                  <div className="card-heading">
                    <h3>Building Modern Web Apps</h3>
                    <p>Prince</p>
                  </div>
                  <a className="card-btn" href="mailto:it@heyprince.in">
                    Let’s talk about it
                    <svg className="card-btn-icn" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="20" fill="white"></circle>
                      <path
                        d="M24.8218 28L21.652 27.2937C21.7864 25.9354 22.2967 24.6859 23.1832 23.545C24.0696 22.395 25.0725 21.6525 26.1917 21.3175H9V18.6825H26.1917C25.0725 18.3475 24.0696 17.605 23.1832 16.455C22.2967 15.305 21.7864 14.0509 21.652 12.6927L24.8218 12C24.8844 13.9921 25.4575 15.5676 26.541 16.7266C27.6244 17.8766 29.1108 18.5286 31 18.6825V21.3175C29.1108 21.4714 27.6244 22.1279 26.541 23.2869C25.4575 24.4369 24.8844 26.0079 24.8218 28Z"
                        fill="#000"
                      ></path>
                    </svg>
                  </a>
                </div>

                <div className="footer-card card-white" id="footer-card-2">
                  <div className="card-heading">
                    <h3>High-Performance Code</h3>
                    <p>Prince</p>
                  </div>
                  <a className="card-btn" href="mailto:it@heyprince.in">
                    Let’s talk about it
                    <svg className="card-btn-icn" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="20" fill="white"></circle>
                      <path
                        d="M24.8218 28L21.652 27.2937C21.7864 25.9354 22.2967 24.6859 23.1832 23.545C24.0696 22.395 25.0725 21.6525 26.1917 21.3175H9V18.6825H26.1917C25.0725 18.3475 24.0696 17.605 23.1832 16.455C22.2967 15.305 21.7864 14.0509 21.652 12.6927L24.8218 12C24.8844 13.9921 25.4575 15.5676 26.541 16.7266C27.6244 17.8766 29.1108 18.5286 31 18.6825V21.3175C29.1108 21.4714 27.6244 22.1279 26.541 23.2869C25.4575 24.4369 24.8844 26.0079 24.8218 28Z"
                        fill="#000"
                      ></path>
                    </svg>
                  </a>
                </div>

                <div className="footer-card card-red" id="footer-card-3">
                  <div className="card-heading">
                    <h3>Scalable Cloud Solutions</h3>
                    <p>Prince</p>
                  </div>
                  <a className="card-btn" href="mailto:it@heyprince.in">
                    Let’s talk about it
                    <svg className="card-btn-icn" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="20" fill="white"></circle>
                      <path
                        d="M24.8218 28L21.652 27.2937C21.7864 25.9354 22.2967 24.6859 23.1832 23.545C24.0696 22.395 25.0725 21.6525 26.1917 21.3175H9V18.6825H26.1917C25.0725 18.3475 24.0696 17.605 23.1832 16.455C22.2967 15.305 21.7864 14.0509 21.652 12.6927L24.8218 12C24.8844 13.9921 25.4575 15.5676 26.541 16.7266C27.6244 17.8766 29.1108 18.5286 31 18.6825V21.3175C29.1108 21.4714 27.6244 22.1279 26.541 23.2869C25.4575 24.4369 24.8844 26.0079 24.8218 28Z"
                        fill="#000"
                      ></path>
                    </svg>
                  </a>
                </div>

                <div className="footer-card card-black" id="footer-card-4">
                  <div className="card-heading">
                    <h3>AI &amp; Smart Workflows</h3>
                    <p>Prince</p>
                  </div>
                  <a className="card-btn" href="mailto:it@heyprince.in">
                    Let’s talk about it
                    <svg className="card-btn-icn" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="20" fill="white"></circle>
                      <path
                        d="M24.8218 28L21.652 27.2937C21.7864 25.9354 22.2967 24.6859 23.1832 23.545C24.0696 22.395 25.0725 21.6525 26.1917 21.3175H9V18.6825H26.1917C25.0725 18.3475 24.0696 17.605 23.1832 16.455C22.2967 15.305 21.7864 14.0509 21.652 12.6927L24.8218 12C24.8844 13.9921 25.4575 15.5676 26.541 16.7266C27.6244 17.8766 29.1108 18.5286 31 18.6825V21.3175C29.1108 21.4714 27.6244 22.1279 26.541 23.2869C25.4575 24.4369 24.8844 26.0079 24.8218 28Z"
                        fill="#000"
                      ></path>
                    </svg>
                  </a>
                </div>

                <div className="footer-card card-white" id="footer-card-5">
                  <div className="card-heading">
                    <h3>Turn Ideas into Reality</h3>
                    <p>Prince</p>
                  </div>
                  <a className="card-btn" href="mailto:it@heyprince.in">
                    Let’s talk about it
                    <svg className="card-btn-icn" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="20" fill="white"></circle>
                      <path
                        d="M24.8218 28L21.652 27.2937C21.7864 25.9354 22.2967 24.6859 23.1832 23.545C24.0696 22.395 25.0725 21.6525 26.1917 21.3175H9V18.6825H26.1917C25.0725 18.3475 24.0696 17.605 23.1832 16.455C22.2967 15.305 21.7864 14.0509 21.652 12.6927L24.8218 12C24.8844 13.9921 25.4575 15.5676 26.541 16.7266C27.6244 17.8766 29.1108 18.5286 31 18.6825V21.3175C29.1108 21.4714 27.6244 22.1279 26.541 23.2869C25.4575 24.4369 24.8844 26.0079 24.8218 28Z"
                        fill="#000"
                      ></path>
                    </svg>
                  </a>
                </div>

                <div className="footer-card card-red" id="footer-card-6">
                  <div className="card-heading">
                    <h3>Bespoke Web Solutions</h3>
                    <p>Prince</p>
                  </div>
                  <a className="card-btn" href="mailto:it@heyprince.in">
                    Let’s talk about it
                    <svg className="card-btn-icn" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="20" fill="white"></circle>
                      <path
                        d="M24.8218 28L21.652 27.2937C21.7864 25.9354 22.2967 24.6859 23.1832 23.545C24.0696 22.395 25.0725 21.6525 26.1917 21.3175H9V18.6825H26.1917C25.0725 18.3475 24.0696 17.605 23.1832 16.455C22.2967 15.305 21.7864 14.0509 21.652 12.6927L24.8218 12C24.8844 13.9921 25.4575 15.5676 26.541 16.7266C27.6244 17.8766 29.1108 18.5286 31 18.6825V21.3175C29.1108 21.4714 27.6244 22.1279 26.541 23.2869C25.4575 24.4369 24.8844 26.0079 24.8218 28Z"
                        fill="#000"
                      ></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="col-md-2 footer-col-social">
              <div className="social-links">
                <a
                  href="https://www.linkedin.com/in/mr-goyal/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="social-link-icon"
                >
                  <FaLinkedinIn size={24} color="#fff" />
                </a>
                <a
                  href="https://www.instagram.com/heyprince.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="social-link-icon"
                >
                  <FaInstagram size={24} color="#fff" />
                </a>
                <a
                  href="https://wa.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="social-link-icon"
                >
                  <FaWhatsapp size={24} color="#fff" />
                </a>
              </div>
              <p className="foot-copyright">
                &copy; 2026{' '}
                <a
                  href="https://www.heyprince.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="foot-brand-link"
                >
                  heyprince.in
                </a>
                <span className="foot-sep">&nbsp;&bull;&nbsp;</span>
                <span>All Rights Reserved</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

