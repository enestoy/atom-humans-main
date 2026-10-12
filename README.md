# Atom Humans

`robot-heads-main` projesinin ayrı yerel kopyası. Robot karakterler kaldırıldı; `human` projesindeki prosedürel insan silueti atom insanlara uyarlandı. Orijinal iki proje değiştirilmez.

## Çalıştırma

Bu çalışma alanında bağımlılıklar kopyalanmıştır; doğrudan çalıştırabilirsiniz:

```sh
cd /Users/enestoy/Documents/code/oyunlar/atom-humans-main
npm run dev
```

Yeni bir makinede bağımlılıklar için kök dizinde `pnpm install` kullanın. Node.js 22.12 veya üzeri gerekir.

```sh
npm run typecheck
npm test
npm run build:site
npm run preview
```

## Karakterler ve etkileşim

- Dört insan formu: İnsan, İnce, Atletik, Genç.
- Dokuz durum: sakin, düşünüyor, arıyor, dinliyor, konuşuyor, çalışıyor, mutlu, hata, uyuyor.
- Tam beden / yüz detayı görünümü. Yüz; atomlardan alın, yanak, çene, kulak, burun, göz, kaş ve dudak kümeleri içerir.
- İmleç takibi, göz kırpma, nefes alma, tıklamada veya Enter/Boşluk ile zıplama, tam dönüş ve atom patlaması.
- Duruma göre yörünge, tarama, enerji dalgaları, konuşma ve gülümseme. Dinleme/konuşma halkaları prosedüreldir; mikrofon kullanılmaz.
- Beden/vurgu/yüz rengi, zemin atom halkası, animasyon hızı, durdurma ve tema kontrolleri.
- Hareket azaltma tercihi ve gizli sekmelerde duraklayan ortak animasyon döngüsü.

Canvas 2D üzerinde üç boyutlu atom konumları perspektifle çizilir; WebGL ve dış görsel servisi gerekmez. Ana görünümde yaklaşık 6.500 atom, yüz görünümünde daha yoğun örnekleme, küçük önizlemelerde azaltılmış atom sayısı kullanılır.

## React bileşeni

```tsx
import { AtomHuman } from 'atom-humans';

<AtomHuman
  form="human"
  state="thinking"
  view="body"
  size={400}
  color="#b4d7ff"
  accentColor="#e6b96d"
  faceColor="#e8f4ff"
  halo
/>
```

Diğer özellikler: `speed`, `paused`, `interactive`, `seed`, HTML span öznitelikleri ve canvas ref. Dağıtılabilir React kitaplığı `npm run build` ile `dist/` içine; yerel demo `npm run build:site` ile `site/dist/` içine hazırlanır.

Önizleme URL parametreleri: `?form=athletic&state=thinking&view=face&paused&nohalo`. Geçersiz form ve durum değerleri varsayılana döner.

## Kaynaklar

Hareket yayı sistemi, paylaşılan ticker ve demo temeli Fayaz Ahmed'in MIT lisanslı [robot-heads](https://github.com/fayazara/robot-heads) projesinden uyarlanmıştır. Orijinal MIT lisansı `LICENSE` içinde korunur. İnsan bedeninin parçacık geometri temeli bu çalışma alanındaki `human/src/experience/particles/particleGenerators.ts` dosyasından uyarlanmıştır. Yüz anatomisi, atom çizicisi ve durum efektleri bu kopyada eklenmiştir.
