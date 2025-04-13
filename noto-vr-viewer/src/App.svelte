<script>
  import { onMount } from "svelte";
  import { images } from "./stores/images-store-revised";
  import { settings } from "./stores/settings-store-revised";
  import { detectDeviceCapabilities, checkVRSupport } from "./lib/detections";
  import { getLastImageId, saveLastImageId } from "./stores/settings-store-revised";

  // コンポーネントのインポート
  import Viewer from "./components/Viewer.svelte";
  import ControlPanel from "./components/ControlPanel.svelte";
  import ImageSelector from "./components/ImageSelector.svelte";
  import MobileControls from "./components/MobileControls.svelte";

  let deviceCapabilities;
  let selectedImage = null;
  let isLoading = true;
  let controlsVisible = true;
  let vrModeAvailable = false;
  let viewerComponent; // Viewerコンポーネントへの参照を追加

  onMount(async () => {
    // デバイス機能の検出
    deviceCapabilities = detectDeviceCapabilities();

    // VR対応チェック
    vrModeAvailable = await checkVRSupport();

    // スマホでの優先コントロールモードを設定
    if (deviceCapabilities.isMobile && deviceCapabilities.hasOrientation) {
      settings.setControlMode("orientation");
    }

    // 最後に表示した画像があれば選択
    const lastImageId = getLastImageId();
    if (lastImageId) {
      selectedImage = images.findImageById(lastImageId);
    } else {
      // 初めての訪問の場合は最初の画像を選択
      selectedImage = $images[0];
    }

    isLoading = false;
    
    // コンポーネントがマウントされた後に初期化ログを出力
    console.log("App mounted", {
      deviceCapabilities,
      vrModeAvailable,
      selectedImage,
      controlMode: $settings.controlMode
    });
  });

  // VRモード切り替え
  function toggleVRMode() {
    console.log("toggleVRMode called", {
      currentVRMode: $settings.vrEnabled,
      viewerComponent: !!viewerComponent
    });
    
    settings.toggleVR();
    
    // VRモードが有効になった場合、Viewerコンポーネントの対応するメソッドを呼び出す
    if ($settings.vrEnabled && viewerComponent) {
      console.log("Calling enterVR on viewerComponent");
      viewerComponent.enterVR();
    } else if (!$settings.vrEnabled && viewerComponent) {
      console.log("Calling exitVR on viewerComponent");
      viewerComponent.exitVR();
    }
  }

  // 画像選択ハンドラ
  function handleImageSelect(event) {
    console.log("handleImageSelect called", event.detail);
    selectedImage = event.detail;
    saveLastImageId(selectedImage.id);
  }

  // 画面タップでコントロール表示切替
  function toggleControls(event) {
    // コントロールパネルやイメージセレクター内のクリックは無視する
    if (event && (
      event.target.closest('.control-panel') ||
      event.target.closest('.image-selector') ||
      event.target.closest('.reset-button') ||
      event.target.closest('.mobile-controls')
    )) {
      console.log("コントロール内のクリックなので無視します");
      return;
    }
    
    if (!$settings.vrEnabled) {
      console.log("Toggling controls visibility", { current: controlsVisible });
      controlsVisible = !controlsVisible;
    }
  }

  // カメラリセット機能
  function resetCamera() {
    console.log("resetCamera called in App.svelte", { viewerComponent: !!viewerComponent });
    if (viewerComponent) {
      viewerComponent.resetCamera();
    } else {
      console.error("viewerComponent is not available");
    }
  }
</script>

<main class:vr-mode={$settings.vrEnabled}>
  {#if isLoading}
    <div class="loading">
      <div class="spinner"></div>
      <p>読み込み中...</p>
    </div>
  {:else}
    <div
      class="viewer-container"
      role="button"
      tabindex="0"
      on:click={(e) => toggleControls(e)}
      on:keydown={(e) => e.key === 'Enter' && toggleControls(e)}>
      {#if selectedImage}
        <Viewer
          bind:this={viewerComponent}
          image={selectedImage}
          vrMode={$settings.vrEnabled}
          controlMode={$settings.controlMode}
        />
      {/if}

      {#if controlsVisible && !$settings.vrEnabled}
        <ControlPanel
          {deviceCapabilities}
          vrAvailable={vrModeAvailable}
          controlMode={$settings.controlMode}
          on:togglevr={toggleVRMode}
          on:setcontrolmode={(e) => settings.setControlMode(e.detail)}
        />

        <ImageSelector
          images={$images}
          selected={selectedImage}
          on:select={handleImageSelect}
        />

        {#if deviceCapabilities?.isMobile}
          <MobileControls
            controlMode={$settings.controlMode}
            on:change={(e) => settings.setControlMode(e.detail)}
          />
        {/if}
      {/if}
    </div>
  {/if}
</main>

<style>
  main {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background-color: #000;
    color: #fff;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
  }

  .viewer-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .loading {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .vr-mode :global(.controls-overlay),
  .vr-mode :global(.image-selector),
  .vr-mode :global(.control-panel) {
    display: none;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  /* リセットボタンのスタイル */
  .reset-button {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 15px;
    cursor: pointer;
    z-index: 100;
    backdrop-filter: blur(5px);
  }
</style>
