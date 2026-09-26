import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import '../styles/Home.css'
import '../styles/Static.css'
import API from '../services/api'
import { useEffect, useState } from 'react'

const solutionsList = [
  {
    name: 'Water & Wastewater',
    icon: '💧',
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

export default function Home() {



const [buyers, setBuyers] = useState([])
const [vendors, setVendors] = useState([])

useEffect(() => {
  const loadNetworkCompanies = async () => {
    try {
      const response = await API.get('/public/network-companies')

      setBuyers(response.data?.buyers || [])
      setVendors(response.data?.vendors || [])

    } catch (error) {
      console.error(
        'Failed to load network companies:',
        error
      )
    }
  }

  loadNetworkCompanies()
}, [])

  const [contactForm, setContactForm] = useState({
    name: '',
    mobile: '',
    email: '',
    message: '',
  })

  const [contactLoading, setContactLoading] = useState(false)
  const [contactSuccess, setContactSuccess] = useState('')
  const [contactError, setContactError] = useState('')

  const handleContactChange = (e) => {
    const { name, value } = e.target

    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }))
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

      const response = await API.post(
        '/public/contact',
        contactForm
      )

      setContactSuccess(
        response.data?.message ||
        'Your enquiry has been sent successfully.'
      )

      setContactForm({
        name: '',
        mobile: '',
        email: '',
        message: '',
      })

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
          <div className="hero__container">

            <div className="hero__content">

              <span className="hero__label">
                Industrial B2B CleanTech Network
              </span>

              <h5 className="hero__title">
                SM CLEANTECH
                <br />
                ENGINEERING SOLUTIONS
              </h5>

              <p className="hero__tagline">
                // DIAGNOSE. MATCH. SOLUTION.
              </p>

              <p className="hero__description">
                We connect genuine industrial requirements with qualified
                engineering, EPC and CleanTech solution providers through a
                structured and transparent technical matching platform.
              </p>

              <div className="hero__buttons">

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

                <Link
                  to="/login"
                  className="home-btn home-btn--login"
                >
                  Login
                </Link>

              </div>

              <div className="hero__mini-info">

                <div>
                  <strong>05</strong>
                  <span>Core Verticals</span>
                </div>

                <div>
                  <strong>10+</strong>
                  <span>Technical Parameters</span>
                </div>

                <div>
                  <strong>240h</strong>
                  <span>Active Window</span>
                </div>

              </div>

            </div>


            {/* ================= PLATFORM FLOW ================= */}

            <div className="hero__right">

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
                    >

                      <div className="platform-flow__number">
                        {String(index + 1).padStart(2, '0')}
                      </div>

                      <div className="platform-flow__text">
                        {step}
                      </div>

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
                  <div className="info-card__icon">
                    🔒
                  </div>

                  <div>
                    <strong>Strict Masking</strong>
                    <span>Zero vendor spam</span>
                  </div>
                </div>


                <div className="info-card">
                  <div className="info-card__icon">
                    ⚡
                  </div>

                  <div>
                    <strong>10 Days Timer</strong>
                    <span>240-hour response window</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </section>


        {/* ================= WHO WE ARE ================= */}

        <section className="about" id="about">

          <div className="section-container">

            <div className="section-heading">

              <span className="section-label">
                ABOUT US
              </span>

              <h2>
                WHO WE ARE
              </h2>

              <p>
                SM CleanTech Engineering Solutions is an industrial B2B
                platform designed to connect genuine project requirements
                with relevant engineering, EPC and CleanTech specialists.
                We structure requirements, technical information and
                matching workflows to make industrial project discovery
                simpler and more organized.
              </p>

            </div>

<div className="solutions-grid">

  {solutionsList.map((solution, index) => (

    <article
      key={solution.name}
      className="solution-card"
    >

      {/* DOMAIN IMAGE */}
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

      {/* CONTENT */}
      <div className="solution-card__body">

        <h2>
          {solution.name}
        </h2>

        <p>
          {solution.desc}
        </p>

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


        {/* ================= VISION MISSION ================= */}

        <section className="vision-mission">

          <div className="section-container">

            <div className="section-heading center">

              <span className="section-label">
                OUR PURPOSE
              </span>

              <h2>
                VISION &amp; MISSION
              </h2>

            </div>


            <div className="vm-grid">

              <div className="vm-card">

                <div className="vm-icon">
                  ◈
                </div>

                <div>

                  <span className="vm-label">
                    OUR VISION
                  </span>

                  <h3>
                    Building a trusted industrial ecosystem
                  </h3>

                  <p>
                    To create a trusted engineering ecosystem where genuine
                    industrial requirements can be connected with qualified
                    technical and CleanTech solution providers.
                  </p>

                </div>

              </div>


              <div className="vm-card">

                <div className="vm-icon">
                  ◎
                </div>

                <div>

                  <span className="vm-label">
                    OUR MISSION
                  </span>

                  <h3>
                    Simplifying industrial project connections
                  </h3>

                  <p>
                    To simplify requirement discovery, technical matching
                    and quotation workflows through structured information,
                    verified participants and mutual-consent processes.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ================= BUYERS ================= */}
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


        <div className="partner-marquee">

          <div className="partner-marquee-track">

            {vendors.length > 0 ? (
              [
                ...vendors,
                ...vendors
              ].map((company, index) => (

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
                      {company.company_name?.charAt(0)?.toUpperCase()}
                    </span>

                  </div>

                  <span className="partner-company-name">
                    {company.company_name}
                  </span>

                </div>

              ))
            ) : (

              <div className="partner-empty">
                No approved vendors yet.
              </div>

            )}

          </div>

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


        <div className="partner-marquee">

          <div className="partner-marquee-track partner-marquee-track--reverse">

            {buyers.length > 0 ? (
              [
                ...buyers,
                ...buyers
              ].map((company, index) => (

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
                      {company.company_name?.charAt(0)?.toUpperCase()}
                    </span>

                  </div>

                  <span className="partner-company-name">
                    {company.company_name}
                  </span>

                </div>

              ))
            ) : (

              <div className="partner-empty">
                No verified buyers yet.
              </div>

            )}

          </div>

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

        <section
          className="contact"
          id="contact"
        >

          <div className="section-container">

            <div className="contact-layout">

              <div className="contact-intro">

                <span className="section-label">
                  CONTACT US
                </span>

                <h2>
                  Have an industrial requirement?
                </h2>

                <p>
                  Tell us about your requirement. Our platform is designed
                  to structure your enquiry and connect it with relevant
                  technical solution providers.
                </p>


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


              <div className="contact-card">

                <h3>
                  Send an Enquiry
                </h3>

                <p>
                  Fill in your details and our team will get back to you.
                </p>


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
                      <div className="contact-error">
                        {contactError}
                      </div>
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

                <img
                  src="/logo2.jpeg"
                  alt="S&M CleanTech"
                />

                <p>
                  SM CleanTech Engineering Solutions
                </p>

                <span>
                  Diagnose. Match. Solution.
                </span>

              </div>


              <div className="footer-column">

                <h4>
                  Platform
                </h4>

                <Link to="/">
                  Home
                </Link>

                <Link to="/solutions">
                  Domain
                </Link>

                <Link to="/how-it-works">
                  About Us
                </Link>

                <a href="#contact">
                  Contact
                </a>

              </div>


              <div className="footer-column">

                <h4>
                  Join Network
                </h4>

                <Link to="/register/buyer">
                  Register as Buyer
                </Link>

                <Link to="/register/vendor">
                  Register as Vendor
                </Link>

                <Link to="/login">
                  Login
                </Link>

              </div>


              <div className="footer-column footer-contact">

                <h4>
                  Contact
                </h4>

                <p>
                  Industrial CleanTech<br />
                  Engineering &amp; EPC Network
                </p>

                <p>
                  Email: info@smcleantech.com
                </p>

                <p>
                  India
                </p>

              </div>

            </div>


            <div className="footer-bottom">

              <span>
                © 2026 SM CleanTech Engineering Solutions
              </span>

              <span>
                Water • Waste • Solar • ESG • SPCB
              </span>

            </div>

          </div>

        </footer>

      </main>
    </>
  )
}