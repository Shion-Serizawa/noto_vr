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
  // 画像の存在確認とログ出力
  predefinedImages.forEach(img => {
    console.log(`画像データ: ${img.id}`, {
      name: img.name,
      url: img.url,
      thumbnail: img.thumbnail
    });
    
    // 画像URLが存在するか確認
    const imgElement = new Image();
    imgElement.onload = () => console.log(`画像が正常に読み込まれました: ${img.url}`);
    imgElement.onerror = () => console.error(`画像の読み込みに失敗しました: ${img.url}`);
    imgElement.src = img.url;
    
    // サムネイルURLが存在するか確認
    if (img.thumbnail) {
      const thumbElement = new Image();
      thumbElement.onload = () => console.log(`サムネイルが正常に読み込まれました: ${img.thumbnail}`);
      thumbElement.onerror = () => console.error(`サムネイルの読み込みに失敗しました: ${img.thumbnail}`);
      thumbElement.src = img.thumbnail;
    }
  });

  const { subscribe, set, update } = writable(predefinedImages);

  return {
    subscribe,
    set,
    update,
    // 画像を検索
    findImageById: (id) => {
      const foundImage = predefinedImages.find(img => img.id === id) || predefinedImages[0];
      console.log(`findImageById: ${id}`, foundImage);
      return foundImage;
    }
  };
}

// 画像ストアをエクスポート
export const images = createImagesStore();
