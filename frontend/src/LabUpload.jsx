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
          <label className="label">Report Title</label>
          <input
            className="input"
            placeholder="e.g., Blood Test Results"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
          <p className="helper-text">Give this report a descriptive name</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Report Type</label>
            <input
              className="input"
              placeholder="e.g., Lab Results, X-Ray"
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Report Date</label>
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Upload File (PDF or Image)</label>
          <input
            className="input"
            type="file"
            accept="application/pdf,image/*"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          {file && progress > 0 && progress < 100 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          <p className="helper-text">Accepted formats: PDF, JPG, PNG (max 10MB)</p>
        </div>

        <div>
          <label className="label">Or paste Report URL</label>
          <input
            className="input"
            placeholder="https://example.com/report.pdf"
            value={form.url}
            onChange={e => setForm({ ...form, url: e.target.value })}
          />
          <p className="helper-text">If the report is already hosted online</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="btn btn-primary" disabled={progress > 0 && progress < 100}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <path d="M17 8l-5-5-5 5" />
              <path d="M12 3v12" />
            </svg>
            {progress > 0 && progress < 100 ? 'Uploading...' : 'Upload Report'}
          </button>
          {msg && (
            <div className={`text-sm ${msg.includes('success') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>
              {msg}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}


