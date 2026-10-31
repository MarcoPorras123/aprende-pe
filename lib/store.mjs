import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

const initial = () => ({ version: 1, profiles: {}, sessions: {} });

export async function createStore(file) {
  await mkdir(dirname(file), { recursive: true });
  let state;
  try {
    state = JSON.parse(await readFile(file, 'utf8'));
    if (state.version !== 1 || !state.profiles || !state.sessions) throw new Error('Formato de datos no compatible');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    state = initial();
  }

  let tail = Promise.resolve();
  return {
    read(fn) { return fn(state); },
    transact(fn) {
      const operation = tail.then(async () => {
        const draft = structuredClone(state);
        const result = fn(draft);
        const temporary = `${file}.${randomUUID()}.tmp`;
        await writeFile(temporary, JSON.stringify(draft, null, 2), { flag: 'wx', mode: 0o600 });
        await rename(temporary, file);
        state = draft;
        return result;
      });
      tail = operation.catch(() => {});
      return operation;
    },
  };
}
