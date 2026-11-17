const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const LOG_FILE = path.join(DATA_DIR, 'autosync.log');
const LOCK_FILE = path.join(DATA_DIR, 'autosync.lock');

const PROTECTED_NO_DOWNGRADE_FILES = [
  'src/lib/sqlite-db.ts',
  'next.config.js',
  'src/components/WifiAccessModal.tsx',
  'src/pages/api/network-info.ts',
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function log(msg) {
  ensureDataDir();
  const stamp = new Date().toLocaleString('id-ID', { hour12: false });
  const line = `[${stamp}] ${msg}`;
  console.log(line);
  try {
    // Keep log file compact (< 256 KB)
    if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > 262144) {
      const old = fs.readFileSync(LOG_FILE, 'utf8').slice(-65536);
      fs.writeFileSync(LOG_FILE, old + '\n', 'utf8');
    }
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch {}
}

function runGit(cmd, timeoutMs = 15000) {
  return execSync(`git ${cmd}`, {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: timeoutMs,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function isPidAlive(pid) {
  if (!pid || Number.isNaN(Number(pid))) return false;
  try {
    process.kill(Number(pid), 0);
    return true;
  } catch {
    return false;
  }
}

function acquireWatchLock() {
  ensureDataDir();
  if (fs.existsSync(LOCK_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      if (data?.pid && data.pid !== process.pid && isPidAlive(data.pid)) {
        return false; // Another watcher is already running
      }
    } catch {}
  }
  fs.writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }), 'utf8');
  const release = () => {
    try {
      if (fs.existsSync(LOCK_FILE)) {
        const cur = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
        if (cur?.pid === process.pid) fs.unlinkSync(LOCK_FILE);
      }
    } catch {}
  };
  process.on('exit', release);
  process.on('SIGINT', () => { release(); process.exit(0); });
  process.on('SIGTERM', () => { release(); process.exit(0); });
  return true;
}

function getPort3001Pids() {
  try {
    const out = execSync('netstat -aon | findstr ":3001 " | findstr "LISTENING"', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const pids = new Set();
    out.split(/\r?\n/).forEach((line) => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== '0') {
        pids.add(pid);
      }
    });
    return Array.from(pids);
  } catch {
    return [];
  }
}

function stopPort3001() {
  const pids = getPort3001Pids();
  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      log(`Menghentikan server lama di port 3001 (PID ${pid})...`);
    } catch {}
  }
}

function httpGetOk(url, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startServerAndWarmup() {
  const nextBin = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
  const serverOut = fs.openSync(path.join(DATA_DIR, 'server-autosync.log'), 'a');
  const child = spawn(process.execPath, [nextBin, 'start', '-p', '3001', '-H', '0.0.0.0'], {
    cwd: ROOT,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', serverOut, serverOut],
  });
  child.unref();
  log(`Menjalankan ulang server SMART PPI pada port 3001 (PID ${child.pid})...`);

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const ok = await httpGetOk('http://127.0.0.1:3001/');
    if (ok) {
      await Promise.allSettled([
        httpGetOk('http://127.0.0.1:3001/login', 3000),
        httpGetOk('http://127.0.0.1:3001/dashboard', 3000),
        httpGetOk('http://127.0.0.1:3001/dashboard/icra', 3000),
        httpGetOk('http://127.0.0.1:3001/dashboard/klb', 3000),
        httpGetOk('http://127.0.0.1:3001/dashboard/reports/supervisi', 3000),
      ]);
      log('Server SMART PPI port 3001 aktif & rute utama siap digunakan.');
      return true;
    }
  }
  log('Peringatan: Server belum merespons dalam 15 detik, cek data/server-autosync.log.');
  return false;
}

