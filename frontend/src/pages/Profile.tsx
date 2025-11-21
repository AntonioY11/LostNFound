import React, { useEffect, useState } from 'react'

export default function Profile(){
  const [profile, setProfile] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(()=>{
    const token = localStorage.getItem('token')
    if (!token) return
    fetch((import.meta.env.VITE_API_BASE||'http://localhost:3001') + '/api/profile', { headers: { 'Authorization': 'Bearer ' + token } }).then(r=>r.json()).then(setProfile)
    fetch((import.meta.env.VITE_API_BASE||'http://localhost:3001') + '/api/notifications', { headers: { 'Authorization': 'Bearer ' + token } }).then(r=>r.json()).then(setNotifications)
  },[])

  async function signIn(e:React.FormEvent){
    e.preventDefault()
    try{
      const res = await fetch((import.meta.env.VITE_API_BASE||'http://localhost:3001') + '/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (data.token) { localStorage.setItem('token', data.token); window.location.reload() }
      else alert(data.error || 'Login failed')
    }catch(err){ alert('Login error') }
  }

  return (
    <div className="grid">
      <div>
        <div className="card">
          <h2>Profile</h2>
          {!profile && (
            <div>
              <p className="small">No account signed in. Use the form below to sign in.</p>
              <form onSubmit={signIn} style={{display:'grid',gap:8,maxWidth:360}}>
                <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
                <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
                <div>
                  <button type="submit">Sign in</button>
                </div>
              </form>
            </div>
          )}
          {profile && (
            <div>
              <p><b>Name:</b> {profile.name}</p>
              <p><b>Email:</b> {profile.email}</p>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Notifications</h3>
          <ul className="item-list">
            {notifications.map(n=> <li key={n.id}>{n.message} <div className="small">{n.created_at}</div></li>)}
          </ul>
        </div>
      </div>

      <aside>
        <div className="card">
          <h3>Account</h3>
          <div className="small">Register new users via the backend API (`POST /api/register`).</div>
        </div>
      </aside>
    </div>
  )
}
