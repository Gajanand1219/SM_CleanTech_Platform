import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/Home.css'

const domains = [
  { name: 'Water & Wastewater Treatment', icon: '💧', color: '#00a8e8', sub: 'ETP, STP, ZLD, CETP, MEE, MBR, MBBR, RO' },
  { name: 'Solid & Hazardous Waste', icon: '♻️', color: '#00d4aa', sub: 'Industrial waste handling, incineration, landfill' },
  { name: 'Solar & Renewables', icon: '☀️', color: '#ffb800', sub: 'Rooftop solar, open-access, green power' },
  { name: 'Carbon & ESG', icon: '🌱', color: '#4ade80', sub: 'Carbon footprint, ESG auditing, compliance' },
  { name: 'SPCB Consents & Air Pollution', icon: '🏭', color: '#a78bfa', sub: 'Legal services, pollution control equipment' },
];

const workflowSteps = [
  { num: '01', title: 'Submit', desc: 'Answer structured technical questionnaire' },
  { num: '02', title: 'Review', desc: 'Admin verifies and validates dossier' },
  { num: '03', title: 'Match', desc: 'Routed to pre-vetted specialists' },
  { num: '04', title: 'Quote', desc: 'Vendors submit technical quotations' },
  { num: '05', title: 'Connect', desc: 'Mutual handshake unlocks contacts' },
];

