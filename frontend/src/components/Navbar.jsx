import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/');
  };

  const dashboardPath = user
    ? user.role === 'admin'
      ? '/admin'
      : user.role === 'buyer'
        ? '/buyer'
        : '/vendor'
    : '/login';

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__container">

        {/* ================= BRAND ================= */}
        <Link
          to="/"
          className="navbar__brand"
          onClick={closeMenu}
        >
          <div className="navbar__logo">
            <img
              src="/logo.jpeg"
              alt="SM Clean Tech"
            />
          </div>

          <div className="navbar__brand-text">
            <strong>SM Clean Tech</strong>
            <span>Engineering Solutions</span>
          </div>
        </Link>


        {/* ================= DESKTOP NAV ================= */}
        <nav className="navbar__desktop">

          <a href="/#domains" className="navbar__link">
            Domains
          </a>

          <Link to="/solutions" className="navbar__link">
            Solutions
          </Link>

          <Link to="/how-it-works" className="navbar__link">
            How It Works
          </Link>

          <a href="/#why-us" className="navbar__link">
            Why Us
          </a>

          <a href="/#contact" className="navbar__link">
            Contact
          </a>


          {/* ================= AUTH ================= */}
          {!user ? (
            <div className="navbar__auth">

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
                <span>Register as Buyer</span>

                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </Link>

              {/* SELLER REGISTER */}
              <Link
                to="/register/vendor"
                className="navbar__register navbar__register--seller"
              >
                <span>Register as Seller</span>

                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </Link>

            </div>
          ) : (
            <div className="navbar__auth">

              <Link
                to={dashboardPath}
                className="navbar__dashboard"
              >
                Dashboard
              </Link>

              <button
                className="navbar__logout"
                onClick={handleLogout}
              >
                Logout
              </button>

            </div>
          )}

        </nav>


        {/* ================= MOBILE BUTTON ================= */}
        <button
          className={`navbar__mobile-btn ${
            menuOpen ? 'navbar__mobile-btn--active' : ''
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
          menuOpen ? 'navbar__mobile--open' : ''
        }`}
      >

        <div className="navbar__mobile-inner">

          <a
            href="/#domains"
            onClick={closeMenu}
            className="navbar__mobile-link"
          >
            Domains
          </a>

          <Link
            to="/solutions"
            onClick={closeMenu}
            className="navbar__mobile-link"
          >
            Solutions
          </Link>

          <Link
            to="/how-it-works"
            onClick={closeMenu}
            className="navbar__mobile-link"
          >
            How It Works
          </Link>

          <a
            href="/#why-us"
            onClick={closeMenu}
            className="navbar__mobile-link"
          >
            Why Us
          </a>

          <a
            href="/#contact"
            onClick={closeMenu}
            className="navbar__mobile-link"
          >
            Contact
          </a>


          {/* ================= MOBILE AUTH ================= */}
          {!user ? (
            <div className="navbar__mobile-auth">

              <Link
                to="/login"
                onClick={closeMenu}
                className="navbar__mobile-login"
              >
                Login
              </Link>

              <Link
                to="/register/buyer"
                onClick={closeMenu}
                className="navbar__mobile-register navbar__mobile-register--buyer"
              >
                Register as Buyer
              </Link>

              <Link
                to="/register/seller"
                onClick={closeMenu}
                className="navbar__mobile-register navbar__mobile-register--seller"
              >
                Register as Seller
              </Link>

            </div>
          ) : (
            <div className="navbar__mobile-auth">

              <Link
                to={dashboardPath}
                onClick={closeMenu}
                className="navbar__mobile-dashboard"
              >
                Dashboard
              </Link>

              <button
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
  );
}