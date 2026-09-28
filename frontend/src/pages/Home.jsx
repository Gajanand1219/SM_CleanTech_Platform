import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import '../styles/Home.css'
import API from '../services/api'
import { useEffect, useState, useRef } from 'react'
// import '../styles/ScrollAnimations.css'
const solutionsList = [
  {
    name: 'Water & Wastewater',
    // icon: '💧',
    image:
      'https://images.unsplash.com/photo-1538300342682-cf57afb97285?auto=format&fit=crop&w=900&q=80',
    desc:
      'ETP, STP, ZLD, CETP, MEE, MBR, MBBR, RO, UF, MF, Membranes, Electrochemical methods, MVR, ASP, SBR, DM / Ion Exchange and Crystallizer.'
  },
  {
    name: 'Solid & Hazardous Waste',
    icon: '♻️',
    image:
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=80',
    desc:
      'Industrial waste handling, incineration, landfill management, recycling and hazardous material processing solutions.'
  },
  {
    name: 'Solar & Renewables',
    icon: '☀️',
    image:
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=900&q=80',
    desc:
      'Industrial solar rooftop, open-access renewable energy and green power integration solutions.'
  },
  {
    name: 'Carbon & ESG',
    icon: '🌱',
    image:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80',
    desc:
      'Carbon footprint tracking, ESG auditing, sustainability compliance and environmental reporting.'
  },
  {
    name: 'SPCB Consents & Air Pollution',
    icon: '🏭',
    image:
      'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=900&q=80',
    desc:
      'Environmental legal services, air pollution control equipment, SPCB consents and environmental clearances.'
  }
]

const workflowSteps = [
  'Buyer requirement',
  'Technical dossier',
  'Verified vendor match',
  'Quotation',
  'Mutual handshake'
]

/* ================= SCROLL REVEAL HOOK ================= */
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

/* ================= ANIMATED COUNTER ================= */

function Counter({ end, suffix = '', duration = 3500 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true

            const startTime = performance.now()

            const tick = (now) => {
              const progress = Math.min((now - startTime) / duration, 1)
              const eased = 1 - Math.pow(1 - progress, 3)
              setCount(Math.floor(eased * end))

              if (progress < 1) requestAnimationFrame(tick)
              else setCount(end)
            }

            requestAnimationFrame(tick)
          }
        })
      },
      { threshold: 0.8 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [end, duration])

  return (
    <span ref={ref}>
      {String(count).padStart(2, '0')}
      {suffix}
    </span>
  )
}

