import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import PanelLayout from '../components/PanelLayout'
import '../styles/BuyerCreate.css'

const STEPS = [
  'Domain',
  'Category',
  'Sub-category',
  'Questionnaire',
  // 'Lab report',
  'Review',
  'Submit',
]

const DOMAIN_ICONS = {
  water: '♢',
  wastewater: '♢',
  waste: '♜',
  hazardous: '♜',
  solar: '☼',
  renewable: '☼',
  carbon: '♧',
  esg: '♧',
  spcb: '≋',
  pollution: '≋',
  air: '≋',
}

const getDomainIcon = (name = '') => {
  const key = Object.keys(DOMAIN_ICONS).find((word) =>
    name.toLowerCase().includes(word),
  )
  return key ? DOMAIN_ICONS[key] : '◇'
}

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
  const [labFile, setLabFile] = useState(null)

  const [step, setStep] = useState(0)
  const [loadingDomains, setLoadingDomains] = useState(true)
  const [loadingProblems, setLoadingProblems] = useState(false)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')

  const notify = (text, type = 'error') => {
    setMessage(text)
    setMessageType(type)
  }

  // STEP 1: Load actual database domains
  useEffect(() => {
    let active = true

    API.get('/public/domains')
      .then(({ data }) => {
        if (active) setDomains(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (active) notify('Unable to load domains. Please refresh the page.')
      })
      .finally(() => {
        if (active) setLoadingDomains(false)
      })

    return () => {
      active = false
    }
  }, [])

  // STEP 2: Load actual Problem records for selected domain.
  // Category = unique Problem.sub_domain values.
  useEffect(() => {
    let active = true

    setProblems([])
    setCategory('')
    setProblemId('')
    setQuestions([])
    setAnswers({})

    if (!domainId) {
      setLoadingProblems(false)
      return
    }

    setLoadingProblems(true)

    API.get(`/public/domains/${domainId}/problems`)
      .then(({ data }) => {
        if (active) setProblems(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (active) notify('Unable to load categories for this domain.')
      })
      .finally(() => {
        if (active) setLoadingProblems(false)
      })

    return () => {
      active = false
    }
  }, [domainId])

  // STEP 3: Load the selected problem's actual questionnaire
  useEffect(() => {
    let active = true

    setQuestions([])
    setAnswers({})

    if (!problemId) {
      setLoadingQuestions(false)
      return
    }

    setLoadingQuestions(true)

    API.get(`/public/problems/${problemId}/questions`)
      .then(({ data }) => {
        if (active) setQuestions(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (active) notify('Unable to load the questionnaire.')
      })
      .finally(() => {
        if (active) setLoadingQuestions(false)
      })

    return () => {
      active = false
    }
  }, [problemId])

  const selectedDomain = useMemo(
    () => domains.find((item) => String(item.id) === String(domainId)),
    [domains, domainId],
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
    () =>
      problems.filter(
        (problem) =>
          (problem.sub_domain || '').trim() === category,
      ),
    [problems, category],
  )

  const selectedProblem = useMemo(
    () => problems.find((problem) => String(problem.id) === String(problemId)),
    [problems, problemId],
  )

  const answeredCount = questions.filter(
    (question) => String(answers[question.field_key] || '').trim(),
  ).length

  const requiredQuestionsComplete = questions.every(
    (question) =>
      !question.required ||
      String(answers[question.field_key] || '').trim().length > 0,
  )

  const progress = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0

  function selectDomain(id) {
    setDomainId(String(id))
    setCategory('')
    setProblemId('')
    setQuestions([])
    setAnswers({})
    setMessage('')
  }

  function selectCategory(name) {
    setCategory(name)
    setProblemId('')
    setQuestions([])
    setAnswers({})
    setMessage('')
  }

  function selectProblem(id) {
    setProblemId(String(id))
    setQuestions([])
    setAnswers({})
    setMessage('')
  }

  function validateStep() {
    if (step === 0 && !domainId) {
      notify('Please select a domain.')
      return false
    }

    if (step === 1 && !category) {
      notify('Please select a category.')
      return false
    }

    if (step === 2 && !problemId) {
      notify('Please select a sub-category.')
      return false
    }

    if (step === 3) {
      if (!title.trim()) {
        notify('Please enter an enquiry title.')
        return false
      }

      if (loadingQuestions) {
        notify('Please wait for the questionnaire to load.')
        return false
      }

      if (!requiredQuestionsComplete) {
        notify('Please answer all required questions.')
        return false
      }
    }

    return true
  }

  function nextStep() {
    setMessage('')
    if (!validateStep()) return
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  function previousStep() {
    setMessage('')
    setStep((current) => Math.max(current - 1, 0))
  }

  // function handleLabFile(event) {
  //   const file = event.target.files?.[0]
  //   if (!file) return

  //   const allowedTypes = [
  //     'application/pdf',
  //     'image/jpeg',
  //     'image/png',
  //     'image/webp',
  //   ]

  //   if (!allowedTypes.includes(file.type)) {
  //     notify('Choose a PDF, JPG, PNG or WEBP file.')
  //     event.target.value = ''
  //     return
  //   }

  //   // if (file.size > 3 * 1024 * 1024) {
  //   //   notify('Lab report must be 3 MB or smaller.')
  //   //   event.target.value = ''
  //   //   return
  //   // }

  //   setLabFile(file)
  //   setMessage('')
  // }

  function downloadReview() {
    const lines = [
      'SM CleanTech Engineering Solutions',
      'ENQUIRY REVIEW',
      '',
      `Domain: ${selectedDomain?.name || ''}`,
      `Category: ${category}`,
      `Sub-category: ${selectedProblem?.name || ''}`,
      `Enquiry title: ${title}`,
      '',
      'QUESTIONNAIRE',
      ...questions.map(
        (question) =>
          `${question.question_text}\n${answers[question.field_key] || 'Not answered'}\n`,
      ),
      '',
      // `Lab report selected: ${labFile?.name || 'No file selected'}`,
    ]

    const blob = new Blob([lines.join('\n')], {
      type: 'text/plain;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'SM-CleanTech-Enquiry-Review.txt'
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
      // Keep the existing backend payload unchanged.
      const response = await API.post('/buyer/enquiries', {
        domain_id: Number(domainId),
        problem_id: Number(problemId),
        title: title.trim(),
        answers,
      })

      notify('Enquiry submitted successfully.', 'success')

      const enquiryId = response.data?.enquiry_id
      window.setTimeout(() => {
        if (enquiryId) {
          navigate(`/buyer/enquiries/${enquiryId}`)
        } else {
          navigate('/buyer')
        }
      }, 700)
    } catch (error) {
      const detail = error.response?.data?.detail
      notify(
        typeof detail === 'string'
          ? detail
          : 'Unable to submit the enquiry. Please check the required fields and try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PanelLayout role="buyer" title="Create Enquiry">
      <main className="bc">
        <button
          type="button"
          className="bc-back"
          onClick={() => navigate(-1)}
        >
          <span aria-hidden="true">←</span> Back
        </button>

        <header className="bc-page-heading">
          <h1>Create enquiry</h1>
          <p>
            Select your service requirement and share the technical details
            with matched vendors.
          </p>
        </header>

        <nav className="bc-wizard" aria-label="Enquiry creation steps">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              className={[
                'bc-wizard-step',
                index === step ? 'is-active' : '',
                index < step ? 'is-complete' : '',
              ].filter(Boolean).join(' ')}
              disabled={index > step || submitting}
              onClick={() => {
                if (index < step) {
                  setMessage('')
                  setStep(index)
                }
              }}
            >
              <span className="bc-wizard-number">
                {index < step ? '✓' : index + 1}
              </span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {message && (
          <div
            className={`bc-message bc-message--${messageType}`}
            role="status"
          >
            {message}
          </div>
        )}

        <form className="bc-form" onSubmit={submitEnquiry}>
          {/* STEP 1: DOMAIN */}
          {step === 0 && (
            <section className="bc-panel">
              <div className="bc-panel-heading">
                <h2>Select domain</h2>
                <p>Select one of the domains configured in your database.</p>
              </div>

              {loadingDomains ? (
                <div className="bc-loading">Loading domains...</div>
              ) : domains.length === 0 ? (
                <div className="bc-empty">No domains found in the database.</div>
              ) : (
                <div className="bc-domain-grid">
                  {domains.map((domain) => {
                    const selected = String(domain.id) === String(domainId)

                    return (
                      <button
                        key={domain.id}
                        type="button"
                        className={`bc-domain-card ${selected ? 'is-selected' : ''}`}
                        onClick={() => selectDomain(domain.id)}
                      >
                        <span className="bc-domain-icon">
                          {getDomainIcon(domain.name)}
                        </span>
                        <span className="bc-domain-name">{domain.name}</span>
                        {domain.description && (
                          <span className="bc-domain-description">
                            {domain.description}
                          </span>
                        )}
                        {selected && <span className="bc-selected-check">✓</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* STEP 2: CATEGORY - derived from actual sub_domain values */}
          {step === 1 && (
            <section className="bc-panel">
              <div className="bc-panel-heading">
                <h2>Select category</h2>
                <p>Categories are grouped from the selected domain’s database records.</p>
              </div>

              <div className="bc-selection-summary">
                <span>Selected domain</span>
                <strong>{selectedDomain?.name}</strong>
                <button type="button" onClick={() => setStep(0)}>Change</button>
              </div>

              {loadingProblems ? (
                <div className="bc-loading">Loading categories...</div>
              ) : categories.length === 0 ? (
                <div className="bc-empty">No categories are configured for this domain.</div>
              ) : (
                <div className="bc-option-grid">
                  {categories.map((name) => {
                    const selected = category === name
                    const count = problems.filter(
                      (problem) => (problem.sub_domain || '').trim() === name,
                    ).length

                    return (
                      <button
                        key={name}
                        type="button"
                        className={`bc-option-card ${selected ? 'is-selected' : ''}`}
                        onClick={() => selectCategory(name)}
                      >
                        <span className="bc-option-title">{name}</span>
                        <span className="bc-option-subtitle">
                          {count} {count === 1 ? 'sub-category' : 'sub-categories'}
                        </span>
                        <span className="bc-option-radio">{selected ? '✓' : ''}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* STEP 3: SUB-CATEGORY - actual Problem.name */}
          {step === 2 && (
            <section className="bc-panel">
              <div className="bc-panel-heading">
                <h2>Select sub-category</h2>
                <p>Select the actual problem that best describes your requirement.</p>
              </div>

              <div className="bc-selection-summary">
                <span>Domain</span>
                <strong>{selectedDomain?.name}</strong>
                <button type="button" onClick={() => setStep(0)}>Change</button>
              </div>

              <div className="bc-selection-summary">
                <span>Category</span>
                <strong>{category}</strong>
                <button type="button" onClick={() => setStep(1)}>Change</button>
              </div>

              {subCategories.length === 0 ? (
                <div className="bc-empty">No sub-categories are available for this category.</div>
              ) : (
                <div className="bc-option-grid">
                  {subCategories.map((problem) => {
                    const selected = String(problem.id) === String(problemId)

                    return (
                      <button
                        key={problem.id}
                        type="button"
                        className={`bc-option-card ${selected ? 'is-selected' : ''}`}
                        onClick={() => selectProblem(problem.id)}
                      >
                        <span className="bc-option-title">{problem.name}</span>
                        {problem.description && (
                          <span className="bc-option-subtitle">
                            {problem.description}
                          </span>
                        )}
                        <span className="bc-option-radio">{selected ? '✓' : ''}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* STEP 4: QUESTIONNAIRE */}
          {step === 3 && (
            <section className="bc-panel">
              <div className="bc-panel-heading">
                <h2>Technical questionnaire</h2>
                <p>Questions are loaded from the database for your selected sub-category.</p>
              </div>

              <div className="bc-context">
                <span>{selectedDomain?.name}</span>
                <span>{category}</span>
                <span>{selectedProblem?.name}</span>
              </div>

              <div className="bc-field">
                <label htmlFor="bc-title">
                  Enquiry title <span>*</span>
                </label>
                <input
                  id="bc-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Enter a clear title for your requirement"
                  maxLength={255}
                  required
                />
              </div>

              <div className="bc-questionnaire-head">
                <div>
                  <h3>Project questions</h3>
                  <p>Fields marked * are required.</p>
                </div>
                <strong>{progress}%</strong>
              </div>

              <div className="bc-progress">
                <span style={{ width: `${progress}%` }} />
              </div>

              {loadingQuestions ? (
                <div className="bc-loading">Loading questionnaire...</div>
              ) : questions.length === 0 ? (
                <div className="bc-empty">
                  No questions are configured for this sub-category. You can still
                  enter the enquiry title and continue.
                </div>
              ) : (
                <div className="bc-questions">
                  {questions.map((question, index) => (
                    <div className="bc-question" key={question.id}>
                      <label htmlFor={`bc-question-${question.id}`}>
                        <span className="bc-question-number">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span>
                          {question.question_text}
                          {question.required && <span className="bc-required"> *</span>}
                        </span>
                      </label>
                      <textarea
                        id={`bc-question-${question.id}`}
                        rows={3}
                        required={Boolean(question.required)}
                        value={answers[question.field_key] || ''}
                        onChange={(event) =>
                          setAnswers((previous) => ({
                            ...previous,
                            [question.field_key]: event.target.value,
                          }))
                        }
                        placeholder="Enter your answer"
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* STEP 5: OPTIONAL LAB REPORT
          {step === 4 && (
            <section className="bc-panel">
              <div className="bc-panel-heading">
                <h2>Lab report</h2>
                <p>Optional. You can continue without selecting a file.</p>
              </div>

              <div className="bc-upload-placeholder">
                <span className="bc-upload-symbol">↑</span>
                <strong>Choose a lab report</strong>
                <p>PDF, JPG, PNG or WEBP · Maximum 3 MB</p>
                <label className="bc-file-button" htmlFor="bc-lab-file">
                  Choose file
                </label>
                <input
                  id="bc-lab-file"
                  className="bc-file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                  onChange={handleLabFile}
                />
                {labFile && (
                  <div className="bc-file-selected">
                    <strong>{labFile.name}</strong>
                    <button type="button" onClick={() => setLabFile(null)}>
                      Remove
                    </button>
                  </div>
                )}
                <small>
                  Note: the current enquiry API does not accept file uploads. The
                  selected file remains in this form only and is not sent to the
                  backend.
                </small>
              </div>
            </section>
          )} */}

          {/* STEP 6: REVIEW */}
          {step === 4 && (
            <section className="bc-panel">
              <div className="bc-panel-heading">
                <h2>Review your enquiry</h2>
                <p>Verify your selections and answers before submitting.</p>
              </div>

              <div className="bc-review">
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
                  <span>Enquiry title</span>
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

                {/* <div>
                  <span>Lab report</span>
                  <strong>{labFile?.name || 'Not selected'}</strong>
                  <button type="button" onClick={() => setStep(4)}>Edit</button>
                </div> */}
              </div>

              <button
                className="bc-secondary bc-download-review"
                type="button"
                onClick={downloadReview}
              >
                ↓ Download review copy
              </button>
            </section>
          )}

          {/* STEP 7: SUBMIT */}
          {step === 5 && (
            <section className="bc-panel bc-submit-panel">
              <span className="bc-submit-icon">✓</span>
              <h2>Ready to submit?</h2>
              <p>
                Your enquiry will be created using the existing SM CleanTech
                backend workflow.
              </p>

              <div className="bc-submit-summary">
                <span>{selectedDomain?.name}</span>
                <strong>{title}</strong>
                <small>{category} / {selectedProblem?.name}</small>
              </div>

              <button
                className="bc-primary"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit enquiry →'}
              </button>
            </section>
          )}

          <footer className="bc-actions">
            <button
              type="button"
              className="bc-secondary"
              onClick={previousStep}
              disabled={step === 0 || submitting}
            >
              ← Back
            </button>

            {step < STEPS.length - 1 && (
              <button
                type="button"
                className="bc-primary"
                onClick={nextStep}
                disabled={
                  submitting ||
                  (step === 0 && loadingDomains) ||
                  (step === 1 && loadingProblems) ||
                  (step === 3 && loadingQuestions)
                }
              >
                {step === 4 ? 'Continue to submit →' : 'Continue →'}
              </button>
            )}
          </footer>
        </form>
      </main>
    </PanelLayout>
  )
}
