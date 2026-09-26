import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  /* ================= SCROLL ================= */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  /* ================= CLOSE MOBILE MENU ================= */

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  /* ================= BODY SCROLL ================= */

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  /* ================= CLOSE MENU ================= */

  const closeMenu = () => {
    setMenuOpen(false)
  }

  /* ================= CONTACT SCROLL ================= */

  const handleContactClick = (e) => {
    e.preventDefault()

    closeMenu()

    // Already on Home page
    if (location.pathname === '/') {
      const contactSection = document.getElementById('contact')

      if (contactSection) {
        contactSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }

      return
    }

    // If on another page, first go to Home
    navigate('/')

    // Wait for Home page to render
    setTimeout(() => {
      const contactSection = document.getElementById('contact')

      if (contactSection) {
        contactSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    }, 150)
  }


  const handleHomeClick = (e) => {
  e.preventDefault()
  closeMenu()

  if (location.pathname === '/') {
    // Already on Home page → scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  } else {
    // Another page → go to Home
    navigate('/')
    
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }, 150)
  }
}

  /* ================= LOGOUT ================= */

  const handleLogout = () => {
    logout()
    closeMenu()
    navigate('/')
  }

  /* ================= DASHBOARD ================= */

  const dashboardPath = user
    ? user.role === 'admin'
      ? '/admin'
      : user.role === 'buyer'
        ? '/buyer'
        : '/vendor'
    : '/login'

  return (
    <header
      className={`navbar ${
        scrolled ? 'navbar--scrolled' : ''
      }`}
    >
      <div className="navbar__container">

        {/* ================= LOGO ================= */}

        <Link
          to="/"
          className="navbar__brand"
          onClick={closeMenu}
        >
          <img
            src="/logo2.jpeg"
            alt="S&M CleanTech"
            className="navbar__logo-image"
          />
        </Link>

        {/* ================= DESKTOP NAV ================= */}

        <nav className="navbar__desktop">

          {/* HOME */}

         <a
  href="/"
  className={`navbar__link ${
    location.pathname === '/'
      ? 'navbar__link--active'
      : ''
  }`}
  onClick={handleHomeClick}
>
  Home
</a>

          {/* DOMAIN */}

          <Link
            to="/solutions"
            className={`navbar__link ${
              location.pathname === '/solutions'
                ? 'navbar__link--active'
                : ''
            }`}
          >
            Domain
          </Link>

          {/* ABOUT US */}

          <Link
            to="/how-it-works"
            className={`navbar__link ${
              location.pathname === '/how-it-works'
                ? 'navbar__link--active'
                : ''
            }`}
          >
            About Us
          </Link>

          {/* CONTACT US */}

          <a
            href="#contact"
            className="navbar__link"
            onClick={handleContactClick}
          >
            Contact Us
          </a>

          {/* ================= AUTH ================= */}

          {!user ? (
            <div className="navbar__auth">

              {/* LOGIN */}

              <Link
                to="/login"
                className="navbar__login"
              >
                Login
              </Link>

              {/* BUYER REGISTER */}

              <Link
                to="/register/buyer"
                className="navbar__register navbar__register--buyer"
              >
                Register as Buyer
              </Link>

              {/* VENDOR REGISTER */}

              <Link
                to="/register/vendor"
                className="navbar__register navbar__register--vendor"
              >
                Register as Vendor
              </Link>

            </div>
          ) : (
            <div className="navbar__auth">

              {/* DASHBOARD */}

              <Link
                to={dashboardPath}
                className="navbar__dashboard"
              >
                Dashboard
              </Link>

              {/* LOGOUT */}

              <button
                type="button"
                className="navbar__logout"
                onClick={handleLogout}
              >
                Logout
              </button>

            </div>
          )}

        </nav>

        {/* ================= MOBILE MENU BUTTON ================= */}

        <button
          type="button"
          className={`navbar__mobile-btn ${
            menuOpen
              ? 'navbar__mobile-btn--active'
              : ''
          }`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

      </div>

      {/* ================= MOBILE NAV ================= */}

      <div
        className={`navbar__mobile ${
          menuOpen
            ? 'navbar__mobile--open'
            : ''
        }`}
      >
        <div className="navbar__mobile-inner">

          {/* HOME */}

          <a
  href="/"
  className="navbar__mobile-link"
  onClick={handleHomeClick}
>
  Home
</a>

          {/* DOMAIN */}

          <Link
            to="/solutions"
            className="navbar__mobile-link"
            onClick={closeMenu}
          >
            Domain
          </Link>

          {/* ABOUT US */}

          <Link
            to="/how-it-works"
            className="navbar__mobile-link"
            onClick={closeMenu}
          >
            About Us
          </Link>

          {/* CONTACT US */}

          <a
            href="#contact"
            className="navbar__mobile-link"
            onClick={handleContactClick}
          >
            Contact Us
          </a>

          {/* ================= MOBILE AUTH ================= */}

          {!user ? (
            <div className="navbar__mobile-auth">

              {/* LOGIN */}

              <Link
                to="/login"
                className="navbar__mobile-login"
                onClick={closeMenu}
              >
                Login
              </Link>

              {/* BUYER */}

              <Link
                to="/register/buyer"
                className="navbar__mobile-register navbar__mobile-register--buyer"
                onClick={closeMenu}
              >
                Register as Buyer
              </Link>

              {/* VENDOR */}

              <Link
                to="/register/vendor"
                className="navbar__mobile-register navbar__mobile-register--vendor"
                onClick={closeMenu}
              >
                Register as Vendor
              </Link>

            </div>
          ) : (
            <div className="navbar__mobile-auth">

              {/* DASHBOARD */}

              <Link
                to={dashboardPath}
                className="navbar__mobile-dashboard"
                onClick={closeMenu}
              >
                Dashboard
              </Link>

              {/* LOGOUT */}

              <button
                type="button"
                className="navbar__mobile-logout"
                onClick={handleLogout}
              >
                Logout
              </button>

            </div>
          )}

        </div>
      </div>
    </header>
  )
}