/**
 * 图标定义。
 * 单独放在 .ts 文件中，这样类型 IconName 可以被其它组件 import，
 * 而 `<script setup>` 里声明的类型不便于跨文件引用。
 */
export const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>',
  heart:
    '<path d="M12 20.2s-7.6-4.7-7.6-9.7A4.5 4.5 0 0 1 12 7.4a4.5 4.5 0 0 1 7.6 3.1c0 5-7.6 9.7-7.6 9.7Z"/>',
  heartFilled:
    '<path d="M12 20.2s-7.6-4.7-7.6-9.7A4.5 4.5 0 0 1 12 7.4a4.5 4.5 0 0 1 7.6 3.1c0 5-7.6 9.7-7.6 9.7Z" fill="currentColor" stroke="none"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  home: '<path d="m4 10.4 8-6.4 8 6.4V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19Z"/><path d="M9.6 20.6v-6h4.8v6"/>',
  grid:
    '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.9 20.3a7.3 7.3 0 0 1 14.2 0"/>',
  close: '<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>',
  chevronLeft: '<path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>',
  chevronRight: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
  chevronDown: '<path d="m5 9.5 7 7 7-7"/>',
  arrowRight: '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
  edit: '<path d="M4.4 19.6l.9-3.7L15.6 5.6a2.1 2.1 0 0 1 3 3L8.2 18.7z"/><path d="m14.2 7.1 2.9 2.9"/>',
  trash:
    '<path d="M4.5 7h15M9.6 7V5.3A1.3 1.3 0 0 1 10.9 4h2.2a1.3 1.3 0 0 1 1.3 1.3V7"/><path d="m6.6 7 .8 11.9a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4L17.4 7"/>',
  image:
    '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m4.5 17.2 4-4a2 2 0 0 1 2.8 0l2.4 2.4"/><path d="m13.8 15.6 1.2-1.2a2 2 0 0 1 2.8 0l2.7 2.7"/>',
  camera:
    '<path d="M4.5 8.4h2.7l1.3-2.2h7l1.3 2.2h2.7a1.5 1.5 0 0 1 1.5 1.5v8.1a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V9.9a1.5 1.5 0 0 1 1.5-1.5Z"/><circle cx="12" cy="13.7" r="3"/>',
  alert: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.6v5.2M12 16.4h.01"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.7-6"/><path d="M20.2 4.4v5.4h-5.4"/>',
  check: '<path d="m5 12.8 4.4 4.4L19 7"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11.2v5.2M12 7.9h.01"/>',
  logout:
    '<path d="M14.8 5.6V4.4A1.8 1.8 0 0 0 13 2.6H6.3A1.8 1.8 0 0 0 4.5 4.4v15.2A1.8 1.8 0 0 0 6.3 21.4H13a1.8 1.8 0 0 0 1.8-1.8v-1.2"/><path d="M9.6 12h11M17.4 8.4 21 12l-3.6 3.6"/>',
  eye: '<path d="M2.6 12S6.2 6.6 12 6.6 21.4 12 21.4 12 17.8 17.4 12 17.4 2.6 12 2.6 12Z"/><circle cx="12" cy="12" r="3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.4V12l3.1 1.9"/>',
  tag: '<path d="M11.5 3.6H20a.4.4 0 0 1 .4.4v8.5a2 2 0 0 1-.6 1.4l-6 6a2 2 0 0 1-2.8 0l-6-6a2 2 0 0 1 0-2.8l6-6a2 2 0 0 1 1.5-.9Z"/><circle cx="16.3" cy="7.7" r="1.3"/>',
  location:
    '<path d="M12 21s6.4-5.6 6.4-10.2A6.4 6.4 0 0 0 5.6 10.8C5.6 15.4 12 21 12 21Z"/><circle cx="12" cy="10.7" r="2.4"/>',
  filter:
    '<path d="M4 7.5h9M18 7.5h2M4 16.5h5M14 16.5h6"/><circle cx="15" cy="7.5" r="2.1"/><circle cx="11" cy="16.5" r="2.1"/>',
  inbox:
    '<path d="M3.5 13.5 6 5.2a1.6 1.6 0 0 1 1.5-1.1h9a1.6 1.6 0 0 1 1.5 1.1l2.5 8.3v4.1a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 17.6Z"/><path d="M3.5 13.5h4.2l1 2.4h6.6l1-2.4h4.2"/>',
  shield: '<path d="M12 3.4 19 6v5.6c0 4-3 7.4-7 8.9-4-1.5-7-4.9-7-8.9V6Z"/><path d="m9.2 12 2 2 3.6-3.8"/>',
  sparkle:
    '<path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9Z"/><path d="M18.6 16.4l.6 2 2 .6-2 .6-.6 2-.6-2-2-.6 2-.6Z"/>',
  device: '<rect x="7" y="2.5" width="10" height="19" rx="2.6"/><path d="M10.5 18.4h3"/>',
  book: '<rect x="4.5" y="3.5" width="15" height="17" rx="1.8"/><path d="M8.6 3.5v17M11.5 8.5h5M11.5 12h5"/>',
  mug: '<rect x="4.2" y="7" width="11" height="12" rx="2.2"/><path d="M15.2 10.2h2.4a2.6 2.6 0 0 1 0 5.2h-2.4"/>',
  shirt:
    '<path d="M9.2 3.4 4.6 6.2l1.6 4.1 1.6-.9v10.3h8.4V9.4l1.6.9 1.6-4.1-4.6-2.8a2.9 2.9 0 0 1-5.6 0Z"/>',
  pencil: '<path d="M4.4 19.6l.9-3.7L15.6 5.6a2.1 2.1 0 0 1 3 3L8.2 18.7z"/><path d="m14.2 7.1 2.9 2.9"/>',
  box: '<path d="M3.6 7.6 12 3.5l8.4 4.1v8.8L12 20.5 3.6 16.4Z"/><path d="M3.6 7.6 12 11.6l8.4-4M12 11.6v8.9"/>'
} as const

export type IconName = keyof typeof ICONS

/** 分类图标名 → 中文标签，用于分类占位与无障碍文案 */
export const CATEGORY_ICON_NAMES: Record<string, IconName> = {
  device: 'device',
  book: 'book',
  mug: 'mug',
  shirt: 'shirt',
  pencil: 'pencil',
  box: 'box'
}
