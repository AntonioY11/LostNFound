import React, { useEffect, useState } from 'react'
import getApiBase from '../config'

export default function LostItems(){
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState({category:'',color:'',description:'',location:'',date_lost:''})
  const [file, setFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({category:'',color:'',description:'',location:'',date_lost:''})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(()=>{ 
    fetch(getApiBase() + '/api/lost').then(r=>r.json()).then(setItems)
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
    fd.append('date_lost', form.date_lost)
    if (file) fd.append('image', file)
    const url = getApiBase() + '/api/lost'
    const res = await fetch(url, { method:'POST', body: fd, headers: token ? { 'Authorization': 'Bearer ' + token } : undefined })
    if (res.ok) {
      alert('Posted'); window.location.reload()
    } else {
      alert('Error posting lost item')
    }
  }

  function startEdit(item: any) {
    setEditingId(item.id)
    setEditForm({
      category: item.category || '',
      color: item.color || '',
      description: item.description || '',
      location: item.location || '',
      date_lost: item.date_lost ? item.date_lost.split('T')[0] : ''
    })
  }

  async function saveEdit(id: string) {
    const token = localStorage.getItem('token')
    const res = await fetch(getApiBase() + '/api/lost/' + id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      },
      body: JSON.stringify(editForm)
    })
    if (res.ok) {
      setEditingId(null)
      const updated = await fetch(getApiBase() + '/api/lost').then(r=>r.json())
      setItems(updated)
    } else {
      alert('Error updating item')
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item?')) return
    const token = localStorage.getItem('token')
    const res = await fetch(getApiBase() + '/api/lost/' + id, {
      method: 'DELETE',
      headers: token ? { 'Authorization': 'Bearer ' + token } : undefined
    })
    if (res.ok) {
      setItems(items.filter(it => it.id !== id))
    } else {
      alert('Error deleting item')
    }
  }

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
    const res = await fetch(url, { method:'POST', body: fd, headers: token ? { 'Authorization': 'Bearer ' + token } : undefined })
    if (res.ok) {
      alert('Posted'); window.location.reload()
    } else {
      alert('Error posting lost item')
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
                {it.image_url ? <img src={it.image_url} alt={it.category} className="thumb" onError={(e)=>{e.currentTarget.style.display='none';}} /> : null}
                {editingId === it.id ? (
                  <div className="item-body" style={{flex:1}}>
                    <div style={{display:'grid',gap:8}}>
                      <input placeholder="Category" value={editForm.category} onChange={e=>setEditForm({...editForm,category:e.target.value})} />
                      <input placeholder="Color" value={editForm.color} onChange={e=>setEditForm({...editForm,color:e.target.value})} />
                      <input placeholder="Location" value={editForm.location} onChange={e=>setEditForm({...editForm,location:e.target.value})} />
                      <input type="date" value={editForm.date_lost} onChange={e=>setEditForm({...editForm,date_lost:e.target.value})} />
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
                    <div className="small">{it.location} {it.date_lost ? '· ' + new Date(it.date_lost).toLocaleDateString() : ''}</div>
                    <div className="small">Posted by: {it.owner_name || 'Unknown'}{it.owner_email ? ` · ${it.owner_email}` : ''}{it.owner_phone ? ` · ${it.owner_phone}` : ''}</div>
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
          <div className="small">Use the search bar on Home for quick searches.</div>
        </div>
      </aside>
    </div>
  )
}
