import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../services/api'
import PanelLayout from '../components/PanelLayout'
import StatCard from '../components/StatCard'

export default function VendorDashboard() {
  const [data, setData] = useState({
    stats: {},
    matches: [],
  })

  useEffect(() => {
    API.get('/vendor/dashboard').then((r) => setData(r.data))
  }, [])

  return (
    <PanelLayout role="vendor" title="Vendor Dashboard">
      <div className="stats">
        {Object.entries(data.stats).map(([k, v]) => (
          <StatCard
            key={k}
            label={k.replaceAll('_', ' ')}
            value={v}
          />
        ))}
      </div>

      <div className="panel-card">
        <div className="card-head">
          <div>
            <span className="eyebrow">Admin-approved opportunities</span>
            <h2>Matching Suggestions</h2>
            <p className="muted">
              These enquiries were approved by the platform admin and matched
              to your registered domain/specialization. Buyer identity remains
              masked.
            </p>
          </div>
        </div>

        {data.matches.length ? (
          <div className="table">
            {data.matches.map((m) => (
              <Link
                to={`/vendor/enquiries/${m.id}`}
                className="table-row"
                key={m.id}
              >
                <span>
                  #{m.id} · {m.title}
                </span>

                <span>{m.domain}</span>

                <span>{Math.round(m.score)}% match</span>

                <span>
                  {m.quotation_exists ? 'Quotation submitted' : 'New'}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">
            No admin-approved matching suggestions yet.
          </div>
        )}
      </div>
    </PanelLayout>
  )
}
