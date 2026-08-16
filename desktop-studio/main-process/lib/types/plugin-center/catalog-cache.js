/** Owner-only atomic persistence for the last fully decoded catalog snapshot. */
import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { CatalogContractError, decodeCatalogSnapshot } from '@deepseek-ai/dsh-plugin-center-contracts';
/** One verified cache document under Electron's private userData directory. */
export class CatalogCache {
    file;
    /** @param userDataDirectory - Electron app.getPath('userData'). */
    constructor(userDataDirectory) {
        this.file = join(userDataDirectory, 'plugin-center', 'catalog-v1.json');
    }
    /** Read a complete verified snapshot; corrupt or absent cache has no authority. */
    async read() {
        let source;
        try {
            source = await readFile(this.file, 'utf8');
        }
        catch (error) {
            if (error.code === 'ENOENT')
                return undefined;
            throw error;
        }
        try {
            return decodeCatalogSnapshot(JSON.parse(source));
        }
        catch (error) {
            if (error instanceof SyntaxError || error instanceof CatalogContractError)
                return undefined;
            throw error;
        }
    }
    /** Publish one already decoded snapshot through same-directory atomic rename. */
    async save(snapshot) {
        const decoded = decodeCatalogSnapshot(snapshot);
        await mkdir(dirname(this.file), { recursive: true, mode: 0o700 });
        const temporary = `${this.file}.${randomUUID()}.tmp`;
        const handle = await open(temporary, 'wx', 0o600);
        try {
            await handle.writeFile(`${JSON.stringify(decoded)}\n`, 'utf8');
            await handle.sync();
            await handle.close();
            await rename(temporary, this.file);
        }
        catch (error) {
            await handle.close().catch(() => { });
            await rm(temporary, { force: true });
            throw error;
        }
    }
}
//# sourceMappingURL=catalog-cache.js.map