/** Bounded trusted-catalog artifact download into an operation-owned private cache. */
import { mkdir, open } from 'node:fs/promises';
import { join } from 'node:path';
const MAX_ARTIFACT_BYTES = 64 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 30_000;
/** Trusted-catalog download owner; URLs and size bounds never come from the renderer. */
export class PluginArtifactDownloader {
    operationsDirectory;
    fetcher;
    timeoutMs;
    constructor(operationsDirectory, fetcher = fetch, timeoutMs = DEFAULT_TIMEOUT_MS) {
        this.operationsDirectory = operationsDirectory;
        this.fetcher = fetcher;
        this.timeoutMs = timeoutMs;
    }
    async download(candidate, platform, operationId) {
        const evidence = candidate.artifacts.find(value => value.platform === platform);
        if (evidence === undefined)
            throw new Error(`validated artifact is missing for ${platform}`);
        const maximum = Math.min(evidence.packedBytes, MAX_ARTIFACT_BYTES);
        const controller = new AbortController();
        const timeout = setTimeout(() => { controller.abort(); }, this.timeoutMs);
        try {
            const response = await this.fetcher(evidence.url, {
                method: 'GET',
                redirect: 'error',
                signal: controller.signal,
                headers: { accept: 'application/octet-stream' },
            });
            if (!response.ok)
                throw new Error(`plugin artifact returned HTTP ${String(response.status)}`);
            const declared = Number(response.headers.get('content-length'));
            if (Number.isFinite(declared) && declared > maximum) {
                throw new Error('plugin artifact exceeds its validated packed size');
            }
            if (response.body === null)
                throw new Error('plugin artifact response has no body');
            const chunks = [];
            let length = 0;
            const reader = response.body.getReader();
            try {
                for (;;) {
                    const next = await reader.read();
                    if (next.done)
                        break;
                    length += next.value.byteLength;
                    if (length > maximum) {
                        await reader.cancel('validated packed size exceeded');
                        throw new Error('plugin artifact exceeds its validated packed size');
                    }
                    chunks.push(next.value);
                }
            }
            finally {
                reader.releaseLock();
            }
            const bytes = new Uint8Array(length);
            let offset = 0;
            for (const chunk of chunks) {
                bytes.set(chunk, offset);
                offset += chunk.byteLength;
            }
            const directory = join(this.operationsDirectory, operationId);
            const path = join(directory, 'artifact.tgz');
            await mkdir(directory, { recursive: true, mode: 0o700 });
            const handle = await open(path, 'wx', 0o600);
            try {
                await handle.writeFile(bytes);
            }
            finally {
                await handle.close();
            }
            return { bytes, path, evidence };
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
//# sourceMappingURL=artifact-downloader.js.map