import { spawn } from 'child_process';

const args = ['exec', 'Crie um "app" novo', '--sandbox', 'workspace-write'];
const escapedArgs = args.map(arg => {
  if (typeof arg === 'string' && (arg.includes(' ') || arg.includes('\n'))) {
    return `"${arg.replace(/"/g, '\\"')}"`;
  }
  return arg;
});

const cmdString = `node -e "console.log(process.argv)" ${escapedArgs.join(' ')}`;

const proc = spawn(cmdString, [], {
  shell: true,
});

proc.stdout.on('data', (d) => console.log('OUT:', d.toString()));
proc.stderr.on('data', (d) => console.log('ERR:', d.toString()));
