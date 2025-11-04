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
      <h3>Recent Patients</h3>
      <ul>
        {items.map(it => (
          <li key={it.id}>
            <button onClick={() => onSelect && onSelect(it.patientId)}>
              {it.patientId} {it.note ? `- ${it.note}` : ''}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}


