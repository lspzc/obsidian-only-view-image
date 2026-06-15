/**
 * 图片查看器插件 - 设置管理
 *
 * 管理插件的所有配置项，包括：
 * - 快捷键（平台、修饰键、鼠标按键）
 * - 显示（初始缩放、缩放步长、工具栏显示）
 * - 背景遮罩效果（无/半透明/毛玻璃、亮/暗色）
 * - 交互（点击关闭、拖拽移动）
 */

import { App, Platform, PluginSettingTab, Setting } from 'obsidian';
import type ImageViewerPlugin from './main';
import type { ImageViewerSettings, ModifierKey, MouseButton, OverlayColorMode, OverlayEffect, PlatformType } from './types';

/** 根据平台自动检测默认值 */
const IS_MAC = Platform.isMacOS;

/** 平台对应的默认修饰键 */
const PLATFORM_DEFAULT_MODIFIER: Record<PlatformType, ModifierKey> = {
	win: 'Ctrl',
	mac: 'Meta',
};

/** 平台对应的修饰键选项（每个平台保留常用键 + "无"） */
const PLATFORM_MODIFIER_OPTIONS: Record<PlatformType, { key: ModifierKey; label: string }[]> = {
	win: [
		{ key: 'Ctrl', label: 'Ctrl' },
		{ key: 'Alt', label: 'Alt' },
		{ key: 'None', label: '无（直接点击）' },
	],
	mac: [
		{ key: 'Meta', label: 'Cmd' },
		{ key: 'Alt', label: 'Option' },
		{ key: 'None', label: '无（直接点击）' },
	],
};

/** 修饰键的显示名称映射 */
const MODIFIER_LABELS: Record<ModifierKey, Record<PlatformType, string>> = {
	Ctrl: { win: 'Ctrl', mac: 'Control' },
	Alt: { win: 'Alt', mac: 'Option' },
	Meta: { win: 'Win', mac: 'Cmd' },
	None: { win: '无', mac: '无' },
};

/** 鼠标按键选项映射 */
const BUTTON_OPTIONS: Record<MouseButton, string> = {
	left: '左键',
	middle: '中键',
	right: '右键',
};

/** 背景遮罩效果选项 */
const OVERLAY_EFFECT_OPTIONS: Record<OverlayEffect, string> = {
	none: '无遮罩',
	dim: '半透明遮罩',
	blur: '毛玻璃遮罩',
};

/** 遮罩颜色模式选项 */
const OVERLAY_COLOR_MODE_OPTIONS: Record<OverlayColorMode, string> = {
	dark: '暗色',
	light: '亮色',
};

/** 默认设置 */
export const DEFAULT_SETTINGS: ImageViewerSettings = {
	platform: IS_MAC ? 'mac' : 'win',
	shortcut: {
		modifiers: [PLATFORM_DEFAULT_MODIFIER[IS_MAC ? 'mac' : 'win']],
		button: 'left',
	},
	initialScaleEnabled: true,
	initialFitPercent: 80,
	zoomStep: 0.1,
	showToolbar: true,
	overlay: {
		effect: 'dim',
		colorMode: 'dark',
		opacity: 0.7,
		blurStrength: 16,
	},
	clickToClose: true,
	draggable: false,
};

/** 设置面板 */
export class ImageViewerSettingTab extends PluginSettingTab {
	plugin: ImageViewerPlugin;

	constructor(app: App, plugin: ImageViewerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const currentPlatform = this.plugin.settings.platform;

		new Setting(containerEl)
			.setName('图片查看器设置')
			.setHeading();

		// ===== 快捷键设置 =====
		new Setting(containerEl)
			.setName('快捷键')
			.setHeading();

		// 系统平台选择
		new Setting(containerEl)
			.setName('系统平台')
			.setDesc('选择你使用的操作系统，不同平台显示不同的修饰键选项')
			.addDropdown((dropdown) => {
				dropdown
					.addOption('win', 'Win')
					.addOption('mac', 'macOS')
					.setValue(currentPlatform)
					.onChange(async (value) => {
						const newPlatform = value as PlatformType;
						this.plugin.settings.platform = newPlatform;
						// 切换平台时重置修饰键为该平台的默认值
						this.plugin.settings.shortcut.modifiers = [PLATFORM_DEFAULT_MODIFIER[newPlatform]];
						await this.plugin.saveSettings();
						this.display();
					});
			});

		// 修饰键
		new Setting(containerEl)
			.setName('修饰键')
			.setDesc('选择触发图片查看模式的修饰键，选择"无"可直接点击图片打开')
			.addDropdown((dropdown) => {
				const options = PLATFORM_MODIFIER_OPTIONS[currentPlatform];
				const currentMod = this.plugin.settings.shortcut.modifiers[0] ?? PLATFORM_DEFAULT_MODIFIER[currentPlatform];

				// 添加当前值（如果不是标准选项之一）
				const isStandardOption = options.some((o) => o.key === currentMod);
				if (!isStandardOption) {
					const label = MODIFIER_LABELS[currentMod]?.[currentPlatform] ?? currentMod;
					dropdown.addOption(currentMod, label);
				}

				// 添加平台对应的修饰键选项
				for (const option of options) {
					dropdown.addOption(option.key, option.label);
				}

				dropdown
					.setValue(currentMod)
					.onChange(async (value) => {
						this.plugin.settings.shortcut.modifiers = [value as ModifierKey];
						await this.plugin.saveSettings();
					});
			});

		// 鼠标按键
		new Setting(containerEl)
			.setName('鼠标按键')
			.setDesc('选择触发图片查看模式的鼠标按键')
			.addDropdown((dropdown) => {
				for (const [key, label] of Object.entries(BUTTON_OPTIONS)) {
					dropdown.addOption(key, label);
				}
				dropdown
					.setValue(this.plugin.settings.shortcut.button)
					.onChange(async (value) => {
						this.plugin.settings.shortcut.button = value as MouseButton;
						await this.plugin.saveSettings();
					});
			});

		// ===== 显示设置 =====
		new Setting(containerEl)
			.setName('显示')
			.setHeading();

		// 是否启用初始缩放
		new Setting(containerEl)
			.setName('初始缩放')
			.setDesc('开启后，进入查看模式时图片自动缩放至窗口比例；关闭后以原始尺寸显示')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.initialScaleEnabled)
					.onChange(async (value) => {
						this.plugin.settings.initialScaleEnabled = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		// 初始显示比例（仅启用初始缩放时显示）
		if (this.plugin.settings.initialScaleEnabled) {
			new Setting(containerEl)
				.setName('初始显示比例')
				.setDesc('进入查看模式时图片占窗口的百分比（80 = 占窗口 80%）')
				.addSlider((slider) => {
					slider
						.setLimits(20, 100, 5)
						.setValue(this.plugin.settings.initialFitPercent)
						.setDynamicTooltip()
						.onChange(async (value) => {
							this.plugin.settings.initialFitPercent = value;
							await this.plugin.saveSettings();
						});
				});
		}

		// 缩放步长
		new Setting(containerEl)
			.setName('缩放步长')
			.setDesc('每次点击放大/缩小按钮或滚轮滚动时的缩放增量')
			.addSlider((slider) => {
				slider
					.setLimits(0.05, 0.2, 0.05)
					.setValue(this.plugin.settings.zoomStep)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.zoomStep = Math.round(value * 100) / 100;
						await this.plugin.saveSettings();
					});
			});

