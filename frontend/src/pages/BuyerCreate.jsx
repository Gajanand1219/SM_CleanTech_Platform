import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import API from '../services/api'
import '../styles/BuyerCreate.css'

const STEPS = [
  'Domain',
  'Category',
  'Sub-category',
  'Questionnaire',
  'Review',
  'Submit',
]

const DOMAIN_ICONS = {
  water: '💧',
  wastewater: '💧',
  waste: '🗑️',
  hazardous: '🗑️',
  solar: '☀️',
  renewable: '☀️',
  carbon: '🌿',
  esg: '🌿',
  spcb: '💨',
  pollution: '💨',
  air: '💨',
}

const getDomainIcon = (name = '') => {
  const key = Object.keys(DOMAIN_ICONS).find((word) =>
    name.toLowerCase().includes(word)
  )
  return key ? DOMAIN_ICONS[key] : '◇'
}

const initials = (name = '') => {
  const words = String(name).trim().split(/\s+/)
  return ((words[0] || '?').charAt(0) + (words[1] ? words[1].charAt(0) : '')).toUpperCase()
}

/* =========================================================
   SIDEBAR MENU (matches HTML prototype)
   ========================================================= */

const MENU = [
  { id: 'create', l: 'Create enquiry', i: '➕', to: '/buyer/enquiries/new' },
  { id: 'current', l: 'Current enquiry', i: '📋', to: '/buyer/enquiries?view=current', countKey: 'current' },
  { id: 'quote', l: 'View quote', i: '📄', to: '/buyer/enquiries?view=quotes', countKey: 'quotes' },
  { id: 'accepted', l: 'Accepted', i: '✅', to: '/buyer/enquiries?view=accepted', countKey: 'accepted' },
  { id: 'rejected', l: 'Rejected', i: '❌', to: '/buyer/enquiries?view=rejected', countKey: 'rejected' },
  { id: 'closed', l: 'Closed', i: '🔒', to: '/buyer/enquiries?view=closed', countKey: 'closed' },
  { id: 'history', l: 'History', i: '🕒', to: '/buyer/enquiries?view=history', countKey: 'history' },
]

