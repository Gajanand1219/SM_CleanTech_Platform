import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import '../styles/Static.css'
import '../styles/ScrollAnimations.css'
import { useEffect } from 'react'

/* =========================================================
   CLEAN TECH DOMAINS
   ========================================================= */

const solutionsList = [
  {
    name: 'Water & Wastewater Treatment',
    icon: '💧',
    image:
      'https://images.unsplash.com/photo-1538300342682-cf57afb97285?auto=format&fit=crop&w=900&q=80',
    points: [
      'Primary Effluent & Sewage Treatment',
      'High Recovery Advanced Water Engineering',
      'Biological & Advanced Membrane Solutions',
      'Fine Filtration & Pre-treatment Nodes',
      'Specialized Electrochemical & Recovery Systems'
    ]
  },
  {
    name: 'Solid & Hazardous Waste',
    icon: '♻️',
    image:
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=80',
    points: [
      'Collection & Pre-processing',
      'Thermal & Advanced Recovery (Waste to Energy)',
      'Biological Treatment (Organic Waste)',
      'Chemical & Stabilization Treatments',
      'Specialized Recycling & Compliance'
    ]
  },
  {
    name: 'Solar & Renewables',
    icon: '☀️',
    image:
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=900&q=80',
    points: [
      'Capital Efficiency & Grid Integration',
      'Thermal Utility De-carbonization',
      'Power Quality & Micro-grid Resilience',
      'Agro Industrial Logistics & Supply Chains',
      'Asset Optimization & Digital Intelligence'
    ]
  },
  {
    name: 'Carbon & ESG',
    icon: '🌱',
    image:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80',
    points: [
      'Scope 1 & Direct Operational Carbon Footprint',
      'Scope 2 & Indirect Energy Tracking',
      'Scope 3 & Supply Chain Vulnerabilities',
      'Global Trade & Cross-Border Compliance',
      'ESG Disclosures & Global Frameworks'
    ]
  },
  {
    name: 'Air Pollution & Environmental Legal Services',
    icon: '🏭',
    image:
      'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=900&q=80',
    points: [
      'Industrial Air Pollution Engineering (Physical Solutions)',
      'Statutory SPCB Consents & Approvals',
      'SPCB Enforcement & Litigation Defense (Legal Services)',
      'Factory Infrastructure & Safety Audits (Site Compliance)',
      'Legacy & Supply Chain Risk Scoping'
    ]
  }
]

/* =========================================================
   WORKFLOW
   ========================================================= */

const workflowTimeline = [
  {
    num: '01',
    title: 'Buyer Enquiry',
    icon: '📋',
    desc:
      'Buyer registers, gets approved, selects the required domain, explains the industrial problem, completes the questionnaire and submits the technical requirement.'
  },
  {
    num: '02',
    title: 'Vendor Matching & Quotation',
    icon: '🤝',
    desc:
      'Approved vendors receive relevant matched enquiries, review the masked technical dossier and submit their quotation or technical proposal.'
  },
  {
    num: '03',
    title: 'Two-Way Handshake',
    icon: '🔐',
    desc:
      'The buyer reviews the quotation and accepts it. The vendor also confirms acceptance. After mutual acceptance, contact details are unlocked and the project can move forward.'
  }
]

/* =========================================================
   COMMON FOOTER
   ========================================================= */

function Footer() {
  return (
    <footer className="footer">
      <div className="section-container">
        <div className="footer-main">
          <div className="footer-brand">
            <img
              src="/logo2.jpeg"
              alt="S&M CleanTech"
              className="footer__logo-image"
            />
            <p>SM CleanTech Engineering Solutions</p>
            <span>Diagnose. Match. Solution.</span>
          </div>

          <div className="footer-column">
            <h4>Platform</h4>
            <Link to="/">Home</Link>
            <Link to="/solutions">Domain</Link>
            <Link to="/how-it-works">About Us</Link>
            <a href="#contact">Contact</a>
          </div>

          <div className="footer-column">
            <h4>Join Network</h4>
            <Link to="/register/buyer">Register as Buyer</Link>
            <Link to="/register/vendor">Register as Vendor</Link>
            <Link to="/login">Login</Link>
          </div>

          <div className="footer-column footer-contact">
            <h4>Contact</h4>
            <p>
              SM CLEANTECH
              <br />
              ENGINEERING SOLUTIONS
            </p>
            <p>
                      Email:{" "}
                      <a
                        href="mailto:smcleantech2910@gmail.com"
                        style={{ color: "blue", textDecoration: "none" }}
                      >
                        smcleantech2910@gmail.com
                      </a>
                    </p>
            <p>India</p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 SM CleanTech Engineering Solutions</span>
          <span>Water • Waste • Solar • ESG • SPCB</span>
        </div>
      </div>
    </footer>
  )
}

/* =========================================================
   COMMON SCROLL REVEAL
   ========================================================= */

function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]')

    if (!elements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          } else {
            entry.target.classList.remove('is-visible')
          }
        })
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    )

    elements.forEach((element) => {
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
    }
  }, [])
}

/* =========================================================
   PAGE HEADER
   ========================================================= */

function PageHeader({ label, title, description }) {
  return (
    <section className="static-page-header">
      <div className="static-page-header__container" data-reveal>
        <span className="static-page-header__label">{label}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  )
}

/* =========================================================
   SOLUTIONS / DOMAIN PAGE
   ========================================================= */

