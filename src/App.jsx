import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || ''

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('admin@panel.pk')
  const [passwordHash, setPasswordHash] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  async function bootstrapIfNeeded() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/bootstrap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Owner', email, password_hash: passwordHash })
      })
      if (res.ok) return
    } catch {}
  }

  async function login(e) {
    e.preventDefault()
    setError('')
    try {
      // try bootstrap first for a fresh DB
      await bootstrapIfNeeded()
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password_hash: passwordHash })
      })
      if (!res.ok) throw new Error('Invalid credentials')
      const data = await res.json()
      onLogin(data)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-md w-full bg-white/80 backdrop-blur p-6 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
      <p className="text-sm text-gray-600 mb-4">Use any SHA256 hash as password_hash. On first login, we will auto-create an owner account for convenience.</p>
      <form onSubmit={login} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <div>
          <input type={show? 'text':'password'} className="w-full border rounded px-3 py-2" placeholder="password_hash (SHA256)" value={passwordHash} onChange={e=>setPasswordHash(e.target.value)} />
          <button type="button" className="text-xs text-blue-600 mt-1" onClick={()=>setShow(s=>!s)}>{show?'Hide':'Show'}</button>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2">Login</button>
      </form>
    </div>
  )
}

function ServiceForm({ token, onCreated }) {
  const [form, setForm] = useState({ name:'', category:'', description:'', rate_per_1k_pkr:'', min:10, max:10000, status:'active' })
  const change = (k,v)=> setForm(s=>({...s,[k]:v}))
  const submit = async (e)=>{
    e.preventDefault()
    const payload = { ...form, rate_per_1k_pkr: parseFloat(form.rate_per_1k_pkr||0) }
    const res = await fetch(`${API_BASE}/api/services`, { method:'POST', headers:{'Content-Type':'application/json','X-Admin-Token':token}, body: JSON.stringify(payload) })
    if(res.ok){ onCreated(); setForm({ name:'', category:'', description:'', rate_per_1k_pkr:'', min:10, max:10000, status:'active' }) }
  }
  return (
    <form onSubmit={submit} className="grid md:grid-cols-3 gap-3 bg-white p-4 rounded-lg border">
      <input className="border rounded px-3 py-2" placeholder="Name" value={form.name} onChange={e=>change('name', e.target.value)} />
      <input className="border rounded px-3 py-2" placeholder="Category" value={form.category} onChange={e=>change('category', e.target.value)} />
      <input className="border rounded px-3 py-2" placeholder="Rate per 1k (PKR)" value={form.rate_per_1k_pkr} onChange={e=>change('rate_per_1k_pkr', e.target.value)} />
      <input className="border rounded px-3 py-2" placeholder="Min" type="number" value={form.min} onChange={e=>change('min', Number(e.target.value))} />
      <input className="border rounded px-3 py-2" placeholder="Max" type="number" value={form.max} onChange={e=>change('max', Number(e.target.value))} />
      <select className="border rounded px-3 py-2" value={form.status} onChange={e=>change('status', e.target.value)}>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
      </select>
      <input className="md:col-span-3 border rounded px-3 py-2" placeholder="Description" value={form.description} onChange={e=>change('description', e.target.value)} />
      <button className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2">Add Service</button>
    </form>
  )
}

function ServicesTable({ refreshKey }){
  const [rows, setRows] = useState([])
  useEffect(()=>{
    fetch(`${API_BASE}/api/services`).then(r=>r.json()).then(setRows).catch(()=>setRows([]))
  }, [refreshKey])
  return (
    <div className="overflow-x-auto bg-white rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Category</th>
            <th className="text-left p-3">Rate/1k (PKR)</th>
            <th className="text-left p-3">Min-Max</th>
            <th className="text-left p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=> (
            <tr key={i} className="border-t">
              <td className="p-3 font-medium">{r.name}</td>
              <td className="p-3">{r.category}</td>
              <td className="p-3">{r.rate_per_1k_pkr}</td>
              <td className="p-3">{r.min}-{r.max}</td>
              <td className="p-3"><span className={`px-2 py-1 rounded text-white ${r.status==='active'?'bg-emerald-600':'bg-gray-500'}`}>{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Settings({ token }){
  const [settings, setSettings] = useState({ panel_name: 'SMM Panel (PK)', currency:'PKR', announcement:'', payment_methods:['JazzCash','EasyPaisa'] })
  useEffect(()=>{ fetch(`${API_BASE}/api/settings`).then(r=>r.json()).then(d=> setSettings(s=>({...s,...d}))).catch(()=>{}) }, [])
  const save = async ()=>{
    const res = await fetch(`${API_BASE}/api/settings`, { method:'POST', headers:{'Content-Type':'application/json','X-Admin-Token':token}, body: JSON.stringify(settings) })
    if(res.ok){ const d= await res.json(); setSettings(d) }
  }
  return (
    <div className="space-y-3 bg-white p-4 rounded-lg border">
      <div className="grid md:grid-cols-3 gap-3">
        <input className="border rounded px-3 py-2" placeholder="Panel Name" value={settings.panel_name} onChange={e=>setSettings(s=>({...s,panel_name:e.target.value}))} />
        <input className="border rounded px-3 py-2" value={settings.currency} readOnly />
        <input className="border rounded px-3 py-2" placeholder="Announcement" value={settings.announcement||''} onChange={e=>setSettings(s=>({...s,announcement:e.target.value}))} />
      </div>
      <button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2">Save Settings</button>
    </div>
  )
}

function Dashboard({ auth }){
  const [tab, setTab] = useState('services')
  const [refresh, setRefresh] = useState(0)
  const header = (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">{auth?.name}'s Admin • PKR</h1>
      <div className="text-sm text-gray-600">Secure session</div>
    </div>
  )

  return (
    <div className="max-w-6xl w-full space-y-6">
      {header}
      <div className="flex gap-2">
        <button onClick={()=>setTab('services')} className={`px-4 py-2 rounded ${tab==='services'?'bg-blue-600 text-white':'bg-white border'}`}>Services</button>
        <button onClick={()=>setTab('settings')} className={`px-4 py-2 rounded ${tab==='settings'?'bg-blue-600 text-white':'bg-white border'}`}>Settings</button>
      </div>
      {tab==='services' && (
        <div className="space-y-4">
          <ServiceForm token={auth.token} onCreated={()=>setRefresh(v=>v+1)} />
          <ServicesTable refreshKey={refresh} />
        </div>
      )}
      {tab==='settings' && <Settings token={auth.token} />}
    </div>
  )
}

export default function App(){
  const [auth, setAuth] = useState(null)
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 p-6">
      <div className="flex items-center justify-center">
        {!auth ? <AdminLogin onLogin={setAuth} /> : <Dashboard auth={auth} />}
      </div>
      <footer className="mt-10 text-center text-xs text-gray-500">Pakistan-ready SMM panel. Payments: JazzCash • EasyPaisa</footer>
    </div>
  )
}
