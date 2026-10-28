const SEARCH_RADIUS = 1000; // meters
const MAX_PLACES = 5;

const mapSection = document.getElementById("map-section");
const mapLink = document.getElementById("map-link");
const mapStatus = document.getElementById("map-status");
const mapEl = document.getElementById("map");
const placeList = document.getElementById("place-list");

let sdkPromise = null;
let map = null;
let markers = [];
let searchId = 0; // ignore results from an older pick

function loadKakaoSdk() {
  if (!window.KAKAO_JS_KEY) return Promise.reject(new Error("no key"));
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(window.KAKAO_JS_KEY)}&libraries=services&autoload=false`;
      script.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
      script.onerror = () => reject(new Error("sdk"));
      document.head.append(script);
    });
  }
  return sdkPromise;
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("geo"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      reject,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

function hideNearby() {
  searchId++;
  mapSection.hidden = true;
}

async function showNearby(menuName) {
  const id = ++searchId;
  mapSection.hidden = false;
  mapLink.href = `https://map.kakao.com/link/search/${encodeURIComponent(menuName)}`;
  mapLink.textContent = `카카오맵에서 '${menuName}' 검색 ↗`;
  placeList.innerHTML = "";
  mapEl.hidden = true;

  if (!window.KAKAO_JS_KEY) {
    mapStatus.textContent = "";
    return;
  }

  mapStatus.textContent = "내 주변 식당을 찾는 중…";
  let kakao, coords;
  try {
    [kakao, coords] = await Promise.all([loadKakaoSdk(), getPosition()]);
  } catch (err) {
    if (id !== searchId) return;
    mapStatus.textContent = err.message === "sdk"
      ? "카카오맵을 불러오지 못했어요. 키와 등록 도메인을 확인하세요."
      : "위치 권한이 없어 주변 검색을 못 했어요. 위 링크로 찾아보세요.";
    return;
  }
  if (id !== searchId) return;

  const center = new kakao.maps.LatLng(coords.latitude, coords.longitude);
  mapEl.hidden = false;
  if (!map) {
    map = new kakao.maps.Map(mapEl, { center, level: 4 });
  } else {
    map.relayout();
    map.setCenter(center);
  }

  const places = new kakao.maps.services.Places();
  places.keywordSearch(menuName, (data, status) => {
    if (id !== searchId) return;
    markers.forEach((m) => m.setMap(null));
    markers = [];

    if (status !== kakao.maps.services.Status.OK) {
      mapStatus.textContent = `반경 ${SEARCH_RADIUS / 1000}km 안에 '${menuName}' 식당이 없어요.`;
      return;
    }

    const top = data.slice(0, MAX_PLACES);
    mapStatus.textContent = `가까운 '${menuName}' 식당 ${top.length}곳`;
    const bounds = new kakao.maps.LatLngBounds();
    bounds.extend(center);
    markers.push(new kakao.maps.Marker({
      map,
      position: center,
      title: "내 위치",
      image: new kakao.maps.MarkerImage(
        "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><circle cx='10' cy='10' r='7' fill='#4a90d9' stroke='white' stroke-width='3'/></svg>"),
        new kakao.maps.Size(20, 20),
      ),
    }));

    top.forEach((p, i) => {
      const position = new kakao.maps.LatLng(p.y, p.x);
      bounds.extend(position);
      markers.push(new kakao.maps.Marker({ map, position, title: p.place_name }));

      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = p.place_url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = p.place_name;
      const meta = document.createElement("span");
      meta.className = "place-meta";
      meta.textContent = `${p.distance}m · ${p.road_address_name || p.address_name}`;
      li.append(a, meta);
      li.addEventListener("mouseenter", () => map.panTo(position));
      placeList.append(li);
    });
    map.setBounds(bounds);
  }, {
    location: center,
    radius: SEARCH_RADIUS,
    sort: kakao.maps.services.SortBy.DISTANCE,
    category_group_code: "FD6", // 음식점
  });
}
