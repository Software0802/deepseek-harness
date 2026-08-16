window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-desktop-customization",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		//#region lib/types/client/appearance-themes.js
		/** Bundled Desktop themes and their fixed presentation defaults. */
		/** Theme used before a learner makes a persisted choice. */
		const DEFAULT_BUILTIN_APPEARANCE_THEME = "whale-maid";
		/** Fixed themes shipped with the Desktop web frontend. */
		const BUNDLED_APPEARANCE_THEMES = Object.freeze({
			official: Object.freeze({
				id: "official",
				imageUrl: null,
				palette: Object.freeze([
					"#2563EB",
					"#1F2937",
					"#D1D5DB",
					"#60A5FA"
				]),
				focusY: 50,
				glassStrength: 72
			}),
			"whale-maid": Object.freeze({
				id: "whale-maid",
				imageUrl: "/dsh-desktop/default-background.webp",
				palette: Object.freeze([
					"#587ac2",
					"#253555",
					"#d9e5f7",
					"#8ba5d6"
				]),
				focusY: 50,
				glassStrength: 72
			}),
			"cloud-cat": Object.freeze({
				id: "cloud-cat",
				imageUrl: "/dsh-desktop/cloud-cat-background.webp",
				palette: Object.freeze([
					"#3b5891",
					"#1d2739",
					"#b0c7e8",
					"#7091cc"
				]),
				focusY: 50,
				glassStrength: 72
			})
		});
		/**
		* Resolve either a custom image or one bundled theme into a renderer URL.
		* @param settings - Validated built-in identity and optional custom-image data.
		* @returns A bundled asset URL, the persisted custom-image data URL, or null for the original UI.
		*/
		function resolveAppearanceBackground(settings) {
			if (settings.imageDataUrl !== null) return settings.imageDataUrl;
			return BUNDLED_APPEARANCE_THEMES[settings.builtinTheme ?? "whale-maid"].imageUrl;
		}
		BUNDLED_APPEARANCE_THEMES[DEFAULT_BUILTIN_APPEARANCE_THEME].imageUrl;
		/** Initial appearance before an optional persisted learner choice loads. */
		const DEFAULT_APPEARANCE = Object.freeze({
			builtinTheme: DEFAULT_BUILTIN_APPEARANCE_THEME,
			imageDataUrl: null,
			focusY: 50,
			glassStrength: 72,
			palette: BUNDLED_APPEARANCE_THEMES[DEFAULT_BUILTIN_APPEARANCE_THEME].palette
		});
		/** Applies and persists one Desktop background without exposing Electron APIs elsewhere. */
		var AppearanceController = class {
			bridge;
			theme;
			snapshot = {
				status: "loading",
				settings: DEFAULT_APPEARANCE
			};
			listeners = /* @__PURE__ */ new Set();
			disposeTokens;
			disposed = false;
			previousMarker = null;
			previousImage = "";
			previousPosition = "";
			constructor(bridge, theme) {
				this.bridge = bridge;
				this.theme = theme;
			}
			/** Subscribe for React useSyncExternalStore. */
			subscribe = (listener) => {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			};
			/** Current immutable snapshot. */
			getSnapshot = () => this.snapshot;
			/**
			* Apply the default immediately, then load any saved learner choice.
			* @returns A disposer that restores the prior theme state.
			*/
			start() {
				const body = document.body;
				this.previousMarker = body.getAttribute("data-dsh-desktop-skin");
				this.previousImage = body.style.getPropertyValue("--dsh-desktop-background-image");
				this.previousPosition = body.style.getPropertyValue("--dsh-desktop-background-position");
				this.apply(DEFAULT_APPEARANCE);
				if (this.bridge === void 0) this.publish({
					status: "error",
					settings: DEFAULT_APPEARANCE,
					message: "Desktop bridge 未加载，当前只显示默认背景。"
				});
				else this.bridge.appearance.get().then((settings) => {
					if (this.disposed) return;
					this.apply(settings);
					this.publish({
						status: "ready",
						settings
					});
				}, (error) => {
					if (this.disposed) return;
					this.publish({
						status: "error",
						settings: DEFAULT_APPEARANCE,
						message: messageOf$2(error)
					});
				});
				return () => {
					this.dispose();
				};
			}
			/**
			* Persist and apply a processed background.
			* @param settings Validated appearance values to store through the preload bridge.
			*/
			async save(settings) {
				if (this.bridge === void 0) throw new Error("Desktop bridge 未加载。");
				this.publish({
					status: "saving",
					settings: this.snapshot.settings
				});
				try {
					const saved = await this.bridge.appearance.save(settings);
					this.apply(saved);
					this.publish({
						status: "ready",
						settings: saved,
						message: "背景已保存。"
					});
				} catch (error) {
					this.publish({
						status: "error",
						settings: this.snapshot.settings,
						message: messageOf$2(error)
					});
					throw error;
				}
			}
			/** Remove the custom image and return to the bundled background. */
			async reset() {
				if (this.bridge === void 0) throw new Error("Desktop bridge 未加载。");
				this.publish({
					status: "saving",
					settings: this.snapshot.settings
				});
				try {
					const settings = await this.bridge.appearance.reset();
					this.apply(settings);
					this.publish({
						status: "ready",
						settings,
						message: "已恢复默认背景。"
					});
				} catch (error) {
					this.publish({
						status: "error",
						settings: this.snapshot.settings,
						message: messageOf$2(error)
					});
					throw error;
				}
			}
			apply(settings) {
				const image = resolveAppearanceBackground(settings);
				this.disposeTokens?.();
				this.disposeTokens = void 0;
				if (image === null) {
					const body = document.body;
					if (this.previousMarker === null) body.removeAttribute("data-dsh-desktop-skin");
					else body.setAttribute("data-dsh-desktop-skin", this.previousMarker);
					restoreProperty(body, "--dsh-desktop-background-image", this.previousImage);
					restoreProperty(body, "--dsh-desktop-background-position", this.previousPosition);
					return;
				}
				document.body.setAttribute("data-dsh-desktop-skin", "active");
				document.body.style.setProperty("--dsh-desktop-background-image", `url("${image}")`);
				document.body.style.setProperty("--dsh-desktop-background-position", `${String(settings.focusY)}%`);
				this.disposeTokens = this.theme.overrideTokens("dsh-desktop-background", themeTokens(settings));
			}
			publish(snapshot) {
				this.snapshot = Object.freeze({ ...snapshot });
				for (const listener of this.listeners) listener();
			}
			dispose() {
				this.disposed = true;
				this.disposeTokens?.();
				this.disposeTokens = void 0;
				const body = document.body;
				if (this.previousMarker === null) body.removeAttribute("data-dsh-desktop-skin");
				else body.setAttribute("data-dsh-desktop-skin", this.previousMarker);
				restoreProperty(body, "--dsh-desktop-background-image", this.previousImage);
				restoreProperty(body, "--dsh-desktop-background-position", this.previousPosition);
			}
		};
		function themeTokens(settings) {
			const [accent, deep, mist, highlight] = settings.palette;
			const strength = settings.glassStrength / 100;
			const baseAlpha = (.24 + strength * .22).toFixed(2);
			const darkAlpha = (.31 + strength * .22).toFixed(2);
			const layerAlpha = (.58 + strength * .2).toFixed(2);
			const modes = (light, dark) => ({
				light,
				dark
			});
			return {
				"--dsw-alias-bg-base": modes(`rgba(246, 250, 255, ${baseAlpha})`, `rgba(7, 17, 29, ${darkAlpha})`),
				"--dsw-alias-bg-layer-1": modes(`rgba(255, 255, 255, ${layerAlpha})`, `rgba(13, 27, 45, ${layerAlpha})`),
				"--dsw-alias-bg-layer-2": modes("rgba(236, 245, 255, 0.86)", "rgba(18, 36, 57, 0.88)"),
				"--dsw-alias-bg-overlay": modes("rgba(251, 253, 255, 0.96)", "rgba(11, 23, 39, 0.96)"),
				"--dsw-specific-sidebar-fill": modes("rgba(235, 244, 254, 0.68)", "rgba(8, 21, 36, 0.72)"),
				"--dsw-specific-input-major": modes("rgba(255, 255, 255, 0.90)", "rgba(16, 34, 54, 0.92)"),
				"--dsw-specific-menu": modes("rgba(251, 253, 255, 0.97)", "rgba(11, 25, 42, 0.97)"),
				"--dsw-specific-selector": modes("rgba(236, 246, 255, 0.94)", "rgba(21, 42, 65, 0.94)"),
				"--dsw-specific-bubble": modes("rgba(219, 238, 255, 0.92)", "rgba(31, 61, 91, 0.88)"),
				"--dsw-alias-border-l1": modes(`${mist}80`, `${mist}66`),
				"--dsw-alias-border-l2": modes(`${mist}a8`, `${mist}78`),
				"--dsw-alias-brand-primary": modes(accent, highlight),
				"--dsw-alias-state-business-primary": modes(accent, highlight),
				"--dsw-alias-label-primary": modes(deep, "#edf7ff"),
				"--dsw-alias-label-secondary": modes(`${deep}cc`, "#b9cfe2"),
				"--dsw-alias-interactive-bg-hover": modes(`${accent}18`, `${highlight}24`)
			};
		}
		function restoreProperty(element, name, value) {
			if (value === "") element.style.removeProperty(name);
			else element.style.setProperty(name, value);
		}
		function messageOf$2(error) {
			return error instanceof Error ? error.message : String(error);
		}
		/** Stable palette used until a custom background yields sampled colors. */
		const DEFAULT_PALETTE = [
			"#3b5891",
			"#1d2739",
			"#b0c7e8",
			"#7091cc"
		];
		/**
		* Reject files the known Canvas/WebP path cannot safely consume.
		* @param file Browser-selected source image.
		* @returns A learner-facing validation error, or undefined when accepted.
		*/
		function validateImageFile(file) {
			if (!/^image\/(png|jpeg|webp)$/u.test(file.type)) return "请选择 PNG、JPG 或 WebP 图片。";
			if (file.size > 16777216) return "原图请控制在 16 MB 以内。";
		}
		/**
		* Decode an object/data/HTTP URL into an image element.
		* @param url Image URL owned by the current renderer.
		* @returns The fully decoded image element.
		*/
		async function loadImage(url) {
			const image = new Image();
			image.decoding = "async";
			image.src = url;
			await image.decode();
			return image;
		}
		/**
		* Cover-crop one image to the runtime 16:9 background.
		* @param image Decoded learner image.
		* @param focusY Vertical focal position from 0 to 100.
		* @returns A 1920 by 1080 canvas ready for WebP encoding.
		*/
		function renderBackground(image, focusY) {
			const canvas = document.createElement("canvas");
			canvas.width = 1920;
			canvas.height = 1080;
			const context = canvas.getContext("2d", { alpha: false });
			if (context === null) throw new Error("当前设备无法创建图片画布。");
			const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
			const width = image.naturalWidth * scale;
			const height = image.naturalHeight * scale;
			const x = (canvas.width - width) / 2;
			const y = (canvas.height - height) * (focusY / 100);
			context.drawImage(image, x, y, width, height);
			return canvas;
		}
		/**
		* Extract a stable four-color theme palette from the processed background.
		* @param canvas Processed 16:9 background canvas.
		* @returns Accent, deep, mist, and highlight colors.
		*/
		function extractPalette(canvas) {
			const sample = document.createElement("canvas");
			sample.width = 80;
			sample.height = 45;
			const context = sample.getContext("2d", { willReadFrequently: true });
			if (context === null) return DEFAULT_PALETTE;
			context.drawImage(canvas, 0, 0, sample.width, sample.height);
			const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
			const colors = [];
			for (let index = 0; index < pixels.length; index += 16) {
				const color = [
					pixels[index] ?? 0,
					pixels[index + 1] ?? 0,
					pixels[index + 2] ?? 0
				];
				if (Math.max(...color) - Math.min(...color) < 7 && (color[0] < 28 || color[0] > 238)) continue;
				colors.push(color);
			}
			if (colors.length < 20) return DEFAULT_PALETTE;
			const byLightness = [...colors].sort((a, b) => luminance(a) - luminance(b));
			let centers = [
				.08,
				.34,
				.66,
				.92
			].map((point) => [...byLightness[Math.floor((byLightness.length - 1) * point)]]);
			for (let round = 0; round < 7; round += 1) {
				const groups = centers.map(() => []);
				for (const color of colors) {
					let nearest = 0;
					let distance = Number.POSITIVE_INFINITY;
					centers.forEach((center, index) => {
						const next = colorDistance(color, center);
						if (next < distance) {
							nearest = index;
							distance = next;
						}
					});
					groups[nearest].push(color);
				}
				centers = groups.map((group, index) => group.length === 0 ? centers[index] : average(group));
			}
			const ordered = [...centers].sort((a, b) => luminance(a) - luminance(b));
			const deepSource = ordered[0];
			const mistSource = ordered.at(-1);
			const accentSource = [...centers].sort((a, b) => saturation(b) - saturation(a))[0];
			const highlightSource = centers.filter((color) => color !== deepSource && color !== accentSource).sort((a, b) => Math.abs(luminance(a) - 145) - Math.abs(luminance(b) - 145))[0] ?? mistSource;
			return [
				rgbToHex(normalizeThemeColor(accentSource, .42, .4)),
				rgbToHex(normalizeThemeColor(deepSource, .26, .17)),
				rgbToHex(normalizeThemeColor(mistSource, .2, .8)),
				rgbToHex(normalizeThemeColor(highlightSource, .34, .62))
			];
		}
		function luminance([r, g, b]) {
			return .2126 * r + .7152 * g + .0722 * b;
		}
		function saturation(color) {
			return Math.max(...color) - Math.min(...color);
		}
		function colorDistance(a, b) {
			return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
		}
		function average(group) {
			return [
				0,
				1,
				2
			].map((channel) => Math.round(group.reduce((sum, color) => sum + color[channel], 0) / group.length));
		}
		function rgbToHex(color) {
			return `#${color.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
		}
		function normalizeThemeColor(rgb, minimumSaturation, lightness) {
			const [hue, saturationValue] = rgbToHsl(rgb);
			return hslToRgb([
				hue,
				Math.max(minimumSaturation, saturationValue),
				lightness
			]);
		}
		function rgbToHsl([red, green, blue]) {
			const [r, g, b] = [
				red / 255,
				green / 255,
				blue / 255
			];
			const maximum = Math.max(r, g, b);
			const minimum = Math.min(r, g, b);
			const delta = maximum - minimum;
			let hue = 0;
			if (delta !== 0) {
				if (maximum === r) hue = (g - b) / delta % 6;
				else if (maximum === g) hue = (b - r) / delta + 2;
				else hue = (r - g) / delta + 4;
				hue /= 6;
				if (hue < 0) hue += 1;
			}
			const lightness = (maximum + minimum) / 2;
			const saturationValue = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
			return [
				hue,
				saturationValue,
				lightness
			];
		}
		function hslToRgb([hue, saturationValue, lightness]) {
			const chroma = (1 - Math.abs(2 * lightness - 1)) * saturationValue;
			const segment = hue * 6;
			const x = chroma * (1 - Math.abs(segment % 2 - 1));
			let rgb = [
				0,
				0,
				0
			];
			if (segment < 1) rgb = [
				chroma,
				x,
				0
			];
			else if (segment < 2) rgb = [
				x,
				chroma,
				0
			];
			else if (segment < 3) rgb = [
				0,
				chroma,
				x
			];
			else if (segment < 4) rgb = [
				0,
				x,
				chroma
			];
			else if (segment < 5) rgb = [
				x,
				0,
				chroma
			];
			else rgb = [
				chroma,
				0,
				x
			];
			const match = lightness - chroma / 2;
			return rgb.map((value) => Math.round((value + match) * 255));
		}
		//#endregion
		//#region \0dsh-css:./packages/client/ui-desktop-customization/src/client/DesktopCustomization.module.css.mjs
		const css$1 = "html{background:#07111d}body[data-dsh-desktop-skin=active]{background-color:#07111d!important;background-image:linear-gradient(90deg, #040c167a 0%, #0714221f 46%, #040c1661 100%), var(--dsh-desktop-background-image)!important;background-position:center, center var(--dsh-desktop-background-position)!important;background-repeat:no-repeat,no-repeat!important;background-size:cover,cover!important;background-attachment:fixed,fixed!important}body[data-dsh-desktop-skin=active]:not([data-ds-dark-theme]){background-image:linear-gradient(90deg, #e9f5ff33 0%, #edf8ff05 48%, #ddeefc1f 100%), var(--dsh-desktop-background-image)!important}body[data-dsh-desktop-skin=active] #root{background:0 0!important}._7kJZSq_section{box-sizing:border-box;max-width:760px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:18px;display:flex}._7kJZSq_title{color:var(--dsw-alias-label-primary);margin:0;font-size:20px;font-weight:600;line-height:30px}._7kJZSq_intro{max-width:620px;color:var(--dsw-alias-label-secondary);margin:5px 0 0;font-size:14px;line-height:22px}._7kJZSq_themeHeading{color:var(--dsw-alias-label-primary);margin:0 0 10px;font-size:14px;font-weight:600;line-height:22px}._7kJZSq_themeGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;display:grid}._7kJZSq_themeCard{border:1px solid var(--dsw-alias-border-l2);min-width:0;color:inherit;background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 90%, transparent);cursor:pointer;text-align:left;border-radius:14px;flex-direction:column;padding:0;transition:border-color .16s,box-shadow .16s,transform .16s;display:flex;overflow:hidden}._7kJZSq_themeCard:hover:not(:disabled){border-color:var(--dsw-alias-brand-primary);transform:translateY(-1px)}._7kJZSq_themeCard[aria-pressed=true]{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 18%, transparent)}._7kJZSq_themeCard:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}._7kJZSq_themeCard:disabled{cursor:default;opacity:.58}._7kJZSq_themeThumbnail{aspect-ratio:16/9;border-bottom:1px solid var(--dsw-alias-border-l1);background-position:50%;background-repeat:no-repeat;background-size:cover;width:100%;display:block;position:relative}._7kJZSq_originalThemeThumbnail{background:linear-gradient(145deg, var(--dsw-alias-bg-layer-1), var(--dsw-alias-bg-base));place-items:center;display:grid}._7kJZSq_originalThemeLabel{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border-radius:10px;padding:6px 12px;font-size:11px;font-weight:550;line-height:18px}._7kJZSq_themeSelected{color:#fff;backdrop-filter:blur(10px);background:#17345bc7;border:1px solid #ffffff94;border-radius:999px;padding:3px 8px;font-size:10px;line-height:16px;position:absolute;top:8px;right:8px;box-shadow:0 4px 14px #0917292e}._7kJZSq_themeDetails{flex-direction:column;gap:2px;min-width:0;padding:11px 12px 12px;display:flex}._7kJZSq_themeDetails strong{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:20px}._7kJZSq_themeDetails small{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:17px}._7kJZSq_preview{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background-repeat:no-repeat;background-size:cover;border-radius:18px;align-items:flex-end;min-height:260px;padding:22px;display:flex;position:relative;overflow:hidden;box-shadow:0 18px 48px #07111d29}._7kJZSq_previewChrome{color:#ffffffe0;letter-spacing:.02em;align-items:center;gap:8px;font-size:12px;display:flex;position:absolute;top:14px;left:16px;right:16px}._7kJZSq_previewChrome span{background:#6f94d7;border-radius:50%;width:8px;height:8px;box-shadow:14px 0 #ffffff8f,28px 0 #ffffff47}._7kJZSq_previewChrome strong{margin-left:30px;font-weight:500}._7kJZSq_previewGlass{color:#fff;backdrop-filter:blur(18px);background:#0914226b;border:1px solid #ffffff52;border-radius:12px;justify-content:space-between;align-items:center;width:100%;padding:13px 15px;display:flex}._7kJZSq_previewGlass span{font-size:14px;font-weight:600}._7kJZSq_previewGlass small{color:#ffffffb8;font-size:11px}._7kJZSq_fileRow,._7kJZSq_updateCard,._7kJZSq_developmentNote{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 88%, transparent);border-radius:14px;align-items:center;gap:14px;padding:14px 16px;display:flex}._7kJZSq_fileRow>div,._7kJZSq_updateIdentity,._7kJZSq_developmentNote{flex-direction:column;min-width:0;display:flex}._7kJZSq_fileRow strong,._7kJZSq_updateIdentity strong,._7kJZSq_developmentNote strong{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:550;line-height:22px}._7kJZSq_fileRow small,._7kJZSq_updateIdentity span,._7kJZSq_developmentNote span{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}._7kJZSq_fileRow ._7kJZSq_secondaryButton{margin-left:auto}._7kJZSq_rangeRow{flex-direction:column;gap:9px;display:flex}._7kJZSq_rangeRow>span{color:var(--dsw-alias-label-primary);justify-content:space-between;font-size:13px;line-height:20px;display:flex}._7kJZSq_rangeRow b{font-weight:500}._7kJZSq_rangeRow output{color:var(--dsw-alias-label-secondary)}._7kJZSq_rangeRow input{width:100%;accent-color:var(--dsw-alias-brand-primary)}._7kJZSq_actions{align-items:center;gap:10px;display:flex}._7kJZSq_primaryButton,._7kJZSq_secondaryButton{box-sizing:border-box;height:38px;font:inherit;cursor:pointer;border-radius:19px;justify-content:center;align-items:center;padding:0 16px;font-size:13px;line-height:20px;display:inline-flex}._7kJZSq_primaryButton{color:var(--dsw-alias-label-primary-foreground);background:var(--dsw-alias-button-primary-fill);border:none}._7kJZSq_primaryButton:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}._7kJZSq_secondaryButton{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1)}._7kJZSq_secondaryButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-solid)}._7kJZSq_primaryButton:disabled,._7kJZSq_secondaryButton:disabled{cursor:default;opacity:.52}._7kJZSq_secondaryButton input{display:none}._7kJZSq_notice,._7kJZSq_error{margin:-4px 0 0;font-size:12px;line-height:18px}._7kJZSq_notice{color:var(--dsw-alias-label-secondary)}._7kJZSq_error{color:var(--dsw-alias-state-error-primary)}._7kJZSq_updateIcon{color:#fff;letter-spacing:.08em;background:linear-gradient(145deg,#244b83,#6b8fc7);border-radius:13px;flex:none;place-items:center;width:46px;height:46px;font-size:11px;font-weight:700;display:grid;box-shadow:0 8px 20px #23498140}._7kJZSq_statusPill{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);white-space:nowrap;border-radius:999px;margin-left:auto;padding:5px 10px;font-size:11px;line-height:16px}._7kJZSq_progress{background:var(--dsw-alias-bg-layer-2);border-radius:999px;height:7px;overflow:hidden}._7kJZSq_progress span{border-radius:inherit;background:var(--dsw-alias-brand-primary);height:100%;transition:width .18s ease-out;display:block}._7kJZSq_developmentNote{border-style:dashed;align-items:flex-start}._7kJZSq_brandBadge{border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2) 82%, transparent);height:32px;color:var(--dsw-alias-label-secondary);background:color-mix(in srgb, var(--dsw-alias-bg-overlay) 74%, transparent);backdrop-filter:blur(14px);opacity:.76;border-radius:16px;align-items:center;gap:8px;padding:0 11px 0 5px;font-size:11px;line-height:16px;text-decoration:none;transition:opacity .16s,transform .16s,background .16s;display:inline-flex;position:absolute;bottom:14px;right:22px;box-shadow:0 8px 24px #050d171a}._7kJZSq_brandBadge:hover,._7kJZSq_brandBadge:focus-visible{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-overlay);opacity:1;transform:translateY(-1px)}._7kJZSq_brandBadge img{object-fit:cover;border-radius:50%;width:22px;height:22px}@media (width<=1080px),(height<=700px){._7kJZSq_brandBadge span{display:none}._7kJZSq_brandBadge{justify-content:center;width:30px;padding:0}}@media (width<=720px){._7kJZSq_themeGrid{grid-template-columns:1fr}}@media (prefers-reduced-motion:reduce){._7kJZSq_brandBadge,._7kJZSq_themeCard,._7kJZSq_progress span{transition:none}}";
		const tagId$1 = "@deepseek-ai/dsh-client-ui-desktop-customization/DesktopCustomization.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-desktop-customization";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var DesktopCustomization_module_css_default = {
			"intro": "_7kJZSq_intro",
			"themeDetails": "_7kJZSq_themeDetails",
			"preview": "_7kJZSq_preview",
			"developmentNote": "_7kJZSq_developmentNote",
			"rangeRow": "_7kJZSq_rangeRow",
			"actions": "_7kJZSq_actions",
			"notice": "_7kJZSq_notice",
			"title": "_7kJZSq_title",
			"originalThemeThumbnail": "_7kJZSq_originalThemeThumbnail",
			"originalThemeLabel": "_7kJZSq_originalThemeLabel",
			"previewChrome": "_7kJZSq_previewChrome",
			"fileRow": "_7kJZSq_fileRow",
			"themeHeading": "_7kJZSq_themeHeading",
			"error": "_7kJZSq_error",
			"statusPill": "_7kJZSq_statusPill",
			"themeGrid": "_7kJZSq_themeGrid",
			"themeCard": "_7kJZSq_themeCard",
			"updateIdentity": "_7kJZSq_updateIdentity",
			"updateCard": "_7kJZSq_updateCard",
			"themeSelected": "_7kJZSq_themeSelected",
			"secondaryButton": "_7kJZSq_secondaryButton",
			"primaryButton": "_7kJZSq_primaryButton",
			"brandBadge": "_7kJZSq_brandBadge",
			"section": "_7kJZSq_section",
			"progress": "_7kJZSq_progress",
			"previewGlass": "_7kJZSq_previewGlass",
			"updateIcon": "_7kJZSq_updateIcon",
			"themeThumbnail": "_7kJZSq_themeThumbnail"
		};
		//#endregion
		//#region lib/types/client/AppearanceSection.js
		/** In-app background chooser over the proven Harness image-skin pipeline. */
		const THEME_COPY = Object.freeze({
			official: Object.freeze({
				name: "官方原版",
				description: "不使用背景图片，恢复 DeepSeek Harness 原生界面。"
			}),
			"whale-maid": Object.freeze({
				name: "大肥鱼拟人",
				description: "蓝白鲸灵助手与明亮宫殿，中央留白适配对话区。"
			}),
			"cloud-cat": Object.freeze({
				name: "云端猫咪",
				description: "柔和蓝白猫咪背景，清爽、安静、低干扰。"
			})
		});
		/** Render the background selection, crop focus, glass, save, and reset controls. */
		function AppearanceSection({ controller }) {
			if (controller === void 0) return null;
			return (0, react_jsx_runtime.jsx)(LoadedAppearance, { controller });
		}
		function LoadedAppearance({ controller }) {
			const snapshot = (0, react.useSyncExternalStore)(controller.subscribe, controller.getSnapshot);
			const [previewUrl, setPreviewUrl] = (0, react.useState)(resolveAppearanceBackground(snapshot.settings));
			const [selectedUrl, setSelectedUrl] = (0, react.useState)(void 0);
			const [draftTheme, setDraftTheme] = (0, react.useState)(snapshot.settings.builtinTheme);
			const [draftDirty, setDraftDirty] = (0, react.useState)(false);
			const [focusY, setFocusY] = (0, react.useState)(snapshot.settings.focusY);
			const [glassStrength, setGlassStrength] = (0, react.useState)(snapshot.settings.glassStrength);
			const [fileLabel, setFileLabel] = (0, react.useState)(appearanceLabel(snapshot.settings));
			const [localMessage, setLocalMessage] = (0, react.useState)(void 0);
			const busy = snapshot.status === "saving";
			const originalSelected = selectedUrl === void 0 && draftTheme === "official";
			(0, react.useEffect)(() => {
				if (draftDirty) return;
				setPreviewUrl(resolveAppearanceBackground(snapshot.settings));
				setDraftTheme(snapshot.settings.builtinTheme);
				setFocusY(snapshot.settings.focusY);
				setGlassStrength(snapshot.settings.glassStrength);
				setFileLabel(appearanceLabel(snapshot.settings));
			}, [draftDirty, snapshot.settings]);
			(0, react.useEffect)(() => () => {
				if (selectedUrl !== void 0) URL.revokeObjectURL(selectedUrl);
			}, [selectedUrl]);
			const previewStyle = (0, react.useMemo)(() => ({
				backgroundImage: previewUrl === null ? "linear-gradient(145deg, var(--dsw-alias-bg-layer-1), var(--dsw-alias-bg-base))" : `linear-gradient(90deg, rgba(4, 12, 22, ${String(.18 + glassStrength / 220)}) 0%, rgba(7, 20, 34, 0.08) 50%, rgba(4, 12, 22, 0.30) 100%), url("${previewUrl}")`,
				backgroundPosition: previewUrl === null ? "center" : `center, center ${String(focusY)}%`
			}), [
				focusY,
				glassStrength,
				previewUrl
			]);
			const selectFile = (event) => {
				const file = event.target.files?.[0];
				event.target.value = "";
				if (file === void 0) return;
				const invalid = validateImageFile(file);
				if (invalid !== void 0) {
					setLocalMessage(invalid);
					return;
				}
				if (selectedUrl !== void 0) URL.revokeObjectURL(selectedUrl);
				const url = URL.createObjectURL(file);
				setSelectedUrl(url);
				setDraftTheme(null);
				setDraftDirty(true);
				setPreviewUrl(url);
				setFocusY(50);
				setFileLabel(`${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`);
				setLocalMessage("图片只在本机处理，不会上传。");
			};
			const selectBuiltinTheme = (themeId) => {
				const theme = BUNDLED_APPEARANCE_THEMES[themeId];
				setSelectedUrl(void 0);
				setDraftTheme(themeId);
				setDraftDirty(true);
				setPreviewUrl(theme.imageUrl);
				setFocusY(theme.focusY);
				setGlassStrength(theme.glassStrength);
				setFileLabel(`内置皮肤 · ${THEME_COPY[themeId].name}`);
				setLocalMessage("已预览这套皮肤，点击“保存并应用”完成切换。");
			};
			const save = async () => {
				setLocalMessage("正在处理 1920 × 1080 WebP…");
				try {
					let imageDataUrl = snapshot.settings.imageDataUrl;
					let palette = snapshot.settings.palette;
					if (draftTheme !== null) {
						imageDataUrl = null;
						palette = BUNDLED_APPEARANCE_THEMES[draftTheme].palette;
					} else if (selectedUrl !== void 0) {
						const canvas = renderBackground(await loadImage(selectedUrl), focusY);
						imageDataUrl = canvas.toDataURL("image/webp", .86);
						palette = extractPalette(canvas);
					}
					await controller.save({
						builtinTheme: draftTheme,
						imageDataUrl,
						focusY,
						glassStrength,
						palette
					});
					if (selectedUrl !== void 0) URL.revokeObjectURL(selectedUrl);
					setSelectedUrl(void 0);
					setDraftDirty(false);
					setLocalMessage("背景已保存，重新启动应用后仍会保留。");
				} catch (error) {
					setLocalMessage(error instanceof Error ? error.message : String(error));
				}
			};
			const reset = async () => {
				try {
					await controller.reset();
					if (selectedUrl !== void 0) URL.revokeObjectURL(selectedUrl);
					setSelectedUrl(void 0);
					setDraftTheme(DEFAULT_BUILTIN_APPEARANCE_THEME);
					setDraftDirty(false);
					const theme = BUNDLED_APPEARANCE_THEMES[DEFAULT_BUILTIN_APPEARANCE_THEME];
					setPreviewUrl(theme.imageUrl);
					setFocusY(theme.focusY);
					setGlassStrength(theme.glassStrength);
					setLocalMessage("已恢复大肥鱼拟人默认皮肤。");
				} catch (error) {
					setLocalMessage(error instanceof Error ? error.message : String(error));
				}
			};
			return (0, react_jsx_runtime.jsxs)("section", {
				className: DesktopCustomization_module_css_default.section,
				children: [
					(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("h2", {
						className: DesktopCustomization_module_css_default.title,
						children: "皮肤与界面氛围"
					}), (0, react_jsx_runtime.jsx)("p", {
						className: DesktopCustomization_module_css_default.intro,
						children: "切换内置皮肤，或选择自己的图片；Harness 会在本机完成裁切和配色，并自动适配浅色、深色界面。"
					})] }),
					(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("h3", {
						className: DesktopCustomization_module_css_default.themeHeading,
						children: "内置皮肤"
					}), (0, react_jsx_runtime.jsx)("div", {
						className: DesktopCustomization_module_css_default.themeGrid,
						role: "group",
						"aria-label": "内置皮肤",
						children: Object.keys(BUNDLED_APPEARANCE_THEMES).map((themeId) => {
							const theme = BUNDLED_APPEARANCE_THEMES[themeId];
							const selected = selectedUrl === void 0 && draftTheme === themeId;
							return (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: DesktopCustomization_module_css_default.themeCard,
								"aria-pressed": selected,
								disabled: busy,
								onClick: () => {
									selectBuiltinTheme(themeId);
								},
								children: [(0, react_jsx_runtime.jsxs)("span", {
									className: `${DesktopCustomization_module_css_default.themeThumbnail}${theme.imageUrl === null ? ` ${DesktopCustomization_module_css_default.originalThemeThumbnail}` : ""}`,
									style: { backgroundImage: theme.imageUrl === null ? "none" : `url("${theme.imageUrl}")` },
									children: [theme.imageUrl === null && (0, react_jsx_runtime.jsx)("span", {
										className: DesktopCustomization_module_css_default.originalThemeLabel,
										children: "原版界面"
									}), selected && (0, react_jsx_runtime.jsx)("span", {
										className: DesktopCustomization_module_css_default.themeSelected,
										children: "当前选择"
									})]
								}), (0, react_jsx_runtime.jsxs)("span", {
									className: DesktopCustomization_module_css_default.themeDetails,
									children: [(0, react_jsx_runtime.jsxs)("strong", { children: [THEME_COPY[themeId].name, themeId === "whale-maid" ? " · 默认" : ""] }), (0, react_jsx_runtime.jsx)("small", { children: THEME_COPY[themeId].description })]
								})]
							}, themeId);
						})
					})] }),
					(0, react_jsx_runtime.jsxs)("div", {
						className: DesktopCustomization_module_css_default.preview,
						style: previewStyle,
						role: "img",
						"aria-label": "当前背景预览",
						children: [(0, react_jsx_runtime.jsxs)("div", {
							className: DesktopCustomization_module_css_default.previewChrome,
							children: [(0, react_jsx_runtime.jsx)("span", {}), (0, react_jsx_runtime.jsx)("strong", { children: "DeepSeek Harness" })]
						}), (0, react_jsx_runtime.jsxs)("div", {
							className: DesktopCustomization_module_css_default.previewGlass,
							children: [(0, react_jsx_runtime.jsx)("span", { children: "背景预览" }), (0, react_jsx_runtime.jsx)("small", { children: "1920 × 1080 WebP" })]
						})]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: DesktopCustomization_module_css_default.fileRow,
						children: [(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("strong", { children: fileLabel }), (0, react_jsx_runtime.jsx)("small", { children: "支持 PNG、JPG、WebP，原图不超过 16 MB" })] }), (0, react_jsx_runtime.jsxs)("label", {
							className: DesktopCustomization_module_css_default.secondaryButton,
							children: ["选择图片", (0, react_jsx_runtime.jsx)("input", {
								type: "file",
								accept: "image/png,image/jpeg,image/webp",
								onChange: selectFile
							})]
						})]
					}),
					(0, react_jsx_runtime.jsxs)("label", {
						className: DesktopCustomization_module_css_default.rangeRow,
						children: [(0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsx)("b", { children: "主体焦点" }), (0, react_jsx_runtime.jsxs)("output", { children: [focusY, "%"] })] }), (0, react_jsx_runtime.jsx)("input", {
							type: "range",
							min: "0",
							max: "100",
							value: focusY,
							disabled: busy || originalSelected,
							onChange: (event) => {
								setFocusY(Number(event.target.value));
							}
						})]
					}),
					(0, react_jsx_runtime.jsxs)("label", {
						className: DesktopCustomization_module_css_default.rangeRow,
						children: [(0, react_jsx_runtime.jsxs)("span", { children: [(0, react_jsx_runtime.jsx)("b", { children: "界面玻璃层" }), (0, react_jsx_runtime.jsxs)("output", { children: [glassStrength, "%"] })] }), (0, react_jsx_runtime.jsx)("input", {
							type: "range",
							min: "35",
							max: "92",
							value: glassStrength,
							disabled: busy || originalSelected,
							onChange: (event) => {
								setGlassStrength(Number(event.target.value));
							}
						})]
					}),
					(localMessage ?? snapshot.message) !== void 0 && (0, react_jsx_runtime.jsx)("p", {
						className: snapshot.status === "error" ? DesktopCustomization_module_css_default.error : DesktopCustomization_module_css_default.notice,
						children: localMessage ?? snapshot.message
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: DesktopCustomization_module_css_default.actions,
						children: [(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: DesktopCustomization_module_css_default.primaryButton,
							disabled: busy,
							onClick: () => {
								save();
							},
							children: busy ? "保存中…" : "保存并应用"
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: DesktopCustomization_module_css_default.secondaryButton,
							disabled: busy,
							onClick: () => {
								reset();
							},
							children: "恢复默认"
						})]
					})
				]
			});
		}
		function appearanceLabel(settings) {
			if (settings.builtinTheme !== null) return `内置皮肤 · ${THEME_COPY[settings.builtinTheme].name}`;
			return "当前使用自定义背景";
		}
		//#endregion
		//#region lib/types/client/BrandBadge.js
		/** Render the clickable team badge. */
		//#endregion
		//#region lib/types/client/bridge.js
		/** Structural renderer view of the fixed Electron preload bridge. */
		/**
		* Read the bridge once; absent means this client package was mounted outside Electron.
		* @returns The fixed Desktop bridge, or undefined in an ordinary browser host.
		*/
		function desktopBridge() {
			return window.dshDesktop;
		}
		//#endregion
		//#region lib/types/client/locales.js
		/** Copy for Desktop appearance, updates, and brand surfaces. */
		const en = {
			appearanceNav: "Background",
			updatesNav: "Software update"
		};
		/** Simplified Chinese navigation labels. */
		const zh = {
			appearanceNav: "背景",
			updatesNav: "软件更新"
		};
		//#endregion
		//#region lib/types/client/UpdateSection.js
		/** Visible update center backed by the Electron main-process updater. */
		/** Render version, update status, progress, and the next valid action. */
		function UpdateSection({ bridge }) {
			const [state, setState] = (0, react.useState)(void 0);
			(0, react.useEffect)(() => {
				if (bridge === void 0) return;
				let active = true;
				bridge.updates.getState().then((next) => {
					if (active) setState(next);
				});
				const dispose = bridge.updates.onState((next) => {
					setState(next);
				});
				return () => {
					active = false;
					dispose();
				};
			}, [bridge]);
			const act = async (action) => {
				if (bridge === void 0) return;
				if (action === "install") {
					await bridge.updates.install();
					return;
				}
				setState(action === "check" ? await bridge.updates.check() : await bridge.updates.download());
			};
			return (0, react_jsx_runtime.jsxs)("section", {
				className: DesktopCustomization_module_css_default.section,
				children: [
					(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("h2", {
						className: DesktopCustomization_module_css_default.title,
						children: "软件更新"
					}), (0, react_jsx_runtime.jsx)("p", {
						className: DesktopCustomization_module_css_default.intro,
						children: "正式发布后，应用会检查新版本，并在你确认后下载和重启安装。"
					})] }),
					(0, react_jsx_runtime.jsxs)("div", {
						className: DesktopCustomization_module_css_default.updateCard,
						children: [
							(0, react_jsx_runtime.jsx)("div", {
								className: DesktopCustomization_module_css_default.updateIcon,
								children: "DSH"
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: DesktopCustomization_module_css_default.updateIdentity,
								children: [(0, react_jsx_runtime.jsx)("strong", { children: "DeepSeek Harness Desktop" }), (0, react_jsx_runtime.jsxs)("span", { children: ["当前版本 ", state?.currentVersion ?? "读取中…"] })]
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: DesktopCustomization_module_css_default.statusPill,
								children: statusLabel(state)
							})
						]
					}),
					state?.phase === "downloading" && (0, react_jsx_runtime.jsx)("div", {
						className: DesktopCustomization_module_css_default.progress,
						"aria-label": `下载进度 ${Math.round(state.progress ?? 0)}%`,
						children: (0, react_jsx_runtime.jsx)("span", { style: { width: `${String(state.progress ?? 0)}%` } })
					}),
					state?.availableVersion !== void 0 && (0, react_jsx_runtime.jsxs)("p", {
						className: DesktopCustomization_module_css_default.notice,
						children: ["发现新版本 ", state.availableVersion]
					}),
					state?.message !== void 0 && (0, react_jsx_runtime.jsx)("p", {
						className: state.phase === "error" ? DesktopCustomization_module_css_default.error : DesktopCustomization_module_css_default.notice,
						children: state.message
					}),
					state?.phase === "development" && (0, react_jsx_runtime.jsxs)("div", {
						className: DesktopCustomization_module_css_default.developmentNote,
						children: [(0, react_jsx_runtime.jsx)("strong", { children: "更新引擎已经接入" }), (0, react_jsx_runtime.jsx)("span", { children: "当前运行的是源码开发版。等三端安装包阶段生成签名产物和版本元数据后，这里会直接进入真实更新流程。" })]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: DesktopCustomization_module_css_default.actions,
						children: [
							(state?.phase === "idle" || state?.phase === "up-to-date" || state?.phase === "error") && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: DesktopCustomization_module_css_default.primaryButton,
								onClick: () => {
									act("check");
								},
								children: "检查更新"
							}),
							state?.phase === "available" && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: DesktopCustomization_module_css_default.primaryButton,
								onClick: () => {
									act("download");
								},
								children: "下载新版本"
							}),
							state?.phase === "ready" && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: DesktopCustomization_module_css_default.primaryButton,
								onClick: () => {
									act("install");
								},
								children: "重启并安装"
							}),
							(state?.phase === "checking" || state?.phase === "downloading") && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: DesktopCustomization_module_css_default.primaryButton,
								disabled: true,
								children: state.phase === "checking" ? "检查中…" : "下载中…"
							}),
							state?.phase === "development" && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: DesktopCustomization_module_css_default.primaryButton,
								disabled: true,
								children: "正式安装包后启用"
							})
						]
					})
				]
			});
		}
		function statusLabel(state) {
			switch (state?.phase) {
				case "development": return "开发版";
				case "idle": return "可检查";
				case "checking": return "检查中";
				case "available": return "有新版本";
				case "downloading": return `${Math.round(state.progress ?? 0)}%`;
				case "ready": return "等待重启";
				case "up-to-date": return "已是最新";
				case "error": return "更新失败";
				default: return "读取中";
			}
		}
		//#endregion
		//#region \0dsh-css:./packages/client/ui-desktop-customization/src/client/VisionEnhancementRow.module.css.mjs
		const css = ".Bv48Aa_row{border-bottom:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary);justify-content:space-between;align-items:center;gap:20px;padding:18px 0;display:flex}.Bv48Aa_rowText{min-width:0}.Bv48Aa_titleLine{align-items:center;gap:8px;display:flex}.Bv48Aa_spark{color:#fff;background:linear-gradient(135deg,#735cff,#2a9aff);border-radius:9px;justify-content:center;align-items:center;width:28px;height:28px;font-size:13px;font-weight:700;display:inline-flex;box-shadow:0 6px 18px #4e60ff47}.Bv48Aa_title{font-size:14px;font-weight:600;line-height:22px}.Bv48Aa_model{color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent);border-radius:999px;padding:2px 7px;font-size:10px;font-weight:600}.Bv48Aa_desc{color:var(--dsw-alias-label-secondary);margin-top:5px;font-size:12px;line-height:18px}.Bv48Aa_control{flex:none;align-items:center;gap:10px;display:flex}.Bv48Aa_status,.Bv48Aa_statusOn{color:var(--dsw-alias-label-secondary);font-size:12px}.Bv48Aa_statusOn{color:var(--dsw-alias-state-success-primary)}.Bv48Aa_toggle,.Bv48Aa_toggleOn{cursor:pointer;background:var(--dsw-alias-border-l2);border:0;border-radius:12px;width:42px;height:24px;padding:0;transition:background .18s;position:relative}.Bv48Aa_toggleOn{background:var(--dsw-alias-brand-primary)}.Bv48Aa_toggle span,.Bv48Aa_toggleOn span{background:#fff;border-radius:50%;width:18px;height:18px;transition:transform .18s;position:absolute;top:3px;left:3px;box-shadow:0 1px 5px #00000038}.Bv48Aa_toggleOn span{transform:translate(18px)}.Bv48Aa_toggle:disabled,.Bv48Aa_toggleOn:disabled{cursor:default;opacity:.55}.Bv48Aa_shortcut,.Bv48Aa_shortcutOn{height:28px;color:var(--dsw-alias-label-secondary);font:inherit;white-space:nowrap;cursor:pointer;background:0 0;border:0;border-radius:999px;align-items:center;gap:5px;padding:0 8px;font-size:13px;font-weight:500;line-height:20px;transition:color .1s,background-color .1s;display:inline-flex}.Bv48Aa_shortcut:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.Bv48Aa_shortcutOn{color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-state-business-tertiary)}.Bv48Aa_shortcutOn:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 14%,transparent)}.Bv48Aa_shortcut:focus-visible,.Bv48Aa_shortcutOn:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.Bv48Aa_shortcut:disabled,.Bv48Aa_shortcutOn:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}.Bv48Aa_shortcutLabel{text-overflow:ellipsis;overflow:hidden}.Bv48Aa_shortcutDot{background:currentColor;border-radius:50%;flex:none;width:5px;height:5px}.Bv48Aa_shortcutHover{color:var(--dsw-static-neutral-bluish-00);flex-direction:column;gap:8px;display:flex}.Bv48Aa_shortcutHoverTitle{justify-content:space-between;align-items:center;gap:10px;font-size:14px;font-weight:600;line-height:20px;display:flex}.Bv48Aa_shortcutHoverStatus,.Bv48Aa_shortcutHoverOn{color:var(--dsw-static-neutral-bluish-300);background:color-mix(in srgb,var(--dsw-static-neutral-bluish-00) 10%,transparent);border-radius:999px;flex:none;padding:1px 6px;font-size:11px;font-weight:500;line-height:16px}.Bv48Aa_shortcutHoverOn{color:var(--dsw-static-deepseek-300);background:color-mix(in srgb,var(--dsw-static-deepseek-400) 18%,transparent)}.Bv48Aa_shortcutHover p{color:var(--dsw-static-neutral-bluish-300);margin:0;font-size:12px;line-height:18px}.Bv48Aa_shortcutHoverHint{border-top:1px solid color-mix(in srgb,var(--dsw-static-neutral-bluish-00) 12%,transparent);color:var(--dsw-static-neutral-bluish-400);padding-top:7px;font-size:11px;line-height:16px}.Bv48Aa_modal{width:min(680px,100vw - 32px)}.Bv48Aa_modalBody{color:var(--dsw-alias-label-primary);flex-direction:column;gap:16px;display:flex}.Bv48Aa_hero{border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 24%,var(--dsw-alias-border-l1));background:linear-gradient(135deg,color-mix(in srgb,var(--dsw-alias-brand-primary) 9%,var(--dsw-alias-bg-layer-1)),var(--dsw-alias-bg-layer-1));border-radius:14px;align-items:center;gap:13px;padding:14px;display:flex}.Bv48Aa_heroIcon{color:#fff;background:linear-gradient(135deg,#735cff,#249cf3);border-radius:13px;flex:none;justify-content:center;align-items:center;width:42px;height:42px;font-size:20px;font-weight:700;display:flex}.Bv48Aa_hero>div:last-child{flex-direction:column;gap:3px;display:flex}.Bv48Aa_hero strong{font-size:14px;line-height:22px}.Bv48Aa_hero span{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.Bv48Aa_fieldGrid{grid-template-columns:1fr 1.5fr;gap:12px;display:grid}.Bv48Aa_field{flex-direction:column;gap:7px;font-size:13px;font-weight:550;display:flex}.Bv48Aa_field input,.Bv48Aa_field select{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;height:42px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);font:inherit;border-radius:10px;outline:none;padding:0 13px}.Bv48Aa_field input:focus,.Bv48Aa_field select:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent)}.Bv48Aa_field input:read-only{color:var(--dsw-alias-label-secondary)}.Bv48Aa_help{color:var(--dsw-alias-label-secondary);margin:-9px 0 0;font-size:12px}.Bv48Aa_help a{color:var(--dsw-alias-brand-primary);text-decoration:none}.Bv48Aa_testCard{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:14px;min-height:150px;display:flex;overflow:hidden}.Bv48Aa_imageWrap{width:220px;min-height:150px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);flex:none;justify-content:center;align-items:center;font-size:12px;display:flex;overflow:hidden}.Bv48Aa_imageWrap img{object-fit:cover;width:100%;height:100%}.Bv48Aa_testInfo{flex-direction:column;flex:1;justify-content:center;align-items:flex-start;gap:7px;min-width:0;padding:18px;display:flex}.Bv48Aa_testInfo strong{font-size:14px}.Bv48Aa_testInfo span{max-width:100%;color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;font-size:12px;overflow:hidden}.Bv48Aa_upload{border:1px solid var(--dsw-alias-border-l2);cursor:pointer;border-radius:15px;align-items:center;height:30px;padding:0 12px;font-size:12px;display:inline-flex}.Bv48Aa_upload input{display:none}.Bv48Aa_success,.Bv48Aa_error{border-radius:11px;padding:12px 14px;font-size:12px;line-height:19px}.Bv48Aa_success{--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);color:var(--dsw-alias-label-primary);background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 10%,var(--dsw-alias-bg-layer-1))}.Bv48Aa_success strong{color:var(--dsw-alias-state-success-primary);font-size:13px;display:block}.Bv48Aa_success p{white-space:pre-wrap;max-height:112px;margin:5px 0 0;overflow:auto}.Bv48Aa_error{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,var(--dsw-alias-bg-layer-1))}.Bv48Aa_privacy{color:var(--dsw-alias-label-secondary);margin:0;font-size:11px;line-height:17px}.Bv48Aa_actions{justify-content:flex-end;gap:10px;display:flex}.Bv48Aa_primary,.Bv48Aa_secondary{height:38px;font:inherit;cursor:pointer;border-radius:19px;padding:0 17px;font-size:13px}.Bv48Aa_primary{color:var(--dsw-alias-label-primary-foreground);background:var(--dsw-alias-button-primary-fill);border:0}.Bv48Aa_secondary{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1)}.Bv48Aa_primary:disabled,.Bv48Aa_secondary:disabled{cursor:default;opacity:.55}@media (width<=620px){.Bv48Aa_fieldGrid{grid-template-columns:1fr}.Bv48Aa_testCard{flex-direction:column}.Bv48Aa_imageWrap{width:100%;height:180px}.Bv48Aa_row{align-items:flex-start}.Bv48Aa_shortcutLabel{display:none}.Bv48Aa_shortcut,.Bv48Aa_shortcutOn{justify-content:center;width:28px;padding:0}.Bv48Aa_shortcutDot{display:none}}";
		const tagId = "@deepseek-ai/dsh-client-ui-desktop-customization/VisionEnhancementRow.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-desktop-customization";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var VisionEnhancementRow_module_css_default = {
			"titleLine": "Bv48Aa_titleLine",
			"desc": "Bv48Aa_desc",
			"shortcutHoverStatus": "Bv48Aa_shortcutHoverStatus",
			"shortcutHover": "Bv48Aa_shortcutHover",
			"shortcutHoverTitle": "Bv48Aa_shortcutHoverTitle",
			"heroIcon": "Bv48Aa_heroIcon",
			"spark": "Bv48Aa_spark",
			"shortcutLabel": "Bv48Aa_shortcutLabel",
			"shortcutHoverOn": "Bv48Aa_shortcutHoverOn",
			"upload": "Bv48Aa_upload",
			"title": "Bv48Aa_title",
			"help": "Bv48Aa_help",
			"privacy": "Bv48Aa_privacy",
			"shortcutDot": "Bv48Aa_shortcutDot",
			"statusOn": "Bv48Aa_statusOn",
			"rowText": "Bv48Aa_rowText",
			"imageWrap": "Bv48Aa_imageWrap",
			"testInfo": "Bv48Aa_testInfo",
			"row": "Bv48Aa_row",
			"primary": "Bv48Aa_primary",
			"shortcutHoverHint": "Bv48Aa_shortcutHoverHint",
			"shortcutOn": "Bv48Aa_shortcutOn",
			"modalBody": "Bv48Aa_modalBody",
			"field": "Bv48Aa_field",
			"error": "Bv48Aa_error",
			"control": "Bv48Aa_control",
			"testCard": "Bv48Aa_testCard",
			"modal": "Bv48Aa_modal",
			"success": "Bv48Aa_success",
			"actions": "Bv48Aa_actions",
			"toggleOn": "Bv48Aa_toggleOn",
			"status": "Bv48Aa_status",
			"shortcut": "Bv48Aa_shortcut",
			"fieldGrid": "Bv48Aa_fieldGrid",
			"hero": "Bv48Aa_hero",
			"secondary": "Bv48Aa_secondary",
			"toggle": "Bv48Aa_toggle",
			"model": "Bv48Aa_model"
		};
		//#endregion
		//#region lib/types/client/VisionEnhancementDialog.js
		/** Guided visual-provider configuration shared by the Settings row and composer shortcut. */
		const DEFAULT_IMAGE = "/dsh-desktop/default-background.webp";
		const ACCEPTED = new Set([
			"image/png",
			"image/jpeg",
			"image/webp",
			"image/gif"
		]);
		function messageOf$1(error) {
			return error instanceof Error ? error.message : String(error);
		}
		async function imageFromBlob(blob, name) {
			if (!ACCEPTED.has(blob.type)) throw new Error("仅支持 PNG、JPEG、WebP 或 GIF 图片。");
			if (blob.size > 10 * 1024 * 1024) throw new Error("图片不能超过 10 MB。");
			const dataUrl = await new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => {
					if (typeof reader.result !== "string") {
						reject(/* @__PURE__ */ new Error("图片编码失败。"));
						return;
					}
					resolve(reader.result);
				};
				reader.onerror = () => {
					reject(/* @__PURE__ */ new Error("读取图片失败。"));
				};
				reader.readAsDataURL(blob);
			});
			const comma = dataUrl.indexOf(",");
			if (comma < 0) throw new Error("图片编码失败。");
			return {
				url: dataUrl,
				data: dataUrl.slice(comma + 1),
				mediaType: blob.type,
				name
			};
		}
		async function defaultImage() {
			const response = await fetch(DEFAULT_IMAGE);
			if (!response.ok) throw new Error("默认小猫图片加载失败。");
			return imageFromBlob(await response.blob(), "默认小猫封面.webp");
		}
		/** Verify a real image before enabling the shared visual capability. */
		function VisionEnhancementDialog({ open, provider: activeProvider, providers, model: activeModel, failure: outerFailure, onClose, enable }) {
			const [apiKey, setApiKey] = (0, react.useState)("");
			const [provider, setProvider] = (0, react.useState)(activeProvider);
			const [model, setModel] = (0, react.useState)(activeModel);
			const [busy, setBusy] = (0, react.useState)(false);
			const [failure, setFailure] = (0, react.useState)();
			const [result, setResult] = (0, react.useState)();
			const [image, setImage] = (0, react.useState)();
			const selectedProvider = providers.find((candidate) => candidate.id === provider) ?? providers[0];
			(0, react.useEffect)(() => {
				if (open) return;
				setProvider(activeProvider);
				setModel(activeModel);
				setApiKey("");
				setFailure(void 0);
				setResult(void 0);
			}, [
				activeModel,
				activeProvider,
				open
			]);
			(0, react.useEffect)(() => {
				if (!open || image !== void 0) return;
				let active = true;
				defaultImage().then((next) => {
					if (active) setImage(next);
				}, (error) => {
					if (active) setFailure(messageOf$1(error));
				});
				return () => {
					active = false;
				};
			}, [image, open]);
			const verify = async () => {
				if (image === void 0) {
					setFailure("验证图片还没有准备好。");
					return;
				}
				if (selectedProvider === void 0) {
					setFailure("没有可用的视觉提供方。");
					return;
				}
				if (model.trim() === "") {
					setFailure("请输入视觉模型。");
					return;
				}
				if (!selectedProvider.configured && apiKey.trim() === "") {
					setFailure(`请输入 ${selectedProvider.name} API Key。`);
					return;
				}
				setBusy(true);
				setFailure(void 0);
				setResult(void 0);
				try {
					const description = await enable({
						...apiKey.trim() === "" ? {} : { apiKey: apiKey.trim() },
						provider,
						model: model.trim(),
						mediaType: image.mediaType,
						data: image.data,
						name: image.name,
						question: "请识别这张图片的主体、场景和清晰可见的文字，用中文简洁回答。"
					}, AbortSignal.timeout(7e4));
					setApiKey("");
					setResult(description);
				} catch (error) {
					setFailure(messageOf$1(error));
				} finally {
					setBusy(false);
				}
			};
			const pickImage = (event) => {
				const file = event.target.files?.[0];
				if (file === void 0) return;
				setFailure(void 0);
				setResult(void 0);
				imageFromBlob(file, file.name).then(setImage, (error) => {
					setFailure(messageOf$1(error));
				});
				event.target.value = "";
			};
			const pickProvider = (event) => {
				const next = event.target.value;
				const nextProvider = providers.find((candidate) => candidate.id === next);
				if (nextProvider === void 0) return;
				setProvider(next);
				setModel(next === activeProvider ? activeModel : nextProvider.defaultModel);
				setApiKey("");
				setFailure(void 0);
				setResult(void 0);
			};
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open,
				title: "开启视觉能力增强",
				onClose: () => {
					if (!busy) onClose();
				},
				className: VisionEnhancementRow_module_css_default["modal"],
				children: (0, react_jsx_runtime.jsxs)("div", {
					className: VisionEnhancementRow_module_css_default.modalBody,
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							className: VisionEnhancementRow_module_css_default.hero,
							children: [(0, react_jsx_runtime.jsx)("div", {
								className: VisionEnhancementRow_module_css_default.heroIcon,
								children: provider === "openrouter" ? "O" : "G"
							}), (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsxs)("strong", { children: [
								selectedProvider?.name ?? "视觉提供方",
								" · ",
								model
							] }), (0, react_jsx_runtime.jsx)("span", { children: "验证通过后，能力会自动挂载到四个内置 Agent，以及未来新增的 Agent Preset。" })] })]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: VisionEnhancementRow_module_css_default.fieldGrid,
							children: [(0, react_jsx_runtime.jsxs)("label", {
								className: VisionEnhancementRow_module_css_default.field,
								children: [(0, react_jsx_runtime.jsx)("span", { children: "视觉提供方" }), (0, react_jsx_runtime.jsx)("select", {
									value: provider,
									onChange: pickProvider,
									disabled: busy,
									children: providers.map((candidate) => (0, react_jsx_runtime.jsx)("option", {
										value: candidate.id,
										children: candidate.name
									}, candidate.id))
								})]
							}), (0, react_jsx_runtime.jsxs)("label", {
								className: VisionEnhancementRow_module_css_default.field,
								children: [(0, react_jsx_runtime.jsx)("span", { children: "视觉模型" }), (0, react_jsx_runtime.jsx)("input", {
									value: model,
									readOnly: selectedProvider?.modelEditable !== true,
									onChange: (event) => {
										setModel(event.target.value);
									},
									disabled: busy
								})]
							})]
						}),
						(0, react_jsx_runtime.jsxs)("label", {
							className: VisionEnhancementRow_module_css_default.field,
							children: [(0, react_jsx_runtime.jsxs)("span", { children: [selectedProvider?.name ?? "视觉提供方", " API Key"] }), (0, react_jsx_runtime.jsx)("input", {
								type: "password",
								autoComplete: "off",
								value: apiKey,
								placeholder: selectedProvider?.configured === true ? "已保存，可留空直接重新验证" : "请输入 API Key",
								onChange: (event) => {
									setApiKey(event.target.value);
								},
								disabled: busy
							})]
						}),
						selectedProvider !== void 0 && (0, react_jsx_runtime.jsxs)("p", {
							className: VisionEnhancementRow_module_css_default.help,
							children: ["还没有 Key？", (0, react_jsx_runtime.jsxs)("a", {
								href: selectedProvider.apiKeyUrl,
								target: "_blank",
								rel: "noreferrer",
								children: [
									"前往 ",
									selectedProvider.name,
									" 获取 API Key"
								]
							})]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: VisionEnhancementRow_module_css_default.testCard,
							children: [(0, react_jsx_runtime.jsx)("div", {
								className: VisionEnhancementRow_module_css_default.imageWrap,
								children: image === void 0 ? (0, react_jsx_runtime.jsx)("span", { children: "正在准备默认小猫图片…" }) : (0, react_jsx_runtime.jsx)("img", {
									src: image.url,
									alt: "视觉验证图片"
								})
							}), (0, react_jsx_runtime.jsxs)("div", {
								className: VisionEnhancementRow_module_css_default.testInfo,
								children: [
									(0, react_jsx_runtime.jsx)("strong", { children: "用一张图片做真实验证" }),
									(0, react_jsx_runtime.jsx)("span", { children: image?.name ?? "默认小猫封面" }),
									(0, react_jsx_runtime.jsxs)("label", {
										className: VisionEnhancementRow_module_css_default.upload,
										children: ["更换验证图片", (0, react_jsx_runtime.jsx)("input", {
											type: "file",
											accept: "image/png,image/jpeg,image/webp,image/gif",
											onChange: pickImage,
											disabled: busy
										})]
									})
								]
							})]
						}),
						result !== void 0 && (0, react_jsx_runtime.jsxs)("div", {
							className: VisionEnhancementRow_module_css_default.success,
							children: [(0, react_jsx_runtime.jsx)("strong", { children: "识别成功，视觉能力已开启" }), (0, react_jsx_runtime.jsx)("p", { children: result })]
						}),
						(failure ?? outerFailure) !== void 0 && (0, react_jsx_runtime.jsx)("div", {
							className: VisionEnhancementRow_module_css_default.error,
							role: "alert",
							children: failure ?? outerFailure
						}),
						(0, react_jsx_runtime.jsxs)("p", {
							className: VisionEnhancementRow_module_css_default.privacy,
							children: [
								"验证图片会发送至 ",
								selectedProvider?.name ?? "所选视觉提供方",
								" 进行识别；API Key 仅保存在本机受保护的凭证文件中，不会写入对话或项目代码。"
							]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: VisionEnhancementRow_module_css_default.actions,
							children: [(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: VisionEnhancementRow_module_css_default.secondary,
								disabled: busy,
								onClick: onClose,
								children: result === void 0 ? "取消" : "完成"
							}), result === void 0 && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: VisionEnhancementRow_module_css_default.primary,
								disabled: busy || image === void 0 || selectedProvider === void 0,
								onClick: () => {
									verify();
								},
								children: busy ? `正在调用 ${selectedProvider?.name ?? "视觉服务"} 验证…` : "验证并开启"
							})]
						})
					]
				})
			});
		}
		//#endregion
		//#region lib/types/client/VisionEnhancementRow.js
		/** General-settings row for the shared Desktop visual capability. */
		/** Render the full Settings entry while sharing status with the composer shortcut. */
		function VisionEnhancementRow({ useVisionEnhancement, load, disable, enable }) {
			const state = useVisionEnhancement((snapshot) => snapshot);
			const [open, setOpen] = (0, react.useState)(false);
			const [failure, setFailure] = (0, react.useState)();
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			const status = (0, react.useMemo)(() => {
				if (state.status === "idle" || state.status === "loading") return "读取中";
				if (state.status === "saving") return "处理中";
				if (state.enabled) return "已开启";
				return "未开启";
			}, [state.enabled, state.status]);
			const busy = state.status === "idle" || state.status === "loading" || state.status === "saving";
			const providerName = state.providers.find((provider) => provider.id === state.provider)?.name ?? state.provider;
			const activate = () => {
				setFailure(void 0);
				if (!state.enabled) {
					setOpen(true);
					return;
				}
				disable().catch((error) => {
					setFailure(error instanceof Error ? error.message : String(error));
					setOpen(true);
				});
			};
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("div", {
				className: VisionEnhancementRow_module_css_default.row,
				"data-testid": "vision-enhancement-row",
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: VisionEnhancementRow_module_css_default.rowText,
					children: [(0, react_jsx_runtime.jsxs)("div", {
						className: VisionEnhancementRow_module_css_default.titleLine,
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: VisionEnhancementRow_module_css_default.spark,
								children: "视"
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: VisionEnhancementRow_module_css_default.title,
								children: "视觉能力增强"
							}),
							(0, react_jsx_runtime.jsxs)("span", {
								className: VisionEnhancementRow_module_css_default.model,
								children: [
									providerName,
									" · ",
									state.model
								]
							})
						]
					}), (0, react_jsx_runtime.jsx)("div", {
						className: VisionEnhancementRow_module_css_default.desc,
						role: state.error === null ? void 0 : "alert",
						children: state.error ?? "让所有 Agent 都能理解截图、照片、图表和图片文字。"
					})]
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: VisionEnhancementRow_module_css_default.control,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: state.enabled ? VisionEnhancementRow_module_css_default.statusOn : VisionEnhancementRow_module_css_default.status,
						children: status
					}), (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: state.enabled ? VisionEnhancementRow_module_css_default.toggleOn : VisionEnhancementRow_module_css_default.toggle,
						role: "switch",
						"aria-checked": state.enabled,
						"aria-label": "视觉能力增强",
						disabled: busy,
						onClick: activate,
						children: (0, react_jsx_runtime.jsx)("span", {})
					})]
				})]
			}), (0, react_jsx_runtime.jsx)(VisionEnhancementDialog, {
				open,
				provider: state.provider,
				providers: state.providers,
				model: state.model,
				failure,
				enable,
				onClose: () => {
					setOpen(false);
				}
			})] });
		}
		//#endregion
		//#region lib/types/client/VisionEnhancementShortcut.js
		/** Composer shortcut for the existing Desktop visual-enhancement capability. */
		function statusText(state) {
			if (state.status === "loading" || state.status === "idle") return "正在读取状态";
			if (state.status === "saving") return state.enabled ? "正在关闭" : "正在开启";
			if (state.status === "error") return "状态异常，点击重新配置";
			if (state.enabled) return "已开启，点击关闭";
			return state.configured ? "已关闭，点击验证并开启" : "待配置，点击验证并开启";
		}
		function hoverContent(state) {
			const providerName = state.providers.find((provider) => provider.id === state.provider)?.name ?? state.provider;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: VisionEnhancementRow_module_css_default.shortcutHover,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: VisionEnhancementRow_module_css_default.shortcutHoverTitle,
						children: [(0, react_jsx_runtime.jsx)("span", { children: "视觉增强" }), (0, react_jsx_runtime.jsx)("span", {
							className: state.enabled ? VisionEnhancementRow_module_css_default.shortcutHoverOn : VisionEnhancementRow_module_css_default.shortcutHoverStatus,
							children: state.enabled ? "已开启" : state.configured ? "已关闭" : "待配置"
						})]
					}),
					(0, react_jsx_runtime.jsxs)("p", { children: [
						"使用 ",
						providerName,
						" · ",
						state.model,
						" 读取对话或工作区中的截图、照片、图表和图片文字，并把识别结果提供给 Agent。"
					] }),
					(0, react_jsx_runtime.jsx)("div", {
						className: VisionEnhancementRow_module_css_default.shortcutHoverHint,
						children: state.error ?? statusText(state)
					})
				]
			});
		}
		/** Render an always-visible, shared-state visual-enhancement switch in the composer. */
		function VisionEnhancementShortcut({ useVisionEnhancement, load, disable, enable }) {
			const state = useVisionEnhancement((snapshot) => snapshot);
			const [dialogOpen, setDialogOpen] = (0, react.useState)(false);
			const [failure, setFailure] = (0, react.useState)();
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			const busy = state.status === "idle" || state.status === "loading" || state.status === "saving";
			const activate = () => {
				setFailure(void 0);
				if (!state.enabled) {
					setDialogOpen(true);
					return;
				}
				disable().catch((error) => {
					setFailure(error instanceof Error ? error.message : String(error));
					setDialogOpen(true);
				});
			};
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.HoverCard, {
				openDelayMs: 350,
				anchor: (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: state.enabled ? VisionEnhancementRow_module_css_default.shortcutOn : VisionEnhancementRow_module_css_default.shortcut,
					role: "switch",
					"aria-checked": state.enabled,
					"aria-label": `视觉增强：${statusText(state)}`,
					disabled: busy,
					onClick: activate,
					children: [
						(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSparkle16, { size: 14 }),
						(0, react_jsx_runtime.jsx)("span", {
							className: VisionEnhancementRow_module_css_default.shortcutLabel,
							children: "视觉增强"
						}),
						state.enabled && (0, react_jsx_runtime.jsx)("span", {
							className: VisionEnhancementRow_module_css_default.shortcutDot,
							"aria-hidden": true
						})
					]
				}),
				content: hoverContent(state)
			}), (0, react_jsx_runtime.jsx)(VisionEnhancementDialog, {
				open: dialogOpen,
				provider: state.provider,
				providers: state.providers,
				model: state.model,
				failure,
				enable,
				onClose: () => {
					setDialogOpen(false);
				}
			})] });
		}
		//#endregion
		//#region lib/types/client/vision-enhancement-controller.js
		/** Shared browser state for the Desktop visual-enhancement controls. */
		/** Host settings namespace used by visual enhancement. */
		const VISION_SETTINGS_NAMESPACE = "vision-enhancement";
		function messageOf(error) {
			return error instanceof Error ? error.message : String(error);
		}
		/** Controller joining status reads, enable verification, disable writes, and pushed refreshes. */
		var VisionEnhancementController = class {
			api;
			/** Status source shared by every visual-enhancement entry. */
			store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
				status: "idle",
				enabled: false,
				configured: false,
				provider: "xai",
				providers: [{
					id: "xai",
					name: "xAI",
					configured: false,
					defaultModel: "grok-4.6",
					apiKeyUrl: "https://console.x.ai/",
					modelEditable: false
				}, {
					id: "openrouter",
					name: "OpenRouter",
					configured: false,
					defaultModel: "openai/gpt-4.1-mini",
					apiKeyUrl: "https://openrouter.ai/settings/keys",
					modelEditable: true
				}],
				model: "grok-4.6",
				error: null
			});
			generation = 0;
			loading;
			refreshPending = false;
			/** @param api - Host visual-enhancement and Settings wire faces. */
			constructor(api) {
				this.api = api;
			}
			/** Load once for the first mounted surface and share the result. */
			ensureLoaded() {
				if (this.store.getSnapshot().status !== "idle") return this.loading ?? Promise.resolve();
				return this.load();
			}
			/** Refresh status after a pushed settings, credential, or connection change. */
			refreshIfLoaded() {
				const status = this.store.getSnapshot().status;
				if (status === "idle") return;
				if (status === "saving") {
					this.refreshPending = true;
					return;
				}
				this.load();
			}
			/** Read the authoritative Host status; the latest request wins. */
			load() {
				const generation = ++this.generation;
				this.store.update((state) => {
					state.status = "loading";
					state.error = null;
				});
				const pending = (async () => {
					try {
						if (this.api.vision === undefined) throw new Error("视觉能力增强尚未接入当前 Host。");
						const response = await this.api.vision.status({});
						if (!response.result.ok) throw new Error(response.result.error.message);
						if (generation !== this.generation) return;
						const value = response.result.value;
						this.store.update((state) => {
							state.status = "ready";
							state.enabled = value.enabled;
							state.configured = value.configured;
							state.provider = value.provider;
							state.providers = value.providers;
							state.model = value.model;
							state.error = null;
						});
					} catch (error) {
						if (generation !== this.generation) return;
						this.fail(error);
					}
				})();
				this.loading = pending;
				pending.then(() => {
					if (this.loading === pending) this.loading = void 0;
				});
				return pending;
			}
			/** Disable the shared capability through its existing Settings namespace. */
			async disable() {
				const generation = ++this.generation;
				this.store.update((state) => {
					state.status = "saving";
					state.error = null;
				});
				try {
					const response = await this.api.settings.update({
						ns: VISION_SETTINGS_NAMESPACE,
						patch: { enabled: false }
					});
					if (!response.result.ok) throw new Error(response.result.error.message);
					if (generation !== this.generation) return;
					this.store.update((state) => {
						state.status = "ready";
						state.enabled = false;
						state.error = null;
					});
				} catch (error) {
					if (generation === this.generation) this.fail(error);
					throw error;
				} finally {
					this.flushPendingRefresh();
				}
			}
			/**
			* Verify one real image and enable the capability atomically.
			* @param input - Credential and image probe submitted to the Host.
			* @param signal - Optional cancellation signal for the verification request.
			* @returns The verified visual description returned by the provider.
			*/
			async enable(input, signal) {
				const generation = ++this.generation;
				this.store.update((state) => {
					state.status = "saving";
					state.error = null;
				});
				try {
					const response = await this.api.vision.enable(input, signal);
					if (!response.result.ok) throw new Error(response.result.error.message);
					const value = response.result.value;
					if (generation === this.generation) this.store.update((state) => {
						state.status = "ready";
						state.enabled = true;
						state.configured = true;
						state.provider = value.provider;
						state.providers = state.providers.map((provider) => provider.id === value.provider ? {
							...provider,
							configured: true
						} : provider);
						state.model = value.model;
						state.error = null;
					});
					return value.description;
				} catch (error) {
					if (generation === this.generation) this.fail(error);
					throw error;
				} finally {
					this.flushPendingRefresh();
				}
			}
			/** Ignore every response that settles after the owning plugin is disposed. */
			dispose() {
				this.generation += 1;
				this.loading = void 0;
				this.refreshPending = false;
			}
			flushPendingRefresh() {
				if (!this.refreshPending) return;
				this.refreshPending = false;
				this.load();
			}
			fail(error) {
				this.store.update((state) => {
					state.status = "error";
					state.error = messageOf(error);
				});
			}
		};
		//#endregion
		//#region lib/types/client/index.js
		/** Desktop-only browser features registered through existing UI slots. */
		const NS = "desktop.customization";
		/** Services required by the Desktop customization client plugin. */
		const inject = [
			"slots",
			"locale",
			"theme",
			"connection",
			"remote"
		];
		/** Register appearance, updates, and visual enhancement. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "desktop-customization: dictionaries");
			const bridge = desktopBridge();
			const vision = new VisionEnhancementController(ctx.get("connection").api);
			const visionInjected = () => ({
				hooks: { visionEnhancement: vision.store },
				load: () => vision.ensureLoaded(),
				disable: () => vision.disable(),
				enable: (input, signal) => vision.enable(input, signal)
			});
			ctx.effect(() => {
				const disposers = [
					ctx.remote.$on("settings/document-updated", (ns) => {
						if (ns === "vision-enhancement") vision.refreshIfLoaded();
					}),
					ctx.remote.$on("credentials/updated", (ref) => {
						if (ref === "XAI_API_KEY" || ref === "DSH_VISION_XAI_API_KEY" || ref === "DSH_VISION_OPENROUTER_API_KEY" || ref === "OPENROUTER_API_KEY") vision.refreshIfLoaded();
					}),
					ctx.on("connection/reset", () => {
						vision.refreshIfLoaded();
					})
				];
				return () => {
					vision.dispose();
					for (const dispose of disposers) dispose();
				};
			}, "desktop-customization: vision status invalidations");
			const appearance = new AppearanceController(bridge, ctx.theme);
			ctx.effect(() => appearance.start(), "desktop-customization: appearance runtime");
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "desktop-background",
				order: 30,
				label: () => ctx.locale.bind(NS)("appearanceNav"),
				inject: () => ({ controller: appearance })
			}, AppearanceSection));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "desktop-updates",
				order: 40,
				label: () => ctx.locale.bind(NS)("updatesNav"),
				inject: () => ({ bridge })
			}, UpdateSection));
			ctx.slots.inject("settings.general.item", () => ctx.slots.register({
				name: "settings.general.item",
				id: "vision-enhancement",
				order: 35,
				inject: visionInjected
			}, VisionEnhancementRow));
			ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
				name: "conversation.input.left",
				id: "vision-enhancement",
				order: 20,
				inject: visionInjected
			}, VisionEnhancementShortcut));

		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map