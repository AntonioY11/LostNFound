const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'lostnfound.db');
const bucket = process.env.S3_BUCKET;
const key = process.env.DB_S3_KEY; // full S3 key to restore from

if (!bucket || !key) {
  console.log('S3_BUCKET or DB_S3_KEY not set - skipping DB restore');
  process.exit(0);
}

AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new AWS.S3();

console.log('Restoring DB from s3://'+bucket+'/'+key+' to', dbPath);
s3.getObject({ Bucket: bucket, Key: key }, (err, data) => {
  if (err) { console.error('Failed to fetch DB from S3:', err.message); process.exit(1); }
  try {
    fs.writeFileSync(dbPath, data.Body);
    console.log('DB restored to', dbPath);
  } catch (e) {
    console.error('Failed to write DB file:', e.message);
    process.exit(2);
  }
});
