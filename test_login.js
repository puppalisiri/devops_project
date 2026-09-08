const http = require('http');
const querystring = require('querystring');

const postData = querystring.stringify({
  'email': 'admin@telangana.com',
  'password': 'admin123'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  if (res.headers['set-cookie']) {
      const cookie = res.headers['set-cookie'][0].split(';')[0];
      
      const getOptions = {
          hostname: 'localhost',
          port: 3000,
          path: '/admin',
          method: 'GET',
          headers: {
              'Cookie': cookie
          }
      };
      
      const getReq = http.request(getOptions, (getRes) => {
          console.log(`ADMIN STATUS: ${getRes.statusCode}`);
          getRes.setEncoding('utf8');
          getRes.on('data', (chunk) => {
             if (chunk.includes('Dashboard Overview')) {
                 console.log('SUCCESS: Admin page rendered successfully!');
             }
          });
      });
      getReq.end();
  }
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
