import { useEffect, useState } from 'react'

import API from '../services/api'

import PanelLayout from '../components/PanelLayout'

import '../styles/AdminRegistrations.css'


export default function AdminRegistrations() {

  const [rows, setRows] = useState([])

  const [msg, setMsg] = useState('')

  const [msgType, setMsgType] = useState('success')

  const [loading, setLoading] = useState(true)

  const [busy, setBusy] = useState(null)

  const [filter, setFilter] = useState('all')

  const [search, setSearch] = useState('')


  // ============================================================
  // USER CRM MODAL
  // ============================================================

  const [selectedUser, setSelectedUser] = useState(null)

  const [crmData, setCrmData] = useState(null)

  const [crmLoading, setCrmLoading] = useState(false)

  const [crmError, setCrmError] = useState('')


  // ============================================================
  // LOAD REGISTRATIONS
  // ============================================================

  const load = async () => {

    setLoading(true)

    try {

      const r = await API.get('/admin/registrations')

      setRows(r.data)

    } catch (err) {

      setMsg(
        err.response?.data?.detail ||
        'Unable to load registrations.'
      )

      setMsgType('error')

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {

    load()

  }, [])


  // ============================================================
  // OPEN USER CRM
  // ============================================================

  const openUserCRM = async (participant) => {

    setSelectedUser(participant)

    setCrmData(null)

    setCrmError('')

    setCrmLoading(true)

    try {

      const response = await API.get(
        `/admin/registrations/${participant.id}/crm`
      )

      setCrmData(response.data)

    } catch (err) {

      setCrmError(
        err.response?.data?.detail ||
        'Unable to load user CRM.'
      )

    } finally {

      setCrmLoading(false)

    }

  }


  // ============================================================
  // CLOSE CRM MODAL
  // ============================================================

  const closeUserCRM = () => {

    setSelectedUser(null)

    setCrmData(null)

    setCrmError('')

  }


  // ============================================================
  // BLOCK ACCOUNT
  // ============================================================

  const block = async (id) => {

    setMsg('')

    setBusy(id)

    try {

      await API.put(
        `/admin/registrations/${id}`,
        {
          status: 'blocked',
          note: 'Blocked by platform administrator.',
        }
      )

      setMsg(
        'Account blocked successfully.'
      )

      setMsgType('success')

      await load()

    } catch (err) {

      setMsg(
        err.response?.data?.detail ||
        'Unable to update account.'
      )

      setMsgType('error')

    } finally {

      setBusy(null)

    }

  }


  // ============================================================
  // DELETE ACCOUNT
  // ============================================================

  const deleteAccount = async (
    id,
    role,
    name
  ) => {

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${role} "${name}"?`
    )

    if (!confirmed) return

    setMsg('')

    setBusy(`delete-${id}`)

    try {

      await API.delete(
        `/admin/registrations/${id}`
      )

      setMsg(
        `${role.charAt(0).toUpperCase() + role.slice(1)} account deleted successfully.`
      )

      setMsgType('success')

      // If deleted user is open
      if (
        selectedUser &&
        Number(selectedUser.id) === Number(id)
      ) {

        closeUserCRM()

      }

      await load()

    } catch (err) {

      setMsg(
        err.response?.data?.detail ||
        'Unable to delete account.'
      )

      setMsgType('error')

    } finally {

      setBusy(null)

    }

  }


  // ============================================================
  // FILTER
  // ============================================================

  const filtered = rows.filter((r) => {

    if (
      filter !== 'all' &&
      r.role !== filter
    ) {

      return false

    }

    if (search.trim()) {

      const q =
        search
          .toLowerCase()
          .trim()

      return (

        (r.company_name || '')
          .toLowerCase()
          .includes(q) ||

        (r.name || '')
          .toLowerCase()
          .includes(q) ||

        (r.email || '')
          .toLowerCase()
          .includes(q)

      )

    }

    return true

  })


  // ============================================================
  // COUNTS
  // ============================================================

  const counts = {

    all: rows.length,

    buyer:
      rows.filter(
        (r) => r.role === 'buyer'
      ).length,

    vendor:
      rows.filter(
        (r) => r.role === 'vendor'
      ).length,

  }


  // ============================================================
  // STATUS CLASS
  // ============================================================

  const statusClass = (s) => (

    {

      active:
        'reg-status--active',

      blocked:
        'reg-status--blocked',

      pending:
        'reg-status--pending',

    }[s] ||

    'reg-status--default'

  )


  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (value) => {

    if (!value) {
      return '—'
    }

    const date =
      new Date(value)

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return value

    }

    return date.toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    )

  }


  // ============================================================
  // EVENT LABEL
  // ============================================================

  const eventLabel = (event) => {

    if (!event) {
      return 'Activity'
    }

    return event
      .replaceAll('_', ' ')
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase()
      )

  }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <PanelLayout
      role="admin"
      title="Registered Participants"
    >

      <div className="admin-reg">

        <div className="panel-card admin-reg__card">

          {/* ====================================================
              HEADER
          ==================================================== */}

          <div className="card-head">

            <div>

              <span className="eyebrow">
                OTP-based onboarding
              </span>

              <h2>
                Buyer &amp; Vendor accounts
              </h2>

              <p className="muted">
                Registration does not require admin approval.
                Email OTP activates buyer/vendor accounts.
                Admin approval is reserved for technical enquiries.
              </p>

            </div>


            <div className="reg-summary">

              <div className="reg-summary__item">

                <span className="reg-summary__num">
                  {counts.buyer}
                </span>

                <span className="reg-summary__label">
                  Buyers
                </span>

              </div>


              <div className="reg-summary__divider" />


              <div className="reg-summary__item">

                <span className="reg-summary__num">
                  {counts.vendor}
                </span>

                <span className="reg-summary__label">
                  Vendors
                </span>

              </div>

            </div>

          </div>


          {/* ====================================================
              MESSAGE
          ==================================================== */}

          {msg && (

            <div
              className={
                `message ${
                  msgType === 'success'
                    ? 'message--success'
                    : 'message--error'
                }`
              }
            >

              <span className="message__icon">

                {msgType === 'success'
                  ? '✓'
                  : '!'}

              </span>

              <span>
                {msg}
              </span>

              <button
                type="button"
                className="message__close"
                onClick={() =>
                  setMsg('')
                }
              >
                ×
              </button>

            </div>

          )}


          {/* ====================================================
              FILTER BAR
          ==================================================== */}

          <div className="reg-toolbar">

            <div className="reg-filters">

              {[
                {
                  key: 'all',
                  label: 'All',
                  count: counts.all,
                },

                {
                  key: 'buyer',
                  label: 'Buyers',
                  count: counts.buyer,
                },

                {
                  key: 'vendor',
                  label: 'Vendors',
                  count: counts.vendor,
                },

              ].map((f) => (

                <button
                  key={f.key}
                  className={
                    `reg-filter ${
                      filter === f.key
                        ? 'reg-filter--active'
                        : ''
                    }`
                  }
                  onClick={() =>
                    setFilter(f.key)
                  }
                >

                  <span>
                    {f.label}
                  </span>

                  <span className="reg-filter__count">
                    {f.count}
                  </span>

                </button>

              ))}

            </div>


            <div className="reg-search">

              <span className="reg-search__icon">
                🔍
              </span>

              <input
                type="text"
                placeholder="Search name, company or email…"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

          </div>


          {/* ====================================================
              TABLE
          ==================================================== */}

          {loading ? (

            <div className="reg-skeletons">

              {Array.from({
                length: 5,
              }).map((_, i) => (

                <div
                  key={i}
                  className="reg-skeleton"
                />

              ))}

            </div>

          ) : filtered.length > 0 ? (

            <div className="reg-table">

              <div className="reg-table__head">

                <span>
                  Participant
                </span>

                <span>
                  Role
                </span>

                <span>
                  OTP
                </span>

                <span>
                  Status
                </span>

                <span />

              </div>


              {filtered.map((r, i) => (

                <div
                  className="reg-table__row reg-table__row--clickable"
                  key={r.id}
                  style={{
                    animationDelay:
                      `${i * 0.05}s`,
                  }}
                  onClick={() =>
                    openUserCRM(r)
                  }
                  title="Click to view profile and complete CRM"
                >

                  {/* PARTICIPANT */}

                  <div
                    className="reg-table__cell reg-table__cell--main"
                    data-label="Participant"
                  >

                    <div
                      className={
                        `reg-avatar reg-avatar--${r.role}`
                      }
                    >

                      {(r.company_name ||
                        r.name ||
                        '?')
                        .charAt(0)
                        .toUpperCase()}

                    </div>


                    <div className="reg-info">

                      <strong>
                        {r.company_name ||
                          r.name}
                      </strong>

                      <span className="muted">
                        {r.email}
                      </span>

                    </div>

                  </div>


                  {/* ROLE */}

                  <div
                    className="reg-table__cell"
                    data-label="Role"
                  >

                    <span
                      className={
                        `role-pill role-pill--${r.role}`
                      }
                    >

                      {r.role === 'buyer'
                        ? '🏢'
                        : '🌱'}{' '}

                      {r.role}

                    </span>

                  </div>


                  {/* OTP */}

                  <div
                    className="reg-table__cell"
                    data-label="OTP"
                  >

                    <span
                      className={
                        `otp-pill ${
                          r.email_verified
                            ? 'otp-pill--verified'
                            : 'otp-pill--pending'
                        }`
                      }
                    >

                      <span className="otp-pill__dot" />

                      {r.email_verified
                        ? 'Verified'
                        : 'Pending'}

                    </span>

                  </div>


                  {/* STATUS */}

                  <div
                    className="reg-table__cell"
                    data-label="Status"
                  >

                    <span
                      className={
                        `reg-status ${statusClass(
                          r.status
                        )}`
                      }
                    >

                      <span className="reg-status__dot" />

                      {r.status}

                    </span>

                  </div>


                  {/* ACTION */}

                  <div
                    className="reg-table__cell reg-table__cell--action"
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                  >

                    {r.status !== 'blocked' ? (

                      <button
                        className="btn-block"
                        disabled={
                          busy === r.id
                        }
                        onClick={() =>
                          block(r.id)
                        }
                        title="Block account"
                      >

                        {busy === r.id ? (

                          <>
                            <span className="spinner spinner--accent" />
                            Blocking…
                          </>

                        ) : (

                          <>
                            <span>⛔</span>
                            Block
                          </>

                        )}

                      </button>

                    ) : (

                      <span className="reg-locked">
                        Locked
                      </span>

                    )}


                    <button
                      type="button"
                      className="btn-delete"
                      disabled={
                        busy ===
                        `delete-${r.id}`
                      }
                      onClick={() =>
                        deleteAccount(
                          r.id,
                          r.role,
                          r.company_name ||
                            r.name ||
                            r.email
                        )
                      }
                      title={`Delete ${r.role}`}
                    >

                      {busy ===
                      `delete-${r.id}` ? (

                        <span className="spinner" />

                      ) : (

                        <svg
                          width="17"
                          height="17"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >

                          <polyline points="3 6 5 6 21 6" />

                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />

                          <path d="M10 11v6" />

                          <path d="M14 11v6" />

                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />

                        </svg>

                      )}

                    </button>

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <div className="reg-empty">

              <div className="reg-empty__icon">
                👥
              </div>

              <h3>

                {search ||
                filter !== 'all'
                  ? 'No matching accounts'
                  : 'No buyer/vendor accounts yet'}

              </h3>

              <p className="muted">

                {search ||
                filter !== 'all'
                  ? 'Try adjusting your search or filter.'
                  : 'Registered accounts will appear here once users complete OTP.'}

              </p>

            </div>

          )}

        </div>

      </div>


      {/* ========================================================
          USER PROFILE + COMPLETE CRM MODAL
      ======================================================== */}

      {selectedUser && (

        <div
          className="participant-modal-overlay"
          onClick={closeUserCRM}
        >

          <div
            className="participant-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* ==================================================
                MODAL HEADER
            ================================================== */}

            <div className="participant-modal__header">

              <div className="participant-modal__identity">

                <div
                  className={
                    `participant-modal__avatar participant-modal__avatar--${selectedUser.role}`
                  }
                >

                  {(selectedUser.company_name ||
                    selectedUser.name ||
                    '?')
                    .charAt(0)
                    .toUpperCase()}

                </div>


                <div>

                  <span className="participant-modal__eyebrow">

                    {selectedUser.role === 'buyer'
                      ? 'BUYER PROFILE'
                      : 'VENDOR PROFILE'}

                  </span>


                  <h2>

                    {selectedUser.company_name ||
                      selectedUser.name}

                  </h2>


                  <p>
                    {selectedUser.email}
                  </p>

                </div>

              </div>


              <button
                type="button"
                className="participant-modal__close"
                onClick={closeUserCRM}
              >
                ×
              </button>

            </div>


            {/* ==================================================
                MODAL BODY
            ================================================== */}

            <div className="participant-modal__body">


              {crmLoading ? (

                <div className="crm-full-loading">

                  <span className="crm-spinner" />

                  <div>

                    <strong>
                      Loading complete CRM…
                    </strong>

                    <span>
                      Fetching profile, login activity and
                      {selectedUser.role === 'buyer'
                        ? ' buyer'
                        : ' vendor'}{' '}
                      CRM.
                    </span>

                  </div>

                </div>

              ) : crmError ? (

                <div className="crm-error">

                  <span>
                    ⚠️
                  </span>

                  <div>

                    <strong>
                      Unable to load CRM
                    </strong>

                    <p>
                      {crmError}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openUserCRM(
                        selectedUser
                      )
                    }
                  >
                    Retry
                  </button>

                </div>

              ) : crmData ? (

                <>

                  {/* ==========================================
                      PROFILE
                  ========================================== */}

                  <section className="profile-section">

                    <div className="profile-section__title">

                      <span>
                        👤
                      </span>

                      Profile Information

                    </div>


                    <div className="profile-grid">

                      <div className="profile-item">

                        <span>
                          Name
                        </span>

                        <strong>
                          {crmData.user?.name ||
                            '—'}
                        </strong>

                      </div>


                      <div className="profile-item">

                        <span>
                          Email
                        </span>

                        <strong>
                          {crmData.user?.email ||
                            '—'}
                        </strong>

                      </div>


                      <div className="profile-item">

                        <span>
                          Phone
                        </span>

                        <strong>
                          {crmData.user?.phone ||
                            '—'}
                        </strong>

                      </div>


                      <div className="profile-item">

                        <span>
                          Role
                        </span>

                        <strong className="profile-role">

                          {crmData.user?.role ===
                          'buyer'
                            ? '🏢 Buyer'
                            : '🌱 Vendor'}

                        </strong>

                      </div>


                      <div className="profile-item">

                        <span>
                          Status
                        </span>

                        <strong className="profile-active">

                          {crmData.user?.status ||
                            '—'}

                        </strong>

                      </div>


                      <div className="profile-item">

                        <span>
                          Email Verification
                        </span>

                        <strong
                          className={
                            crmData.user
                              ?.email_verified
                              ? 'profile-active'
                              : 'profile-pending'
                          }
                        >

                          {crmData.user
                            ?.email_verified
                            ? '✓ Verified'
                            : 'Pending'}

                        </strong>

                      </div>


                      <div className="profile-item">

                        <span>
                          User ID
                        </span>

                        <strong>
                          #{crmData.user?.id}
                        </strong>

                      </div>


                      <div className="profile-item">

                        <span>
                          Registered
                        </span>

                        <strong>
                          {formatDate(
                            crmData.user
                              ?.created_at
                          )}
                        </strong>

                      </div>

                    </div>

                  </section>


                  {/* ==========================================
                      COMPLETE PROFILE FIELDS
                  ========================================== */}

                  {crmData.profile &&
                    Object.keys(
                      crmData.profile
                    ).length > 0 && (

                    <section className="profile-section">

                      <div className="profile-section__title">

                        <span>
                          🏢
                        </span>

                        {crmData.user?.role ===
                        'buyer'
                          ? 'Buyer Details'
                          : 'Vendor Details'}

                      </div>


                      <div className="profile-grid">

                        {Object.entries(
                          crmData.profile
                        ).map(
                          ([key, value]) => {

                            if (
                              value === null ||
                              value === undefined ||
                              value === ''
                            ) {
                              return null
                            }

                            return (

                              <div
                                className="profile-item"
                                key={key}
                              >

                                <span>
                                  {key
                                    .replaceAll(
                                      '_',
                                      ' '
                                    )
                                    .replace(
                                      /\b\w/g,
                                      (char) =>
                                        char.toUpperCase()
                                    )}
                                </span>

                                <strong>
                                  {Array.isArray(
                                    value
                                  )
                                    ? value.join(
                                        ', '
                                      )
                                    : String(
                                        value
                                      )}
                                </strong>

                              </div>

                            )

                          }
                        )}

                      </div>

                    </section>

                  )}


                  {/* ==========================================
                      LOGIN CRM
                  ========================================== */}

                  <section className="profile-section">

                    <div className="profile-section__title">

                      <span>
                        🔐
                      </span>

                      Login CRM

                    </div>


                    <div className="crm-stats">

                      <div className="crm-stat">

                        <span className="crm-stat__icon">
                          🔑
                        </span>

                        <div>

                          <strong>
                            {
                              crmData
                                .login_crm
                                ?.total_logins || 0
                            }
                          </strong>

                          <span>
                            Total Logins
                          </span>

                        </div>

                      </div>


                      <div className="crm-stat">

                        <span className="crm-stat__icon">
                          🕒
                        </span>

                        <div>

                          <strong className="crm-stat__date">

                            {formatDate(
                              crmData
                                .login_crm
                                ?.last_login
                            )}

                          </strong>

                          <span>
                            Last Login
                          </span>

                        </div>

                      </div>

                    </div>


                    <div className="login-history">

                      <div className="login-history__header">

                        <span>
                          Login History
                        </span>

                        <span className="login-history__count">

                          {
                            crmData
                              .login_crm
                              ?.history
                              ?.length || 0
                          }

                        </span>

                      </div>


                      {crmData
                        .login_crm
                        ?.history
                        ?.length > 0 ? (

                        <div className="login-history__list">

                          {crmData
                            .login_crm
                            .history
                            .map(
                              (
                                event,
                                index
                              ) => (

                                <div
                                  className="login-history__item"
                                  key={event.id}
                                >

                                  <div className="login-history__dot">

                                    <span />

                                  </div>


                                  <div className="login-history__content">

                                    <strong>
                                      Successful Login
                                    </strong>

                                    <span>

                                      {formatDate(
                                        event.login_at
                                      )}

                                    </span>

                                  </div>


                                  <span className="login-history__number">

                                    #{index + 1}

                                  </span>

                                </div>

                              )
                            )}

                        </div>

                      ) : (

                        <div className="login-history__empty">

                          <span>
                            🔒
                          </span>

                          <p>
                            No login activity recorded yet.
                          </p>

                        </div>

                      )}

                    </div>

                  </section>


                  {/* ==========================================
                      BUYER / VENDOR CRM
                  ========================================== */}

                  <section className="profile-section complete-crm-section">

                    <div className="profile-section__title">

                      <span>
                        📊
                      </span>

                      {crmData.user?.role ===
                      'buyer'
                        ? 'Buyer CRM'
                        : 'Vendor CRM'}

                      <span className="crm-role-badge">

                        {crmData.crm?.total_events ||
                          0}{' '}

                        Events

                      </span>

                    </div>


                    {crmData.crm?.events?.length > 0 ? (

                      <div className="complete-crm-list">

                        {crmData.crm.events.map(
                          (event, index) => (

                            <div
                              className="complete-crm-card"
                              key={`${event.enquiry_id}-${index}`}
                            >

                              <div className="complete-crm-card__top">

                                <div>

                                  <span className="crm-enquiry-id">

                                    Enquiry #
                                    {event.enquiry_id}

                                  </span>

                                  <h4>
                                    {event.title ||
                                      'Untitled Enquiry'}
                                  </h4>

                                </div>


                                <span className="crm-event-badge">

                                  {eventLabel(
                                    event.event
                                  )}

                                </span>

                              </div>


                              <div className="complete-crm-card__note">

                                <span>
                                  📝
                                </span>

                                <p>
                                  {event.note ||
                                    'No note available'}
                                </p>

                              </div>


                              <div className="complete-crm-card__bottom">

                                <span>
                                  🕒
                                </span>

                                {formatDate(
                                  event.created_at
                                )}

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    ) : (

                      <div className="crm-empty">

                        <span>
                          📭
                        </span>

                        <strong>
                          No CRM activity
                        </strong>

                        <p>
                          No{' '}
                          {crmData.user?.role ===
                          'buyer'
                            ? 'buyer'
                            : 'vendor'}{' '}
                          CRM events are available
                          for this account yet.
                        </p>

                      </div>

                    )}

                  </section>

                </>

              ) : null}

            </div>


            {/* ==================================================
                FOOTER
            ================================================== */}

            <div className="participant-modal__footer">

              <span>

                Showing complete account CRM for this participant.

              </span>

              <button
                type="button"
                onClick={closeUserCRM}
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </PanelLayout>

  )

}
