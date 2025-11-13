const http = require('http');

const data = JSON.stringify({
  code: 'TEST1234',
  hospitalId: 'demo-hospital-123',
  requestedScope: ['view', 'upload']
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/exchange-user-code',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Response:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  console.error('Full error:', error);
});

console.log('Sending request to http://localhost:4000/exchange-user-code');
console.log('With body:', data);
req.write(data);
req.end();

