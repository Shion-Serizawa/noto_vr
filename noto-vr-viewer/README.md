# 360度画像ビューア

A-Frameを使用した360度画像ビューアアプリケーションです。

## 機能

- 360度画像（全天球・パノラマ）の表示
- 通常モードとVRモードの切り替え
- 複数の操作方法対応
  - デスクトップ：マウス操作
  - スマートフォン：デバイスの向きまたはタッチ操作
  - VRゴーグル：ヘッドトラッキング

## 開発環境のセットアップ

### 必要条件

- Node.js（推奨：LTS版）
- npm または yarn
- Git

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/360-viewer.git
cd 360-viewer

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 画像の追加方法

1. 360度画像（equirectangular形式の全天球画像またはパノラマ画像）を用意します
2. 画像ファイルを `public/images/` ディレクトリに配置します
3. サムネイル画像を `public/images/thumbnails/` ディレクトリに配置します
4. `src/stores/images.js` ファイルを開き、画像情報を追加します

画像情報の例：
```javascript
{
  id: 'unique-id',
  name: '画像の名前',
  type: 'equirectangular', // または 'panorama'
  url: 'images/your-image.jpg',
  thumbnail: 'images/thumbnails/your-image-thumb.jpg',
  description: '画像の説明'
}
```

## デプロイ

### GitHub Pages（GitHub Actions使用）

1. GitHubリポジトリの「Settings」→「Pages」でGitHub Pagesを有効化
2. ソースとして「GitHub Actions」を選択
3. mainブランチにプッシュすると自動的にデプロイされます

### 手動デプロイ

```bash
# デプロイスクリプトを実行可能にする
chmod +x deploy.sh

# デプロイ実行
./deploy.sh
```

## 技術スタック

- [Svelte](https://svelte.dev/) - UIフレームワーク
- [Vite](https://vitejs.dev/) - ビルドツール
- [A-Frame](https://aframe.io/) - WebVRフレームワーク

## ライセンス

MIT
