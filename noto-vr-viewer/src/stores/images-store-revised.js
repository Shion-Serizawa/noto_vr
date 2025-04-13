import { writable } from 'svelte/store';

// 事前に用意された画像データ
const predefinedImages = [
  {
    id: 'juzo',
    name: '春祭りの重蔵神社',
    type: 'equirectangular',
    url: 'images/juzo.jpg',
    thumbnail: 'images/thumbnails/juzo-thum.jpg',
    description: '震災の影響がのこるなか開催される春祭り中の重蔵神社の360度パノラマ'
  },
  {
    id: 'hospital',
    name: '輪島病院',
    type: 'panorama',
    url: 'images/wajima-hospital.jpg',
    thumbnail: 'images/thumbnails/wajima-hospital-thum.png',
    description: '山頂から見る壮大な景色の360度パノラマ'
  },
  {
    id: 'asaichi',
    name: '輪島朝市',
    type: 'panorama',
    url: 'images/asaichi.jpg',
    thumbnail: 'images/thumbnails/asaichi-thum.png',
    description: '震災後の新しいスタイルの輪島朝市パノラマ'
  },
  {
    id: 'city-office',
    name: '市役所',
    type: 'panorama',
    url: 'images/city-office.jpg',
    thumbnail: 'images/thumbnails/city-office-thub.png',
    description: '桜と輪島市役所のパノラマ'
  },
  {
    id: 'river',
    name: '川',
    type: 'panorama',
    url: 'images/river.jpg',
    thumbnail: 'images/thumbnails/river-thum.png',
    description: '大きな通りから見る川。桜と仮設住宅が顔をのぞかせる'
  }
];

// 画像データストアの作成
function createImagesStore() {
  const { subscribe, set, update } = writable(predefinedImages);

  return {
    subscribe,
    set,
    update,
    // 画像を検索
    findImageById: (id) => {
      return predefinedImages.find(img => img.id === id) || predefinedImages[0];
    }
  };
}

// 画像ストアをエクスポート
export const images = createImagesStore();