export default function Home() {
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.reveal').forEach((el) => {
      observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <>
      <Navbar />
      <main className="home">
        {/* HERO */}
        <section className="hero">
          <div className="hero__bg">
            <div className="hero__orb hero__orb--1"></div>
            <div className="hero__orb hero__orb--2"></div>
            <div className="hero__orb hero__orb--3"></div>
            <div className="hero__grid"></div>
          </div>

          <div className="hero__container">
            <div className="hero__copy">
              <span className="hero__eyebrow reveal">
                <span className="hero__eyebrow-dot"></span>
                Industrial B2B CleanTech Network
              </span>

              <h1 className="hero__title reveal">
                Diagnose Industrial Bottlenecks.{' '}
                <em>Match</em> Pre-Vetted Solutions.
              </h1>

              <p className="hero__desc reveal">
                Connect verified industrial buyers with relevant engineering, EPC and CleanTech
                providers through structured technical requirements, quotation workflows and mutual consent.
              </p>

              <div className="hero__actions reveal">
                <Link to="/register/buyer" className="btn btn--primary">
                  <span>I'm a Buyer</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link to="/register/vendor" className="btn btn--secondary">
                  <span>I'm a Vendor / EPC</span>
                </Link>
              </div>

              <div className="hero__stats reveal">
                <div className="hero__stat">
                  <strong>5</strong>
                  <span>Core Verticals</span>
                </div>
                <div className="hero__stat-divider"></div>
                <div className="hero__stat">
                  <strong>10+</strong>
                  <span>Technical Points</span>
                </div>
                <div className="hero__stat-divider"></div>
                <div className="hero__stat">
                  <strong>240h</strong>
                  <span>Active Window</span>
                </div>
              </div>
            </div>

            <div className="hero__visual reveal">
              <div className="hero__card">
                <div className="hero__card-header">
                  <div className="hero__card-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <span className="hero__card-label">Platform Flow</span>
                </div>

                <div className="hero__flow">
                  {['Buyer requirement', 'Technical dossier', 'Verified vendor match', 'Quotation', 'Mutual handshake'].map((step, i) => (
                    <div key={step} className="hero__flow-step" style={{ animationDelay: `${i * 0.15}s` }}>
                      <div className="hero__flow-num">{String(i + 1).padStart(2, '0')}</div>
                      <div className="hero__flow-text">{step}</div>
                    </div>
                  ))}
                </div>

                <div className="hero__privacy">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Contact details remain masked until mutual acceptance</span>
                </div>
              </div>

              <div className="hero__float hero__float--1">
                <div className="hero__float-icon">🔒</div>
                <div>
                  <strong>Strict Masking</strong>
                  <span>Zero vendor spam</span>
                </div>
              </div>

              <div className="hero__float hero__float--2">
                <div className="hero__float-icon">⚡</div>
                <div>
                  <strong>10 Days Timer</strong>
                  <span>240-hour window</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DOMAINS */}
        <section className="domains" id="domains">
          <div className="section__container">
            <div className="section__head reveal">
              <span className="section__eyebrow">5 Core Verticals</span>
              <h2 className="section__title">
                Industrial problems, structured into <em>solution domains.</em>
              </h2>
            </div>

            <div className="domains__grid">
              {domains.map((domain, i) => (
                <div
                  key={domain.name}
                  className="domain-card reveal"
                  style={{ '--accent': domain.color, animationDelay: `${i * 0.1}s` }}
                >
                  <div className="domain-card__glow"></div>
                  <div className="domain-card__icon">{domain.icon}</div>
                  <div className="domain-card__no">0{i + 1}</div>
                  <h3>{domain.name}</h3>
                  <p>{domain.sub}</p>
                  <div className="domain-card__arrow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WORKFLOW */}
        <section className="workflow" id="how-it-works">
          <div className="section__container">
            <div className="section__head reveal">
              <span className="section__eyebrow">How It Works</span>
              <h2 className="section__title">
                Five steps from problem to <em>partnership.</em>
              </h2>
            </div>

            <div className="workflow__track">
              {workflowSteps.map((step, i) => (
                <div key={step.num} className="workflow__step reveal" style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className="workflow__step-num">{step.num}</div>
                  <div className="workflow__step-content">
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                  {i < workflowSteps.length - 1 && (
                    <div className="workflow__connector">
                      <div className="workflow__connector-dot"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY US */}
        <section className="why" id="why-us">
          <div className="section__container">
            <div className="why__grid">
              <div className="why__copy reveal">
                <span className="section__eyebrow">Why the Platform</span>
                <h2 className="section__title">
                  Less cold calling. More <em>qualified context.</em>
                </h2>
                <p className="why__desc">
                  We don't simply advertise vendors or sell random directories. We identify genuine
                  operational requirements and route qualified project dossiers to matching specialists.
                </p>
              </div>

              <div className="why__features">
                {[
                  { icon: '🔒', title: 'Strict Masking', desc: 'Buyer/vendor contact information stays protected until mutual consent.' },
                  { icon: '📋', title: 'Technical Dossier', desc: 'Structured questions capture operational context before matching.' },
                  { icon: '⚙️', title: 'Role-Based Workflow', desc: 'Separate buyer, vendor and admin workspaces with approval controls.' },
                  { icon: '📊', title: '5-Year CRM History', desc: 'Complete archive of quotations, connections, and deal status.' },
                ].map((feature, i) => (
                  <div key={feature.title} className="why__feature reveal" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="why__feature-icon">{feature.icon}</div>
                    <div className="why__feature-content">
                      <h3>{feature.title}</h3>
                      <p>{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta" id="contact">
          <div className="cta__bg">
            <div className="cta__orb cta__orb--1"></div>
            <div className="cta__orb cta__orb--2"></div>
          </div>
          <div className="section__container">
            <div className="cta__content reveal">
              <h2>Start with a verified industrial requirement.</h2>
              <p>Build the project in three phases: buyer enquiry, vendor quotation, then two-way handshake.</p>
              <div className="cta__actions">
                <Link to="/register/buyer" className="btn btn--primary btn--large">
                  <span>Post an Enquiry</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link to="/register/vendor" className="btn btn--outline btn--large">
                  <span>Join as Vendor</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="section__container">
            <div className="footer__top">
              <div className="footer__brand">
                <strong>SM Clean Tech</strong>
                <span>Engineering Solutions</span>
              </div>
              <div className="footer__links">
                <a href="/#domains">Domains</a>
                <Link to="/solutions">Solutions</Link>
                <Link to="/how-it-works">How It Works</Link>
                <a href="/#contact">Contact</a>
              </div>
            </div>
            <div className="footer__bottom">
              <span>Water | Waste | Solar | ESG | SPCB</span>
              <span>© 2026 SM Clean Tech. All rights reserved.</span>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}