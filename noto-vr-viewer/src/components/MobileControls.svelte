<script>
    import { createEventDispatcher } from "svelte";
    import { requestOrientationPermission } from "../lib/detections";

    // プロパティ
    export let controlMode = "orientation"; // 'orientation' または 'touch'

    const dispatch = createEventDispatcher();
    let isPermissionGranted = false;
    let permissionRequested = false;

    // 操作モード切替
    function toggleControlMode() {
        const newMode = controlMode === "orientation" ? "touch" : "orientation";

        if (
            newMode === "orientation" &&
            !isPermissionGranted &&
            !permissionRequested
        ) {
          requestOrientationPermission().then((granted) => {
            isPermissionGranted = granted;
            permissionRequested = true;
    
            if (granted) {
              dispatch("change", newMode);
            } else {
              // 権限がない場合はタッチモードにフォールバック
              dispatch("change", "touch");
              console.warn("デバイスの向き検知の権限がありません");
            }
          });
          return; // 即時モード変更
        } else {
            dispatch("change", newMode);
        }
    }
</script>

<div class="mobile-controls" on:click|stopPropagation>
    <button class="control-toggle" on:click|stopPropagation={toggleControlMode}>
        <span class="icon">{controlMode === "orientation" ? "📱" : "👆"}</span>
        <span class="label">
            {controlMode === "orientation"
                ? "デバイス向き操作中"
                : "タッチ操作中"}
        </span>
    </button>
</div>

<style>
    .mobile-controls {
        position: absolute;
        top: 20px;
        left: 20px;
        z-index: 100;
    }

    .control-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 15px;
        cursor: pointer;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
    }

    .icon {
        font-size: 16px;
    }

    .label {
        font-size: 14px;
    }
</style>