export default function Home() {
  const [buyers, setBuyers] = useState([])
  const [vendors, setVendors] = useState([])

  useScrollReveal()

  useEffect(() => {
    const loadNetworkCompanies = async () => {
      try {
        const response = await API.get('/public/network-companies')
        setBuyers(response.data?.buyers || [])
        setVendors(response.data?.vendors || [])
      } catch (error) {
        console.error('Failed to load network companies:', error)
      }
    }

    loadNetworkCompanies()
  }, [])

  const [contactForm, setContactForm] = useState({
    name: '',
    mobile: '',
    email: '',
    message: ''
  })

  const [contactLoading, setContactLoading] = useState(false)
  const [contactSuccess, setContactSuccess] = useState('')
  const [contactError, setContactError] = useState('')

  const handleContactChange = (e) => {
    const { name, value } = e.target
    setContactForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    setContactSuccess('')
    setContactError('')

    if (
      !contactForm.name.trim() ||
      !contactForm.mobile.trim() ||
      !contactForm.email.trim() ||
      !contactForm.message.trim()
    ) {
      setContactError('Please fill in all fields.')
      return
    }

    try {
      setContactLoading(true)
      const response = await API.post('/public/contact', contactForm)
      setContactSuccess(
        response.data?.message || 'Your enquiry has been sent successfully.'
      )
      setContactForm({ name: '', mobile: '', email: '', message: '' })
    } catch (error) {
      setContactError(
        error.response?.data?.detail ||
          'Unable to send enquiry. Please try again.'
      )
    } finally {
      setContactLoading(false)
    }
  }

  return (
    <>
      <Navbar />

      <main className="home">
        {/* ================= HERO ================= */}

        <section className="hero">
          {/* Floating decorations */}
          <div className="hero__decor hero__decor--1" />
          <div className="hero__decor hero__decor--2" />
          <div className="hero__decor hero__decor--3" />

          <div className="hero__container">
            <div className="hero__content">
              <span className="hero__label" data-reveal>
                ⚡ Industrial B2B CleanTech Network
              </span>

              <h5 className="hero__title" data-reveal>
                SM CLEANTECH
                <br />
                <span className="hero__title-accent">
                  ENGINEERING SOLUTIONS
                </span>
              </h5>

              <p className="hero__tagline" data-reveal>
                // DIAGNOSE. MATCH. SOLUTION.
              </p>

              <p className="hero__description" data-reveal>
                We connect genuine industrial requirements with qualified
                engineering, EPC and CleanTech solution providers through a
                structured and transparent technical matching platform.
              </p>

              <div className="hero__buttons" data-reveal>
                <Link
                  to="/register/buyer"
                  className="home-btn home-btn--primary"
                >
                  Register as Buyer
                </Link>

                <Link
                  to="/register/vendor"
                  className="home-btn home-btn--outline"
                >
                  Register as Vendor
                </Link>

                <Link to="/login" className="home-btn home-btn--login">
                  Login
                </Link>
              </div>

              <div className="hero__mini-info" data-reveal>
  <div className="hero-mini-card">
    <div className="hero-mini-icon">🌿</div>

    <div className="hero-mini-content">
      <strong>
        <Counter end={5} />
        <span className="counter-plus">+</span>
      </strong>
      <span>Core Verticals</span>
    </div>
  </div>

  <div className="hero-mini-card">
    <div className="hero-mini-icon">⚙️</div>

    <div className="hero-mini-content">
      <strong>
        <Counter end={10} />
        <span className="counter-plus">+</span>
      </strong>
      <span>Technical Parameters</span>
    </div>
  </div>

  <div className="hero-mini-card">
    <div className="hero-mini-icon">⚡</div>

    <div className="hero-mini-content">
      <strong>
        <Counter end={240} />
        <span className="counter-unit">h</span>
      </strong>
      <span>Active Response Window</span>
    </div>
  </div>
</div>
            </div>

            {/* PLATFORM FLOW */}
            <div className="hero__right" data-reveal>
              <div className="platform-card">
                <div className="platform-card__header">
                  <div className="platform-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span>Platform Flow</span>
                </div>

                <div className="platform-flow">
                  {workflowSteps.map((step, index) => (
                    <div
                      className="platform-flow__item"
                      key={step}
                      style={{ animationDelay: `${index * 0.08}s` }}
                    >
                      <div className="platform-flow__number">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="platform-flow__text">{step}</div>
                    </div>
                  ))}
                </div>

                <div className="platform-security">
                  <span>🔒</span>
                  <p>
                    Contact details remain masked until mutual acceptance.
                  </p>
                </div>
              </div>

              <div className="hero__info-cards">
                <div className="info-card">
                  <div className="info-card__icon">🔒</div>
                  <div>
                    <strong>Strict Masking</strong>
                    <span>Zero vendor spam</span>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-card__icon">⚡</div>
                  <div>
                    <strong>10 Days Timer</strong>
                    <span>240-hour response window</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= ABOUT ================= */}

        <section className="about" id="about">
          <div className="section-container">
            <div className="section-heading" data-reveal>
              <span className="section-label">ABOUT US</span>
              <h2>WHO WE ARE</h2>
              <p>
                SM CleanTech Engineering Solutions is an industrial B2B
                platform designed to connect genuine project requirements with
                relevant engineering, EPC and CleanTech specialists. We
                structure requirements, technical information and matching
                workflows to make industrial project discovery simpler and more
                organized.
              </p>
            </div>

            <div className="solutions-grid">
              {solutionsList.map((solution, index) => (
                <article
                  key={solution.name}
                  className="solution-card"
                  data-reveal
                  style={{ transitionDelay: `${index * 0.08}s` }}
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
                    {/* <span className="solution-card__icon">
                      {solution.icon}
                    </span> */}
                    <div className="solution-card__overlay" />
                  </div>

                  <div className="solution-card__body">
                    <h2>{solution.name}</h2>
                    <p>{solution.desc}</p>
                    <Link
                      to="/register/buyer"
                      className="solution-card__link"
                    >
                      Start Requirement
                      <span className="solution-card__arrow">→</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ================= VISION / MISSION ================= */}

        <section className="vision-mission">
          <div className="section-container">
            <div className="section-heading center" data-reveal>
              <span className="section-label">OUR PURPOSE</span>
              <h2>VISION &amp; MISSION</h2>
            </div>

            <div className="vm-grid">
              <div className="vm-card" data-reveal>
                <div className="vm-icon">◈</div>
                <div>
                  <span className="vm-label">OUR VISION</span>
                  <h3>Building a trusted industrial ecosystem</h3>
                  <p>
                    To create a trusted engineering ecosystem where genuine
                    industrial requirements can be connected with qualified
                    technical and CleanTech solution providers.
                  </p>
                </div>
              </div>

              <div
                className="vm-card"
                data-reveal
                style={{ transitionDelay: '0.1s' }}
              >
                <div className="vm-icon">◎</div>
                <div>
                  <span className="vm-label">OUR MISSION</span>
                  <h3>Simplifying industrial project connections</h3>
                  <p>
                    To simplify requirement discovery, technical matching and
                    quotation workflows through structured information,
                    verified participants and mutual-consent processes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= TRUSTED NETWORK ================= */}
{/* ================= TRUSTED NETWORK ================= */}

<section className="partners">

  <div className="section-container">

    <div className="partners-heading">
      <span className="section-label">
        OUR NETWORK
      </span>

      <h2>
        Trusted Industrial Network
      </h2>

      <p>
        Connecting verified industrial buyers with approved
        CleanTech engineering and EPC solution providers.
      </p>
    </div>


    <div className="partners-grid">

      {/* ================= VENDORS ================= */}

      <div className="partner-network-card partner-network-card--vendor">

        <div className="partner-network-header">

          <div className="partner-network-icon">
            ⚙️
          </div>

          <div>
            <span className="partner-network-kicker">
              TECHNICAL NETWORK
            </span>

            <h3>
              Approved EPC Providers
            </h3>
          </div>

        </div>


        {/* VENDORS - RIGHT TO LEFT */}

        <div className="partner-marquee">

          {vendors.length > 0 ? (

            <marquee
              behavior="scroll"
              direction="left"
              scrollamount="5"
              scrolldelay="0"
              loop="-1"
            >

              <div className="partner-marquee-content">

                {[...vendors, ...vendors].map((company, index) => (

                  <div
                    className="partner-company"
                    key={`${company.id}-${index}`}
                  >

                    <div className="partner-company-logo">

                      <img
                        src={company.logo}
                        alt={company.company_name}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement.classList.add(
                            'partner-company-logo--fallback'
                          )
                        }}
                      />

                      <span>
                        {company.company_name
                          ?.charAt(0)
                          ?.toUpperCase()}
                      </span>

                    </div>

                    <span className="partner-company-name">
                      {company.company_name}
                    </span>

                  </div>

                ))}

              </div>

            </marquee>

          ) : (

            <div className="partner-empty">
              No approved vendors yet.
            </div>

          )}

        </div>


        <div className="partner-network-footer">

          <span className="network-status-dot" />

          Verified CleanTech Solution Providers

        </div>

      </div>


      {/* ================= BUYERS ================= */}

      <div className="partner-network-card partner-network-card--buyer">

        <div className="partner-network-header">

          <div className="partner-network-icon">
            🏢
          </div>

          <div>
            <span className="partner-network-kicker">
              TRUSTED NETWORK
            </span>

            <h3>
              Verified Industrial Buyers
            </h3>
          </div>

        </div>


        {/* BUYERS - LEFT TO RIGHT */}

        <div className="partner-marquee">

          {buyers.length > 0 ? (

            <marquee
              behavior="scroll"
              direction="right"
              scrollamount="5"
              scrolldelay="0"
              loop="-1"
            >

              <div className="partner-marquee-content">

                {[...buyers, ...buyers].map((company, index) => (

                  <div
                    className="partner-company"
                    key={`${company.id}-${index}`}
                  >

                    <div className="partner-company-logo">

                      <img
                        src={company.logo}
                        alt={company.company_name}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement.classList.add(
                            'partner-company-logo--fallback'
                          )
                        }}
                      />

                      <span>
                        {company.company_name
                          ?.charAt(0)
                          ?.toUpperCase()}
                      </span>

                    </div>

                    <span className="partner-company-name">
                      {company.company_name}
                    </span>

                  </div>

                ))}

              </div>

            </marquee>

          ) : (

            <div className="partner-empty">
              No verified buyers yet.
            </div>

          )}

        </div>


        <div className="partner-network-footer">

          <span className="network-status-dot" />

          Verified Industrial Businesses

        </div>

      </div>

    </div>

  </div>

