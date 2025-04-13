<script>
    import { createEventDispatcher } from "svelte";

    // プロパティ
    export let images = [];
    export let selected = null;
    export let showThumbnails = true;

    const dispatch = createEventDispatcher();
    let isOpen = false;

    // 画像選択
    function selectImage(image) {
        dispatch("select", image);
        isOpen = false;
    }

    // サムネイル表示切替
    function toggleSelector() {
        isOpen = !isOpen;
    }
</script>

<div class="image-selector {isOpen ? 'open' : ''}">
    <button class="selector-toggle" on:click={toggleSelector}>
        {isOpen ? "閉じる" : "画像選択"}
        <span class="chevron">{isOpen ? "▲" : "▼"}</span>
    </button>

    {#if isOpen}
        <div
            class="thumbnails-container"
            transition:slide|local={{ duration: 300 }}
        >
            {#each images as image (image.id)}
                <div
                    class="thumbnail-item {selected?.id === image.id
                        ? 'selected'
                        : ''}"
                    on:click={() => selectImage(image)}
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => e.key === "Enter" && selectImage(image)}
                >
                    {#if showThumbnails && image.thumbnail}
                        <img
                            src={image.thumbnail}
                            alt={image.name}
                            class="thumbnail-img"
                        />
                    {/if}
                    <div class="thumbnail-info">
                        <div class="thumbnail-name">{image.name}</div>
                        {#if image.description}
                            <div class="thumbnail-desc">
                                {image.description}
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .image-selector {
        position: absolute;
        bottom: 20px;
        right: 20px;
        z-index: 100;
        max-width: 300px;
        min-width: 150px;
    }

    .selector-toggle {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 15px;
        cursor: pointer;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
    }

    .chevron {
        font-size: 12px;
        margin-left: 10px;
    }

    .thumbnails-container {
        margin-top: 10px;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 8px;
        overflow: hidden;
        max-height: 300px;
        overflow-y: auto;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
    }

    .thumbnail-item {
        display: flex;
        padding: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .thumbnail-item:last-child {
        border-bottom: none;
    }

    .thumbnail-item:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .thumbnail-item.selected {
        background-color: rgba(52, 152, 219, 0.3);
    }

    .thumbnail-img {
        width: 60px;
        height: 40px;
        object-fit: cover;
        border-radius: 4px;
        margin-right: 10px;
    }

    .thumbnail-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .thumbnail-name {
        font-size: 14px;
        margin-bottom: 3px;
    }

    .thumbnail-desc {
        font-size: 12px;
        color: #aaa;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
