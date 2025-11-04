import React, { useState } from 'react';
import { auth, db } from '../../common/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { Button, Card, Input } from '@shadcn/ui';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('hospital');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), { email, role });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card>
      <h2>Register</h2>
      <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="hospital">Hospital</option>
        <option value="lab">Lab</option>
        <option value="doctor">Doctor</option>
      </select>
      <Button onClick={handleRegister}>Register</Button>
      {error && <div>{error}</div>}
    </Card>
  );
}
