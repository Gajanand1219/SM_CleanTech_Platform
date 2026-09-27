import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
const INITIAL_SUGGESTIONS = [
  {
    icon: '🌱',
    text: 'What is SM CleanTech?',
  },
  {
    icon: '💧',
    text: 'Water & Wastewater solutions',
  },
  {
    icon: '☀️',
    text: 'Solar & Renewable solutions',
  },
  {
    icon: '🌍',
    text: 'Carbon & ESG solutions',
  },
  {
    icon: '🏭',
    text: 'Pollution Control solutions',
  },
  {
    icon: '🏢',
    text: 'How to register as Buyer?',
  },
  {
    icon: '⚙️',
    text: 'How to register as Vendor?',
  },
  {
    icon: '🤝',
    text: 'How does matching work?',
  },
]

export default function Chatbot() {

  const navigate = useNavigate()

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Namaskar! 👋 Welcome to SM CleanTech AI Assistant. You can ask about our CleanTech platform, solutions, buyer/vendor registration, matching and project workflow.',
      suggestions: INITIAL_SUGGESTIONS.slice(0, 5),
    },
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const messagesEndRef = useRef(null)


  /* =====================================================
     AUTO SCROLL
  ===================================================== */

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })

  }, [messages, loading])


  /* =====================================================
     SEND MESSAGE

     BACKEND WILL BE CONNECTED HERE LATER
  ===================================================== */

