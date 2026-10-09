import React, { useEffect, useRef, useState } from 'react';
import { request } from './api';
const empty = { title: '', description: '', status: 'TODO' };
const labels = { TODO: 'To do', IN_PROGRESS: 'In progress', DONE: 'Done' };
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const titleRef = useRef(null);
  async function refresh() {
    setLoading(true);
    try { setTasks(await request()); } finally { setLoading(false); }
  }
  useEffect(() => { refresh().catch(e => setError(e.message)); }, []);
  function reset() { setEditing(null); setForm(empty); }
  async function save(event) {
    event.preventDefault(); setError(''); setNotice('');
    const title = form.title.trim();
    if (title.length < 3 || title.length > 100) { setError('Title must contain 3–100 characters.'); return; }
    if (form.description.length > 500) { setError('Description must be at most 500 characters.'); return; }
    setBusy(true);
    try {
      await request(editing === null ? '' : `/${editing}`, { method: editing === null ? 'POST' : 'PUT', body: JSON.stringify({ ...form, title }) });
      setNotice(editing === null ? 'Task created.' : 'Task updated.'); reset(); await refresh();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function remove(task) {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await request(`/${task.id}`, { method: 'DELETE' });
      if (editing === task.id) reset();
      setNotice('Task deleted.'); await refresh();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <main>
    <header><div className="brand">safaricom <span>ETHIOPIA</span></div><span className="eyebrow">WORKSPACE / TASKS</span></header>
    <section className="intro"><div><p className="eyebrow">A LITTLE FOCUS. A LOT OF PROGRESS.</p><h1>Your tasks, in order.</h1><p>Plan your next move and keep work moving forward.</p></div><div className="count"><strong>{tasks.filter(t => t.status === 'DONE').length}<small> / {tasks.length}</small></strong><span>tasks completed</span></div></section>
    {error && <div className="error" role="alert">{error} <button disabled={busy || loading} onClick={() => { setError(''); refresh().catch(e => setError(e.message)); }}>Retry loading</button></div>}
    {notice && <div className="notice" role="status">{notice}</div>}
    <div className="layout"><section className="panel form-panel"><p className="eyebrow">{editing === null ? 'MAKE A PLAN' : `TASK #${editing}`}</p><h2>{editing === null ? 'Create a task' : 'Edit task'}</h2>
      <form onSubmit={save}><fieldset disabled={busy}>
        <label htmlFor="title">Title <span>*</span></label><input ref={titleRef} id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required minLength={3} maxLength={100} placeholder="What needs to get done?"/>
        <label htmlFor="description">Description <small>Optional</small></label><textarea id="description" rows={5} maxLength={500} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Add a few details…"/><div className="hint">{form.description.length}/500</div>
        <label htmlFor="status">Status</label><select id="status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <button className="primary" type="submit">{busy ? 'Saving…' : editing === null ? '+ Create task' : 'Save changes'}</button>
        {editing !== null && <button type="button" className="cancel" onClick={reset}>Cancel editing</button>}
      </fieldset></form></section>
      <section className="task-section" aria-busy={loading}><div className="list-heading"><h2>All tasks <span>{tasks.length}</span></h2><span className="eyebrow">NEWEST FIRST</span></div>
        {loading ? <div className="empty" role="status">Loading tasks…</div> : tasks.length === 0 ? <div className="empty"><div className="empty-icon">✓</div><h3>A fresh start.</h3><p>Create your first task to get things moving.</p></div> : <div className="task-list">{tasks.map(task => <article className="task" key={task.id}><div className="task-top"><span className={`badge ${task.status}`}>{labels[task.status]}</span><span className="task-id">#{task.id}</span></div><h3>{task.title}</h3><p className="description">{task.description || 'No description added.'}</p><div className="actions"><button disabled={busy} onClick={() => { setEditing(task.id); setForm({ title: task.title, description: task.description || '', status: task.status }); setError(''); setNotice(''); titleRef.current?.focus(); }}>Edit<span className="sr-only"> {task.title}</span></button><button className="delete" disabled={busy} onClick={() => remove(task)}>Delete<span className="sr-only"> {task.title}</span></button></div></article>)}</div>}
      </section></div><footer>Task Manager · Safaricom Ethiopia technical assessment</footer>
  </main>;
}
