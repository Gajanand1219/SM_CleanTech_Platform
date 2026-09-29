import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/* =========================================================
   INITIAL SUGGESTIONS
   ========================================================= */

const INITIAL_SUGGESTIONS = [
  { icon: '💧', text: 'Water & Wastewater Treatment' },
  { icon: '♻️', text: 'Solid & Hazardous Waste' },
  { icon: '☀️', text: 'Solar & Renewables' },
  { icon: '🌱', text: 'Carbon & ESG' },
  { icon: '🏭', text: 'SPCB Consents & Air Pollution' },
]

/* =========================================================
   FORMAT BOT ANSWER
   - Converts markdown-ish text into structured blocks
   - **Heading**  -> <h4>
   - ## Heading   -> <h3>
   - ### Heading  -> <h4>
   - - item       -> <li>
   - * item       -> <li>
   - 1. item      -> <li>
   - | a | b |    -> <table>
   - Plain text   -> <p>
   ========================================================= */

function formatAnswer(raw) {
  if (!raw || typeof raw !== 'string') return null

  const text = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()

  const lines = text.split('\n')

  const blocks = []
  let listBuffer = []
  let tableBuffer = []

  const flushList = () => {
    if (listBuffer.length === 0) return
    blocks.push({
      type: 'list',
      items: [...listBuffer],
    })
    listBuffer = []
  }

  const flushTable = () => {
    if (tableBuffer.length === 0) return
    blocks.push({
      type: 'table',
      rows: [...tableBuffer],
    })
    tableBuffer = []
  }

  const isTableRow = (line) =>
    /^\s*\|.*\|\s*$/.test(line)

  const parseTableRow = (line) =>
    line
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim())

  lines.forEach((rawLine) => {
    const line = rawLine.trim()

    /* ------- EMPTY LINE ------- */
    if (!line) {
      flushList()
      flushTable()
      return
    }

    /* ------- TABLE ROW ------- */
    if (isTableRow(line)) {
      // Separator row |---|---|
      if (/^\s*\|[\s\-:|]+\|\s*$/.test(line)) {
        return
      }
      flushList()
      tableBuffer.push(parseTableRow(line))
      return
    }

    /* ------- LIST ITEM ------- */
    const listMatch = line.match(/^[\-\*•]\s+(.+)$/)
    const numListMatch = line.match(/^\d+[\.\)]\s+(.+)$/)

    if (listMatch || numListMatch) {
      flushTable()
      listBuffer.push(
        listMatch ? listMatch[1] : numListMatch[1]
      )
      return
    }

    /* ------- HEADINGS ------- */
    if (/^###\s+/.test(line)) {
      flushList()
      flushTable()
      blocks.push({
        type: 'h4',
        text: line.replace(/^###\s+/, ''),
      })
      return
    }

    if (/^##\s+/.test(line)) {
      flushList()
      flushTable()
      blocks.push({
        type: 'h3',
        text: line.replace(/^##\s+/, ''),
      })
      return
    }

    if (/^#\s+/.test(line)) {
      flushList()
      flushTable()
      blocks.push({
        type: 'h3',
        text: line.replace(/^#\s+/, ''),
      })
      return
    }

    /* ------- BOLD / BULLET-PREFIX HEADING ------- */
    // **Heading**
    const boldMatch = line.match(/^\*\*(.+?)\*\*$/)
    if (boldMatch) {
      flushList()
      flushTable()
      blocks.push({
        type: 'h4',
        text: boldMatch[1],
      })
      return
    }

    // Heading: "Something:" (end with colon, short line)
    if (
      line.length < 80 &&
      /:$/.test(line) &&
      !/\*\*/.test(line)
    ) {
      flushList()
      flushTable()
      blocks.push({
        type: 'h4',
        text: line.replace(/:$/, ''),
      })
      return
    }

    /* ------- PARAGRAPH ------- */
    flushList()
    flushTable()
    blocks.push({
      type: 'p',
      text: line,
    })
  })

  flushList()
  flushTable()

  return blocks
}

/* =========================================================
   RENDER INLINE BOLD (**bold**) inside paragraphs / lists
   ========================================================= */

function renderInline(text) {
  if (!text) return null

  const parts = String(text).split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

/* =========================================================
   ANSWER BLOCK RENDERER
   ========================================================= */

function AnswerBlock({ blocks }) {
  if (!blocks || blocks.length === 0) return null

  return (
    <div className="ans">
      {blocks.map((block, i) => {
        /* ---------- HEADING (H3) ---------- */
        if (block.type === 'h3') {
          return (
            <h3 key={i} className="ans__h3">
              {renderInline(block.text)}
            </h3>
          )
        }

        /* ---------- HEADING (H4) ---------- */
        if (block.type === 'h4') {
          return (
            <h4 key={i} className="ans__h4">
              <span className="ans__h4-bar" />
              {renderInline(block.text)}
            </h4>
          )
        }

        /* ---------- LIST ---------- */
        if (block.type === 'list') {
          return (
            <ul key={i} className="ans__list">
              {block.items.map((item, j) => (
                <li key={j} className="ans__list-item">
                  <span className="ans__list-dot" />
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          )
        }

        /* ---------- TABLE ---------- */
        if (block.type === 'table') {
          const [head, ...rows] = block.rows
          return (
            <div key={i} className="ans__table-wrap">
              <table className="ans__table">
                <thead>
                  <tr>
                    {head.map((cell, j) => (
                      <th key={j}>{renderInline(cell)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c}>{renderInline(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        /* ---------- PARAGRAPH ---------- */
        return (
          <p key={i} className="ans__p">
            {renderInline(block.text)}
          </p>
        )
      })}
    </div>
  )
}

/* =========================================================
   CHATBOT COMPONENT
   ========================================================= */

export default function Chatbot() {
  const navigate = useNavigate()

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello 👋 Welcome to SM CleanTech Assistant.\n\nAsk about our CleanTech solutions, buyer/vendor registration, vendor matching, or the project workflow.',
      suggestions: INITIAL_SUGGESTIONS,
    },
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

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
     AUTO-RESIZE TEXTAREA
     ===================================================== */
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [input])

  /* =====================================================
     SEND MESSAGE
     ===================================================== */
  async function sendMessage(customText = '') {
    const question = (customText || input).trim()
    if (!question || loading) return

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: question,
      },
    ])

    setInput('')
    setLoading(true)

    try {
      const response = await fetch(
        'https://sm-cleantech-platform.onrender.com/api/chat',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail || 'Unable to get response from AI.'
        )
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content:
            data?.answer ||
            'Sorry, I could not generate an answer.',
          suggestions: [],
        },
      ])
    } catch (error) {
      console.error('SM CleanTech chatbot error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            '⚠️ Sorry, I am unable to connect to the AI service right now. Please make sure the SM CleanTech backend is running.',
          suggestions: [],
          isError: true,
        },
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
          'Chat cleared. How can I help you with SM CleanTech?',
        suggestions: INITIAL_SUGGESTIONS,
      },
    ])
    setInput('')
  }

  /* =====================================================
     ENTER KEY
     ===================================================== */
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  /* =====================================================
     RENDER
     ===================================================== */
  return (
    <div className="cb-page">
      {/* ================= HEADER ================= */}
      <header className="cb-header">
        <div className="cb-header__inner">
          <button
            type="button"
            className="cb-back"
            onClick={() => navigate(-1)}
            title="Back"
          >
            ←
          </button>

          <div className="cb-header__icon">🤖</div>

          <div className="cb-header__info">
            <h1>SM CleanTech Assistant</h1>
            <p>CleanTech Solutions · Platform Support</p>
          </div>

          <div className="cb-header__right">
            <span className="cb-status">
              <span className="cb-status__dot" />
              Online
            </span>

            <button
              type="button"
              className="cb-clear"
              onClick={clearChat}
              title="Clear chat"
            >
              🗑
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="cb-main">
        <div className="cb-messages">
          <div className="cb-messages__container">
            {messages.map((message) => {
              const isUser = message.role === 'user'
              const blocks =
                !isUser && !message.isError
                  ? formatAnswer(message.content)
                  : null

              return (
                <div
                  key={message.id}
                  className={`cb-row ${
                    isUser ? 'cb-row--user' : ''
                  }`}
                >
                  {!isUser && (
                    <div className="cb-avatar">🤖</div>
                  )}

                  <div className="cb-bubble-wrap">
                    <div className="cb-bubble-label">
                      {isUser ? 'You' : 'Assistant'}
                    </div>

                    <div
                      className={`cb-bubble ${
                        isUser
                          ? 'cb-bubble--user'
                          : message.isError
                          ? 'cb-bubble--error'
                          : 'cb-bubble--bot'
                      }`}
                    >
                      {isUser || message.isError ? (
                        <p className="ans__p">
                          {message.content}
                        </p>
                      ) : (
                        <AnswerBlock blocks={blocks} />
                      )}
                    </div>

                    {/* Suggestions */}
                    {!isUser &&
                      message.suggestions?.length > 0 && (
                        <div className="cb-suggestions">
                          {message.suggestions.map(
                            (s, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() =>
                                  sendMessage(s.text)
                                }
                              >
                                <span className="cb-suggestions__icon">
                                  {s.icon}
                                </span>
                                {s.text}
                              </button>
                            )
                          )}
                        </div>
                      )}
                  </div>
                </div>
              )
            })}

            {/* Loading */}
            {loading && (
              <div className="cb-row">
                <div className="cb-avatar">🤖</div>
                <div className="cb-bubble-wrap">
                  <div className="cb-bubble-label">
                    Assistant
                  </div>
                  <div className="cb-bubble cb-bubble--bot">
                    <div className="cb-typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ================= INPUT ================= */}
        <div className="cb-input-area">
          <div className="cb-input-box">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about CleanTech solutions, registration, matching…"
              rows={1}
            />

            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="cb-send"
              title="Send message"
            >
              ➤
            </button>
          </div>

          <div className="cb-input-hint">
            Press Enter to send · Shift + Enter for new line
          </div>
        </div>
      </main>

      {/* ================= STYLES ================= */}
      <style>{`
        /* -------------------------------------------------
           PAGE
        ------------------------------------------------- */
        .cb-page {
          width: 100%;
          height: 100vh;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #f6faf8;
          color: #17201c;
          font-family: Arial, Helvetica, sans-serif;
        }

        .cb-page * { box-sizing: border-box; }

        /* -------------------------------------------------
           HEADER
        ------------------------------------------------- */
        .cb-header {
          flex-shrink: 0;
          background: #087f45;
          color: #ffffff;
          box-shadow: 0 4px 16px rgba(20,70,45,0.12);
        }

        .cb-header__inner {
          width: min(1100px, 94%);
          min-height: 68px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cb-back {
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 9px;
          background: rgba(255,255,255,0.12);
          color: #ffffff;
          font-size: 19px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .cb-back:hover {
          background: rgba(255,255,255,0.22);
        }

        .cb-header__icon {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: rgba(255,255,255,0.15);
          font-size: 22px;
        }

        .cb-header__info {
          min-width: 0;
          flex: 1;
        }

        .cb-header__info h1 {
          margin: 0 0 2px;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.2;
        }

        .cb-header__info p {
          margin: 0;
          color: rgba(255,255,255,0.78);
          font-size: 10.5px;
        }

        .cb-header__right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cb-status {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 11px;
          background: rgba(255,255,255,0.14);
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
        }

        .cb-status__dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #7ef0a3;
          box-shadow: 0 0 0 3px rgba(126,240,163,0.25);
          animation: cbPulse 2s ease-in-out infinite;
        }

        @keyframes cbPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(126,240,163,0.25); }
          50%      { box-shadow: 0 0 0 6px rgba(126,240,163,0.08); }
        }

        .cb-clear {
          width: 36px;
          height: 36px;
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 9px;
          background: rgba(255,255,255,0.1);
          color: #ffffff;
          font-size: 15px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .cb-clear:hover {
          background: rgba(255,255,255,0.2);
        }

        /* -------------------------------------------------
           MAIN
        ------------------------------------------------- */
        .cb-main {
          width: min(1100px, 100%);
          flex: 1;
          min-height: 0;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* -------------------------------------------------
           MESSAGES
        ------------------------------------------------- */
        .cb-messages {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px 16px;
        }

        .cb-messages__container {
          width: min(840px, 100%);
          margin: 0 auto;
        }

        .cb-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 20px;
        }

        .cb-row--user {
          justify-content: flex-end;
        }

        .cb-avatar {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eaf7f0;
          border: 1px solid #d1e8db;
          border-radius: 10px;
          font-size: 16px;
        }

        .cb-bubble-wrap {
          max-width: 82%;
          min-width: 0;
        }

        .cb-bubble-label {
          margin-bottom: 4px;
          padding: 0 3px;
          color: #87948e;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        .cb-row--user .cb-bubble-label {
          text-align: right;
        }

        /* -------------------------------------------------
           BUBBLE
        ------------------------------------------------- */
        .cb-bubble {
          padding: 12px 15px;
          border-radius: 14px;
          font-size: 13px;
          line-height: 1.65;
          overflow-wrap: anywhere;
        }

        .cb-bubble--bot {
          background: #ffffff;
          border: 1px solid #dce7e1;
          border-bottom-left-radius: 4px;
          color: #26372f;
          box-shadow: 0 2px 10px rgba(20,70,45,0.04);
        }

        .cb-bubble--user {
          background: #087f45;
          color: #ffffff;
          border-bottom-right-radius: 4px;
        }

        .cb-bubble--error {
          background: #fdeaea;
          border: 1px solid #f5c2c2;
          color: #c0392b;
          border-bottom-left-radius: 4px;
        }

        /* -------------------------------------------------
           ANSWER FORMATTING
        ------------------------------------------------- */
        .ans__h3 {
          margin: 0 0 10px;
          color: #087f45;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.3;
        }

        .ans__h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 14px 0 8px;
          color: #126b40;
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: 0.2px;
        }

        .ans__h4:first-child { margin-top: 0; }

        .ans__h4-bar {
          display: inline-block;
          width: 3px;
          height: 14px;
          background: #087f45;
          border-radius: 2px;
        }

        .ans__p {
          margin: 0 0 8px;
          color: #2b3d33;
          font-size: 13px;
          line-height: 1.7;
        }

        .ans__p:last-child { margin-bottom: 0; }

        .ans__p strong {
          color: #087f45;
          font-weight: 800;
        }

        /* LIST */
        .ans__list {
          margin: 6px 0 10px;
          padding: 0;
          list-style: none;
        }

        .ans__list-item {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-bottom: 6px;
          color: #2b3d33;
          font-size: 12.5px;
          line-height: 1.6;
        }

        .ans__list-dot {
          flex-shrink: 0;
          width: 5px;
          height: 5px;
          margin-top: 7px;
          background: #087f45;
          border-radius: 50%;
        }

        /* TABLE */
        .ans__table-wrap {
          margin: 10px 0;
          overflow-x: auto;
          border-radius: 10px;
          border: 1px solid #dce7e1;
        }

        .ans__table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          background: #ffffff;
          min-width: 380px;
        }

        .ans__table thead {
          background: #eaf7f0;
        }

        .ans__table th {
          padding: 10px 12px;
          color: #087f45;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          text-align: left;
          border-bottom: 1px solid #dce7e1;
        }

        .ans__table td {
          padding: 10px 12px;
          color: #2b3d33;
          border-bottom: 1px solid #eff5f1;
          line-height: 1.55;
        }

        .ans__table tbody tr:nth-child(even) {
          background: #fafdfb;
        }

        .ans__table tbody tr:hover {
          background: #f0faf4;
        }

        .ans__table tbody tr:last-child td {
          border-bottom: none;
        }

        /* -------------------------------------------------
           SUGGESTIONS
        ------------------------------------------------- */
        .cb-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 9px;
        }

        .cb-suggestions button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          background: #ffffff;
          border: 1px solid #d7e5dd;
          border-radius: 999px;
          color: #315442;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cb-suggestions button:hover {
          background: #edf8f2;
          border-color: #a9d3ba;
          transform: translateY(-1px);
        }

        .cb-suggestions__icon {
          font-size: 13px;
        }

        /* -------------------------------------------------
           TYPING
        ------------------------------------------------- */
        .cb-typing {
          display: flex;
          align-items: center;
          gap: 5px;
          width: fit-content;
          padding: 4px 0;
        }

        .cb-typing span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #087f45;
          animation: cbTyping 1.2s infinite;
        }

        .cb-typing span:nth-child(2) { animation-delay: 0.15s; }
        .cb-typing span:nth-child(3) { animation-delay: 0.3s; }

        @keyframes cbTyping {
          0%, 60%, 100% {
            opacity: 0.25;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }

        /* -------------------------------------------------
           INPUT
        ------------------------------------------------- */
        .cb-input-area {
          flex-shrink: 0;
          padding: 12px 16px 14px;
          background: #ffffff;
          border-top: 1px solid #dce7e1;
        }

        .cb-input-box {
          width: min(840px, 100%);
          margin: 0 auto;
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 6px;
          background: #f7fbf9;
          border: 1px solid #cfded5;
          border-radius: 13px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .cb-input-box:focus-within {
          border-color: #087f45;
          box-shadow: 0 0 0 3px rgba(8,127,69,0.08);
        }

        .cb-input-box textarea {
          flex: 1;
          min-width: 0;
          min-height: 40px;
          max-height: 120px;
          padding: 10px 10px;
          border: none;
          outline: none;
          resize: none;
          background: transparent;
          color: #26372f;
          font-family: inherit;
          font-size: 13px;
          line-height: 1.5;
        }

        .cb-input-box textarea::placeholder {
          color: #89968f;
        }

        .cb-send {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          border: none;
          border-radius: 10px;
          background: #087f45;
          color: #ffffff;
          font-size: 17px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cb-send:hover:not(:disabled) {
          background: #056b3a;
          transform: scale(1.04);
        }

        .cb-send:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .cb-input-hint {
          width: min(840px, 100%);
          margin: 5px auto 0;
          color: #9aa59f;
          text-align: center;
          font-size: 9.5px;
        }

        /* -------------------------------------------------
           MOBILE
        ------------------------------------------------- */
        @media (max-width: 700px) {
          .cb-header__inner {
            width: 100%;
            min-height: 60px;
            padding: 8px 12px;
            gap: 8px;
          }

          .cb-back { width: 34px; height: 34px; font-size: 17px; }

          .cb-header__icon {
            width: 36px;
            height: 36px;
            border-radius: 9px;
            font-size: 18px;
          }

          .cb-header__info h1 { font-size: 13px; }
          .cb-header__info p { font-size: 9px; }

          .cb-status {
            padding: 5px 9px;
            font-size: 9px;
          }

          .cb-clear { width: 32px; height: 32px; }

          .cb-messages { padding: 16px 10px; }

          .cb-bubble-wrap { max-width: 88%; }

          .cb-bubble {
            padding: 11px 13px;
            font-size: 12.5px;
          }

          .cb-avatar {
            width: 30px;
            height: 30px;
            flex-basis: 30px;
            font-size: 14px;
          }

          .cb-suggestions button {
            font-size: 10.5px;
            padding: 6px 10px;
          }

          .cb-input-area { padding: 10px 10px 12px; }

          .cb-input-box textarea { font-size: 16px; }

          .cb-send {
            width: 40px;
            height: 40px;
            flex-basis: 40px;
          }

          .cb-input-hint { display: none; }

          .ans__table { font-size: 11.5px; }
          .ans__table th,
          .ans__table td { padding: 8px 10px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cb-typing span,
          .cb-status__dot {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
