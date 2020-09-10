const fs = require('fs');
const creds = fs.existsSync('../credentials.json')
  ? JSON.parse(fs.readFileSync('../credentials.json'))
  : { };

if (!process.env.ACCOUNTSID) {
  process.env.ACCOUNTSID = creds.ACCOUNTSID;
}

if (!process.env.AUTHTOKEN) {
  process.env.AUTHTOKEN = creds.AUTHTOKEN;
}
