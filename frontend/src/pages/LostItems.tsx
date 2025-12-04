import React, { useEffect, useState } from 'react'

export default function LostItems(){
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState({category:'',color:'',description:'',location:'',date_lost:''})
  const [file, setFile] = useState<File | null>(null)

  useEffect(()=>{ fetch(getApiBase() + '/api/lost').then(r=>r.json()).then(setItems) },[])

  async function submit(e:React.FormEvent){
    e.preventDefault()
    const token = localStorage.getItem('token')
    const fd = new FormData()
    fd.append('category', form.category)
    fd.append('color', form.color)
    fd.append('description', form.description)
    fd.append('location', form.location)
    fd.append('date_lost', form.date_lost)
    if (file) fd.append('image', file)
    const url = getApiBase() + '/api/lost'
    console.log('Posting lost item to', url, 'filePresent=', !!file, 'form=', form)
    const res = await fetch(url, { method:'POST', body: fd, headers: token ? { 'Authorization': 'Bearer ' + token } : undefined })
    if (res.ok) {
      alert('Posted'); window.location.reload()
    } else {
      // Try to surface server error body for easier debugging
      let bodyText = ''
      try { bodyText = await res.text() } catch (e) { bodyText = '<failed to read response body>' }
      console.error('Lost item POST failed', res.status, res.statusText, bodyText)
      alert('Error posting lost item: ' + res.status + '\n' + (bodyText || res.statusText))
    }
  }

  return (
    <div className="grid">
      <div>
        <div className="card">
          <h2>Post Lost Item</h2>
          <form onSubmit={submit} style={{display:'grid',gap:10}}>
            <div className="form-row">
              <input placeholder="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} />
            </div>
            <div className="form-row">
              <input placeholder="Color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})} />
              <input placeholder="Location" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} />
            </div>
            <div className="form-row">
              <input type="date" value={form.date_lost} onChange={e=>setForm({...form,date_lost:e.target.value})} />
            </div>
            <div className="form-row">
              <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
            </div>
            <div className="form-row">
              <input type="file" onChange={e=>setFile(e.target.files ? e.target.files[0] : null)} />
              <div className="small">Optional image helps identification</div>
            </div>
            <div>
              <button type="submit">Submit Lost Item</button>
            </div>
          </form>
        </div>

        <div className="card">
          <h3>All Lost Items</h3>
          <ul className="item-list">
            {items.map(it=> (
              <li key={it.id} className="item-row">
                {it.image_url ? <img src={it.image_url} alt={it.category} className="thumb" /> : null}
                <div className="item-body">
                  <div><strong>{it.category}</strong> — {it.description}</div>
                  <div className="small">{it.location} {it.date_lost ? '· ' + new Date(it.date_lost).toLocaleDateString() : ''}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside>
        <div className="card">
          <h3>Filters</h3>
          <div className="small">Use the search bar on Home for quick searches.</div>
        </div>
      </aside>
    </div>
  )
}
