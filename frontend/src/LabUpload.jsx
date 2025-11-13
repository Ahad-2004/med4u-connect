import React, { useState } from 'react';
import { uploadFile } from './services/cloudinaryStorage';
import { apiRequest } from './services/api';

export default function LabUpload({ accessToken, patientId }) {
  const [form, setForm] = useState({ title: '', type: 'Lab Results', date: '', url: '' });
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      console.log('[FRONTEND] LabUpload submit - accessToken:', !!accessToken, 'patientId:', patientId);
      
      if (!accessToken) {
        setMsg('No access token - please connect to a patient first');
        return;
      }

      let uploadMeta = null;
      if (file) {
        uploadMeta = await uploadFile(
          file,
          `reports/${patientId}/${Date.now()}_${file.name}`,
          (p) => setProgress(p)
        );
      }

      console.log('[FRONTEND] Sending upload request with token');
      // Send to backend API instead of writing to Firestore directly
      const response = await apiRequest('/hospital-upload-report', {
        method: 'POST',
        body: JSON.stringify({
          accessToken,
          patientId,
          reportTitle: form.title || 'Lab Report',
          reportType: form.type || 'Lab Results',
          reportDate: form.date || new Date().toISOString().split('T')[0],
          reportUrl: uploadMeta?.downloadURL || form.url || '',
          fileSize: uploadMeta?.size || null,
          fileType: uploadMeta?.type || null,
          summary: { findings: [{ name: 'No findings', value: '', unit: '', normal: '' }] }
        })
      });

      console.log('[FRONTEND] Upload response:', response);
      setMsg('Uploaded successfully');
      setProgress(0);
      setFile(null);
      setForm({ title: '', type: 'Lab Results', date: '', url: '' });
    } catch (e) {
      console.error('Upload error:', e);
      setMsg(e.message || 'Upload failed');
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


