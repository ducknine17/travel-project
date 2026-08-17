import { useEffect } from "react";

function KakaoMap({ places = [], buses = [], stations = [] }) {
  useEffect(() => {
    const loadKakaoMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        setTimeout(loadKakaoMap, 100);
        return;
      }

      window.kakao.maps.load(() => {
        const container = document.getElementById("map");

        const options = {
          center: new window.kakao.maps.LatLng(36.3, 127.3),
          level: 3,
        };

        const map = new window.kakao.maps.Map(container, options);
        const bounds = new window.kakao.maps.LatLngBounds();
        let markerCount = 0;

        places.forEach((place) => {
          const latitude = Number(place.lng);
          const longitude = Number(place.lat);

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return;
          }

          const position = new window.kakao.maps.LatLng(
            latitude,
            longitude
          );

          new window.kakao.maps.Marker({
            map,
            position,
            title: place.name,
          });

          bounds.extend(position);
          markerCount += 1;
        });

        stations.forEach((station) => {
          const latitude = Number(station.latitude);
          const longitude = Number(station.longitude);

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return;
          }

          const position = new window.kakao.maps.LatLng(
            latitude,
            longitude
          );

          // 버스 정류장 전용 아이콘
          const busStopSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
              <circle cx="20" cy="20" r="18" fill="white" stroke="#333" stroke-width="2"/>
              <text
                x="20"
                y="26"
                text-anchor="middle"
                font-size="20"
              >🚏</text>
            </svg>
          `;

          const busStopImage = new window.kakao.maps.MarkerImage(
            "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(busStopSvg),
            new window.kakao.maps.Size(40, 40),
            {
              offset: new window.kakao.maps.Point(20, 20),
            }
          );

          const marker = new window.kakao.maps.Marker({
            map,
            position,
            title: station.name,
            image: busStopImage,
          });

          // 정류장 클릭 시 이름 표시
          const infoWindow = new window.kakao.maps.InfoWindow({
            content: `
              <div style="
                padding: 10px;
                font-size: 14px;
                white-space: nowrap;
              ">
                🚏 ${station.name}
              </div>
            `,
          });

          window.kakao.maps.event.addListener(marker, "click", () => {
            infoWindow.open(map, marker);
          });
        });

        if (markerCount > 0) {
          map.setBounds(bounds);
        }
      });
    };

    loadKakaoMap();
  }, [places, stations]);

  return (
    <div
      id="map"
      style={{
        width: "100%",
        height: "500px",
      }}
    />
  );
}

export default KakaoMap;