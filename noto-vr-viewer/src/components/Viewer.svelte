<script lang="ts">
    import { onMount, onDestroy, afterUpdate } from "svelte";
    import { createEventDispatcher } from "svelte";

    // 画像の型定義
    interface ImageType {
        url: string;
        type?: 'equirectangular' | 'panorama'; // 画像タイプを追加
        [key: string]: any; // その他のプロパティがある場合
    }

    // props
    export let image: ImageType | null = null;
    export let vrMode = false;
    export let controlMode = "mouse"; // 'mouse', 'orientation', 'touch'

    const dispatch = createEventDispatcher();
    let scene;
    let camera;
    let orientationControls = false;
    let orientationHandler = null;
    let panoramaEntity = null;

    // A-Frameコンポーネントの初期化
    onMount(() => {
        // A-Frameが既にロードされている場合にはsceneを再登録
        if (window.AFRAME) {
            window.AFRAME.registerComponent("reset-camera", {
                init: function () {
                    this.el.setAttribute("rotation", "0 0 0");
                },
            });
            
            // パノラマ用のカスタムコンポーネント（水平方向のみの回転に制限）
            window.AFRAME.registerComponent("panorama-rotation", {
                schema: {
                    enabled: { default: true }
                },
                init: function() {
                    this.originalPitch = 0;
                    
                    // look-controlsコンポーネントが利用可能になるまで少し待つ
                    setTimeout(() => {
                        if (this.el.components["look-controls"]) {
                            this.originalPitch = this.el.components["look-controls"].pitchObject.rotation.x;
                        }
                    }, 100);
                },
                tick: function() {
                    if (this.data.enabled && this.el.components["look-controls"]) {
                        // Y軸（上下）の回転を制限
                        this.el.components["look-controls"].pitchObject.rotation.x = this.originalPitch;
                    }
                }
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
        updateView();
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
        
        // パノラマの場合、上下の回転を制限する
        if (camera && image?.type === 'panorama') {
            camera.setAttribute("panorama-rotation", "enabled: true");
        } else if (camera) {
            camera.setAttribute("panorama-rotation", "enabled: false");
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
        
        // パノラマタイプの場合は上下の視点移動を制限
        if (image && image.type === 'panorama') {
            x = 0; // X軸（上下）の回転を0に固定
        }

        // 初期の向きからのオフセットを考慮（実装により調整が必要）
        camera.setAttribute("rotation", { x, y, z });
    }

    // ビューの更新（画像タイプに応じた処理）
    function updateView() {
        if (!image || !scene) {
            console.log("updateView: image or scene is null", { image, scene });
            return;
        }

        // 既存のスカイとパノラマエンティティを削除
        clearCurrentView();
        
        // 画像タイプに応じて表示方法を変更
        const imageType = image.type || 'equirectangular'; // デフォルトは全天球
        
        if (imageType === 'equirectangular') {
            // 全天球画像はa-skyを使用
            console.log("Setting up equirectangular view with:", image.url);
            const sky = document.createElement('a-sky');
            sky.setAttribute('id', 'sky-entity');
            sky.setAttribute('src', '#skyTexture');
            sky.setAttribute('rotation', '0 -90 0');
            scene.appendChild(sky);
            
            // カメラの制限を解除
            if (camera) {
                camera.setAttribute('panorama-rotation', 'enabled: false');
            }
        } else if (imageType === 'panorama') {
            // パノラマ画像は円筒形に表示
            console.log("Setting up panorama view with:", image.url);
            panoramaEntity = document.createElement('a-entity');
            panoramaEntity.setAttribute('id', 'panorama-entity');
            
            // 円筒形のジオメトリを設定
            panoramaEntity.setAttribute('geometry', {
                primitive: 'cylinder',
                radius: 5,
                height: 6,
                openEnded: true,
                thetaLength: 360,
                thetaStart: 0,
                segmentsRadial: 36
            });
            
            // テクスチャを内側に表示
            panoramaEntity.setAttribute('material', {
                src: '#skyTexture',
                shader: 'flat',
                side: 'back',
                repeat: '-1 1'
            });
            panoramaEntity.setAttribute('rotation', '0 180 0');
            
            // 位置調整
            panoramaEntity.setAttribute('position', '0 1.6 0');
            scene.appendChild(panoramaEntity);
            
            // カメラの上下回転を制限
            if (camera) {
                camera.setAttribute('panorama-rotation', 'enabled: true');
            }
        }
    }
    
    // 現在のビューをクリア
    function clearCurrentView() {
        // 既存のスカイを削除
        const existingSky = scene.querySelector('#sky-entity');
        if (existingSky) {
            existingSky.parentNode.removeChild(existingSky);
        }
        
        // 既存のパノラマエンティティを削除
        const existingPanorama = scene.querySelector('#panorama-entity');
        if (existingPanorama) {
            existingPanorama.parentNode.removeChild(existingPanorama);
        }
    }

    // 外部から呼び出せるメソッド
    export function resetCamera() {
        console.log("resetCamera called", { camera });
        if (camera) {
            // look-controlsコンポーネントを取得
            const lookControls = camera.components["look-controls"];
            
            if (lookControls) {
                // look-controlsの内部状態をリセット
                if (lookControls.pitchObject) lookControls.pitchObject.rotation.x = 0;
                if (lookControls.yawObject) lookControls.yawObject.rotation.y = 0;
            }
            
            // カメラの回転属性を直接設定
            camera.setAttribute("rotation", "0 0 0");
            console.log("Camera rotation reset to 0 0 0");
            
            // オリエンテーションコントロールの場合も対応
            if (orientationControls && orientationHandler) {
                // オリエンテーションコントロールを一時的に無効化して再設定
                window.removeEventListener("deviceorientation", orientationHandler);
                setTimeout(() => {
                    window.addEventListener("deviceorientation", orientationHandler);
                }, 100);
            }
        }
    }

    export function enterVR() {
        console.log("enterVR called", { scene });
        if (scene) {
            scene.enterVR();
            console.log("Entered VR mode");
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

        <!-- 画像コンテンツはJavaScriptで動的に生成 -->
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
            
            {#if image && image.type}
                <div class="image-type-badge">
                    {image.type === 'equirectangular' ? '360°全天球' : 'パノラマ'}
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
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
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
        font-size: 14px;
        pointer-events: none;
        backdrop-filter: blur(2px);
    }
    
    .image-type-badge {
        background: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 12px;
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
