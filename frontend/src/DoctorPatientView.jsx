import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_CONNECT_API_BASE || 'http://localhost:4000';

export default function DoctorPatientView({ accessToken, patientId }) {
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [pRes, rRes] = await Promise.all([
          fetch(`${API_BASE}/hospital-get-profile`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accessToken, patientId }) }),
          fetch(`${API_BASE}/hospital-get-reports`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accessToken, patientId }) })
        ]);
        if (!pRes.ok || !rRes.ok) throw new Error('Fetch failed');
        const p = await pRes.json();
        const r = await rRes.json();
        setProfile(p);
        setReports(r.reports || []);
      } catch (e) {
        setError('Failed to load patient data');
      }
    }
    if (accessToken && patientId) load();
  }, [accessToken, patientId]);

  if (error) return <div className="text-red-600 text-sm">{error}</div>;
  if (!profile) return <div className="text-sm text-gray-500">Loading patient data…</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Allergies */}
        <div className="card p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Allergies</h4>
          <div className="flex flex-wrap gap-2">
            {(profile.conditions || []).filter(c => c.type === 'allergy').length === 0 && (
              <span className="text-xs text-gray-500">No allergies recorded</span>
            )}
            {(profile.conditions || []).filter(c => c.type === 'allergy').map(a => (
              <span key={a.id} className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-200">
                {a.name || a.title}
              </span>
            ))}
          </div>
        </div>

        {/* Conditions */}
        <div className="card p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Important Conditions</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {(profile.conditions || []).filter(c => c.type !== 'allergy').length === 0 && (
              <li className="text-gray-500">No conditions recorded</li>
            )}
            {(profile.conditions || []).filter(c => c.type !== 'allergy').map(c => (
              <li key={c.id} className="text-gray-800 dark:text-gray-200">{c.name || c.title}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Medications */}
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Medications</h4>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {(profile.medications || []).length === 0 && (
            <li className="py-2 text-sm text-gray-500">No medications recorded</li>
          )}
          {(profile.medications || []).map(m => (
            <li key={m.id} className="py-2 text-sm flex items-center justify-between">
              <span className="font-medium text-gray-900 dark:text-gray-100">{m.name}</span>
              <span className="text-gray-500 dark:text-gray-400">{m.dosage ? m.dosage : ''}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Reports */}
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Reports</h4>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {reports.length === 0 && (
            <li className="py-2 text-sm text-gray-500">No reports found</li>
          )}
          {reports.map(rep => (
            <li key={rep.id} className="py-2 text-sm flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{rep.title}</div>
                <div className="text-xs text-gray-500">{rep.type || 'Medical Report'}</div>
              </div>
              {rep.downloadURL ? (
                <a className="btn btn-secondary px-3 py-1 text-xs" href={rep.downloadURL} target="_blank" rel="noreferrer">View</a>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


