import React, { useEffect, useState } from 'react'

import getApiBase from '../config'

export default function FoundItems(){
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState({category:'',color:'',description:'',location:'',date_found:''})
  const [file, setFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({category:'',color:'',description:'',location:'',date_found:''})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(()=>{ 
    fetch(getApiBase() + '/api/found').then(r=>r.json()).then(setItems)
    // Get current user ID from token
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setCurrentUserId(payload.id)
      } catch(e) {}
    }
  },[])

  async function submit(e:React.FormEvent){
    e.preventDefault()
    const token = localStorage.getItem('token')
    const fd = new FormData()
    fd.append('category', form.category)
    fd.append('color', form.color)
    fd.append('description', form.description)
    fd.append('location', form.location)
    fd.append('date_found', form.date_found)
    if (file) fd.append('image', file)
    const url = getApiBase() + '/api/found'
    const res = await fetch(url, { method:'POST', body: fd, headers: token ? { 'Authorization': 'Bearer ' + token } : undefined })
    if (res.ok) {
      alert('Posted'); window.location.reload()
    } else {
      alert('Error posting found item')
    }
  }

  function startEdit(item: any) {
    setEditingId(item.id)
    setEditForm({
      category: item.category || '',
      color: item.color || '',
      description: item.description || '',
      location: item.location || '',
      date_found: item.date_found ? item.date_found.split('T')[0] : ''
    })
  }

  async function saveEdit(id: string) {
    const token = localStorage.getItem('token')
    const res = await fetch(getApiBase() + '/api/found/' + id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      },
      body: JSON.stringify(editForm)
    })
    if (res.ok) {
      setEditingId(null)
      const updated = await fetch(getApiBase() + '/api/found').then(r=>r.json())
      setItems(updated)
    } else {
      alert('Error updating item')
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item?')) return
    const token = localStorage.getItem('token')
    const res = await fetch(getApiBase() + '/api/found/' + id, {
      method: 'DELETE',
      headers: token ? { 'Authorization': 'Bearer ' + token } : undefined
    })
    if (res.ok) {
      setItems(items.filter(it => it.id !== id))
    } else {
      alert('Error deleting item')
    }
  }

  return (
    <div className="grid">
      <div>
        <div className="card">
          <h2>Post Found Item</h2>
          <form onSubmit={submit} style={{display:'grid',gap:10}}>
            <div className="form-row">
              <input placeholder="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} />
            </div>
            <div className="form-row">
              <input placeholder="Color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})} />
              <input placeholder="Location" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} />
            </div>
            <div className="form-row">
              <input type="date" value={form.date_found} onChange={e=>setForm({...form,date_found:e.target.value})} />
            </div>
            <div className="form-row">
              <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
            </div>
            <div className="form-row">
              <input type="file" onChange={e=>setFile(e.target.files ? e.target.files[0] : null)} />
              <div className="small">Optional image helps identification</div>
            </div>
            <div>
              <button type="submit">Submit Found Item</button>
            </div>
          </form>
        </div>

        <div className="card">
          <h3>All Found Items</h3>
          <ul className="item-list">
            {items.map(it=> (
              <li key={it.id} className="item-row">
                {it.image_url ? <img src={it.image_url} alt={it.category} className="thumb" /> : null}
                {editingId === it.id ? (
                  <div className="item-body" style={{flex:1}}>
                    <div style={{display:'grid',gap:8}}>
                      <input placeholder="Category" value={editForm.category} onChange={e=>setEditForm({...editForm,category:e.target.value})} />
                      <input placeholder="Color" value={editForm.color} onChange={e=>setEditForm({...editForm,color:e.target.value})} />
                      <input placeholder="Location" value={editForm.location} onChange={e=>setEditForm({...editForm,location:e.target.value})} />
                      <input type="date" value={editForm.date_found} onChange={e=>setEditForm({...editForm,date_found:e.target.value})} />
                      <textarea placeholder="Description" value={editForm.description} onChange={e=>setEditForm({...editForm,description:e.target.value})} />
                      <div className="h-stack">
                        <button onClick={()=>saveEdit(it.id)}>Save</button>
                        <button onClick={()=>setEditingId(null)} style={{background:'#999'}}>Cancel</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="item-body">
                    <div><strong>{it.category}</strong> — {it.description}</div>
                    <div className="small">{it.location} {it.date_found ? '· ' + new Date(it.date_found).toLocaleDateString() : ''}</div>
                    {currentUserId === it.user_id && (
                      <div className="h-stack" style={{marginTop:6}}>
                        <button onClick={()=>startEdit(it)} className="btn-sm">Edit</button>
                        <button onClick={()=>deleteItem(it.id)} className="btn-sm btn-danger">Delete</button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside>
        <div className="card">
          <h3>Filters</h3>
          <div className="small">Try filtering by category on the backend API for focused results.</div>
        </div>
      </aside>
    </div>
  )
}