</section>
      {/* ================= CONTACT ================= */}

        <section className="contact" id="contact">
          <div className="section-container">
            <div className="contact-layout">
              <div className="contact-intro" data-reveal>
                <span className="section-label">CONTACT US</span>
                <h2>Have an industrial requirement?</h2>
                <p>
                  Tell us about your requirement. Our platform is designed to
                  structure your enquiry and connect it with relevant technical
                  solution providers.
                </p>

                <div className="contact-person-card" align="center">
                  <div className="contact-person-top">
                    <div className="contact-person-avatar">SM</div>
                    <div>
                      <span className="contact-person-label">
                        DIRECT CONTACT
                      </span>
                      <h3>Contact Our Team</h3>
                    </div>
                  </div>

                  <a
                    href="mailto:satyapalmungal3112@gmail.com"
                    className="contact-direct-link"
                  >
                    <div className="contact-direct-icon contact-email-icon">
                      ✉
                    </div>
                    <div className="contact-direct-content">
                      <span>Email</span>
                      <strong>satyapalmungal3112@gmail.com</strong>
                    </div>
                    <span className="contact-direct-arrow">→</span>
                  </a>

                  <a
                    href="tel:+919112767997"
                    className="contact-direct-link"
                  >
                    <div className="contact-direct-icon contact-phone-icon">
                      ☎
                    </div>
                    <div className="contact-direct-content">
                      <span>Phone</span>
                      <strong>+91 91127 67997</strong>
                    </div>
                    <span className="contact-direct-arrow">→</span>
                  </a>
                </div>

                <div className="contact-points">
                  <div>
                    <strong>01</strong>
                    <span>Share your requirement</span>
                  </div>
                  <div>
                    <strong>02</strong>
                    <span>Technical information</span>
                  </div>
                  <div>
                    <strong>03</strong>
                    <span>Connect with relevant specialists</span>
                  </div>
                </div>
              </div>

              <div
                className="contact-card"
                data-reveal
                style={{ transitionDelay: '0.12s' }}
              >
                <h3>Send an Enquiry</h3>
                <p>Fill in your details and our team will get back to you.</p>

                <form
                  className="contact-form"
                  onSubmit={handleContactSubmit}
                >
                  <div className="form-row">
                    <input
                      type="text"
                      name="name"
                      placeholder="Name"
                      value={contactForm.name}
                      onChange={handleContactChange}
                      required
                    />
                    <input
                      type="tel"
                      name="mobile"
                      placeholder="Mobile Number"
                      value={contactForm.mobile}
                      onChange={handleContactChange}
                      required
                    />
                  </div>

                  <input
                    type="email"
                    name="email"
                    placeholder="Email ID"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    required
                  />

                  <textarea
                    name="message"
                    placeholder="Tell us about your requirement..."
                    rows="5"
                    value={contactForm.message}
                    onChange={handleContactChange}
                    required
                  />

                  {contactSuccess && (
                    <div className="contact-success">
                      ✓ {contactSuccess}
                    </div>
                  )}

                  {contactError && (
                    <div className="contact-error">{contactError}</div>
                  )}

                  <button
                    type="submit"
                    className="contact-submit"
                    disabled={contactLoading}
                  >
                    {contactLoading ? 'SENDING...' : 'SEND ENQUIRY'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FOOTER ================= */}

        <footer className="footer">
          <div className="section-container">
            <div className="footer-main">
              <div className="footer-brand">
                <img src="/logo2.jpeg" alt="S&M CleanTech" />
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
                  Industrial CleanTech
                  <br />
                  Engineering &amp; EPC Network
                </p>
                <p>Email: info@smcleantech.com</p>
                <p>India</p>
              </div>
            </div>

            <div className="footer-bottom">
              <span>© 2026 SM CleanTech Engineering Solutions</span>
              <span>Water • Waste • Solar • ESG • SPCB</span>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
