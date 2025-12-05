import React, { useEffect, useState } from 'react'

export default function Home(){
  const [lost, setLost] = useState<any[]>([])
  const [found, setFound] = useState<any[]>([])

  useEffect(()=>{
    fetch(getApiBase() + '/api/lost').then(r=>r.json()).then(setLost)
    fetch(getApiBase() + '/api/found').then(r=>r.json()).then(setFound)
  },[])

  return (
    <div className="grid">
      <div>
        <div className="card">
          <h2>Recent Lost Items</h2>
          <ul className="item-list">
            {lost.slice(0,8).map(it=> (
              <li key={it.id} className="item-row">
                {it.image_url ? <img src={it.image_url} alt={it.category} className="thumb" /> : null}
                <div>
                  <div><strong>{it.category}</strong> — {it.description}</div>
                  <div className="small">{it.location} {it.date_lost ? '· ' + new Date(it.date_lost).toLocaleDateString() : ''}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2>Recent Found Items</h2>
          <ul className="item-list">
            {found.slice(0,8).map(it=> (
              <li key={it.id} className="item-row">
                {it.image_url ? <img src={it.image_url} alt={it.category} className="thumb" /> : null}
                <div>
                  <div><strong>{it.category}</strong> — {it.description}</div>
                  <div className="small">{it.location} {it.date_found ? '· ' + new Date(it.date_found).toLocaleDateString() : ''}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside>
        <div className="card">
          <h3>Quick Actions</h3>
          <div className="h-stack">
            <a className="small" href="/lost">Post Lost Item</a>
            <a className="small" href="/found">Post Found Item</a>
          </div>
        </div>

        <div className="card">
          <h3>Tips</h3>
          <p className="small">Fill in clear descriptions, add images, and include the place where the item was lost or found.</p>
        </div>
      </aside>
    </div>
  )
}