async function sendMessage(customText = '') {
  const question = (customText || input).trim()

  if (!question || loading) {
    return
  }

  // USER MESSAGE
  const userMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: question,
  }

  setMessages((prev) => [
    ...prev,
    userMessage,
  ])

  setInput('')
  setLoading(true)

  try {
    const response = await fetch(
      'https://sm-cleantech-platform.onrender.com/api/chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data?.detail ||
        'Unable to get response from AI.'
      )
    }

    const botMessage = {
      id: `bot-${Date.now()}`,
      role: 'assistant',
      content:
        data?.answer ||
        'Sorry, I could not generate an answer.',
      suggestions: [],
    }

    setMessages((prev) => [
      ...prev,
      botMessage,
    ])

  } catch (error) {

    console.error(
      'SM CleanTech chatbot error:',
      error
    )

    const errorMessage = {
      id: `error-${Date.now()}`,
      role: 'assistant',
      content:
        '⚠️ Sorry, I am unable to connect to the AI service right now. Please make sure the SM CleanTech backend is running.',
      suggestions: [],
    }

    setMessages((prev) => [
      ...prev,
      errorMessage,
    ])

  } finally {
    setLoading(false)
  }
}

  /* =====================================================
     CLEAR CHAT
  ===================================================== */

  function clearChat() {

    setMessages([
      {
        id: `welcome-${Date.now()}`,

        role: 'assistant',

        content:
          'Namaskar! 👋 Welcome to SM CleanTech AI Assistant. How can I help you?',

        suggestions:
          INITIAL_SUGGESTIONS.slice(0, 5),
      },
    ])

    setInput('')
  }


  /* =====================================================
     ENTER KEY
  ===================================================== */

  function handleKeyDown(e) {

    if (
      e.key === 'Enter' &&
      !e.shiftKey
    ) {

      e.preventDefault()

      sendMessage()
    }
  }


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div className="sm-chat-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sm-chat-header">

        <div className="sm-chat-header-inner">

          <button
            type="button"
            className="sm-chat-back"
            onClick={() => navigate(-1)}
            title="Back"
          >
            ←
          </button>


          <div className="sm-chat-header-icon">
            🤖
          </div>


          <div className="sm-chat-header-info">

            <h1>
              SM CleanTech AI Assistant
            </h1>

            <p>
              CleanTech Solutions · Platform Support
            </p>

          </div>


          <div className="sm-chat-header-right">

            <span className="sm-chat-status">

              <span />

              AI Assistant

            </span>


            <button
              type="button"
              className="sm-chat-clear"
              onClick={clearChat}
              title="Clear chat"
            >
              🗑️
            </button>

          </div>

        </div>

      </header>


      {/* =================================================
          MAIN CHAT
      ================================================= */}

      <main className="sm-chat-main">

        {/* MESSAGE AREA */}

        <div className="sm-chat-messages">

          <div className="sm-chat-message-container">

            {messages.map((message) => {

              const isUser =
                message.role === 'user'

              return (

                <div
                  key={message.id}
                  className={`sm-chat-message-row ${
                    isUser
                      ? 'sm-chat-user-row'
                      : ''
                  }`}
                >

                  {/* BOT ICON */}

                  {!isUser && (

                    <div className="sm-chat-avatar">
                      🤖
                    </div>

                  )}


                  {/* MESSAGE */}

                  <div className="sm-chat-message-content">

                    <div className="sm-chat-message-label">

                      {isUser
                        ? '👤 You'
                        : '🤖 SM CleanTech AI'}

                    </div>


                    <div
                      className={`sm-chat-bubble ${
                        isUser
                          ? 'sm-chat-user-bubble'
                          : 'sm-chat-bot-bubble'
                      }`}
                    >

                      {message.content}

                    </div>


                    {/* SUGGESTIONS */}

                    {!isUser &&
                      message.suggestions?.length > 0 && (

                        <div className="sm-chat-suggestions">

                          {message.suggestions.map(
                            (suggestion, index) => (

                              <button
                                key={index}
                                type="button"
                                onClick={() =>
                                  sendMessage(
                                    suggestion.text
                                  )
                                }
                              >

                                <span>
                                  {suggestion.icon}
                                </span>

                                {suggestion.text}

                              </button>

                            )
                          )}

                        </div>

                      )}

                  </div>

                </div>

              )

            })}


            {/* LOADING */}

            {loading && (

              <div className="sm-chat-message-row">

                <div className="sm-chat-avatar">
                  🤖
                </div>

                <div className="sm-chat-message-content">

                  <div className="sm-chat-message-label">
                    🤖 SM CleanTech AI
                  </div>

                  <div className="sm-chat-loading">

                    <span />
                    <span />
                    <span />

                  </div>

                </div>

              </div>

            )}


            <div ref={messagesEndRef} />

          </div>

        </div>


        {/* =================================================
            INPUT
        ================================================= */}

        <div className="sm-chat-input-area">

          <div className="sm-chat-input-box">

            <textarea
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Ask about CleanTech solutions, registration, matching..."
              rows={1}
            />


            <button
              type="button"
              onClick={() =>
                sendMessage()
              }
              disabled={
                loading ||
                !input.trim()
              }
              className="sm-chat-send"
              title="Send message"
            >
              ➤
            </button>

          </div>


          <div className="sm-chat-input-hint">
            Press Enter to send
          </div>

        </div>

      </main>


      {/* =================================================
          STYLES
      ================================================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }


        /* ================= PAGE ================= */

        .sm-chat-page {

          width: 100%;

          height: 100vh;
          height: 100dvh;

          display: flex;
          flex-direction: column;

          overflow: hidden;

          background: #f6faf8;

          color: #17201c;

          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }


        /* ================= HEADER ================= */

        .sm-chat-header {

          flex-shrink: 0;

          background:
            linear-gradient(
              135deg,
              #087f45,
              #0b8f50,
              #15965a
            );

          color: #ffffff;

          box-shadow:
            0 5px 20px rgba(20,70,45,0.15);
        }


        .sm-chat-header-inner {

          width: min(1100px, 94%);

          min-height: 74px;

          margin: 0 auto;

          display: flex;
          align-items: center;

          gap: 12px;
        }


        /* BACK */

        .sm-chat-back {

          width: 38px;
          height: 38px;

          flex-shrink: 0;

          border:
            1px solid
            rgba(255,255,255,0.25);

          border-radius: 10px;

          background:
            rgba(255,255,255,0.12);

          color: #ffffff;

          font-size: 20px;

          cursor: pointer;

          transition: 0.2s ease;
        }

        .sm-chat-back:hover {

          background:
            rgba(255,255,255,0.2);
        }


        /* HEADER ICON */

        .sm-chat-header-icon {

          width: 45px;
          height: 45px;

          flex-shrink: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 13px;

          background:
            rgba(255,255,255,0.15);

          font-size: 23px;
        }


        /* HEADER INFO */

        .sm-chat-header-info {

          min-width: 0;

          flex: 1;
        }

        .sm-chat-header-info h1 {

          margin: 0 0 3px;

          font-size: 18px;
          line-height: 1.2;

          font-weight: 800;
        }

        .sm-chat-header-info p {

          margin: 0;

          color:
            rgba(255,255,255,0.78);

          font-size: 11px;
        }


        /* HEADER RIGHT */

        .sm-chat-header-right {

          display: flex;
          align-items: center;

          gap: 9px;
        }


        .sm-chat-status {

          display: flex;
          align-items: center;

          gap: 6px;

          padding: 7px 10px;

          background:
            rgba(255,255,255,0.12);

          border-radius: 999px;

          font-size: 10px;

          font-weight: 700;
        }

        .sm-chat-status span {

          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #70e394;
        }


        .sm-chat-clear {

          width: 36px;
          height: 36px;

          border:
            1px solid
            rgba(255,255,255,0.2);

          border-radius: 9px;

          background:
            rgba(255,255,255,0.1);

          color: #ffffff;

          cursor: pointer;
        }


        /* ================= MAIN ================= */

        .sm-chat-main {

          width: min(1100px, 100%);

          flex: 1;

          min-height: 0;

          margin: 0 auto;

          display: flex;
          flex-direction: column;

          overflow: hidden;
        }


        /* ================= MESSAGES ================= */

        .sm-chat-messages {

          flex: 1;

          min-height: 0;

          overflow-y: auto;
          overflow-x: hidden;

          padding: 28px 18px;
        }


        .sm-chat-message-container {

          width: min(820px, 100%);

          margin: 0 auto;
        }


        .sm-chat-message-row {

          display: flex;

          align-items: flex-start;

          gap: 10px;

          margin-bottom: 22px;
        }


        .sm-chat-user-row {

          justify-content: flex-end;
        }


        /* BOT AVATAR */

        .sm-chat-avatar {

          width: 35px;
          height: 35px;

          flex: 0 0 35px;

          display: flex;

          align-items: center;
          justify-content: center;

          background: #eaf7f0;

          border:
            1px solid
            #d1e8db;

          border-radius: 11px;

          font-size: 17px;
        }


        /* CONTENT */

        .sm-chat-message-content {

          max-width: 78%;

          min-width: 0;
        }


        .sm-chat-message-label {

          margin: 0 0 5px;

          padding: 0 3px;

          color: #87948e;

          font-size: 9px;

          font-weight: 700;
        }


        /* BUBBLE */

        .sm-chat-bubble {

          padding: 12px 15px;

          border-radius: 16px;

          font-size: 13px;

          line-height: 1.65;

          white-space: pre-wrap;

          overflow-wrap: anywhere;
        }


        .sm-chat-bot-bubble {

          background: #ffffff;

          border:
            1px solid
            #dce7e1;

          border-bottom-left-radius: 5px;

          color: #26372f;

          box-shadow:
            0 4px 14px
            rgba(20,70,45,0.05);
        }


        .sm-chat-user-bubble {

          background:
            linear-gradient(
              135deg,
              #087f45,
              #15965a
            );

          color: #ffffff;

          border-bottom-right-radius: 5px;

          box-shadow:
            0 5px 18px
            rgba(8,127,69,0.18);
        }


        /* ================= SUGGESTIONS ================= */

        .sm-chat-suggestions {

          display: flex;

          flex-wrap: wrap;

          gap: 7px;

          margin-top: 9px;
        }


        .sm-chat-suggestions button {

          display: flex;

          align-items: center;

          gap: 6px;

          padding: 7px 10px;

          background: #ffffff;

          border:
            1px solid
            #d7e5dd;

          border-radius: 999px;

          color: #315442;

          font-size: 10px;

          font-weight: 700;

          cursor: pointer;

          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            transform 0.2s ease;
        }


        .sm-chat-suggestions button:hover {

          background: #edf8f2;

          border-color: #a9d3ba;

          transform:
            translateY(-1px);
        }


        /* ================= LOADING ================= */

        .sm-chat-loading {

          display: flex;

          align-items: center;

          gap: 5px;

          width: fit-content;

          padding: 13px 16px;

          background: #ffffff;

          border:
            1px solid
            #dce7e1;

          border-radius: 15px;
        }


        .sm-chat-loading span {

          width: 6px;
          height: 6px;

          border-radius: 50%;

          background: #087f45;

          animation:
            smChatTyping 1.2s infinite;
        }


        .sm-chat-loading span:nth-child(2) {

          animation-delay:
            0.15s;
        }


        .sm-chat-loading span:nth-child(3) {

          animation-delay:
            0.3s;
        }


        @keyframes smChatTyping {

          0%,
          60%,
          100% {

            opacity: 0.25;

            transform:
              translateY(0);
          }

          30% {

            opacity: 1;

            transform:
              translateY(-3px);
          }

        }


        /* ================= INPUT ================= */

        .sm-chat-input-area {

          flex-shrink: 0;

          padding:
            13px
            18px
            15px;

          background: #ffffff;

          border-top:
            1px solid
            #dce7e1;
        }


        .sm-chat-input-box {

          width:
            min(820px, 100%);

          margin: 0 auto;

          display: flex;

          align-items: flex-end;

          gap: 8px;

          padding: 7px;

          background: #f7fbf9;

          border:
            1px solid
            #cfded5;

          border-radius: 14px;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }


        .sm-chat-input-box:focus-within {

          border-color:
            #087f45;

          box-shadow:
            0 0 0 3px
            rgba(8,127,69,0.08);
        }


        .sm-chat-input-box textarea {

          flex: 1;

          min-width: 0;

          min-height: 40px;

          max-height: 100px;

          padding:
            10px 9px;

          border: none;

          outline: none;

          resize: none;

          background: transparent;

          color: #26372f;

          font-family: inherit;

          font-size: 13px;

          line-height: 1.5;
        }


        .sm-chat-input-box textarea::placeholder {

          color: #89968f;
        }


        .sm-chat-send {

          width: 42px;
          height: 42px;

          flex:
            0 0 42px;

          border: none;

          border-radius: 11px;

          background:
            linear-gradient(
              135deg,
              #087f45,
              #15965a
            );

          color: #ffffff;

          font-size: 18px;

          cursor: pointer;

          transition:
            transform 0.2s ease,
            opacity 0.2s ease;
        }


        .sm-chat-send:hover:not(:disabled) {

          transform:
            scale(1.05);
        }


        .sm-chat-send:disabled {

          opacity: 0.4;

          cursor:
            not-allowed;
        }


        .sm-chat-input-hint {

          width:
            min(820px, 100%);

          margin:
            5px auto 0;

          color: #9aa59f;

          text-align: center;

          font-size: 8px;
        }


        /* ================= MOBILE ================= */

        @media (max-width: 700px) {

          .sm-chat-header-inner {

            width: 100%;

            min-height: 62px;

            padding:
              8px 12px;

            gap: 8px;
          }


          .sm-chat-back {

            width: 34px;
            height: 34px;
          }


          .sm-chat-header-icon {

            width: 38px;
            height: 38px;

            border-radius: 10px;

            font-size: 19px;
          }


          .sm-chat-header-info h1 {

            font-size: 14px;
          }


          .sm-chat-header-info p {

            font-size: 8px;
          }


          .sm-chat-status {

            padding:
              6px 8px;

            font-size: 8px;
          }


          .sm-chat-clear {

            width: 33px;
            height: 33px;
          }


          .sm-chat-messages {

            padding:
              18px 10px;
          }


          .sm-chat-message-content {

            max-width: 84%;
          }


          .sm-chat-bubble {

            padding:
              10px 12px;

            font-size: 12px;

            line-height: 1.6;
          }


          .sm-chat-avatar {

            width: 31px;
            height: 31px;

            flex-basis: 31px;

            font-size: 15px;
          }


          .sm-chat-suggestions {

            gap: 6px;
          }


          .sm-chat-suggestions button {

            font-size: 9px;

            padding:
              6px 9px;
          }


          .sm-chat-input-area {

            padding:
              9px
              9px
              10px;
          }


          .sm-chat-input-box {

            border-radius: 12px;
          }


          .sm-chat-input-box textarea {

            font-size: 16px;
          }


          .sm-chat-send {

            width: 40px;
            height: 40px;

            flex-basis: 40px;
          }


          .sm-chat-input-hint {

            display: none;
          }

        }


        @media (prefers-reduced-motion: reduce) {

          .sm-chat-loading span {

            animation: none;
          }

        }

      `}</style>

    </div>
  )
}
