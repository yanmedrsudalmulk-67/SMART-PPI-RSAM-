const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

const USER_46_IDS = [
  'hh-20261003-aisyah-01', '9d14e692-cffc-4cda-a83e-4509b74ad684', 'c239777c-5aeb-4e00-9775-7d39a10637db',
  '82aabb74-82ef-4f11-b970-a6760758f4ef', 'hh-1792912131162-pe6eqw5', 'hh-1792912275502-e7sfwxb',
  'hh-1792912330262-lx98au3', 'hh-1792912369232-v5pjg74', 'hh-1792915658540-cjhunbb',
  'hh-1792915700707-ifntug8', 'hh-1792915745392-wiac5q9', 'hh-1792915800280-ia5ec7z',
  'hh-1792917240916-j6j0e77', 'ef19d2cd-8abe-475a-9b0e-282ab10962ea', '98d6ef8c-3c70-4c9f-abe4-26db7fe75880',
  '9ced809a-cfd2-4da1-b5e5-d741d7a46c3f', '09a693dd-0d36-4408-8d77-10e12b81370c', 'b174a4cc-f96e-4ef3-91d2-7eeb84e97693',
  '8c8e995e-2bea-4663-8907-65d4aa4e5664', 'daf5e02c-2a26-4aae-9824-1df8176d02b8', 'ed58a3a3-5e64-4948-9336-360f0c748659',
  '70fabc59-a2b8-4172-8d79-dea4ab24d247', '69f88b5f-50e2-418e-96c0-0134ad420855', '0c605f2b-a4e5-4a1b-b542-099ec93660d2',
  '4df98755-e7ad-48bb-8128-d202fcf76677', 'c6170a7d-41bd-436d-a5c1-ec536b078016', '21f3aaf0-4725-4df0-b8c3-299806e95d89',
  '3c38c063-59ad-4d4a-b703-57011ac63942', 'b7b5bcbd-f074-4bb9-8397-50a8d48011f5', '4cc6c936-3a03-455e-9731-2b602020d30c',
  '3ec365dc-af8c-419e-92af-ce7a0a8f4eea', '6a02e413-d2b9-4cbe-99e0-0485f2414d9c', '9d3e9027-a687-4bfc-a832-df116a980432',
  'c4fb5428-c0a0-40ca-8495-4496f6c7bee3', 'd685cec8-2af7-4aa0-8e07-ee433284b6e9', '20bdd445-4faf-4933-a511-8d229f1e2aaa',
  'c6af9815-b96a-4e38-a594-d5cbfe3cd27a', '9d9dd8bb-dc77-4a27-af5e-ebe1d70a14ee', 'd8690cbf-9b33-4933-b482-92235d0e4c1b',
  '0f93a06a-cd9f-48e3-bd2a-af73a6a1a574', 'f4860009-31a1-4770-9eba-bba755714262', '7a8b6510-5f40-4dea-9adb-164c195b770b',
  'a057e283-6ac6-4f57-95f7-04f116d74b1f', '4e8a1575-9fcb-4361-9207-20720a4bb9c9', 'b9fd8006-4be2-44ac-980a-f0ff0647031a',
  '44b99e15-78cd-4977-a128-09f77217ce2d'
];

db.all(`SELECT id, unit, profesi, m1, m2, m3, m4, m5, peluang, patuh FROM audit_hand_hygiene WHERE id IN (${USER_46_IDS.map(i => `'${i}'`).join(',')})`, (err, rows) => {
  const summary = {};
  rows.forEach(r => {
    const key = r.profesi + (r.unit === 'Radiologi' ? ' (Radio)' : '');
    if (!summary[key]) summary[key] = { count: 0, peluangCounts: {} };
    summary[key].count++;
    summary[key].peluangCounts[r.peluang] = (summary[key].peluangCounts[r.peluang] || 0) + 1;
  });
  console.log(JSON.stringify(summary, null, 2));
  db.close();
});
