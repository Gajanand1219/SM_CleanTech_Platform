import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import PanelLayout from '../components/PanelLayout'
import '../styles/BuyerCreate.css'

export default function BuyerCreate() {
  const [domains, setDomains] = useState([])
  const [problems, setProblems] = useState([])
  const [questions, setQuestions] = useState([])
  const [domainId, setDomainId] = useState('')
  const [problemId, setProblemId] = useState('')
  const [title, setTitle] = useState('')
  const [answers, setAnswers] = useState({})
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('info')
  const [loading, setLoading] = useState(false)
  const [loadingProblems, setLoadingProblems] = useState(false)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    API.get('/public/domains').then((r) => setDomains(r.data))
  }, [])

  useEffect(() => {
    if (domainId) {
      setLoadingProblems(true)
      API.get(`/public/domains/${domainId}/problems`)
        .then((r) => setProblems(r.data))
        .finally(() => setLoadingProblems(false))
    } else {
      setProblems([])
    }
    setProblemId('')
    setQuestions([])
    setAnswers({})
  }, [domainId])

  useEffect(() => {
    if (problemId) {
      setLoadingQuestions(true)
      API.get(`/public/problems/${problemId}/questions`)
        .then((r) => setQuestions(r.data))
        .finally(() => setLoadingQuestions(false))
    } else {
      setQuestions([])
    }
  }, [problemId])

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)

    try {
      const r = await API.post('/buyer/enquiries', {
        domain_id: Number(domainId),
        problem_id: Number(problemId),
        title,
        answers,
      })

      setMsg(
        '✓ Enquiry submitted successfully. It is now waiting for Admin approval. ' +
        'No vendor will receive it before approval.'
      )
      setMsgType('success')

      setTimeout(() => nav(`/buyer/enquiries/${r.data.enquiry_id}`), 1200)
    } catch (err) {
      setMsg(
        typeof err.response?.data?.detail === 'string'
          ? err.response.data.detail
          : 'Please complete all required questions.'
      )
      setMsgType('error')
    } finally {
      setLoading(false)
    }
  }

  const selectedDomain = domains.find((d) => String(d.id) === String(domainId))
  const selectedProblem = problems.find((p) => String(p.id) === String(problemId))
  const answeredCount = questions.filter(
    (q) => answers[q.field_key]?.trim()
  ).length
  const progress = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0

  // Step states
  const step1Done = !!domainId
  const step2Done = !!problemId
  const step3Done = questions.length > 0 && answeredCount === questions.length

  return (
    <PanelLayout role="buyer" title="Create Technical Enquiry">
      <div className="bc">

        {/* ============ STEP PROGRESS ============ */}
        <div className="bc-steps">
          <div className={`bc-step ${step1Done ? 'is-done' : 'is-active'}`}>
            <div className="bc-step__circle">
              {step1Done ? '✓' : '1'}
            </div>
            <div className="bc-step__text">
              <strong>Domain</strong>
              <span>{selectedDomain?.name || 'Select domain'}</span>
            </div>
          </div>

          <div className={`bc-step__line ${step1Done ? 'is-done' : ''}`} />

          <div
            className={`bc-step ${
              step2Done ? 'is-done' : step1Done ? 'is-active' : ''
            }`}
          >
            <div className="bc-step__circle">
              {step2Done ? '✓' : '2'}
            </div>
            <div className="bc-step__text">
              <strong>Problem</strong>
              <span>{selectedProblem?.name || 'Select problem'}</span>
            </div>
          </div>

          <div className={`bc-step__line ${step2Done ? 'is-done' : ''}`} />

          <div
            className={`bc-step ${
              step3Done ? 'is-done' : step2Done ? 'is-active' : ''
            }`}
          >
            <div className="bc-step__circle">
              {step3Done ? '✓' : '3'}
            </div>
            <div className="bc-step__text">
              <strong>Questionnaire</strong>
              <span>
                {questions.length
                  ? `${answeredCount}/${questions.length} answered`
                  : 'Awaiting problem'}
              </span>
            </div>
          </div>

          <div className={`bc-step__line ${step3Done ? 'is-done' : ''}`} />

          <div className={`bc-step ${step3Done ? 'is-active' : ''}`}>
            <div className="bc-step__circle">4</div>
            <div className="bc-step__text">
              <strong>Review</strong>
              <span>Admin approval</span>
            </div>
          </div>
        </div>

        {/* ============ PRIVACY BANNER ============ */}
        <div className="bc-privacy">
          <div className="bc-privacy__icon">🔒</div>
          <div>
            <strong>Privacy-first workflow</strong>
            <span>
              Your enquiry is first reviewed by the platform admin. Matching
              vendors are notified only after approval.
            </span>
          </div>
        </div>

        {/* ============ FORM ============ */}
        <form className="bc-form" onSubmit={submit}>

          {/* Section 1 — Basics */}
          <div className="bc-section">
            <div className="bc-section__head">
              <div className="bc-section__icon bc-section__icon--blue">📝</div>
              <div>
                <h3>Enquiry Details</h3>
                <p className="muted">Give your project a clear title and select the category</p>
              </div>
            </div>

            <div className="bc-section__body">
              <div className="bc-field">
                <label>
                  <span className="bc-field__icon">🏷️</span>
                  Enquiry title
                  <span className="bc-field__required">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. ETP capacity upgrade for pharma plant"
                  required
                />
              </div>

              <div className="bc-grid">
                <div className="bc-field">
                  <label>
                    <span className="bc-field__icon">🎯</span>
                    Domain
                    <span className="bc-field__required">*</span>
                  </label>
                  <select
                    value={domainId}
                    onChange={(e) => setDomainId(e.target.value)}
                    required
                  >
                    <option value="">Select domain</option>
                    {domains.map((d) => (
                      <option value={d.id} key={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bc-field">
                  <label>
                    <span className="bc-field__icon">⚙️</span>
                    Problem / sub-domain
                    <span className="bc-field__required">*</span>
                  </label>
                  <select
                    value={problemId}
                    onChange={(e) => setProblemId(e.target.value)}
                    disabled={!domainId || loadingProblems}
                    required
                  >
                    <option value="">
                      {loadingProblems ? 'Loading…' : 'Select problem'}
                    </option>
                    {problems.map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.sub_domain} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 — Questionnaire */}
          {(loadingQuestions || questions.length > 0) && (
            <div className="bc-section">
              <div className="bc-section__head">
                <div className="bc-section__icon bc-section__icon--purple">📋</div>
                <div style={{ flex: 1 }}>
                  <h3>
                    Technical Questionnaire
                    {questions.length > 0 && (
                      <span className="bc-count">{questions.length}</span>
                    )}
                  </h3>
                  <p className="muted">
                    Answer accurately to help us generate a precise technical dossier
                  </p>
                </div>

                {questions.length > 0 && (
                  <div className="bc-progress">
                    <div className="bc-progress__bar">
                      <div
                        className="bc-progress__fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="bc-progress__text">{progress}%</span>
                  </div>
                )}
              </div>

              <div className="bc-section__body">
                {loadingQuestions ? (
                  <div className="bc-q-skeletons">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bc-q-skeleton" />
                    ))}
                  </div>
                ) : (
                  <div className="bc-questions">
                    {questions.map((q, i) => {
                      const answered = answers[q.field_key]?.trim()
                      return (
                        <div
                          className={`bc-question ${answered ? 'is-answered' : ''}`}
                          key={q.id}
                          style={{ animationDelay: `${i * 0.05}s` }}
                        >
                          <div className="bc-question__head">
                            <div className="bc-question__num">
                              {answered ? '✓' : String(i + 1).padStart(2, '0')}
                            </div>
                            <div className="bc-question__text">
                              {q.question_text}
                              {q.required && (
                                <span className="bc-question__required">Required</span>
                              )}
                            </div>
                          </div>

                          <textarea
                            required={q.required}
                            value={answers[q.field_key] || ''}
                            onChange={(e) =>
                              setAnswers({
                                ...answers,
                                [q.field_key]: e.target.value,
                              })
                            }
                            placeholder="Type your answer…"
                            rows={3}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="bc-submit-wrap">
            <button
              type="submit"
              className="bc-submit"
              disabled={!questions.length || loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Submitting…
                </>
              ) : (
                <>
                  <span>📤</span>
                  Submit for Admin Approval
                  <span className="bc-submit__arrow">→</span>
                </>
              )}
            </button>

            {!questions.length && (
              <p className="bc-submit-hint">
                Select a domain & problem to load the questionnaire
              </p>
            )}
          </div>

          {/* Message */}
          {msg && (
            <div
              className={`message ${
                msgType === 'error' ? 'message--error' : 'message--success'
              }`}
            >
              <span className="message__icon">
                {msgType === 'error' ? '!' : '✓'}
              </span>
              <span>{msg}</span>
              <button
                type="button"
                onClick={() => setMsg('')}
                className="message__close"
              >
                ×
              </button>
            </div>
          )}
        </form>
      </div>
    </PanelLayout>
  )
}