import { writable } from 'svelte/store';

const SETTINGS_KEY = '360-viewer-settings';
const LAST_IMAGE_KEY = '360-viewer-last-image';

// デフォルト設定
const defaultSettings = {
  controlMode: 'mouse',   // mouse, orientation, touch
  vrEnabled: false        // VRモード
};

/**
 * 設定を保存する
 * @param {Object} settings 保存する設定
 */
function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('設定の保存中にエラーが発生しました:', e);
  }
}

/**
 * 保存された設定を読み込む
 * @returns {Object} 設定オブジェクト
 */
function loadSettings() {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (e) {
    console.error('設定の読み込み中にエラーが発生しました:', e);
  }
  
  return { ...defaultSettings };
}

/**
 * 最後に選択した画像IDを保存する
 * @param {string} imageId 画像ID
 */
export function saveLastImageId(imageId) {
  try {
    localStorage.setItem(LAST_IMAGE_KEY, imageId);
  } catch (e) {
    console.error('最後の画像IDの保存中にエラーが発生しました:', e);
  }
}

/**
 * 最後に選択した画像IDを取得する
 * @returns {string|null} 画像ID
 */
export function getLastImageId() {
  try {
    return localStorage.getItem(LAST_IMAGE_KEY);
  } catch (e) {
    console.error('最後の画像IDの読み込み中にエラーが発生しました:', e);
    return null;
  }
}

// 設定ストアの作成
function createSettingsStore() {
  // 保存された設定を読み込むか、デフォルト設定を使用
  const initialSettings = { ...defaultSettings, ...loadSettings() };
  const { subscribe, set, update } = writable(initialSettings);

  return {
    subscribe,
    // 設定全体を更新
    set: (newSettings) => {
      set(newSettings);
      saveSettings(newSettings);
    },
    // 個別の設定を更新
    update: (key, value) => {
      update(settings => {
        const updatedSettings = { ...settings, [key]: value };
        saveSettings(updatedSettings);
        return updatedSettings;
      });
    },
    // コントロールモードを更新
    setControlMode: (mode) => {
      update(settings => {
        const updatedSettings = { ...settings, controlMode: mode };
        saveSettings(updatedSettings);
        return updatedSettings;
      });
    },
    // VRモードの切り替え
    toggleVR: () => {
      update(settings => {
        const updatedSettings = { ...settings, vrEnabled: !settings.vrEnabled };
        saveSettings(updatedSettings);
        return updatedSettings;
      });
    },
    // 初期設定に戻す
    reset: () => {
      set(defaultSettings);
      saveSettings(defaultSettings);
    }
  };
}

// 設定ストアをエクスポート
export const settings = createSettingsStore();