function mergePackageJsonSafely(beforePkgRaw, incomingPkgRaw) {
  try {
    const beforePkg = JSON.parse(beforePkgRaw);
    const incomingPkg = JSON.parse(incomingPkgRaw);
    const merged = {
      ...incomingPkg,
      scripts: {
        ...(incomingPkg.scripts || {}),
        dev: 'next dev -p 3001 -H 0.0.0.0',
        start: 'next start -p 3001 -H 0.0.0.0',
      },
      dependencies: {
        ...(incomingPkg.dependencies || {}),
      },
    };
    // Preserve native sqlite3 dependency needed for hospital offline DB
    if (beforePkg?.dependencies?.sqlite3 && !merged.dependencies.sqlite3) {
      merged.dependencies.sqlite3 = beforePkg.dependencies.sqlite3;
    }
    const depsChanged =
      JSON.stringify(beforePkg.dependencies) !== JSON.stringify(merged.dependencies) ||
      JSON.stringify(beforePkg.devDependencies) !== JSON.stringify(merged.devDependencies);
    return { text: JSON.stringify(merged, null, 2) + '\n', depsChanged };
  } catch {
    return { text: beforePkgRaw, depsChanged: false };
  }
}

function isAlreadyAncestor(commitHash) {
  if (!commitHash) return false;
  try {
    execSync(`git merge-base --is-ancestor ${commitHash} HEAD`, {
      cwd: ROOT,
      stdio: 'ignore',
      timeout: 3000,
    });
    return true;
  } catch {
    return false;
  }
}

