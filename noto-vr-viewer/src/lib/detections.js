/**
 * デバイスの機能を検出するユーティリティ
 * @returns {Object} デバイス機能情報
 */
export function detectDeviceCapabilities() {
    const capabilities = {
      isMobile: false,
      hasOrientation: false,
      hasTouch: false,
      supportsVR: false,
    };
  
    // モバイルデバイスの検出
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    capabilities.isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  
    // タッチ機能の検出
    capabilities.hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
    // デバイスオリエンテーション機能の検出
    capabilities.hasOrientation = !!window.DeviceOrientationEvent;
  
    // VR機能の検出（WebXR対応チェック）
    capabilities.supportsVR = 'xr' in navigator;
  
    return capabilities;
  }
  
  /**
   * WebXR APIのVR機能が利用可能かどうかを確認する
   * @returns {Promise<boolean>} VRがサポートされていればtrueを返す
   */
  export async function checkVRSupport() {
    if (!navigator.xr) {
      return false;
    }
  
    try {
      return await navigator.xr.isSessionSupported('immersive-vr');
    } catch (e) {
      console.error('VR対応チェック中にエラーが発生しました:', e);
      return false;
    }
  }
  
  /**
   * デバイスオリエンテーション権限をリクエスト（iOS 13+向け）
   * @returns {Promise<boolean>} 許可されたかどうか
   */
  export async function requestOrientationPermission() {
    if (!window.DeviceOrientationEvent) {
      return false;
    }
  
    // iOSの場合のみ、明示的な権限リクエストが必要
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        return permission === 'granted';
      } catch (e) {
        console.error('方位センサーの権限リクエスト中にエラーが発生しました:', e);
        return false;
      }
    }
  
    // Androidや他のデバイスは明示的な権限リクエストが不要
    return true;
  }