const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

async function runVerification() {
  console.log('========================================================================');
  console.log('              1. CHECK WORKING HOURS (07:30 - 16:00 WIB)               ');
  console.log('========================================================================');

  let outsideHh = 0;
  let invalidDurationHh = 0;
  let minHhWib = 24;
  let maxHhWib = 0;

  await new Promise(resolve => {
    db.all("SELECT id, start_time, end_time FROM audit_hand_hygiene WHERE start_time >= '2026-01-01' AND start_time < '2026-11-01'", (err, rows) => {
      console.log(`Checking ${rows.length} Hand Hygiene records (Jan - Oct 2026)...`);
      rows.forEach(r => {
        const s = new Date(r.start_time);
        const e = new Date(r.end_time);
        const sWibH = (s.getUTCHours() + 7) % 24;
        const sWibM = s.getUTCMinutes();
        const eWibH = (e.getUTCHours() + 7) % 24;
        const eWibM = e.getUTCMinutes();

        const sDec = sWibH + sWibM / 60;
        const eDec = eWibH + eWibM / 60;

        if (sDec < minHhWib) minHhWib = sDec;
        if (eDec > maxHhWib) maxHhWib = eDec;

        if (sDec < 7.5 || eDec > 16.05) {
          outsideHh++;
          console.log(`  [OUTSIDE] HH ${r.id}: Start ${sWibH}:${sWibM} -> End ${eWibH}:${eWibM}`);
        }

        const durMin = Math.round((e - s) / 60000);
        if (durMin < 15 || durMin > 21) {
          invalidDurationHh++;
        }
      });
      resolve();
    });
  });

  const minHStr = `${Math.floor(minHhWib)}:${String(Math.round((minHhWib % 1)*60)).padStart(2,'0')}`;
  const maxHStr = `${Math.floor(maxHhWib)}:${String(Math.round((maxHhWib % 1)*60)).padStart(2,'0')}`;
  console.log(`HH Earliest WIB: ${minHStr} | Latest WIB: ${maxHStr}`);
  console.log(`HH records outside 07:30 - 16:00: ${outsideHh}`);
  console.log(`HH records with duration outside 15-20 min: ${invalidDurationHh}`);

  let outsideApd = 0;
  let minApdWib = 24;
  let maxApdWib = 0;

  await new Promise(resolve => {
    db.all("SELECT id, tanggal_waktu FROM audit_apd WHERE tanggal_waktu >= '2026-01-01' AND tanggal_waktu < '2026-11-01'", (err, rows) => {
      console.log(`\nChecking ${rows.length} APD records (Jan - Oct 2026)...`);
      rows.forEach(r => {
        const d = new Date(r.tanggal_waktu);
        const wibH = (d.getUTCHours() + 7) % 24;
        const wibM = d.getUTCMinutes();
        const wibDec = wibH + wibM / 60;

        if (wibDec < minApdWib) minApdWib = wibDec;
        if (wibDec > maxApdWib) maxApdWib = wibDec;

        if (wibDec < 7.5 || wibDec > 16.05) {
          outsideApd++;
          console.log(`  [OUTSIDE] APD ${r.id}: ${wibH}:${wibM}`);
        }
      });
      resolve();
    });
  });

  const minApdStr = `${Math.floor(minApdWib)}:${String(Math.round((minApdWib % 1)*60)).padStart(2,'0')}`;
  const maxApdStr = `${Math.floor(maxApdWib)}:${String(Math.round((maxApdWib % 1)*60)).padStart(2,'0')}`;
  console.log(`APD Earliest WIB: ${minApdStr} | Latest WIB: ${maxApdStr}`);
  console.log(`APD records outside 07:30 - 16:00: ${outsideApd}`);

  console.log('\n========================================================================');
  console.log('              2. CHECK "BELUM DIISI" IN APD SIMULATION                  ');
  console.log('========================================================================');

  // Exactly replicate ApdReport logic
  await new Promise(resolve => {
    db.all("SELECT * FROM audit_hand_hygiene WHERE start_time >= '2026-10-01' AND start_time < '2026-11-01'", (err, rawHH) => {
      db.all("SELECT * FROM audit_sessions WHERE tanggal_waktu >= '2026-10-01' AND tanggal_waktu < '2026-11-01' AND indikator_id IN ('audit_hand_hygiene', 'hand_hygiene')", (err, rawHhSessions) => {
        db.all("SELECT * FROM audit_apd WHERE tanggal_waktu >= '2026-10-01' AND tanggal_waktu < '2026-11-01'", (err, rawApd) => {
          db.all("SELECT * FROM audit_sessions WHERE tanggal_waktu >= '2026-10-01' AND tanggal_waktu < '2026-11-01' AND indikator_id IN ('audit_apd', 'apd')", (err, rawApdSessions) => {
            const rawHHById = new Map();
            for (const h of rawHH) {
              if (h.id) rawHHById.set(h.id, h);
            }

            const usedHhIds = new Set();
            const seenHhIds = new Set();
            const hhObservations = [];

            for (const s of rawHhSessions) {
              if (!s.id || seenHhIds.has(s.id)) continue;
              let match = null;
              if (rawHHById.has(s.id) && !usedHhIds.has(s.id)) {
                match = rawHHById.get(s.id);
                usedHhIds.add(s.id);
              }
              const rawSJson = s.data_indikator || s.checklist_json || {};
              const sJson = typeof rawSJson === 'string' ? JSON.parse(rawSJson) : rawSJson;
              const startTime = sJson.waktu_mulai || match?.start_time || s.tanggal_waktu;
              const endTime = sJson.waktu_selesai || match?.end_time || s.end_time;
              seenHhIds.add(s.id);
              if (match?.id) {
                seenHhIds.add(match.id);
                usedHhIds.add(match.id);
              }
              hhObservations.push({
                id: s.id,
                observer: s.observer || match?.observer || '',
                unit: s.unit || match?.unit || '',
                profesi: s.profesi || match?.profesi || 'LAINNYA',
                start_time: startTime,
                end_time: endTime,
                tanggal_waktu: endTime || startTime,
                jenis_tindakan: s.jenis_tindakan || sJson.tindakan || '',
                rawSJson: sJson,
              });
            }

            for (const h of rawHH) {
              if (!h.id || usedHhIds.has(h.id) || seenHhIds.has(h.id)) continue;
              seenHhIds.add(h.id);
              usedHhIds.add(h.id);
              const startTime = h.start_time || h.created_at;
              const endTime = h.end_time;
              hhObservations.push({
                id: h.id,
                observer: h.observer || '',
                unit: h.unit || '',
                profesi: h.profesi || 'LAINNYA',
                start_time: startTime,
                end_time: endTime,
                tanggal_waktu: endTime || startTime,
                jenis_tindakan: '',
                rawSJson: {},
              });
            }

            const allApdRecords = [];
            const seenApdIds = new Set();
            for (const item of rawApdSessions) {
              if (!item.id || seenApdIds.has(item.id)) continue;
              seenApdIds.add(item.id);
              allApdRecords.push(item);
            }
            for (const item of rawApd) {
              if (!item.id || seenApdIds.has(item.id)) continue;
              seenApdIds.add(item.id);
              allApdRecords.push(item);
            }

            const usedApdIds = new Set();
            const combined = [];
            let belumDiisiCount = 0;
            let filledCount = 0;

            for (const hh of hhObservations) {
              let apdMatch = allApdRecords.find(a => 
                !usedApdIds.has(a.id) && (
                  a.id === hh.id || 
                  a.id === `apd-${hh.id}` ||
                  a.hh_id === hh.id || 
                  a.data_indikator?.hh_id === hh.id
                )
              );

              if (!apdMatch) {
                const hhTime = hh.tanggal_waktu ? new Date(hh.tanggal_waktu).getTime() : 0;
                apdMatch = allApdRecords.find(a => {
                  if (usedApdIds.has(a.id)) return false;
                  const sameObs = (a.observer || '').trim().toLowerCase() === (hh.observer || '').trim().toLowerCase();
                  const sameUnit = (a.unit || '').trim().toLowerCase() === (hh.unit || '').trim().toLowerCase();
                  const sameProf = (a.profesi || '').trim().toLowerCase() === (hh.profesi || '').trim().toLowerCase();
                  if (!sameObs || !sameUnit || !sameProf) return false;
                  const aTime = a.tanggal_waktu ? new Date(a.tanggal_waktu).getTime() : 0;
                  return Math.abs(aTime - hhTime) < 15 * 60 * 1000;
                });
              }

              if (apdMatch) {
                usedApdIds.add(apdMatch.id);
                filledCount++;
                combined.push({
                  id: hh.id,
                  tindakan: apdMatch.tindakan || apdMatch.jenis_tindakan,
                  isFilled: true
                });
              } else {
                belumDiisiCount++;
                combined.push({
                  id: hh.id,
                  tindakan: '',
                  isFilled: false
                });
              }
            }

            console.log(`October APD simulation result:`);
            console.log(`  - Total observations: ${combined.length}`);
            console.log(`  - Successfully Filled (isFilled: true): ${filledCount}`);
            console.log(`  - Belum Diisi (isFilled: false): ${belumDiisiCount}`);
            resolve();
          });
        });
      });
    });
  });

  console.log('\n========================================================================');
  console.log('              3. MONTHLY METRICS SUMMARY (JAN - OCT 2026)               ');
  console.log('========================================================================');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'];
  for (let m = 1; m <= 10; m++) {
    const mStr = String(m).padStart(2, '0');
    await new Promise(resolve => {
      db.get(`SELECT count(*) as count, sum(patuh) as patuh, sum(peluang) as peluang FROM audit_hand_hygiene WHERE start_time LIKE '2026-${mStr}%'`, (err, hh) => {
        db.get(`SELECT count(*) as count, sum(jumlah_patuh) as patuh, sum(jumlah_dinilai) as dinilai FROM audit_apd WHERE tanggal_waktu LIKE '2026-${mStr}%'`, (err, apd) => {
          const hhPct = hh.peluang > 0 ? ((hh.patuh / hh.peluang) * 100).toFixed(1) : '0';
          const apdPct = apd.dinilai > 0 ? ((apd.patuh / apd.dinilai) * 100).toFixed(1) : '0';
          console.log(`[${monthNames[m-1]}] HH: ${hh.count} sessions, OPP ${hh.peluang}, Patuh ${hh.patuh} (${hhPct}%) | APD: ${apd.count} audits, Dinilai ${apd.dinilai}, Patuh ${apd.patuh} (${apdPct}%)`);
          resolve();
        });
      });
    });
  }

  db.close();
}

runVerification();
