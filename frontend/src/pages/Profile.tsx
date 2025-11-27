import React, { useEffect, useState } from 'react'

export default function Profile(){
  const [profile, setProfile] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])

  const [mode, setMode] = useState<'signin'|'register'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [editMode, setEditMode] = useState(false)

  const apiBase = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3001'

  useEffect(()=>{
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(apiBase + '/api/profile', { headers: { 'Authorization': 'Bearer ' + token } }).then(r=>r.json()).then(setProfile)
    fetch(apiBase + '/api/notifications', { headers: { 'Authorization': 'Bearer ' + token } }).then(r=>r.json()).then(setNotifications)
  },[])

  async function signIn(e:React.FormEvent){
    e.preventDefault()
    try{
      const res = await fetch(apiBase + '/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (data.token) { localStorage.setItem('token', data.token); window.location.reload() }
      else alert(data.error || 'Login failed')
    }catch(err){ alert('Login error') }
  }

  async function register(e:React.FormEvent){
    e.preventDefault()
    try{
      const res = await fetch(apiBase + '/api/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password, phone }) })
      const data = await res.json()
      if (data.token) { localStorage.setItem('token', data.token); window.location.reload() }
      else alert(data.error || 'Registration failed')
    }catch(err){ alert('Registration error') }
  }

  async function updateProfile(e:React.FormEvent){
    e.preventDefault()
    try{
      const token = localStorage.getItem('token')
      if (!token) return alert('Not signed in')
      const res = await fetch(apiBase + '/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ name: name || profile?.name, phone }) })
      const data = await res.json()
      if (data && data.id) { setProfile(data); setEditMode(false) }
      else alert(data.error || 'Update failed')
    }catch(err){ alert('Update error') }
  }

  return (
    <div className="grid">
      <div>
        <div className="card">
          <h2>Profile</h2>

          {!profile && (
            <div>
              <div style={{display:'flex',gap:8,marginBottom:12}}>
                <button type="button" onClick={()=>setMode('signin')} style={{padding:6,background: mode==='signin' ? '#2b6cb0' : '#f2f2f2',color: mode==='signin' ? '#fff' : '#333', border:0,borderRadius:4,cursor:'pointer'}}>Sign in</button>
                <button type="button" onClick={()=>setMode('register')} style={{padding:6,background: mode==='register' ? '#2b6cb0' : '#f2f2f2',color: mode==='register' ? '#fff' : '#333', border:0,borderRadius:4,cursor:'pointer'}}>Sign up</button>
              </div>

              {mode === 'signin' ? (
                <div>
                  <form onSubmit={signIn} style={{display:'grid',gap:8,maxWidth:360}}>
                    <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
                    <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
                    <div>
                      <button type="submit">Sign in</button>
                    </div>
                  </form>
                </div>
              ) : (
                <div>
                  <form onSubmit={register} style={{display:'grid',gap:8,maxWidth:360}}>
                    <input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
                    <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
                    <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
                    <input placeholder="Phone (optional)" value={phone} onChange={e=>setPhone(e.target.value)} />
                    <div>
                      <button type="submit">Create account</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {profile && (
            <div>
              {!editMode ? (
                <div>
                  <p><b>Name:</b> {profile.name}</p>
                  <p><b>Email:</b> {profile.email}</p>
                  <p><b>Phone:</b> {profile.phone || '—'}</p>
                  <div style={{marginTop:10,display:'flex',gap:8}}>
                    <button onClick={()=>{ setEditMode(true); setName(profile.name||''); setPhone(profile.phone||'') }}>Edit profile</button>
                    <button onClick={()=>{ localStorage.removeItem('token'); window.location.reload() }} style={{background:'#e53e3e'}}>Sign out</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={updateProfile} style={{display:'grid',gap:8,maxWidth:360}}>
                  <input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
                  <input placeholder="Phone (optional)" value={phone} onChange={e=>setPhone(e.target.value)} />
                  <div style={{display:'flex',gap:8}}>
                    <button type="submit">Save</button>
                    <button type="button" onClick={()=>setEditMode(false)}>Cancel</button>
                  </div>
                </form>
              )}
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
          <div className="small">Keep credentials private. Use the API to manage users if needed.</div>
        </div>
      </aside>
    </div>
  )
}
