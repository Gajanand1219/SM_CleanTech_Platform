import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function FloatingChatButton() {
  const navigate = useNavigate()

  const [showMessage, setShowMessage] = useState(false)
  const [alert, setAlert] = useState(true)

  useEffect(() => {
    const messageTimer = setTimeout(() => {
      setShowMessage(true)
    }, 2500)

    const hideTimer = setTimeout(() => {
      setShowMessage(false)
      setAlert(false)
    }, 8000)

    return () => {
      clearTimeout(messageTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  const openChatbot = () => {
    setShowMessage(false)
    setAlert(false)
    navigate('/chatbot')
  }

  return (
    <>
      {/* =====================================================
          DESKTOP CHATBOT
      ===================================================== */}

      <div className="sm-chat-desktop">

        {showMessage && (
          <div className="sm-chat-popup">

            <div className="sm-chat-popup-icon">
              🤖
            </div>

            <div className="sm-chat-popup-content">
              <strong>SM CleanTech AI</strong>

              <span>
                Hi! 👋 How can I help you?
              </span>
            </div>

            <div className="sm-chat-popup-arrow" />

          </div>
        )}

        <button
          type="button"
          onClick={openChatbot}
          className={`sm-chat-button ${
            alert ? 'sm-chat-alert' : ''
          }`}
          aria-label="Open SM CleanTech AI Assistant"
          title="SM CleanTech AI Assistant"
        >

          {alert && (
            <>
              <span className="sm-chat-ring sm-chat-ring-one" />
              <span className="sm-chat-ring sm-chat-ring-two" />
            </>
          )}

          <span className="sm-chat-robot">
            🤖
          </span>

          <span className="sm-chat-online" />

          {alert && (
            <span className="sm-chat-badge">
              1
            </span>
          )}

        </button>

        <div className="sm-chat-label">
          🤖 SM CleanTech AI
        </div>

      </div>


      {/* =====================================================
          MOBILE CHATBOT
      ===================================================== */}

      <div className="sm-chat-mobile">

        {showMessage && (
          <div className="sm-chat-mobile-popup">

            <div className="sm-chat-mobile-icon">
              🤖
            </div>

            <div>
              <strong>
                SM CleanTech AI
              </strong>

              <span>
                Need help? 👋
              </span>
            </div>

          </div>
        )}

        <button
          type="button"
          onClick={openChatbot}
          className={`sm-chat-button sm-chat-button-mobile ${
            alert ? 'sm-chat-alert' : ''
          }`}
          aria-label="Open SM CleanTech AI Assistant"
          title="SM CleanTech AI Assistant"
        >

          {alert && (
            <>
              <span className="sm-chat-ring sm-chat-ring-one" />
              <span className="sm-chat-ring sm-chat-ring-two" />
            </>
          )}

          <span className="sm-chat-robot">
            🤖
          </span>

          <span className="sm-chat-online" />

          {alert && (
            <span className="sm-chat-badge">
              1
            </span>
          )}

        </button>

      </div>


      {/* =====================================================
          STYLES
      ===================================================== */}

      <style>{`

        .sm-chat-desktop {
          position: fixed;
          right: 25px;
          bottom: 25px;
          z-index: 9999;

          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }

        .sm-chat-mobile {
          display: none;
        }


        /* ================= POPUP ================= */

        .sm-chat-popup {
          position: relative;

          display: flex;
          align-items: center;
          gap: 11px;

          width: 245px;
          padding: 12px 14px;

          background: #ffffff;

          border: 1px solid #dce7e1;
          border-radius: 15px;

          box-shadow:
            0 12px 35px rgba(20, 70, 45, 0.15);

          animation: smChatPopup 0.4s ease;
        }

        .sm-chat-popup-icon {
          width: 38px;
          height: 38px;

          flex: 0 0 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #eaf7f0;

          border-radius: 11px;

          font-size: 20px;
        }

        .sm-chat-popup-content {
          min-width: 0;
        }

        .sm-chat-popup strong {
          display: block;

          margin-bottom: 3px;

          color: #183d2e;

          font-size: 12px;
          font-weight: 800;
        }

        .sm-chat-popup span {
          display: block;

          color: #6b7c73;

          font-size: 10px;
        }

        .sm-chat-popup-arrow {
          position: absolute;

          right: 24px;
          bottom: -7px;

          width: 14px;
          height: 14px;

          background: #ffffff;

          border-right: 1px solid #dce7e1;
          border-bottom: 1px solid #dce7e1;

          transform: rotate(45deg);
        }


        /* ================= BUTTON ================= */

        .sm-chat-button {
          position: relative;

          width: 62px;
          height: 62px;

          border: 2px solid #ffffff;
          border-radius: 50%;

          background:
            linear-gradient(
              135deg,
              #087f45,
              #15965a,
              #35ad70
            );

          color: #ffffff;

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;

          box-shadow:
            0 10px 30px rgba(8, 127, 69, 0.35);

          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease;
        }

        .sm-chat-button:hover {
          transform: scale(1.08);

          box-shadow:
            0 14px 38px rgba(8, 127, 69, 0.45);
        }

        .sm-chat-button:active {
          transform: scale(0.94);
        }

        .sm-chat-robot {
          position: relative;
          z-index: 3;

          font-size: 28px;
        }


        /* ================= ONLINE ================= */

        .sm-chat-online {
          position: absolute;

          top: 1px;
          right: 1px;

          width: 15px;
          height: 15px;

          background: #43c76b;

          border: 2px solid #ffffff;

          border-radius: 50%;

          z-index: 5;
        }


        /* ================= BADGE ================= */

        .sm-chat-badge {
          position: absolute;

          top: -7px;
          left: -7px;

          min-width: 22px;
          height: 22px;

          padding: 0 5px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #e53935;

          color: #ffffff;

          border: 2px solid #ffffff;

          border-radius: 50%;

          font-size: 10px;
          font-weight: 800;

          z-index: 6;

          animation:
            smChatBadge 0.8s ease-in-out infinite;
        }


        /* ================= ALERT ================= */

        .sm-chat-alert {
          animation:
            smChatAlert 1.5s ease-in-out infinite;
        }


        /* ================= RINGS ================= */

        .sm-chat-ring {
          position: absolute;

          border: 2px solid #35a56b;

          border-radius: 50%;

          pointer-events: none;
        }

        .sm-chat-ring-one {
          inset: -7px;

          animation:
            smChatRing 1.5s ease-out infinite;
        }

        .sm-chat-ring-two {
          inset: -14px;

          animation:
            smChatRing 1.5s ease-out infinite 0.55s;
        }


        /* ================= LABEL ================= */

        .sm-chat-label {
          padding: 7px 13px;

          background: rgba(255,255,255,0.96);

          border: 1px solid #dce7e1;

          border-radius: 999px;

          color: #315442;

          font-size: 10px;
          font-weight: 800;

          box-shadow:
            0 5px 18px rgba(20,70,45,0.10);
        }


        /* ================= ANIMATIONS ================= */

        @keyframes smChatAlert {

          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-6px);
          }

        }

        @keyframes smChatRing {

          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }

          70% {
            transform: scale(1.3);
            opacity: 0;
          }

          100% {
            transform: scale(1.3);
            opacity: 0;
          }

        }

        @keyframes smChatBadge {

          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.2);
          }

        }

        @keyframes smChatPopup {

          from {
            opacity: 0;
            transform:
              translateY(10px)
              scale(0.95);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }

        }


        /* ================= MOBILE ================= */

        @media (max-width: 700px) {

          .sm-chat-desktop {
            display: none;
          }

          .sm-chat-mobile {
            position: fixed;

            right: 16px;
            bottom: 82px;

            z-index: 9999;

            display: flex;

            flex-direction: column;
            align-items: flex-end;

            gap: 9px;
          }

          .sm-chat-mobile-popup {
            display: flex;
            align-items: center;

            gap: 8px;

            padding: 9px 11px;

            max-width: 205px;

            background: #ffffff;

            border: 1px solid #dce7e1;

            border-radius: 13px;

            box-shadow:
              0 10px 28px rgba(20,70,45,0.14);

            animation:
              smChatPopup 0.4s ease;
          }

          .sm-chat-mobile-icon {
            width: 30px;
            height: 30px;

            flex: 0 0 30px;

            display: flex;
            align-items: center;
            justify-content: center;

            background: #eaf7f0;

            border-radius: 9px;

            font-size: 16px;
          }

          .sm-chat-mobile-popup strong {
            display: block;

            color: #183d2e;

            font-size: 10px;
          }

          .sm-chat-mobile-popup span {
            display: block;

            margin-top: 2px;

            color: #718178;

            font-size: 9px;
          }

          .sm-chat-button-mobile {
            width: 58px;
            height: 58px;
          }

          .sm-chat-button-mobile .sm-chat-robot {
            font-size: 25px;
          }

          .sm-chat-label {
            display: none;
          }

        }


        @media (prefers-reduced-motion: reduce) {

          .sm-chat-alert,
          .sm-chat-ring-one,
          .sm-chat-ring-two,
          .sm-chat-badge {
            animation: none !important;
          }

        }

      `}</style>
    </>
  )
}