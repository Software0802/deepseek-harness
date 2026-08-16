/** ETag catalog transport and verified snapshot projection owned by Desktop. */
import { decodeCatalogSnapshot, } from '@deepseek-ai/dsh-plugin-center-contracts';
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
/** Construct a bounded HTTPS ETag transport for the fixed operator endpoint. */
export function createCatalogTransport(url, fetcher = fetch) {
    if (url.protocol !== 'https:')
        throw new Error('plugin catalog endpoint must use HTTPS');
    return async (etag) => {
        const controller = new AbortController();
        const timer = setTimeout(() => { controller.abort(); }, 5_000);
        try {
            const response = await fetcher(url, {
                headers: etag === undefined ? {} : { 'if-none-match': etag },
                redirect: 'error',
                signal: controller.signal,
            });
            if (response.status === 304)
                return { status: 304 };
            if (response.status !== 200)
                throw new Error(`plugin catalog returned HTTP ${String(response.status)}`);
            const declared = Number(response.headers.get('content-length'));
            if (Number.isFinite(declared) && declared > MAX_RESPONSE_BYTES)
                throw new Error('plugin catalog response exceeds 2 MiB');
            const text = await response.text();
            if (Buffer.byteLength(text, 'utf8') > MAX_RESPONSE_BYTES)
                throw new Error('plugin catalog response exceeds 2 MiB');
            const responseEtag = response.headers.get('etag');
            if (responseEtag === null || responseEtag.length === 0)
                throw new Error('plugin catalog response has no ETag');
            return { status: 200, etag: responseEtag, body: JSON.parse(text) };
        }
        finally {
            clearTimeout(timer);
        }
    };
}
function ageFreshness(snapshot, now) {
    return now - Date.parse(snapshot.generatedAt) <= snapshot.maxAgeSeconds * 1000 ? 'cached' : 'stale';
}
function searchMatches(entry, query) {
    if (query.length === 0)
        return true;
    const needle = query.toLocaleLowerCase();
    return [entry.displayName, entry.summary, entry.publisher, ...entry.keywords]
        .some(value => value.toLocaleLowerCase().includes(needle));
}
/** Verified cache plus one serialized ETag revalidation. */
export class CatalogRepository {
    cache;
    bundled;
    transport;
    now;
    state;
    loading;
    refreshing;
    constructor(cache, bundled, transport, now = Date.now) {
        this.cache = cache;
        this.bundled = bundled;
        this.transport = transport;
        this.now = now;
    }
    load() {
        this.loading ??= this.cache.read().then((cached) => {
            const snapshot = cached ?? this.bundled;
            const state = {
                snapshot,
                source: cached === undefined ? 'bundled' : 'cache',
                freshness: ageFreshness(snapshot, this.now()),
            };
            this.state = state;
            return state;
        });
        return this.loading;
    }
    revalidate() {
        this.refreshing ??= this.current().then(async (current) => {
            try {
                const response = await this.transport(current.snapshot.etag);
                if (response.status === 304) {
                    const next = { ...current, freshness: 'fresh' };
                    this.state = next;
                    return next;
                }
                const decoded = decodeCatalogSnapshot(response.body);
                if (decoded.etag !== response.etag)
                    throw new Error('plugin catalog body and HTTP ETag differ');
                await this.cache.save(decoded);
                const next = { snapshot: decoded, source: 'network', freshness: 'fresh' };
                this.state = next;
                return next;
            }
            catch {
                const next = { ...current, freshness: 'stale' };
                this.state = next;
                return next;
            }
        }).finally(() => { this.refreshing = undefined; });
        return this.refreshing;
    }
    /** Revalidate once and project the requested list from the resulting state. */
    async refresh(query) {
        await this.revalidate();
        return await this.list(query);
    }
    async current() {
        return this.state ?? this.load();
    }
    /** Project a bounded query without changing catalog or installed authority. */
    async list(query) {
        const state = await this.current();
        const entries = state.snapshot.entries.filter(entry => entry.catalogKind === query.catalogKind
            && entry.scope === query.scope
            && searchMatches(entry, query.query.trim()));
        const byId = new Map(entries.map(entry => [entry.pluginId, entry]));
        const project = (section) => {
            const ordered = query.scope === 'local'
                ? entries
                : state.snapshot.sections[section].flatMap((pluginId) => {
                    const entry = byId.get(pluginId);
                    return entry === undefined ? [] : [entry];
                });
            return ordered.slice(0, query.limit);
        };
        return {
            etag: state.snapshot.etag,
            generatedAt: state.snapshot.generatedAt,
            freshness: state.freshness,
            source: state.source,
            sections: {
                featured: project('featured'),
                popular: query.scope === 'local' ? [] : project('popular'),
                recent: query.scope === 'local' ? [] : project('recent'),
            },
        };
    }
    /** Resolve one exact detail from the same immutable snapshot. */
    async detail(query) {
        const state = await this.current();
        const detail = state.snapshot.details.find(item => item.summary.pluginId === query.pluginId && item.summary.version === query.version) ?? null;
        return {
            etag: state.snapshot.etag,
            generatedAt: state.snapshot.generatedAt,
            freshness: state.freshness,
            source: state.source,
            detail,
        };
    }
    /** Resolve renderer intent back to catalog-owned metadata without exposing package authority. */
    async resolvePreflight(request) {
        const state = await this.current();
        return {
            candidate: state.snapshot.preflights.find(item => item.pluginId === request.pluginId && item.version === request.version) ?? null,
            candidates: state.snapshot.preflights,
            etag: state.snapshot.etag,
            freshness: state.freshness,
        };
    }
    /** Read verified catalog enrichment without exposing the raw snapshot to the renderer. */
    async installedAuthority() {
        const state = await this.current();
        return {
            etag: state.snapshot.etag,
            freshness: state.freshness,
            entries: state.snapshot.entries,
            details: state.snapshot.details,
            preflights: state.snapshot.preflights,
        };
    }
}
//# sourceMappingURL=catalog-client.js.map