		// 是否显示工具栏
		new Setting(containerEl)
			.setName('显示工具栏')
			.setDesc('开启后，查看模式底部显示操作按钮（放大、缩小、旋转、重置、关闭）')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.showToolbar)
					.onChange(async (value) => {
						this.plugin.settings.showToolbar = value;
						await this.plugin.saveSettings();
					});
			});

		// ===== 背景遮罩效果 =====
		new Setting(containerEl)
			.setName('背景遮罩效果')
			.setHeading();

		// 遮罩效果类型
		new Setting(containerEl)
			.setName('遮罩效果')
			.setDesc('选择查看模式下的背景遮罩效果')
			.addDropdown((dropdown) => {
				for (const [key, label] of Object.entries(OVERLAY_EFFECT_OPTIONS)) {
					dropdown.addOption(key, label);
				}
				dropdown
					.setValue(this.plugin.settings.overlay.effect)
					.onChange(async (value) => {
						this.plugin.settings.overlay.effect = value as OverlayEffect;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		// 遮罩颜色模式（dim 和 blur 模式下显示）
		if (this.plugin.settings.overlay.effect !== 'none') {
			new Setting(containerEl)
				.setName('遮罩颜色')
				.setDesc('选择遮罩的颜色模式')
				.addDropdown((dropdown) => {
					for (const [key, label] of Object.entries(OVERLAY_COLOR_MODE_OPTIONS)) {
						dropdown.addOption(key, label);
					}
					dropdown
						.setValue(this.plugin.settings.overlay.colorMode)
						.onChange(async (value) => {
							this.plugin.settings.overlay.colorMode = value as OverlayColorMode;
							await this.plugin.saveSettings();
						});
				});

			// 遮罩不透明度
			new Setting(containerEl)
				.setName('遮罩不透明度')
				.setDesc('遮罩层的暗度/亮度，值越大遮罩越明显（0.1 ~ 1.0）')
				.addSlider((slider) => {
					slider
						.setLimits(0.1, 1.0, 0.05)
						.setValue(this.plugin.settings.overlay.opacity)
						.setDynamicTooltip()
						.onChange(async (value) => {
							this.plugin.settings.overlay.opacity = Math.round(value * 100) / 100;
							await this.plugin.saveSettings();
						});
				});
		}

		// 模糊强度（仅 blur 模式下显示）
		if (this.plugin.settings.overlay.effect === 'blur') {
			new Setting(containerEl)
				.setName('模糊强度')
				.setDesc('遮罩层的模糊程度（像素），值越大越模糊')
				.addSlider((slider) => {
					slider
						.setLimits(1, 40, 1)
						.setValue(this.plugin.settings.overlay.blurStrength)
						.setDynamicTooltip()
						.onChange(async (value) => {
							this.plugin.settings.overlay.blurStrength = value;
							await this.plugin.saveSettings();
						});
				});
		}

		// ===== 交互设置 =====
		new Setting(containerEl)
			.setName('交互')
			.setHeading();

		// 点击空白区域关闭
		new Setting(containerEl)
			.setName('点击空白区域关闭')
			.setDesc('开启后，点击图片以外的区域可关闭查看模式')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.clickToClose)
					.onChange(async (value) => {
						this.plugin.settings.clickToClose = value;
						await this.plugin.saveSettings();
					});
			});

		// 允许拖拽移动图片
		new Setting(containerEl)
			.setName('允许拖拽移动')
			.setDesc('开启后，可在查看模式下拖拽移动图片位置')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.draggable)
					.onChange(async (value) => {
						this.plugin.settings.draggable = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
