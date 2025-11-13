// quick Firestore connectivity test using the same local serviceAccount file
const admin = require('firebase-admin');
const path = require('path');

(async function run(){
  try{
    const configPath = path.join(__dirname, '..', 'backend', 'config', 'serviceAccountKey.json');
    console.log('Using service account file:', configPath);
    const serviceAccount = require(configPath);
    if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    const db = admin.firestore();
    console.log('Attempting write to /diag/testDoc');
    const ref = db.collection('diag').doc('testDoc');
    await ref.set({ ts: Date.now(), ok: true });
    console.log('Write succeeded. Now reading back...');
    const snap = await ref.get();
    console.log('Read succeeded. Data:', snap.data());
    process.exit(0);
  }catch(err){
    console.error('Firestore test failed:');
    console.error(err && err.message);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
})();
