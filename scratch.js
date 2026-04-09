const https = require('https');
const options = {
  hostname: 'naveropenapi.apigw.ntruss.com',
  path: '/map-geocode/v2/geocode?query=' + encodeURIComponent('경기 성남시 분당구 대왕판교로 366 (백현동) 1'),
  method: 'GET',
  headers: {
    'X-NCP-APIGW-API-KEY-ID': '881liwxlgv',
    'X-NCP-APIGW-API-KEY': 'YOUR_KEY_HERE' 
  }
};
// actually we don't have the secret key here for naver cloud platform.
// Let's create a proxy script or just look at the map logs. 
