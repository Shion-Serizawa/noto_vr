<script>
    import { createEventDispatcher } from "svelte";

    // プロパティ
    export let deviceCapabilities = {
        isMobile: false,
        hasOrientation: false,
        hasTouch: false,
        supportsVR: false,
    };
    export let vrAvailable = false;
    export let controlMode = "mouse";

    const dispatch = createEventDispatcher();

    // VRモード切替
    function toggleVR() {
        dispatch("togglevr");
    }

    // コントロールモード切替
    function setControlMode(mode) {
        dispatch("setcontrolmode", mode);
    }
</script>

{#if deviceCapabilities?.isMobile || vrAvailable}
<div class="control-panel" on:click|stopPropagation>
    <div class="panel-section">
        <!-- デバイスに応じたコントロールモード切替 -->
        {#if deviceCapabilities.isMobile}
            <div class="control-mode-group">
                <h3>操作モード</h3>
                <div class="button-group">
                    {#if deviceCapabilities.hasOrientation}
                        <button
                            class="control-btn {controlMode === 'orientation'
                                ? 'active'
                                : ''}"
                            on:click|stopPropagation={() => setControlMode("orientation")}
                        >
                            デバイス向き
                        </button>
                    {/if}

                    <button
                        class="control-btn {controlMode === 'touch'
                            ? 'active'
                            : ''}"
                        on:click|stopPropagation={() => setControlMode("touch")}
                    >
                        タッチ操作
                    </button>
                </div>
            </div>
        {/if}

        <!-- VRモード切替ボタン（VR対応デバイスのみ表示） -->
        {#if vrAvailable}
            <div class="vr-mode-group">
                <button class="vr-btn" on:click|stopPropagation={toggleVR}>
                    VRモード開始
                </button>
            </div>
        {/if}
    </div>
</div>
{/if}
<style>
    .control-panel {
        position: absolute;
        bottom: 20px;
        left: 20px;
        z-index: 100;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 8px;
        padding: 15px;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        min-width: 150px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }

    .panel-section {
        margin-bottom: 10px;
    }

    .panel-section:last-child {
        margin-bottom: 0;
    }

    h3 {
        font-size: 14px;
        margin-bottom: 8px;
        color: #ddd;
        font-weight: normal;
    }

    .button-group {
        display: flex;
        gap: 8px;
    }

    .control-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 8px 12px;
        font-size: 12px;
    }

    .control-btn.active {
        background: var(--primary-color, #3498db);
        border-color: var(--primary-color, #3498db);
    }

    .vr-btn {
        width: 100%;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 8px 12px;
        margin-top: 10px;
        font-size: 12px;
    }

    .vr-mode-group {
        margin-top: 10px;
    }
</style>