export function Solutions() {
  useScrollReveal()

  return (
    <>
      <Navbar />

      <main className="static-page">
        {/* <PageHeader
          label="OUR DOMAINS"
          title="SM CleanTech Engineering Solutions"
          description="Select the relevant domain to understand the type of engineering, environmental and CleanTech requirements supported by our SM CleanTech platform."
        /> */}

        <section className="static-content-section">
          <div className="static-container">
            <div className="domain-page-intro" data-reveal>
              <span>OUR DOMAINS</span>
              <h2>Solutions for industrial challenges</h2>
              <p>
                Select the relevant domain to understand the type of engineering, environmental and CleanTech requirements supported by our SM CleanTech platform.
              </p>
            </div>

            <div className="solutions-grid">
              {solutionsList.map((solution, index) => (
                <article
                  key={solution.name}
                  className="solution-card"
                >
                  <div className="solution-card__image">
                    <img
                      src={solution.image}
                      alt={solution.name}
                      loading="lazy"
                    />
                    <span className="solution-card__number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="solution-card__body">
                    <h2>{solution.name}</h2>

                    <ul className="solution-card__points">
                      {solution.points.map((point, i) => (
                        <li key={i}>
                          <span className="solution-card__point-num">
                            {i + 1}
                          </span>
                          <span className="solution-card__point-text">
                            {point}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      to="/register/buyer"
                      className="solution-card__link"
                    >
                      Start Requirement →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="static-cta">
          <div className="static-container">
            <div className="static-cta__inner" data-reveal>
              <div>
                <span>INDUSTRIAL REQUIREMENT</span>
                <h2>Have a CleanTech requirement?</h2>
                <p>
                  Submit your requirement and connect with relevant
                  engineering and solution providers.
                </p>
              </div>

              <div className="static-cta__buttons">
                <Link
                  to="/register/buyer"
                  className="static-btn static-btn--primary"
                >
                  Register as Buyer
                </Link>
                <Link
                  to="/register/vendor"
                  className="static-btn static-btn--outline"
                >
                  Register as Vendor
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  )
}

/* =========================================================
   HOW IT WORKS / ABOUT US
   ========================================================= */

export function HowItWorks() {
  useScrollReveal()

  return (
    <>
      <Navbar />

      <main className="static-page">
        <PageHeader
          label="ABOUT US"
          title="How the SM CleanTech Platform Works"
          description="A structured industrial workflow connecting buyers with relevant engineering, EPC and CleanTech solution providers."
        />

        {/* ABOUT */}
        <section className="static-content-section">
          <div className="static-container">
            <div className="about-platform" data-reveal>
              <div className="about-platform__content">
                <span className="static-small-label">WHO WE ARE</span>
                <h2>
                  A structured connection between industrial requirements and
                  solutions.
                </h2>
                <p>
                  SM CleanTech Engineering Solutions provides a structured
                  B2B environment where industrial buyers can describe their
                  requirements and relevant engineering, EPC and CleanTech
                  providers can respond to matched opportunities.
                </p>
                <p>
                  The platform organizes the process from requirement
                  submission through technical matching, quotation and
                  mutual acceptance.
                </p>
              </div>

              <div className="about-platform__points">
                <div>
                  <strong>01</strong>
                  <span>Structured industrial requirements</span>
                </div>
                <div>
                  <strong>02</strong>
                  <span>Relevant technical matching</span>
                </div>
                <div>
                  <strong>03</strong>
                  <span>Controlled quotation workflow</span>
                </div>
                <div>
                  <strong>04</strong>
                  <span>Mutual acceptance before contact sharing</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW */}
        <section className="workflow-section">
          <div className="static-container">
            <div className="domain-page-intro">
              <span>PLATFORM WORKFLOW</span>
              <h2>From enquiry to mutual handshake</h2>
              <p>The complete process is divided into three structured phases.</p>
            </div>

            <div className="workflow-grid">
              {workflowTimeline.map((step, index) => (
                <article
                  className="workflow-card"
                  key={step.num}
                  data-reveal
                >
                  <div className="workflow-card__top">
                    <div className="workflow-card__number">{step.num}</div>
                    <div className="workflow-card__icon">{step.icon}</div>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                  {index < workflowTimeline.length - 1 && (
                    <span className="workflow-card__arrow">→</span>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SECURITY */}
        <section className="security-section">
          <div className="static-container">
            <div className="security-grid">
              <div className="security-box" data-reveal>
                <span className="security-box__icon">🔒</span>
                <div>
                  <h3>Strict Masking</h3>
                  <p>Contact details remain protected until mutual acceptance.</p>
                </div>
              </div>

              <div className="security-box" data-reveal>
                <span className="security-box__icon">⚡</span>
                <div>
                  <h3>10 Days Response Window</h3>
                  <p>
                    Matched opportunities operate within the defined response
                    period.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="static-cta">
          <div className="static-container">
            <div className="static-cta__inner">
              <div>
                <span>GET STARTED</span>
                <h2>Ready to participate in the network?</h2>
                <p>
                  Join as an industrial buyer or an engineering and CleanTech
                  solution provider.
                </p>
              </div>

              <div className="static-cta__buttons">
                <Link
                  to="/register/buyer"
                  className="static-btn static-btn--primary"
                >
                  Register as Buyer
                </Link>
                <Link
                  to="/register/vendor"
                  className="static-btn static-btn--outline"
                >
                  Register as Vendor
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  )
}
