const { execSync } = require('child_process');

function freePort(port) {
    try {
        if (process.platform === 'win32') {
            const output = execSync(`netstat -ano | findstr :${port}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
            const lines = output.trim().split('\n');
            const pids = new Set();
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 5 && (parts[1].endsWith(`:${port}`) || parts[1].includes(`:${port}`))) {
                    const pid = parts[parts.length - 1];
                    if (pid && pid !== '0' && pid !== process.pid.toString()) {
                        pids.add(pid);
                    }
                }
            }
            for (const pid of pids) {
                try {
                    execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
                    console.log(`[Auto-Clean] Successfully freed busy port ${port} (closed process ${pid})`);
                } catch (e) { }
            }
        }
    } catch (e) {
        // Port was already free, nothing to kill
    }
}

freePort(5000);
freePort(5173);
