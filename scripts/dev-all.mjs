import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const isWin = process.platform === 'win32';

function findPython() {
  const venvCandidates = [
    path.join(backendDir, 'venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
    path.join(backendDir, '.venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
    path.join(rootDir, 'venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
    path.join(rootDir, '.venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
  ];

  for (const candidate of venvCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return isWin ? 'python' : 'python3';
}

function streamWithPrefix(stream, prefix, colorCode) {
  if (!stream) return;
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.trim().length > 0) {
        console.log(`\x1b[${colorCode}m${prefix}\x1b[0m ${line}`);
      }
    }
  });
  stream.on('end', () => {
    if (buffer.trim().length > 0) {
      console.log(`\x1b[${colorCode}m${prefix}\x1b[0m ${buffer}`);
    }
  });
}

const pythonBin = findPython();
console.log(`\x1b[36m[dev-all]\x1b[0m Using Python: ${pythonBin}`);

let isShuttingDown = false;
let apiProc = null;
let webProc = null;

function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\n\x1b[33m[dev-all]\x1b[0m Shutting down all processes cleanly...');

  if (apiProc && !apiProc.killed) {
    if (isWin) {
      try { spawn('taskkill', ['/pid', apiProc.pid.toString(), '/f', '/t']); } catch {}
    } else {
      apiProc.kill('SIGTERM');
    }
  }

  if (webProc && !webProc.killed) {
    if (isWin) {
      try { spawn('taskkill', ['/pid', webProc.pid.toString(), '/f', '/t']); } catch {}
    } else {
      webProc.kill('SIGTERM');
    }
  }

  setTimeout(() => process.exit(0), 400);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// 1. Start FastAPI backend
try {
  apiProc = spawn(pythonBin, ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'], {
    cwd: backendDir,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false,
  });

  streamWithPrefix(apiProc.stdout, '[api]', '34'); // Blue
  streamWithPrefix(apiProc.stderr, '[api]', '34');

  apiProc.on('error', (err) => {
    console.error('\x1b[31m[api] Failed to start Python backend:\x1b[0m', err.message);
    console.error('\x1b[33m[api] Please ensure Python and uvicorn are installed:\x1b[0m');
    console.error('      pip install -r backend/requirements.txt\n');
  });

  apiProc.on('exit', (code) => {
    if (code !== 0 && !isShuttingDown) {
      console.error(`\x1b[31m[api] Backend exited with code ${code}.\x1b[0m`);
      console.error('\x1b[33m[api] To install missing dependencies, run:\x1b[0m pip install -r backend/requirements.txt\n');
    }
  });
} catch (err) {
  console.error('\x1b[31m[api] Error creating backend process:\x1b[0m', err.message);
}

// 2. Start Vite dev server
const npmCmd = isWin ? 'npm.cmd' : 'npm';
try {
  webProc = spawn(npmCmd, ['run', 'dev'], {
    cwd: rootDir,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: isWin,
  });

  streamWithPrefix(webProc.stdout, '[web]', '32'); // Green
  streamWithPrefix(webProc.stderr, '[web]', '33'); // Yellow for vite notices

  webProc.on('error', (err) => {
    console.error('\x1b[31m[web] Failed to start Vite dev server:\x1b[0m', err.message);
  });
} catch (err) {
  console.error('\x1b[31m[web] Error creating web process:\x1b[0m', err.message);
}
