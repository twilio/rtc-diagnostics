const fs = require('fs');
const path = require('path');

const credsPath = path.join(__dirname, '../credentials.json');
const creds = fs.existsSync(credsPath)
  ? JSON.parse(fs.readFileSync(credsPath))
  : { };

if (!process.env.ACCOUNTSID) {
  process.env.ACCOUNTSID = creds.accountSid;
}

if (!process.env.AUTHTOKEN) {
  process.env.AUTHTOKEN = creds.authToken;
}
