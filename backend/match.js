// Matching script: compares recent lost and found items and creates Matches + Notifications when score > threshold
require('dotenv').config();
const { db, init } = require('./db');
const { v4: uuidv4 } = require('uuid');

const THRESHOLD = parseFloat(process.env.MATCH_THRESHOLD || '80');

function computeScore(lost, found) {
  // simple heuristic scoring
  let score = 0;
  if (lost.category && found.category && lost.category.toLowerCase() === found.category.toLowerCase()) score += 40;
  if (lost.color && found.color && lost.color.toLowerCase() === found.color.toLowerCase()) score += 20;
  if (lost.location && found.location && found.location.toLowerCase().includes(lost.location.toLowerCase())) score += 25;
  // date proximity for +/- 7 days
  try {
    const ld = lost.date_lost ? new Date(lost.date_lost) : null;
    const fd = found.date_found ? new Date(found.date_found) : null;
    if (ld && fd) {
      const diff = Math.abs((ld - fd) / (1000*60*60*24));
      if (diff <= 7) score += 15;
      else if (diff <= 30) score += 5;
    }
  } catch (e) {}
  // If you integrate Rekognition, add a placeholder up to +20
  return Math.min(100, score);
}

function run() {
  init();
  db.serialize(() => {
    db.all(`SELECT * FROM LostItems`, [], (err, losts) => {
      if (err) return console.error(err);
      db.all(`SELECT * FROM FoundItems`, [], (err2, founds) => {
        if (err2) return console.error(err2);
        losts.forEach(lost => {
          founds.forEach(found => {
            // skip if already matched
            db.get(`SELECT * FROM Matches WHERE lost_item_id = ? AND found_item_id = ?`, [lost.id, found.id], (me, row) => {
              if (me) return console.error(me);
              if (row) return; // already tested
              const score = computeScore(lost, found);
              if (score >= THRESHOLD) {
                const id = uuidv4();
                db.run(`INSERT INTO Matches (id, lost_item_id, found_item_id, match_score, notification_sent) VALUES (?, ?, ?, ?, 0)`, [id, lost.id, found.id, score], function (err3) {
                  if (err3) return console.error(err3);
                  // create notifications for both users
                  const msgToLostOwner = `Possible match found for your lost item (${lost.id}) — found item ${found.id} (score ${score})`;
                  const msgToFoundOwner = `Possible match found for your found item (${found.id}) — lost item ${lost.id} (score ${score})`;
                  const n1 = uuidv4();
                  const n2 = uuidv4();
                  db.run(`INSERT INTO Notifications (id, user_id, message) VALUES (?, ?, ?)`, [n1, lost.user_id, msgToLostOwner]);
                  db.run(`INSERT INTO Notifications (id, user_id, message) VALUES (?, ?, ?)`, [n2, found.user_id, msgToFoundOwner]);
                  console.log('Match created', id, 'score', score);
                });
              }
              else {
                // store match row with lower score so we don't re-evaluate forever? optional
                const id = uuidv4();
                db.run(`INSERT INTO Matches (id, lost_item_id, found_item_id, match_score, notification_sent) VALUES (?, ?, ?, ?, 1)`, [id, lost.id, found.id, score]);
              }
            });
          });
        });
      });
    });
  });
}

if (require.main === module) run();

module.exports = { run };
