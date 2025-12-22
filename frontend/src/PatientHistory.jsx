import React, { useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

export default function PatientHistory({ doctorId, onSelect }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function load() {
      if (!doctorId) return;
      try {
        const q = query(collection(db, 'doctorPatients'), where('doctorId', '==', doctorId), orderBy('lastAccessed', 'desc'));
        const snap = await getDocs(q);
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        // ignore permission errors in dev
        setItems([]);
      }
    }
    load();
  }, [doctorId]);

  if (!doctorId) return null;

  return (
    <div>
      {items.length === 0 ? (
        <div className="empty-state">
          <svg className="h-10 w-10 mx-auto text-gray-400 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">No recent patients yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Connect to a patient to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(it => (
            <button
              key={it.id}
              onClick={() => onSelect && onSelect(it.patientId)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-700 transition-all text-left"
            >
              <div className="h-10 w-10 rounded-full bg-blue-600 text-white grid place-items-center text-sm font-semibold flex-shrink-0">
                {(it.patientName || it.patientId || 'P').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {it.patientName || `Patient ${it.patientId?.slice(0, 8)}`}
                </p>
                {it.note && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{it.note}</p>
                )}
                {it.lastAccessed && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(it.lastAccessed.toDate()).toLocaleDateString()}
                  </p>
                )}
              </div>
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


