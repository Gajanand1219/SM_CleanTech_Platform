import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../services/api'
import PanelLayout from '../components/PanelLayout'
import StatCard from '../components/StatCard'

export default function BuyerDashboard() {
  const [data, setData] = useState({
    stats: {},
    enquiries: [],
  })

  useEffect(() => {
    API.get('/buyer/dashboard').then((r) => setData(r.data))
  }, [])

  return (
    <PanelLayout role="buyer" title="Buyer Dashboard">
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
            <span className="eyebrow">Project requests</span>
            <h2>My enquiries</h2>
            <p className="muted">
              Approved enquiries are matched to suitable vendors. Vendor
              identities stay masked until the two-way handshake is complete.
            </p>
          </div>

          <Link className="primary small" to="/buyer/enquiries/new">
            Create enquiry
          </Link>
        </div>

        {data.enquiries.length ? (
          <div className="table">
            {data.enquiries.map((e) => (
              <Link
                to={`/buyer/enquiries/${e.id}`}
                className="table-row"
                key={e.id}
              >
                <span>
                  #{e.id} · {e.title}
                </span>

                <span>{e.domain}</span>

                <span>
                  <span className="status">{e.status}</span>
                </span>

                <span>
                  {e.matches} matches · {e.quotations} quotes
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">
            No enquiries yet. Start with your first technical requirement.
          </div>
        )}
      </div>
    </PanelLayout>
  )
}
