/**
 * 图片查看器插件 - 类型定义
 *
 * 定义插件所有配置项的接口和类型，
 * 包括快捷键、背景遮罩、缩放等配置。
 */

/** 修饰键类型（内部值） */
export type ModifierKey = 'Ctrl' | 'Alt' | 'Meta' | 'None';

/** 鼠标按键类型 */
export type MouseButton = 'left' | 'middle' | 'right';

/** 平台类型 */
export type PlatformType = 'win' | 'mac';

/** 快捷键配置 */
export interface ShortcutConfig {
	/** 修饰键列表，如 ['Ctrl']；['None'] 表示无需修饰键 */
	modifiers: ModifierKey[];
	/** 鼠标按键 */
	button: MouseButton;
}

/**
 * 背景遮罩效果类型
 * - none: 无遮罩（透明背景）
 * - dim: 半透明纯色遮罩
 * - blur: 毛玻璃模糊遮罩
 */
export type OverlayEffect = 'none' | 'dim' | 'blur';

/**
 * 遮罩颜色模式
 * - dark: 暗色遮罩（黑色半透明）
 * - light: 亮色遮罩（白色半透明）
 */
export type OverlayColorMode = 'dark' | 'light';

/** 背景遮罩配置 */
export interface OverlayConfig {
	/** 遮罩效果类型 */
	effect: OverlayEffect;
	/** 遮罩颜色模式（暗色/亮色） */
	colorMode: OverlayColorMode;
	/** 遮罩不透明度（dim 和 blur 模式下生效），范围 0-1 */
	opacity: number;
	/** 模糊强度（blur 模式下生效），单位像素，范围 1-40 */
	blurStrength: number;
}

/** 插件设置接口 */
export interface ImageViewerSettings {
	/** 用户选择的系统平台 */
	platform: PlatformType;
	/** 触发查看模式的快捷键配置 */
	shortcut: ShortcutConfig;
	/** 是否启用初始缩放（关闭后图片以原始尺寸显示） */
	initialScaleEnabled: boolean;
	/** 首次查看时图片占窗口的比例（80 = 占窗口 80%），仅 initialScaleEnabled 为 true 时生效 */
	initialFitPercent: number;
	/** 缩放步长：每次点击放大/缩小按钮或滚轮滚动的缩放增量 */
	zoomStep: number;
	/** 查看模式下是否显示底部工具栏按钮 */
	showToolbar: boolean;
	/** 背景遮罩配置 */
	overlay: OverlayConfig;
	/** 点击非图片区域是否关闭查看模式 */
	clickToClose: boolean;
	/** 是否允许拖拽移动图片 */
	draggable: boolean;
}
