const http = require('http');

function testDemoLogin() {
  console.log('Testing demo login...');
  
  const data = JSON.stringify({
    email: 'testdemo@example.com'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/demo-login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      console.log('Response Status:', res.statusCode);
      console.log('Response Body:', body);
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.write(data);
  req.end();
}

testDemoLogin();
