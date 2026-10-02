import React, { useState, useEffect, useRef } from 'react';
import { FaLinkedinIn, FaXTwitter, FaWhatsapp } from 'react-icons/fa6';

export interface HeaderProps {
  onNavigate?: (page: 'home' | 'contact' | 'blog', sectionId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/audio/ambient.mp3');
    audio.loop = true;
    audio.volume = 0.55;
    audioRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Audio play error:', err);
        });
    }
  };

  // Sync body modal-open class when menu toggles
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleSectionClick = (sectionId: string) => {
    setMenuOpen(false);
    if (onNavigate) {
      onNavigate('home', sectionId);
    } else {
      window.location.hash = `#${sectionId}`;
    }
  };

  const handleContactClick = () => {
    setMenuOpen(false);
    if (onNavigate) {
      onNavigate('contact');
    } else {
      window.location.hash = '#/contact';
    }
  };

  return (
    <header id="header" className="navbar">
      <div className="container d-block">
        <div className="row align-items-center">
          <div className="col-4 logo-wrap">
            <a
              className="navbar-brand"
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                handleSectionClick('home');
              }}
              title="HeyPrince"
              rel="home"
            >
              <img src="https://heyprince.in/wp-content/uploads/2025/09/heyprince.svg" alt="HeyPrince" />
              <p className="site-tagline">Where Ideas Get Dressed to Impress.</p>
            </a>
          </div>

          <div className="col-4 menu-wrap d-flex flex-wrap justify-content-center">
            <button
              type="button"
              className="btn btn-toggle-menu"
              aria-label="Toggle navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span></span>
              <span></span>
            </button>

            {/* Modal Menu Drawer (Exact from WordPress header.php) */}
            <div
              className={`modal fade modal-right ${menuOpen ? 'show' : ''}`}
              id="menuModal"
              tabIndex={-1}
              aria-labelledby="menuModalLabel"
              aria-hidden={!menuOpen}
              style={{ display: menuOpen ? 'block' : 'none' }}
            >
              <div className="modal-dialog modal-right">
                <div className="modal-content">
                  <div className="container h-100">
                    <div className="row align-items-end justify-content-between h-100">
                      <div className="col-lg-7">
                        <div className="main-menu-wrap">
                          <ul className="navbar-menu" id="menu-main">
                            <li className="menu-item">
                              <a
                                href="#home"
                                className="nav-link"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleSectionClick('home');
                                }}
                              >
                                Portfolio
                              </a>
                            </li>
                            <li className="menu-item">
                              <a
                                href="#about"
                                className="nav-link"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleSectionClick('about');
                                }}
                              >
                                Unfiltered Me
                              </a>
                            </li>
                            <li className="menu-item">
                              <a
                                href="#journey"
                                className="nav-link"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleSectionClick('journey');
                                }}
                              >
                                Journey
                              </a>
                            </li>
                            <li className="menu-item">
                              <a
                                href="#arcade"
                                className="nav-link"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleSectionClick('arcade');
                                }}
                              >
                                Cyber Arcade 🎮
                              </a>
                            </li>
                            <li className="menu-item">
                              <a
                                href="#articles"
                                className="nav-link"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleSectionClick('articles');
                                }}
                              >
                                Insights
                              </a>
                            </li>
                            <li className="menu-item">
                              <a
                                href="#memories"
                                className="nav-link"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleSectionClick('memories');
                                }}
                              >
                                Memories
                              </a>
                            </li>
                            <li className="menu-item">
                              <a
                                href="#/contact"
                                className="nav-link"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleContactClick();
                                }}
                              >
                                Contact
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div className="header-get-in-touch">
                          <h2>Get In Touch</h2>
                          <a href="mailto:it@heyprince.in">it@heyprince.in</a>
                          <a href="tel:+919120900010">+91 9120900010</a>
                          <div className="header-social-links">
                            <a
                              rel="noopener noreferrer"
                              aria-label="LinkedIn"
                              className="d-flex align-items-center Linkedin"
                              href="https://www.linkedin.com/"
                              target="_blank"
                            >
                              <FaLinkedinIn size={22} color="#fff" />
                            </a>
                            <a
                              rel="noopener noreferrer"
                              aria-label="Twitter"
                              className="d-flex align-items-center Twitter mx-3"
                              href="https://x.com/"
                              target="_blank"
                            >
                              <FaXTwitter size={20} color="#fff" />
                            </a>
                            <a
                              rel="noopener noreferrer"
                              aria-label="WhatsApp"
                              className="d-flex align-items-center Whatsapp"
                              href="https://wa.me/"
                              target="_blank"
                            >
                              <FaWhatsapp size={22} color="#fff" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-4 header-actions">
            <button
              type="button"
              className={`ai-music-btn ${isPlaying ? 'playing' : ''}`}
              onClick={toggleAudio}
              aria-label={isPlaying ? 'Pause music' : 'Play audio music'}
              title={isPlaying ? 'Pause music' : 'Play audio music'}
            >
              <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="aiSiriGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00f2fe" />
                    <stop offset="35%" stopColor="#ff2d55" />
                    <stop offset="70%" stopColor="#ff416c" />
                    <stop offset="100%" stopColor="#00f2fe" />
                  </linearGradient>
                </defs>
                <path
                  className="ai-zigzag-glow"
                  d="M 3 12 L 7 12 L 10 8 L 13 16 L 16 5 L 19 19 L 22 6 L 25 17 L 28 9 L 31 14 L 34 12 L 37 12"
                  stroke="url(#aiSiriGrad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isPlaying ? 0.4 : 0}
                />
                <path
                  className="ai-zigzag-line"
                  d="M 3 12 L 7 12 L 10 8 L 13 16 L 16 5 L 19 19 L 22 6 L 25 17 L 28 9 L 31 14 L 34 12 L 37 12"
                  stroke="url(#aiSiriGrad)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <a
              className="portal-btn"
              href="#/contact"
              onClick={(e) => {
                e.preventDefault();
                handleContactClick();
              }}
            >
              <span className="mr-right">Let's Build Something</span>
              <span className="arrow">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="20" fill="white" />
                  <path
                    d="M24.8218 28L21.652 27.2937C21.7864 25.9354 22.2967 24.6859 23.1832 23.545C24.0696 22.395 25.0725 21.6525 26.1917 21.3175H9V18.6825H26.1917C25.0725 18.3475 24.0696 17.605 23.1832 16.455C22.2967 15.305 21.7864 14.0509 21.652 12.6927L24.8218 12C24.8844 13.9921 25.4575 15.5676 26.541 16.7266C27.6244 17.8766 29.1108 18.5286 31 18.6825V21.3175C29.1108 21.4714 27.6244 22.1279 26.541 23.2869C25.4575 24.4369 24.8844 26.0079 24.8218 28Z"
                    fill="#000"
                  />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
