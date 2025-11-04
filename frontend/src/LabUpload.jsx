import React, { useState } from 'react';
import { uploadFile } from './services/cloudinaryStorage';

const API_BASE = import.meta.env.VITE_CONNECT_API_BASE || 'http://localhost:4000';

export default function LabUpload({ accessToken, patientId }) {
  const [form, setForm] = useState({ title: '', type: 'Lab Results', date: '', url: '' });
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      let uploadMeta = null;
      if (file) {
        uploadMeta = await uploadFile(
          file,
          `reports/${patientId}/${Date.now()}_${file.name}`,
          (p) => setProgress(p)
        );
      }

      const res = await fetch(`${API_BASE}/hospital-upload-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          patientId,
          reportTitle: form.title,
          reportType: form.type,
          reportDate: form.date,
          reportUrl: uploadMeta?.downloadURL || form.url || null,
          fileSize: uploadMeta?.size || null,
          fileType: uploadMeta?.type || null
        })
      });
      if (!res.ok) throw new Error('Upload failed');
      setMsg('Uploaded successfully');
      setProgress(0);
      setFile(null);
    } catch (e) {
      setMsg('Upload failed');
    }
  };

  return (
    <div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Type</label>
            <input className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} />
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">File (PDF/Image)</label>
          <input className="input" type="file" accept="application/pdf,image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
          {file && progress > 0 && progress < 100 && (
            <div className="mt-2 text-sm text-gray-600">Uploading: {progress}%</div>
          )}
        </div>
        <div>
          <label className="label">Or paste Report URL</label>
          <input className="input" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn btn-primary">Upload</button>
          {msg && <div className="text-sm text-gray-600">{msg}</div>}
        </div>
      </form>
    </div>
  );
}


