<script>
    // @ts-ignore
    import { onMount, onDestroy, afterUpdate } from "svelte";
    import { createEventDispatcher } from "svelte";

    // props
    export let image = null;
    export let vrMode = false;
    export let controlMode = "mouse"; // 'mouse', 'orientation', 'touch'

    const dispatch = createEventDispatcher();
    let scene;
    let camera;
    let orientationControls = false;
    let orientationHandler = null;

    // A-Frameコンポーネントの初期化
    onMount(() => {
        // A-Frameが既にロードされている場合にはsceneを再登録
        if (window.AFRAME) {
            window.AFRAME.registerComponent("reset-camera", {
                init: function () {
                    this.el.setAttribute("rotation", "0 0 0");
                },
            });
        }

        // コントロールの設定
        setupControls();

        return () => {
            // イベントリスナーのクリーンアップ
            if (orientationHandler) {
                window.removeEventListener(
                    "deviceorientation",
                    orientationHandler,
                );
            }
        };
    });

    // 画像やコントロールモードが変わったときに更新
    afterUpdate(() => {
        setupControls();
        updateSky();
    });

    // コントロールの設定
    function setupControls() {
        // 前のコントロールをクリーンアップ
        if (orientationHandler) {
            window.removeEventListener("deviceorientation", orientationHandler);
            orientationHandler = null;
        }

        // 新しいコントロールを設定
        if (controlMode === "orientation" && !vrMode) {
            enableOrientationControls();
        } else if (controlMode === "touch" && !vrMode) {
            enableTouchControls();
        } else {
            // デフォルトはマウスコントロール
            enableMouseControls();
        }
    }

    // マウスコントロールの有効化
    function enableMouseControls() {
        if (camera) {
            camera.setAttribute("look-controls", {
                enabled: true,
                mouseEnabled: true,
                touchEnabled: false,
            });
        }
    }

    // デバイスオリエンテーションコントロールの有効化
    function enableOrientationControls() {
        if (window.DeviceOrientationEvent) {
            // iOSの場合、権限リクエストが必要
            if (
                typeof DeviceOrientationEvent['requestPermission'] === "function"
            ) {
                DeviceOrientationEvent['requestPermission']()
                    .then((permission) => {
                        if (permission === "granted") {
                            setupOrientationListener();
                        } else {
                            // 権限が拒否されたらタッチコントロールにフォールバック
                            enableTouchControls();
                            dispatch("fallback", {
                                mode: "touch",
                                reason: "permission-denied",
                            });
                        }
                    })
                    .catch((error) => {
                        console.error(
                            "デバイスオリエンテーション権限エラー:",
                            error,
                        );
                        enableTouchControls();
                        dispatch("fallback", {
                            mode: "touch",
                            reason: "error",
                        });
                    });
            } else {
                // 他のデバイスでは権限リクエストなしで直接有効化
                setupOrientationListener();
            }
        } else {
            // デバイスオリエンテーションがサポートされていない場合
            enableTouchControls();
            dispatch("fallback", { mode: "touch", reason: "not-supported" });
        }
    }

    // オリエンテーションリスナーのセットアップ
    function setupOrientationListener() {
        if (camera) {
            // 通常のlook-controlsを無効化
            camera.setAttribute("look-controls", { enabled: false });

            // オリエンテーションイベントハンドラを設定
            orientationHandler = handleOrientation;
            window.addEventListener("deviceorientation", orientationHandler);
            orientationControls = true;
        }
    }

    // タッチコントロールの有効化
    function enableTouchControls() {
        if (camera) {
            camera.setAttribute("look-controls", {
                enabled: true,
                mouseEnabled: false,
                touchEnabled: true,
            });
        }
    }

    // デバイスオリエンテーションイベントハンドラ
    function handleOrientation(event) {
        if (!camera || vrMode) return;

        // デバイスの向きに基づいてカメラ回転を更新
        const beta = event.beta; // X軸（前後の傾き）
        const gamma = event.gamma; // Y軸（左右の傾き）
        const alpha = event.alpha; // Z軸（デバイスが向いている方向）

        // カメラの回転値を計算（A-Frameの座標系に合わせる）
        let x = beta ? beta : 0;
        let y = alpha ? alpha : 0;
        let z = gamma ? gamma : 0;

        // 初期の向きからのオフセットを考慮（実装により調整が必要）
        camera.setAttribute("rotation", { x, y, z });
    }

    // 360度画像の更新
    function updateSky() {
        if (!image || !scene) return;

        const sky = scene.querySelector("a-sky");
        if (sky && image.url) {
            sky.setAttribute("src", image.url);
        }
    }

    // カメラリセット
    function resetCamera() {
        if (camera) {
            camera.setAttribute("rotation", "0 0 0");
        }
    }

    // VRモード開始
    function enterVR() {
        if (scene) {
            scene.enterVR();
        }
    }

    // VRモード終了
    function exitVR() {
        if (scene) {
            scene.exitVR();
        }
    }

    // コンポーネント破棄時のクリーンアップ
    onDestroy(() => {
        if (orientationHandler) {
            window.removeEventListener("deviceorientation", orientationHandler);
        }
    });
</script>

<div class="viewer-container">
    <!-- A-Frame シーン -->
    <a-scene embedded vr-mode-ui="enabled: {vrMode}" bind:this={scene}>
        <a-assets>
            {#if image}
                <img id="skyTexture" src={image.url} crossorigin="anonymous" />
            {/if}
        </a-assets>

        <!-- カメラ設定 -->
        <a-entity
            bind:this={camera}
            camera
            position="0 1.6 0"
            look-controls="enabled: true"
            wasd-controls="enabled: false"
            reset-camera
        >
        </a-entity>

        <!-- 360度画像の表示 -->
        {#if image}
            <a-sky src="#skyTexture" rotation="0 -90 0"></a-sky>
        {/if}
    </a-scene>

    <!-- オーバーレイUI（VRモード以外で表示） -->
    {#if !vrMode}
        <div class="controls-overlay">
            <button class="reset-btn" on:click={resetCamera}>
                <span class="icon">⟳</span>
            </button>

            {#if controlMode === "orientation"}
                <div class="orientation-message">
                    デバイスを動かして周囲を見回せます
                </div>
            {/if}
        </div>
    {/if}

    <!-- VRモード切替ボタン -->
    {#if vrMode}
        <button class="exit-vr-btn" on:click={exitVR}> VRモード終了 </button>
    {:else if window.AFRAME && window.AFRAME.utils.device.checkHeadsetConnected()}
        <button class="enter-vr-btn" on:click={enterVR}> VRモード開始 </button>
    {/if}
</div>

<style>
    .viewer-container {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .controls-overlay {
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 10;
    }

    .reset-btn {
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(2px);
    }

    .orientation-message {
        background: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 10px;
        border-radius: 5px;
        margin-top: 10px;
        font-size: 14px;
        pointer-events: none;
        backdrop-filter: blur(2px);
    }

    .enter-vr-btn,
    .exit-vr-btn {
        position: absolute;
        bottom: 20px;
        right: 20px;
        z-index: 10;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        border-radius: 5px;
        padding: 10px 15px;
        cursor: pointer;
        font-weight: bold;
    }

    .exit-vr-btn {
        background: rgba(255, 0, 0, 0.7);
    }

    :global(a-scene) {
        width: 100%;
        height: 100%;
    }
</style>
