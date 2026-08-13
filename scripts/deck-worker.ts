import { parentPort, workerData } from 'node:worker_threads';
import { generateAnkiDeck } from './generate-anki.js';

interface WorkerPayload {
  files: string[];
  baseName: string;
  outputDir: string;
}

async function run() {
  try {
    const { files, baseName, outputDir } = workerData as WorkerPayload;
    const result = await generateAnkiDeck(files, baseName, outputDir);
    parentPort?.postMessage({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    parentPort?.postMessage({ success: false, error: message });
  }
}

run();
