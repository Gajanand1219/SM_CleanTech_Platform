import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/Static.css';

const solutionsList = [
  {
    name: 'Water & Wastewater',
    icon: '💧',
    color: '#00a8e8',
    desc: 'ETP, STP, ZLD, CETP, MEE, MBR, MBBR, RO, UF, MF, Membranes, Electrochemical methods, MVR, ASP, SBR, DM / Ion Exchange, Crystallizer.',
  },
  {
    name: 'Solid & Hazardous Waste',
    icon: '♻️',
    color: '#00d4aa',
    desc: 'Industrial waste handling, incineration, landfill management, and hazardous material processing.',
  },
  {
    name: 'Solar & Renewables',
    icon: '☀️',
    color: '#ffb800',
    desc: 'Industrial solar rooftop, open-access renewable energy, green power integration.',
  },
  {
    name: 'Carbon & ESG',
    icon: '🌱',
    color: '#4ade80',
    desc: 'Carbon footprint tracking, ESG auditing, sustainability compliance reporting.',
  },
  {
    name: 'SPCB Consents & Air Pollution',
    icon: '🏭',
    color: '#a78bfa',
    desc: 'Environmental legal services, air pollution control equipment, State Pollution Control Board (SPCB) consents & clearances.',
  },
];

const workflowTimeline = [
  {
    num: '01',
    title: 'Buyer Enquiry',
    desc: 'Register → admin approval → select domain/problem → answer questionnaire → generate dossier → submit.',
  },
  {
    num: '02',
    title: 'Vendor Quotation',
    desc: 'Vendor registers → admin approval → receives matched enquiries → reviews masked dossier → submits quotation.',
  },
  {
    num: '03',
    title: 'Two-Way Handshake',
    desc: 'Buyer accepts quotation → vendor accepts → mutual acceptance → contact details unlock → deal/CRM history.',
  },
];

function useReveal() {
  const observerRef = useRef(null);
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('animate-in');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);
}

export function Solutions() {
  useReveal();
  return (
    <>
      <Navbar />
      <main className="home">
        <section className="static-hero">
          <div className="hero__bg">
            <div className="hero__orb hero__orb--1"></div>
            <div className="hero__orb hero__orb--2"></div>
            <div className="hero__orb hero__orb--3"></div>
          </div>

          <div className="static-hero__content">
            <span className="section__eyebrow reveal">Solutions</span>
            <h1 className="static-hero__title reveal">
              Five CleanTech <em>engineering verticals.</em>
            </h1>
            <p className="static-hero__desc reveal">
              Industrial diagnostic categories for treatment, recovery, renewable energy,
              emissions, compliance and environmental services.
            </p>
          </div>
        </section>

        <section className="static-section">
          <div className="section__container">
            <div className="solutions-grid">
              {solutionsList.map((sol, i) => (
                <article
                  key={sol.name}
                  className="solution-card reveal"
                  style={{ '--accent': sol.color, animationDelay: `${i * 0.08}s` }}
                >
                  <div className="solution-card__glow"></div>
                  <div className="solution-card__header">
                    <div className="solution-card__icon">{sol.icon}</div>
                    <div className="solution-card__num">0{i + 1}</div>
                  </div>
                  <h2>{sol.name}</h2>
                  <p>{sol.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="cta" id="contact">
          <div className="cta__bg">
            <div className="cta__orb cta__orb--1"></div>
            <div className="cta__orb cta__orb--2"></div>
          </div>
          <div className="section__container">
            <div className="cta__content reveal">
              <h2>Ready to diagnose your bottleneck?</h2>
              <p>Submit your requirement and get matched with pre-vetted specialists.</p>
              <div className="cta__actions">
                <Link to="/register/buyer" className="btn btn--primary btn--large">
                  <span>Post an Enquiry</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link to="/how-it-works" className="btn btn--outline btn--large">
                  <span>See Workflow</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export function HowItWorks() {
  useReveal();
  return (
    <>
      <Navbar />
      <main className="home">
        <section className="static-hero">
          <div className="hero__bg">
            <div className="hero__orb hero__orb--1"></div>
            <div className="hero__orb hero__orb--2"></div>
            <div className="hero__orb hero__orb--3"></div>
          </div>

          <div className="static-hero__content">
            <span className="section__eyebrow reveal">How It Works</span>
            <h1 className="static-hero__title reveal">
              Three-phase <em>operating workflow.</em>
            </h1>
            <p className="static-hero__desc reveal">
              From first enquiry to final handshake — a structured, transparent, and secure process.
            </p>
          </div>
        </section>

        <section className="static-section">
          <div className="section__container">
            <div className="timeline">
              {workflowTimeline.map((step, i) => (
                <div
                  key={step.num}
                  className="timeline__item reveal"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className="timeline__num-wrap">
                    <div className="timeline__num">{step.num}</div>
                    {i < workflowTimeline.length - 1 && <div className="timeline__line"></div>}
                  </div>
                  <div className="timeline__content">
                    <h2>{step.title}</h2>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cta" id="contact">
          <div className="cta__bg">
            <div className="cta__orb cta__orb--1"></div>
            <div className="cta__orb cta__orb--2"></div>
          </div>
          <div className="section__container">
            <div className="cta__content reveal">
              <h2>Start with a verified industrial requirement.</h2>
              <p>Build the project in three phases and connect with the right partners.</p>
              <div className="cta__actions">
                <Link to="/register/buyer" className="btn btn--primary btn--large">
                  <span>Get Started</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link to="/solutions" className="btn btn--outline btn--large">
                  <span>View Solutions</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}