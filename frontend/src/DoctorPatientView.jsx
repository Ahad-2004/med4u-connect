import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_CONNECT_API_BASE || 'http://localhost:4000';

function Avatar({ name, id }) {
  const initials = useMemo(() => {
    if (name && typeof name === 'string') {
      const parts = name.trim().split(/\s+/);
      return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
    }
    if (id) return String(id).slice(0, 2).toUpperCase();
    return 'RM';
  }, [name, id]);
  return (
    <div className="h-10 w-10 rounded-full bg-teal-600 text-white grid place-items-center text-sm font-semibold shadow">
      {initials}
    </div>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-xl grid place-items-center text-white ${accent}`}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </div>
  );
}

function FileIcon({ url, type }) {
  const isPdf = (url || '').toLowerCase().endsWith('.pdf') || (type || '').toLowerCase().includes('pdf');
  return isPdf ? (
    <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6" fill="currentColor"/></svg>
  ) : (
    <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14"/><path d="M3 19l6-6 4 4 5-5 3 3"/></svg>
  );
}

export default function DoctorPatientView({ accessToken, patientId }) {
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' });

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

  const sortedReports = useMemo(() => {
    const arr = [...reports];
    arr.sort((a, b) => {
      const key = sort.key;
      const av = (a[key] || '').toString();
      const bv = (b[key] || '').toString();
      if (sort.dir === 'asc') return av.localeCompare(bv);
      return bv.localeCompare(av);
    });
    return arr;
  }, [reports, sort]);

  if (error) return <div className="text-red-600 text-sm">{error}</div>;
  if (!profile) return <div className="text-sm text-gray-500">Loading patient data…</div>;

  const allergies = (profile.conditions || []).filter(c => c.type === 'allergy');
  const conditions = (profile.conditions || []).filter(c => c.type !== 'allergy');
  const meds = profile.medications || [];

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={profile?.name} id={patientId} />
          <div>
            <div className="text-sm text-gray-500">Patient</div>
            <div className="text-base font-semibold">{profile?.name || patientId}</div>
          </div>
        </div>
        <div className="text-xs text-gray-500">Overview</div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Allergies"
          value={allergies.length}
          accent="bg-rose-500"
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8-4.5-8-10a8 8 0 1116 0c0 5.5-8 10-8 10z"/></svg>}
        />
        <StatCard
          label="Medications"
          value={meds.length}
          accent="bg-teal-600"
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v4H7z"/><path d="M5 11h14v8a2 2 0 01-2 2H7a2 2 0 01-2-2z"/></svg>}
        />
        <StatCard
          label="Conditions"
          value={conditions.length}
          accent="bg-blue-600"
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Allergies</h4>
          <div className="flex flex-wrap gap-2">
            {allergies.length === 0 && <span className="text-xs text-gray-500">No allergies recorded</span>}
            {allergies.map(a => (
              <span key={a.id} className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-200">
                {a.name || a.title}
              </span>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Important Conditions</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {conditions.length === 0 && <li className="text-gray-500">No conditions recorded</li>}
            {conditions.map(c => (
              <li key={c.id} className="text-gray-800 dark:text-gray-200">{c.name || c.title}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Reports</h4>
          <div className="flex items-center gap-2 text-xs">
            <button className="btn btn-secondary px-2 py-1" onClick={() => setSort(s => ({ key: 'title', dir: s.dir === 'asc' ? 'desc' : 'asc' }))}>Title</button>
            <button className="btn btn-secondary px-2 py-1" onClick={() => setSort(s => ({ key: 'type', dir: s.dir === 'asc' ? 'desc' : 'asc' }))}>Type</button>
            <button className="btn btn-secondary px-2 py-1" onClick={() => setSort(s => ({ key: 'date', dir: s.dir === 'asc' ? 'desc' : 'asc' }))}>Date</button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400">
              <th className="py-2 pr-3">File</th>
              <th className="py-2 pr-3">Title</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sortedReports.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-gray-500">No reports found</td></tr>
            )}
            {sortedReports.map(rep => (
              <tr key={rep.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                <td className="py-2 pr-3"><FileIcon url={rep.downloadURL} type={rep.fileType || rep.type} /></td>
                <td className="py-2 pr-3 font-medium text-gray-900 dark:text-gray-100">{rep.title}</td>
                <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">{rep.type || 'Report'}</td>
                <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">{rep.date || ''}</td>
                <td className="py-2 pr-3">
                  {rep.downloadURL ? (
                    <a className="btn btn-secondary px-3 py-1" href={rep.downloadURL} target="_blank" rel="noreferrer">View</a>
                  ) : (
                    <span className="text-xs text-gray-500">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

