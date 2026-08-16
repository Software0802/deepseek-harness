//#region lib/types/index.js
/** Strict JSON boundary for the Desktop Plugin Center catalog. */
/** Actions for which one exact compatibility decision may grant authority. */
const COMPATIBILITY_ACTIONS = [
	"install",
	"update",
	"enable",
	"disable",
	"uninstall"
];
/** Desktop targets supported by the first curated marketplace release. */
const SUPPORTED_PLUGIN_PLATFORMS = ["darwin-arm64", "win32-x64"];
/** Stable product order for metadata and action denials. */
const COMPATIBILITY_REASON_ORDER = [
	"catalog-metadata-invalid",
	"catalog-unverified",
	"version-withdrawn",
	"version-ineligible",
	"protected-package",
	"protected-entry",
	"desktop-version-unsupported",
	"dsh-version-unsupported",
	"node-version-unsupported",
	"platform-unsupported",
	"artifact-missing",
	"artifact-evidence-incomplete",
	"plugin-identity-conflict",
	"package-identity-conflict",
	"entry-identity-conflict",
	"declared-conflict",
	"operation-busy",
	"action-not-supported"
];
/** Stable product order for non-executing archive verification failures. */
const ARTIFACT_VERIFICATION_REASON_ORDER = [
	"packed-size-exceeded",
	"packed-size-mismatch",
	"sha256-mismatch",
	"integrity-mismatch",
	"archive-format-invalid",
	"archive-path-traversal",
	"archive-absolute-path",
	"archive-unsafe-link",
	"archive-duplicate-entry",
	"archive-file-count-exceeded",
	"archive-unpacked-size-exceeded",
	"package-manifest-missing",
	"package-manifest-invalid",
	"package-name-mismatch",
	"package-version-mismatch",
	"bundle-patch-mismatch",
	"bundle-patch-missing",
	"lifecycle-script-denied",
	"expected-evidence-missing"
];
/** Origin of one installed Profile package or Bundle. */
const INSTALLED_PLUGIN_SOURCES = [
	"system",
	"catalog",
	"local"
];
/** Joined package/composition/runtime state shown in the installed manager. */
const INSTALLED_PLUGIN_RUNTIME_STATUSES = [
	"running",
	"inactive",
	"failed",
	"unknown"
];
/** Ordered mutation phases before commit or recovery ownership. */
const PLUGIN_MUTATION_PHASES = [
	"preflight",
	"downloading",
	"verifying-artifact",
	"snapshotting",
	"stopping-host",
	"installing",
	"validating-profile",
	"starting-host",
	"reloading",
	"health-checking",
	"verifying-runtime"
];
/** Idempotent recovery phases replayed before ordinary Host startup. */
const PLUGIN_RECOVERY_PHASES = [
	"recovery-stopping-host",
	"recovery-restoring-profile",
	"recovery-restoring-packages",
	"recovery-starting-host",
	"recovery-verifying-runtime"
];
/** Ordered renderer phases of one mutation and any required recovery. */
const PLUGIN_OPERATION_PHASES = [
	...PLUGIN_MUTATION_PHASES,
	...PLUGIN_RECOVERY_PHASES,
	"committed",
	"failed",
	"rolled-back",
	"recovery-failed"
];
/** Closed failure vocabulary exposed to the renderer. */
const PLUGIN_OPERATION_FAILURE_CODES = [
	"preflight-denied",
	"download-failed",
	"artifact-invalid",
	"profile-busy",
	"snapshot-failed",
	"package-mutation-failed",
	"profile-invalid",
	"host-restart-failed",
	"runtime-evidence-missing",
	"internal"
];
/** Stable recovery failure vocabulary retained in logs and diagnostics. */
const PLUGIN_RECOVERY_REASON_CODES = [
	"unsupported-journal-version",
	"journal-invalid",
	"snapshot-missing",
	"snapshot-invalid",
	"snapshot-root-mismatch",
	"snapshot-path-invalid",
	"snapshot-hash-mismatch",
	"profile-lock-busy",
	"host-stop-failed",
	"profile-restore-failed",
	"package-restore-failed",
	"host-start-failed",
	"runtime-verification-failed",
	"diagnostic-export-failed"
];
/** Durable completion states accepted by the transaction journal. */
const PLUGIN_OPERATION_TERMINAL_RESULTS = [
	"committed",
	"rolled-back",
	"recovery-failed"
];
/** Persistence point recorded around one transaction side effect. */
const PLUGIN_OPERATION_BOUNDARIES = [
	"before-side-effect",
	"after-side-effect",
	"observation"
];
/** Installed-item actions accepted by the single Profile operation owner. */
const PLUGIN_MANAGEMENT_ACTIONS = [
	"update",
	"enable",
	"disable",
	"uninstall"
];
/** Review states owned by the production Registry for one exact immutable version. */
const REGISTRY_MODERATION_STATES = [
	"pending-review",
	"approved",
	"rejected",
	"withdrawn"
];
/** Attributable decisions accepted by the internal Registry API. */
const REGISTRY_MODERATION_ACTIONS = [
	"approve",
	"reject",
	"withdraw"
];
/** Closed result values accepted by privacy-limited installation telemetry. */
const REGISTRY_INSTALL_RESULTS = [
	"success",
	"rollback",
	"install-failure",
	"activation-failure"
];
/** Closed reasons retained with privacy-limited installation telemetry. */
const REGISTRY_INSTALL_REASONS = [
	"none",
	"compatibility-denied",
	"artifact-invalid",
	"package-mutation-failed",
	"runtime-evidence-missing",
	"recovery-failed",
	"operator-test",
	"anomaly"
];
/** Closed duration buckets retained without precise local timing. */
const REGISTRY_DURATION_BUCKETS = [
	"lt-5s",
	"5s-30s",
	"30s-2m",
	"2m-10m",
	"gte-10m"
];
/** Stable exclusion facts stored with one auditable popularity row. */
const REGISTRY_RANK_EXCLUSION_REASONS = [
	"ineligible",
	"withdrawn",
	"operator-test-only",
	"anomaly-only"
];
/** Stable successful outcomes returned by authenticated Registry operations. */
const REGISTRY_OPERATION_CODES = [
	"version-imported",
	"version-approved",
	"version-rejected",
	"version-withdrawn",
	"featured-placement-set",
	"ranking-generated"
];
/** Stable failure codes returned without raw dependency details. */
const REGISTRY_ERROR_CODES = [
	"invalid-request",
	"unauthorized",
	"not-found",
	"immutable-conflict",
	"artifact-invalid",
	"moderation-conflict",
	"placement-conflict",
	"dependency-unavailable",
	"internal"
];
const ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u;
const VERSION = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/u;
const PLATFORM = /^(?:darwin|win32)-(?:arm64|x64)$/u;
const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/u;
const SHA256 = /^[0-9a-f]{64}$/u;
const SHA512_INTEGRITY = /^sha512-[A-Za-z0-9+/]{86}==$/u;
const COLOR = /^#[0-9a-fA-F]{6}$/u;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u;
const MEDIA_ORIGINS = new Set([
	"https://avatars.githubusercontent.com",
	"https://cdn.deepseek.com",
	"https://raw.githubusercontent.com",
	"https://static.deepseek.com"
]);
const KINDS = ["plugin", "skill-pack"];
const SCOPES = ["public", "local"];
const CAPABILITIES = [
	"host",
	"client",
	"agent",
	"tool",
	"model-provider",
	"skill",
	"network",
	"filesystem",
	"subprocess"
];
const COMPATIBILITY = [
	"compatible",
	"incompatible",
	"unknown"
];
const FRESHNESS = [
	"fresh",
	"cached",
	"stale"
];
const RISKS = [
	"low",
	"medium",
	"high"
];
const SECTIONS = [
	"featured",
	"popular",
	"recent"
];
const ARTIFACT_ORIGINS = new Set([
	"https://cdn.deepseek.com",
	"https://github.com",
	"https://objects.githubusercontent.com",
	"https://registry.npmjs.org",
	"https://static.deepseek.com"
]);
const OPERATION_PHASES = PLUGIN_OPERATION_PHASES;
const OPERATION_FAILURE_CODES = PLUGIN_OPERATION_FAILURE_CODES;
const RECOVERY_PHASES = PLUGIN_RECOVERY_PHASES;
const RECOVERY_REASON_CODES = PLUGIN_RECOVERY_REASON_CODES;
const OPERATION_TERMINAL_RESULTS = PLUGIN_OPERATION_TERMINAL_RESULTS;
const OPERATION_BOUNDARIES = PLUGIN_OPERATION_BOUNDARIES;
const INSTALLED_SOURCES = INSTALLED_PLUGIN_SOURCES;
const INSTALLED_RUNTIME_STATUSES = INSTALLED_PLUGIN_RUNTIME_STATUSES;
const MANAGEMENT_ACTIONS = PLUGIN_MANAGEMENT_ACTIONS;
const REGISTRY_STATES = REGISTRY_MODERATION_STATES;
const REGISTRY_ACTIONS = REGISTRY_MODERATION_ACTIONS;
const REGISTRY_RESULTS = REGISTRY_INSTALL_RESULTS;
const REGISTRY_REASONS = REGISTRY_INSTALL_REASONS;
const REGISTRY_DURATION = REGISTRY_DURATION_BUCKETS;
const RANK_EXCLUSIONS = REGISTRY_RANK_EXCLUSION_REASONS;
const REGISTRY_OPERATIONS = REGISTRY_OPERATION_CODES;
const REGISTRY_ERRORS = REGISTRY_ERROR_CODES;
const INSTALLATION_ID = /^[0-9a-f]{32,64}$/u;
const OBJECT_KEY_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
/** Error raised when untrusted catalog JSON violates the closed contract. */
var CatalogContractError = class extends Error {
	name = "CatalogContractError";
};
function fail(path, expectation) {
	throw new CatalogContractError(`${path} ${expectation}`);
}
function record(value, path) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return fail(path, "must be an object");
	return value;
}
function exact(value, path, keys) {
	const actual = Object.keys(value).sort();
	const expected = [...keys].sort();
	if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(path, `must contain exactly: ${expected.join(", ")}`);
}
function string(value, path, max, allowEmpty = false) {
	if (typeof value !== "string" || value.length > max || !allowEmpty && value.length === 0 || value.trim() !== value) return fail(path, `must be a trimmed string of at most ${String(max)} characters`);
	return value;
}
function boolean(value, path) {
	if (typeof value !== "boolean") return fail(path, "must be a boolean");
	return value;
}
function integer(value, path, min, max) {
	if (!Number.isInteger(value) || value < min || value > max) return fail(path, `must be an integer from ${String(min)} to ${String(max)}`);
	return value;
}
function finiteNumber(value, path, min, max) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) return fail(path, `must be a finite number from ${String(min)} to ${String(max)}`);
	return value;
}
function enumeration(value, path, values) {
	if (typeof value !== "string" || !values.includes(value)) return fail(path, `must be one of: ${values.join(", ")}`);
	return value;
}
function array(value, path, max, decode) {
	if (!Array.isArray(value) || value.length > max) return fail(path, `must be an array of at most ${String(max)} items`);
	return value.map((item, index) => decode(item, `${path}[${String(index)}]`));
}
function unique(values, path) {
	if (new Set(values).size !== values.length) return fail(path, "must not contain duplicates");
	return values;
}
function id(value, path) {
	const decoded = string(value, path, 128);
	if (!ID.test(decoded)) return fail(path, "must be a stable lowercase id");
	return decoded;
}
function version(value, path) {
	const decoded = string(value, path, 64);
	if (!VERSION.test(decoded)) return fail(path, "must be an exact semantic version");
	return decoded;
}
function sha256(value, path) {
	const decoded = string(value, path, 64);
	if (!SHA256.test(decoded)) return fail(path, "must be a lowercase SHA-256 digest");
	return decoded;
}
function packageIdentity(value, path) {
	const decoded = string(value, path, 214);
	if (!PACKAGE_NAME.test(decoded)) return fail(path, "must be a lowercase npm package name");
	return decoded;
}
function semanticRange(value, path) {
	return string(value, path, 160);
}
function bundlePatchPath(value, path) {
	const decoded = string(value, path, 256);
	if (decoded.startsWith("/") || decoded.startsWith("\\") || /^[A-Za-z]:/u.test(decoded) || decoded.includes("\\")) return fail(path, "must be a portable relative Bundle patch path");
	const normalized = decoded.startsWith("./") ? decoded.slice(2) : decoded;
	if (normalized === "" || normalized.split("/").some((segment) => segment === "" || segment === "." || segment === "..")) return fail(path, "must be a portable relative Bundle patch path");
	return decoded;
}
function ownedDataPath(value, path) {
	const decoded = string(value, path, 256);
	if (decoded.startsWith("/") || decoded.startsWith("\\") || /^[A-Za-z]:/u.test(decoded) || decoded.includes("\\")) return fail(path, "must be a portable relative owned-data path");
	if (decoded.split("/").some((segment) => segment === "" || segment === "." || segment === "..")) return fail(path, "must be a portable relative owned-data path");
	return decoded;
}
function objectKey(value, path) {
	const decoded = string(value, path, 512);
	if (decoded.startsWith("/") || decoded.startsWith(".") || decoded.includes("\\")) return fail(path, "must be a portable relative object key");
	if (decoded.split("/").some((segment) => !OBJECT_KEY_SEGMENT.test(segment))) return fail(path, "must contain only stable object-key segments");
	return decoded;
}
function artifactUrl(value, path) {
	const decoded = string(value, path, 2048);
	let parsed;
	try {
		parsed = new URL(decoded);
	} catch {
		return fail(path, "must be an absolute URL");
	}
	if (parsed.protocol !== "https:" || parsed.username !== "" || parsed.password !== "" || parsed.hash !== "" || !ARTIFACT_ORIGINS.has(parsed.origin)) return fail(path, "must use an approved HTTPS artifact origin");
	return decoded;
}
function nullableString(value, path, max = 256) {
	return value === null ? null : string(value, path, max, true);
}
function instant(value, path) {
	const decoded = string(value, path, 40);
	if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(decoded) || !Number.isFinite(Date.parse(decoded)) || new Date(decoded).toISOString() !== decoded) return fail(path, "must be a canonical RFC 3339 UTC instant");
	return decoded;
}
function media(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"url",
		"alt",
		"width",
		"height"
	]);
	const url = string(source["url"], `${path}.url`, 2048);
	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		return fail(`${path}.url`, "must be an absolute URL");
	}
	if (parsed.protocol !== "https:" || !MEDIA_ORIGINS.has(parsed.origin)) return fail(`${path}.url`, "must use an approved HTTPS media origin");
	return {
		url,
		alt: string(source["alt"], `${path}.alt`, 200, true),
		width: integer(source["width"], `${path}.width`, 1, 4096),
		height: integer(source["height"], `${path}.height`, 1, 4096)
	};
}
function compatibility(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"status",
		"reason",
		"platforms"
	]);
	const reasonValue = source["reason"];
	const reason = reasonValue === null ? null : string(reasonValue, `${path}.reason`, 240);
	const platforms = unique(array(source["platforms"], `${path}.platforms`, 8, (item, itemPath) => {
		const decoded = string(item, itemPath, 32);
		if (!PLATFORM.test(decoded)) return fail(itemPath, "must be a supported platform tuple");
		return decoded;
	}), `${path}.platforms`);
	return {
		status: enumeration(source["status"], `${path}.status`, COMPATIBILITY),
		reason,
		platforms
	};
}
function summary(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"pluginId",
		"version",
		"catalogKind",
		"scope",
		"displayName",
		"summary",
		"publisher",
		"verified",
		"keywords",
		"capabilities",
		"icon",
		"brandColor",
		"compatibility",
		"updatedAt",
		"installed"
	]);
	const catalogKind = enumeration(source["catalogKind"], `${path}.catalogKind`, KINDS);
	const capabilities = unique(array(source["capabilities"], `${path}.capabilities`, CAPABILITIES.length, (item, itemPath) => enumeration(item, itemPath, CAPABILITIES)), `${path}.capabilities`);
	if (catalogKind === "skill-pack" && !capabilities.includes("skill")) fail(`${path}.capabilities`, "must include skill for a skill-pack");
	const brand = source["brandColor"];
	if (brand !== null && (typeof brand !== "string" || !COLOR.test(brand))) fail(`${path}.brandColor`, "must be null or a six-digit hex color");
	return {
		pluginId: id(source["pluginId"], `${path}.pluginId`),
		version: version(source["version"], `${path}.version`),
		catalogKind,
		scope: enumeration(source["scope"], `${path}.scope`, SCOPES),
		displayName: string(source["displayName"], `${path}.displayName`, 120),
		summary: string(source["summary"], `${path}.summary`, 280),
		publisher: string(source["publisher"], `${path}.publisher`, 120),
		verified: boolean(source["verified"], `${path}.verified`),
		keywords: unique(array(source["keywords"], `${path}.keywords`, 24, (item, itemPath) => string(item, itemPath, 48)), `${path}.keywords`),
		capabilities,
		icon: source["icon"] === null ? null : media(source["icon"], `${path}.icon`),
		brandColor: brand,
		compatibility: compatibility(source["compatibility"], `${path}.compatibility`),
		updatedAt: instant(source["updatedAt"], `${path}.updatedAt`),
		installed: boolean(source["installed"], `${path}.installed`)
	};
}
function detail(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"summary",
		"description",
		"screenshots",
		"permissions",
		"riskLevel",
		"riskSummary",
		"changelog",
		"publishedAt",
		"expectedEntries",
		"expectedClientModules",
		"expectedSkillIds",
		"eligible",
		"withdrawn"
	]);
	return {
		summary: summary(source["summary"], `${path}.summary`),
		description: string(source["description"], `${path}.description`, 12e3),
		screenshots: array(source["screenshots"], `${path}.screenshots`, 8, media),
		permissions: unique(array(source["permissions"], `${path}.permissions`, 32, (item, itemPath) => string(item, itemPath, 160)), `${path}.permissions`),
		riskLevel: enumeration(source["riskLevel"], `${path}.riskLevel`, RISKS),
		riskSummary: string(source["riskSummary"], `${path}.riskSummary`, 600),
		changelog: string(source["changelog"], `${path}.changelog`, 4e3),
		publishedAt: instant(source["publishedAt"], `${path}.publishedAt`),
		expectedEntries: unique(array(source["expectedEntries"], `${path}.expectedEntries`, 64, id), `${path}.expectedEntries`),
		expectedClientModules: unique(array(source["expectedClientModules"], `${path}.expectedClientModules`, 64, (item, itemPath) => string(item, itemPath, 214)), `${path}.expectedClientModules`),
		expectedSkillIds: unique(array(source["expectedSkillIds"], `${path}.expectedSkillIds`, 64, id), `${path}.expectedSkillIds`),
		eligible: boolean(source["eligible"], `${path}.eligible`),
		withdrawn: boolean(source["withdrawn"], `${path}.withdrawn`)
	};
}
function artifactEvidence(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"platform",
		"url",
		"sha256",
		"integrity",
		"packedBytes",
		"unpackedBytes",
		"fileCount"
	]);
	const sha256 = string(source["sha256"], `${path}.sha256`, 64);
	if (!SHA256.test(sha256)) fail(`${path}.sha256`, "must be a lowercase SHA-256 digest");
	const integrity = string(source["integrity"], `${path}.integrity`, 96);
	if (!SHA512_INTEGRITY.test(integrity)) fail(`${path}.integrity`, "must be a SHA-512 integrity value");
	return {
		platform: enumeration(source["platform"], `${path}.platform`, SUPPORTED_PLUGIN_PLATFORMS),
		url: artifactUrl(source["url"], `${path}.url`),
		sha256,
		integrity,
		packedBytes: integer(source["packedBytes"], `${path}.packedBytes`, 1, 536870912),
		unpackedBytes: integer(source["unpackedBytes"], `${path}.unpackedBytes`, 1, 2147483647),
		fileCount: integer(source["fileCount"], `${path}.fileCount`, 1, 1e5)
	};
}
function versionConflicts(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"pluginIds",
		"packageNames",
		"entryIds"
	]);
	return {
		pluginIds: unique(array(source["pluginIds"], `${path}.pluginIds`, 128, id), `${path}.pluginIds`),
		packageNames: unique(array(source["packageNames"], `${path}.packageNames`, 128, packageIdentity), `${path}.packageNames`),
		entryIds: unique(array(source["entryIds"], `${path}.entryIds`, 256, id), `${path}.entryIds`)
	};
}
function installedPlugin(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"pluginId",
		"version",
		"packageName",
		"enabled",
		"entryIds"
	]);
	const pluginId = source["pluginId"];
	return {
		pluginId: pluginId === null ? null : id(pluginId, `${path}.pluginId`),
		version: version(source["version"], `${path}.version`),
		packageName: packageIdentity(source["packageName"], `${path}.packageName`),
		enabled: boolean(source["enabled"], `${path}.enabled`),
		entryIds: unique(array(source["entryIds"], `${path}.entryIds`, 256, id), `${path}.entryIds`)
	};
}
function installedOwnedData(value, path) {
	const source = record(value, path);
	exact(source, path, ["path", "label"]);
	return {
		path: ownedDataPath(source["path"], `${path}.path`),
		label: string(source["label"], `${path}.label`, 120)
	};
}
function runtimeEntry(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"entryId",
		"enabled",
		"fiberPhase"
	]);
	return {
		entryId: evidenceIdentity(source["entryId"], `${path}.entryId`),
		enabled: boolean(source["enabled"], `${path}.enabled`),
		fiberPhase: nullableString(source["fiberPhase"], `${path}.fiberPhase`, 80)
	};
}
function installedRuntime(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"entries",
		"clientModules",
		"skillIds"
	]);
	return {
		entries: array(source["entries"], `${path}.entries`, 256, runtimeEntry),
		clientModules: unique(array(source["clientModules"], `${path}.clientModules`, 128, packageIdentity), `${path}.clientModules`),
		skillIds: unique(array(source["skillIds"], `${path}.skillIds`, 128, id), `${path}.skillIds`)
	};
}
function installedUpdate(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"version",
		"changelog",
		"riskLevel",
		"riskSummary"
	]);
	return {
		version: version(source["version"], `${path}.version`),
		changelog: string(source["changelog"], `${path}.changelog`, 4e3),
		riskLevel: enumeration(source["riskLevel"], `${path}.riskLevel`, RISKS),
		riskSummary: string(source["riskSummary"], `${path}.riskSummary`, 600)
	};
}
function installedProjection(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"pluginId",
		"packageName",
		"version",
		"displayName",
		"icon",
		"brandColor",
		"catalogKind",
		"source",
		"protected",
		"enabled",
		"bundleOrder",
		"disabledOrder",
		"runtimeStatus",
		"runtime",
		"expectedEntries",
		"expectedClientModules",
		"expectedSkillIds",
		"compatibility",
		"compatibilityReason",
		"update",
		"pendingAction",
		"supportedActions",
		"configurationEntryIds",
		"ownedData"
	]);
	const pluginId = source["pluginId"] === null ? null : id(source["pluginId"], `${path}.pluginId`);
	const catalogKind = source["catalogKind"] === null ? null : enumeration(source["catalogKind"], `${path}.catalogKind`, KINDS);
	const bundleOrder = source["bundleOrder"] === null ? null : integer(source["bundleOrder"], `${path}.bundleOrder`, 0, 1e4);
	const disabledOrder = source["disabledOrder"] === null ? null : integer(source["disabledOrder"], `${path}.disabledOrder`, 0, 1e4);
	const pendingAction = source["pendingAction"] === null ? null : enumeration(source["pendingAction"], `${path}.pendingAction`, COMPATIBILITY_ACTIONS);
	const brand = source["brandColor"];
	if (brand !== null && (typeof brand !== "string" || !COLOR.test(brand))) fail(`${path}.brandColor`, "must be null or a six-digit hex color");
	const ownedData = array(source["ownedData"], `${path}.ownedData`, 64, installedOwnedData);
	if (new Set(ownedData.map((item) => item.path)).size !== ownedData.length) fail(`${path}.ownedData`, "must not contain duplicate paths");
	const enabled = boolean(source["enabled"], `${path}.enabled`);
	if (enabled && bundleOrder === null || enabled && disabledOrder !== null || !enabled && bundleOrder !== null) fail(path, "must keep active and disabled Bundle membership unambiguous");
	const protectedValue = boolean(source["protected"], `${path}.protected`);
	const sourceValue = enumeration(source["source"], `${path}.source`, INSTALLED_SOURCES);
	const supportedActions = unique(array(source["supportedActions"], `${path}.supportedActions`, MANAGEMENT_ACTIONS.length, (item, itemPath) => enumeration(item, itemPath, MANAGEMENT_ACTIONS)), `${path}.supportedActions`);
	if ((protectedValue || sourceValue !== "catalog") && supportedActions.length !== 0) fail(`${path}.supportedActions`, "must be empty for protected, system, or local items");
	return {
		pluginId,
		packageName: packageIdentity(source["packageName"], `${path}.packageName`),
		version: source["version"] === null ? null : version(source["version"], `${path}.version`),
		displayName: string(source["displayName"], `${path}.displayName`, 120),
		icon: source["icon"] === null ? null : media(source["icon"], `${path}.icon`),
		brandColor: brand,
		catalogKind,
		source: sourceValue,
		protected: protectedValue,
		enabled,
		bundleOrder,
		disabledOrder,
		runtimeStatus: enumeration(source["runtimeStatus"], `${path}.runtimeStatus`, INSTALLED_RUNTIME_STATUSES),
		runtime: installedRuntime(source["runtime"], `${path}.runtime`),
		expectedEntries: unique(array(source["expectedEntries"], `${path}.expectedEntries`, 256, id), `${path}.expectedEntries`),
		expectedClientModules: unique(array(source["expectedClientModules"], `${path}.expectedClientModules`, 128, packageIdentity), `${path}.expectedClientModules`),
		expectedSkillIds: unique(array(source["expectedSkillIds"], `${path}.expectedSkillIds`, 128, id), `${path}.expectedSkillIds`),
		compatibility: enumeration(source["compatibility"], `${path}.compatibility`, COMPATIBILITY),
		compatibilityReason: nullableString(source["compatibilityReason"], `${path}.compatibilityReason`, 240),
		update: source["update"] === null ? null : installedUpdate(source["update"], `${path}.update`),
		pendingAction,
		supportedActions,
		configurationEntryIds: unique(array(source["configurationEntryIds"], `${path}.configurationEntryIds`, 256, id), `${path}.configurationEntryIds`),
		ownedData
	};
}
function compatibilityReason(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"code",
		"subject",
		"actual",
		"expected"
	]);
	return {
		code: enumeration(source["code"], `${path}.code`, COMPATIBILITY_REASON_ORDER),
		subject: string(source["subject"], `${path}.subject`, 256, true),
		actual: nullableString(source["actual"], `${path}.actual`),
		expected: nullableString(source["expected"], `${path}.expected`)
	};
}
function artifactVerificationReason(value, path) {
	const source = record(value, path);
	exact(source, path, ["code", "subject"]);
	return {
		code: enumeration(source["code"], `${path}.code`, ARTIFACT_VERIFICATION_REASON_ORDER),
		subject: string(source["subject"], `${path}.subject`, 256, true)
	};
}
function assertReasonOrder(values, order, path) {
	let previous = -1;
	for (const value of values) {
		const current = order.indexOf(value.code);
		if (current < previous) fail(path, "must follow the stable product reason order");
		previous = current;
	}
}
/**
* Decode and fully validate one registry snapshot before it can replace cache.
* @param value - Untrusted registry payload.
* @returns The closed catalog snapshot.
*/
function decodeCatalogSnapshot(value) {
	const source = record(value, "$");
	exact(source, "$", [
		"schemaVersion",
		"etag",
		"generatedAt",
		"maxAgeSeconds",
		"sections",
		"entries",
		"details",
		"preflights"
	]);
	if (source["schemaVersion"] !== 1) fail("$.schemaVersion", "must equal 1");
	const entries = array(source["entries"], "$.entries", 100, summary);
	const identities = /* @__PURE__ */ new Set();
	for (const entry of entries) {
		const key = `${entry.pluginId}@${entry.version}`;
		if (identities.has(key)) fail("$.entries", `contains duplicate ${key}`);
		identities.add(key);
	}
	const sectionsSource = record(source["sections"], "$.sections");
	exact(sectionsSource, "$.sections", SECTIONS);
	const publicIds = new Set(entries.filter((entry) => entry.scope === "public").map((entry) => entry.pluginId));
	const sections = Object.fromEntries(SECTIONS.map((sectionName) => {
		const values = unique(array(sectionsSource[sectionName], `$.sections.${sectionName}`, 60, id), `$.sections.${sectionName}`);
		if (values.some((pluginId) => !publicIds.has(pluginId))) fail(`$.sections.${sectionName}`, "must reference public catalog entries");
		return [sectionName, values];
	}));
	const details = array(source["details"], "$.details", 100, detail);
	const detailIdentities = /* @__PURE__ */ new Set();
	for (const item of details) {
		const key = `${item.summary.pluginId}@${item.summary.version}`;
		if (!identities.has(key)) fail("$.details", `references unknown ${key}`);
		if (detailIdentities.has(key)) fail("$.details", `contains duplicate ${key}`);
		detailIdentities.add(key);
	}
	const preflights = array(source["preflights"], "$.preflights", 100, decodeCatalogVersionPreflight);
	const preflightIdentities = /* @__PURE__ */ new Set();
	const etag = string(source["etag"], "$.etag", 256);
	for (const item of preflights) {
		const key = `${item.pluginId}@${item.version}`;
		if (!identities.has(key)) fail("$.preflights", `references unknown ${key}`);
		if (preflightIdentities.has(key)) fail("$.preflights", `contains duplicate ${key}`);
		if (item.catalogEtag !== etag) fail("$.preflights", `${key} does not match the snapshot ETag`);
		const owningDetail = details.find((detail) => `${detail.summary.pluginId}@${detail.summary.version}` === key);
		if (owningDetail === void 0) fail("$.preflights", `${key} has no exact detail`);
		if (item.reviewed !== owningDetail.summary.verified || item.eligible !== owningDetail.eligible || item.withdrawn !== owningDetail.withdrawn || item.riskLevel !== owningDetail.riskLevel || item.riskSummary !== owningDetail.riskSummary || JSON.stringify(item.capabilities) !== JSON.stringify(owningDetail.summary.capabilities) || JSON.stringify(item.expectedEntries) !== JSON.stringify(owningDetail.expectedEntries) || JSON.stringify(item.expectedClientModules) !== JSON.stringify(owningDetail.expectedClientModules) || JSON.stringify(item.expectedSkillIds) !== JSON.stringify(owningDetail.expectedSkillIds)) fail("$.preflights", `${key} disagrees with its renderer-safe detail`);
		preflightIdentities.add(key);
	}
	for (const identity of identities) if (!preflightIdentities.has(identity)) fail("$.preflights", `has no exact preflight for ${identity}`);
	return {
		schemaVersion: 1,
		etag,
		generatedAt: instant(source["generatedAt"], "$.generatedAt"),
		maxAgeSeconds: integer(source["maxAgeSeconds"], "$.maxAgeSeconds", 60, 86400),
		sections,
		entries,
		details,
		preflights
	};
}
/**
* Decode one untrusted media reference before using it in a renderer-safe projection.
* @param value - Candidate media metadata from a catalog publisher.
* @returns A bounded HTTPS media reference from an approved origin.
*/
function decodeCatalogMedia(value) {
	return media(value, "$media");
}
/**
* Decode one untrusted catalog summary before it enters a renderer-safe cache.
* @param value - Candidate catalog-card metadata.
* @returns The closed catalog summary.
*/
function decodeCatalogSummary(value) {
	return summary(value, "$summary");
}
/**
* Decode renderer list intent; endpoints and package sources are never accepted.
* @param value - Untrusted renderer value.
* @returns The bounded list query.
*/
function decodeCatalogListQuery(value) {
	const source = record(value, "$query");
	exact(source, "$query", [
		"catalogKind",
		"scope",
		"query",
		"limit"
	]);
	return {
		catalogKind: enumeration(source["catalogKind"], "$query.catalogKind", KINDS),
		scope: enumeration(source["scope"], "$query.scope", SCOPES),
		query: string(source["query"], "$query.query", 120, true),
		limit: integer(source["limit"], "$query.limit", 1, 60)
	};
}
/**
* Decode renderer detail intent; only one exact reviewed identity crosses IPC.
* @param value - Untrusted renderer value.
* @returns The exact-version detail query.
*/
function decodeCatalogDetailQuery(value) {
	const source = record(value, "$query");
	exact(source, "$query", ["pluginId", "version"]);
	return {
		pluginId: id(source["pluginId"], "$query.pluginId"),
		version: version(source["version"], "$query.version")
	};
}
/**
* Decode renderer compatibility intent without accepting package or evidence authority.
* @param value - Untrusted renderer value.
* @returns One exact action request.
*/
function decodeCompatibilityRequest(value) {
	const source = record(value, "$request");
	exact(source, "$request", [
		"pluginId",
		"version",
		"action"
	]);
	return {
		pluginId: id(source["pluginId"], "$request.pluginId"),
		version: version(source["version"], "$request.version"),
		action: enumeration(source["action"], "$request.action", COMPATIBILITY_ACTIONS)
	};
}
/**
* Decode trusted catalog-owned input for one exact compatibility evaluation.
* @param value - Registry value after transport decoding.
* @returns The complete exact-version preflight input.
*/
function decodeCatalogVersionPreflight(value) {
	const source = record(value, "$preflight");
	exact(source, "$preflight", [
		"pluginId",
		"version",
		"packageName",
		"catalogEtag",
		"reviewed",
		"eligible",
		"withdrawn",
		"desktopRange",
		"dshRange",
		"nodeRange",
		"artifacts",
		"bundlePatch",
		"capabilities",
		"riskLevel",
		"riskSummary",
		"executionAuthority",
		"conflicts",
		"expectedEntries",
		"expectedClientModules",
		"expectedSkillIds",
		"supportedActions",
		"restartRequired"
	]);
	const artifacts = array(source["artifacts"], "$preflight.artifacts", SUPPORTED_PLUGIN_PLATFORMS.length, artifactEvidence);
	if (new Set(artifacts.map((artifact) => artifact.platform)).size !== artifacts.length) fail("$preflight.artifacts", "must contain at most one artifact for each platform");
	if (source["executionAuthority"] !== "broad-application-authority") fail("$preflight.executionAuthority", "must disclose broad application authority");
	return {
		pluginId: id(source["pluginId"], "$preflight.pluginId"),
		version: version(source["version"], "$preflight.version"),
		packageName: packageIdentity(source["packageName"], "$preflight.packageName"),
		catalogEtag: string(source["catalogEtag"], "$preflight.catalogEtag", 256),
		reviewed: boolean(source["reviewed"], "$preflight.reviewed"),
		eligible: boolean(source["eligible"], "$preflight.eligible"),
		withdrawn: boolean(source["withdrawn"], "$preflight.withdrawn"),
		desktopRange: semanticRange(source["desktopRange"], "$preflight.desktopRange"),
		dshRange: semanticRange(source["dshRange"], "$preflight.dshRange"),
		nodeRange: semanticRange(source["nodeRange"], "$preflight.nodeRange"),
		artifacts,
		bundlePatch: bundlePatchPath(source["bundlePatch"], "$preflight.bundlePatch"),
		capabilities: unique(array(source["capabilities"], "$preflight.capabilities", CAPABILITIES.length, (item, itemPath) => enumeration(item, itemPath, CAPABILITIES)), "$preflight.capabilities"),
		riskLevel: enumeration(source["riskLevel"], "$preflight.riskLevel", RISKS),
		riskSummary: string(source["riskSummary"], "$preflight.riskSummary", 600),
		executionAuthority: "broad-application-authority",
		conflicts: versionConflicts(source["conflicts"], "$preflight.conflicts"),
		expectedEntries: unique(array(source["expectedEntries"], "$preflight.expectedEntries", 256, id), "$preflight.expectedEntries"),
		expectedClientModules: unique(array(source["expectedClientModules"], "$preflight.expectedClientModules", 128, packageIdentity), "$preflight.expectedClientModules"),
		expectedSkillIds: unique(array(source["expectedSkillIds"], "$preflight.expectedSkillIds", 128, id), "$preflight.expectedSkillIds"),
		supportedActions: unique(array(source["supportedActions"], "$preflight.supportedActions", COMPATIBILITY_ACTIONS.length, (item, itemPath) => enumeration(item, itemPath, COMPATIBILITY_ACTIONS)), "$preflight.supportedActions"),
		restartRequired: boolean(source["restartRequired"], "$preflight.restartRequired")
	};
}
/**
* Decode Desktop-owned environment and selected-Profile facts.
* @param value - Trusted local facts at one profile revision.
* @returns The immutable compatibility fingerprint.
*/
function decodeCompatibilityFingerprint(value) {
	const source = record(value, "$fingerprint");
	exact(source, "$fingerprint", [
		"desktopVersion",
		"dshVersion",
		"nodeVersion",
		"platform",
		"catalogEtag",
		"catalogFreshness",
		"profileRevision",
		"installedPlugins",
		"protectedPackageNames",
		"protectedEntryIds",
		"activeOperation"
	]);
	const installedPlugins = array(source["installedPlugins"], "$fingerprint.installedPlugins", 1e3, installedPlugin);
	const catalogPluginIds = installedPlugins.flatMap((plugin) => plugin.pluginId === null ? [] : [plugin.pluginId]);
	if (new Set(catalogPluginIds).size !== catalogPluginIds.length) fail("$fingerprint.installedPlugins", "must not contain duplicate plugin ids");
	if (new Set(installedPlugins.map((plugin) => plugin.packageName)).size !== installedPlugins.length) fail("$fingerprint.installedPlugins", "must not contain duplicate package names");
	return {
		desktopVersion: version(source["desktopVersion"], "$fingerprint.desktopVersion"),
		dshVersion: version(source["dshVersion"], "$fingerprint.dshVersion"),
		nodeVersion: version(source["nodeVersion"], "$fingerprint.nodeVersion"),
		platform: enumeration(source["platform"], "$fingerprint.platform", SUPPORTED_PLUGIN_PLATFORMS),
		catalogEtag: string(source["catalogEtag"], "$fingerprint.catalogEtag", 256),
		catalogFreshness: enumeration(source["catalogFreshness"], "$fingerprint.catalogFreshness", FRESHNESS),
		profileRevision: integer(source["profileRevision"], "$fingerprint.profileRevision", 0, 2147483647),
		installedPlugins,
		protectedPackageNames: unique(array(source["protectedPackageNames"], "$fingerprint.protectedPackageNames", 1e3, packageIdentity), "$fingerprint.protectedPackageNames"),
		protectedEntryIds: unique(array(source["protectedEntryIds"], "$fingerprint.protectedEntryIds", 2e3, id), "$fingerprint.protectedEntryIds"),
		activeOperation: boolean(source["activeOperation"], "$fingerprint.activeOperation")
	};
}
/**
* Decode a persisted or bridged compatibility decision and enforce reason ordering.
* @param value - Decision-shaped value from the Desktop owning boundary.
* @returns A deterministic exact-action decision.
*/
function decodeCompatibilityDecision(value) {
	const source = record(value, "$decision");
	exact(source, "$decision", [
		"pluginId",
		"version",
		"action",
		"allowed",
		"fingerprint",
		"reasons",
		"restartRequired",
		"capabilities",
		"riskLevel",
		"riskSummary",
		"executionAuthority"
	]);
	const reasons = array(source["reasons"], "$decision.reasons", COMPATIBILITY_REASON_ORDER.length * 4, compatibilityReason);
	assertReasonOrder(reasons, COMPATIBILITY_REASON_ORDER, "$decision.reasons");
	const allowed = boolean(source["allowed"], "$decision.allowed");
	if (allowed !== (reasons.length === 0)) fail("$decision.allowed", "must equal whether the reason list is empty");
	if (source["executionAuthority"] !== "broad-application-authority") fail("$decision.executionAuthority", "must disclose broad application authority");
	return {
		pluginId: id(source["pluginId"], "$decision.pluginId"),
		version: version(source["version"], "$decision.version"),
		action: enumeration(source["action"], "$decision.action", COMPATIBILITY_ACTIONS),
		allowed,
		fingerprint: decodeCompatibilityFingerprint(source["fingerprint"]),
		reasons,
		restartRequired: boolean(source["restartRequired"], "$decision.restartRequired"),
		capabilities: unique(array(source["capabilities"], "$decision.capabilities", CAPABILITIES.length, (item, itemPath) => enumeration(item, itemPath, CAPABILITIES)), "$decision.capabilities"),
		riskLevel: enumeration(source["riskLevel"], "$decision.riskLevel", RISKS),
		riskSummary: string(source["riskSummary"], "$decision.riskSummary", 600),
		executionAuthority: "broad-application-authority"
	};
}
/**
* Decode an artifact-verification result and enforce stable failure ordering.
* @param value - Verifier result-shaped value.
* @returns A bounded result without archive bytes or local paths.
*/
function decodeArtifactVerificationResult(value) {
	const source = record(value, "$verification");
	exact(source, "$verification", [
		"verified",
		"reasons",
		"observedPackageName",
		"observedVersion",
		"observedBundlePatch",
		"entryCount",
		"unpackedBytes"
	]);
	const reasons = array(source["reasons"], "$verification.reasons", ARTIFACT_VERIFICATION_REASON_ORDER.length * 4, artifactVerificationReason);
	assertReasonOrder(reasons, ARTIFACT_VERIFICATION_REASON_ORDER, "$verification.reasons");
	const verified = boolean(source["verified"], "$verification.verified");
	if (verified !== (reasons.length === 0)) fail("$verification.verified", "must equal whether the reason list is empty");
	const observedPackageName = nullableString(source["observedPackageName"], "$verification.observedPackageName", 214);
	if (observedPackageName !== null && !PACKAGE_NAME.test(observedPackageName)) fail("$verification.observedPackageName", "must be null or a lowercase npm package name");
	const observedVersion = nullableString(source["observedVersion"], "$verification.observedVersion", 64);
	if (observedVersion !== null && !VERSION.test(observedVersion)) fail("$verification.observedVersion", "must be null or an exact semantic version");
	const observedBundlePatchValue = source["observedBundlePatch"];
	return {
		verified,
		reasons,
		observedPackageName,
		observedVersion,
		observedBundlePatch: observedBundlePatchValue === null ? null : bundlePatchPath(observedBundlePatchValue, "$verification.observedBundlePatch"),
		entryCount: integer(source["entryCount"], "$verification.entryCount", 0, 1e5),
		unpackedBytes: integer(source["unpackedBytes"], "$verification.unpackedBytes", 0, 2147483647)
	};
}
/**
* Decode renderer installation intent without accepting mutation authority.
* @param value - Untrusted renderer value.
* @returns One exact reviewed target and idempotency key.
*/
function decodePluginInstallRequest(value) {
	const source = record(value, "$request");
	exact(source, "$request", [
		"pluginId",
		"version",
		"idempotencyKey"
	]);
	const idempotencyKey = string(source["idempotencyKey"], "$request.idempotencyKey", 128);
	if (!IDEMPOTENCY_KEY.test(idempotencyKey)) fail("$request.idempotencyKey", "must contain only stable ASCII key characters");
	return {
		pluginId: id(source["pluginId"], "$request.pluginId"),
		version: version(source["version"], "$request.version"),
		idempotencyKey
	};
}
/**
* Decode one installed-item mutation without accepting package or path authority.
* @param value - Untrusted renderer value.
* @returns One exact installed-item action and idempotency key.
*/
function decodePluginManagementRequest(value) {
	const source = record(value, "$request");
	exact(source, "$request", [
		"pluginId",
		"version",
		"action",
		"idempotencyKey"
	]);
	const idempotencyKey = string(source["idempotencyKey"], "$request.idempotencyKey", 128);
	if (!IDEMPOTENCY_KEY.test(idempotencyKey)) fail("$request.idempotencyKey", "must contain only stable ASCII key characters");
	return {
		pluginId: id(source["pluginId"], "$request.pluginId"),
		version: version(source["version"], "$request.version"),
		action: enumeration(source["action"], "$request.action", MANAGEMENT_ACTIONS),
		idempotencyKey
	};
}
/**
* Decode the authoritative installed projection before exposing it across IPC.
* @param value - Untrusted installed projection value.
* @returns A bounded installed-plugin list for the selected Profile.
*/
function decodeInstalledPluginListResult(value) {
	const source = record(value, "$installed");
	exact(source, "$installed", [
		"profileName",
		"profileRevision",
		"catalogFreshness",
		"items"
	]);
	if (source["profileName"] !== "web") fail("$installed.profileName", "must equal web");
	const items = array(source["items"], "$installed.items", 1e3, installedProjection);
	if (new Set(items.map((item) => item.packageName)).size !== items.length) fail("$installed.items", "must not contain duplicate package names");
	const pluginIds = items.flatMap((item) => item.pluginId === null ? [] : [item.pluginId]);
	if (new Set(pluginIds).size !== pluginIds.length) fail("$installed.items", "must not contain duplicate plugin ids");
	return {
		profileName: "web",
		profileRevision: integer(source["profileRevision"], "$installed.profileRevision", 0, 2147483647),
		catalogFreshness: enumeration(source["catalogFreshness"], "$installed.catalogFreshness", FRESHNESS),
		items
	};
}
/**
* Decode a separately confirmed, post-uninstall owned-data removal request.
* @param value - Untrusted renderer value.
* @returns The bounded paths tied to one committed uninstall operation.
*/
function decodePluginOwnedDataRemovalRequest(value) {
	const source = record(value, "$request");
	exact(source, "$request", [
		"operationId",
		"pluginId",
		"paths",
		"confirmation"
	]);
	if (source["confirmation"] !== "remove-owned-data") fail("$request.confirmation", "must equal remove-owned-data");
	return {
		operationId: id(source["operationId"], "$request.operationId"),
		pluginId: id(source["pluginId"], "$request.pluginId"),
		paths: unique(array(source["paths"], "$request.paths", 64, ownedDataPath), "$request.paths"),
		confirmation: "remove-owned-data"
	};
}
/**
* Decode a bounded result without leaking Desktop storage paths.
* @param value - Untrusted owned-data removal result.
* @returns The operation identity and relative paths removed.
*/
function decodePluginOwnedDataRemovalResult(value) {
	const source = record(value, "$result");
	exact(source, "$result", [
		"operationId",
		"pluginId",
		"removedPaths"
	]);
	return {
		operationId: id(source["operationId"], "$result.operationId"),
		pluginId: id(source["pluginId"], "$result.pluginId"),
		removedPaths: unique(array(source["removedPaths"], "$result.removedPaths", 64, ownedDataPath), "$result.removedPaths")
	};
}
/** Decode one current committed-uninstall owned-data offer across the Desktop bridge. */
function decodePluginOwnedDataOffer(value) {
	const source = record(value, "$offer");
	exact(source, "$offer", [
		"operationId",
		"pluginId",
		"packageName",
		"version",
		"declarations"
	]);
	const declarations = array(source["declarations"], "$offer.declarations", 64, installedOwnedData);
	if (new Set(declarations.map((item) => item.path)).size !== declarations.length) fail("$offer.declarations", "must not repeat owned-data paths");
	return {
		operationId: id(source["operationId"], "$offer.operationId"),
		pluginId: id(source["pluginId"], "$offer.pluginId"),
		packageName: packageIdentity(source["packageName"], "$offer.packageName"),
		version: version(source["version"], "$offer.version"),
		declarations
	};
}
/** Decode the explicit retain decision that closes one committed uninstall offer. */
function decodePluginOwnedDataRetentionRequest(value) {
	const source = record(value, "$request");
	exact(source, "$request", [
		"operationId",
		"pluginId",
		"confirmation"
	]);
	if (source["confirmation"] !== "retain-owned-data") fail("$request.confirmation", "must equal retain-owned-data");
	return {
		operationId: id(source["operationId"], "$request.operationId"),
		pluginId: id(source["pluginId"], "$request.pluginId"),
		confirmation: "retain-owned-data"
	};
}
/** Decode the bounded acknowledgement returned after retaining owned data. */
function decodePluginOwnedDataRetentionResult(value) {
	const source = record(value, "$result");
	exact(source, "$result", [
		"operationId",
		"pluginId",
		"retained"
	]);
	if (source["retained"] !== true) fail("$result.retained", "must equal true");
	return {
		operationId: id(source["operationId"], "$result.operationId"),
		pluginId: id(source["pluginId"], "$result.pluginId"),
		retained: true
	};
}
/**
* Decode a journal or bridge snapshot for one trusted installation.
* @param value - Snapshot-shaped value from the Desktop owning boundary.
* @returns A closed immutable operation projection.
*/
function decodePluginOperationSnapshot(value) {
	const source = record(value, "$operation");
	exact(source, "$operation", [
		"schemaVersion",
		"operationId",
		"idempotencyKey",
		"profileName",
		"action",
		"pluginId",
		"version",
		"phase",
		"startedAt",
		"updatedAt",
		"hostGeneration",
		"failureCode"
	]);
	if (source["schemaVersion"] !== 1) fail("$operation.schemaVersion", "must equal 1");
	if (source["profileName"] !== "web") fail("$operation.profileName", "must equal web");
	const operationId = id(source["operationId"], "$operation.operationId");
	const idempotencyKey = string(source["idempotencyKey"], "$operation.idempotencyKey", 128);
	if (!IDEMPOTENCY_KEY.test(idempotencyKey)) fail("$operation.idempotencyKey", "must contain only stable ASCII key characters");
	const phase = enumeration(source["phase"], "$operation.phase", OPERATION_PHASES);
	const failureCode = source["failureCode"] === null ? null : enumeration(source["failureCode"], "$operation.failureCode", OPERATION_FAILURE_CODES);
	const recoveryPhase = RECOVERY_PHASES.includes(phase);
	if ((phase === "failed" || phase === "rolled-back" || phase === "recovery-failed" || recoveryPhase) !== (failureCode !== null)) fail("$operation.failureCode", "must be present exactly for failure or recovery phases");
	const startedAt = instant(source["startedAt"], "$operation.startedAt");
	const updatedAt = instant(source["updatedAt"], "$operation.updatedAt");
	if (Date.parse(updatedAt) < Date.parse(startedAt)) fail("$operation.updatedAt", "must not be earlier than startedAt");
	return {
		schemaVersion: 1,
		operationId,
		idempotencyKey,
		profileName: "web",
		action: enumeration(source["action"], "$operation.action", COMPATIBILITY_ACTIONS),
		pluginId: id(source["pluginId"], "$operation.pluginId"),
		version: version(source["version"], "$operation.version"),
		phase,
		startedAt,
		updatedAt,
		hostGeneration: source["hostGeneration"] === null ? null : integer(source["hostGeneration"], "$operation.hostGeneration", 1, 2147483647),
		failureCode
	};
}
/**
* Decode one start/join/busy response before it reaches presentation state.
* @param value - Result-shaped value from the Desktop operation controller.
* @returns The closed operation-start result.
*/
function decodePluginOperationStartResult(value) {
	const source = record(value, "$result");
	const kind = enumeration(source["kind"], "$result.kind", [
		"started",
		"joined",
		"busy"
	]);
	if (kind === "busy") {
		exact(source, "$result", ["kind", "activeOperationId"]);
		return {
			kind,
			activeOperationId: id(source["activeOperationId"], "$result.activeOperationId")
		};
	}
	exact(source, "$result", ["kind", "operation"]);
	return {
		kind,
		operation: decodePluginOperationSnapshot(source["operation"])
	};
}
function evidenceIdentity(value, path) {
	const decoded = string(value, path, 256);
	if (!/^[A-Za-z0-9@][A-Za-z0-9@._:/-]*$/u.test(decoded)) return fail(path, "must be a stable runtime identity");
	return decoded;
}
function profileIdentity(value, path) {
	const source = record(value, path);
	exact(source, path, ["profileName", "rootSha256"]);
	if (source["profileName"] !== "web") fail(`${path}.profileName`, "must equal web");
	return {
		profileName: "web",
		rootSha256: sha256(source["rootSha256"], `${path}.rootSha256`)
	};
}
function runtimeEntryEvidence(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"entryId",
		"enabled",
		"fiberPhase"
	]);
	return {
		entryId: evidenceIdentity(source["entryId"], `${path}.entryId`),
		enabled: boolean(source["enabled"], `${path}.enabled`),
		fiberPhase: source["fiberPhase"] === null ? null : string(source["fiberPhase"], `${path}.fiberPhase`, 64)
	};
}
/**
* Decode exact runtime inventory retained at a transaction commit point.
* @param value - Runtime-evidence-shaped value from the trusted Host boundary.
* @returns Bounded Loader, client-module, and Skill evidence.
*/
function decodePluginRuntimeEvidence(value) {
	const source = record(value, "$runtimeEvidence");
	exact(source, "$runtimeEvidence", [
		"entries",
		"clientModules",
		"skillIds"
	]);
	const entries = array(source["entries"], "$runtimeEvidence.entries", 512, runtimeEntryEvidence);
	const entryIds = entries.map((entry) => entry.entryId);
	if (new Set(entryIds).size !== entryIds.length) fail("$runtimeEvidence.entries", "must not repeat entryId");
	return {
		entries,
		clientModules: unique(array(source["clientModules"], "$runtimeEvidence.clientModules", 256, evidenceIdentity), "$runtimeEvidence.clientModules"),
		skillIds: unique(array(source["skillIds"], "$runtimeEvidence.skillIds", 512, evidenceIdentity), "$runtimeEvidence.skillIds")
	};
}
function operationHeader(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"operationId",
		"idempotencyKey",
		"profileIdentity",
		"action",
		"pluginId",
		"version",
		"startedAt"
	]);
	const idempotencyKey = string(source["idempotencyKey"], `${path}.idempotencyKey`, 128);
	if (!IDEMPOTENCY_KEY.test(idempotencyKey)) fail(`${path}.idempotencyKey`, "must contain only stable ASCII key characters");
	return {
		operationId: id(source["operationId"], `${path}.operationId`),
		idempotencyKey,
		profileIdentity: profileIdentity(source["profileIdentity"], `${path}.profileIdentity`),
		action: enumeration(source["action"], `${path}.action`, COMPATIBILITY_ACTIONS),
		pluginId: id(source["pluginId"], `${path}.pluginId`),
		version: version(source["version"], `${path}.version`),
		startedAt: instant(source["startedAt"], `${path}.startedAt`)
	};
}
function priorSnapshotReference(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"snapshotId",
		"snapshotSha256",
		"runtimeEvidence"
	]);
	return {
		snapshotId: id(source["snapshotId"], `${path}.snapshotId`),
		snapshotSha256: sha256(source["snapshotSha256"], `${path}.snapshotSha256`),
		runtimeEvidence: decodePluginRuntimeEvidence(source["runtimeEvidence"])
	};
}
function operationPhaseEntry(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"sequence",
		"phase",
		"boundary",
		"at",
		"operationFailureCode",
		"recoveryReasonCode"
	]);
	return {
		sequence: integer(source["sequence"], `${path}.sequence`, 0, 4096),
		phase: enumeration(source["phase"], `${path}.phase`, OPERATION_PHASES),
		boundary: enumeration(source["boundary"], `${path}.boundary`, OPERATION_BOUNDARIES),
		at: instant(source["at"], `${path}.at`),
		operationFailureCode: source["operationFailureCode"] === null ? null : enumeration(source["operationFailureCode"], `${path}.operationFailureCode`, OPERATION_FAILURE_CODES),
		recoveryReasonCode: source["recoveryReasonCode"] === null ? null : enumeration(source["recoveryReasonCode"], `${path}.recoveryReasonCode`, RECOVERY_REASON_CODES)
	};
}
function operationCommitMarker(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"committedAt",
		"fingerprintSha256",
		"runtimeEvidence"
	]);
	return {
		committedAt: instant(source["committedAt"], `${path}.committedAt`),
		fingerprintSha256: sha256(source["fingerprintSha256"], `${path}.fingerprintSha256`),
		runtimeEvidence: decodePluginRuntimeEvidence(source["runtimeEvidence"])
	};
}
/**
* Decode and validate one version-2 durable transaction journal record.
* @param value - Journal-shaped value read from local durable storage.
* @returns A record whose header, phase history, commit marker, and terminal result agree.
*/
function decodePluginTransactionJournalRecord(value) {
	const source = record(value, "$journal");
	exact(source, "$journal", [
		"schemaVersion",
		"header",
		"operation",
		"priorFingerprint",
		"priorSnapshot",
		"phaseHistory",
		"commitMarker",
		"terminalResult",
		"recoveryAttempt",
		"recoveryReasonCode"
	]);
	if (source["schemaVersion"] !== 2) fail("$journal.schemaVersion", "must equal 2");
	const header = operationHeader(source["header"], "$journal.header");
	const operation = decodePluginOperationSnapshot(source["operation"]);
	if (operation.operationId !== header.operationId || operation.idempotencyKey !== header.idempotencyKey || operation.action !== header.action || operation.pluginId !== header.pluginId || operation.version !== header.version || operation.startedAt !== header.startedAt) fail("$journal.operation", "must match the immutable operation header");
	if (operation.phase === "failed") fail("$journal.operation.phase", "must use rolled-back or recovery-failed in a version-2 journal");
	const priorFingerprint = source["priorFingerprint"] === null ? null : decodeCompatibilityFingerprint(source["priorFingerprint"]);
	const priorSnapshot = source["priorSnapshot"] === null ? null : priorSnapshotReference(source["priorSnapshot"], "$journal.priorSnapshot");
	if (priorSnapshot === null !== (priorFingerprint === null)) fail("$journal.priorSnapshot", "must be present together with priorFingerprint");
	const phaseHistory = array(source["phaseHistory"], "$journal.phaseHistory", 256, operationPhaseEntry);
	if (phaseHistory.length === 0) fail("$journal.phaseHistory", "must contain the current phase");
	const foundationRequiredPhases = new Set([
		"stopping-host",
		"installing",
		"validating-profile",
		"starting-host",
		"reloading",
		"health-checking",
		"verifying-runtime",
		...RECOVERY_PHASES,
		"committed"
	]);
	if (priorSnapshot === null && phaseHistory.some((entry) => foundationRequiredPhases.has(entry.phase))) fail("$journal.priorSnapshot", "must exist before any mutation-owned side effect or recovery");
	let previousAt = header.startedAt;
	for (const [index, entry] of phaseHistory.entries()) {
		if (entry.sequence !== index) fail(`$journal.phaseHistory[${String(index)}].sequence`, "must be contiguous from zero");
		if (Date.parse(entry.at) < Date.parse(previousAt)) fail(`$journal.phaseHistory[${String(index)}].at`, "must not move backwards");
		if (entry.recoveryReasonCode !== null && entry.phase !== "recovery-failed" && !RECOVERY_PHASES.includes(entry.phase)) fail(`$journal.phaseHistory[${String(index)}].recoveryReasonCode`, "requires a recovery phase");
		previousAt = entry.at;
	}
	if (phaseHistory.at(-1)?.phase !== operation.phase || phaseHistory.at(-1)?.at !== operation.updatedAt) fail("$journal.phaseHistory", "latest entry must equal the operation phase and updatedAt");
	const commitMarker = source["commitMarker"] === null ? null : operationCommitMarker(source["commitMarker"], "$journal.commitMarker");
	const terminalResult = source["terminalResult"] === null ? null : enumeration(source["terminalResult"], "$journal.terminalResult", OPERATION_TERMINAL_RESULTS);
	const recoveryAttempt = integer(source["recoveryAttempt"], "$journal.recoveryAttempt", 0, 100);
	const recoveryReasonCode = source["recoveryReasonCode"] === null ? null : enumeration(source["recoveryReasonCode"], "$journal.recoveryReasonCode", RECOVERY_REASON_CODES);
	const recoveryPhase = RECOVERY_PHASES.includes(operation.phase);
	if ((recoveryPhase || operation.phase === "recovery-failed") && (recoveryAttempt === 0 || priorSnapshot === null)) fail("$journal.recoveryAttempt", "recovery requires an attempt and prior snapshot");
	if (!recoveryPhase && operation.phase !== "rolled-back" && operation.phase !== "recovery-failed" && recoveryAttempt !== 0) fail("$journal.recoveryAttempt", "must remain zero before recovery");
	if (terminalResult === "committed") {
		if (operation.phase !== "committed" || commitMarker === null || recoveryReasonCode !== null) fail("$journal.terminalResult", "committed requires the committed phase and commit marker only");
		if (Date.parse(commitMarker.committedAt) < Date.parse(operation.updatedAt)) fail("$journal.commitMarker.committedAt", "must not precede the committed operation");
	} else if (terminalResult === "rolled-back") {
		if (operation.phase !== "rolled-back" || commitMarker !== null || recoveryReasonCode !== null) fail("$journal.terminalResult", "rolled-back requires the rolled-back phase without commit or recovery failure");
	} else if (terminalResult === "recovery-failed") {
		if (operation.phase !== "recovery-failed" || commitMarker !== null || recoveryReasonCode === null) fail("$journal.terminalResult", "recovery-failed requires its phase and stable recovery reason");
	} else if (operation.phase === "committed" || operation.phase === "rolled-back" || operation.phase === "recovery-failed" || commitMarker !== null) fail("$journal.terminalResult", "must close every terminal phase and commit marker");
	if (recoveryReasonCode !== null && phaseHistory.at(-1)?.recoveryReasonCode !== recoveryReasonCode) fail("$journal.recoveryReasonCode", "must match the latest phase entry");
	return {
		schemaVersion: 2,
		header,
		operation,
		priorFingerprint,
		priorSnapshot,
		phaseHistory,
		commitMarker,
		terminalResult,
		recoveryAttempt,
		recoveryReasonCode
	};
}
/**
* Decode the renderer-safe state of an owned recovery.
* @param value - Recovery projection from the Desktop bridge.
* @returns A bounded recovery state with stable retry and export capabilities.
*/
function decodePluginRecoverySnapshot(value) {
	const source = record(value, "$recovery");
	exact(source, "$recovery", [
		"schemaVersion",
		"operationId",
		"phase",
		"recoveryPhase",
		"operationFailureCode",
		"recoveryReasonCode",
		"attempt",
		"updatedAt",
		"canRetry",
		"canExportDiagnostics"
	]);
	if (source["schemaVersion"] !== 1) fail("$recovery.schemaVersion", "must equal 1");
	const phase = enumeration(source["phase"], "$recovery.phase", [
		"recovering",
		"rolled-back",
		"recovery-failed"
	]);
	const recoveryPhase = source["recoveryPhase"] === null ? null : enumeration(source["recoveryPhase"], "$recovery.recoveryPhase", RECOVERY_PHASES);
	const recoveryReasonCode = source["recoveryReasonCode"] === null ? null : enumeration(source["recoveryReasonCode"], "$recovery.recoveryReasonCode", RECOVERY_REASON_CODES);
	if (phase === "recovering" !== (recoveryPhase !== null)) fail("$recovery.recoveryPhase", "must be present exactly while recovering");
	if (phase === "recovery-failed" !== (recoveryReasonCode !== null)) fail("$recovery.recoveryReasonCode", "must be present exactly for recovery-failed");
	const canRetry = boolean(source["canRetry"], "$recovery.canRetry");
	if (canRetry !== (phase === "recovery-failed")) fail("$recovery.canRetry", "must be true only for recovery-failed");
	if (source["canExportDiagnostics"] !== true) fail("$recovery.canExportDiagnostics", "must remain available for every recovery result");
	return {
		schemaVersion: 1,
		operationId: id(source["operationId"], "$recovery.operationId"),
		phase,
		recoveryPhase,
		operationFailureCode: enumeration(source["operationFailureCode"], "$recovery.operationFailureCode", OPERATION_FAILURE_CODES),
		recoveryReasonCode,
		attempt: integer(source["attempt"], "$recovery.attempt", 1, 100),
		updatedAt: instant(source["updatedAt"], "$recovery.updatedAt"),
		canRetry,
		canExportDiagnostics: true
	};
}
function operationIntent(value, path) {
	const source = record(value, path);
	exact(source, path, ["operationId"]);
	return id(source["operationId"], `${path}.operationId`);
}
/**
* Decode an idempotent recovery retry intent.
* @param value - Untrusted renderer value.
* @returns The operation selected for a recovery retry.
*/
function decodePluginRecoveryRetryRequest(value) {
	return { operationId: operationIntent(value, "$retry") };
}
/**
* Decode a diagnostic export intent without accepting a renderer path.
* @param value - Untrusted renderer value.
* @returns The operation selected for a Desktop-owned diagnostic export.
*/
function decodePluginDiagnosticExportRequest(value) {
	return { operationId: operationIntent(value, "$diagnosticRequest") };
}
/**
* Decode the bounded result of a Desktop-owned diagnostic save.
* @param value - Export-result-shaped value.
* @returns Saved metadata or an explicit user cancellation.
*/
function decodePluginDiagnosticExportResult(value) {
	const source = record(value, "$diagnosticResult");
	exact(source, "$diagnosticResult", [
		"operationId",
		"status",
		"filename",
		"sha256",
		"bytes"
	]);
	const status = enumeration(source["status"], "$diagnosticResult.status", ["saved", "cancelled"]);
	const filename = source["filename"] === null ? null : string(source["filename"], "$diagnosticResult.filename", 128);
	const digest = source["sha256"] === null ? null : sha256(source["sha256"], "$diagnosticResult.sha256");
	const bytes = source["bytes"] === null ? null : integer(source["bytes"], "$diagnosticResult.bytes", 1, 1048576);
	if (filename !== null && (filename.includes("/") || filename.includes("\\") || !filename.endsWith(".json"))) fail("$diagnosticResult.filename", "must be a JSON basename");
	if (status === "saved" !== (filename !== null && digest !== null && bytes !== null)) fail("$diagnosticResult.status", "saved requires filename, sha256, and bytes; cancelled requires null metadata");
	return {
		operationId: id(source["operationId"], "$diagnosticResult.operationId"),
		status,
		filename,
		sha256: digest,
		bytes
	};
}
/**
* Decode one whitelisted diagnostic document before writing or displaying it.
* @param value - Diagnostic-shaped value assembled by Desktop.
* @returns Bounded transaction facts without paths, file contents, or environment values.
*/
function decodePluginRecoveryDiagnostic(value) {
	const source = record(value, "$diagnostic");
	exact(source, "$diagnostic", [
		"schemaVersion",
		"journalStatus",
		"operationId",
		"profileName",
		"action",
		"pluginId",
		"version",
		"phaseHistory",
		"terminalResult",
		"recoveryAttempt",
		"recoveryReasonCode",
		"exportedAt"
	]);
	if (source["schemaVersion"] !== 1) fail("$diagnostic.schemaVersion", "must equal 1");
	const journalStatus = enumeration(source["journalStatus"], "$diagnostic.journalStatus", ["readable", "unreadable"]);
	const operationId = id(source["operationId"], "$diagnostic.operationId");
	const exportedAt = instant(source["exportedAt"], "$diagnostic.exportedAt");
	const terminalResult = source["terminalResult"] === null ? null : enumeration(source["terminalResult"], "$diagnostic.terminalResult", OPERATION_TERMINAL_RESULTS);
	const recoveryReasonCode = source["recoveryReasonCode"] === null ? null : enumeration(source["recoveryReasonCode"], "$diagnostic.recoveryReasonCode", RECOVERY_REASON_CODES);
	if (terminalResult === "recovery-failed" !== (recoveryReasonCode !== null)) fail("$diagnostic.recoveryReasonCode", "must be present exactly for recovery-failed");
	const phaseHistory = array(source["phaseHistory"], "$diagnostic.phaseHistory", 256, operationPhaseEntry);
	for (const [index, entry] of phaseHistory.entries()) if (entry.sequence !== index) fail(`$diagnostic.phaseHistory[${String(index)}].sequence`, "must be contiguous from zero");
	if (journalStatus === "unreadable") {
		if (source["profileName"] !== null || source["action"] !== null || source["pluginId"] !== null || source["version"] !== null || phaseHistory.length !== 0 || terminalResult !== "recovery-failed" || source["recoveryAttempt"] !== 1 || recoveryReasonCode !== "unsupported-journal-version" && recoveryReasonCode !== "journal-invalid") fail("$diagnostic", "unreadable journal diagnostics must not guess operation metadata");
		return {
			schemaVersion: 1,
			journalStatus,
			operationId,
			profileName: null,
			action: null,
			pluginId: null,
			version: null,
			phaseHistory: [],
			terminalResult: "recovery-failed",
			recoveryAttempt: 1,
			recoveryReasonCode,
			exportedAt
		};
	}
	if (source["profileName"] !== "web") fail("$diagnostic.profileName", "must equal web");
	return {
		schemaVersion: 1,
		journalStatus,
		operationId,
		profileName: "web",
		action: enumeration(source["action"], "$diagnostic.action", COMPATIBILITY_ACTIONS),
		pluginId: id(source["pluginId"], "$diagnostic.pluginId"),
		version: version(source["version"], "$diagnostic.version"),
		phaseHistory,
		terminalResult,
		recoveryAttempt: integer(source["recoveryAttempt"], "$diagnostic.recoveryAttempt", 0, 100),
		recoveryReasonCode,
		exportedAt
	};
}
function registryArtifactObject(value, path) {
	const source = record(value, path);
	exact(source, path, ["platform", "objectKey"]);
	return {
		platform: enumeration(source["platform"], `${path}.platform`, SUPPORTED_PLUGIN_PLATFORMS),
		objectKey: objectKey(source["objectKey"], `${path}.objectKey`)
	};
}
/**
* Decode an authenticated pending-review import without accepting unknown package authority.
* @param value - Untrusted internal API payload.
* @returns One exact immutable version and its trusted object identities.
*/
function decodeRegistryVersionImportRequest(value) {
	const source = record(value, "$registryImport");
	exact(source, "$registryImport", [
		"schemaVersion",
		"requestId",
		"operatorId",
		"reason",
		"evidenceRef",
		"occurredAt",
		"publisher",
		"detail",
		"preflight",
		"categoryIds",
		"artifactObjects"
	]);
	if (source["schemaVersion"] !== 1) fail("$registryImport.schemaVersion", "must equal 1");
	const publisherSource = record(source["publisher"], "$registryImport.publisher");
	exact(publisherSource, "$registryImport.publisher", ["publisherId", "displayName"]);
	const publisher = {
		publisherId: id(publisherSource["publisherId"], "$registryImport.publisher.publisherId"),
		displayName: string(publisherSource["displayName"], "$registryImport.publisher.displayName", 120)
	};
	const decodedDetail = detail(source["detail"], "$registryImport.detail");
	const preflight = decodeCatalogVersionPreflight(source["preflight"]);
	if (decodedDetail.summary.pluginId !== preflight.pluginId || decodedDetail.summary.version !== preflight.version || decodedDetail.summary.publisher !== publisher.displayName || decodedDetail.summary.verified !== preflight.reviewed || decodedDetail.eligible !== preflight.eligible || decodedDetail.withdrawn !== preflight.withdrawn || decodedDetail.riskLevel !== preflight.riskLevel || decodedDetail.riskSummary !== preflight.riskSummary || JSON.stringify(decodedDetail.summary.capabilities) !== JSON.stringify(preflight.capabilities) || JSON.stringify(decodedDetail.expectedEntries) !== JSON.stringify(preflight.expectedEntries) || JSON.stringify(decodedDetail.expectedClientModules) !== JSON.stringify(preflight.expectedClientModules) || JSON.stringify(decodedDetail.expectedSkillIds) !== JSON.stringify(preflight.expectedSkillIds)) fail("$registryImport", "detail and preflight must describe the same exact reviewed version");
	if (preflight.eligible || preflight.withdrawn || preflight.reviewed || decodedDetail.summary.verified) fail("$registryImport", "new imports must enter pending review without eligibility");
	const artifactObjects = array(source["artifactObjects"], "$registryImport.artifactObjects", SUPPORTED_PLUGIN_PLATFORMS.length, registryArtifactObject);
	const artifactPlatforms = preflight.artifacts.map((item) => item.platform).sort();
	const objectPlatforms = artifactObjects.map((item) => item.platform).sort();
	if (new Set(objectPlatforms).size !== objectPlatforms.length || JSON.stringify(artifactPlatforms) !== JSON.stringify(objectPlatforms)) fail("$registryImport.artifactObjects", "must contain one object for every declared platform artifact");
	return {
		schemaVersion: 1,
		requestId: id(source["requestId"], "$registryImport.requestId"),
		operatorId: id(source["operatorId"], "$registryImport.operatorId"),
		reason: string(source["reason"], "$registryImport.reason", 500),
		evidenceRef: string(source["evidenceRef"], "$registryImport.evidenceRef", 256),
		occurredAt: instant(source["occurredAt"], "$registryImport.occurredAt"),
		publisher,
		detail: decodedDetail,
		preflight,
		categoryIds: unique(array(source["categoryIds"], "$registryImport.categoryIds", 12, id), "$registryImport.categoryIds"),
		artifactObjects
	};
}
/**
* Decode one attributable exact-version eligibility decision.
* @param value - Untrusted internal API payload.
* @returns The closed moderation action and evidence identity.
*/
function decodeRegistryModerationRequest(value) {
	const source = record(value, "$moderation");
	exact(source, "$moderation", [
		"requestId",
		"operatorId",
		"pluginId",
		"version",
		"action",
		"reason",
		"evidenceRef",
		"occurredAt"
	]);
	return {
		requestId: id(source["requestId"], "$moderation.requestId"),
		operatorId: id(source["operatorId"], "$moderation.operatorId"),
		pluginId: id(source["pluginId"], "$moderation.pluginId"),
		version: version(source["version"], "$moderation.version"),
		action: enumeration(source["action"], "$moderation.action", REGISTRY_ACTIONS),
		reason: string(source["reason"], "$moderation.reason", 500),
		evidenceRef: string(source["evidenceRef"], "$moderation.evidenceRef", 256),
		occurredAt: instant(source["occurredAt"], "$moderation.occurredAt")
	};
}
/**
* Decode one attributable featured placement and deterministic active window.
* @param value - Untrusted internal API payload.
* @returns The exact version, position, and editorial window.
*/
function decodeRegistryFeaturedPlacementRequest(value) {
	const source = record(value, "$featured");
	exact(source, "$featured", [
		"requestId",
		"operatorId",
		"pluginId",
		"version",
		"section",
		"position",
		"startsAt",
		"endsAt",
		"reason"
	]);
	if (source["section"] !== "featured") fail("$featured.section", "must equal featured");
	const startsAt = instant(source["startsAt"], "$featured.startsAt");
	const endsAt = source["endsAt"] === null ? null : instant(source["endsAt"], "$featured.endsAt");
	if (endsAt !== null && Date.parse(endsAt) <= Date.parse(startsAt)) fail("$featured.endsAt", "must be later than startsAt");
	return {
		requestId: id(source["requestId"], "$featured.requestId"),
		operatorId: id(source["operatorId"], "$featured.operatorId"),
		pluginId: id(source["pluginId"], "$featured.pluginId"),
		version: version(source["version"], "$featured.version"),
		section: "featured",
		position: integer(source["position"], "$featured.position", 1, 60),
		startsAt,
		endsAt,
		reason: string(source["reason"], "$featured.reason", 500)
	};
}
/**
* Decode one attributable popularity-generation intent.
* @param value - Untrusted internal API or scheduled-worker payload.
* @returns Stable trigger identity, actor, reason, and time.
*/
function decodeRegistryRankingRequest(value) {
	const source = record(value, "$ranking");
	exact(source, "$ranking", [
		"requestId",
		"operatorId",
		"reason",
		"occurredAt"
	]);
	return {
		requestId: id(source["requestId"], "$ranking.requestId"),
		operatorId: id(source["operatorId"], "$ranking.operatorId"),
		reason: string(source["reason"], "$ranking.reason", 500),
		occurredAt: instant(source["occurredAt"], "$ranking.occurredAt")
	};
}
/**
* Decode strict replay-safe installation telemetry and reject every unknown field.
* @param value - Untrusted public API payload.
* @returns Privacy-limited coarse operation facts.
*/
function decodeRegistryInstallEvent(value) {
	const source = record(value, "$installEvent");
	exact(source, "$installEvent", [
		"schemaVersion",
		"eventId",
		"pluginId",
		"version",
		"installationId",
		"platform",
		"desktopVersion",
		"dshVersion",
		"result",
		"reason",
		"durationBucket",
		"occurredAt",
		"operatorTest"
	]);
	if (source["schemaVersion"] !== 1) fail("$installEvent.schemaVersion", "must equal 1");
	const installationId = string(source["installationId"], "$installEvent.installationId", 64);
	if (!INSTALLATION_ID.test(installationId)) fail("$installEvent.installationId", "must be a non-identifying lowercase hexadecimal id");
	const result = enumeration(source["result"], "$installEvent.result", REGISTRY_RESULTS);
	const reason = enumeration(source["reason"], "$installEvent.reason", REGISTRY_REASONS);
	if (result === "success" !== (reason === "none")) fail("$installEvent.reason", "must equal none exactly for a successful result");
	return {
		schemaVersion: 1,
		eventId: id(source["eventId"], "$installEvent.eventId"),
		pluginId: id(source["pluginId"], "$installEvent.pluginId"),
		version: version(source["version"], "$installEvent.version"),
		installationId,
		platform: enumeration(source["platform"], "$installEvent.platform", SUPPORTED_PLUGIN_PLATFORMS),
		desktopVersion: version(source["desktopVersion"], "$installEvent.desktopVersion"),
		dshVersion: version(source["dshVersion"], "$installEvent.dshVersion"),
		result,
		reason,
		durationBucket: enumeration(source["durationBucket"], "$installEvent.durationBucket", REGISTRY_DURATION),
		occurredAt: instant(source["occurredAt"], "$installEvent.occurredAt"),
		operatorTest: boolean(source["operatorTest"], "$installEvent.operatorTest")
	};
}
function registryRankInputs(value, path) {
	const source = record(value, path);
	exact(source, path, [
		"uniqueSuccess7d",
		"uniqueSuccess24h",
		"previousSuccess7d",
		"attempt7d",
		"rollbackOrActivationFailure7d",
		"ageInDays"
	]);
	return {
		uniqueSuccess7d: integer(source["uniqueSuccess7d"], `${path}.uniqueSuccess7d`, 0, 2147483647),
		uniqueSuccess24h: integer(source["uniqueSuccess24h"], `${path}.uniqueSuccess24h`, 0, 2147483647),
		previousSuccess7d: integer(source["previousSuccess7d"], `${path}.previousSuccess7d`, 0, 2147483647),
		attempt7d: integer(source["attempt7d"], `${path}.attempt7d`, 0, 2147483647),
		rollbackOrActivationFailure7d: integer(source["rollbackOrActivationFailure7d"], `${path}.rollbackOrActivationFailure7d`, 0, 2147483647),
		ageInDays: finiteNumber(source["ageInDays"], `${path}.ageInDays`, 0, 1e6)
	};
}
/**
* Decode one immutable popularity audit row with bounded formula values.
* @param value - Rank row read from durable storage or an internal result.
* @returns Frozen formula inputs, score, exclusions, and optional position.
*/
function decodeRegistryRankAudit(value) {
	const source = record(value, "$rankAudit");
	exact(source, "$rankAudit", [
		"pluginId",
		"version",
		"formulaVersion",
		"generatedAt",
		"inputs",
		"growth",
		"failureRate",
		"freshness",
		"score",
		"exclusionReasons",
		"position"
	]);
	if (source["formulaVersion"] !== "popular-v1") fail("$rankAudit.formulaVersion", "must equal popular-v1");
	const exclusionReasons = unique(array(source["exclusionReasons"], "$rankAudit.exclusionReasons", RANK_EXCLUSIONS.length, (item, itemPath) => enumeration(item, itemPath, RANK_EXCLUSIONS)), "$rankAudit.exclusionReasons");
	const position = source["position"] === null ? null : integer(source["position"], "$rankAudit.position", 1, 1e5);
	if (exclusionReasons.length === 0 !== (position !== null)) fail("$rankAudit.position", "must exist exactly for a non-excluded row");
	return {
		pluginId: id(source["pluginId"], "$rankAudit.pluginId"),
		version: version(source["version"], "$rankAudit.version"),
		formulaVersion: "popular-v1",
		generatedAt: instant(source["generatedAt"], "$rankAudit.generatedAt"),
		inputs: registryRankInputs(source["inputs"], "$rankAudit.inputs"),
		growth: finiteNumber(source["growth"], "$rankAudit.growth", -1, 3),
		failureRate: finiteNumber(source["failureRate"], "$rankAudit.failureRate", 0, 1),
		freshness: finiteNumber(source["freshness"], "$rankAudit.freshness", 0, 1),
		score: finiteNumber(source["score"], "$rankAudit.score", -2, 100),
		exclusionReasons,
		position
	};
}
/**
* Decode one exact public Registry result and enforce eligibility semantics.
* @param value - Public exact-version response.
* @returns Immutable reviewed metadata and its current moderation state.
*/
function decodeRegistryVersionResult(value) {
	const source = record(value, "$versionResult");
	exact(source, "$versionResult", [
		"moderationState",
		"installable",
		"detail",
		"preflight"
	]);
	const moderationState = enumeration(source["moderationState"], "$versionResult.moderationState", REGISTRY_STATES);
	const decodedDetail = detail(source["detail"], "$versionResult.detail");
	const preflight = decodeCatalogVersionPreflight(source["preflight"]);
	if (decodedDetail.summary.pluginId !== preflight.pluginId || decodedDetail.summary.version !== preflight.version) fail("$versionResult", "detail and preflight must identify the same exact version");
	const installable = boolean(source["installable"], "$versionResult.installable");
	if (installable !== (moderationState === "approved" && decodedDetail.eligible && !decodedDetail.withdrawn && preflight.reviewed && preflight.eligible && !preflight.withdrawn)) fail("$versionResult.installable", "must reflect reviewed eligibility and withdrawal");
	return {
		moderationState,
		installable,
		detail: decodedDetail,
		preflight
	};
}
/**
* Decode one bounded internal Registry success response.
* @param value - Internal operation result.
* @returns A stable operation code and optional exact-version identity.
*/
function decodeRegistryOperationResult(value) {
	const source = record(value, "$registryOperation");
	exact(source, "$registryOperation", [
		"requestId",
		"code",
		"pluginId",
		"version"
	]);
	const pluginId = source["pluginId"] === null ? null : id(source["pluginId"], "$registryOperation.pluginId");
	const exactVersion = source["version"] === null ? null : version(source["version"], "$registryOperation.version");
	if (pluginId === null !== (exactVersion === null)) fail("$registryOperation", "pluginId and version must be present together");
	return {
		requestId: id(source["requestId"], "$registryOperation.requestId"),
		code: enumeration(source["code"], "$registryOperation.code", REGISTRY_OPERATIONS),
		pluginId,
		version: exactVersion
	};
}
/**
* Decode one secret-free Registry failure response.
* @param value - Public or internal failure response.
* @returns A stable error code, bounded product message, and request id.
*/
function decodeRegistryErrorResult(value) {
	const source = record(value, "$registryError");
	exact(source, "$registryError", ["error"]);
	const error = record(source["error"], "$registryError.error");
	exact(error, "$registryError.error", [
		"code",
		"message",
		"requestId"
	]);
	return { error: {
		code: enumeration(error["code"], "$registryError.error.code", REGISTRY_ERRORS),
		message: string(error["message"], "$registryError.error.message", 240),
		requestId: string(error["requestId"], "$registryError.error.requestId", 128)
	} };
}
/**
* Decode the secret-free Registry health response.
* @param value - Health response payload.
* @returns Deployment health without dependency addresses or credentials.
*/
function decodeRegistryHealthResult(value) {
	const source = record(value, "$health");
	exact(source, "$health", [
		"status",
		"database",
		"currentCatalog"
	]);
	return {
		status: enumeration(source["status"], "$health.status", ["ok", "degraded"]),
		database: enumeration(source["database"], "$health.database", ["ready", "unavailable"]),
		currentCatalog: boolean(source["currentCatalog"], "$health.currentCatalog")
	};
}
//#endregion
export { ARTIFACT_VERIFICATION_REASON_ORDER, COMPATIBILITY_ACTIONS, COMPATIBILITY_REASON_ORDER, CatalogContractError, INSTALLED_PLUGIN_RUNTIME_STATUSES, INSTALLED_PLUGIN_SOURCES, PLUGIN_MANAGEMENT_ACTIONS, PLUGIN_MUTATION_PHASES, PLUGIN_OPERATION_BOUNDARIES, PLUGIN_OPERATION_FAILURE_CODES, PLUGIN_OPERATION_PHASES, PLUGIN_OPERATION_TERMINAL_RESULTS, PLUGIN_RECOVERY_PHASES, PLUGIN_RECOVERY_REASON_CODES, REGISTRY_DURATION_BUCKETS, REGISTRY_ERROR_CODES, REGISTRY_INSTALL_REASONS, REGISTRY_INSTALL_RESULTS, REGISTRY_MODERATION_ACTIONS, REGISTRY_MODERATION_STATES, REGISTRY_OPERATION_CODES, REGISTRY_RANK_EXCLUSION_REASONS, SUPPORTED_PLUGIN_PLATFORMS, decodeArtifactVerificationResult, decodeCatalogDetailQuery, decodeCatalogListQuery, decodeCatalogMedia, decodeCatalogSnapshot, decodeCatalogSummary, decodeCatalogVersionPreflight, decodeCompatibilityDecision, decodeCompatibilityFingerprint, decodeCompatibilityRequest, decodeInstalledPluginListResult, decodePluginDiagnosticExportRequest, decodePluginDiagnosticExportResult, decodePluginInstallRequest, decodePluginManagementRequest, decodePluginOperationSnapshot, decodePluginOperationStartResult, decodePluginOwnedDataOffer, decodePluginOwnedDataRemovalRequest, decodePluginOwnedDataRemovalResult, decodePluginOwnedDataRetentionRequest, decodePluginOwnedDataRetentionResult, decodePluginRecoveryDiagnostic, decodePluginRecoveryRetryRequest, decodePluginRecoverySnapshot, decodePluginRuntimeEvidence, decodePluginTransactionJournalRecord, decodeRegistryErrorResult, decodeRegistryFeaturedPlacementRequest, decodeRegistryHealthResult, decodeRegistryInstallEvent, decodeRegistryModerationRequest, decodeRegistryOperationResult, decodeRegistryRankAudit, decodeRegistryRankingRequest, decodeRegistryVersionImportRequest, decodeRegistryVersionResult };
