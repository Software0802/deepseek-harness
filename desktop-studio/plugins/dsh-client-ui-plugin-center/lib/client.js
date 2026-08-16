window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-plugin-center",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react = require("react");
		//#region ../../plugin-center/contracts/lib/index.js
		/** Strict JSON boundary for the Desktop Plugin Center catalog. */
		/** Actions for which one exact compatibility decision may grant authority. */
		const COMPATIBILITY_ACTIONS = [
			"install",
			"update",
			"enable",
			"disable",
			"uninstall"
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
		[...PLUGIN_MUTATION_PHASES, ...PLUGIN_RECOVERY_PHASES];
		//#endregion
		//#region lib/types/client/operation-phases.js
		/** Client-local ordered projection of the Desktop trusted-install phases. */
		/** Ordered trusted-install phases rendered by the browser progress surface. */
		const PLUGIN_OPERATION_PHASES = [
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
			"verifying-runtime",
			"committed",
			"failed"
		];
		const TRUSTED_INSTALL_PHASE_SET = new Set(PLUGIN_OPERATION_PHASES);
		/** Locale key for each Desktop-owned trusted-install phase. */
		const PLUGIN_OPERATION_PHASE_KEYS = {
			preflight: "phasePreflight",
			downloading: "phaseDownloading",
			"verifying-artifact": "phaseVerifyingArtifact",
			snapshotting: "phaseSnapshotting",
			"stopping-host": "phaseStoppingHost",
			installing: "phaseInstalling",
			"validating-profile": "phaseValidatingProfile",
			"starting-host": "phaseStartingHost",
			reloading: "phaseReloading",
			"health-checking": "phaseHealthChecking",
			"verifying-runtime": "phaseVerifyingRuntime",
			committed: "phaseCommitted",
			failed: "phaseFailed"
		};
		/** User-facing groups that collapse implementation phases into four stable progress steps. */
		const PLUGIN_OPERATION_GROUPS = [
			{
				label: "progressPreparing",
				phases: [
					"preflight",
					"downloading",
					"verifying-artifact",
					"snapshotting"
				]
			},
			{
				label: "progressInstalling",
				phases: [
					"stopping-host",
					"installing",
					"validating-profile"
				]
			},
			{
				label: "progressReloading",
				phases: [
					"starting-host",
					"reloading",
					"health-checking"
				]
			},
			{
				label: "progressVerifying",
				phases: ["verifying-runtime"]
			}
		];
		/**
		* Narrow the shared operation vocabulary to phases owned by the F003 UI.
		* @param phase - Phase received from the evolving Desktop operation protocol.
		* @returns True only for the trusted-install phases rendered by this Feature.
		*/
		function isTrustedInstallPhase(phase) {
			return TRUSTED_INSTALL_PHASE_SET.has(phase);
		}
		/**
		* Report whether an operation can no longer advance through F003.
		* @param phase - Current Desktop operation phase.
		* @returns True for committed or failed operations.
		*/
		function isTerminalOperationPhase(phase) {
			return phase === "committed" || phase === "failed" || phase === "rolled-back" || phase === "recovery-failed";
		}
		/**
		* Report whether an operation must keep later plugin mutations gated.
		* A completed rollback restored the previous environment and releases the gate;
		* failed recovery states stay gated until recovery succeeds.
		* @param phase - Current Desktop operation phase.
		* @returns True while another mutation is active or still needs recovery.
		*/
		function isMutationBlockingOperationPhase(phase) {
			return phase !== "committed" && phase !== "rolled-back";
		}
		//#endregion
		//#region lib/types/client/development-bridge.js
		/** Deterministic browser-only catalog used by the dedicated development command. */
		const GENERATED_AT = "2026-08-15T04:00:00.000Z";
		const ETAG = "web-development-f003-v1";
		const OPERATION_STORAGE_KEY = "dsh.plugin-center.development-operation.v1";
		const INSTALLED_STORAGE_KEY = "dsh.plugin-center.development-installed.v1";
		const OPERATION_INTERVAL_MS = 180;
		const WORKSPACE_TOOLS = {
			pluginId: "fixture.workspace-tools",
			version: "0.1.0-rc.5",
			catalogKind: "plugin",
			scope: "public",
			displayName: "工作区效率工具",
			summary: "用于验证插件发现、搜索与详情流程的内置示例 Bundle。",
			publisher: "DeepSeek Harness Fixture",
			verified: true,
			keywords: [
				"workspace",
				"tools",
				"工作区",
				"效率"
			],
			capabilities: [
				"host",
				"client",
				"tool"
			],
			icon: null,
			brandColor: "#5B8CFF",
			compatibility: {
				status: "compatible",
				reason: null,
				platforms: ["darwin-arm64", "win32-x64"]
			},
			updatedAt: "2026-08-15T03:00:00.000Z",
			installed: false
		};
		const SKILL_PACK = {
			pluginId: "fixture.skill-pack",
			version: "0.1.0-rc.5",
			catalogKind: "skill-pack",
			scope: "public",
			displayName: "Harness 基础技能包",
			summary: "以 DSH Bundle 封装的示例 Skill Pack，用于验证技能发现链路。",
			publisher: "DeepSeek Harness Fixture",
			verified: true,
			keywords: [
				"skill",
				"skills",
				"技能",
				"bundle"
			],
			capabilities: ["skill"],
			icon: null,
			brandColor: "#8B5CF6",
			compatibility: {
				status: "compatible",
				reason: null,
				platforms: ["darwin-arm64", "win32-x64"]
			},
			updatedAt: "2026-08-15T02:00:00.000Z",
			installed: false
		};
		const LOCAL_BUNDLE = {
			pluginId: "local.developer-bundle",
			version: "0.1.0",
			catalogKind: "plugin",
			scope: "local",
			displayName: "本地开发 Bundle",
			summary: "从当前 Profile 投影出的本地示例；F001 仅展示，不提供变更动作。",
			publisher: "Local profile",
			verified: false,
			keywords: [
				"local",
				"profile",
				"本地"
			],
			capabilities: ["host"],
			icon: null,
			brandColor: "#64748B",
			compatibility: {
				status: "unknown",
				reason: "本地 Bundle 未经过目录审核。",
				platforms: ["darwin-arm64", "win32-x64"]
			},
			updatedAt: "2026-08-15T01:00:00.000Z",
			installed: true
		};
		const ENTRIES = [
			WORKSPACE_TOOLS,
			SKILL_PACK,
			LOCAL_BUNDLE
		];
		const SECTION_IDS = {
			featured: [WORKSPACE_TOOLS.pluginId, SKILL_PACK.pluginId],
			popular: [SKILL_PACK.pluginId, WORKSPACE_TOOLS.pluginId],
			recent: [WORKSPACE_TOOLS.pluginId, SKILL_PACK.pluginId]
		};
		function detail(summary, values) {
			return {
				summary,
				description: values.description,
				screenshots: [],
				permissions: values.permissions,
				riskLevel: summary.scope === "local" ? "medium" : "low",
				riskSummary: values.riskSummary,
				changelog: "首个用于插件中心发现闭环的确定版本。",
				publishedAt: summary.updatedAt,
				expectedEntries: values.expectedEntries,
				expectedClientModules: values.expectedClientModules,
				expectedSkillIds: values.expectedSkillIds,
				eligible: values.eligible,
				withdrawn: false
			};
		}
		const DETAILS = [
			detail(WORKSPACE_TOOLS, {
				description: "展示普通插件的确定版本、发布者、能力、兼容性与风险信息；Web 开发模式不会修改当前 Profile。",
				permissions: ["读取用户明确选择的工作区。"],
				riskSummary: "该条目是开发 fixture；“已验证”不代表进程隔离。",
				expectedEntries: ["fixture.workspace-tools"],
				expectedClientModules: ["@fixture/dsh-client-ui-workspace-tools"],
				expectedSkillIds: [],
				eligible: true
			}),
			detail(SKILL_PACK, {
				description: "展示 Skill Pack 如何作为一个 DSH Bundle 进入同一目录与后续事务。",
				permissions: ["安装后向 Harness 注册已审核 Skill 定义。"],
				riskSummary: "该 Skill Pack 复用插件兼容与安装边界，不产生第二套安装权威。",
				expectedEntries: [],
				expectedClientModules: [],
				expectedSkillIds: ["fixture.harness-basics"],
				eligible: true
			}),
			detail(LOCAL_BUNDLE, {
				description: "本地 Profile 示例，仅用于验证本地范围和不受目录管理的只读状态。",
				permissions: ["权限信息由本地作者自行负责。"],
				riskSummary: "本地条目未经目录审核，插件中心不会为它提供安装或卸载授权。",
				expectedEntries: ["local.developer-bundle"],
				expectedClientModules: [],
				expectedSkillIds: [],
				eligible: false
			})
		];
		function scenario() {
			const value = new URLSearchParams(globalThis.location.search).get("pluginCenterScenario");
			return value === "empty" || value === "stale" || value === "compatibility-denied" || value === "error" ? value : "normal";
		}
		function matches(entry, query) {
			const needle = query.trim().toLocaleLowerCase();
			return needle.length === 0 || [
				entry.displayName,
				entry.summary,
				entry.publisher,
				...entry.keywords
			].some((value) => value.toLocaleLowerCase().includes(needle));
		}
		function listResult(query, selected, installed) {
			const entries = selected === "empty" ? [] : ENTRIES.filter((entry) => entry.catalogKind === query.catalogKind && entry.scope === query.scope && matches(entry, query.query)).map((entry) => ({
				...entry,
				installed: installed.has(entry.pluginId, entry.version)
			}));
			const byId = new Map(entries.map((entry) => [entry.pluginId, entry]));
			const project = (section) => {
				return (query.scope === "local" ? entries : SECTION_IDS[section].flatMap((pluginId) => {
					const entry = byId.get(pluginId);
					return entry === void 0 ? [] : [entry];
				})).slice(0, query.limit);
			};
			const freshness = selected === "stale" ? "stale" : "fresh";
			return {
				etag: ETAG,
				generatedAt: GENERATED_AT,
				freshness,
				source: freshness === "stale" ? "cache" : "bundled",
				sections: {
					featured: project("featured"),
					popular: query.scope === "local" ? [] : project("popular"),
					recent: query.scope === "local" ? [] : project("recent")
				}
			};
		}
		function detailResult(query, selected) {
			const found = selected === "empty" ? null : DETAILS.find((item) => item.summary.pluginId === query.pluginId && item.summary.version === query.version) ?? null;
			const freshness = selected === "stale" ? "stale" : "fresh";
			return {
				etag: ETAG,
				generatedAt: GENERATED_AT,
				freshness,
				source: freshness === "stale" ? "cache" : "bundled",
				detail: found
			};
		}
		function compatibilityDecision(value, selected) {
			const request = value;
			const found = selected === "empty" ? void 0 : DETAILS.find((item) => item.summary.pluginId === request.pluginId && item.summary.version === request.version);
			const fingerprint = {
				desktopVersion: "0.1.0-rc.5",
				dshVersion: "0.1.0-rc.5",
				nodeVersion: "22.22.0",
				platform: "darwin-arm64",
				catalogEtag: ETAG,
				catalogFreshness: selected === "stale" ? "stale" : "fresh",
				profileRevision: 7,
				installedPlugins: [],
				protectedPackageNames: ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app"],
				protectedEntryIds: ["agent-loop", "ui-plugin-center"],
				activeOperation: false
			};
			const reasons = found === void 0 ? [{
				code: "catalog-metadata-invalid",
				subject: `${request.pluginId}@${request.version}`,
				actual: "missing",
				expected: "reviewed exact catalog version"
			}] : selected === "compatibility-denied" ? [{
				code: "desktop-version-unsupported",
				subject: "desktopVersion",
				actual: fingerprint.desktopVersion,
				expected: ">=0.2.0"
			}, {
				code: "platform-unsupported",
				subject: fingerprint.platform,
				actual: fingerprint.platform,
				expected: "win32-x64"
			}] : selected === "stale" ? [{
				code: "version-ineligible",
				subject: "catalogFreshness",
				actual: "stale",
				expected: "fresh-or-cached"
			}] : !found.summary.verified || !found.eligible ? [
				...!found.summary.verified ? [{
					code: "catalog-unverified",
					subject: request.pluginId,
					actual: "false",
					expected: "true"
				}] : [],
				...!found.eligible ? [{
					code: "version-ineligible",
					subject: request.version,
					actual: "false",
					expected: "true"
				}] : [],
				{
					code: "action-not-supported",
					subject: request.action,
					actual: "not-installed",
					expected: null
				}
			] : request.action !== "install" ? [{
				code: "action-not-supported",
				subject: request.action,
				actual: "not-installed",
				expected: null
			}] : [];
			return {
				pluginId: request.pluginId,
				version: request.version,
				action: request.action,
				allowed: reasons.length === 0,
				fingerprint,
				reasons,
				restartRequired: found?.summary.scope === "public",
				capabilities: found?.summary.capabilities ?? [],
				riskLevel: found?.riskLevel ?? "high",
				riskSummary: found?.riskSummary ?? "Reviewed risk metadata is unavailable for this exact version.",
				executionAuthority: "broad-application-authority"
			};
		}
		/** Session-backed browser fixture for cumulative install and management journeys. */
		var DevelopmentInstalledRuntime = class {
			state;
			constructor() {
				this.state = this.readStored();
			}
			has(pluginId, version) {
				if (pluginId === WORKSPACE_TOOLS.pluginId) return this.state.workspaceVersion === version;
				if (pluginId === SKILL_PACK.pluginId) return this.state.skillInstalled && version === SKILL_PACK.version;
				return pluginId === LOCAL_BUNDLE.pluginId;
			}
			commit(operation) {
				if (operation.phase !== "committed") return;
				const before = this.state;
				let next = before;
				if (operation.pluginId === WORKSPACE_TOOLS.pluginId) {
					if (operation.action === "install") next = {
						...before,
						workspaceVersion: operation.version,
						workspaceEnabled: true
					};
					else if (operation.action === "update" && before.workspaceVersion !== null) next = {
						...before,
						workspaceVersion: operation.version
					};
					else if (operation.action === "enable" && before.workspaceVersion !== null) next = {
						...before,
						workspaceEnabled: true
					};
					else if (operation.action === "disable" && before.workspaceVersion !== null) next = {
						...before,
						workspaceEnabled: false
					};
					else if (operation.action === "uninstall") next = {
						...before,
						workspaceVersion: null,
						workspaceEnabled: false
					};
				} else if (operation.pluginId === SKILL_PACK.pluginId) {
					if (operation.action === "enable") next = {
						...before,
						skillInstalled: true,
						skillEnabled: true
					};
					else if (operation.action === "disable") next = {
						...before,
						skillInstalled: true,
						skillEnabled: false
					};
					else if (operation.action === "uninstall") next = {
						...before,
						skillInstalled: false,
						skillEnabled: false
					};
				}
				if (JSON.stringify(next) === JSON.stringify(before)) return;
				this.state = {
					...next,
					revision: before.revision + 1
				};
				try {
					globalThis.sessionStorage.setItem(INSTALLED_STORAGE_KEY, JSON.stringify(this.state));
				} catch {}
			}
			result(operation) {
				const pending = operation !== null && !isTerminal(operation.phase) ? operation : null;
				const workspaceInstalled = this.state.workspaceVersion !== null;
				const workspaceEnabled = this.state.workspaceEnabled;
				const skillEnabled = this.state.skillEnabled;
				const appUpdateIncompatible = scenario() === "compatibility-denied";
				const activeCatalogCount = Number(workspaceInstalled && workspaceEnabled) + Number(this.state.skillInstalled && skillEnabled);
				return {
					profileName: "web",
					profileRevision: this.state.revision,
					catalogFreshness: scenario() === "stale" ? "stale" : "fresh",
					items: [
						{
							pluginId: null,
							packageName: "@deepseek-ai/dsh-web-app",
							version: "0.1.0-rc.5",
							displayName: "Harness Web 系统组件",
							icon: null,
							brandColor: null,
							catalogKind: null,
							source: "system",
							protected: true,
							enabled: true,
							bundleOrder: 0,
							disabledOrder: null,
							runtimeStatus: "running",
							runtime: {
								entries: [{
									entryId: "ui-plugin-center",
									enabled: true,
									fiberPhase: "active"
								}],
								clientModules: [],
								skillIds: []
							},
							expectedEntries: ["ui-plugin-center"],
							expectedClientModules: [],
							expectedSkillIds: [],
							compatibility: "compatible",
							compatibilityReason: "系统组件由当前桌面发行版保护。",
							update: null,
							pendingAction: null,
							supportedActions: [],
							configurationEntryIds: ["ui-plugin-center"],
							ownedData: []
						},
						...workspaceInstalled ? [{
							pluginId: WORKSPACE_TOOLS.pluginId,
							packageName: "@deepseek-ai/dsh-plugin-center-fixture",
							version: this.state.workspaceVersion,
							displayName: WORKSPACE_TOOLS.displayName,
							icon: WORKSPACE_TOOLS.icon,
							brandColor: WORKSPACE_TOOLS.brandColor,
							catalogKind: WORKSPACE_TOOLS.catalogKind,
							source: "catalog",
							protected: false,
							enabled: workspaceEnabled,
							bundleOrder: workspaceEnabled ? 1 : null,
							disabledOrder: workspaceEnabled ? null : 0,
							runtimeStatus: workspaceEnabled ? "running" : "inactive",
							runtime: workspaceEnabled ? {
								entries: [{
									entryId: "fixture.workspace-tools",
									enabled: true,
									fiberPhase: "active"
								}],
								clientModules: ["@deepseek-ai/dsh-plugin-center-fixture"],
								skillIds: []
							} : {
								entries: [],
								clientModules: [],
								skillIds: []
							},
							expectedEntries: ["fixture.workspace-tools"],
							expectedClientModules: ["@deepseek-ai/dsh-plugin-center-fixture"],
							expectedSkillIds: [],
							compatibility: "compatible",
							compatibilityReason: null,
							update: this.state.workspaceVersion === WORKSPACE_TOOLS.version ? {
								version: "0.1.0-rc.6",
								changelog: "新增一组经过审核的工作区批量操作。",
								riskLevel: "medium",
								riskSummary: "新版本新增文件写入能力，仍在应用进程中运行。"
							} : null,
							pendingAction: pending?.pluginId === WORKSPACE_TOOLS.pluginId ? pending.action : null,
							supportedActions: [
								...this.state.workspaceVersion === WORKSPACE_TOOLS.version ? ["update"] : [],
								workspaceEnabled ? "disable" : "enable",
								"uninstall"
							],
							configurationEntryIds: ["fixture.workspace-tools"],
							ownedData: [{
								path: "cache",
								label: "工作区缓存"
							}]
						}] : [],
						...this.state.skillInstalled ? [{
							pluginId: SKILL_PACK.pluginId,
							packageName: "@deepseek-ai/dsh-plugin-center-skill-fixture",
							version: SKILL_PACK.version,
							displayName: SKILL_PACK.displayName,
							icon: SKILL_PACK.icon,
							brandColor: SKILL_PACK.brandColor,
							catalogKind: SKILL_PACK.catalogKind,
							source: "catalog",
							protected: false,
							enabled: skillEnabled,
							bundleOrder: skillEnabled ? 1 + Number(workspaceInstalled && workspaceEnabled) : null,
							disabledOrder: skillEnabled ? null : Number(workspaceInstalled && !workspaceEnabled),
							runtimeStatus: skillEnabled ? "running" : "inactive",
							runtime: skillEnabled ? {
								entries: [{
									entryId: "fixture.harness-basics-provider",
									enabled: true,
									fiberPhase: "active"
								}],
								clientModules: [],
								skillIds: ["fixture-harness-basics"]
							} : {
								entries: [],
								clientModules: [],
								skillIds: []
							},
							expectedEntries: ["fixture.harness-basics-provider"],
							expectedClientModules: [],
							expectedSkillIds: ["fixture-harness-basics"],
							compatibility: appUpdateIncompatible ? "incompatible" : "compatible",
							compatibilityReason: appUpdateIncompatible ? "desktop-version-unsupported: desktopVersion" : null,
							update: null,
							pendingAction: pending?.pluginId === SKILL_PACK.pluginId ? pending.action : null,
							supportedActions: [...appUpdateIncompatible ? [] : [skillEnabled ? "disable" : "enable"], "uninstall"],
							configurationEntryIds: ["fixture.harness-basics-provider"],
							ownedData: []
						}] : [],
						{
							pluginId: null,
							packageName: "@local/developer-bundle",
							version: "0.1.0",
							displayName: LOCAL_BUNDLE.displayName,
							icon: LOCAL_BUNDLE.icon,
							brandColor: LOCAL_BUNDLE.brandColor,
							catalogKind: null,
							source: "local",
							protected: false,
							enabled: true,
							bundleOrder: 1 + activeCatalogCount,
							disabledOrder: null,
							runtimeStatus: "failed",
							runtime: {
								entries: [{
									entryId: "local.developer-bundle",
									enabled: true,
									fiberPhase: "failed"
								}],
								clientModules: [],
								skillIds: []
							},
							expectedEntries: ["local.developer-bundle"],
							expectedClientModules: [],
							expectedSkillIds: [],
							compatibility: "unknown",
							compatibilityReason: "本地 Bundle 未经过目录审核。",
							update: null,
							pendingAction: null,
							supportedActions: [],
							configurationEntryIds: ["local.developer-bundle"],
							ownedData: []
						}
					]
				};
			}
			readStored() {
				const fallback = {
					revision: 7,
					workspaceVersion: null,
					workspaceEnabled: false,
					skillInstalled: true,
					skillEnabled: false
				};
				try {
					const raw = globalThis.sessionStorage.getItem(INSTALLED_STORAGE_KEY);
					if (raw === null) return fallback;
					const value = JSON.parse(raw);
					return typeof value.revision === "number" && (value.workspaceVersion === null || typeof value.workspaceVersion === "string") && typeof value.workspaceEnabled === "boolean" && typeof value.skillInstalled === "boolean" && typeof value.skillEnabled === "boolean" ? value : fallback;
				} catch {
					return fallback;
				}
			}
		};
		function rejectUnavailable() {
			return Promise.reject(/* @__PURE__ */ new Error("Plugin Center Web development scenario is unavailable"));
		}
		function isTerminal(phase) {
			return !isTrustedInstallPhase(phase) || phase === "committed" || phase === "failed";
		}
		function nextGeneration(phase) {
			if (!isTrustedInstallPhase(phase)) return null;
			const index = PLUGIN_OPERATION_PHASES.indexOf(phase);
			return index >= PLUGIN_OPERATION_PHASES.indexOf("reloading") ? 2 : index >= PLUGIN_OPERATION_PHASES.indexOf("stopping-host") ? 1 : null;
		}
		/** Browser-only replay of the Desktop journal/event contract; it never mutates a Profile. */
		var DevelopmentOperationRuntime = class {
			installed;
			operation;
			listeners = /* @__PURE__ */ new Set();
			timer;
			sequence = 0;
			constructor(installed) {
				this.installed = installed;
				this.operation = this.readStored();
				if (this.operation !== null) installed.commit(this.operation);
				if (this.operation !== null && !isTerminal(this.operation.phase)) this.scheduleNext();
			}
			getOperation() {
				return Promise.resolve(this.operation);
			}
			current() {
				return this.operation;
			}
			onState(listener) {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			}
			install(value) {
				return this.start({
					...value,
					action: "install"
				});
			}
			manage(value) {
				return this.start(value);
			}
			start(request) {
				const current = this.operation;
				if (current?.idempotencyKey === request.idempotencyKey) return Promise.resolve({
					kind: "joined",
					operation: current
				});
				if (current !== null && !isTerminal(current.phase)) return Promise.resolve({
					kind: "busy",
					activeOperationId: current.operationId
				});
				this.sequence += 1;
				const timestamp = (/* @__PURE__ */ new Date()).toISOString();
				const operation = {
					schemaVersion: 1,
					operationId: `dev-${request.action}-${String(this.sequence)}`,
					idempotencyKey: request.idempotencyKey,
					profileName: "web",
					action: request.action,
					pluginId: request.pluginId,
					version: request.version,
					phase: "preflight",
					startedAt: timestamp,
					updatedAt: timestamp,
					hostGeneration: null,
					failureCode: null
				};
				this.publish(operation);
				this.scheduleNext();
				return Promise.resolve({
					kind: "started",
					operation
				});
			}
			scheduleNext() {
				if (this.timer !== void 0 || this.operation === null || !isTrustedInstallPhase(this.operation.phase) || isTerminal(this.operation.phase)) return;
				this.timer = setTimeout(() => {
					this.timer = void 0;
					const current = this.operation;
					if (current === null || !isTrustedInstallPhase(current.phase) || isTerminal(current.phase)) return;
					const phase = PLUGIN_OPERATION_PHASES[PLUGIN_OPERATION_PHASES.indexOf(current.phase) + 1];
					if (phase === void 0 || phase === "failed") return;
					this.publish({
						...current,
						phase,
						updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
						hostGeneration: nextGeneration(phase),
						failureCode: null
					});
					this.scheduleNext();
				}, OPERATION_INTERVAL_MS);
			}
			publish(operation) {
				this.operation = operation;
				this.installed.commit(operation);
				try {
					globalThis.sessionStorage.setItem(OPERATION_STORAGE_KEY, JSON.stringify(operation));
				} catch {}
				for (const listener of this.listeners) listener(operation);
			}
			readStored() {
				try {
					const stored = globalThis.sessionStorage.getItem(OPERATION_STORAGE_KEY);
					if (stored === null) return null;
					const value = JSON.parse(stored);
					return value.schemaVersion === 1 && value.profileName === "web" && typeof value.action === "string" && COMPATIBILITY_ACTIONS.includes(value.action) && typeof value.operationId === "string" && typeof value.idempotencyKey === "string" && typeof value.pluginId === "string" && typeof value.version === "string" && typeof value.phase === "string" && isTrustedInstallPhase(value.phase) && typeof value.startedAt === "string" && typeof value.updatedAt === "string" ? value : null;
				} catch {
					return null;
				}
			}
		};
		/** Browser-only recovery fixture used to accept the failure/retry UI without touching Desktop state. */
		var DevelopmentRecoveryRuntime = class {
			snapshot;
			listeners = /* @__PURE__ */ new Set();
			constructor() {
				const selected = new URLSearchParams(globalThis.location.search).get("pluginCenterRecovery");
				this.snapshot = selected === "failed" || selected === "recovering" ? {
					schemaVersion: 1,
					operationId: "dev-recovery-1",
					phase: selected === "failed" ? "recovery-failed" : "recovering",
					recoveryPhase: selected === "recovering" ? "recovery-restoring-profile" : null,
					operationFailureCode: "package-mutation-failed",
					recoveryReasonCode: selected === "failed" ? "runtime-verification-failed" : null,
					attempt: 1,
					updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
					canRetry: selected === "failed",
					canExportDiagnostics: true
				} : null;
			}
			getState() {
				return Promise.resolve(this.snapshot);
			}
			onState(listener) {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			}
			async retry(request) {
				if (this.snapshot === null || request.operationId !== this.snapshot.operationId) throw new Error("development recovery operation is unavailable");
				this.publish({
					...this.snapshot,
					phase: "recovering",
					recoveryPhase: "recovery-stopping-host",
					recoveryReasonCode: null,
					attempt: this.snapshot.attempt + 1,
					updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
					canRetry: false
				});
				await new Promise((resolve) => setTimeout(resolve, OPERATION_INTERVAL_MS));
				this.publish({
					...this.snapshot,
					phase: "rolled-back",
					recoveryPhase: null,
					recoveryReasonCode: null,
					updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
					canRetry: false
				});
				return this.snapshot;
			}
			exportDiagnostics(request) {
				if (this.snapshot === null || request.operationId !== this.snapshot.operationId) return Promise.reject(/* @__PURE__ */ new Error("development recovery operation is unavailable"));
				return Promise.resolve({
					operationId: request.operationId,
					status: "saved",
					filename: `dsh-plugin-recovery-${request.operationId}.json`,
					sha256: "d".repeat(64),
					bytes: 2048
				});
			}
			publish(snapshot) {
				this.snapshot = snapshot;
				for (const listener of this.listeners) listener(snapshot);
			}
		};
		/**
		* Return a fixture bridge only when the Host injected the explicit marker.
		* @returns The deterministic development bridge when explicitly enabled.
		*/
		function developmentCatalogBridge() {
			const marker = globalThis.__DSH_PLUGIN_CENTER_DEV__;
			if (marker?.version !== 1) return void 0;
			const selected = scenario();
			const installed = marker.installedRuntime ??= new DevelopmentInstalledRuntime();
			const operations = marker.operationRuntime ??= new DevelopmentOperationRuntime(installed);
			const recovery = marker.recoveryRuntime ??= new DevelopmentRecoveryRuntime();
			return {
				catalog: {
					list: (query) => selected === "error" ? rejectUnavailable() : Promise.resolve(listResult(query, selected, installed)),
					refresh: (query) => selected === "error" ? rejectUnavailable() : Promise.resolve(listResult(query, selected, installed)),
					detail: (query) => selected === "error" ? rejectUnavailable() : Promise.resolve(detailResult(query, selected)),
					checkCompatibility: (request) => selected === "error" ? rejectUnavailable() : Promise.resolve(compatibilityDecision(request, selected))
				},
				installedPlugins: { list: () => selected === "error" ? rejectUnavailable() : Promise.resolve(installed.result(operations.current())) },
				pluginOperations: {
					mutationsEnabled: true,
					install: (request) => operations.install(request),
					manage: (request) => operations.manage(request),
					getOperation: () => operations.getOperation(),
					onState: (listener) => operations.onState(listener)
				},
				pluginOwnedData: {
					getOffer: () => Promise.resolve(null),
					remove: (request) => Promise.resolve({
						operationId: request.operationId,
						pluginId: request.pluginId,
						removedPaths: request.paths
					}),
					retain: (request) => Promise.resolve({
						operationId: request.operationId,
						pluginId: request.pluginId,
						retained: true
					})
				},
				pluginRecovery: {
					getState: () => recovery.getState(),
					retry: (request) => recovery.retry(request),
					exportDiagnostics: (request) => recovery.exportDiagnostics(request),
					onState: (listener) => recovery.onState(listener)
				}
			};
		}
		//#endregion
		//#region lib/types/client/bridge.js
		/** Narrow structural reader for the fixed Electron bridge. */
		/**
		* Read the optional bridge without owning or merging the global Window type.
		* @returns The Electron catalog bridge when preload installed it.
		*/
		function desktopCatalogBridge() {
			return window.dshDesktop;
		}
		/**
		* Prefer the production Electron bridge, then the explicitly marked Web fixture.
		* @returns The selected bridge and whether it uses development data.
		*/
		function resolveCatalogBridge() {
			const desktop = desktopCatalogBridge();
			if (desktop !== void 0) return {
				bridge: desktop,
				development: false
			};
			const development = developmentCatalogBridge();
			return {
				bridge: development,
				development: development !== void 0
			};
		}
		//#endregion
		//#region \0dsh-css:./packages/client/ui-plugin-center/src/client/PluginCenterNavItem.module.css.mjs
		const css$2 = ".WvnmQq_entry{box-sizing:border-box;width:calc(100% + 8px);height:34px;color:var(--dsw-alias-label-primary);font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:10px;align-items:center;gap:8px;margin:0 -4px;padding:6px 10px;font-size:14px;line-height:22px;display:flex;overflow:hidden}.WvnmQq_entry:hover{background:var(--dsw-specific-sidebar-nav-item-hover)}.WvnmQq_entry[data-selected]{background:var(--dsw-specific-sidebar-nav-item-active)}.WvnmQq_entry:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.WvnmQq_entry span{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.WvnmQq_entry.WvnmQq_rail{border-radius:50%;justify-content:center;gap:0;width:36px;height:36px;margin:0;padding:0}";
		const tagId$2 = "@deepseek-ai/dsh-client-ui-plugin-center/PluginCenterNavItem.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-plugin-center";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var PluginCenterNavItem_module_css_default = {
			"rail": "WvnmQq_rail",
			"entry": "WvnmQq_entry"
		};
		//#endregion
		//#region lib/types/client/PluginCenterNavItem.js
		/** First-level sidebar entry that opens the independent Plugin page. */
		function PluginCenterNavItem({ wide, primaryPage, pageId, open, t }) {
			const selected = primaryPage === pageId;
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				label: t("nav"),
				delayMs: 500,
				disabled: wide,
				children: (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: `${PluginCenterNavItem_module_css_default.entry}${wide ? "" : ` ${PluginCenterNavItem_module_css_default.rail}`}`,
					"aria-current": selected ? "page" : void 0,
					"aria-label": t("nav"),
					"data-selected": selected || void 0,
					onClick: open,
					children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCordisPluginOutline14, { size: wide ? 16 : 18 }), wide ? (0, react_jsx_runtime.jsx)("span", { children: t("nav") }) : null]
				})
			});
		}
		//#endregion
		//#region lib/types/client/compatibility-copy.js
		/** Localized compatibility copy shared by catalog detail and installed management views. */
		const REASON_KEYS = {
			"catalog-metadata-invalid": "reasonCatalogMetadataInvalid",
			"catalog-unverified": "reasonCatalogUnverified",
			"version-withdrawn": "reasonVersionWithdrawn",
			"version-ineligible": "reasonVersionIneligible",
			"protected-package": "reasonProtectedPackage",
			"protected-entry": "reasonProtectedEntry",
			"desktop-version-unsupported": "reasonDesktopVersionUnsupported",
			"dsh-version-unsupported": "reasonDshVersionUnsupported",
			"node-version-unsupported": "reasonNodeVersionUnsupported",
			"platform-unsupported": "reasonPlatformUnsupported",
			"artifact-missing": "reasonArtifactMissing",
			"artifact-evidence-incomplete": "reasonArtifactEvidenceIncomplete",
			"plugin-identity-conflict": "reasonPluginIdentityConflict",
			"package-identity-conflict": "reasonPackageIdentityConflict",
			"entry-identity-conflict": "reasonEntryIdentityConflict",
			"declared-conflict": "reasonDeclaredConflict",
			"operation-busy": "reasonOperationBusy",
			"action-not-supported": "reasonActionNotSupported"
		};
		function isCompatibilityReasonCode(value) {
			return Object.hasOwn(REASON_KEYS, value);
		}
		/**
		* Resolve a structured compatibility reason to its localized copy key.
		* @param code - Stable reason code returned by the compatibility evaluator.
		* @returns Locale key for the user-facing reason label.
		*/
		function compatibilityReasonKey(code) {
			return REASON_KEYS[code];
		}
		/**
		* Replace Desktop projection reason codes with concise product copy while retaining unknown prose.
		* @param reason - Semicolon-delimited Desktop compatibility summary.
		* @param t - Plugin Center locale resolver.
		* @returns Localized summary for the installed row, or null when no reason is present.
		*/
		function installedCompatibilityReason(reason, t) {
			if (reason === null) return null;
			const labels = reason.split("; ").map((part) => {
				const separator = part.indexOf(":");
				const code = (separator === -1 ? part : part.slice(0, separator)).trim();
				return isCompatibilityReasonCode(code) ? t(REASON_KEYS[code]) : part;
			});
			return [...new Set(labels)].join("、");
		}
		//#endregion
		//#region \0dsh-css:./packages/client/ui-plugin-center/src/client/PluginCenterTab.module.css.mjs
		const css$1 = ".Y4b3va_root{background:var(--dsw-alias-bg-base);width:100%;min-width:0;min-height:0;color:var(--dsw-alias-label-primary);flex-direction:column;flex:1;display:flex;overflow:hidden}.Y4b3va_topbar{z-index:4;box-sizing:border-box;background:var(--dsw-alias-bg-base);flex:none;justify-content:space-between;align-items:center;height:48px;padding:6px 12px;display:flex;position:relative}html[data-dsh-desktop=true] .Y4b3va_topbar{-webkit-app-region:drag}html[data-dsh-desktop=true] .Y4b3va_topbar button{-webkit-app-region:no-drag}.Y4b3va_kindTabs,.Y4b3va_breadcrumbs{align-items:center;gap:4px;min-width:0;display:flex}.Y4b3va_kindTabs button,.Y4b3va_breadcrumbs button{color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:0 0;border:0;border-radius:8px;padding:5px 10px;font-size:14px;line-height:22px}.Y4b3va_kindTabs button[data-active]{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}.Y4b3va_breadcrumbs button{padding:5px 4px}.Y4b3va_breadcrumbs button:hover{color:var(--dsw-alias-label-primary)}.Y4b3va_breadcrumbs>svg{color:var(--dsw-alias-label-tertiary);flex:none}.Y4b3va_breadcrumbs>span{min-width:0;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:22px;overflow:hidden}.Y4b3va_topActions{align-items:center;display:flex}.Y4b3va_topActions button{width:30px;height:30px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:8px;justify-content:center;align-items:center;padding:0;display:inline-flex}.Y4b3va_topActions button:hover{background:var(--dsw-alias-interactive-bg-hover)}.Y4b3va_scroller{--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);flex:1;min-height:0;overflow-y:auto}.Y4b3va_content{box-sizing:border-box;width:min(874px,100% - 48px);margin:0 auto}.Y4b3va_detailPage{box-sizing:border-box;width:min(714px,100% - 48px);margin:0 auto}.Y4b3va_content{padding:12px 0 72px}.Y4b3va_header{flex-direction:column;gap:5px;padding:0 8px 14px;display:flex}.Y4b3va_header h1,.Y4b3va_header p,.Y4b3va_status,.Y4b3va_failure p,.Y4b3va_unavailable p,.Y4b3va_detailHeader h1,.Y4b3va_detailHeader p,.Y4b3va_detailDescription,.Y4b3va_detailSection p,.Y4b3va_detailSection h2,.Y4b3va_detailStatus,.Y4b3va_error,.Y4b3va_verifiedNote,.Y4b3va_note{margin:0}.Y4b3va_header h1{letter-spacing:-.35px;font-size:28px;font-weight:500;line-height:38px}.Y4b3va_header p{color:var(--dsw-alias-label-secondary);font-size:15px;line-height:23px}.Y4b3va_recoveryNotice{border:1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 28%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 5%, var(--dsw-alias-bg-layer-1));border-radius:14px;grid-template-columns:34px minmax(0,1fr) auto;align-items:flex-start;gap:12px;margin:0 0 16px;padding:14px;display:grid}.Y4b3va_recoveryNotice[data-recovery-phase=recovering]{border-color:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 28%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 5%, var(--dsw-alias-bg-layer-1))}.Y4b3va_recoveryStatusIcon{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, var(--dsw-alias-bg-layer-2));width:34px;height:34px;color:var(--dsw-alias-state-error-primary);border-radius:10px;place-items:center;display:grid}.Y4b3va_recoveryNotice[data-recovery-phase=recovering] .Y4b3va_recoveryStatusIcon{background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, var(--dsw-alias-bg-layer-2));color:var(--dsw-alias-state-warn-primary)}.Y4b3va_recoveryNotice[data-recovery-phase=recovering] .Y4b3va_recoveryStatusIcon svg{animation:1.1s linear infinite Y4b3va_recoverySpin}.Y4b3va_recoveryContent{flex-direction:column;gap:4px;min-width:0;display:flex}.Y4b3va_recoveryContent>strong{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:21px}.Y4b3va_recoveryContent>p{color:var(--dsw-alias-label-secondary);margin:0;font-size:13px;line-height:20px}.Y4b3va_recoveryMeta{flex-wrap:wrap;gap:6px;margin-top:3px;display:flex}.Y4b3va_recoveryMeta span{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-tertiary);border-radius:6px;padding:1px 6px;font-size:10px;line-height:17px}.Y4b3va_recoveryReason{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);border-radius:8px;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:8px;margin-top:4px;padding:7px 9px;font-size:11px;line-height:18px;display:grid}.Y4b3va_recoveryReasonLabel{color:var(--dsw-alias-label-tertiary)}.Y4b3va_recoveryReason code{color:var(--dsw-alias-label-tertiary);font-family:var(--dsw-font-family-mono,monospace);text-overflow:ellipsis;white-space:nowrap;font-size:10px;overflow:hidden}.Y4b3va_recoveryFeedback{color:var(--dsw-alias-label-tertiary);margin-top:2px;font-size:11px;line-height:18px}.Y4b3va_recoveryActions{flex:none;gap:8px;padding-top:2px;display:flex}@keyframes Y4b3va_recoverySpin{to{transform:rotate(360deg)}}.Y4b3va_search{z-index:3;background:var(--dsw-alias-bg-base);align-items:center;padding:8px 0 12px;display:flex;position:sticky;top:0}.Y4b3va_search>svg{color:var(--dsw-alias-label-tertiary);pointer-events:none;position:absolute;left:14px}.Y4b3va_search input{border:1px solid var(--dsw-alias-border-l2);box-sizing:border-box;background:var(--dsw-alias-bg-layer-2);width:100%;height:36px;color:var(--dsw-alias-label-primary);font:inherit;border-radius:18px;outline:none;padding:0 40px;font-size:14px;line-height:20px}.Y4b3va_search input:focus{border-color:var(--dsw-alias-border-l3);box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary) 14%, transparent)}.Y4b3va_installedSection{flex-direction:column;margin-top:4px;display:flex}.Y4b3va_installedHeading,.Y4b3va_sectionHeading{border-bottom:1px solid var(--dsw-alias-border-l2);box-sizing:border-box;justify-content:space-between;align-items:center;min-height:40px;padding:0 8px;display:flex}.Y4b3va_installedHeading h2,.Y4b3va_sectionHeading h2{margin:0;font-size:16px;font-weight:500;line-height:24px}.Y4b3va_installedHeading>button{width:30px;height:30px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:8px;justify-content:center;align-items:center;padding:0;display:inline-flex}.Y4b3va_installedHeading>button:hover,.Y4b3va_installedHeading>button[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.Y4b3va_sectionHeading>span{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.Y4b3va_installedIcons{box-sizing:border-box;align-items:center;gap:8px;min-height:60px;padding:10px 8px;display:flex}.Y4b3va_installedIcons>button{cursor:pointer;background:0 0;border:0;border-radius:10px;padding:0;display:inline-flex}.Y4b3va_installedIcons>button:hover{box-shadow:0 0 0 3px var(--dsw-alias-interactive-bg-hover)}.Y4b3va_installedEmpty{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}.Y4b3va_installedSkeleton{align-items:center;gap:8px;display:flex}.Y4b3va_installedSkeleton>span{background:var(--dsw-alias-interactive-bg-hover);border-radius:10px;width:38px;height:38px;animation:1.25s ease-in-out infinite alternate Y4b3va_plugin-center-skeleton-pulse}.Y4b3va_installedMark{border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 76%, var(--dsw-alias-bg-layer-2));width:38px;height:38px;color:var(--dsw-static-neutral-00);border-radius:10px;flex:none;place-items:center;font-size:15px;font-weight:600;display:grid;position:relative;overflow:hidden}.Y4b3va_installedMark img{object-fit:cover;width:100%;height:100%;position:absolute;inset:0}.Y4b3va_installedMark[data-source=system]{background:color-mix(in srgb, var(--dsw-alias-label-tertiary) 76%, var(--dsw-alias-bg-layer-2))}.Y4b3va_installedMark[data-source=local]{background:color-mix(in srgb, var(--dsw-alias-state-warning-primary) 70%, var(--dsw-alias-bg-layer-2))}.Y4b3va_installedRows{border-bottom:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:2px;margin:0 0 12px;padding:0 0 12px;list-style:none;display:flex}.Y4b3va_installedRow{border-radius:12px;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;gap:11px;min-width:0;padding:10px 8px;display:grid}.Y4b3va_installedRow:hover{background:var(--dsw-alias-interactive-bg-hover)}.Y4b3va_installedRowBody{flex-direction:column;gap:3px;min-width:0;display:flex}.Y4b3va_installedRowTitle,.Y4b3va_installedRowMeta,.Y4b3va_installedRowActions{flex-wrap:wrap;align-items:center;gap:5px;min-width:0;display:flex}.Y4b3va_installedRowTitle strong{font-size:14px;font-weight:500;line-height:21px}.Y4b3va_installedRowTitle span,.Y4b3va_installedRowMeta span{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-tertiary);border-radius:5px;padding:1px 5px;font-size:10px;line-height:16px}.Y4b3va_installedRowMeta span[data-runtime=running]{color:var(--dsw-alias-state-success-primary)}.Y4b3va_installedRowMeta span[data-runtime=failed]{color:var(--dsw-alias-state-error-primary)}.Y4b3va_installedRowMeta span[data-runtime=inactive]{color:var(--dsw-alias-state-warning-primary)}.Y4b3va_installedRowMeta span[data-compatibility=incompatible]{color:var(--dsw-alias-state-error-primary)}.Y4b3va_installedRowBody code{color:var(--dsw-alias-label-tertiary);font-family:var(--dsw-font-family-mono,monospace);text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:16px;overflow:hidden}.Y4b3va_installedRowActions{flex-wrap:nowrap;justify-content:flex-end}.Y4b3va_installedRowActions button,.Y4b3va_installedPanelStatus button{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:inherit;white-space:nowrap;cursor:pointer;border-radius:8px;padding:4px 8px;font-size:11px;line-height:18px}.Y4b3va_installedRowActions button:hover,.Y4b3va_installedPanelStatus button:hover{color:var(--dsw-alias-label-primary)}.Y4b3va_installedRowActions button:disabled{opacity:.42;cursor:not-allowed}.Y4b3va_installedRowActions button[data-action=uninstall]{color:var(--dsw-alias-state-error-primary)}.Y4b3va_installedPanelStatus{color:var(--dsw-alias-label-tertiary);justify-content:space-between;align-items:center;gap:12px;margin:0;padding:12px 8px 18px;font-size:12px;line-height:18px;display:flex}.Y4b3va_ownedDataChoices{border:0;gap:10px;margin:0;padding:0;display:grid}.Y4b3va_ownedDataChoices legend{color:var(--dsw-alias-label-secondary);margin-bottom:8px;font-size:12px}.Y4b3va_ownedDataChoices label{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;align-items:flex-start;gap:10px;padding:10px 12px;display:flex}.Y4b3va_ownedDataChoices label>span{gap:3px;display:grid}.Y4b3va_ownedDataChoices code{color:var(--dsw-alias-label-tertiary);font-size:11px}.Y4b3va_ownedDataResult,.Y4b3va_ownedDataFailure{border-radius:10px;margin:0;padding:12px}.Y4b3va_ownedDataResult{color:var(--dsw-alias-state-success-primary)}.Y4b3va_ownedDataFailure{color:var(--dsw-alias-state-error-primary)}.Y4b3va_toolbar{justify-content:space-between;align-items:center;gap:12px;min-height:48px;padding:0 8px;display:flex}.Y4b3va_scope{flex:none;gap:4px;display:flex}.Y4b3va_scope button{color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:0 0;border:0;border-radius:9px;padding:4px 10px;font-size:13px;line-height:22px}.Y4b3va_scope button[aria-pressed=true]{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}.Y4b3va_catalogMeta{min-width:0;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:11px;line-height:18px;overflow:hidden}.Y4b3va_catalogNotice{background:color-mix(in srgb, var(--dsw-alias-state-warning-primary) 10%, transparent);color:var(--dsw-alias-state-warning-primary);border-radius:8px;justify-content:space-between;align-items:center;margin:0 8px 12px;padding:8px 10px;font-size:12px;line-height:18px;display:flex}.Y4b3va_catalogNotice button{color:inherit;font:inherit;cursor:pointer;background:0 0;border:0;padding:0}.Y4b3va_sections{flex-direction:column;gap:26px;display:flex}.Y4b3va_catalogSection,.Y4b3va_catalogSkeleton{flex-direction:column;display:flex}.Y4b3va_skeletonHeading{border-bottom:1px solid var(--dsw-alias-border-l2);box-sizing:border-box;min-height:40px;color:var(--dsw-alias-label-tertiary);padding:9px 8px;font-size:12px;line-height:20px}.Y4b3va_skeletonCards{grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 34px;margin:0;padding:10px 0 0;list-style:none;display:grid}.Y4b3va_skeletonCard{box-sizing:border-box;grid-template-columns:40px minmax(0,1fr);align-items:center;gap:11px;min-height:66px;padding:8px;display:grid}.Y4b3va_skeletonMark,.Y4b3va_skeletonTitle,.Y4b3va_skeletonSummary{background:var(--dsw-alias-interactive-bg-hover);animation:1.25s ease-in-out infinite alternate Y4b3va_plugin-center-skeleton-pulse;display:block}.Y4b3va_skeletonMark{border-radius:10px;width:40px;height:40px}.Y4b3va_skeletonCopy{flex-direction:column;gap:7px;min-width:0;display:flex}.Y4b3va_skeletonTitle{border-radius:5px;width:min(52%,150px);height:12px}.Y4b3va_skeletonSummary{border-radius:4px;width:min(78%,230px);height:9px}@keyframes Y4b3va_plugin-center-skeleton-pulse{0%{opacity:.48}to{opacity:.9}}.Y4b3va_cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 34px;margin:0;padding:10px 0 0;list-style:none;display:grid}.Y4b3va_card{border-radius:12px;grid-template-columns:minmax(0,1fr) auto;align-items:center;min-width:0;display:grid}.Y4b3va_card:hover{background:var(--dsw-alias-interactive-bg-hover)}.Y4b3va_cardButton{box-sizing:border-box;width:100%;min-width:0;min-height:66px;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;grid-template-columns:40px minmax(0,1fr) 14px;align-items:center;gap:11px;padding:8px;display:grid}.Y4b3va_cardButton:hover{background:0 0}.Y4b3va_cardAction{white-space:nowrap;justify-self:end;min-width:68px;margin-right:10px}.Y4b3va_cardMenu{justify-self:end;margin-right:10px}.Y4b3va_cardMenuButton{width:34px;height:30px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-radius:8px;flex:none;justify-content:center;justify-self:end;align-items:center;margin-right:10px;padding:0;display:inline-flex}.Y4b3va_cardMenu .Y4b3va_cardMenuButton{margin-right:0}.Y4b3va_cardMenuButton:hover:not(:disabled),.Y4b3va_cardMenuButton[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.Y4b3va_cardMenuButton:disabled{opacity:.4;cursor:not-allowed}.Y4b3va_catalogMark,.Y4b3va_detailMark{border:1px solid var(--dsw-alias-border-l2);box-sizing:border-box;background:var(--dsw-alias-state-business-primary);width:40px;height:40px;color:var(--dsw-static-neutral-00);border-radius:10px;flex:none;place-items:center;font-size:16px;font-weight:600;display:grid;position:relative;overflow:hidden}.Y4b3va_catalogMark img,.Y4b3va_detailMark img{object-fit:cover;width:100%;height:100%;position:absolute;inset:0}.Y4b3va_compactMark{border-radius:9px;width:34px;height:34px;font-size:14px}.Y4b3va_cardCopy{flex-direction:column;gap:2px;min-width:0;display:flex}.Y4b3va_cardCopy strong{text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:500;line-height:21px;overflow:hidden}.Y4b3va_cardSummary{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:19px;overflow:hidden}.Y4b3va_cardChevron{color:var(--dsw-alias-label-tertiary);opacity:0;transition:opacity .12s}.Y4b3va_cardButton:hover .Y4b3va_cardChevron,.Y4b3va_cardButton:focus-visible .Y4b3va_cardChevron{opacity:1}.Y4b3va_kindTabs button:focus-visible,.Y4b3va_breadcrumbs button:focus-visible,.Y4b3va_topActions button:focus-visible,.Y4b3va_installedIcons button:focus-visible,.Y4b3va_scope button:focus-visible,.Y4b3va_cardButton:focus-visible,.Y4b3va_cardAction:focus-visible,.Y4b3va_cardMenuButton:focus-visible,.Y4b3va_failure button:focus-visible,.Y4b3va_catalogNotice button:focus-visible,.Y4b3va_recoveryActions button:focus-visible,.Y4b3va_installAction:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.Y4b3va_status,.Y4b3va_failure,.Y4b3va_unavailable,.Y4b3va_detailStatus,.Y4b3va_error{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}.Y4b3va_status,.Y4b3va_failure{margin:8px}.Y4b3va_failure{color:var(--dsw-alias-state-error-primary);align-items:center;gap:10px;display:flex}.Y4b3va_failure button{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;background:0 0;border-radius:7px;padding:4px 10px}.Y4b3va_unavailable{border:1px solid var(--dsw-alias-border-l2);box-sizing:border-box;background:var(--dsw-alias-bg-layer-2);border-radius:12px;flex-direction:column;align-self:center;gap:5px;width:min(640px,100% - 48px);margin:auto;padding:16px;display:flex}.Y4b3va_unavailable strong{color:var(--dsw-alias-label-primary)}.Y4b3va_detailPage{flex-direction:column;gap:22px;padding:16px 8px 72px;display:flex}.Y4b3va_detailStatus,.Y4b3va_error{padding-top:24px}.Y4b3va_error{color:var(--dsw-alias-state-error-primary)}.Y4b3va_detailHeader{grid-template-columns:58px minmax(0,1fr);align-items:center;gap:16px;display:grid}.Y4b3va_detailMark{border-radius:15px;width:58px;height:58px;font-size:22px}.Y4b3va_detailTitleRow{justify-content:space-between;align-items:flex-start;gap:20px;min-width:0;display:flex}.Y4b3va_detailTitleRow>div{min-width:0}.Y4b3va_detailHeaderActions{flex:none;align-items:center;gap:8px;display:flex}.Y4b3va_detailHeader h1{font-size:24px;font-weight:500;line-height:32px}.Y4b3va_detailHeader p{color:var(--dsw-alias-label-secondary);margin-top:3px;font-size:14px;line-height:22px}.Y4b3va_detailStatusBadge{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);border-radius:9px;flex:none;padding:5px 10px;font-size:12px;line-height:18px}.Y4b3va_detailStatusBadge[data-withdrawn]{border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 38%, var(--dsw-alias-border-l2));color:var(--dsw-alias-state-error-primary)}.Y4b3va_detailMedia{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;display:grid}.Y4b3va_detailMedia img{border:1px solid var(--dsw-alias-border-l2);object-fit:cover;border-radius:12px;width:100%;height:auto;max-height:320px}.Y4b3va_detailDescription{color:var(--dsw-alias-label-secondary);font-size:14px;line-height:23px}.Y4b3va_detailSection{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:10px;padding-top:18px;display:flex}.Y4b3va_detailSection h2{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:500;line-height:23px}.Y4b3va_detailSection h3{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;font-weight:500;line-height:19px}.Y4b3va_detailSection p,.Y4b3va_detailList{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:21px}.Y4b3va_detailFacts{grid-template-columns:repeat(2,minmax(0,1fr));gap:1px 24px;margin:0;display:grid}.Y4b3va_detailFacts div{border-bottom:1px solid var(--dsw-alias-border-l2);justify-content:space-between;align-items:baseline;gap:16px;min-width:0;padding:9px 0;display:flex}.Y4b3va_detailFacts dt{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.Y4b3va_detailFacts dd{min-width:0;color:var(--dsw-alias-label-primary);text-align:right;text-overflow:ellipsis;white-space:nowrap;margin:0;font-size:12px;line-height:18px;overflow:hidden}.Y4b3va_verifiedNote,.Y4b3va_note{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);border-radius:9px;padding:9px 11px;font-size:12px;line-height:19px}.Y4b3va_verifiedNote[data-verified=true] strong{color:var(--dsw-alias-state-success-primary)}.Y4b3va_preflightSection{gap:14px}.Y4b3va_preflightHeading{justify-content:space-between;align-items:flex-start;gap:20px;display:flex}.Y4b3va_preflightHeading>div{min-width:0}.Y4b3va_preflightHeading p{color:var(--dsw-alias-label-tertiary);margin-top:2px;font-size:12px;line-height:19px}.Y4b3va_preflightStatus{border:1px solid var(--dsw-alias-border-l2);box-sizing:border-box;background:var(--dsw-alias-bg-layer-2);border-radius:12px;align-items:flex-start;gap:10px;min-height:54px;padding:11px 12px;display:flex}.Y4b3va_preflightStatus>:first-child{margin-top:5px}.Y4b3va_preflightStatus>div{flex-direction:column;gap:2px;min-width:0;display:flex}.Y4b3va_preflightStatus strong{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:20px}.Y4b3va_preflightStatus span{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:19px}.Y4b3va_preflightStatus[data-state=allowed]{border-color:color-mix(in srgb, var(--dsw-alias-state-success-primary) 20%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 6%, var(--dsw-alias-bg-base))}.Y4b3va_preflightStatus[data-state=blocked],.Y4b3va_preflightStatus[data-state=error]{border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 20%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 6%, var(--dsw-alias-bg-base))}.Y4b3va_denials{flex-direction:column;gap:7px;display:flex}.Y4b3va_denials ol{flex-direction:column;gap:0;margin:0;padding:0;list-style:none;display:flex}.Y4b3va_denials li{border-bottom:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);grid-template-columns:22px minmax(0,1fr);gap:9px;padding:9px 0;font-size:12px;line-height:19px;display:grid}.Y4b3va_denials li>span:last-child,.Y4b3va_denials li strong,.Y4b3va_denials li code{display:block}.Y4b3va_denials li code{color:var(--dsw-alias-label-tertiary);font-family:var(--ds-font-family-code);font-size:11px}.Y4b3va_denialIndex{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);width:20px;height:20px;color:var(--dsw-alias-state-error-primary);font-variant-numeric:tabular-nums;border-radius:50%;justify-content:center;align-items:center;font-size:11px;display:inline-flex}.Y4b3va_environmentBlock{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);border-radius:10px;overflow:hidden}.Y4b3va_environmentBlock summary{min-height:38px;color:var(--dsw-alias-label-secondary);cursor:pointer;justify-content:space-between;align-items:center;gap:12px;padding:0 12px;font-size:12px;font-weight:500;line-height:18px;list-style:none;display:flex}.Y4b3va_environmentBlock summary::-webkit-details-marker{display:none}.Y4b3va_environmentSummaryMeta{color:var(--dsw-alias-label-tertiary);font-family:var(--ds-font-family-code);align-items:center;gap:5px;font-size:11px;font-weight:400;display:inline-flex}.Y4b3va_environmentSummaryMeta svg{transition:transform .12s}.Y4b3va_environmentBlock[open] .Y4b3va_environmentSummaryMeta svg{transform:rotate(90deg)}.Y4b3va_environmentBlock summary:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}.Y4b3va_environmentBlock[open] summary{border-bottom:1px solid var(--dsw-alias-border-l2)}.Y4b3va_environmentBlock .Y4b3va_preflightFacts{padding:0 12px 8px}.Y4b3va_preflightFacts dd{font-variant-numeric:tabular-nums}.Y4b3va_authorityWarning{border:1px solid color-mix(in srgb, var(--dsw-alias-state-warning-primary) 24%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-warning-primary) 6%, transparent);border-radius:10px;grid-template-columns:18px minmax(0,1fr);gap:9px;padding:10px 11px;display:grid}.Y4b3va_authorityWarning>svg{color:var(--dsw-alias-state-warning-primary);margin-top:2px}.Y4b3va_authorityWarning>span,.Y4b3va_authorityWarning strong,.Y4b3va_authorityWarning span span{display:block}.Y4b3va_authorityWarning strong{color:var(--dsw-alias-label-primary);font-size:12px;font-weight:500;line-height:19px}.Y4b3va_authorityWarning span span{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:19px}.Y4b3va_preflightFootnote{color:var(--dsw-alias-label-tertiary)!important;font-size:11px!important;line-height:18px!important}.Y4b3va_installAction{flex:none;min-width:84px}.Y4b3va_installConfirmDialog{width:min(430px,100%)}.Y4b3va_installConfirmContent{padding-bottom:2px}.Y4b3va_installSummary{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);border-radius:12px;flex-direction:column;margin:0;display:flex;overflow:hidden}.Y4b3va_installSummary div{border-bottom:1px solid var(--dsw-alias-border-l2);justify-content:space-between;align-items:center;gap:16px;min-height:38px;padding:0 12px;display:flex}.Y4b3va_installSummary div:last-child{border-bottom:0}.Y4b3va_installSummary dt,.Y4b3va_installSummary dd{margin:0;font-size:12px;line-height:18px}.Y4b3va_installSummary dt{color:var(--dsw-alias-label-tertiary)}.Y4b3va_installSummary dd{color:var(--dsw-alias-label-primary);text-align:right;font-weight:500}.Y4b3va_confirmWarning{background:color-mix(in srgb, var(--dsw-alias-state-warning-primary) 7%, transparent);border-radius:12px;grid-template-columns:18px minmax(0,1fr);gap:10px;margin-top:12px;padding:11px 12px;display:grid}.Y4b3va_confirmWarning>svg{color:var(--dsw-alias-state-warning-primary);margin-top:2px}.Y4b3va_confirmWarning>span,.Y4b3va_confirmWarning strong,.Y4b3va_confirmWarning span span{display:block}.Y4b3va_confirmWarning strong{color:var(--dsw-alias-label-primary);font-size:12px;font-weight:500;line-height:19px}.Y4b3va_confirmWarning span span{color:var(--dsw-alias-label-secondary);margin-top:2px;font-size:12px;line-height:19px}.Y4b3va_installAcknowledgement{color:var(--dsw-alias-label-secondary);cursor:pointer;grid-template-columns:16px minmax(0,1fr);align-items:flex-start;gap:9px;margin-top:14px;font-size:12px;line-height:19px;display:grid}.Y4b3va_installAcknowledgement input{width:15px;height:15px;accent-color:var(--dsw-alias-state-business-primary);margin:2px 0 0}.Y4b3va_installAcknowledgement input:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.Y4b3va_installProgressDialog{gap:0;width:min(430px,100%);padding:0}.Y4b3va_installProgressContent{flex-direction:column;padding:24px;display:flex}.Y4b3va_installProgressHeader{grid-template-columns:38px minmax(0,1fr);align-items:flex-start;gap:13px;display:grid}.Y4b3va_installProgressState{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent);width:36px;height:36px;color:var(--dsw-alias-state-business-primary);border-radius:12px;justify-content:center;align-items:center;display:inline-flex}.Y4b3va_installProgressState[data-state=done]{background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, transparent);color:var(--dsw-alias-state-success-primary)}.Y4b3va_installProgressState[data-state=failed]{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);color:var(--dsw-alias-state-error-primary)}.Y4b3va_installProgressHeader h2,.Y4b3va_installProgressHeader p{margin:0}.Y4b3va_installTarget{color:var(--dsw-alias-label-tertiary);font-family:var(--ds-font-family-code);text-overflow:ellipsis;white-space:nowrap;margin-bottom:2px;font-size:11px;line-height:17px;display:block;overflow:hidden}.Y4b3va_installProgressHeader h2{color:var(--dsw-alias-label-primary);font-size:17px;font-weight:500;line-height:25px}.Y4b3va_installProgressHeader p{color:var(--dsw-alias-label-secondary);margin-top:3px;font-size:12px;line-height:19px}.Y4b3va_installProgressSteps{flex-direction:column;gap:0;margin:22px 0 0 17px;padding:0;list-style:none;display:flex}.Y4b3va_installProgressSteps li{min-height:38px;color:var(--dsw-alias-label-tertiary);grid-template-columns:20px minmax(0,1fr);align-items:flex-start;gap:10px;font-size:13px;line-height:20px;display:grid;position:relative}.Y4b3va_installProgressSteps li:not(:last-child):after{background:var(--dsw-alias-border-l2);content:\"\";width:1px;position:absolute;top:20px;bottom:0;left:9px}.Y4b3va_installStepMarker{z-index:1;border:1px solid var(--dsw-alias-border-l2);box-sizing:border-box;background:var(--dsw-alias-bg-layer-2);border-radius:50%;justify-content:center;align-items:center;width:20px;height:20px;display:inline-flex;position:relative}.Y4b3va_installProgressSteps li[data-state=done]{color:var(--dsw-alias-label-secondary)}.Y4b3va_installProgressSteps li[data-state=done] .Y4b3va_installStepMarker{border-color:color-mix(in srgb, var(--dsw-alias-state-success-primary) 35%, var(--dsw-alias-border-l2));color:var(--dsw-alias-state-success-primary)}.Y4b3va_installProgressSteps li[data-state=current]{color:var(--dsw-alias-label-primary);font-weight:500}.Y4b3va_installProgressSteps li[data-state=current] .Y4b3va_installStepMarker{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 40%, var(--dsw-alias-border-l2))}.Y4b3va_installProgressHint{color:var(--dsw-alias-label-tertiary);margin:2px 0 0 47px;font-size:11px;line-height:18px}.Y4b3va_installFailure{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 7%, transparent);border-radius:12px;flex-direction:column;gap:3px;margin-top:20px;padding:11px 12px;display:flex}.Y4b3va_installFailure strong{color:var(--dsw-alias-label-primary);font-size:12px;font-weight:500;line-height:19px}.Y4b3va_installFailure span{color:var(--dsw-alias-state-error-primary);font-size:11px;line-height:18px}.Y4b3va_installProgressFooter{justify-content:flex-end;margin-top:22px;display:flex}.Y4b3va_operationRequestError{margin:0;color:var(--dsw-alias-state-error-primary)!important;font-size:12px!important;line-height:19px!important}.Y4b3va_chips,.Y4b3va_detailList{margin:0;padding:0;list-style:none}.Y4b3va_chips{flex-wrap:wrap;gap:6px;display:flex}.Y4b3va_chips li{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);border-radius:7px;padding:4px 8px;font-size:12px;line-height:18px}.Y4b3va_detailList{flex-direction:column;gap:6px;display:flex}.Y4b3va_detailList li{padding-left:14px;position:relative}.Y4b3va_detailList li:before{color:var(--dsw-alias-label-tertiary);content:\"•\";position:absolute;top:0;left:0}.Y4b3va_visuallyHidden{clip:rect(0 0 0 0);white-space:nowrap;clip-path:inset(50%);width:1px;height:1px;position:absolute;overflow:hidden}@media (prefers-reduced-motion:reduce){.Y4b3va_cardChevron,.Y4b3va_environmentSummaryMeta svg{transition:none}.Y4b3va_recoveryStatusIcon svg,.Y4b3va_installedSkeleton>span,.Y4b3va_skeletonMark,.Y4b3va_skeletonTitle,.Y4b3va_skeletonSummary{animation:none}}@media (width<=980px){.Y4b3va_installedRow{grid-template-columns:38px minmax(0,1fr);align-items:start}.Y4b3va_installedRowActions{flex-wrap:wrap;grid-column:2;justify-content:flex-start}}@media (width<=760px){.Y4b3va_content,.Y4b3va_detailPage{width:calc(100% - 28px)}.Y4b3va_cards,.Y4b3va_skeletonCards,.Y4b3va_detailMedia,.Y4b3va_detailFacts{grid-template-columns:1fr}.Y4b3va_detailTitleRow{flex-direction:column}.Y4b3va_detailHeaderActions{justify-content:space-between;width:100%}.Y4b3va_catalogMeta{display:none}.Y4b3va_recoveryNotice{grid-template-columns:34px minmax(0,1fr)}.Y4b3va_recoveryActions{flex-wrap:wrap;grid-column:2}}";
		const tagId$1 = "@deepseek-ai/dsh-client-ui-plugin-center/PluginCenterTab.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-plugin-center";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var PluginCenterTab_module_css_default = {
			"detailTitleRow": "Y4b3va_detailTitleRow",
			"cardAction": "Y4b3va_cardAction",
			"recoveryNotice": "Y4b3va_recoveryNotice",
			"error": "Y4b3va_error",
			"detailFacts": "Y4b3va_detailFacts",
			"detailHeaderActions": "Y4b3va_detailHeaderActions",
			"kindTabs": "Y4b3va_kindTabs",
			"recoveryFeedback": "Y4b3va_recoveryFeedback",
			"skeletonHeading": "Y4b3va_skeletonHeading",
			"scroller": "Y4b3va_scroller",
			"installedRow": "Y4b3va_installedRow",
			"skeletonTitle": "Y4b3va_skeletonTitle",
			"detailMark": "Y4b3va_detailMark",
			"installedRowMeta": "Y4b3va_installedRowMeta",
			"detailList": "Y4b3va_detailList",
			"authorityWarning": "Y4b3va_authorityWarning",
			"installedSkeleton": "Y4b3va_installedSkeleton",
			"installedPanelStatus": "Y4b3va_installedPanelStatus",
			"cards": "Y4b3va_cards",
			"installProgressHeader": "Y4b3va_installProgressHeader",
			"skeletonCards": "Y4b3va_skeletonCards",
			"cardChevron": "Y4b3va_cardChevron",
			"chips": "Y4b3va_chips",
			"recoveryReason": "Y4b3va_recoveryReason",
			"recoveryMeta": "Y4b3va_recoveryMeta",
			"installedRowActions": "Y4b3va_installedRowActions",
			"toolbar": "Y4b3va_toolbar",
			"installStepMarker": "Y4b3va_installStepMarker",
			"preflightSection": "Y4b3va_preflightSection",
			"cardMenu": "Y4b3va_cardMenu",
			"skeletonMark": "Y4b3va_skeletonMark",
			"recoveryReasonLabel": "Y4b3va_recoveryReasonLabel",
			"detailStatus": "Y4b3va_detailStatus",
			"catalogMeta": "Y4b3va_catalogMeta",
			"compactMark": "Y4b3va_compactMark",
			"installTarget": "Y4b3va_installTarget",
			"installedRows": "Y4b3va_installedRows",
			"catalogNotice": "Y4b3va_catalogNotice",
			"cardButton": "Y4b3va_cardButton",
			"installedRowTitle": "Y4b3va_installedRowTitle",
			"installedSection": "Y4b3va_installedSection",
			"verifiedNote": "Y4b3va_verifiedNote",
			"root": "Y4b3va_root",
			"installedIcons": "Y4b3va_installedIcons",
			"catalogSection": "Y4b3va_catalogSection",
			"catalogSkeleton": "Y4b3va_catalogSkeleton",
			"cardCopy": "Y4b3va_cardCopy",
			"detailStatusBadge": "Y4b3va_detailStatusBadge",
			"preflightFacts": "Y4b3va_preflightFacts",
			"installProgressContent": "Y4b3va_installProgressContent",
			"installProgressState": "Y4b3va_installProgressState",
			"installConfirmDialog": "Y4b3va_installConfirmDialog",
			"unavailable": "Y4b3va_unavailable",
			"installSummary": "Y4b3va_installSummary",
			"installProgressSteps": "Y4b3va_installProgressSteps",
			"detailDescription": "Y4b3va_detailDescription",
			"installProgressFooter": "Y4b3va_installProgressFooter",
			"breadcrumbs": "Y4b3va_breadcrumbs",
			"installProgressHint": "Y4b3va_installProgressHint",
			"visuallyHidden": "Y4b3va_visuallyHidden",
			"detailHeader": "Y4b3va_detailHeader",
			"sections": "Y4b3va_sections",
			"installedMark": "Y4b3va_installedMark",
			"ownedDataChoices": "Y4b3va_ownedDataChoices",
			"header": "Y4b3va_header",
			"installedRowBody": "Y4b3va_installedRowBody",
			"skeletonCard": "Y4b3va_skeletonCard",
			"sectionHeading": "Y4b3va_sectionHeading",
			"denials": "Y4b3va_denials",
			"note": "Y4b3va_note",
			"detailMedia": "Y4b3va_detailMedia",
			"denialIndex": "Y4b3va_denialIndex",
			"environmentBlock": "Y4b3va_environmentBlock",
			"preflightFootnote": "Y4b3va_preflightFootnote",
			"detailSection": "Y4b3va_detailSection",
			"installedEmpty": "Y4b3va_installedEmpty",
			"preflightStatus": "Y4b3va_preflightStatus",
			"detailPage": "Y4b3va_detailPage",
			"ownedDataResult": "Y4b3va_ownedDataResult",
			"installAction": "Y4b3va_installAction",
			"installedHeading": "Y4b3va_installedHeading",
			"environmentSummaryMeta": "Y4b3va_environmentSummaryMeta",
			"installProgressDialog": "Y4b3va_installProgressDialog",
			"status": "Y4b3va_status",
			"recoveryStatusIcon": "Y4b3va_recoveryStatusIcon",
			"skeletonSummary": "Y4b3va_skeletonSummary",
			"content": "Y4b3va_content",
			"topActions": "Y4b3va_topActions",
			"plugin-center-skeleton-pulse": "Y4b3va_plugin-center-skeleton-pulse",
			"catalogMark": "Y4b3va_catalogMark",
			"installConfirmContent": "Y4b3va_installConfirmContent",
			"topbar": "Y4b3va_topbar",
			"search": "Y4b3va_search",
			"scope": "Y4b3va_scope",
			"failure": "Y4b3va_failure",
			"recoveryActions": "Y4b3va_recoveryActions",
			"preflightHeading": "Y4b3va_preflightHeading",
			"installAcknowledgement": "Y4b3va_installAcknowledgement",
			"recoveryContent": "Y4b3va_recoveryContent",
			"card": "Y4b3va_card",
			"operationRequestError": "Y4b3va_operationRequestError",
			"confirmWarning": "Y4b3va_confirmWarning",
			"installFailure": "Y4b3va_installFailure",
			"ownedDataFailure": "Y4b3va_ownedDataFailure",
			"skeletonCopy": "Y4b3va_skeletonCopy",
			"cardMenuButton": "Y4b3va_cardMenuButton",
			"recoverySpin": "Y4b3va_recoverySpin",
			"cardSummary": "Y4b3va_cardSummary"
		};
		//#endregion
		//#region lib/types/client/PluginInstallDialogs.js
		const ignoreClose = () => {};
		const MANAGEMENT_TITLE_KEYS = {
			update: "confirmUpdateTitle",
			enable: "confirmEnableTitle",
			disable: "confirmDisableTitle",
			uninstall: "confirmUninstallTitle"
		};
		const MANAGEMENT_INTRO_KEYS = {
			update: "confirmUpdateIntro",
			enable: "confirmEnableIntro",
			disable: "confirmDisableIntro",
			uninstall: "confirmUninstallIntro"
		};
		const MANAGEMENT_ACKNOWLEDGEMENT_KEYS = {
			update: "confirmUpdateAcknowledge",
			enable: "confirmEnableAcknowledge",
			disable: "confirmDisableAcknowledge",
			uninstall: "confirmUninstallAcknowledge"
		};
		const MANAGEMENT_ACTION_KEYS$1 = {
			update: "updatePlugin",
			enable: "enablePlugin",
			disable: "disablePlugin",
			uninstall: "uninstallPlugin"
		};
		const MANAGEMENT_COMPLETE_KEYS = {
			update: "updateComplete",
			enable: "enableComplete",
			disable: "disableComplete",
			uninstall: "uninstallComplete"
		};
		const MANAGEMENT_COMMITTED_KEYS = {
			update: "updateCommitted",
			enable: "enableCommitted",
			disable: "disableCommitted",
			uninstall: "uninstallCommitted"
		};
		function progressState(phase, groupIndex) {
			if (phase === "committed") return "done";
			const currentIndex = PLUGIN_OPERATION_PHASES.indexOf(phase);
			const phases = PLUGIN_OPERATION_GROUPS[groupIndex]?.phases ?? [];
			const firstIndex = PLUGIN_OPERATION_PHASES.indexOf(phases[0] ?? "preflight");
			if (currentIndex > PLUGIN_OPERATION_PHASES.indexOf(phases.at(-1) ?? "preflight")) return "done";
			if (currentIndex >= firstIndex) return "current";
			return "pending";
		}
		/**
		* Ask for one explicit acknowledgement before sending a trusted install intent.
		* @param props - Exact catalog version, compatibility decision, and controlled actions.
		* @returns The controlled confirmation modal.
		*/
		function PluginInstallConfirmation({ open, entry, decision, acknowledged, onAcknowledgedChange, onCancel, onConfirm, t }) {
			return (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open,
				onClose: onCancel,
				title: `${t("confirmInstallTitle")} · ${entry.displayName}`,
				closeLabel: t("close"),
				description: t("confirmInstallIntro"),
				className: PluginCenterTab_module_css_default.installConfirmDialog ?? "",
				contentClassName: PluginCenterTab_module_css_default.installConfirmContent ?? "",
				footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					onClick: onCancel,
					children: t("cancel")
				}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					disabled: !acknowledged,
					onClick: onConfirm,
					children: t("confirmInstall")
				})] }),
				children: [
					(0, react_jsx_runtime.jsxs)("dl", {
						className: PluginCenterTab_module_css_default.installSummary,
						children: [
							(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("publisher") }), (0, react_jsx_runtime.jsx)("dd", { children: entry.publisher })] }),
							(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("confirmInstallVersion") }), (0, react_jsx_runtime.jsx)("dd", { children: entry.version })] }),
							(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("restartRequired") }), (0, react_jsx_runtime.jsx)("dd", { children: t(decision.restartRequired ? "restartYes" : "restartNo") })] })
						]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: PluginCenterTab_module_css_default.confirmWarning,
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, {
							size: 16,
							"aria-hidden": "true"
						}), (0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsx)("strong", { children: t("authorityTitle") }), (0, react_jsx_runtime.jsx)("span", { children: t("confirmInstallAuthority") })] })]
					}),
					(0, react_jsx_runtime.jsxs)("label", {
						className: PluginCenterTab_module_css_default.installAcknowledgement,
						children: [(0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: acknowledged,
							autoFocus: true,
							onChange: (event) => {
								onAcknowledgedChange(event.currentTarget.checked);
							}
						}), (0, react_jsx_runtime.jsx)("span", { children: t("confirmInstallAcknowledge") })]
					})
				]
			});
		}
		/** Confirm one installed-item mutation without folding owned-data deletion into uninstall. */
		function PluginManagementConfirmation({ open, item, action, acknowledged, onAcknowledgedChange, onCancel, onConfirm, t }) {
			const targetVersion = action === "update" ? item.update?.version ?? null : item.version;
			return (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open,
				onClose: onCancel,
				title: `${t(MANAGEMENT_TITLE_KEYS[action])} · ${item.displayName}`,
				closeLabel: t("close"),
				description: t(MANAGEMENT_INTRO_KEYS[action]),
				className: PluginCenterTab_module_css_default.installConfirmDialog ?? "",
				contentClassName: PluginCenterTab_module_css_default.installConfirmContent ?? "",
				footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					onClick: onCancel,
					children: t("cancel")
				}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					disabled: !acknowledged,
					onClick: onConfirm,
					children: t(MANAGEMENT_ACTION_KEYS$1[action])
				})] }),
				children: [
					(0, react_jsx_runtime.jsxs)("dl", {
						className: PluginCenterTab_module_css_default.installSummary,
						children: [
							(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("currentVersion") }), (0, react_jsx_runtime.jsx)("dd", { children: item.version ?? t("versionUnknown") })] }),
							action === "update" ? (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("targetVersion") }), (0, react_jsx_runtime.jsx)("dd", { children: targetVersion })] }) : null,
							(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("restartRequired") }), (0, react_jsx_runtime.jsx)("dd", { children: t("restartYes") })] })
						]
					}),
					action === "update" && item.update !== null ? (0, react_jsx_runtime.jsxs)("div", {
						className: PluginCenterTab_module_css_default.confirmWarning,
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, {
							size: 16,
							"aria-hidden": "true"
						}), (0, react_jsx_runtime.jsxs)("span", { children: [
							(0, react_jsx_runtime.jsx)("strong", { children: t("riskChange") }),
							(0, react_jsx_runtime.jsx)("span", { children: item.update.changelog }),
							(0, react_jsx_runtime.jsx)("span", { children: item.update.riskSummary })
						] })]
					}) : null,
					action === "uninstall" ? (0, react_jsx_runtime.jsxs)("div", {
						className: PluginCenterTab_module_css_default.confirmWarning,
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, {
							size: 16,
							"aria-hidden": "true"
						}), (0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsx)("strong", { children: t("configurationRetained") }), (0, react_jsx_runtime.jsx)("span", { children: t("ownedDataRetained") })] })]
					}) : null,
					(0, react_jsx_runtime.jsxs)("label", {
						className: PluginCenterTab_module_css_default.installAcknowledgement,
						children: [(0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: acknowledged,
							autoFocus: true,
							onChange: (event) => {
								onAcknowledgedChange(event.currentTarget.checked);
							}
						}), (0, react_jsx_runtime.jsx)("span", { children: t(MANAGEMENT_ACKNOWLEDGEMENT_KEYS[action]) })]
					})
				]
			});
		}
		/**
		* Keep uninstall separate from the optional permanent deletion of declared plugin-owned data.
		* @param props - Controlled declarations, selection, acknowledgement, progress, and actions.
		* @returns The post-uninstall deletion modal.
		*/
		function PluginOwnedDataRemovalConfirmation({ open, displayName, declarations, selectedPaths, acknowledged, status, retaining, removedCount, onSelectionChange, onAcknowledgedChange, onRetain, onRemove, onDone, t }) {
			const busy = status === "removing" || retaining;
			const toggle = (path, selected) => {
				onSelectionChange(selected ? [...selectedPaths, path] : selectedPaths.filter((value) => value !== path));
			};
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open,
				onClose: busy ? ignoreClose : status === "removed" ? onDone : onRetain,
				title: `${t("ownedDataRemovalTitle")} · ${displayName}`,
				closeLabel: t("close"),
				description: t("ownedDataRemovalIntro"),
				className: PluginCenterTab_module_css_default.installConfirmDialog ?? "",
				contentClassName: PluginCenterTab_module_css_default.installConfirmContent ?? "",
				footer: status === "removed" ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					onClick: onDone,
					children: t("done")
				}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					disabled: busy,
					onClick: onRetain,
					children: t("retainOwnedData")
				}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					disabled: busy || !acknowledged || selectedPaths.length === 0,
					onClick: onRemove,
					children: status === "removing" ? t("removingOwnedData") : t("removeSelectedOwnedData")
				})] }),
				children: status === "removed" ? (0, react_jsx_runtime.jsxs)("p", {
					className: PluginCenterTab_module_css_default.ownedDataResult,
					role: "status",
					children: [
						t("ownedDataRemoved"),
						" ",
						removedCount
					]
				}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: PluginCenterTab_module_css_default.confirmWarning,
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, {
							size: 16,
							"aria-hidden": "true"
						}), (0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsx)("strong", { children: t("ownedDataPermanentTitle") }), (0, react_jsx_runtime.jsx)("span", { children: t("ownedDataPermanentWarning") })] })]
					}),
					(0, react_jsx_runtime.jsxs)("fieldset", {
						className: PluginCenterTab_module_css_default.ownedDataChoices,
						disabled: busy,
						children: [(0, react_jsx_runtime.jsx)("legend", { children: t("selectOwnedData") }), declarations.map((declaration) => (0, react_jsx_runtime.jsxs)("label", { children: [(0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: selectedPaths.includes(declaration.path),
							onChange: (event) => {
								toggle(declaration.path, event.currentTarget.checked);
							}
						}), (0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsx)("strong", { children: declaration.label }), (0, react_jsx_runtime.jsx)("code", { children: declaration.path })] })] }, declaration.path))]
					}),
					(0, react_jsx_runtime.jsxs)("label", {
						className: PluginCenterTab_module_css_default.installAcknowledgement,
						children: [(0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: acknowledged,
							disabled: busy,
							onChange: (event) => {
								onAcknowledgedChange(event.currentTarget.checked);
							}
						}), (0, react_jsx_runtime.jsx)("span", { children: t("confirmOwnedDataRemoval") })]
					}),
					status === "failed" ? (0, react_jsx_runtime.jsx)("p", {
						className: PluginCenterTab_module_css_default.ownedDataFailure,
						role: "alert",
						children: t("ownedDataRemovalFailed")
					}) : null
				] })
			});
		}
		/**
		* Present one restored Desktop operation as a compact, modal progress journey.
		* @param props - Controlled operation visibility, snapshot, close action, and copy.
		* @returns The active or terminal operation modal.
		*/
		function PluginOperationDialog({ open, operation, installedItem, onClose, t }) {
			if (operation === null) return null;
			const phase = operation.phase;
			if (!isTrustedInstallPhase(phase)) return null;
			const terminal = isTerminalOperationPhase(phase);
			const failed = phase === "failed";
			const committed = phase === "committed";
			const managementAction = operation.action === "install" ? null : operation.action;
			const clientUiLoaded = installedItem !== null && installedItem.pluginId === operation.pluginId && installedItem.version === operation.version && installedItem.runtime.clientModules.length > 0;
			const title = managementAction !== null ? committed ? t(MANAGEMENT_COMPLETE_KEYS[managementAction]) : failed ? t("managementFailed") : t("managementProgress") : committed ? t("installationComplete") : failed ? t("installationFailed") : t("installationProgress");
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open,
				onClose: terminal ? onClose : ignoreClose,
				title,
				headless: true,
				className: PluginCenterTab_module_css_default.installProgressDialog ?? "",
				children: (0, react_jsx_runtime.jsxs)("section", {
					className: PluginCenterTab_module_css_default.installProgressContent,
					"aria-live": "polite",
					"data-plugin-operation-phase": phase,
					children: [
						(0, react_jsx_runtime.jsxs)("header", {
							className: PluginCenterTab_module_css_default.installProgressHeader,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: PluginCenterTab_module_css_default.installProgressState,
								"data-state": failed ? "failed" : committed ? "done" : "active",
								children: failed ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, {
									size: 18,
									"aria-hidden": "true"
								}) : committed ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, {
									size: 18,
									"aria-hidden": "true"
								}) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, {
									state: "ongoing",
									size: 14
								})
							}), (0, react_jsx_runtime.jsxs)("div", { children: [
								(0, react_jsx_runtime.jsxs)("span", {
									className: PluginCenterTab_module_css_default.installTarget,
									children: [
										operation.pluginId,
										"@",
										operation.version
									]
								}),
								(0, react_jsx_runtime.jsx)("h2", { children: title }),
								(0, react_jsx_runtime.jsx)("p", { children: managementAction !== null ? committed ? t(MANAGEMENT_COMMITTED_KEYS[managementAction]) : failed ? t("managementOperationFailed") : t("managementInProgress") : committed ? t(clientUiLoaded ? "operationCommittedClient" : "operationCommitted") : failed ? t("operationFailed") : t(PLUGIN_OPERATION_PHASE_KEYS[phase]) })
							] })]
						}),
						failed ? (0, react_jsx_runtime.jsxs)("div", {
							className: PluginCenterTab_module_css_default.installFailure,
							role: "alert",
							children: [(0, react_jsx_runtime.jsx)("strong", { children: t("operationNeedsRecovery") }), (0, react_jsx_runtime.jsxs)("span", { children: [
								t("operationFailureCode"),
								"：",
								operation.failureCode
							] })]
						}) : (0, react_jsx_runtime.jsx)("ol", {
							className: PluginCenterTab_module_css_default.installProgressSteps,
							children: PLUGIN_OPERATION_GROUPS.map((group, index) => {
								const state = progressState(phase, index);
								return (0, react_jsx_runtime.jsxs)("li", {
									"data-state": state,
									children: [(0, react_jsx_runtime.jsx)("span", {
										className: PluginCenterTab_module_css_default.installStepMarker,
										"aria-hidden": "true",
										children: state === "done" ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, { size: 12 }) : state === "current" ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, {
											state: "ongoing",
											size: 10
										}) : null
									}), (0, react_jsx_runtime.jsx)("span", { children: t(managementAction !== null && group.label === "progressInstalling" ? "progressChanging" : group.label) })]
								}, group.label);
							})
						}),
						!terminal ? (0, react_jsx_runtime.jsx)("p", {
							className: PluginCenterTab_module_css_default.installProgressHint,
							children: t("operationKeepOpen")
						}) : null,
						terminal ? (0, react_jsx_runtime.jsx)("footer", {
							className: PluginCenterTab_module_css_default.installProgressFooter,
							children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "primary",
								onClick: onClose,
								children: t("done")
							})
						}) : null
					]
				})
			});
		}
		//#endregion
		//#region lib/types/client/PluginDetailPage.js
		const COMPATIBILITY_KEYS = {
			compatible: "compatible",
			incompatible: "incompatible",
			unknown: "unknown"
		};
		const RISK_KEYS = {
			low: "lowRisk",
			medium: "mediumRisk",
			high: "highRisk"
		};
		const FRESHNESS_KEYS$2 = {
			fresh: "fresh",
			cached: "cached",
			stale: "stale"
		};
		const SOURCE_KEYS$3 = {
			bundled: "bundledSource",
			network: "networkSource",
			cache: "cacheSource"
		};
		const CAPABILITY_KEYS$1 = {
			host: "capabilityHost",
			client: "capabilityClient",
			agent: "capabilityAgent",
			tool: "capabilityTool",
			"model-provider": "capabilityModelProvider",
			skill: "capabilitySkill",
			network: "capabilityNetwork",
			filesystem: "capabilityFilesystem",
			subprocess: "capabilitySubprocess"
		};
		function DetailMark({ entry }) {
			return (0, react_jsx_runtime.jsxs)("span", {
				className: PluginCenterTab_module_css_default.detailMark,
				style: { background: entry.brandColor ?? void 0 },
				"aria-hidden": "true",
				children: [entry.displayName.slice(0, 1).toLocaleUpperCase(), entry.icon === null ? null : (0, react_jsx_runtime.jsx)("img", {
					src: entry.icon.url,
					alt: "",
					width: entry.icon.width,
					height: entry.icon.height,
					referrerPolicy: "no-referrer",
					onError: (event) => {
						event.currentTarget.hidden = true;
					}
				}, entry.icon.url)]
			});
		}
		function DetailPageHeader({ entry, actions }) {
			return (0, react_jsx_runtime.jsxs)("header", {
				className: PluginCenterTab_module_css_default.detailHeader,
				children: [(0, react_jsx_runtime.jsx)(DetailMark, { entry }), (0, react_jsx_runtime.jsxs)("div", {
					className: PluginCenterTab_module_css_default.detailTitleRow,
					children: [(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("h1", { children: entry.displayName }), (0, react_jsx_runtime.jsx)("p", { children: entry.summary })] }), actions === void 0 ? null : (0, react_jsx_runtime.jsx)("div", {
						className: PluginCenterTab_module_css_default.detailHeaderActions,
						children: actions
					})]
				})]
			});
		}
		function reasonEvidence(reason) {
			const comparison = reason.actual === null ? "" : reason.expected === null ? ` · ${reason.actual}` : ` · ${reason.actual} → ${reason.expected}`;
			return `${reason.subject}${comparison}`;
		}
		function CompatibilityAction({ entry, state, mutationsEnabled, operation, onInstall, t }) {
			const allowed = state.status === "ready" && state.result.allowed;
			const matchingOperationPhase = operation?.action === "install" && operation.pluginId === entry.pluginId && operation.version === entry.version ? operation.phase : null;
			const committed = matchingOperationPhase === "committed";
			const failed = matchingOperationPhase === "failed";
			const operationBlocksInstall = operation !== null && isMutationBlockingOperationPhase(operation.phase);
			const matchingPhase = matchingOperationPhase !== null && isTrustedInstallPhase(matchingOperationPhase) ? matchingOperationPhase : null;
			const label = state.status === "loading" ? t("checkingCompatibility") : committed ? t("installed") : failed ? t("installationFailedAction") : operationBlocksInstall ? matchingPhase === null ? t("installationInProgress") : t(PLUGIN_OPERATION_PHASE_KEYS[matchingPhase]) : allowed ? t("install") : t("cannotInstall");
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				variant: "primary",
				size: "sm",
				className: PluginCenterTab_module_css_default.installAction,
				icon: allowed && !operationBlocksInstall && !committed ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, { size: 14 }) : void 0,
				title: !mutationsEnabled ? t("installReleaseGated") : operationBlocksInstall ? t("operationInProgress") : void 0,
				disabled: !mutationsEnabled || !allowed || operationBlocksInstall || committed,
				onClick: onInstall,
				children: label
			});
		}
		function CompatibilityPanel({ state, mutationsEnabled, t }) {
			if (state.status === "loading") return (0, react_jsx_runtime.jsxs)("section", {
				className: `${PluginCenterTab_module_css_default.detailSection} ${PluginCenterTab_module_css_default.preflightSection}`,
				"aria-label": t("preflight"),
				children: [(0, react_jsx_runtime.jsx)("div", {
					className: PluginCenterTab_module_css_default.preflightHeading,
					children: (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("h2", { children: t("preflight") }), (0, react_jsx_runtime.jsx)("p", { children: t("preflightIntro") })] })
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: PluginCenterTab_module_css_default.preflightStatus,
					"data-state": "loading",
					children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "ongoing" }), (0, react_jsx_runtime.jsx)("strong", { children: t("checkingCompatibility") })]
				})]
			});
			if (state.status === "error") return (0, react_jsx_runtime.jsxs)("section", {
				className: `${PluginCenterTab_module_css_default.detailSection} ${PluginCenterTab_module_css_default.preflightSection}`,
				"aria-label": t("preflight"),
				children: [(0, react_jsx_runtime.jsx)("div", {
					className: PluginCenterTab_module_css_default.preflightHeading,
					children: (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("h2", { children: t("preflight") }), (0, react_jsx_runtime.jsx)("p", { children: t("preflightIntro") })] })
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: PluginCenterTab_module_css_default.preflightStatus,
					"data-state": "error",
					role: "alert",
					children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "error" }), (0, react_jsx_runtime.jsx)("strong", { children: t("compatibilityError") })]
				})]
			});
			const decision = state.result;
			const fingerprint = decision.fingerprint;
			return (0, react_jsx_runtime.jsxs)("section", {
				className: `${PluginCenterTab_module_css_default.detailSection} ${PluginCenterTab_module_css_default.preflightSection}`,
				"aria-label": t("preflight"),
				"data-compatibility-allowed": decision.allowed,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: PluginCenterTab_module_css_default.preflightHeading,
						children: (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("h2", { children: t("preflight") }), (0, react_jsx_runtime.jsx)("p", { children: t("preflightIntro") })] })
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: PluginCenterTab_module_css_default.preflightStatus,
						"data-state": decision.allowed ? "allowed" : "blocked",
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: decision.allowed ? "done" : "error" }), (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("strong", { children: decision.allowed ? t("allowedToInstall") : t("installationBlocked") }), (0, react_jsx_runtime.jsx)("span", { children: decision.riskSummary })] })]
					}),
					decision.reasons.length === 0 ? null : (0, react_jsx_runtime.jsxs)("div", {
						className: PluginCenterTab_module_css_default.denials,
						children: [(0, react_jsx_runtime.jsx)("h3", { children: t("denialReasons") }), (0, react_jsx_runtime.jsx)("ol", { children: decision.reasons.map((reason, index) => (0, react_jsx_runtime.jsxs)("li", { children: [(0, react_jsx_runtime.jsx)("span", {
							className: PluginCenterTab_module_css_default.denialIndex,
							"aria-hidden": "true",
							children: index + 1
						}), (0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsx)("strong", { children: t(compatibilityReasonKey(reason.code)) }), (0, react_jsx_runtime.jsx)("code", { children: reasonEvidence(reason) })] })] }, `${reason.code}-${reason.subject}-${String(index)}`)) })]
					}),
					(0, react_jsx_runtime.jsxs)("details", {
						className: PluginCenterTab_module_css_default.environmentBlock,
						children: [(0, react_jsx_runtime.jsxs)("summary", { children: [(0, react_jsx_runtime.jsx)("span", { children: t("currentEnvironment") }), (0, react_jsx_runtime.jsxs)("span", {
							className: PluginCenterTab_module_css_default.environmentSummaryMeta,
							children: [fingerprint.platform, (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, {
								size: 14,
								"aria-hidden": "true"
							})]
						})] }), (0, react_jsx_runtime.jsxs)("dl", {
							className: `${PluginCenterTab_module_css_default.detailFacts} ${PluginCenterTab_module_css_default.preflightFacts}`,
							children: [
								(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("desktopVersion") }), (0, react_jsx_runtime.jsx)("dd", { children: fingerprint.desktopVersion })] }),
								(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("dshVersion") }), (0, react_jsx_runtime.jsx)("dd", { children: fingerprint.dshVersion })] }),
								(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("nodeVersion") }), (0, react_jsx_runtime.jsx)("dd", { children: fingerprint.nodeVersion })] }),
								(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("platform") }), (0, react_jsx_runtime.jsx)("dd", { children: fingerprint.platform })] }),
								(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("profileRevision") }), (0, react_jsx_runtime.jsx)("dd", { children: fingerprint.profileRevision })] }),
								(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("catalogRevision") }), (0, react_jsx_runtime.jsx)("dd", { children: fingerprint.catalogEtag })] }),
								(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("restartRequired") }), (0, react_jsx_runtime.jsx)("dd", { children: t(decision.restartRequired ? "restartYes" : "restartNo") })] })
							]
						})]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: PluginCenterTab_module_css_default.authorityWarning,
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, {
							size: 16,
							"aria-hidden": "true"
						}), (0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsx)("strong", { children: t("authorityTitle") }), (0, react_jsx_runtime.jsx)("span", { children: t("authorityWarning") })] })]
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: PluginCenterTab_module_css_default.preflightFootnote,
						children: t(mutationsEnabled ? "webInstallSimulation" : "installReleaseGated")
					})
				]
			});
		}
		/** Exact-version detail page with F003 trusted-install confirmation and status. */
		function PluginDetailPage({ entry, state, compatibility, mutationsEnabled, operation, operationRequestFailed, onInstall, t }) {
			const [confirmationOpen, setConfirmationOpen] = (0, react.useState)(false);
			const [acknowledged, setAcknowledged] = (0, react.useState)(false);
			const operationBlocksInstall = operation !== null && isMutationBlockingOperationPhase(operation.phase);
			const installAllowed = compatibility?.status === "ready" && compatibility.result.allowed;
			(0, react.useEffect)(() => {
				if (!operationBlocksInstall && installAllowed) return;
				setConfirmationOpen(false);
				setAcknowledged(false);
			}, [installAllowed, operationBlocksInstall]);
			const closeConfirmation = () => {
				setConfirmationOpen(false);
				setAcknowledged(false);
			};
			const confirmInstallation = () => {
				closeConfirmation();
				onInstall();
			};
			if (state.status === "loading") return (0, react_jsx_runtime.jsxs)("main", {
				className: PluginCenterTab_module_css_default.detailPage,
				children: [(0, react_jsx_runtime.jsx)(DetailPageHeader, { entry }), (0, react_jsx_runtime.jsx)("p", {
					className: PluginCenterTab_module_css_default.detailStatus,
					children: t("detailLoading")
				})]
			});
			if (state.status === "error") return (0, react_jsx_runtime.jsxs)("main", {
				className: PluginCenterTab_module_css_default.detailPage,
				children: [(0, react_jsx_runtime.jsx)(DetailPageHeader, { entry }), (0, react_jsx_runtime.jsx)("p", {
					role: "alert",
					className: PluginCenterTab_module_css_default.error,
					children: t("detailError")
				})]
			});
			const detail = state.result.detail;
			if (detail === null) return (0, react_jsx_runtime.jsxs)("main", {
				className: PluginCenterTab_module_css_default.detailPage,
				children: [(0, react_jsx_runtime.jsx)(DetailPageHeader, { entry }), (0, react_jsx_runtime.jsx)("p", {
					className: PluginCenterTab_module_css_default.detailStatus,
					children: t("detailUnavailable")
				})]
			});
			const summary = detail.summary;
			const status = detail.withdrawn ? t("withdrawn") : summary.scope === "local" ? t("localReadOnly") : summary.verified ? t("verified") : t("unreviewed");
			return (0, react_jsx_runtime.jsxs)("main", {
				className: PluginCenterTab_module_css_default.detailPage,
				"data-catalog-detail": `${summary.pluginId}@${summary.version}`,
				children: [
					(0, react_jsx_runtime.jsx)(DetailPageHeader, {
						entry: summary,
						actions: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("span", {
							className: PluginCenterTab_module_css_default.detailStatusBadge,
							"data-withdrawn": detail.withdrawn || void 0,
							children: status
						}), compatibility === null ? null : (0, react_jsx_runtime.jsx)(CompatibilityAction, {
							entry: summary,
							state: compatibility,
							mutationsEnabled,
							operation,
							onInstall: () => {
								setConfirmationOpen(true);
							},
							t
						})] })
					}),
					detail.screenshots.length > 0 ? (0, react_jsx_runtime.jsx)("section", {
						className: PluginCenterTab_module_css_default.detailMedia,
						"aria-label": t("screenshots"),
						children: detail.screenshots.map((media) => (0, react_jsx_runtime.jsx)("img", {
							src: media.url,
							alt: media.alt,
							width: media.width,
							height: media.height
						}, media.url))
					}) : null,
					(0, react_jsx_runtime.jsx)("p", {
						className: PluginCenterTab_module_css_default.detailDescription,
						children: detail.description
					}),
					compatibility === null ? null : (0, react_jsx_runtime.jsx)(CompatibilityPanel, {
						state: compatibility,
						mutationsEnabled,
						t
					}),
					operationRequestFailed ? (0, react_jsx_runtime.jsx)("p", {
						className: PluginCenterTab_module_css_default.operationRequestError,
						role: "alert",
						children: t("operationRequestFailed")
					}) : null,
					(0, react_jsx_runtime.jsxs)("section", {
						className: PluginCenterTab_module_css_default.detailSection,
						children: [
							(0, react_jsx_runtime.jsx)("h2", { children: t("information") }),
							(0, react_jsx_runtime.jsxs)("dl", {
								className: PluginCenterTab_module_css_default.detailFacts,
								children: [
									(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("publisher") }), (0, react_jsx_runtime.jsx)("dd", { children: summary.publisher })] }),
									(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("version") }), (0, react_jsx_runtime.jsx)("dd", { children: summary.version })] }),
									(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("compatibility") }), (0, react_jsx_runtime.jsx)("dd", { children: t(COMPATIBILITY_KEYS[summary.compatibility.status]) })] }),
									(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("publishedAt") }), (0, react_jsx_runtime.jsx)("dd", { children: new Date(detail.publishedAt).toLocaleDateString() })] }),
									(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("updated") }), (0, react_jsx_runtime.jsx)("dd", { children: new Date(summary.updatedAt).toLocaleDateString() })] }),
									(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("catalogStatus") }), (0, react_jsx_runtime.jsxs)("dd", { children: [
										t(FRESHNESS_KEYS$2[state.result.freshness]),
										" · ",
										t(SOURCE_KEYS$3[state.result.source])
									] })] })
								]
							}),
							summary.compatibility.reason === null ? null : (0, react_jsx_runtime.jsx)("p", {
								className: PluginCenterTab_module_css_default.note,
								children: summary.compatibility.reason
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)("p", {
						className: PluginCenterTab_module_css_default.verifiedNote,
						"data-verified": summary.verified ? "true" : "false",
						children: [(0, react_jsx_runtime.jsx)("strong", { children: summary.verified ? t("verified") : t("unreviewed") }), summary.verified ? ` — ${t("verifiedHelp")}` : null]
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: PluginCenterTab_module_css_default.detailSection,
						children: [(0, react_jsx_runtime.jsxs)("h2", { children: [
							t("capabilities"),
							" ",
							summary.capabilities.length
						] }), (0, react_jsx_runtime.jsx)("ul", {
							className: PluginCenterTab_module_css_default.chips,
							children: summary.capabilities.map((value) => (0, react_jsx_runtime.jsx)("li", { children: t(CAPABILITY_KEYS$1[value]) }, value))
						})]
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: PluginCenterTab_module_css_default.detailSection,
						children: [(0, react_jsx_runtime.jsx)("h2", { children: t("permissions") }), detail.permissions.length === 0 ? (0, react_jsx_runtime.jsx)("p", { children: t("noPermissions") }) : (0, react_jsx_runtime.jsx)("ul", {
							className: PluginCenterTab_module_css_default.detailList,
							children: detail.permissions.map((value) => (0, react_jsx_runtime.jsx)("li", { children: value }, value))
						})]
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: PluginCenterTab_module_css_default.detailSection,
						children: [(0, react_jsx_runtime.jsx)("h2", { children: t("risk") }), (0, react_jsx_runtime.jsxs)("p", { children: [
							(0, react_jsx_runtime.jsx)("strong", { children: t(RISK_KEYS[detail.riskLevel]) }),
							" · ",
							detail.riskSummary
						] })]
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: PluginCenterTab_module_css_default.detailSection,
						children: [(0, react_jsx_runtime.jsx)("h2", { children: t("changelog") }), (0, react_jsx_runtime.jsx)("p", { children: detail.changelog })]
					}),
					compatibility?.status === "ready" && compatibility.result.allowed ? (0, react_jsx_runtime.jsx)(PluginInstallConfirmation, {
						open: confirmationOpen,
						entry: summary,
						decision: compatibility.result,
						acknowledged,
						onAcknowledgedChange: setAcknowledged,
						onCancel: closeConfirmation,
						onConfirm: confirmInstallation,
						t
					}) : null
				]
			});
		}
		//#endregion
		//#region lib/types/client/InstalledPluginsPanel.js
		const SOURCE_KEYS$2 = {
			system: "installedSourceSystem",
			catalog: "installedSourceCatalog",
			local: "installedSourceLocal"
		};
		const RUNTIME_KEYS = {
			running: "runtimeRunning",
			inactive: "runtimeInactive",
			failed: "runtimeFailed",
			unknown: "runtimeUnknown"
		};
		const ACTION_KEYS = {
			update: "updatePlugin",
			enable: "enablePlugin",
			disable: "disablePlugin",
			uninstall: "uninstallPlugin"
		};
		function InstalledMark({ item }) {
			return (0, react_jsx_runtime.jsxs)("span", {
				className: PluginCenterTab_module_css_default.installedMark,
				style: { background: item.brandColor ?? void 0 },
				"aria-hidden": "true",
				"data-source": item.source,
				children: [item.displayName.slice(0, 1).toLocaleUpperCase(), item.icon === null ? null : (0, react_jsx_runtime.jsx)("img", {
					src: item.icon.url,
					alt: "",
					width: item.icon.width,
					height: item.icon.height,
					loading: "lazy",
					referrerPolicy: "no-referrer",
					onError: (event) => {
						event.currentTarget.hidden = true;
					}
				}, item.icon.url)]
			});
		}
		/** Compact installed strip whose rows come only from the Desktop projection. */
		function InstalledIcons({ state, onOpen, t }) {
			if (state.status === "loading") return (0, react_jsx_runtime.jsx)("span", {
				className: PluginCenterTab_module_css_default.installedSkeleton,
				role: "status",
				"aria-label": t("installedLoading"),
				children: [
					0,
					1,
					2,
					3,
					4,
					5,
					6
				].map((index) => (0, react_jsx_runtime.jsx)("span", { "aria-hidden": "true" }, index))
			});
			if (state.status === "error") return (0, react_jsx_runtime.jsx)("span", {
				className: PluginCenterTab_module_css_default.installedEmpty,
				children: t("installedError")
			});
			if (state.result.items.length === 0) return (0, react_jsx_runtime.jsx)("span", {
				className: PluginCenterTab_module_css_default.installedEmpty,
				children: t("installedEmpty")
			});
			return state.result.items.map((item) => (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": `${t("manageInstalled")}：${item.displayName}`,
				title: `${item.displayName} · ${t(RUNTIME_KEYS[item.runtimeStatus])}`,
				onClick: onOpen,
				children: (0, react_jsx_runtime.jsx)(InstalledMark, { item })
			}, item.packageName));
		}
		/** Expanded management rows with retained links into the existing Settings owners. */
		function InstalledPluginsPanel({ state, mutationsEnabled, onRetry, onSettings, onAction, t }) {
			if (state.status === "loading") return (0, react_jsx_runtime.jsx)("p", {
				className: PluginCenterTab_module_css_default.installedPanelStatus,
				children: t("installedLoading")
			});
			if (state.status === "error") return (0, react_jsx_runtime.jsxs)("div", {
				className: PluginCenterTab_module_css_default.installedPanelStatus,
				role: "alert",
				children: [(0, react_jsx_runtime.jsx)("span", { children: t("installedError") }), (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onRetry,
					children: t("retry")
				})]
			});
			if (state.result.items.length === 0) return (0, react_jsx_runtime.jsx)("p", {
				className: PluginCenterTab_module_css_default.installedPanelStatus,
				children: t("installedEmpty")
			});
			return (0, react_jsx_runtime.jsx)("ul", {
				className: PluginCenterTab_module_css_default.installedRows,
				"data-profile-revision": state.result.profileRevision,
				children: state.result.items.map((item) => {
					const compatibilityReason = installedCompatibilityReason(item.compatibilityReason, t);
					return (0, react_jsx_runtime.jsxs)("li", {
						className: PluginCenterTab_module_css_default.installedRow,
						"data-source": item.source,
						"data-installed-plugin": item.pluginId ?? item.packageName,
						"data-installed-package": item.packageName,
						children: [
							(0, react_jsx_runtime.jsx)(InstalledMark, { item }),
							(0, react_jsx_runtime.jsxs)("div", {
								className: PluginCenterTab_module_css_default.installedRowBody,
								children: [
									(0, react_jsx_runtime.jsxs)("div", {
										className: PluginCenterTab_module_css_default.installedRowTitle,
										children: [
											(0, react_jsx_runtime.jsx)("strong", { children: item.displayName }),
											(0, react_jsx_runtime.jsx)("span", { children: t(SOURCE_KEYS$2[item.source]) }),
											item.protected ? (0, react_jsx_runtime.jsx)("span", { children: t("protectedPlugin") }) : null,
											item.pendingAction !== null ? (0, react_jsx_runtime.jsx)("span", { children: t("operationPending") }) : null
										]
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										className: PluginCenterTab_module_css_default.installedRowMeta,
										children: [
											(0, react_jsx_runtime.jsx)("span", { children: item.version ?? t("versionUnknown") }),
											(0, react_jsx_runtime.jsx)("span", { children: item.enabled ? t("bundleEnabled") : t("bundleDisabled") }),
											(0, react_jsx_runtime.jsx)("span", {
												"data-runtime": item.runtimeStatus,
												children: t(RUNTIME_KEYS[item.runtimeStatus])
											}),
											item.compatibility === "incompatible" ? (0, react_jsx_runtime.jsxs)("span", {
												"data-compatibility": "incompatible",
												title: item.compatibilityReason ?? void 0,
												children: [t("installedIncompatible"), compatibilityReason === null ? "" : ` · ${compatibilityReason}`]
											}) : null,
											item.update !== null ? (0, react_jsx_runtime.jsxs)("span", { children: [
												t("updateAvailable"),
												" ",
												item.update.version
											] }) : null
										]
									}),
									(0, react_jsx_runtime.jsx)("code", { children: item.packageName })
								]
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: PluginCenterTab_module_css_default.installedRowActions,
								children: [
									item.configurationEntryIds.length > 0 ? (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => {
											onSettings("configurable");
										},
										children: t("openConfiguration")
									}) : null,
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => {
											onSettings("all");
										},
										children: t("openRuntimeInventory")
									}),
									item.supportedActions.map((action) => (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: !mutationsEnabled || item.pendingAction !== null,
										"data-action": action,
										onClick: () => {
											onAction(item, action);
										},
										children: t(ACTION_KEYS[action])
									}, action))
								]
							})
						]
					}, item.packageName);
				})
			});
		}
		//#endregion
		//#region lib/types/client/PluginCenterTab.js
		const SECTION_KEYS = {
			featured: "featured",
			popular: "popular",
			recent: "recent"
		};
		const FRESHNESS_KEYS$1 = {
			fresh: "fresh",
			cached: "cached",
			stale: "stale"
		};
		const SOURCE_KEYS$1 = {
			bundled: "bundledSource",
			network: "networkSource",
			cache: "cacheSource"
		};
		const MANAGEMENT_ACTION_KEYS = {
			update: "updatePlugin",
			enable: "enablePlugin",
			disable: "disablePlugin",
			uninstall: "uninstallPlugin"
		};
		const RECOVERY_REASON_KEYS = {
			"unsupported-journal-version": "recoveryReasonUnsupportedJournalVersion",
			"journal-invalid": "recoveryReasonJournalInvalid",
			"snapshot-missing": "recoveryReasonSnapshotMissing",
			"snapshot-invalid": "recoveryReasonSnapshotInvalid",
			"snapshot-root-mismatch": "recoveryReasonSnapshotRootMismatch",
			"snapshot-path-invalid": "recoveryReasonSnapshotPathInvalid",
			"snapshot-hash-mismatch": "recoveryReasonSnapshotHashMismatch",
			"profile-lock-busy": "recoveryReasonProfileLockBusy",
			"host-stop-failed": "recoveryReasonHostStopFailed",
			"profile-restore-failed": "recoveryReasonProfileRestoreFailed",
			"package-restore-failed": "recoveryReasonPackageRestoreFailed",
			"host-start-failed": "recoveryReasonHostStartFailed",
			"runtime-verification-failed": "recoveryReasonRuntimeVerificationFailed",
			"diagnostic-export-failed": "recoveryReasonDiagnosticExportFailed"
		};
		const NO_RECOVERY = () => Promise.resolve(null);
		const NO_RECOVERY_STATE = () => () => {};
		const RECOVERY_UNAVAILABLE = () => Promise.reject(/* @__PURE__ */ new Error("Plugin recovery is unavailable"));
		const NO_OWNED_DATA_OFFER = () => Promise.resolve(null);
		const OWNED_DATA_DECISION_UNAVAILABLE = () => Promise.reject(/* @__PURE__ */ new Error("Plugin owned-data decision is unavailable"));
		function uniqueEntries$1(results) {
			const entries = /* @__PURE__ */ new Map();
			for (const result of results) for (const section of Object.values(result.sections)) for (const entry of section) entries.set(`${entry.pluginId}@${entry.version}`, entry);
			return [...entries.values()];
		}
		function CatalogMark({ entry, compact = false }) {
			return (0, react_jsx_runtime.jsxs)("span", {
				className: `${PluginCenterTab_module_css_default.catalogMark}${compact ? ` ${PluginCenterTab_module_css_default.compactMark}` : ""}`,
				style: { background: entry.brandColor ?? void 0 },
				"aria-hidden": "true",
				children: [entry.displayName.slice(0, 1).toLocaleUpperCase(), entry.icon === null ? null : (0, react_jsx_runtime.jsx)("img", {
					src: entry.icon.url,
					alt: "",
					width: entry.icon.width,
					height: entry.icon.height,
					loading: "lazy",
					referrerPolicy: "no-referrer",
					onError: (event) => {
						event.currentTarget.hidden = true;
					}
				}, entry.icon.url)]
			});
		}
		function CatalogCard({ entry, installedItem, mutationsEnabled, operation, checking, onOpen, onInstall, onManage, t }) {
			const [menuOpen, setMenuOpen] = (0, react.useState)(false);
			const matchingOperation = operation?.action === "install" && operation.pluginId === entry.pluginId && operation.version === entry.version ? operation : null;
			const installed = installedItem !== null || entry.installed || matchingOperation?.phase === "committed";
			const failed = matchingOperation?.phase === "failed" || matchingOperation?.phase === "recovery-failed";
			const matchingOperationInProgress = matchingOperation !== null && isMutationBlockingOperationPhase(matchingOperation.phase) && !failed;
			const operationBlocksAction = operation !== null && isMutationBlockingOperationPhase(operation.phase);
			const incompatible = entry.compatibility.status === "incompatible";
			const label = installed ? t("installed") : checking ? t("checkingCompatibility") : failed ? t("installationFailedAction") : matchingOperationInProgress ? t("installationInProgress") : incompatible ? t("cannotInstall") : t("install");
			const installDisabled = checking || incompatible || entry.scope !== "public" || !mutationsEnabled || operationBlocksAction;
			const managementDisabled = !mutationsEnabled || installedItem !== null && installedItem.pendingAction !== null || operationBlocksAction;
			const menuItems = installedItem?.supportedActions.map((action) => ({
				id: action,
				label: t(MANAGEMENT_ACTION_KEYS[action]),
				disabled: managementDisabled,
				danger: action === "uninstall"
			})) ?? [];
			return (0, react_jsx_runtime.jsxs)("li", {
				className: PluginCenterTab_module_css_default.card,
				"data-catalog-entry": `${entry.pluginId}@${entry.version}`,
				children: [(0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: PluginCenterTab_module_css_default.cardButton,
					"aria-label": `${t("details")}：${entry.displayName}`,
					onClick: (event) => {
						onOpen(entry, event.currentTarget);
					},
					children: [
						(0, react_jsx_runtime.jsx)(CatalogMark, { entry }),
						(0, react_jsx_runtime.jsxs)("span", {
							className: PluginCenterTab_module_css_default.cardCopy,
							children: [(0, react_jsx_runtime.jsx)("strong", { children: entry.displayName }), (0, react_jsx_runtime.jsx)("span", {
								className: PluginCenterTab_module_css_default.cardSummary,
								children: entry.summary
							})]
						}),
						(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, {
							className: PluginCenterTab_module_css_default.cardChevron,
							"aria-hidden": "true"
						})
					]
				}), installed ? installedItem === null ? (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: PluginCenterTab_module_css_default.cardMenuButton,
					"aria-label": `${t("pluginActions")}：${entry.displayName}`,
					disabled: true,
					children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, { "aria-hidden": "true" })
				}) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
					open: menuOpen,
					align: "end",
					portal: true,
					compact: true,
					className: PluginCenterTab_module_css_default.cardMenu ?? "",
					items: menuItems,
					onClose: () => {
						setMenuOpen(false);
					},
					onSelect: (id) => {
						setMenuOpen(false);
						const action = installedItem.supportedActions.find((value) => value === id);
						if (action !== void 0) onManage(installedItem, action);
					},
					anchor: (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: PluginCenterTab_module_css_default.cardMenuButton,
						"aria-label": `${t("pluginActions")}：${entry.displayName}`,
						"aria-expanded": menuOpen,
						title: `${t("pluginActions")}：${entry.displayName}`,
						disabled: menuItems.length === 0,
						onClick: () => {
							setMenuOpen((value) => !value);
						},
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, { "aria-hidden": "true" })
					})
				}) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					size: "sm",
					className: PluginCenterTab_module_css_default.cardAction,
					title: !mutationsEnabled ? t("installReleaseGated") : failed ? t("operationNeedsRecovery") : operationBlocksAction ? t("operationInProgress") : void 0,
					disabled: installDisabled,
					onClick: (event) => {
						onInstall(entry, event.currentTarget);
					},
					children: label
				})]
			});
		}
		/** One server-owned discovery section. */
		function CatalogSectionView({ section, entries, installedItems, mutationsEnabled, operation, checkingEntry, onOpen, onInstall, onManage, t }) {
			if (entries.length === 0) return null;
			return (0, react_jsx_runtime.jsxs)("section", {
				className: PluginCenterTab_module_css_default.catalogSection,
				"data-catalog-section": section,
				children: [(0, react_jsx_runtime.jsx)("div", {
					className: PluginCenterTab_module_css_default.sectionHeading,
					children: (0, react_jsx_runtime.jsx)("h2", { children: t(SECTION_KEYS[section]) })
				}), (0, react_jsx_runtime.jsx)("ul", {
					className: PluginCenterTab_module_css_default.cards,
					children: entries.map((entry) => (0, react_jsx_runtime.jsx)(CatalogCard, {
						entry,
						installedItem: installedItems.get(`${entry.catalogKind}:${entry.pluginId}`) ?? null,
						mutationsEnabled,
						operation,
						checking: checkingEntry === `${entry.pluginId}@${entry.version}`,
						onOpen,
						onInstall,
						onManage,
						t
					}, `${entry.pluginId}@${entry.version}`))
				})]
			});
		}
		const SKELETON_CARDS = [
			0,
			1,
			2,
			3,
			4,
			5
		];
		function CatalogSkeleton({ t }) {
			return (0, react_jsx_runtime.jsxs)("section", {
				className: PluginCenterTab_module_css_default.catalogSkeleton,
				role: "status",
				"aria-label": t("loading"),
				children: [(0, react_jsx_runtime.jsx)("div", {
					className: PluginCenterTab_module_css_default.skeletonHeading,
					children: t("loading")
				}), (0, react_jsx_runtime.jsx)("ul", {
					className: PluginCenterTab_module_css_default.skeletonCards,
					"aria-hidden": "true",
					children: SKELETON_CARDS.map((index) => (0, react_jsx_runtime.jsxs)("li", {
						className: PluginCenterTab_module_css_default.skeletonCard,
						"data-catalog-skeleton-card": true,
						children: [(0, react_jsx_runtime.jsx)("span", { className: PluginCenterTab_module_css_default.skeletonMark }), (0, react_jsx_runtime.jsxs)("span", {
							className: PluginCenterTab_module_css_default.skeletonCopy,
							children: [(0, react_jsx_runtime.jsx)("span", { className: PluginCenterTab_module_css_default.skeletonTitle }), (0, react_jsx_runtime.jsx)("span", { className: PluginCenterTab_module_css_default.skeletonSummary })]
						})]
					}, index))
				})]
			});
		}
		/** Searchable Desktop Plugin Center with handed-off lifecycle actions. */
		function PluginCenterTab({ available, development, list, refresh, detail, checkCompatibility, listInstalled, openPluginSettings, mutationsEnabled, install, manage, getOwnedDataOffer = NO_OWNED_DATA_OFFER, removeOwnedData, retainOwnedData: persistOwnedDataRetention = OWNED_DATA_DECISION_UNAVAILABLE, getOperation, onOperationState, getRecovery = NO_RECOVERY, retryRecovery = RECOVERY_UNAVAILABLE, exportRecoveryDiagnostics = RECOVERY_UNAVAILABLE, onRecoveryState = NO_RECOVERY_STATE, t }) {
			const kindTabsId = (0, react.useId)();
			const kindRefs = (0, react.useRef)([]);
			const detailOpener = (0, react.useRef)(null);
			const detailRequest = (0, react.useRef)(0);
			const catalogInstallOpener = (0, react.useRef)(null);
			const catalogInstallRequest = (0, react.useRef)(0);
			const initialRefreshStarted = (0, react.useRef)(false);
			const observedTerminal = (0, react.useRef)(null);
			const [kind, setKind] = (0, react.useState)("plugin");
			const [scope, setScope] = (0, react.useState)("public");
			const [query, setQuery] = (0, react.useState)("");
			const [revision, setRevision] = (0, react.useState)(0);
			const [view, setView] = (0, react.useState)({ status: "loading" });
			const [installed, setInstalled] = (0, react.useState)({ status: "loading" });
			const [installedOpen, setInstalledOpen] = (0, react.useState)(false);
			const [managementConfirmation, setManagementConfirmation] = (0, react.useState)(null);
			const [managementAcknowledged, setManagementAcknowledged] = (0, react.useState)(false);
			const [uninstallOffer, setUninstallOffer] = (0, react.useState)(null);
			const [ownedDataConfirmation, setOwnedDataConfirmation] = (0, react.useState)(null);
			const [ownedDataSelected, setOwnedDataSelected] = (0, react.useState)([]);
			const [ownedDataAcknowledged, setOwnedDataAcknowledged] = (0, react.useState)(false);
			const [ownedDataStatus, setOwnedDataStatus] = (0, react.useState)("idle");
			const [ownedDataRetaining, setOwnedDataRetaining] = (0, react.useState)(false);
			const [removedOwnedDataCount, setRemovedOwnedDataCount] = (0, react.useState)(0);
			const [detailEntry, setDetailEntry] = (0, react.useState)(null);
			const [detailState, setDetailState] = (0, react.useState)(null);
			const [compatibilityState, setCompatibilityState] = (0, react.useState)(null);
			const [catalogInstall, setCatalogInstall] = (0, react.useState)(null);
			const [catalogInstallAcknowledged, setCatalogInstallAcknowledged] = (0, react.useState)(false);
			const [operation, setOperation] = (0, react.useState)(null);
			const [operationDialogOpen, setOperationDialogOpen] = (0, react.useState)(false);
			const [operationRequestFailed, setOperationRequestFailed] = (0, react.useState)(false);
			const [recovery, setRecovery] = (0, react.useState)(null);
			const [recoveryBusy, setRecoveryBusy] = (0, react.useState)(false);
			const [diagnosticResult, setDiagnosticResult] = (0, react.useState)(null);
			const criteria = (0, react.useMemo)(() => ({
				catalogKind: kind,
				scope,
				query: query.trim(),
				limit: 24
			}), [
				kind,
				query,
				scope
			]);
			const installedCatalogItems = (0, react.useMemo)(() => {
				const items = /* @__PURE__ */ new Map();
				if (installed.status !== "ready") return items;
				for (const item of installed.result.items) {
					if (item.source !== "catalog" || item.pluginId === null || item.catalogKind === null) continue;
					items.set(`${item.catalogKind}:${item.pluginId}`, item);
				}
				return items;
			}, [installed]);
			const operationInstalledItem = (0, react.useMemo)(() => {
				if (operation === null || installed.status !== "ready") return null;
				return installed.result.items.find((item) => item.pluginId === operation.pluginId && item.version === operation.version) ?? null;
			}, [installed, operation]);
			(0, react.useEffect)(() => {
				if (!available) return;
				let current = true;
				Promise.resolve().then(() => list(criteria)).then((result) => {
					if (current) setView({
						status: "ready",
						result
					});
					if (criteria.catalogKind !== "plugin" || criteria.scope !== "public" || criteria.query !== "" || initialRefreshStarted.current) return;
					initialRefreshStarted.current = true;
					if (result.source === "network" && result.freshness === "fresh" && uniqueEntries$1([result]).length >= criteria.limit) return;
					Promise.resolve().then(() => refresh(criteria)).then(() => {
						if (current) setRevision((value) => value + 1);
					}, () => {});
				}, () => {
					if (current) setView({ status: "error" });
				});
				return () => {
					current = false;
				};
			}, [
				available,
				criteria,
				list,
				refresh,
				revision
			]);
			(0, react.useEffect)(() => {
				if (!available) return;
				let current = true;
				listInstalled().then((result) => {
					if (current) setInstalled({
						status: "ready",
						result
					});
				}, () => {
					if (current) setInstalled({ status: "error" });
				});
				return () => {
					current = false;
				};
			}, [
				available,
				listInstalled,
				revision
			]);
			(0, react.useEffect)(() => {
				if (!available) return;
				let current = true;
				const observe = (next) => {
					if (!current) return;
					setOperation(next);
					if (next !== null && isTrustedInstallPhase(next.phase) && next.phase !== "committed") setOperationDialogOpen(true);
				};
				const stop = onOperationState(observe);
				getOperation().then(observe, () => {
					if (current) setOperationRequestFailed(true);
				});
				return () => {
					current = false;
					stop();
				};
			}, [
				available,
				getOperation,
				onOperationState
			]);
			(0, react.useEffect)(() => {
				if (!available) return;
				let current = true;
				const observe = (next) => {
					if (current) setRecovery(next);
				};
				const stop = onRecoveryState(observe);
				getRecovery().then(observe, () => {
					if (current) setRecovery(null);
				});
				return () => {
					current = false;
					stop();
				};
			}, [
				available,
				getRecovery,
				onRecoveryState
			]);
			(0, react.useEffect)(() => {
				if (operation?.phase !== "committed") return;
				const terminalIdentity = `${operation.operationId}:${operation.updatedAt}`;
				if (observedTerminal.current === terminalIdentity) return;
				observedTerminal.current = terminalIdentity;
				setRevision((value) => value + 1);
				if (operation.action !== "install") return;
				if (detailEntry?.pluginId !== operation.pluginId || detailEntry.version !== operation.version) return;
				setCompatibilityState({ status: "loading" });
				checkCompatibility({
					pluginId: operation.pluginId,
					version: operation.version,
					action: "install"
				}).then((result) => {
					setCompatibilityState({
						status: "ready",
						result
					});
				}, () => {
					setCompatibilityState({ status: "error" });
				});
			}, [
				checkCompatibility,
				detailEntry,
				operation
			]);
			(0, react.useEffect)(() => {
				if (uninstallOffer === null || operation?.operationId !== uninstallOffer.operationId) return;
				if (operation.phase === "failed" || operation.phase === "rolled-back" || operation.phase === "recovery-failed") {
					setUninstallOffer(null);
					return;
				}
				if (operation.phase !== "committed" || uninstallOffer.declarations.length === 0) return;
				setOwnedDataSelected(uninstallOffer.declarations.map((value) => value.path));
				setOwnedDataAcknowledged(false);
				setOwnedDataStatus("idle");
				setOwnedDataRetaining(false);
				setRemovedOwnedDataCount(0);
				setOwnedDataConfirmation(uninstallOffer);
				setUninstallOffer(null);
			}, [operation, uninstallOffer]);
			(0, react.useEffect)(() => {
				if (operation?.action !== "uninstall" || operation.phase !== "committed" || uninstallOffer !== null || ownedDataConfirmation !== null) return;
				let current = true;
				getOwnedDataOffer().then((offer) => {
					if (!current || offer === null || offer.operationId !== operation.operationId || offer.pluginId !== operation.pluginId || offer.version !== operation.version || offer.declarations.length === 0) return;
					setOwnedDataSelected(offer.declarations.map((value) => value.path));
					setOwnedDataAcknowledged(false);
					setOwnedDataStatus("idle");
					setOwnedDataRetaining(false);
					setRemovedOwnedDataCount(0);
					setOwnedDataConfirmation({
						operationId: offer.operationId,
						pluginId: offer.pluginId,
						displayName: offer.packageName,
						declarations: offer.declarations
					});
				}, () => {});
				return () => {
					current = false;
				};
			}, [
				getOwnedDataOffer,
				operation,
				ownedDataConfirmation,
				uninstallOffer
			]);
			const retry = () => {
				setView({ status: "loading" });
				Promise.resolve().then(() => refresh(criteria)).then((result) => {
					setView({
						status: "ready",
						result
					});
				}, () => {
					setView({ status: "error" });
				});
			};
			const openDetail = (entry, element, initialCompatibility) => {
				const request = detailRequest.current + 1;
				detailRequest.current = request;
				detailOpener.current = element;
				setDetailEntry(entry);
				setDetailState({ status: "loading" });
				setCompatibilityState(entry.scope === "public" ? initialCompatibility ?? { status: "loading" } : null);
				Promise.resolve().then(() => detail({
					pluginId: entry.pluginId,
					version: entry.version
				})).then((result) => {
					if (detailRequest.current === request) setDetailState({
						status: "ready",
						result
					});
				}, () => {
					if (detailRequest.current === request) setDetailState({ status: "error" });
				});
				if (entry.scope === "public" && initialCompatibility === void 0) Promise.resolve().then(() => checkCompatibility({
					pluginId: entry.pluginId,
					version: entry.version,
					action: "install"
				})).then((result) => {
					if (detailRequest.current === request) setCompatibilityState({
						status: "ready",
						result
					});
				}, () => {
					if (detailRequest.current === request) setCompatibilityState({ status: "error" });
				});
			};
			const closeDetail = () => {
				detailRequest.current += 1;
				setDetailEntry(null);
				setDetailState(null);
				setCompatibilityState(null);
				setOperationRequestFailed(false);
				queueMicrotask(() => {
					detailOpener.current?.focus();
				});
			};
			const startInstall = (entry) => {
				setOperationRequestFailed(false);
				const idempotencyKey = `install:${entry.pluginId}:${entry.version}:${String(Date.now())}`;
				install({
					pluginId: entry.pluginId,
					version: entry.version,
					idempotencyKey
				}).then(async (result) => {
					if (result.kind === "busy") {
						const active = await getOperation();
						setOperation(active);
						setOperationDialogOpen(active !== null && isTrustedInstallPhase(active.phase));
						setOperationRequestFailed(active === null);
						return;
					}
					setOperation(result.operation);
					setOperationDialogOpen(isTrustedInstallPhase(result.operation.phase));
				}, () => {
					setOperationRequestFailed(true);
				});
			};
			const requestCatalogInstall = (entry, element) => {
				if (!mutationsEnabled || entry.scope !== "public" || entry.installed || entry.compatibility.status === "incompatible" || operation !== null && isMutationBlockingOperationPhase(operation.phase)) return;
				const request = catalogInstallRequest.current + 1;
				catalogInstallRequest.current = request;
				catalogInstallOpener.current = element;
				setCatalogInstallAcknowledged(false);
				setOperationRequestFailed(false);
				setCatalogInstall({
					status: "checking",
					entry
				});
				Promise.resolve().then(() => checkCompatibility({
					pluginId: entry.pluginId,
					version: entry.version,
					action: "install"
				})).then((decision) => {
					if (catalogInstallRequest.current !== request) return;
					if (!decision.allowed) {
						setCatalogInstall(null);
						openDetail(entry, element, {
							status: "ready",
							result: decision
						});
						return;
					}
					setCatalogInstall({
						status: "ready",
						entry,
						decision
					});
				}, () => {
					if (catalogInstallRequest.current !== request) return;
					setCatalogInstall(null);
					openDetail(entry, element, { status: "error" });
				});
			};
			const closeCatalogInstall = () => {
				catalogInstallRequest.current += 1;
				setCatalogInstall(null);
				setCatalogInstallAcknowledged(false);
				queueMicrotask(() => {
					catalogInstallOpener.current?.focus();
				});
			};
			const confirmCatalogInstall = () => {
				if (catalogInstall?.status !== "ready" || !catalogInstallAcknowledged) return;
				const entry = catalogInstall.entry;
				catalogInstallRequest.current += 1;
				setCatalogInstall(null);
				setCatalogInstallAcknowledged(false);
				startInstall(entry);
			};
			const startManagement = (item, action) => {
				if (item.pluginId === null || item.version === null) return;
				const version = action === "update" ? item.update?.version : item.version;
				if (version === void 0) return;
				setOperationRequestFailed(false);
				const idempotencyKey = `${action}:${item.pluginId}:${version}:${String(Date.now())}`;
				const rememberOwnedDataOffer = (next) => {
					if (action === "uninstall" && next?.action === "uninstall" && next.pluginId === item.pluginId) setUninstallOffer({
						operationId: next.operationId,
						pluginId: item.pluginId,
						displayName: item.displayName,
						declarations: item.ownedData
					});
				};
				manage({
					pluginId: item.pluginId,
					version,
					action,
					idempotencyKey
				}).then(async (result) => {
					if (result.kind === "busy") {
						const active = await getOperation();
						rememberOwnedDataOffer(active);
						setOperation(active);
						setOperationDialogOpen(active !== null && isTrustedInstallPhase(active.phase));
						setOperationRequestFailed(active === null);
						return;
					}
					rememberOwnedDataOffer(result.operation);
					setOperation(result.operation);
					setOperationDialogOpen(isTrustedInstallPhase(result.operation.phase));
				}, () => {
					setOperationRequestFailed(true);
				});
			};
			const retainOwnedData = () => {
				if (ownedDataConfirmation === null || ownedDataRetaining) return;
				setOwnedDataRetaining(true);
				persistOwnedDataRetention({
					operationId: ownedDataConfirmation.operationId,
					pluginId: ownedDataConfirmation.pluginId,
					confirmation: "retain-owned-data"
				}).then(() => {
					setOwnedDataConfirmation(null);
					setOwnedDataSelected([]);
					setOwnedDataAcknowledged(false);
					setOwnedDataStatus("idle");
					setOwnedDataRetaining(false);
				}, () => {
					setOwnedDataStatus("failed");
					setOwnedDataRetaining(false);
				});
			};
			const removeSelectedOwnedData = () => {
				if (ownedDataConfirmation === null || !ownedDataAcknowledged || ownedDataSelected.length === 0) return;
				const pluginId = ownedDataConfirmation.pluginId;
				setOwnedDataStatus("removing");
				removeOwnedData({
					operationId: ownedDataConfirmation.operationId,
					pluginId,
					paths: ownedDataSelected,
					confirmation: "remove-owned-data"
				}).then((result) => {
					setRemovedOwnedDataCount(result.removedPaths.length);
					setOwnedDataStatus("removed");
				}, () => {
					setOwnedDataStatus("failed");
				});
			};
			const requestManagement = (item, action) => {
				setManagementAcknowledged(false);
				setManagementConfirmation({
					item,
					action
				});
			};
			const confirmManagement = () => {
				if (managementConfirmation === null || !managementAcknowledged) return;
				const { item, action } = managementConfirmation;
				setManagementConfirmation(null);
				setManagementAcknowledged(false);
				startManagement(item, action);
			};
			const retryInstalled = () => {
				setInstalled({ status: "loading" });
				listInstalled().then((result) => {
					setInstalled({
						status: "ready",
						result
					});
				}, () => {
					setInstalled({ status: "error" });
				});
			};
			const retryPluginRecovery = () => {
				if (recovery === null || !recovery.canRetry || recoveryBusy) return;
				setRecoveryBusy(true);
				setDiagnosticResult(null);
				retryRecovery({ operationId: recovery.operationId }).then((next) => {
					setRecovery(next);
				}, () => {
					setDiagnosticResult("failed");
				}).finally(() => {
					setRecoveryBusy(false);
				});
			};
			const exportPluginRecovery = () => {
				if (recovery === null || !recovery.canExportDiagnostics || recoveryBusy) return;
				setRecoveryBusy(true);
				setDiagnosticResult(null);
				exportRecoveryDiagnostics({ operationId: recovery.operationId }).then((result) => {
					setDiagnosticResult(result.status);
				}, () => {
					setDiagnosticResult("failed");
				}).finally(() => {
					setRecoveryBusy(false);
				});
			};
			const moveKind = (event, index) => {
				let next;
				if (event.key === "ArrowRight") next = (index + 1) % 2;
				else if (event.key === "ArrowLeft") next = (index + 1) % 2;
				else if (event.key === "Home") next = 0;
				else if (event.key === "End") next = 1;
				else return;
				event.preventDefault();
				setKind(next === 0 ? "plugin" : "skill-pack");
				kindRefs.current[next]?.focus();
			};
			if (!available) return (0, react_jsx_runtime.jsxs)("div", {
				className: PluginCenterTab_module_css_default.unavailable,
				children: [(0, react_jsx_runtime.jsx)("strong", { children: t("unavailable") }), (0, react_jsx_runtime.jsx)("p", { children: t("unavailableHint") })]
			});
			const ready = view.status === "ready" ? view.result : null;
			const searchEntries = ready === null ? [] : uniqueEntries$1([ready]);
			const noEntries = ready !== null && searchEntries.length === 0;
			const freshness = ready === null ? t("loading") : `${t(FRESHNESS_KEYS$1[ready.freshness])} · ${t(SOURCE_KEYS$1[ready.source])} · ${new Date(ready.generatedAt).toLocaleString()}`;
			const pageTitle = t(kind === "plugin" ? "title" : "skillsTitle");
			const pageIntro = t(kind === "plugin" ? "intro" : "skillsIntro");
			return (0, react_jsx_runtime.jsxs)("div", {
				className: PluginCenterTab_module_css_default.root,
				"aria-busy": view.status === "loading" || detailState?.status === "loading" || compatibilityState?.status === "loading" || catalogInstall?.status === "checking" || operation !== null && !isTerminalOperationPhase(operation.phase) || recoveryBusy || recovery?.phase === "recovering",
				"data-development": development || void 0,
				title: development ? t("developmentMode") : void 0,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: PluginCenterTab_module_css_default.topbar,
						children: detailEntry === null ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("div", {
							className: PluginCenterTab_module_css_default.kindTabs,
							role: "tablist",
							"aria-label": t("title"),
							children: ["plugin", "skill-pack"].map((value, index) => {
								const selected = kind === value;
								return (0, react_jsx_runtime.jsx)("button", {
									ref: (element) => {
										kindRefs.current[index] = element;
									},
									id: `${kindTabsId}-${value}`,
									type: "button",
									role: "tab",
									"aria-selected": selected,
									tabIndex: selected ? 0 : -1,
									"data-active": selected || void 0,
									onClick: () => {
										setKind(value);
									},
									onKeyDown: (event) => {
										moveKind(event, index);
									},
									children: t(value === "plugin" ? "plugins" : "skills")
								}, value);
							})
						}), (0, react_jsx_runtime.jsx)("div", {
							className: PluginCenterTab_module_css_default.topActions,
							children: (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": t("refresh"),
								title: freshness,
								onClick: retry,
								children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline16, { size: 16 })
							})
						})] }) : (0, react_jsx_runtime.jsxs)("div", {
							className: PluginCenterTab_module_css_default.breadcrumbs,
							children: [
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: closeDetail,
									"aria-label": t("backToCatalog"),
									children: t(detailEntry.catalogKind === "plugin" ? "plugins" : "skills")
								}),
								(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, { "aria-hidden": "true" }),
								(0, react_jsx_runtime.jsx)("span", { children: detailEntry.displayName })
							]
						})
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: PluginCenterTab_module_css_default.scroller,
						children: [(0, react_jsx_runtime.jsxs)("main", {
							className: PluginCenterTab_module_css_default.content,
							hidden: detailEntry !== null,
							children: [
								(0, react_jsx_runtime.jsxs)("header", {
									className: PluginCenterTab_module_css_default.header,
									children: [(0, react_jsx_runtime.jsx)("h1", { children: pageTitle }), (0, react_jsx_runtime.jsx)("p", { children: pageIntro })]
								}),
								recovery !== null && recovery.phase !== "rolled-back" ? (0, react_jsx_runtime.jsxs)("section", {
									className: PluginCenterTab_module_css_default.recoveryNotice,
									"data-recovery-phase": recovery.phase,
									"aria-live": recovery.phase === "recovery-failed" ? "assertive" : "polite",
									children: [
										(0, react_jsx_runtime.jsx)("div", {
											className: PluginCenterTab_module_css_default.recoveryStatusIcon,
											"aria-hidden": "true",
											children: recovery.phase === "recovering" ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconLoadingOutline16, { size: 18 }) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, { size: 18 })
										}),
										(0, react_jsx_runtime.jsxs)("div", {
											className: PluginCenterTab_module_css_default.recoveryContent,
											children: [
												(0, react_jsx_runtime.jsx)("strong", { children: t(recovery.phase === "recovering" ? "recoveryRunningTitle" : "recoveryFailedTitle") }),
												(0, react_jsx_runtime.jsx)("p", { children: t(recovery.phase === "recovering" ? "recoveryRunning" : "recoveryFailed") }),
												(0, react_jsx_runtime.jsx)("div", {
													className: PluginCenterTab_module_css_default.recoveryMeta,
													children: (0, react_jsx_runtime.jsxs)("span", { children: [
														t("recoveryAttempt"),
														" ",
														recovery.attempt
													] })
												}),
												(0, react_jsx_runtime.jsxs)("div", {
													className: PluginCenterTab_module_css_default.recoveryReason,
													children: [
														(0, react_jsx_runtime.jsx)("span", {
															className: PluginCenterTab_module_css_default.recoveryReasonLabel,
															children: t("recoveryReasonCode")
														}),
														(0, react_jsx_runtime.jsx)("span", { children: recovery.recoveryReasonCode === null ? t("recoveryReasonPending") : t(RECOVERY_REASON_KEYS[recovery.recoveryReasonCode]) }),
														(0, react_jsx_runtime.jsx)("code", { children: recovery.recoveryReasonCode ?? recovery.operationFailureCode })
													]
												}),
												diagnosticResult !== null ? (0, react_jsx_runtime.jsx)("span", {
													className: PluginCenterTab_module_css_default.recoveryFeedback,
													role: "status",
													children: t(diagnosticResult === "saved" ? "diagnosticSaved" : diagnosticResult === "cancelled" ? "diagnosticCancelled" : "recoveryRequestFailed")
												}) : null
											]
										}),
										(0, react_jsx_runtime.jsxs)("div", {
											className: PluginCenterTab_module_css_default.recoveryActions,
											children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												variant: "primary",
												size: "sm",
												icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline16, { size: 14 }),
												disabled: !recovery.canRetry || recoveryBusy,
												onClick: retryPluginRecovery,
												children: t("retryRecovery")
											}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												variant: "outline",
												size: "sm",
												icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDownloadOutline16, { size: 14 }),
												disabled: !recovery.canExportDiagnostics || recoveryBusy,
												onClick: exportPluginRecovery,
												children: t("exportDiagnostics")
											})]
										})
									]
								}) : null,
								(0, react_jsx_runtime.jsxs)("label", {
									className: PluginCenterTab_module_css_default.search,
									children: [
										(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, { "aria-hidden": "true" }),
										(0, react_jsx_runtime.jsx)("span", {
											className: PluginCenterTab_module_css_default.visuallyHidden,
											children: t(kind === "plugin" ? "searchPlugins" : "searchSkills")
										}),
										(0, react_jsx_runtime.jsx)("input", {
											type: "search",
											value: query,
											placeholder: t(kind === "plugin" ? "searchPlugins" : "searchSkills"),
											"aria-label": t(kind === "plugin" ? "searchPlugins" : "searchSkills"),
											onChange: (event) => {
												setQuery(event.currentTarget.value);
											}
										})
									]
								}),
								(0, react_jsx_runtime.jsxs)("section", {
									className: PluginCenterTab_module_css_default.installedSection,
									children: [
										(0, react_jsx_runtime.jsxs)("div", {
											className: PluginCenterTab_module_css_default.installedHeading,
											children: [(0, react_jsx_runtime.jsx)("h2", { children: t("installedTitle") }), (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												"aria-expanded": installedOpen,
												"aria-label": t("manageInstalled"),
												title: t("manageInstalled"),
												onClick: () => {
													setInstalledOpen((value) => !value);
												},
												children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSettingsOutline16, { size: 16 })
											})]
										}),
										(0, react_jsx_runtime.jsx)("div", {
											className: PluginCenterTab_module_css_default.installedIcons,
											children: (0, react_jsx_runtime.jsx)(InstalledIcons, {
												state: installed,
												onOpen: () => {
													setInstalledOpen(true);
												},
												t
											})
										}),
										installedOpen ? (0, react_jsx_runtime.jsx)(InstalledPluginsPanel, {
											state: installed,
											mutationsEnabled,
											onRetry: retryInstalled,
											onSettings: openPluginSettings,
											onAction: requestManagement,
											t
										}) : null
									]
								}),
								(0, react_jsx_runtime.jsxs)("div", {
									className: PluginCenterTab_module_css_default.toolbar,
									children: [(0, react_jsx_runtime.jsxs)("div", {
										className: PluginCenterTab_module_css_default.scope,
										"aria-label": t("publicScope"),
										children: [(0, react_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-pressed": scope === "public",
											onClick: () => {
												setScope("public");
											},
											children: t("publicScope")
										}), (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-pressed": scope === "local",
											onClick: () => {
												setScope("local");
											},
											children: t("localScope")
										})]
									}), (0, react_jsx_runtime.jsx)("span", {
										className: PluginCenterTab_module_css_default.catalogMeta,
										children: freshness
									})]
								}),
								ready?.freshness === "stale" ? (0, react_jsx_runtime.jsxs)("div", {
									className: PluginCenterTab_module_css_default.catalogNotice,
									children: [(0, react_jsx_runtime.jsxs)("span", { children: [
										t("stale"),
										" · ",
										t(SOURCE_KEYS$1[ready.source])
									] }), (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: retry,
										children: t("retry")
									})]
								}) : null,
								view.status === "loading" ? (0, react_jsx_runtime.jsx)(CatalogSkeleton, { t }) : null,
								view.status === "error" ? (0, react_jsx_runtime.jsxs)("div", {
									className: PluginCenterTab_module_css_default.failure,
									children: [(0, react_jsx_runtime.jsx)("p", {
										role: "alert",
										children: t("error")
									}), (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: retry,
										children: t("retry")
									})]
								}) : null,
								operationRequestFailed ? (0, react_jsx_runtime.jsx)("p", {
									className: PluginCenterTab_module_css_default.operationRequestError,
									role: "alert",
									children: t("operationRequestFailed")
								}) : null,
								noEntries ? (0, react_jsx_runtime.jsx)("p", {
									className: PluginCenterTab_module_css_default.status,
									children: query.trim() === "" ? t("empty") : t("emptySearch")
								}) : null,
								ready !== null && query.trim() !== "" && searchEntries.length > 0 ? (0, react_jsx_runtime.jsxs)("section", {
									className: PluginCenterTab_module_css_default.catalogSection,
									"data-catalog-section": "search",
									children: [(0, react_jsx_runtime.jsxs)("div", {
										className: PluginCenterTab_module_css_default.sectionHeading,
										children: [(0, react_jsx_runtime.jsx)("h2", { children: t("searchResults") }), (0, react_jsx_runtime.jsxs)("span", { children: [
											searchEntries.length,
											" ",
											t("resultUnit")
										] })]
									}), (0, react_jsx_runtime.jsx)("ul", {
										className: PluginCenterTab_module_css_default.cards,
										children: searchEntries.map((entry) => (0, react_jsx_runtime.jsx)(CatalogCard, {
											entry,
											installedItem: installedCatalogItems.get(`${entry.catalogKind}:${entry.pluginId}`) ?? null,
											mutationsEnabled,
											operation,
											checking: catalogInstall?.status === "checking" && catalogInstall.entry.pluginId === entry.pluginId && catalogInstall.entry.version === entry.version,
											onOpen: openDetail,
											onInstall: requestCatalogInstall,
											onManage: requestManagement,
											t
										}, `${entry.pluginId}@${entry.version}`))
									})]
								}) : null,
								ready !== null && query.trim() === "" ? (0, react_jsx_runtime.jsx)("div", {
									className: PluginCenterTab_module_css_default.sections,
									children: [
										"featured",
										"popular",
										"recent"
									].map((section) => (0, react_jsx_runtime.jsx)(CatalogSectionView, {
										section,
										entries: ready.sections[section],
										installedItems: installedCatalogItems,
										mutationsEnabled,
										operation,
										checkingEntry: catalogInstall?.status === "checking" ? `${catalogInstall.entry.pluginId}@${catalogInstall.entry.version}` : null,
										onOpen: openDetail,
										onInstall: requestCatalogInstall,
										onManage: requestManagement,
										t
									}, section))
								}) : null
							]
						}), detailEntry !== null && detailState !== null ? (0, react_jsx_runtime.jsx)(PluginDetailPage, {
							entry: detailEntry,
							state: detailState,
							compatibility: compatibilityState,
							mutationsEnabled,
							operation,
							operationRequestFailed,
							onInstall: () => {
								startInstall(detailEntry);
							},
							t
						}) : null]
					}),
					(0, react_jsx_runtime.jsx)(PluginOperationDialog, {
						open: operationDialogOpen,
						operation,
						installedItem: operationInstalledItem,
						onClose: () => {
							setOperationDialogOpen(false);
						},
						t
					}),
					catalogInstall?.status === "ready" ? (0, react_jsx_runtime.jsx)(PluginInstallConfirmation, {
						open: true,
						entry: catalogInstall.entry,
						decision: catalogInstall.decision,
						acknowledged: catalogInstallAcknowledged,
						onAcknowledgedChange: setCatalogInstallAcknowledged,
						onCancel: closeCatalogInstall,
						onConfirm: confirmCatalogInstall,
						t
					}) : null,
					managementConfirmation !== null ? (0, react_jsx_runtime.jsx)(PluginManagementConfirmation, {
						open: true,
						item: managementConfirmation.item,
						action: managementConfirmation.action,
						acknowledged: managementAcknowledged,
						onAcknowledgedChange: setManagementAcknowledged,
						onCancel: () => {
							setManagementConfirmation(null);
							setManagementAcknowledged(false);
						},
						onConfirm: confirmManagement,
						t
					}) : null,
					ownedDataConfirmation !== null ? (0, react_jsx_runtime.jsx)(PluginOwnedDataRemovalConfirmation, {
						open: !operationDialogOpen,
						displayName: ownedDataConfirmation.displayName,
						declarations: ownedDataConfirmation.declarations,
						selectedPaths: ownedDataSelected,
						acknowledged: ownedDataAcknowledged,
						status: ownedDataStatus,
						retaining: ownedDataRetaining,
						removedCount: removedOwnedDataCount,
						onSelectionChange: setOwnedDataSelected,
						onAcknowledgedChange: setOwnedDataAcknowledged,
						onRetain: retainOwnedData,
						onRemove: removeSelectedOwnedData,
						onDone: retainOwnedData,
						t
					}) : null
				]
			});
		}
		//#endregion
		//#region lib/types/client/PluginDiscoveryNavItem.js
		/** First-level sidebar entry that opens the independent Plugin Discovery page. */
		function PluginDiscoveryNavItem({ wide, primaryPage, pageId, open, t }) {
			const selected = primaryPage === pageId;
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				label: t("discoveryNav"),
				delayMs: 500,
				disabled: wide,
				children: (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: `${PluginCenterNavItem_module_css_default.entry}${wide ? "" : ` ${PluginCenterNavItem_module_css_default.rail}`}`,
					"aria-current": selected ? "page" : void 0,
					"aria-label": t("discoveryNav"),
					"data-selected": selected || void 0,
					onClick: open,
					children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSparkle16, { size: wide ? 16 : 18 }), wide ? (0, react_jsx_runtime.jsx)("span", { children: t("discoveryNav") }) : null]
				})
			});
		}
		//#endregion
		//#region \0dsh-css:./packages/client/ui-plugin-center/src/client/PluginDiscoveryPage.module.css.mjs
		const css = ".W1gUZG_root{background:var(--dsw-alias-bg-base);width:100%;min-width:0;min-height:0;color:var(--dsw-alias-label-primary);flex-direction:column;flex:1;display:flex;overflow:hidden}.W1gUZG_topbar{z-index:4;box-sizing:border-box;background:var(--dsw-alias-bg-base);flex:none;justify-content:flex-end;align-items:center;gap:8px;height:48px;padding:6px 12px;display:flex;position:relative}html[data-dsh-desktop=true] .W1gUZG_topbar{-webkit-app-region:drag}html[data-dsh-desktop=true] .W1gUZG_topbar button{-webkit-app-region:no-drag}.W1gUZG_freshness{min-width:0;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:11px;line-height:18px;overflow:hidden}.W1gUZG_refreshButton,.W1gUZG_drawerClose{width:30px;height:30px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:8px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.W1gUZG_refreshButton:hover,.W1gUZG_drawerClose:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.W1gUZG_scroller{--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);flex:1;min-height:0;overflow-y:auto}.W1gUZG_content{box-sizing:border-box;width:min(1060px,100% - 48px);margin:0 auto;padding:12px 0 72px}.W1gUZG_header{flex-direction:column;gap:5px;padding:0 8px 16px;display:flex}.W1gUZG_header h1,.W1gUZG_header p,.W1gUZG_sectionHeading h2,.W1gUZG_sectionHeading p,.W1gUZG_featureCopy h2,.W1gUZG_featureCopy p,.W1gUZG_rankCopy strong,.W1gUZG_rankCopy span,.W1gUZG_cardCopy strong,.W1gUZG_cardCopy p,.W1gUZG_drawerHeader h2,.W1gUZG_drawerHeader p,.W1gUZG_drawerSection h3,.W1gUZG_drawerSection p,.W1gUZG_status,.W1gUZG_error{margin:0}.W1gUZG_header h1{letter-spacing:-.35px;font-size:28px;font-weight:500;line-height:38px}.W1gUZG_header p{color:var(--dsw-alias-label-secondary);font-size:15px;line-height:23px}.W1gUZG_agentFinder{border:1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 26%, var(--dsw-alias-border-l2));background:radial-gradient(circle at 0 0, color-mix(in srgb, var(--dsw-alias-state-business-primary) 14%, transparent), transparent 42%), color-mix(in srgb, var(--dsw-alias-bg-layer-1) 82%, transparent);box-shadow:var(--dsw-shadow-lv1);backdrop-filter:blur(18px);border-radius:16px;grid-template-columns:38px minmax(0,1fr);gap:13px;margin:0 0 14px;padding:17px 18px;display:grid}.W1gUZG_agentFinderIcon{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, var(--dsw-alias-bg-layer-2));width:38px;height:38px;color:var(--dsw-alias-state-business-primary);border-radius:12px;justify-content:center;align-items:center;display:inline-flex}.W1gUZG_agentFinderBody,.W1gUZG_agentFinderCopy{flex-direction:column;min-width:0;display:flex}.W1gUZG_agentFinderBody{gap:12px}.W1gUZG_agentFinderCopy{gap:3px}.W1gUZG_agentFinderCopy h2,.W1gUZG_agentFinderCopy p,.W1gUZG_agentFinderFeedback{margin:0}.W1gUZG_agentFinderCopy h2{font-size:15px;font-weight:600;line-height:22px}.W1gUZG_agentFinderCopy p,.W1gUZG_agentFinderFeedback{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.W1gUZG_agentFinderForm{gap:8px;min-width:0;display:flex}.W1gUZG_agentFinderForm input{border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-base) 76%, transparent);min-width:0;height:38px;color:var(--dsw-alias-label-primary);font:inherit;border-radius:10px;outline:none;flex:1;padding:0 12px;font-size:13px}.W1gUZG_agentFinderForm input:focus{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 48%, var(--dsw-alias-border-l2));box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent)}.W1gUZG_agentFinderForm button{background:var(--dsw-alias-state-business-primary);height:38px;color:var(--dsw-alias-label-primary-foreground);font:inherit;cursor:pointer;border:0;border-radius:10px;flex:none;justify-content:center;align-items:center;gap:6px;padding:0 14px;font-size:12px;font-weight:500;display:inline-flex}.W1gUZG_agentFinderForm button:disabled{opacity:.48;cursor:default}.W1gUZG_agentFinderFeedback{color:var(--dsw-alias-label-tertiary)}.W1gUZG_search{align-items:center;margin:0 0 14px;display:flex;position:relative}.W1gUZG_search>svg{color:var(--dsw-alias-label-tertiary);pointer-events:none;position:absolute;left:14px}.W1gUZG_search input{border:1px solid var(--dsw-alias-border-l2);box-sizing:border-box;background:color-mix(in srgb, var(--dsw-alias-bg-layer-2) 88%, transparent);width:100%;height:40px;color:var(--dsw-alias-label-primary);font:inherit;backdrop-filter:blur(18px);border-radius:20px;outline:none;padding:0 42px;font-size:14px;line-height:20px}.W1gUZG_search input:focus{border-color:var(--dsw-alias-border-l3);box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary) 14%, transparent)}.W1gUZG_controls{flex-direction:column;gap:10px;margin-bottom:22px;padding:0 2px;display:flex}.W1gUZG_viewTabs,.W1gUZG_categories{align-items:center;gap:5px;min-width:0;display:flex;overflow-x:auto}.W1gUZG_viewTabs button,.W1gUZG_categories button{color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;white-space:nowrap;background:0 0;border:0;flex:none}.W1gUZG_viewTabs button{border-radius:9px;padding:5px 11px;font-size:13px;line-height:22px}.W1gUZG_categories button{border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-layer-2) 72%, transparent);border-radius:15px;padding:3px 10px;font-size:11px;line-height:20px}.W1gUZG_viewTabs button[aria-pressed=true],.W1gUZG_categories button[aria-pressed=true]{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}.W1gUZG_categories button[aria-pressed=true]{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 34%, var(--dsw-alias-border-l2))}.W1gUZG_overview{grid-template-columns:minmax(0,1.55fr) minmax(280px,.8fr);gap:16px;margin-bottom:30px;display:grid}.W1gUZG_overview[data-single]{grid-template-columns:1fr}.W1gUZG_featureCard,.W1gUZG_ranking,.W1gUZG_card{border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2) 84%, transparent);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 78%, transparent);backdrop-filter:blur(18px)}.W1gUZG_featureCard{min-height:238px;box-shadow:var(--dsw-shadow-lv1);border-radius:18px;flex-direction:column;justify-content:space-between;display:flex;overflow:hidden}.W1gUZG_featureBody{box-sizing:border-box;background:radial-gradient(circle at 10% 10%, color-mix(in srgb, var(--dsw-alias-state-business-primary) 13%, transparent), transparent 46%), transparent;width:100%;min-width:0;color:inherit;font:inherit;text-align:left;cursor:pointer;border:0;flex:1;grid-template-columns:68px minmax(0,1fr);align-content:center;gap:18px;padding:28px;display:grid}.W1gUZG_mark{border:1px solid var(--dsw-alias-border-l2);box-sizing:border-box;background:var(--dsw-alias-state-business-primary);width:44px;height:44px;color:var(--dsw-static-neutral-00);border-radius:12px;flex:none;place-items:center;font-size:17px;font-weight:600;display:grid;position:relative;overflow:hidden}.W1gUZG_mark[data-featured]{border-radius:17px;width:68px;height:68px;font-size:24px}.W1gUZG_mark[data-compact]{border-radius:10px;width:36px;height:36px;font-size:14px}.W1gUZG_mark img{object-fit:cover;width:100%;height:100%;position:absolute;inset:0}.W1gUZG_featureCopy{flex-direction:column;justify-content:center;gap:8px;min-width:0;display:flex}.W1gUZG_eyebrow,.W1gUZG_badge,.W1gUZG_chip{white-space:nowrap;border-radius:999px;align-items:center;width:fit-content;display:inline-flex}.W1gUZG_eyebrow{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent);color:var(--dsw-alias-state-business-primary);gap:5px;padding:3px 8px;font-size:11px;line-height:18px}.W1gUZG_featureCopy h2{text-overflow:ellipsis;white-space:nowrap;font-size:20px;font-weight:550;line-height:28px;overflow:hidden}.W1gUZG_featureCopy p{color:var(--dsw-alias-label-secondary);-webkit-line-clamp:2;-webkit-box-orient:vertical;font-size:13px;line-height:21px;display:-webkit-box;overflow:hidden}.W1gUZG_featureMeta,.W1gUZG_cardMeta,.W1gUZG_drawerBadges,.W1gUZG_chips{flex-wrap:wrap;align-items:center;gap:6px;min-width:0;display:flex}.W1gUZG_badge,.W1gUZG_chip{border:1px solid var(--dsw-alias-border-l1);background:color-mix(in srgb, var(--dsw-alias-bg-layer-2) 78%, transparent);color:var(--dsw-alias-label-tertiary);padding:2px 7px;font-size:10px;line-height:17px}.W1gUZG_badge[data-state=verified],.W1gUZG_badge[data-state=compatible]{color:var(--dsw-alias-state-success-primary)}.W1gUZG_badge[data-state=incompatible]{color:var(--dsw-alias-state-error-primary)}.W1gUZG_featureFooter{border-top:1px solid var(--dsw-alias-border-l1);box-sizing:border-box;justify-content:space-between;align-items:center;gap:16px;min-height:58px;padding:10px 18px 10px 28px;display:flex}.W1gUZG_publisher,.W1gUZG_cardDate{min-width:0;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:11px;line-height:18px;overflow:hidden}.W1gUZG_ranking{border-radius:18px;flex-direction:column;min-width:0;display:flex;overflow:hidden}.W1gUZG_rankingHeader,.W1gUZG_sectionHeading{justify-content:space-between;align-items:center;gap:16px;display:flex}.W1gUZG_rankingHeader{border-bottom:1px solid var(--dsw-alias-border-l1);min-height:52px;padding:0 16px}.W1gUZG_rankingHeader h2{margin:0;font-size:15px;font-weight:500;line-height:23px}.W1gUZG_rankingHeader button,.W1gUZG_sectionHeading button{color:var(--dsw-alias-state-business-primary);font:inherit;cursor:pointer;background:0 0;border:0;padding:3px 0;font-size:11px;line-height:18px}.W1gUZG_rankList{flex-direction:column;flex:1;margin:0;padding:6px;list-style:none;display:flex}.W1gUZG_rankRow{border-radius:10px;grid-template-columns:24px minmax(0,1fr) auto;align-items:center;gap:8px;min-width:0;padding:6px;display:grid}.W1gUZG_rankRow:hover{background:var(--dsw-alias-interactive-bg-hover)}.W1gUZG_rankNumber{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;text-align:center;font-size:10px}.W1gUZG_rankButton{min-width:0;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:9px;padding:0;display:grid}.W1gUZG_rankCopy{flex-direction:column;min-width:0;display:flex}.W1gUZG_rankCopy strong,.W1gUZG_rankCopy span{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.W1gUZG_rankCopy strong{font-size:12px;font-weight:500;line-height:19px}.W1gUZG_rankCopy span{color:var(--dsw-alias-label-tertiary);font-size:10px;line-height:16px}.W1gUZG_rankAction{min-width:58px}.W1gUZG_section{flex-direction:column;gap:12px;margin-top:26px;display:flex}.W1gUZG_sectionHeading{border-bottom:1px solid var(--dsw-alias-border-l2);min-height:36px;padding:0 8px 8px}.W1gUZG_sectionHeading>div{min-width:0}.W1gUZG_sectionHeading h2{font-size:17px;font-weight:500;line-height:25px}.W1gUZG_sectionHeading p{color:var(--dsw-alias-label-tertiary);margin-top:2px;font-size:11px;line-height:18px}.W1gUZG_cardGrid{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0;padding:0;list-style:none;display:grid}.W1gUZG_card{border-radius:15px;flex-direction:column;min-width:0;min-height:178px;transition:border-color .12s,transform .12s;display:flex;overflow:hidden}.W1gUZG_card:hover{border-color:var(--dsw-alias-border-l3);transform:translateY(-1px)}.W1gUZG_cardButton{width:100%;min-width:0;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;flex-direction:column;flex:1;gap:10px;padding:14px 14px 8px;display:flex}.W1gUZG_cardTitle{grid-template-columns:44px minmax(0,1fr);align-items:center;gap:10px;min-width:0;display:grid}.W1gUZG_cardCopy{flex-direction:column;flex:1;gap:3px;min-width:0;display:flex}.W1gUZG_cardCopy strong{text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:500;line-height:20px;overflow:hidden}.W1gUZG_cardCopy p{color:var(--dsw-alias-label-tertiary);-webkit-line-clamp:2;-webkit-box-orient:vertical;font-size:11px;line-height:18px;display:-webkit-box;overflow:hidden}.W1gUZG_cardFooter{border-top:1px solid var(--dsw-alias-border-l1);box-sizing:border-box;justify-content:space-between;align-items:center;gap:8px;min-height:44px;padding:7px 10px 7px 14px;display:flex}.W1gUZG_emptyPanel,.W1gUZG_error,.W1gUZG_status{border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 78%, transparent);color:var(--dsw-alias-label-tertiary);border-radius:14px;padding:18px;font-size:13px;line-height:20px}.W1gUZG_error{color:var(--dsw-alias-state-error-primary);justify-content:space-between;align-items:center;gap:12px;display:flex}.W1gUZG_error button{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;background:0 0;border-radius:8px;padding:4px 10px}.W1gUZG_skeletonGrid{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;display:grid}.W1gUZG_skeletonCard{background:var(--dsw-alias-interactive-bg-hover);border-radius:15px;height:178px;animation:1.25s ease-in-out infinite alternate W1gUZG_discovery-pulse}@keyframes W1gUZG_discovery-pulse{0%{opacity:.45}to{opacity:.88}}.W1gUZG_drawerBackdrop{z-index:20;background:color-mix(in srgb, var(--dsw-alias-bg-base) 38%, transparent);backdrop-filter:blur(3px);position:fixed;inset:0}.W1gUZG_drawer{--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);border-left:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 94%, transparent);width:min(448px,100% - 40px);box-shadow:var(--dsw-shadow-lv3);backdrop-filter:blur(24px);flex-direction:column;display:flex;position:absolute;top:0;bottom:0;right:0;overflow-y:auto}.W1gUZG_drawerTopbar{z-index:1;box-sizing:border-box;background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 92%, transparent);backdrop-filter:blur(20px);justify-content:flex-end;align-items:center;min-height:48px;padding:8px 12px;display:flex;position:sticky;top:0}.W1gUZG_drawerBody{flex-direction:column;gap:18px;padding:4px 24px 28px;display:flex}.W1gUZG_drawerHeader{grid-template-columns:58px minmax(0,1fr);align-items:center;gap:14px;display:grid}.W1gUZG_drawerHeader .W1gUZG_mark{border-radius:15px;width:58px;height:58px;font-size:21px}.W1gUZG_drawerHeader h2{text-overflow:ellipsis;white-space:nowrap;font-size:20px;font-weight:500;line-height:28px;overflow:hidden}.W1gUZG_drawerHeader p{color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;margin-top:3px;font-size:12px;line-height:19px;overflow:hidden}.W1gUZG_drawerScreenshots{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;display:grid}.W1gUZG_drawerScreenshots img{border:1px solid var(--dsw-alias-border-l2);object-fit:cover;border-radius:10px;width:100%;height:112px}.W1gUZG_drawerDescription{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:21px}.W1gUZG_drawerSection{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:8px;padding-top:15px;display:flex}.W1gUZG_drawerSection h3{font-size:13px;font-weight:500;line-height:20px}.W1gUZG_drawerSection p,.W1gUZG_drawerSection li{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:20px}.W1gUZG_drawerSection ul{margin:0;padding-left:18px}.W1gUZG_preflight{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);border-radius:12px;padding:11px 12px}.W1gUZG_preflight[data-state=allowed]{border-color:color-mix(in srgb, var(--dsw-alias-state-success-primary) 32%, var(--dsw-alias-border-l2))}.W1gUZG_preflight[data-state=blocked],.W1gUZG_preflight[data-state=error]{border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 32%, var(--dsw-alias-border-l2))}.W1gUZG_drawerFacts{gap:1px;margin:0;display:grid}.W1gUZG_drawerFacts div{border-bottom:1px solid var(--dsw-alias-border-l1);justify-content:space-between;align-items:baseline;gap:16px;padding:7px 0;display:flex}.W1gUZG_drawerFacts dt,.W1gUZG_drawerFacts dd{font-size:11px;line-height:18px}.W1gUZG_drawerFacts dt{color:var(--dsw-alias-label-tertiary)}.W1gUZG_drawerFacts dd{min-width:0;color:var(--dsw-alias-label-primary);text-align:right;text-overflow:ellipsis;white-space:nowrap;margin:0;overflow:hidden}.W1gUZG_drawerFooter{border-top:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 92%, transparent);backdrop-filter:blur(20px);justify-content:space-between;align-items:center;gap:12px;padding:12px 24px;display:flex;position:sticky;bottom:0}.W1gUZG_drawerFooter span{min-width:0;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:11px;line-height:18px;overflow:hidden}.W1gUZG_visuallyHidden{clip:rect(0 0 0 0);white-space:nowrap;border:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}.W1gUZG_refreshButton:focus-visible,.W1gUZG_agentFinderForm input:focus-visible,.W1gUZG_agentFinderForm button:focus-visible,.W1gUZG_drawerClose:focus-visible,.W1gUZG_viewTabs button:focus-visible,.W1gUZG_categories button:focus-visible,.W1gUZG_featureBody:focus-visible,.W1gUZG_rankButton:focus-visible,.W1gUZG_rankingHeader button:focus-visible,.W1gUZG_sectionHeading button:focus-visible,.W1gUZG_cardButton:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}@media (width<=980px){.W1gUZG_overview{grid-template-columns:1fr}.W1gUZG_ranking{min-height:220px}.W1gUZG_cardGrid,.W1gUZG_skeletonGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (width<=680px){.W1gUZG_content{width:min(100% - 28px,1060px)}.W1gUZG_cardGrid,.W1gUZG_skeletonGrid,.W1gUZG_agentFinder{grid-template-columns:1fr}.W1gUZG_agentFinderIcon{display:none}.W1gUZG_agentFinderForm{flex-direction:column}.W1gUZG_agentFinderForm button{width:100%}.W1gUZG_featureBody{grid-template-columns:52px minmax(0,1fr);padding:20px}.W1gUZG_mark[data-featured]{border-radius:14px;width:52px;height:52px}.W1gUZG_featureFooter{padding-left:20px}}@media (prefers-reduced-motion:reduce){.W1gUZG_card,.W1gUZG_skeletonCard{transition:none;animation:none}}";
		const tagId = "@deepseek-ai/dsh-client-ui-plugin-center/PluginDiscoveryPage.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-plugin-center";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var PluginDiscoveryPage_module_css_default = {
			"drawerHeader": "W1gUZG_drawerHeader",
			"rankCopy": "W1gUZG_rankCopy",
			"featureCopy": "W1gUZG_featureCopy",
			"agentFinderForm": "W1gUZG_agentFinderForm",
			"mark": "W1gUZG_mark",
			"chip": "W1gUZG_chip",
			"freshness": "W1gUZG_freshness",
			"drawerBackdrop": "W1gUZG_drawerBackdrop",
			"drawerDescription": "W1gUZG_drawerDescription",
			"discovery-pulse": "W1gUZG_discovery-pulse",
			"controls": "W1gUZG_controls",
			"eyebrow": "W1gUZG_eyebrow",
			"categories": "W1gUZG_categories",
			"rankingHeader": "W1gUZG_rankingHeader",
			"rankList": "W1gUZG_rankList",
			"refreshButton": "W1gUZG_refreshButton",
			"drawerBadges": "W1gUZG_drawerBadges",
			"preflight": "W1gUZG_preflight",
			"drawer": "W1gUZG_drawer",
			"cardFooter": "W1gUZG_cardFooter",
			"skeletonGrid": "W1gUZG_skeletonGrid",
			"chips": "W1gUZG_chips",
			"header": "W1gUZG_header",
			"cardGrid": "W1gUZG_cardGrid",
			"agentFinderIcon": "W1gUZG_agentFinderIcon",
			"featureCard": "W1gUZG_featureCard",
			"sectionHeading": "W1gUZG_sectionHeading",
			"badge": "W1gUZG_badge",
			"drawerBody": "W1gUZG_drawerBody",
			"drawerFacts": "W1gUZG_drawerFacts",
			"emptyPanel": "W1gUZG_emptyPanel",
			"status": "W1gUZG_status",
			"agentFinderBody": "W1gUZG_agentFinderBody",
			"cardMeta": "W1gUZG_cardMeta",
			"root": "W1gUZG_root",
			"rankRow": "W1gUZG_rankRow",
			"visuallyHidden": "W1gUZG_visuallyHidden",
			"rankButton": "W1gUZG_rankButton",
			"drawerClose": "W1gUZG_drawerClose",
			"publisher": "W1gUZG_publisher",
			"drawerFooter": "W1gUZG_drawerFooter",
			"cardDate": "W1gUZG_cardDate",
			"drawerTopbar": "W1gUZG_drawerTopbar",
			"viewTabs": "W1gUZG_viewTabs",
			"search": "W1gUZG_search",
			"cardCopy": "W1gUZG_cardCopy",
			"error": "W1gUZG_error",
			"topbar": "W1gUZG_topbar",
			"cardTitle": "W1gUZG_cardTitle",
			"rankNumber": "W1gUZG_rankNumber",
			"drawerSection": "W1gUZG_drawerSection",
			"agentFinderFeedback": "W1gUZG_agentFinderFeedback",
			"agentFinder": "W1gUZG_agentFinder",
			"rankAction": "W1gUZG_rankAction",
			"section": "W1gUZG_section",
			"card": "W1gUZG_card",
			"agentFinderCopy": "W1gUZG_agentFinderCopy",
			"skeletonCard": "W1gUZG_skeletonCard",
			"cardButton": "W1gUZG_cardButton",
			"content": "W1gUZG_content",
			"overview": "W1gUZG_overview",
			"ranking": "W1gUZG_ranking",
			"featureBody": "W1gUZG_featureBody",
			"featureMeta": "W1gUZG_featureMeta",
			"scroller": "W1gUZG_scroller",
			"featureFooter": "W1gUZG_featureFooter",
			"drawerScreenshots": "W1gUZG_drawerScreenshots"
		};
		//#endregion
		//#region lib/types/client/PluginDiscoveryPage.js
		const CATEGORY_DEFINITIONS = [
			{
				id: "agent-workflow",
				label: "discoveryCategoryAgent",
				capabilities: ["agent"],
				keywords: ["agent", "workflow"]
			},
			{
				id: "web-ui",
				label: "discoveryCategoryUi",
				capabilities: ["client"],
				keywords: [
					"ui",
					"web",
					"theme"
				]
			},
			{
				id: "browser-search",
				label: "discoveryCategoryBrowser",
				capabilities: ["network"],
				keywords: ["browser", "search"]
			},
			{
				id: "visual-media",
				label: "discoveryCategoryVisual",
				capabilities: [],
				keywords: [
					"visual",
					"vision",
					"image",
					"media",
					"video",
					"audio"
				]
			},
			{
				id: "memory-context",
				label: "discoveryCategoryMemory",
				capabilities: [],
				keywords: [
					"memory",
					"context",
					"rag"
				]
			},
			{
				id: "model-service",
				label: "discoveryCategoryModel",
				capabilities: ["model-provider"],
				keywords: ["model", "provider"]
			},
			{
				id: "developer-tools",
				label: "discoveryCategoryDeveloper",
				capabilities: [
					"host",
					"tool",
					"filesystem",
					"subprocess"
				],
				keywords: [
					"developer",
					"code",
					"git"
				]
			},
			{
				id: "integrations",
				label: "discoveryCategoryIntegration",
				capabilities: [],
				keywords: [
					"integration",
					"notification",
					"mcp"
				]
			}
		];
		const CAPABILITY_KEYS = {
			host: "capabilityHost",
			client: "capabilityClient",
			agent: "capabilityAgent",
			tool: "capabilityTool",
			"model-provider": "capabilityModelProvider",
			skill: "capabilitySkill",
			network: "capabilityNetwork",
			filesystem: "capabilityFilesystem",
			subprocess: "capabilitySubprocess"
		};
		const FRESHNESS_KEYS = {
			fresh: "fresh",
			cached: "cached",
			stale: "stale"
		};
		const SOURCE_KEYS = {
			bundled: "bundledSource",
			network: "networkSource",
			cache: "cacheSource"
		};
		function entryKey(entry) {
			return `${entry.pluginId}@${entry.version}`;
		}
		function uniqueEntries(result) {
			const entries = /* @__PURE__ */ new Map();
			for (const section of Object.values(result.sections)) for (const entry of section) entries.set(entryKey(entry), entry);
			return [...entries.values()];
		}
		function matchesCategory(entry, category) {
			if (category.capabilities.some((value) => entry.capabilities.includes(value))) return true;
			const keywords = entry.keywords.map((value) => value.toLocaleLowerCase());
			return category.keywords.some((value) => keywords.some((keyword) => keyword.includes(value)));
		}
		function DiscoveryMark({ entry, featured = false, compact = false }) {
			return (0, react_jsx_runtime.jsxs)("span", {
				className: PluginDiscoveryPage_module_css_default.mark,
				style: { background: entry.brandColor ?? void 0 },
				"data-featured": featured || void 0,
				"data-compact": compact || void 0,
				"aria-hidden": "true",
				children: [entry.displayName.slice(0, 1).toLocaleUpperCase(), entry.icon === null ? null : (0, react_jsx_runtime.jsx)("img", {
					src: entry.icon.url,
					alt: "",
					width: entry.icon.width,
					height: entry.icon.height,
					loading: "lazy",
					referrerPolicy: "no-referrer",
					onError: (event) => {
						event.currentTarget.hidden = true;
					}
				}, entry.icon.url)]
			});
		}
		function EntryBadges({ entry, t }) {
			const compatibilityKey = entry.compatibility.status === "compatible" ? "compatible" : entry.compatibility.status === "incompatible" ? "incompatible" : "unknown";
			return (0, react_jsx_runtime.jsxs)("span", {
				className: PluginDiscoveryPage_module_css_default.featureMeta,
				children: [
					entry.verified ? (0, react_jsx_runtime.jsxs)("span", {
						className: PluginDiscoveryPage_module_css_default.badge,
						"data-state": "verified",
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutline14, {
							size: 12,
							"aria-hidden": "true"
						}), t("verified")]
					}) : null,
					(0, react_jsx_runtime.jsx)("span", {
						className: PluginDiscoveryPage_module_css_default.badge,
						"data-state": entry.compatibility.status,
						children: t(compatibilityKey)
					}),
					entry.capabilities.slice(0, 2).map((value) => (0, react_jsx_runtime.jsx)("span", {
						className: PluginDiscoveryPage_module_css_default.chip,
						children: t(CAPABILITY_KEYS[value])
					}, value))
				]
			});
		}
		function actionState(entry, installedItem, operation) {
			const matchingCommitted = operation?.action === "install" && operation.pluginId === entry.pluginId && operation.version === entry.version && operation.phase === "committed";
			return {
				installed: installedItem !== null || entry.installed || matchingCommitted,
				blocked: operation !== null && !isTerminalOperationPhase(operation.phase)
			};
		}
		function DiscoveryAction({ entry, installedItem, mutationsEnabled, operation, checking, compact = false, onInstall, onManage, t }) {
			const state = actionState(entry, installedItem, operation);
			const incompatible = entry.compatibility.status === "incompatible";
			const disabled = !state.installed && (checking || incompatible || !mutationsEnabled || state.blocked || entry.scope !== "public");
			const label = state.installed ? t("discoveryManage") : checking ? t("checkingCompatibility") : state.blocked ? t("installationInProgress") : incompatible ? t("cannotInstall") : t("install");
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				variant: state.installed ? "outline" : "primary",
				size: "sm",
				className: compact ? PluginDiscoveryPage_module_css_default.rankAction : void 0,
				disabled,
				title: !state.installed && !mutationsEnabled ? t("installReleaseGated") : !state.installed && state.blocked ? t("operationInProgress") : void 0,
				onClick: (event) => {
					if (state.installed) onManage();
					else onInstall(entry, event.currentTarget);
				},
				children: label
			});
		}
		function FeatureCard({ entry, installedItem, mutationsEnabled, operation, checking, onOpen, onInstall, onManage, t }) {
			return (0, react_jsx_runtime.jsxs)("article", {
				className: PluginDiscoveryPage_module_css_default.featureCard,
				"data-discovery-featured": entryKey(entry),
				children: [(0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: PluginDiscoveryPage_module_css_default.featureBody,
					onClick: (event) => {
						onOpen(entry, event.currentTarget);
					},
					children: [(0, react_jsx_runtime.jsx)(DiscoveryMark, {
						entry,
						featured: true
					}), (0, react_jsx_runtime.jsxs)("span", {
						className: PluginDiscoveryPage_module_css_default.featureCopy,
						children: [
							(0, react_jsx_runtime.jsxs)("span", {
								className: PluginDiscoveryPage_module_css_default.eyebrow,
								children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSparkle16, {
									size: 12,
									"aria-hidden": "true"
								}), t("discoveryFeaturedReason")]
							}),
							(0, react_jsx_runtime.jsx)("h2", { children: entry.displayName }),
							(0, react_jsx_runtime.jsx)("p", { children: entry.summary }),
							(0, react_jsx_runtime.jsx)(EntryBadges, {
								entry,
								t
							})
						]
					})]
				}), (0, react_jsx_runtime.jsxs)("footer", {
					className: PluginDiscoveryPage_module_css_default.featureFooter,
					children: [(0, react_jsx_runtime.jsxs)("span", {
						className: PluginDiscoveryPage_module_css_default.publisher,
						children: [
							entry.publisher,
							" · v",
							entry.version
						]
					}), (0, react_jsx_runtime.jsx)(DiscoveryAction, {
						entry,
						installedItem,
						mutationsEnabled,
						operation,
						checking,
						onInstall,
						onManage,
						t
					})]
				})]
			});
		}
		function Ranking({ entries, installedItems, mutationsEnabled, operation, checkingEntry, onOpen, onInstall, onManage, onViewAll, t }) {
			return (0, react_jsx_runtime.jsxs)("section", {
				className: PluginDiscoveryPage_module_css_default.ranking,
				"aria-labelledby": "discovery-popular-heading",
				children: [(0, react_jsx_runtime.jsxs)("header", {
					className: PluginDiscoveryPage_module_css_default.rankingHeader,
					children: [(0, react_jsx_runtime.jsx)("h2", {
						id: "discovery-popular-heading",
						children: t("discoveryPopular")
					}), (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onViewAll,
						children: t("discoveryViewAll")
					})]
				}), (0, react_jsx_runtime.jsx)("ol", {
					className: PluginDiscoveryPage_module_css_default.rankList,
					children: entries.slice(0, 5).map((entry, index) => (0, react_jsx_runtime.jsxs)("li", {
						className: PluginDiscoveryPage_module_css_default.rankRow,
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: PluginDiscoveryPage_module_css_default.rankNumber,
								children: String(index + 1).padStart(2, "0")
							}),
							(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: PluginDiscoveryPage_module_css_default.rankButton,
								onClick: (event) => {
									onOpen(entry, event.currentTarget);
								},
								children: [(0, react_jsx_runtime.jsx)(DiscoveryMark, {
									entry,
									compact: true
								}), (0, react_jsx_runtime.jsxs)("span", {
									className: PluginDiscoveryPage_module_css_default.rankCopy,
									children: [(0, react_jsx_runtime.jsx)("strong", { children: entry.displayName }), (0, react_jsx_runtime.jsx)("span", { children: entry.publisher })]
								})]
							}),
							(0, react_jsx_runtime.jsx)(DiscoveryAction, {
								entry,
								installedItem: installedItems.get(`${entry.catalogKind}:${entry.pluginId}`) ?? null,
								mutationsEnabled,
								operation,
								checking: checkingEntry === entryKey(entry),
								compact: true,
								onInstall,
								onManage,
								t
							})
						]
					}, entryKey(entry)))
				})]
			});
		}
		function DiscoveryCard({ entry, installedItem, mutationsEnabled, operation, checking, onOpen, onInstall, onManage, t }) {
			return (0, react_jsx_runtime.jsxs)("li", {
				className: PluginDiscoveryPage_module_css_default.card,
				"data-discovery-entry": entryKey(entry),
				children: [(0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: PluginDiscoveryPage_module_css_default.cardButton,
					onClick: (event) => {
						onOpen(entry, event.currentTarget);
					},
					children: [
						(0, react_jsx_runtime.jsxs)("span", {
							className: PluginDiscoveryPage_module_css_default.cardTitle,
							children: [(0, react_jsx_runtime.jsx)(DiscoveryMark, { entry }), (0, react_jsx_runtime.jsxs)("span", {
								className: PluginDiscoveryPage_module_css_default.cardCopy,
								children: [(0, react_jsx_runtime.jsx)("strong", { children: entry.displayName }), (0, react_jsx_runtime.jsx)("span", {
									className: PluginDiscoveryPage_module_css_default.publisher,
									children: entry.publisher
								})]
							})]
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: PluginDiscoveryPage_module_css_default.cardCopy,
							children: (0, react_jsx_runtime.jsx)("p", { children: entry.summary })
						}),
						(0, react_jsx_runtime.jsx)(EntryBadges, {
							entry,
							t
						})
					]
				}), (0, react_jsx_runtime.jsxs)("footer", {
					className: PluginDiscoveryPage_module_css_default.cardFooter,
					children: [(0, react_jsx_runtime.jsxs)("span", {
						className: PluginDiscoveryPage_module_css_default.cardDate,
						children: [
							t("discoveryUpdated"),
							" ",
							new Date(entry.updatedAt).toLocaleDateString()
						]
					}), (0, react_jsx_runtime.jsx)(DiscoveryAction, {
						entry,
						installedItem,
						mutationsEnabled,
						operation,
						checking,
						onInstall,
						onManage,
						t
					})]
				})]
			});
		}
		function DiscoveryGrid({ entries, installedItems, mutationsEnabled, operation, checkingEntry, onOpen, onInstall, onManage, t }) {
			return (0, react_jsx_runtime.jsx)("ul", {
				className: PluginDiscoveryPage_module_css_default.cardGrid,
				children: entries.map((entry) => (0, react_jsx_runtime.jsx)(DiscoveryCard, {
					entry,
					installedItem: installedItems.get(`${entry.catalogKind}:${entry.pluginId}`) ?? null,
					mutationsEnabled,
					operation,
					checking: checkingEntry === entryKey(entry),
					onOpen,
					onInstall,
					onManage,
					t
				}, entryKey(entry)))
			});
		}
		function DetailDrawer({ entry, detailState, compatibilityState, installedItem, mutationsEnabled, operation, operationRequestFailed, closeRef, onClose, onInstall, onManage, t }) {
			const detail = detailState.status === "ready" ? detailState.result.detail : null;
			const compatibilityLabel = compatibilityState.status === "loading" ? t("checkingCompatibility") : compatibilityState.status === "error" ? t("compatibilityError") : compatibilityState.result.allowed ? t("allowedToInstall") : t("installationBlocked");
			const compatibilityStatus = compatibilityState.status === "loading" ? "loading" : compatibilityState.status === "error" ? "error" : compatibilityState.result.allowed ? "allowed" : "blocked";
			return (0, react_jsx_runtime.jsx)("div", {
				className: PluginDiscoveryPage_module_css_default.drawerBackdrop,
				onMouseDown: (event) => {
					if (event.target === event.currentTarget) onClose();
				},
				children: (0, react_jsx_runtime.jsxs)("aside", {
					className: PluginDiscoveryPage_module_css_default.drawer,
					"aria-label": `${t("discoveryDetails")}：${entry.displayName}`,
					children: [
						(0, react_jsx_runtime.jsx)("div", {
							className: PluginDiscoveryPage_module_css_default.drawerTopbar,
							children: (0, react_jsx_runtime.jsx)("button", {
								ref: closeRef,
								type: "button",
								className: PluginDiscoveryPage_module_css_default.drawerClose,
								"aria-label": t("discoveryCloseDetails"),
								onClick: onClose,
								children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, { size: 16 })
							})
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: PluginDiscoveryPage_module_css_default.drawerBody,
							children: [
								(0, react_jsx_runtime.jsxs)("header", {
									className: PluginDiscoveryPage_module_css_default.drawerHeader,
									children: [(0, react_jsx_runtime.jsx)(DiscoveryMark, { entry }), (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("h2", { children: entry.displayName }), (0, react_jsx_runtime.jsxs)("p", { children: [
										entry.publisher,
										" · v",
										entry.version
									] })] })]
								}),
								(0, react_jsx_runtime.jsx)("div", {
									className: PluginDiscoveryPage_module_css_default.drawerBadges,
									children: (0, react_jsx_runtime.jsx)(EntryBadges, {
										entry,
										t
									})
								}),
								detailState.status === "loading" ? (0, react_jsx_runtime.jsx)("p", {
									className: PluginDiscoveryPage_module_css_default.status,
									children: t("detailLoading")
								}) : null,
								detailState.status === "error" ? (0, react_jsx_runtime.jsx)("p", {
									className: PluginDiscoveryPage_module_css_default.error,
									role: "alert",
									children: t("detailError")
								}) : null,
								detailState.status === "ready" && detail === null ? (0, react_jsx_runtime.jsx)("p", {
									className: PluginDiscoveryPage_module_css_default.status,
									children: t("detailUnavailable")
								}) : null,
								detail === null ? null : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
									detail.screenshots.length === 0 ? null : (0, react_jsx_runtime.jsx)("div", {
										className: PluginDiscoveryPage_module_css_default.drawerScreenshots,
										"aria-label": t("screenshots"),
										children: detail.screenshots.slice(0, 2).map((media) => (0, react_jsx_runtime.jsx)("img", {
											src: media.url,
											alt: media.alt,
											width: media.width,
											height: media.height
										}, media.url))
									}),
									(0, react_jsx_runtime.jsx)("p", {
										className: PluginDiscoveryPage_module_css_default.drawerDescription,
										children: detail.description
									}),
									(0, react_jsx_runtime.jsxs)("section", {
										className: `${PluginDiscoveryPage_module_css_default.drawerSection} ${PluginDiscoveryPage_module_css_default.preflight}`,
										"data-state": compatibilityStatus,
										children: [
											(0, react_jsx_runtime.jsx)("h3", { children: t("preflight") }),
											(0, react_jsx_runtime.jsx)("p", { children: compatibilityLabel }),
											compatibilityState.status !== "ready" ? null : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("p", { children: compatibilityState.result.riskSummary }), compatibilityState.result.reasons.length === 0 ? null : (0, react_jsx_runtime.jsx)("ul", { children: compatibilityState.result.reasons.map((reason) => (0, react_jsx_runtime.jsxs)("li", { children: [
												t(compatibilityReasonKey(reason.code)),
												" · ",
												reason.subject
											] }, `${reason.code}:${reason.subject}`)) })] })
										]
									}),
									(0, react_jsx_runtime.jsxs)("section", {
										className: PluginDiscoveryPage_module_css_default.drawerSection,
										children: [(0, react_jsx_runtime.jsx)("h3", { children: t("information") }), (0, react_jsx_runtime.jsxs)("dl", {
											className: PluginDiscoveryPage_module_css_default.drawerFacts,
											children: [
												(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("publisher") }), (0, react_jsx_runtime.jsx)("dd", { children: entry.publisher })] }),
												(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("version") }), (0, react_jsx_runtime.jsx)("dd", { children: entry.version })] }),
												(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("publishedAt") }), (0, react_jsx_runtime.jsx)("dd", { children: new Date(detail.publishedAt).toLocaleDateString() })] }),
												(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("updated") }), (0, react_jsx_runtime.jsx)("dd", { children: new Date(entry.updatedAt).toLocaleDateString() })] })
											]
										})]
									}),
									(0, react_jsx_runtime.jsxs)("section", {
										className: PluginDiscoveryPage_module_css_default.drawerSection,
										children: [(0, react_jsx_runtime.jsx)("h3", { children: t("capabilities") }), (0, react_jsx_runtime.jsx)("div", {
											className: PluginDiscoveryPage_module_css_default.chips,
											children: entry.capabilities.map((value) => (0, react_jsx_runtime.jsx)("span", {
												className: PluginDiscoveryPage_module_css_default.chip,
												children: t(CAPABILITY_KEYS[value])
											}, value))
										})]
									}),
									(0, react_jsx_runtime.jsxs)("section", {
										className: PluginDiscoveryPage_module_css_default.drawerSection,
										children: [(0, react_jsx_runtime.jsx)("h3", { children: t("permissions") }), detail.permissions.length === 0 ? (0, react_jsx_runtime.jsx)("p", { children: t("noPermissions") }) : (0, react_jsx_runtime.jsx)("ul", { children: detail.permissions.map((value) => (0, react_jsx_runtime.jsx)("li", { children: value }, value)) })]
									}),
									(0, react_jsx_runtime.jsxs)("section", {
										className: PluginDiscoveryPage_module_css_default.drawerSection,
										children: [(0, react_jsx_runtime.jsx)("h3", { children: t("risk") }), (0, react_jsx_runtime.jsx)("p", { children: detail.riskSummary })]
									}),
									(0, react_jsx_runtime.jsxs)("section", {
										className: PluginDiscoveryPage_module_css_default.drawerSection,
										children: [(0, react_jsx_runtime.jsx)("h3", { children: t("changelog") }), (0, react_jsx_runtime.jsx)("p", { children: detail.changelog })]
									})
								] }),
								operationRequestFailed ? (0, react_jsx_runtime.jsx)("p", {
									className: PluginDiscoveryPage_module_css_default.error,
									role: "alert",
									children: t("operationRequestFailed")
								}) : null
							]
						}),
						(0, react_jsx_runtime.jsxs)("footer", {
							className: PluginDiscoveryPage_module_css_default.drawerFooter,
							children: [(0, react_jsx_runtime.jsx)("span", { children: entry.verified ? t("verified") : t("unreviewed") }), (0, react_jsx_runtime.jsx)(DiscoveryAction, {
								entry,
								installedItem,
								mutationsEnabled,
								operation,
								checking: compatibilityState.status === "loading",
								onInstall,
								onManage,
								t
							})]
						})
					]
				})
			});
		}
		const SKELETONS = [
			0,
			1,
			2,
			3,
			4,
			5
		];
		/** Natural-language handoff into the bundled find-plugins skill. */
		function AgentPluginFinder({ findWithAgent, t }) {
			const [requirement, setRequirement] = (0, react.useState)("");
			const [state, setState] = (0, react.useState)("idle");
			const submit = (event) => {
				event.preventDefault();
				const value = requirement.trim();
				if (value === "" || state === "submitting") return;
				setState("submitting");
				findWithAgent(value).then((result) => {
					setState(result === "sent" ? "idle" : result);
				}, () => {
					setState("error");
				});
			};
			const feedback = state === "needs-model" ? t("agentFinderNeedsModel") : state === "session-starting" ? t("agentFinderSessionStarting") : state === "error" ? t("agentFinderError") : null;
			return (0, react_jsx_runtime.jsxs)("section", {
				className: PluginDiscoveryPage_module_css_default.agentFinder,
				"aria-labelledby": "agent-plugin-finder-title",
				children: [(0, react_jsx_runtime.jsx)("div", {
					className: PluginDiscoveryPage_module_css_default.agentFinderIcon,
					"aria-hidden": "true",
					children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSparkle16, { size: 18 })
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: PluginDiscoveryPage_module_css_default.agentFinderBody,
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							className: PluginDiscoveryPage_module_css_default.agentFinderCopy,
							children: [(0, react_jsx_runtime.jsx)("h2", {
								id: "agent-plugin-finder-title",
								children: t("agentFinderTitle")
							}), (0, react_jsx_runtime.jsx)("p", { children: t("agentFinderDescription") })]
						}),
						(0, react_jsx_runtime.jsxs)("form", {
							className: PluginDiscoveryPage_module_css_default.agentFinderForm,
							onSubmit: submit,
							children: [(0, react_jsx_runtime.jsx)("input", {
								value: requirement,
								placeholder: t("agentFinderPlaceholder"),
								"aria-label": t("agentFinderPlaceholder"),
								maxLength: 500,
								onChange: (event) => {
									setRequirement(event.currentTarget.value);
									if (state !== "submitting") setState("idle");
								}
							}), (0, react_jsx_runtime.jsxs)("button", {
								type: "submit",
								disabled: requirement.trim() === "" || state === "submitting",
								children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSparkle16, {
									size: 14,
									"aria-hidden": "true"
								}), t(state === "submitting" ? "agentFinderSubmitting" : "agentFinderAction")]
							})]
						}),
						feedback === null ? null : (0, react_jsx_runtime.jsx)("p", {
							className: PluginDiscoveryPage_module_css_default.agentFinderFeedback,
							role: "status",
							children: feedback
						})
					]
				})]
			});
		}
		/** Searchable editorial discovery page over the existing trusted Desktop catalog. */
		function PluginDiscoveryPage({ available, development, list, refresh, detail, checkCompatibility, listInstalled, mutationsEnabled, install, getOperation, onOperationState, openPluginCenter, findWithAgent, t }) {
			const [query, setQuery] = (0, react.useState)("");
			const [mode, setMode] = (0, react.useState)("overview");
			const [categoryId, setCategoryId] = (0, react.useState)("all");
			const [revision, setRevision] = (0, react.useState)(0);
			const [view, setView] = (0, react.useState)({ status: "loading" });
			const [installed, setInstalled] = (0, react.useState)({ status: "loading" });
			const [selectedEntry, setSelectedEntry] = (0, react.useState)(null);
			const [detailState, setDetailState] = (0, react.useState)({ status: "loading" });
			const [compatibilityState, setCompatibilityState] = (0, react.useState)({ status: "loading" });
			const [checkingEntry, setCheckingEntry] = (0, react.useState)(null);
			const [installPreparation, setInstallPreparation] = (0, react.useState)(null);
			const [installAcknowledged, setInstallAcknowledged] = (0, react.useState)(false);
			const [operation, setOperation] = (0, react.useState)(null);
			const [operationDialogOpen, setOperationDialogOpen] = (0, react.useState)(false);
			const [operationRequestFailed, setOperationRequestFailed] = (0, react.useState)(false);
			const initialRefreshStarted = (0, react.useRef)(false);
			const detailRequest = (0, react.useRef)(0);
			const detailOpener = (0, react.useRef)(null);
			const installOpener = (0, react.useRef)(null);
			const drawerClose = (0, react.useRef)(null);
			const observedTerminal = (0, react.useRef)(null);
			const criteria = (0, react.useMemo)(() => ({
				catalogKind: "plugin",
				scope: "public",
				query: query.trim(),
				limit: 48
			}), [query]);
			const installedItems = (0, react.useMemo)(() => {
				const items = /* @__PURE__ */ new Map();
				if (installed.status !== "ready") return items;
				for (const item of installed.result.items) {
					if (item.source !== "catalog" || item.pluginId === null || item.catalogKind === null) continue;
					items.set(`${item.catalogKind}:${item.pluginId}`, item);
				}
				return items;
			}, [installed]);
			(0, react.useEffect)(() => {
				if (!available) return;
				let current = true;
				setView({ status: "loading" });
				Promise.resolve().then(() => list(criteria)).then((result) => {
					if (!current) return;
					setView({
						status: "ready",
						result
					});
					if (criteria.query !== "" || initialRefreshStarted.current) return;
					initialRefreshStarted.current = true;
					if (result.source === "network" && result.freshness === "fresh") return;
					Promise.resolve().then(() => refresh(criteria)).then((next) => {
						if (current) setView({
							status: "ready",
							result: next
						});
					}, () => {});
				}, () => {
					if (current) setView({ status: "error" });
				});
				return () => {
					current = false;
				};
			}, [
				available,
				criteria,
				list,
				refresh,
				revision
			]);
			(0, react.useEffect)(() => {
				if (!available) return;
				let current = true;
				listInstalled().then((result) => {
					if (current) setInstalled({
						status: "ready",
						result
					});
				}, () => {
					if (current) setInstalled({ status: "error" });
				});
				return () => {
					current = false;
				};
			}, [
				available,
				listInstalled,
				revision
			]);
			(0, react.useEffect)(() => {
				if (!available) return;
				let current = true;
				const observe = (next) => {
					if (!current) return;
					setOperation(next);
					if (next?.action === "install" && isTrustedInstallPhase(next.phase) && next.phase !== "committed") setOperationDialogOpen(true);
				};
				const stop = onOperationState(observe);
				getOperation().then(observe, () => {
					if (current) setOperationRequestFailed(true);
				});
				return () => {
					current = false;
					stop();
				};
			}, [
				available,
				getOperation,
				onOperationState
			]);
			(0, react.useEffect)(() => {
				if (operation?.phase !== "committed") return;
				const identity = `${operation.operationId}:${operation.updatedAt}`;
				if (observedTerminal.current === identity) return;
				observedTerminal.current = identity;
				setRevision((value) => value + 1);
			}, [operation]);
			(0, react.useEffect)(() => {
				if (selectedEntry === null) return;
				queueMicrotask(() => {
					drawerClose.current?.focus();
				});
				const closeOnEscape = (event) => {
					if (event.key !== "Escape") return;
					detailRequest.current += 1;
					setSelectedEntry(null);
					setOperationRequestFailed(false);
					queueMicrotask(() => {
						detailOpener.current?.focus();
					});
				};
				document.addEventListener("keydown", closeOnEscape);
				return () => {
					document.removeEventListener("keydown", closeOnEscape);
				};
			}, [selectedEntry]);
			const retry = () => {
				setView({ status: "loading" });
				Promise.resolve().then(() => refresh(criteria)).then((result) => {
					setView({
						status: "ready",
						result
					});
				}, () => {
					setView({ status: "error" });
				});
			};
			const openDetail = (entry, opener, initialCompatibility) => {
				const request = detailRequest.current + 1;
				detailRequest.current = request;
				detailOpener.current = opener;
				setSelectedEntry(entry);
				setDetailState({ status: "loading" });
				setCompatibilityState(initialCompatibility ?? { status: "loading" });
				Promise.resolve().then(() => detail({
					pluginId: entry.pluginId,
					version: entry.version
				})).then((result) => {
					if (detailRequest.current === request) setDetailState({
						status: "ready",
						result
					});
				}, () => {
					if (detailRequest.current === request) setDetailState({ status: "error" });
				});
				if (initialCompatibility !== void 0) return;
				Promise.resolve().then(() => checkCompatibility({
					pluginId: entry.pluginId,
					version: entry.version,
					action: "install"
				})).then((result) => {
					if (detailRequest.current === request) setCompatibilityState({
						status: "ready",
						result
					});
				}, () => {
					if (detailRequest.current === request) setCompatibilityState({ status: "error" });
				});
			};
			const closeDetail = () => {
				detailRequest.current += 1;
				setSelectedEntry(null);
				setOperationRequestFailed(false);
				queueMicrotask(() => {
					detailOpener.current?.focus();
				});
			};
			const requestInstall = (entry, opener) => {
				const state = actionState(entry, installedItems.get(`${entry.catalogKind}:${entry.pluginId}`) ?? null, operation);
				if (state.installed || state.blocked || !mutationsEnabled || entry.compatibility.status === "incompatible") return;
				installOpener.current = opener;
				setCheckingEntry(entryKey(entry));
				setInstallAcknowledged(false);
				setOperationRequestFailed(false);
				Promise.resolve().then(() => checkCompatibility({
					pluginId: entry.pluginId,
					version: entry.version,
					action: "install"
				})).then((decision) => {
					setCheckingEntry(null);
					if (!decision.allowed) {
						openDetail(entry, opener, {
							status: "ready",
							result: decision
						});
						return;
					}
					setInstallPreparation({
						entry,
						decision
					});
				}, () => {
					setCheckingEntry(null);
					openDetail(entry, opener, { status: "error" });
				});
			};
			const closeInstallConfirmation = () => {
				setInstallPreparation(null);
				setInstallAcknowledged(false);
				queueMicrotask(() => {
					installOpener.current?.focus();
				});
			};
			const startInstall = (entry) => {
				setOperationRequestFailed(false);
				install({
					pluginId: entry.pluginId,
					version: entry.version,
					idempotencyKey: `install:${entry.pluginId}:${entry.version}:${String(Date.now())}`
				}).then(async (result) => {
					if (result.kind === "busy") {
						const active = await getOperation();
						setOperation(active);
						setOperationDialogOpen(active?.action === "install" && isTrustedInstallPhase(active.phase));
						setOperationRequestFailed(active === null);
						return;
					}
					setOperation(result.operation);
					setOperationDialogOpen(result.operation.action === "install" && isTrustedInstallPhase(result.operation.phase));
				}, () => {
					setOperationRequestFailed(true);
				});
			};
			const confirmInstall = () => {
				if (installPreparation === null || !installAcknowledged) return;
				const entry = installPreparation.entry;
				setInstallPreparation(null);
				setInstallAcknowledged(false);
				startInstall(entry);
			};
			if (!available) return (0, react_jsx_runtime.jsx)("div", {
				className: PluginDiscoveryPage_module_css_default.root,
				children: (0, react_jsx_runtime.jsxs)("div", {
					className: PluginDiscoveryPage_module_css_default.emptyPanel,
					children: [(0, react_jsx_runtime.jsx)("strong", { children: t("unavailable") }), (0, react_jsx_runtime.jsx)("p", { children: t("unavailableHint") })]
				})
			});
			const ready = view.status === "ready" ? view.result : null;
			const allEntries = ready === null ? [] : uniqueEntries(ready);
			const availableCategories = CATEGORY_DEFINITIONS.filter((category) => allEntries.some((entry) => matchesCategory(entry, category)));
			const activeCategory = CATEGORY_DEFINITIONS.find((category) => category.id === categoryId) ?? null;
			const filterEntries = (entries) => activeCategory === null ? entries : entries.filter((entry) => matchesCategory(entry, activeCategory));
			const featured = ready === null ? [] : filterEntries(ready.sections.featured);
			const recent = ready === null ? [] : filterEntries(ready.sections.recent);
			const popular = ready === null ? [] : filterEntries(ready.sections.popular);
			const searchEntries = filterEntries(allEntries);
			const primary = featured[0] ?? searchEntries[0] ?? null;
			const freshness = ready === null ? t("loading") : `${t(FRESHNESS_KEYS[ready.freshness])} · ${t(SOURCE_KEYS[ready.source])} · ${new Date(ready.generatedAt).toLocaleString()}`;
			const checkingKey = checkingEntry;
			const selectedInstalledItem = selectedEntry === null ? null : installedItems.get(`${selectedEntry.catalogKind}:${selectedEntry.pluginId}`) ?? null;
			const operationInstalledItem = operation === null ? null : installedItems.get(`plugin:${operation.pluginId}`) ?? null;
			const fullList = mode === "recent" ? recent : popular;
			const fullHeading = mode === "recent" ? t("discoveryRecent") : t("discoveryPopular");
			const fullDescription = mode === "recent" ? t("discoveryRecentHint") : t("discoveryPopularHint");
			return (0, react_jsx_runtime.jsxs)("div", {
				className: PluginDiscoveryPage_module_css_default.root,
				"aria-busy": view.status === "loading" || checkingEntry !== null || !isTerminalOperationPhase(operation?.phase ?? "committed"),
				"data-development": development || void 0,
				title: development ? t("developmentMode") : void 0,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: PluginDiscoveryPage_module_css_default.topbar,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: PluginDiscoveryPage_module_css_default.freshness,
							children: freshness
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: PluginDiscoveryPage_module_css_default.refreshButton,
							"aria-label": t("refresh"),
							title: t("refresh"),
							onClick: retry,
							children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline16, { size: 16 })
						})]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: PluginDiscoveryPage_module_css_default.scroller,
						children: (0, react_jsx_runtime.jsxs)("main", {
							className: PluginDiscoveryPage_module_css_default.content,
							children: [
								(0, react_jsx_runtime.jsxs)("header", {
									className: PluginDiscoveryPage_module_css_default.header,
									children: [(0, react_jsx_runtime.jsx)("h1", { children: t("discoveryTitle") }), (0, react_jsx_runtime.jsx)("p", { children: t("discoveryIntro") })]
								}),
								(0, react_jsx_runtime.jsx)(AgentPluginFinder, {
									findWithAgent,
									t
								}),
								(0, react_jsx_runtime.jsxs)("label", {
									className: PluginDiscoveryPage_module_css_default.search,
									children: [
										(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, { "aria-hidden": "true" }),
										(0, react_jsx_runtime.jsx)("span", {
											className: PluginDiscoveryPage_module_css_default.visuallyHidden,
											children: t("discoverySearch")
										}),
										(0, react_jsx_runtime.jsx)("input", {
											type: "search",
											value: query,
											placeholder: t("discoverySearch"),
											"aria-label": t("discoverySearch"),
											onChange: (event) => {
												setQuery(event.currentTarget.value);
											}
										})
									]
								}),
								(0, react_jsx_runtime.jsxs)("div", {
									className: PluginDiscoveryPage_module_css_default.controls,
									children: [(0, react_jsx_runtime.jsx)("div", {
										className: PluginDiscoveryPage_module_css_default.viewTabs,
										"aria-label": t("discoveryViews"),
										children: [
											["overview", "discoveryOverview"],
											["recent", "discoveryRecent"],
											["popular", "discoveryPopular"]
										].map(([value, label]) => (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-pressed": mode === value,
											onClick: () => {
												setMode(value);
											},
											children: t(label)
										}, value))
									}), availableCategories.length === 0 ? null : (0, react_jsx_runtime.jsxs)("div", {
										className: PluginDiscoveryPage_module_css_default.categories,
										"aria-label": t("discoveryCategories"),
										children: [(0, react_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-pressed": categoryId === "all",
											onClick: () => {
												setCategoryId("all");
											},
											children: t("discoveryCategoryAll")
										}), availableCategories.map((category) => (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-pressed": categoryId === category.id,
											onClick: () => {
												setCategoryId(category.id);
											},
											children: t(category.label)
										}, category.id))]
									})]
								}),
								view.status === "loading" ? (0, react_jsx_runtime.jsx)("div", {
									className: PluginDiscoveryPage_module_css_default.skeletonGrid,
									role: "status",
									"aria-label": t("loading"),
									children: SKELETONS.map((value) => (0, react_jsx_runtime.jsx)("span", { className: PluginDiscoveryPage_module_css_default.skeletonCard }, value))
								}) : null,
								view.status === "error" ? (0, react_jsx_runtime.jsxs)("div", {
									className: PluginDiscoveryPage_module_css_default.error,
									role: "alert",
									children: [(0, react_jsx_runtime.jsx)("span", { children: t("error") }), (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: retry,
										children: t("retry")
									})]
								}) : null,
								operationRequestFailed ? (0, react_jsx_runtime.jsx)("p", {
									className: PluginDiscoveryPage_module_css_default.error,
									role: "alert",
									children: t("operationRequestFailed")
								}) : null,
								ready !== null && query.trim() !== "" ? (0, react_jsx_runtime.jsxs)("section", {
									className: PluginDiscoveryPage_module_css_default.section,
									"aria-labelledby": "discovery-search-heading",
									children: [(0, react_jsx_runtime.jsx)("header", {
										className: PluginDiscoveryPage_module_css_default.sectionHeading,
										children: (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("h2", {
											id: "discovery-search-heading",
											children: t("searchResults")
										}), (0, react_jsx_runtime.jsxs)("p", { children: [
											searchEntries.length,
											" ",
											t("resultUnit")
										] })] })
									}), searchEntries.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
										className: PluginDiscoveryPage_module_css_default.emptyPanel,
										children: t("emptySearch")
									}) : (0, react_jsx_runtime.jsx)(DiscoveryGrid, {
										entries: searchEntries,
										installedItems,
										mutationsEnabled,
										operation,
										checkingEntry: checkingKey,
										onOpen: openDetail,
										onInstall: requestInstall,
										onManage: openPluginCenter,
										t
									})]
								}) : null,
								ready !== null && query.trim() === "" && mode === "overview" ? primary === null ? (0, react_jsx_runtime.jsx)("p", {
									className: PluginDiscoveryPage_module_css_default.emptyPanel,
									children: t("discoveryEmpty")
								}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("div", {
									className: PluginDiscoveryPage_module_css_default.overview,
									"data-single": popular.length === 0 || void 0,
									children: [(0, react_jsx_runtime.jsx)(FeatureCard, {
										entry: primary,
										installedItem: installedItems.get(`${primary.catalogKind}:${primary.pluginId}`) ?? null,
										mutationsEnabled,
										operation,
										checking: checkingKey === entryKey(primary),
										onOpen: openDetail,
										onInstall: requestInstall,
										onManage: openPluginCenter,
										t
									}), popular.length === 0 ? null : (0, react_jsx_runtime.jsx)(Ranking, {
										entries: popular,
										installedItems,
										mutationsEnabled,
										operation,
										checkingEntry: checkingKey,
										onOpen: openDetail,
										onInstall: requestInstall,
										onManage: openPluginCenter,
										onViewAll: () => {
											setMode("popular");
										},
										t
									})]
								}), recent.length === 0 ? null : (0, react_jsx_runtime.jsxs)("section", {
									className: PluginDiscoveryPage_module_css_default.section,
									"aria-labelledby": "discovery-recent-heading",
									children: [(0, react_jsx_runtime.jsxs)("header", {
										className: PluginDiscoveryPage_module_css_default.sectionHeading,
										children: [(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("h2", {
											id: "discovery-recent-heading",
											children: t("discoveryRecent")
										}), (0, react_jsx_runtime.jsx)("p", { children: t("discoveryRecentHint") })] }), (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												setMode("recent");
											},
											children: t("discoveryViewAll")
										})]
									}), (0, react_jsx_runtime.jsx)(DiscoveryGrid, {
										entries: recent.slice(0, 6),
										installedItems,
										mutationsEnabled,
										operation,
										checkingEntry: checkingKey,
										onOpen: openDetail,
										onInstall: requestInstall,
										onManage: openPluginCenter,
										t
									})]
								})] }) : null,
								ready !== null && query.trim() === "" && mode !== "overview" ? (0, react_jsx_runtime.jsxs)("section", {
									className: PluginDiscoveryPage_module_css_default.section,
									"aria-labelledby": "discovery-full-heading",
									children: [(0, react_jsx_runtime.jsx)("header", {
										className: PluginDiscoveryPage_module_css_default.sectionHeading,
										children: (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("h2", {
											id: "discovery-full-heading",
											children: fullHeading
										}), (0, react_jsx_runtime.jsx)("p", { children: fullDescription })] })
									}), fullList.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
										className: PluginDiscoveryPage_module_css_default.emptyPanel,
										children: t("discoveryEmpty")
									}) : (0, react_jsx_runtime.jsx)(DiscoveryGrid, {
										entries: fullList,
										installedItems,
										mutationsEnabled,
										operation,
										checkingEntry: checkingKey,
										onOpen: openDetail,
										onInstall: requestInstall,
										onManage: openPluginCenter,
										t
									})]
								}) : null
							]
						})
					}),
					selectedEntry === null ? null : (0, react_jsx_runtime.jsx)(DetailDrawer, {
						entry: selectedEntry,
						detailState,
						compatibilityState,
						installedItem: selectedInstalledItem,
						mutationsEnabled,
						operation,
						operationRequestFailed,
						closeRef: drawerClose,
						onClose: closeDetail,
						onInstall: requestInstall,
						onManage: openPluginCenter,
						t
					}),
					(0, react_jsx_runtime.jsx)(PluginOperationDialog, {
						open: operationDialogOpen,
						operation,
						installedItem: operationInstalledItem,
						onClose: () => {
							setOperationDialogOpen(false);
						},
						t
					}),
					installPreparation === null ? null : (0, react_jsx_runtime.jsx)(PluginInstallConfirmation, {
						open: true,
						entry: installPreparation.entry,
						decision: installPreparation.decision,
						acknowledged: installAcknowledged,
						onAcknowledgedChange: setInstallAcknowledged,
						onCancel: closeInstallConfirmation,
						onConfirm: confirmInstall,
						t
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/locales.js
		/** Chinese-first copy for Plugin and Skill Bundle discovery. */
		const zh = {
			nav: "插件中心",
			discoveryNav: "插件发现",
			discoveryTitle: "插件发现",
			discoveryIntro: "每天发现值得安装的 DeepSeek Harness 插件",
			agentFinderTitle: "让 Agent 找插件",
			agentFinderDescription: "描述你的需求，Agent 自动从公开插件目录中筛选并推荐。",
			agentFinderPlaceholder: "例如：帮我找一个能自动生成演示文稿的插件",
			agentFinderAction: "让 Agent 找插件",
			agentFinderSubmitting: "正在交给 Agent…",
			agentFinderNeedsModel: "请先在模型设置中配置 DeepSeek，完成后再提交这条需求。",
			agentFinderSessionStarting: "正在准备新会话，请稍后再次提交。",
			agentFinderError: "暂时无法唤起 Agent，请稍后重试。",
			discoverySearch: "搜索插件、功能或作者…",
			discoveryViews: "发现方式",
			discoveryOverview: "精选",
			discoveryRecent: "最近更新",
			discoveryRecentHint: "查看最近发布或更新的确定目录版本",
			discoveryPopular: "生态热门",
			discoveryPopularHint: "按照目录当前热门快照浏览",
			discoveryCategories: "插件分类",
			discoveryCategoryAll: "全部",
			discoveryCategoryAgent: "Agent 与工作流",
			discoveryCategoryUi: "Web UI",
			discoveryCategoryBrowser: "浏览器与搜索",
			discoveryCategoryVisual: "视觉与媒体",
			discoveryCategoryMemory: "记忆与上下文",
			discoveryCategoryModel: "模型与服务",
			discoveryCategoryDeveloper: "开发工具",
			discoveryCategoryIntegration: "集成与通知",
			discoveryFeaturedReason: "目录精选",
			discoveryViewAll: "查看全部",
			discoveryUpdated: "更新于",
			discoveryManage: "管理",
			discoveryDetails: "插件详情",
			discoveryCloseDetails: "关闭插件详情",
			discoveryEmpty: "当前分类暂时没有可展示的插件。",
			title: "插件",
			intro: "搜索 npm 中遵循官方 dsh-plugin 约定的社区插件",
			skillsTitle: "技能",
			skillsIntro: "搜索以 DSH Bundle 发布的社区技能包",
			developmentMode: "Web 开发模式：当前数据来自开发桥接，不代表桌面端真实安装结果。",
			plugins: "插件",
			skills: "技能",
			searchPlugins: "搜索插件",
			searchSkills: "搜索技能",
			installedTitle: "已安装",
			installedEmpty: "当前没有已安装的目录条目",
			installedLoading: "正在读取当前 Profile…",
			installedError: "暂时无法读取真实已安装状态。",
			manageInstalled: "管理已安装插件",
			pluginActions: "插件操作",
			installedSourceSystem: "系统",
			installedSourceCatalog: "目录安装",
			installedSourceLocal: "本地",
			protectedPlugin: "受保护",
			operationPending: "操作中",
			versionUnknown: "版本未知",
			bundleEnabled: "已启用",
			bundleDisabled: "未启用",
			runtimeRunning: "运行中",
			runtimeInactive: "未运行",
			runtimeFailed: "运行失败",
			runtimeUnknown: "运行状态未知",
			installedIncompatible: "当前版本不兼容，保持停用",
			updateAvailable: "可更新至",
			openConfiguration: "配置",
			openRuntimeInventory: "运行详情",
			updatePlugin: "更新",
			enablePlugin: "启用",
			disablePlugin: "停用",
			uninstallPlugin: "卸载",
			confirmUpdateTitle: "更新插件",
			confirmEnableTitle: "启用插件",
			confirmDisableTitle: "停用插件",
			confirmUninstallTitle: "卸载插件",
			confirmUpdateIntro: "确认目标确定版本、更新记录与新增风险后再更新。",
			confirmEnableIntro: "启用后会重启插件环境，并恢复该 Bundle 声明的能力。",
			confirmDisableIntro: "停用会保留安装包和配置，但该 Bundle 的 Host、客户端与 Skill 能力将停止运行。",
			confirmUninstallIntro: "卸载只移除目录归属依赖和 Bundle 记录，配置与插件自有数据默认保留。",
			confirmUpdateAcknowledge: "我已查看目标版本和风险变化，并确认更新。",
			confirmEnableAcknowledge: "我确认启用并重启插件环境。",
			confirmDisableAcknowledge: "我确认停用该插件的运行能力。",
			confirmUninstallAcknowledge: "我确认卸载，并保留配置和插件自有数据。",
			currentVersion: "当前版本",
			targetVersion: "目标版本",
			riskChange: "更新与风险变化",
			configurationRetained: "配置默认保留",
			ownedDataRetained: "插件自有数据也会保留；删除数据必须在卸载提交后单独确认。",
			ownedDataRemovalTitle: "是否删除插件数据",
			ownedDataRemovalIntro: "插件已卸载。你可以继续保留数据，或单独选择要永久删除的数据。",
			ownedDataPermanentTitle: "此操作不可撤销",
			ownedDataPermanentWarning: "只会删除该插件预先声明并位于自身存储目录内的所选路径。",
			selectOwnedData: "选择要删除的数据",
			confirmOwnedDataRemoval: "我确认永久删除所选插件数据。",
			retainOwnedData: "保留数据",
			removeSelectedOwnedData: "删除所选数据",
			removingOwnedData: "正在删除…",
			ownedDataRemoved: "已删除数据项：",
			ownedDataRemovalFailed: "数据未删除，请检查当前卸载记录后重试。",
			managementProgress: "插件操作进行中",
			managementComplete: "插件状态已更新",
			updateComplete: "插件已更新并加载",
			enableComplete: "插件已启用并加载",
			disableComplete: "插件已停用",
			uninstallComplete: "插件已卸载",
			managementFailed: "插件操作未完成",
			managementInProgress: "正在重启并验证目标插件状态，请保持页面打开。",
			managementCommitted: "插件环境已重新加载并通过目标状态验证。",
			updateCommitted: "新版本已写入，插件环境已重新加载并通过验证。",
			enableCommitted: "插件声明的 Host、客户端与 Skill 能力已恢复并通过验证。",
			disableCommitted: "插件包与配置已保留，运行能力已停止。",
			uninstallCommitted: "插件依赖与 Bundle 记录已移除，其他插件已继续正常运行。",
			managementOperationFailed: "操作未提交，当前 Profile 保留恢复所需证据。",
			progressChanging: "变更插件状态",
			publicScope: "公开",
			localScope: "个人",
			featured: "精选",
			popular: "本周热门",
			recent: "最近更新",
			searchResults: "搜索结果",
			resultUnit: "项",
			loading: "正在读取目录…",
			error: "暂时无法读取插件目录。",
			retry: "重试",
			refresh: "刷新目录",
			unavailable: "插件中心仅在 Desktop 中提供。",
			unavailableHint: "当前网页仍可使用原有插件配置和运行清单。",
			empty: "这个范围暂时没有可展示的条目。",
			emptySearch: "没有匹配结果，请尝试其他关键词。",
			verified: "产物已校验",
			verifiedHelp: "表示该 npm 确定版本的完整性、包身份和 Bundle 声明已经校验，不代表 DeepSeek 官方审计或沙箱隔离。",
			unreviewed: "尚未校验",
			version: "版本",
			publisher: "发布者",
			compatibility: "兼容性",
			compatible: "兼容",
			incompatible: "不兼容",
			unknown: "待确认",
			updated: "更新时间",
			catalogStatus: "目录状态",
			fresh: "目录已更新",
			cached: "已验证缓存",
			stale: "目录可能已过期",
			bundledSource: "内置验证目录",
			networkSource: "在线目录",
			cacheSource: "本地缓存",
			details: "查看详情",
			backToCatalog: "返回插件目录",
			information: "信息",
			screenshots: "插件截图",
			capabilities: "能力",
			capabilityHost: "主机扩展",
			capabilityClient: "桌面界面",
			capabilityAgent: "Agent 能力",
			capabilityTool: "工具",
			capabilityModelProvider: "模型服务",
			capabilitySkill: "技能",
			capabilityNetwork: "网络访问",
			capabilityFilesystem: "文件访问",
			capabilitySubprocess: "子进程",
			permissions: "权限说明",
			noPermissions: "未声明额外权限。",
			risk: "风险说明",
			lowRisk: "低风险",
			mediumRisk: "中风险",
			highRisk: "高风险",
			changelog: "更新记录",
			publishedAt: "发布时间",
			withdrawn: "该版本已下架",
			localReadOnly: "本地条目仅供查看",
			detailLoading: "正在读取详情…",
			detailError: "暂时无法读取该版本详情。",
			detailUnavailable: "该确定版本已不可用。",
			preflight: "安装兼容预检",
			preflightIntro: "在操作前确认版本、平台与运行环境是否匹配。",
			checkingCompatibility: "正在检查当前环境…",
			compatibilityError: "无法完成兼容检查，安装保持禁用。",
			allowedToInstall: "当前环境允许安装",
			installationBlocked: "当前环境不能安装",
			denialReasons: "拒绝原因",
			currentEnvironment: "当前环境",
			desktopVersion: "Desktop 版本",
			dshVersion: "DSH 版本",
			nodeVersion: "Node 版本",
			platform: "系统平台",
			profileRevision: "Profile 修订",
			catalogRevision: "目录修订",
			restartRequired: "需要重启 Host",
			restartYes: "需要",
			restartNo: "不需要",
			authorityTitle: "运行权限",
			authorityWarning: "社区插件并非 DeepSeek 官方审计。安装后的插件可使用应用进程的广泛权限，请只安装你信任的确定版本。",
			install: "安装",
			installed: "已安装",
			cannotInstall: "不能安装",
			installationInProgress: "安装进行中",
			installationFailedAction: "等待恢复",
			confirmInstallTitle: "安装插件",
			confirmInstallIntro: "确认确定版本与运行权限后，再开始受信安装。",
			confirmInstallVersion: "确定版本",
			confirmInstallAuthority: "插件会在应用进程中运行，并可使用它声明的 Host、客户端与工具能力。",
			confirmInstallAcknowledge: "我信任这个确定版本，并同意授予上述运行权限。",
			confirmInstall: "确认安装",
			cancel: "取消",
			close: "关闭",
			done: "完成",
			installNotAvailableYet: "当前版本仅提供安装前检查，暂不执行安装。",
			installReleaseGated: "安装与卸载只在 DeepSeek Harness Desktop 中可用。",
			webInstallSimulation: "桌面端会修改本机 Profile；浏览器开发模式仅模拟相同的操作进度。",
			installationProgress: "安装进度",
			installationComplete: "插件已安装并加载",
			installationFailed: "安装未完成",
			operationInProgress: "正在完成受信任安装事务，请保持页面打开。",
			operationCommitted: "插件环境已重新加载，声明的运行能力已通过验证。",
			operationCommittedClient: "插件环境与客户端界面已重新加载，声明的运行能力已通过验证。",
			operationFailed: "安装未提交，当前 Profile 保留恢复所需证据。",
			operationNeedsRecovery: "此操作需要等待安全恢复，暂时不能重新安装。",
			operationKeepOpen: "窗口会保持打开；重新加载插件环境时，界面可能短暂重连。",
			operationRequestFailed: "无法启动或恢复安装进度。",
			operationFailureCode: "失败代码",
			recoveryRunningTitle: "正在恢复插件环境",
			recoveryFailedTitle: "插件环境恢复未完成",
			recoveryRunning: "正在恢复并验证上一次操作前的 Host、客户端与 Skill 清单。",
			recoveryFailed: "旧环境尚未通过完整验证，普通插件变更保持关闭。",
			recoveryAttempt: "恢复尝试",
			recoveryReasonCode: "恢复原因",
			recoveryReasonPending: "正在确认旧环境状态",
			recoveryReasonUnsupportedJournalVersion: "恢复记录来自不受支持的版本",
			recoveryReasonJournalInvalid: "恢复记录已损坏或内容无效",
			recoveryReasonSnapshotMissing: "没有找到旧环境快照",
			recoveryReasonSnapshotInvalid: "旧环境快照无效",
			recoveryReasonSnapshotRootMismatch: "快照不属于当前 Profile",
			recoveryReasonSnapshotPathInvalid: "快照包含不安全路径",
			recoveryReasonSnapshotHashMismatch: "快照完整性校验失败",
			recoveryReasonProfileLockBusy: "另一个进程仍占用插件环境",
			recoveryReasonHostStopFailed: "当前 Host 无法安全停止",
			recoveryReasonProfileRestoreFailed: "Profile 文件恢复失败",
			recoveryReasonPackageRestoreFailed: "旧依赖恢复失败",
			recoveryReasonHostStartFailed: "旧 Host 无法重新启动",
			recoveryReasonRuntimeVerificationFailed: "旧 Host、客户端或 Skill 运行验证未通过",
			recoveryReasonDiagnosticExportFailed: "诊断导出失败",
			retryRecovery: "重试恢复",
			exportDiagnostics: "导出诊断",
			diagnosticSaved: "诊断文件已保存。",
			diagnosticCancelled: "已取消诊断导出。",
			recoveryRequestFailed: "恢复请求未完成，请重试或导出诊断。",
			progressPreparing: "准备并校验",
			progressInstalling: "安装确定版本",
			progressReloading: "重新加载插件环境",
			progressVerifying: "验证运行能力",
			phasePreflight: "兼容预检",
			phaseDownloading: "下载确定版本产物",
			phaseVerifyingArtifact: "校验产物",
			phaseSnapshotting: "保存 Profile 快照",
			phaseStoppingHost: "停止当前 Host",
			phaseInstalling: "写入确定版本",
			phaseValidatingProfile: "校验 Profile",
			phaseStartingHost: "启动新 Host",
			phaseReloading: "重新连接界面",
			phaseHealthChecking: "检查 Host 健康",
			phaseVerifyingRuntime: "验证 Host 与客户端能力",
			phaseCommitted: "安装完成",
			phaseFailed: "安装失败",
			reasonCatalogMetadataInvalid: "目录元数据无效",
			reasonCatalogUnverified: "版本产物尚未完成校验",
			reasonVersionWithdrawn: "版本已下架",
			reasonVersionIneligible: "版本当前不可用",
			reasonProtectedPackage: "受保护系统包",
			reasonProtectedEntry: "受保护系统配置项",
			reasonDesktopVersionUnsupported: "Desktop 版本不兼容",
			reasonDshVersionUnsupported: "DSH 版本不兼容",
			reasonNodeVersionUnsupported: "Node 版本不兼容",
			reasonPlatformUnsupported: "当前平台不受支持",
			reasonArtifactMissing: "缺少当前平台产物",
			reasonArtifactEvidenceIncomplete: "产物证据不完整",
			reasonPluginIdentityConflict: "插件身份冲突",
			reasonPackageIdentityConflict: "包身份冲突",
			reasonEntryIdentityConflict: "运行配置项冲突",
			reasonDeclaredConflict: "命中声明冲突",
			reasonOperationBusy: "另一个插件操作正在进行",
			reasonActionNotSupported: "当前状态不支持该动作"
		};
		/** English Plugin Center copy. */
		const en = {
			nav: "Plugin Center",
			discoveryNav: "Plugin Discovery",
			discoveryTitle: "Plugin Discovery",
			discoveryIntro: "Find DeepSeek Harness plugins worth installing every day.",
			agentFinderTitle: "Let Agent find plugins",
			agentFinderDescription: "Describe what you need and the Agent will search the public plugin catalog for recommendations.",
			agentFinderPlaceholder: "For example: find a plugin that creates presentations automatically",
			agentFinderAction: "Let Agent find plugins",
			agentFinderSubmitting: "Sending to Agent…",
			agentFinderNeedsModel: "Configure DeepSeek in Model settings, then submit this request again.",
			agentFinderSessionStarting: "Preparing a new session. Please submit again in a moment.",
			agentFinderError: "The Agent is temporarily unavailable. Please try again.",
			discoverySearch: "Search plugins, capabilities, or publishers…",
			discoveryViews: "Discovery view",
			discoveryOverview: "Featured",
			discoveryRecent: "Recently updated",
			discoveryRecentHint: "Browse exact catalog versions that were recently published or updated.",
			discoveryPopular: "Ecosystem popular",
			discoveryPopularHint: "Browse the catalog’s current server-owned popularity snapshot.",
			discoveryCategories: "Plugin categories",
			discoveryCategoryAll: "All",
			discoveryCategoryAgent: "Agents & workflows",
			discoveryCategoryUi: "Web UI",
			discoveryCategoryBrowser: "Browser & search",
			discoveryCategoryVisual: "Vision & media",
			discoveryCategoryMemory: "Memory & context",
			discoveryCategoryModel: "Models & services",
			discoveryCategoryDeveloper: "Developer tools",
			discoveryCategoryIntegration: "Integrations & notifications",
			discoveryFeaturedReason: "Catalog featured",
			discoveryViewAll: "View all",
			discoveryUpdated: "Updated",
			discoveryManage: "Manage",
			discoveryDetails: "Plugin details",
			discoveryCloseDetails: "Close plugin details",
			discoveryEmpty: "No plugins are available in this category yet.",
			title: "Plugins",
			intro: "Search community packages following the official dsh-plugin convention on npm.",
			skillsTitle: "Skills",
			skillsIntro: "Search community Skill packs distributed as DSH Bundles.",
			developmentMode: "Web development mode: data comes from the development bridge, not a real Desktop installation.",
			plugins: "Plugins",
			skills: "Skills",
			searchPlugins: "Search plugins",
			searchSkills: "Search skills",
			installedTitle: "Installed",
			installedEmpty: "No catalog entries are installed",
			installedLoading: "Reading the current Profile…",
			installedError: "The real installed state is temporarily unavailable.",
			manageInstalled: "Manage installed plugins",
			pluginActions: "Plugin actions",
			installedSourceSystem: "System",
			installedSourceCatalog: "Catalog",
			installedSourceLocal: "Local",
			protectedPlugin: "Protected",
			operationPending: "Operation pending",
			versionUnknown: "Unknown version",
			bundleEnabled: "Enabled",
			bundleDisabled: "Disabled",
			runtimeRunning: "Running",
			runtimeInactive: "Inactive",
			runtimeFailed: "Runtime failed",
			runtimeUnknown: "Runtime unknown",
			installedIncompatible: "Incompatible with this release; kept disabled",
			updateAvailable: "Update to",
			openConfiguration: "Configuration",
			openRuntimeInventory: "Runtime details",
			updatePlugin: "Update",
			enablePlugin: "Enable",
			disablePlugin: "Disable",
			uninstallPlugin: "Uninstall",
			confirmUpdateTitle: "Update plugin",
			confirmEnableTitle: "Enable plugin",
			confirmDisableTitle: "Disable plugin",
			confirmUninstallTitle: "Uninstall plugin",
			confirmUpdateIntro: "Review the exact target version, changelog, and changed risk before updating.",
			confirmEnableIntro: "Enabling restarts the plugin environment and restores this Bundle’s declared capabilities.",
			confirmDisableIntro: "Disabling keeps the package and configuration, but stops its Host, client, and Skill capabilities.",
			confirmUninstallIntro: "Uninstall removes only the catalog-owned dependency and Bundle records. Configuration and owned data stay by default.",
			confirmUpdateAcknowledge: "I reviewed the target version and risk change and confirm this update.",
			confirmEnableAcknowledge: "I confirm enabling this plugin and restarting the plugin environment.",
			confirmDisableAcknowledge: "I confirm disabling this plugin’s runtime capabilities.",
			confirmUninstallAcknowledge: "I confirm uninstalling while retaining configuration and plugin-owned data.",
			currentVersion: "Current version",
			targetVersion: "Target version",
			riskChange: "Update and risk change",
			configurationRetained: "Configuration is retained",
			ownedDataRetained: "Plugin-owned data is also retained; deleting it requires a separate confirmation after uninstall commits.",
			ownedDataRemovalTitle: "Delete plugin data?",
			ownedDataRemovalIntro: "The plugin is uninstalled. Keep its data, or separately select data to delete permanently.",
			ownedDataPermanentTitle: "This action cannot be undone",
			ownedDataPermanentWarning: "Only selected paths declared by this plugin inside its own storage directory can be deleted.",
			selectOwnedData: "Select data to delete",
			confirmOwnedDataRemoval: "I confirm permanently deleting the selected plugin data.",
			retainOwnedData: "Keep data",
			removeSelectedOwnedData: "Delete selected data",
			removingOwnedData: "Deleting…",
			ownedDataRemoved: "Data items removed:",
			ownedDataRemovalFailed: "Data was not deleted. Check the current uninstall record and try again.",
			managementProgress: "Plugin operation in progress",
			managementComplete: "Plugin state updated",
			updateComplete: "Plugin updated and loaded",
			enableComplete: "Plugin enabled and loaded",
			disableComplete: "Plugin disabled",
			uninstallComplete: "Plugin uninstalled",
			managementFailed: "Plugin operation incomplete",
			managementInProgress: "Restarting and verifying the target plugin state. Keep this page open.",
			managementCommitted: "The plugin environment reloaded and the target state passed verification.",
			updateCommitted: "The new version was written, and the reloaded plugin environment passed verification.",
			enableCommitted: "The declared Host, client, and Skill capabilities were restored and passed verification.",
			disableCommitted: "The package and configuration were retained, and its runtime capabilities were stopped.",
			uninstallCommitted: "The plugin dependency and Bundle records were removed; unrelated plugins remain running.",
			managementOperationFailed: "The operation was not committed; evidence needed for Profile recovery is retained.",
			progressChanging: "Change plugin state",
			publicScope: "Public",
			localScope: "Personal",
			featured: "Featured",
			popular: "Weekly popular",
			recent: "Recently updated",
			searchResults: "Search results",
			resultUnit: "results",
			loading: "Reading catalog…",
			error: "The plugin catalog is temporarily unavailable.",
			retry: "Retry",
			refresh: "Refresh catalog",
			unavailable: "Plugin Center is available in Desktop only.",
			unavailableHint: "The current Web app can still use plugin configuration and runtime inventory.",
			empty: "There are no entries in this scope yet.",
			emptySearch: "No results match. Try another search.",
			verified: "Artifact validated",
			verifiedHelp: "The exact npm version passed integrity, package identity, and Bundle declaration checks; this is not a DeepSeek security review or sandbox.",
			unreviewed: "Not yet validated",
			version: "Version",
			publisher: "Publisher",
			compatibility: "Compatibility",
			compatible: "Compatible",
			incompatible: "Incompatible",
			unknown: "To be checked",
			updated: "Updated",
			catalogStatus: "Catalog status",
			fresh: "Catalog updated",
			cached: "Verified cache",
			stale: "Catalog may be stale",
			bundledSource: "Bundled verified catalog",
			networkSource: "Online catalog",
			cacheSource: "Local cache",
			details: "View details",
			backToCatalog: "Back to plugin catalog",
			information: "Information",
			screenshots: "Plugin screenshots",
			capabilities: "Capabilities",
			capabilityHost: "Host extension",
			capabilityClient: "Desktop UI",
			capabilityAgent: "Agent capability",
			capabilityTool: "Tool",
			capabilityModelProvider: "Model provider",
			capabilitySkill: "Skill",
			capabilityNetwork: "Network access",
			capabilityFilesystem: "File access",
			capabilitySubprocess: "Subprocess",
			permissions: "Permissions",
			noPermissions: "No additional permissions declared.",
			risk: "Risk disclosure",
			lowRisk: "Low risk",
			mediumRisk: "Medium risk",
			highRisk: "High risk",
			changelog: "Changelog",
			publishedAt: "Published",
			withdrawn: "This version is withdrawn",
			localReadOnly: "Local entry is read-only",
			detailLoading: "Reading details…",
			detailError: "This version detail is temporarily unavailable.",
			detailUnavailable: "This exact version is no longer available.",
			preflight: "Installation compatibility",
			preflightIntro: "Confirm the version, platform, and runtime environment before taking action.",
			checkingCompatibility: "Checking the current environment…",
			compatibilityError: "Compatibility could not be checked, so installation remains disabled.",
			allowedToInstall: "Installation is compatible now",
			installationBlocked: "Installation is blocked now",
			denialReasons: "Denial reasons",
			currentEnvironment: "Current environment",
			desktopVersion: "Desktop version",
			dshVersion: "DSH version",
			nodeVersion: "Node version",
			platform: "Platform",
			profileRevision: "Profile revision",
			catalogRevision: "Catalog revision",
			restartRequired: "Host restart required",
			restartYes: "Yes",
			restartNo: "No",
			authorityTitle: "Runtime authority",
			authorityWarning: "Community plugins are not security-reviewed by DeepSeek. Installed code receives broad application-process authority, so install only exact versions you trust.",
			install: "Install",
			installed: "Installed",
			cannotInstall: "Cannot install",
			installationInProgress: "Installation in progress",
			installationFailedAction: "Awaiting recovery",
			confirmInstallTitle: "Install plugin",
			confirmInstallIntro: "Confirm the exact version and runtime authority before starting the trusted installation.",
			confirmInstallVersion: "Exact version",
			confirmInstallAuthority: "The plugin runs in the application process and can use its declared Host, client, and tool capabilities.",
			confirmInstallAcknowledge: "I trust this exact version and agree to grant the runtime authority above.",
			confirmInstall: "Confirm install",
			cancel: "Cancel",
			close: "Close",
			done: "Done",
			installNotAvailableYet: "This version performs preflight checks only and does not install the plugin.",
			installReleaseGated: "Install and uninstall are available only in DeepSeek Harness Desktop.",
			webInstallSimulation: "Desktop changes the local Profile; browser development mode only simulates the same progress.",
			installationProgress: "Installation progress",
			installationComplete: "Plugin installed and loaded",
			installationFailed: "Installation did not complete",
			operationInProgress: "The trusted installation transaction is running. Keep this page open.",
			operationCommitted: "The plugin environment reloaded, and its declared runtime capabilities passed verification.",
			operationCommittedClient: "The plugin environment and client UI reloaded, and its declared runtime capabilities passed verification.",
			operationFailed: "The installation was not committed; evidence needed for Profile recovery is retained.",
			operationNeedsRecovery: "This operation must wait for safe recovery before another installation can start.",
			operationKeepOpen: "The window stays open; the UI may reconnect briefly while the plugin environment reloads.",
			operationRequestFailed: "Installation progress could not be started or restored.",
			operationFailureCode: "Failure code",
			recoveryRunningTitle: "Restoring the plugin environment",
			recoveryFailedTitle: "Plugin environment recovery incomplete",
			recoveryRunning: "Restoring and verifying the prior Host, client, and Skill inventory.",
			recoveryFailed: "The prior environment is not fully verified, so plugin mutations remain closed.",
			recoveryAttempt: "Recovery attempt",
			recoveryReasonCode: "Recovery reason",
			recoveryReasonPending: "Confirming the prior environment state",
			recoveryReasonUnsupportedJournalVersion: "The recovery record uses an unsupported version",
			recoveryReasonJournalInvalid: "The recovery record is damaged or invalid",
			recoveryReasonSnapshotMissing: "The prior environment snapshot is missing",
			recoveryReasonSnapshotInvalid: "The prior environment snapshot is invalid",
			recoveryReasonSnapshotRootMismatch: "The snapshot does not belong to this Profile",
			recoveryReasonSnapshotPathInvalid: "The snapshot contains an unsafe path",
			recoveryReasonSnapshotHashMismatch: "The snapshot integrity check failed",
			recoveryReasonProfileLockBusy: "Another process still owns the plugin environment",
			recoveryReasonHostStopFailed: "The current Host could not stop safely",
			recoveryReasonProfileRestoreFailed: "The Profile files could not be restored",
			recoveryReasonPackageRestoreFailed: "The prior dependencies could not be restored",
			recoveryReasonHostStartFailed: "The prior Host could not restart",
			recoveryReasonRuntimeVerificationFailed: "Prior Host, client, or Skill verification did not pass",
			recoveryReasonDiagnosticExportFailed: "Diagnostic export failed",
			retryRecovery: "Retry recovery",
			exportDiagnostics: "Export diagnostics",
			diagnosticSaved: "Diagnostic file saved.",
			diagnosticCancelled: "Diagnostic export cancelled.",
			recoveryRequestFailed: "Recovery did not complete. Retry or export diagnostics.",
			progressPreparing: "Prepare and verify",
			progressInstalling: "Install exact version",
			progressReloading: "Reload plugin environment",
			progressVerifying: "Verify runtime capabilities",
			phasePreflight: "Compatibility preflight",
			phaseDownloading: "Download exact-version artifact",
			phaseVerifyingArtifact: "Verify artifact",
			phaseSnapshotting: "Save Profile snapshot",
			phaseStoppingHost: "Stop current Host",
			phaseInstalling: "Write exact version",
			phaseValidatingProfile: "Validate Profile",
			phaseStartingHost: "Start replacement Host",
			phaseReloading: "Reconnect the UI",
			phaseHealthChecking: "Check Host health",
			phaseVerifyingRuntime: "Verify Host and client capabilities",
			phaseCommitted: "Installation complete",
			phaseFailed: "Installation failed",
			reasonCatalogMetadataInvalid: "Invalid catalog metadata",
			reasonCatalogUnverified: "Version artifact has not completed validation",
			reasonVersionWithdrawn: "Version is withdrawn",
			reasonVersionIneligible: "Version is currently ineligible",
			reasonProtectedPackage: "Protected system package",
			reasonProtectedEntry: "Protected system entry",
			reasonDesktopVersionUnsupported: "Desktop version is unsupported",
			reasonDshVersionUnsupported: "DSH version is unsupported",
			reasonNodeVersionUnsupported: "Node version is unsupported",
			reasonPlatformUnsupported: "Current platform is unsupported",
			reasonArtifactMissing: "Current platform artifact is missing",
			reasonArtifactEvidenceIncomplete: "Artifact evidence is incomplete",
			reasonPluginIdentityConflict: "Plugin identity conflict",
			reasonPackageIdentityConflict: "Package identity conflict",
			reasonEntryIdentityConflict: "Runtime entry conflict",
			reasonDeclaredConflict: "Declared conflict is present",
			reasonOperationBusy: "Another plugin operation is active",
			reasonActionNotSupported: "Action is not supported in the current state"
		};
		//#endregion
		//#region lib/types/client/index.js
		/** Desktop Plugin Center first-level navigation and independent main page. */
		/** Dictionary namespace owned by this plugin. */
		const NS = "pluginCenter";
		/** Services used by the slot contribution. */
		const inject = [
			"slots",
			"layout",
			"locale",
			"settingsNavigation",
			"sessions",
			"workspaces",
			"connection",
			"conversation"
		];
		const PLUGIN_CENTER_PAGE_ID = "plugin-center";
		const PLUGIN_DISCOVERY_PAGE_ID = "plugin-discovery";
		/** Add the Desktop-only catalog as a first-level page without replacing Settings. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-plugin-center: dictionaries");
			const resolved = resolveCatalogBridge();
			const bridge = resolved.bridge;
			const unavailable = () => Promise.reject(/* @__PURE__ */ new Error("Desktop catalog bridge unavailable"));
			const injected = () => ({
				available: bridge !== void 0,
				development: resolved.development,
				list: (query) => bridge === void 0 ? unavailable() : bridge.catalog.list(query),
				refresh: (query) => bridge === void 0 ? unavailable() : bridge.catalog.refresh(query),
				detail: (query) => bridge === void 0 ? unavailable() : bridge.catalog.detail(query),
				checkCompatibility: (request) => bridge === void 0 ? unavailable() : bridge.catalog.checkCompatibility(request),
				listInstalled: () => bridge === void 0 ? unavailable() : bridge.installedPlugins.list(),
				openPluginSettings: (tabId) => {
					ctx.settingsNavigation.open({
						sectionId: "plugins",
						tabId
					});
				},
				mutationsEnabled: bridge?.pluginOperations.mutationsEnabled ?? false,
				install: (request) => bridge === void 0 ? unavailable() : bridge.pluginOperations.install(request),
				manage: (request) => bridge === void 0 ? unavailable() : bridge.pluginOperations.manage(request),
				getOwnedDataOffer: () => bridge === void 0 ? Promise.resolve(null) : bridge.pluginOwnedData.getOffer(),
				removeOwnedData: (request) => bridge === void 0 ? unavailable() : bridge.pluginOwnedData.remove(request),
				retainOwnedData: (request) => bridge === void 0 ? unavailable() : bridge.pluginOwnedData.retain(request),
				getOperation: () => bridge === void 0 ? Promise.resolve(null) : bridge.pluginOperations.getOperation(),
				onOperationState: (listener) => bridge === void 0 ? () => {} : bridge.pluginOperations.onState(listener),
				getRecovery: () => bridge?.pluginRecovery?.getState() ?? Promise.resolve(null),
				retryRecovery: (request) => bridge?.pluginRecovery === void 0 ? unavailable() : bridge.pluginRecovery.retry(request),
				exportRecoveryDiagnostics: (request) => bridge?.pluginRecovery === void 0 ? unavailable() : bridge.pluginRecovery.exportDiagnostics(request),
				onRecoveryState: (listener) => bridge?.pluginRecovery?.onState(listener) ?? (() => {})
			});
			const navInjected = () => ({
				pageId: PLUGIN_CENTER_PAGE_ID,
				open: () => {
					ctx.layout.openPrimaryPage(PLUGIN_CENTER_PAGE_ID);
				}
			});
			const discoveryNavInjected = () => ({
				pageId: PLUGIN_DISCOVERY_PAGE_ID,
				open: () => {
					ctx.layout.openPrimaryPage(PLUGIN_DISCOVERY_PAGE_ID);
				}
			});
			const discoveryInjected = () => ({
				available: bridge !== void 0,
				development: resolved.development,
				list: (query) => bridge === void 0 ? unavailable() : bridge.catalog.list(query),
				refresh: (query) => bridge === void 0 ? unavailable() : bridge.catalog.refresh(query),
				detail: (query) => bridge === void 0 ? unavailable() : bridge.catalog.detail(query),
				checkCompatibility: (request) => bridge === void 0 ? unavailable() : bridge.catalog.checkCompatibility(request),
				listInstalled: () => bridge === void 0 ? unavailable() : bridge.installedPlugins.list(),
				mutationsEnabled: bridge?.pluginOperations.mutationsEnabled ?? false,
				install: (request) => bridge === void 0 ? unavailable() : bridge.pluginOperations.install(request),
				getOperation: () => bridge === void 0 ? Promise.resolve(null) : bridge.pluginOperations.getOperation(),
				onOperationState: (listener) => bridge === void 0 ? () => {} : bridge.pluginOperations.onState(listener),
				openPluginCenter: () => {
					ctx.layout.openPrimaryPage(PLUGIN_CENTER_PAGE_ID);
				},
				findWithAgent: async (requirement) => {
					const sessionId = ctx.sessions.list.getSnapshot().current;
					if (sessionId === void 0) {
						ctx.workspaces.startSession();
						return "session-starting";
					}
					const connection = ctx.get("connection");
					if (connection === void 0) throw new Error("Agent connection unavailable");
					const described = await connection.api.credentials.describe({ refs: ["DEEPSEEK_API_KEY"] });
					if (!described.result.ok) throw new Error(described.result.error.message);
					if (described.result.value.credentials["DEEPSEEK_API_KEY"]?.configured !== true) {
						ctx.settingsNavigation.open({ sectionId: "models" });
						return "needs-model";
					}
					const conversation = ctx.sessions.scope(sessionId)?.get("conversation");
					if (conversation === void 0) throw new Error("Agent session unavailable");
					await conversation.send(`/find-plugins ${requirement}`);
					ctx.layout.closePrimaryPage(PLUGIN_DISCOVERY_PAGE_ID);
					return "sent";
				}
			});
			ctx.slots.inject("sidebar.primary.action", () => ctx.slots.register({
				name: "sidebar.primary.action",
				id: PLUGIN_CENTER_PAGE_ID,
				order: 20,
				locale: NS,
				inject: navInjected
			}, PluginCenterNavItem));
			ctx.slots.inject("sidebar.primary.action", () => ctx.slots.register({
				name: "sidebar.primary.action",
				id: PLUGIN_DISCOVERY_PAGE_ID,
				order: 21,
				locale: NS,
				inject: discoveryNavInjected
			}, PluginDiscoveryNavItem));
			ctx.slots.inject("main.page", () => ctx.slots.register({
				name: "main.page",
				key: PLUGIN_CENTER_PAGE_ID,
				locale: NS,
				inject: injected
			}, PluginCenterTab));
			ctx.slots.inject("main.page", () => ctx.slots.register({
				name: "main.page",
				key: PLUGIN_DISCOVERY_PAGE_ID,
				locale: NS,
				inject: discoveryInjected
			}, PluginDiscoveryPage));
			ctx.effect(() => () => {
				ctx.layout.closePrimaryPage(PLUGIN_CENTER_PAGE_ID);
				ctx.layout.closePrimaryPage(PLUGIN_DISCOVERY_PAGE_ID);
			}, "ui-plugin-center: close selected pages on teardown");
		}
		//#endregion
		exports.NS = NS;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map