export default function BuyerCreate() {
  const navigate = useNavigate()

  const [domains, setDomains] = useState([])
  const [problems, setProblems] = useState([])
  const [questions, setQuestions] = useState([])

  const [domainId, setDomainId] = useState('')
  const [category, setCategory] = useState('')
  const [problemId, setProblemId] = useState('')
  const [title, setTitle] = useState('')
  const [answers, setAnswers] = useState({})

  const [step, setStep] = useState(0)
  const [loadingDomains, setLoadingDomains] = useState(true)
  const [loadingProblems, setLoadingProblems] = useState(false)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')

  const [profile, setProfile] = useState(null)
  const [counts, setCounts] = useState({
    current: 0, quotes: 0, accepted: 0,
    rejected: 0, closed: 0, history: 0,
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  const notify = (text, type = 'error') => {
    setMessage(text)
    setMessageType(type)
  }

  /* ---------- Load profile + counts for sidebar ---------- */

  useEffect(() => {
    let alive = true

    API.get('/auth/me')
      .then(({ data }) => { if (alive) setProfile(data) })
      .catch(() => {})

    API.get('/buyer/dashboard')
      .then(({ data }) => {
        if (!alive) return
        const stats = data?.stats || {}
        const enquiries = Array.isArray(data?.enquiries) ? data.enquiries : []
        const get = (...keys) => {
          const k = Object.keys(stats).find((x) => keys.includes(x.toLowerCase()))
          return k !== undefined ? Number(stats[k]) || 0 : null
        }
        const byStatus = (...st) => enquiries.filter((e) =>
          st.includes(String(e.status || '').toUpperCase().split('.').pop())
        ).length

        setCounts({
          current: get('open_enquiries', 'current_enquiries', 'current', 'open') ??
            byStatus('APPROVED', 'MATCHED', 'QUOTATION', 'SUBMITTED'),
          quotes: get('quotations', 'quotes', 'total_quotations') ?? 0,
          accepted: get('accepted', 'accepted_quotes', 'accepted_quotations') ?? 0,
          rejected: get('rejected', 'rejected_quotes', 'rejected_quotations') ?? 0,
          closed: get('closed', 'closed_enquiries') ?? byStatus('CLOSED'),
          history: get('history', 'history_enquiries') ?? 0,
        })
      })
      .catch(() => {})

    return () => { alive = false }
  }, [])

  /* ---------- Load domains ---------- */

  useEffect(() => {
    let active = true
    API.get('/public/domains')
      .then(({ data }) => { if (active) setDomains(Array.isArray(data) ? data : []) })
      .catch(() => { if (active) notify('Unable to load domains. Please refresh the page.') })
      .finally(() => { if (active) setLoadingDomains(false) })
    return () => { active = false }
  }, [])

  /* ---------- Load problems for domain ---------- */

  useEffect(() => {
    let active = true
    setProblems([]); setCategory(''); setProblemId(''); setQuestions([]); setAnswers({})

    if (!domainId) { setLoadingProblems(false); return }

    setLoadingProblems(true)

    API.get(`/public/domains/${domainId}/problems`)
      .then(({ data }) => { if (active) setProblems(Array.isArray(data) ? data : []) })
      .catch(() => { if (active) notify('Unable to load categories for this domain.') })
      .finally(() => { if (active) setLoadingProblems(false) })

    return () => { active = false }
  }, [domainId])

  /* ---------- Load questions for problem ---------- */

  useEffect(() => {
    let active = true
    setQuestions([]); setAnswers({})

    if (!problemId) { setLoadingQuestions(false); return }

    setLoadingQuestions(true)

    API.get(`/public/problems/${problemId}/questions`)
      .then(({ data }) => { if (active) setQuestions(Array.isArray(data) ? data : []) })
      .catch(() => { if (active) notify('Unable to load the questionnaire.') })
      .finally(() => { if (active) setLoadingQuestions(false) })

    return () => { active = false }
  }, [problemId])

  const selectedDomain = useMemo(
    () => domains.find((item) => String(item.id) === String(domainId)),
    [domains, domainId]
  )

  const categories = useMemo(() => {
    const unique = new Map()
    problems.forEach((problem) => {
      const name = (problem.sub_domain || '').trim()
      if (name && !unique.has(name)) unique.set(name, name)
    })
    return Array.from(unique.values()).sort((a, b) => a.localeCompare(b))
  }, [problems])

  const subCategories = useMemo(
    () => problems.filter((problem) => (problem.sub_domain || '').trim() === category),
    [problems, category]
  )

  const selectedProblem = useMemo(
    () => problems.find((problem) => String(problem.id) === String(problemId)),
    [problems, problemId]
  )

  const answeredCount = questions.filter(
    (q) => String(answers[q.field_key] || '').trim()
  ).length

  const requiredQuestionsComplete = questions.every(
    (q) => !q.required || String(answers[q.field_key] || '').trim().length > 0
  )

  const progress = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0

  const companyName = profile?.company_name || profile?.company || profile?.name || 'Your Company'
  const userEmail = profile?.email || ''
  const userInitials = initials(companyName)

  function selectDomain(id) {
    setDomainId(String(id)); setCategory(''); setProblemId('')
    setQuestions([]); setAnswers({}); setMessage('')
  }
  function selectCategory(name) {
    setCategory(name); setProblemId(''); setQuestions([]); setAnswers({}); setMessage('')
  }
  function selectProblem(id) {
    setProblemId(String(id)); setQuestions([]); setAnswers({}); setMessage('')
  }

  function validateStep() {
    if (step === 0 && !domainId) { notify('Please select a domain.'); return false }
    if (step === 1 && !category) { notify('Please select a category.'); return false }
    if (step === 2 && !problemId) { notify('Please select a sub-category.'); return false }
    if (step === 3) {
      if (!title.trim()) { notify('Please enter an enquiry title.'); return false }
      if (loadingQuestions) { notify('Please wait for the questionnaire to load.'); return false }
      if (!requiredQuestionsComplete) { notify('Please answer all required questions.'); return false }
    }
    return true
  }

  function nextStep() {
    setMessage('')
    if (!validateStep()) return
    setStep((c) => Math.min(c + 1, STEPS.length - 1))
  }

  function previousStep() {
    setMessage('')
    setStep((c) => Math.max(c - 1, 0))
  }

  function downloadReview() {
    const lines = [
      'SM TECHSPHERE Engineering Pvt Ltd',
      'ENQUIRY REVIEW',
      '',
      `Domain: ${selectedDomain?.name || ''}`,
      `Category: ${category}`,
      `Sub-category: ${selectedProblem?.name || ''}`,
      `Enquiry title: ${title}`,
      '',
      'QUESTIONNAIRE',
      ...questions.map((q) => `${q.question_text}\n${answers[q.field_key] || 'Not answered'}\n`),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'SM-TECHSPHERE-Enquiry-Review.txt'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function submitEnquiry(event) {
    event.preventDefault()
    setMessage('')

    if (!domainId || !category || !problemId || !title.trim()) {
      notify('Please complete the domain, category, sub-category and title.')
      return
    }
    if (!requiredQuestionsComplete) {
      notify('Please answer all required questions.')
      setStep(3)
      return
    }

    setSubmitting(true)

    try {
      const response = await API.post('/buyer/enquiries', {
        domain_id: Number(domainId),
        problem_id: Number(problemId),
        title: title.trim(),
        answers,
      })

      notify('Enquiry submitted successfully.', 'success')

      const enquiryId = response.data?.enquiry_id
      window.setTimeout(() => {
        if (enquiryId) navigate(`/buyer/enquiries/${enquiryId}`)
        else navigate('/buyer')
      }, 700)
    } catch (error) {
      const detail = error.response?.data?.detail
      notify(
        typeof detail === 'string'
          ? detail
          : 'Unable to submit the enquiry. Please check the required fields and try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  /* ======================================================
     RENDER
     ====================================================== */

  return (
    <div className="enviquo-dash">
      {/* ============ SIDEBAR ============ */}

      <aside className={`ev-side ${mobileOpen ? 'open' : ''}`}>
        <div className="ev-brand">
          <div className="ev-logo">
            <svg width="42" height="42" viewBox="20 10 390 390" aria-hidden="true">
              <circle cx="180" cy="168" r="126.5" fill="none" stroke="#1e9bc9" strokeWidth="45" />
              <path d="M263 251C298 258 338 266 362 284C390 305 392 345 365 366C338 386 305 380 288 350C272 322 266 285 263 251Z" fill="#1fa971" />
              <path d="M180 135L204 168L180 201L156 168Z" fill="#62d6a8" />
            </svg>
          </div>
          <div>
            <b>ENVIQUO</b>
            <small>by SM Techsphere Pvt Ltd</small>
          </div>
        </div>

        <nav className="ev-nav">
          <Link to="/buyer" className="ev-nav-item">
            <span>🏠</span> Dashboard
          </Link>
          <div className="ev-nav-sep" />
          {MENU.map((m) => (
            <Link
              key={m.id}
              to={m.to}
              className={`ev-nav-item ${m.id === 'create' ? 'on' : ''}`}
            >
              <span>{m.i}</span>
              {m.l}
              {m.countKey != null && (
                <span className="ev-nav-count">{counts[m.countKey] ?? 0}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="ev-side-foot">
          <b>Diagnose. Match. Solution.</b>
          Buyer workspace
        </div>
      </aside>

      {mobileOpen && (
        <div className="ev-scrim" onClick={() => setMobileOpen(false)} />
      )}

      {/* ============ MAIN ============ */}

      <div className="ev-main">
        <header className="ev-top">
          <button
            type="button"
            className="ev-ham"
            aria-label="Open menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            ☰
          </button>
          <span className="ev-top-title">Create Enquiry</span>
          <span className="ev-sp" />
          <button
            type="button"
            className="ev-chip"
            onClick={() => navigate('/profile')}
          >
            <span className="ev-av">{userInitials}</span>
            <span className="ev-chip-name">{companyName}</span>
          </button>
        </header>

        <main className="ev-content">
          <button
            type="button"
            className="ev-back"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <div className="ev-page-head">
            <span className="ev-eyebrow">BUYER WORKSPACE</span>
            <h1>Create Enquiry</h1>
            <p>
              Select your service requirement and share the technical details
              with matched vendors.
            </p>
          </div>

          {/* ============ STEPPER ============ */}

          <nav className="ev-steps" aria-label="Enquiry creation steps">
            {STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                className={`ev-step ${
                  index === step ? 'on' : ''
                } ${index < step ? 'done' : ''}`}
                disabled={index > step || submitting}
                onClick={() => {
                  if (index < step) { setMessage(''); setStep(index) }
                }}
              >
                <i>{index < step ? '✓' : index + 1}</i>
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {message && (
            <div
              className={`ev-msg ev-msg--${messageType}`}
              role="status"
            >
              {message}
            </div>
          )}

          <form className="ev-form" onSubmit={submitEnquiry}>
            {/* ============ STEP 1: DOMAIN ============ */}

            {step === 0 && (
              <section className="ev-panel">
                <div className="ev-panel-head">
                  <h2>Select Domain</h2>
                  <p>Select one of the domains configured in your database.</p>
                </div>

                {loadingDomains ? (
                  <div className="ev-loading">Loading domains...</div>
                ) : domains.length === 0 ? (
                  <div className="ev-empty-sm">No domains found in the database.</div>
                ) : (
                  <div className="ev-dgrid">
                    {domains.map((domain) => {
                      const selected = String(domain.id) === String(domainId)
                      return (
                        <button
                          key={domain.id}
                          type="button"
                          className={`ev-dc ${selected ? 'on' : ''}`}
                          onClick={() => selectDomain(domain.id)}
                        >
                          <span className="ev-dc-ico">
                            {getDomainIcon(domain.name)}
                          </span>
                          <strong>{domain.name}</strong>
                          {domain.description && (
                            <span className="ev-dc-hint">{domain.description}</span>
                          )}
                          {selected && (
                            <span className="ev-dc-check">✓</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ============ STEP 2: CATEGORY ============ */}

            {step === 1 && (
              <section className="ev-panel">
                <div className="ev-panel-head">
                  <h2>Select Category</h2>
                  <p>Categories are grouped from the selected domain's records.</p>
                </div>

                <div className="ev-sum">
                  <span>Selected domain</span>
                  <strong>{selectedDomain?.name}</strong>
                  <button type="button" onClick={() => setStep(0)}>Change</button>
                </div>

                {loadingProblems ? (
                  <div className="ev-loading">Loading categories...</div>
                ) : categories.length === 0 ? (
                  <div className="ev-empty-sm">No categories configured for this domain.</div>
                ) : (
                  <div className="ev-lst">
                    {categories.map((name) => {
                      const selected = category === name
                      const count = problems.filter(
                        (p) => (p.sub_domain || '').trim() === name
                      ).length
                      return (
                        <button
                          key={name}
                          type="button"
                          className={`ev-opt ${selected ? 'on' : ''}`}
                          onClick={() => selectCategory(name)}
                        >
                          <span>
                            {name}
                            <small>
                              {count} {count === 1 ? 'sub-category' : 'sub-categories'}
                            </small>
                          </span>
                          <span className="ev-opt-check">
                            {selected ? '✓' : ''}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ============ STEP 3: SUB-CATEGORY ============ */}

            {step === 2 && (
              <section className="ev-panel">
                <div className="ev-panel-head">
                  <h2>Select Sub-category</h2>
                  <p>Select the problem that best describes your requirement.</p>
                </div>

                <div className="ev-sum">
                  <span>Domain</span>
                  <strong>{selectedDomain?.name}</strong>
                  <button type="button" onClick={() => setStep(0)}>Change</button>
                </div>
                <div className="ev-sum">
                  <span>Category</span>
                  <strong>{category}</strong>
                  <button type="button" onClick={() => setStep(1)}>Change</button>
                </div>

                {subCategories.length === 0 ? (
                  <div className="ev-empty-sm">
                    No sub-categories available for this category.
                  </div>
                ) : (
                  <div className="ev-lst">
                    {subCategories.map((problem) => {
                      const selected = String(problem.id) === String(problemId)
                      return (
                        <button
                          key={problem.id}
                          type="button"
                          className={`ev-opt ${selected ? 'on' : ''}`}
                          onClick={() => selectProblem(problem.id)}
                        >
                          <span>
                            {problem.name}
                            {problem.description && (
                              <small>{problem.description}</small>
                            )}
                          </span>
                          <span className="ev-opt-check">
                            {selected ? '✓' : ''}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ============ STEP 4: QUESTIONNAIRE ============ */}

            {step === 3 && (
              <section className="ev-panel">
                <div className="ev-panel-head">
                  <h2>Technical Questionnaire</h2>
                  <p>Questions loaded from the database for your selection.</p>
                </div>

                <div className="ev-context">
                  <span>{selectedDomain?.name}</span>
                  <span>{category}</span>
                  <span>{selectedProblem?.name}</span>
                </div>

                <div className="ev-field">
                  <label htmlFor="ev-title">
                    Enquiry Title <em>*</em>
                  </label>
                  <input
                    id="ev-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter A Clear Title For Your Requirement"
                    maxLength={255}
                    required
                  />
                </div>

                <div className="ev-q-head">
                  <div>
                    <h3>Project Questions</h3>
                    <p>Fields marked * are required.</p>
                  </div>
                  <strong>{progress}%</strong>
                </div>

                <div className="ev-prog">
                  <span style={{ width: `${progress}%` }} />
                </div>

                {loadingQuestions ? (
                  <div className="ev-loading">Loading questionnaire...</div>
                ) : questions.length === 0 ? (
                  <div className="ev-empty-sm">
                    No questions configured for this sub-category. You can still
                    enter the title and continue.
                  </div>
                ) : (
                  <div className="ev-questions">
                    {questions.map((question, index) => (
                      <div className="ev-question" key={question.id}>
                        <label htmlFor={`ev-q-${question.id}`}>
                          <span className="ev-q-num">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span>
                            {question.question_text}
                            {question.required && <em> *</em>}
                          </span>
                        </label>
                        <textarea
                          id={`ev-q-${question.id}`}
                          rows={3}
                          required={Boolean(question.required)}
                          value={answers[question.field_key] || ''}
                          onChange={(e) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [question.field_key]: e.target.value,
                            }))
                          }
                          placeholder="Enter Your Answer"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ============ STEP 5: REVIEW ============ */}

            {step === 4 && (
              <section className="ev-panel">
                <div className="ev-panel-head">
                  <h2>Review Your Enquiry</h2>
                  <p>Verify your selections and answers before submitting.</p>
                </div>

                <div className="ev-review">
                  <div>
                    <span>Domain</span>
                    <strong>{selectedDomain?.name || '—'}</strong>
                    <button type="button" onClick={() => setStep(0)}>Edit</button>
                  </div>
                  <div>
                    <span>Category</span>
                    <strong>{category || '—'}</strong>
                    <button type="button" onClick={() => setStep(1)}>Edit</button>
                  </div>
                  <div>
                    <span>Sub-category</span>
                    <strong>{selectedProblem?.name || '—'}</strong>
                    <button type="button" onClick={() => setStep(2)}>Edit</button>
                  </div>
                  <div>
                    <span>Enquiry Title</span>
                    <strong>{title || '—'}</strong>
                    <button type="button" onClick={() => setStep(3)}>Edit</button>
                  </div>
                  {questions.map((question) => (
                    <div key={question.id}>
                      <span>{question.question_text}</span>
                      <strong>{answers[question.field_key] || 'Not answered'}</strong>
                      <button type="button" onClick={() => setStep(3)}>Edit</button>
                    </div>
                  ))}
                </div>

                <button
                  className="ev-btn"
                  type="button"
                  onClick={downloadReview}
                  style={{ marginTop: 16 }}
                >
                  ↓ Download Review Copy
                </button>
              </section>
            )}

            {/* ============ STEP 6: SUBMIT ============ */}

            {step === 5 && (
              <section className="ev-panel ev-submit-panel">
                <span className="ev-submit-icon">✓</span>
                <h2>Ready To Submit?</h2>
                <p>
                  Your enquiry will be created using the existing SM TECHSPHERE
                  backend workflow.
                </p>

                <div className="ev-submit-summary">
                  <span>{selectedDomain?.name}</span>
                  <strong>{title}</strong>
                  <small>{category} / {selectedProblem?.name}</small>
                </div>

                <button
                  className="ev-btn ev-btn-pri"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Enquiry →'}
                </button>
              </section>
            )}

            {/* ============ FOOTER ACTIONS ============ */}

            <footer className="ev-actions">
              <button
                type="button"
                className="ev-btn"
                onClick={previousStep}
                disabled={step === 0 || submitting}
              >
                ← Back
              </button>

              {step < STEPS.length - 1 && (
                <button
                  type="button"
                  className="ev-btn ev-btn-pri"
                  onClick={nextStep}
                  disabled={
                    submitting ||
                    (step === 0 && loadingDomains) ||
                    (step === 1 && loadingProblems) ||
                    (step === 3 && loadingQuestions)
                  }
                >
                  {step === 4 ? 'Continue To Submit →' : 'Continue →'}
                </button>
              )}
            </footer>
          </form>
        </main>
      </div>
    </div>
  )
}