const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'lostnfound.db');
const bucket = process.env.S3_BUCKET;
if (!bucket) {
  console.error('S3_BUCKET not set - skipping DB backup');
  process.exit(1);
}

AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new AWS.S3();

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const prefix = (process.env.S3_BACKUP_PREFIX || '').replace(/\/$/, '');
const key = (prefix ? prefix + '/' : '') + `backups/lostnfound_${timestamp}.db`;

console.log('Backing up DB', dbPath, 'to s3://'+bucket+'/'+key);
fs.readFile(dbPath, (err, data) => {
  if (err) { console.error('Failed to read DB file:', err.message); process.exit(2); }
  s3.upload({ Bucket: bucket, Key: key, Body: data }, (err2, res) => {
    if (err2) { console.error('S3 upload failed:', err2.message); process.exit(3); }
    console.log('Backup uploaded:', res.Location);
  });
});