async function syncOnce({ quietWhenUpToDate = false, quickTimeoutMs = 8000 } = {}) {
  let remoteHash = '';
  let headHash = '';

  try {
    const lsRemote = runGit('ls-remote origin refs/heads/main', quickTimeoutMs);
    remoteHash = lsRemote.split(/\s+/)[0] || '';
    if (!remoteHash) {
      if (!quietWhenUpToDate) log('Tidak mendapat respons hash dari GitHub (mungkin offline).');
      return { updated: false, offline: true };
    }
    headHash = runGit('rev-parse HEAD', 3000);
  } catch (err) {
    if (!quietWhenUpToDate) log('Lewati sinkronisasi GitHub (jaringan offline atau timeout).');
    return { updated: false, offline: true };
  }

  // Already contains remote commit cleanly
  if (remoteHash === headHash || isAlreadyAncestor(remoteHash)) {
    if (!quietWhenUpToDate) log('Aplikasi sudah versi terbaru (sinkron dengan GitHub).');
    return { updated: false };
  }

  log(`Terdeteksi pembaruan baru di GitHub (${remoteHash.slice(0, 7)})! Mengambil kode...`);

  // Snapshot critical local files before merge
  const protectedSnapshots = {};
  for (const rel of PROTECTED_NO_DOWNGRADE_FILES) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) {
      protectedSnapshots[rel] = fs.readFileSync(abs, 'utf8');
    }
  }
  const beforePkgRaw = fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8');

  try {
    runGit('fetch origin main', 20000);
    const behindCount = Number(runGit('rev-list --count HEAD..origin/main', 3000) || '0');
    if (behindCount === 0) {
      if (!quietWhenUpToDate) log('Tidak ada commit baru di origin/main.');
      return { updated: false };
    }

    // Ensure local hospital SQLite DB is never modified or staged by git
    try {
      execSync('git update-index --skip-worktree data/smart_ppi.db', { cwd: ROOT, stdio: 'ignore' });
    } catch {}

    // Attempt clean merge (fast-forward if possible, or merge -X theirs)
    try {
      execSync('git merge origin/main --no-edit', {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: 25000,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (ffErr) {
      try {
        execSync('git merge origin/main --no-edit -X theirs', {
          cwd: ROOT,
          encoding: 'utf8',
          timeout: 25000,
          env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch (mergeErr) {
        try {
          runGit('merge --abort', 5000);
        } catch {}
        log(`Gagal merge otomatis (periksa konflik lokal): ${mergeErr.message}`);
        return { updated: false, error: mergeErr.message };
      }
    }

    // Safety guard: Protect real SQLite DB layer, standalone config, and port 3001
    let needsProtectionCommit = false;
    const sqlitePath = path.join(ROOT, 'src/lib/sqlite-db.ts');
    if (fs.existsSync(sqlitePath) && protectedSnapshots['src/lib/sqlite-db.ts']) {
      const mergedSqlite = fs.readFileSync(sqlitePath, 'utf8');
      if (mergedSqlite.includes('MOCKED') || !mergedSqlite.includes("from 'sqlite3'")) {
        fs.writeFileSync(sqlitePath, protectedSnapshots['src/lib/sqlite-db.ts'], 'utf8');
        log('[Proteksi] Mencegah AI Studio mengganti SQLite lokal dengan mock in-memory.');
        needsProtectionCommit = true;
      }
    }

    const nextCfgPath = path.join(ROOT, 'next.config.js');
    if (fs.existsSync(nextCfgPath) && protectedSnapshots['next.config.js']) {
      const mergedNextCfg = fs.readFileSync(nextCfgPath, 'utf8');
      if (mergedNextCfg.includes("output: 'standalone'") || mergedNextCfg.includes('output: "standalone"')) {
        fs.writeFileSync(nextCfgPath, protectedSnapshots['next.config.js'], 'utf8');
        log('[Proteksi] Menjaga next.config.js agar kompatibel dengan server produksi port 3001.');
        needsProtectionCommit = true;
      }
    }

    for (const portFile of ['src/components/WifiAccessModal.tsx', 'src/pages/api/network-info.ts']) {
      const abs = path.join(ROOT, portFile);
      if (fs.existsSync(abs) && protectedSnapshots[portFile]) {
        const content = fs.readFileSync(abs, 'utf8');
        if (content.includes("'3000'") && !content.includes("'3001'")) {
          fs.writeFileSync(abs, content.replace(/'3000'/g, "'3001'"), 'utf8');
          log(`[Proteksi] Mengembalikan port default 3001 pada ${portFile}.`);
          needsProtectionCommit = true;
        }
      }
    }

    const incomingPkgRaw = fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8');
    const pkgMerged = mergePackageJsonSafely(beforePkgRaw, incomingPkgRaw);
    if (pkgMerged.text !== incomingPkgRaw) {
      fs.writeFileSync(path.join(ROOT, 'package.json'), pkgMerged.text, 'utf8');
      needsProtectionCommit = true;
    }

    if (needsProtectionCommit) {
      try {
        execSync('git add -u', { cwd: ROOT, stdio: 'ignore' });
        execSync('git commit -m "chore(sync): proteksi konfigurasi lokal RSUD Al-Mulk pasca sinkronisasi"', {
          cwd: ROOT,
          stdio: 'ignore',
        });
      } catch {}
    }

    if (pkgMerged.depsChanged) {
      log('Menginstal dependensi baru dari package.json...');
      execSync('npm install --no-audit --no-fund', { cwd: ROOT, stdio: 'inherit' });
    }

    const wasRunning = getPort3001Pids().length > 0;
    if (wasRunning) {
      stopPort3001();
    }

    log('Menyusun ulang build produksi Next.js terbaru...');
    execSync(`"${process.execPath}" "${path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next')}" build`, {
      cwd: ROOT,
      stdio: 'inherit',
    });
    log('Build produksi selesai tanpa error!');

    if (wasRunning || process.argv.includes('--ensure-server')) {
      await startServerAndWarmup();
    }

    return { updated: true };
  } catch (err) {
    log(`Terjadi kesalahan saat sinkronisasi GitHub: ${err.message}`);
    try {
      runGit('merge --abort', 5000);
    } catch {}
    return { updated: false, error: err.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isStartup = args.includes('--startup');
  const isWatch = args.includes('--watch');

  if (isWatch) {
    if (!acquireWatchLock()) {
      console.log('Auto-Sync GitHub Watcher sudah berjalan di latar belakang.');
      process.exit(0);
    }
    log('Auto-Sync GitHub aktif (memeriksa pembaruan GitHub setiap 45 detik)...');
    await syncOnce({ quietWhenUpToDate: true, quickTimeoutMs: 4000 });

    setInterval(async () => {
      await syncOnce({ quietWhenUpToDate: true, quickTimeoutMs: 4000 });
    }, 45000);
    return;
  }

  await syncOnce({
    quietWhenUpToDate: isStartup,
    quickTimeoutMs: isStartup ? 3000 : 10000,
  });
}

main();
