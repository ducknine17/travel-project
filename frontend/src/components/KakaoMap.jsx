import { useEffect, useRef } from "react";

function KakaoMap({
  places = [],
  stations = [],
  onMapMove,
}) {
  const mapRef = useRef(null);
  const placeMarkersRef = useRef([]);
  const stationMarkersRef = useRef([]);
  const infoWindowRef = useRef(null);

  // 지도 생성
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      console.error("카카오 지도가 아직 로드되지 않았습니다.");
      return;
    }

    window.kakao.maps.load(() => {
      const container = document.getElementById("map");

      if (!container) return;

      const options = {
        center: new window.kakao.maps.LatLng(36.3, 127.3),
        level: 10,
      };

      const map = new window.kakao.maps.Map(container, options);

      mapRef.current = map;

      // 지도 빈 곳을 클릭하면 정보창 닫기
      window.kakao.maps.event.addListener(map, "click", () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
          infoWindowRef.current = null;
        }
      });

      // 지도를 움직이기 시작하면 정보창 닫기
      window.kakao.maps.event.addListener(map, "dragstart", () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
          infoWindowRef.current = null;
        }
      });

      // 지도 이동이 끝났을 때
      window.kakao.maps.event.addListener(map, "idle", () => {
        const center = map.getCenter();

        const latitude = center.getLat();
        const longitude = center.getLng();

        console.log(
          "🗺️ 현재 지도 위치:",
          latitude,
          longitude
        );

        if (onMapMove) {
          onMapMove(latitude, longitude);
        }
      });

      // 처음 지도 위치의 정류장도 불러오기
      const center = map.getCenter();

      if (onMapMove) {
        onMapMove(
          center.getLat(),
          center.getLng()
        );
      }
    });
  }, [onMapMove]);

  // 여행지 마커 업데이트
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !window.kakao?.maps) return;

    // 기존 여행지 마커 제거
    placeMarkersRef.current.forEach((marker) => {
      marker.setMap(null);
    });

    placeMarkersRef.current = [];

    places.forEach((place) => {
      const latitude = Number(place.lng);
      const longitude = Number(place.lat);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return;
      }

      const position =
        new window.kakao.maps.LatLng(
          latitude,
          longitude
        );

      const marker =
        new window.kakao.maps.Marker({
          map,
          position,
          title: place.name,
        });

      placeMarkersRef.current.push(marker);
    });
  }, [places]);

  // 버스 정류장 마커 업데이트
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !window.kakao?.maps) return;

    // 기존 정류장 마커 제거
    stationMarkersRef.current.forEach((marker) => {
      marker.setMap(null);
    });

    stationMarkersRef.current = [];

    // 기존 정보창 닫기
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

    // 버스 아이콘
    const busIconSvg = `
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="white"
          stroke="#4A90E2"
          stroke-width="2"
        />

        <text
          x="18"
          y="24"
          text-anchor="middle"
          font-size="18"
        >🚌</text>
      </svg>
    `;

    const busIcon =
      new window.kakao.maps.MarkerImage(
        "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(busIconSvg),
        new window.kakao.maps.Size(36, 36),
        {
          offset: new window.kakao.maps.Point(18, 18),
        }
      );

    stations.forEach((station) => {
      const latitude = Number(station.latitude);
      const longitude = Number(station.longitude);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return;
      }

      const position =
        new window.kakao.maps.LatLng(
          latitude,
          longitude
        );

      const marker =
        new window.kakao.maps.Marker({
          map,
          position,
          title: station.name,
          image: busIcon,
        });

      // 정류장 클릭
      window.kakao.maps.event.addListener(
        marker,
        "click",
        () => {
          // 기존 정보창 닫기
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }

          const infowindow =
            new window.kakao.maps.InfoWindow({
              content: `
                <div
                  style="
                    padding: 10px 14px;
                    font-size: 14px;
                    font-weight: bold;
                    white-space: nowrap;
                  "
                >
                  🚌 ${station.name}
                </div>
              `,
            });

          infowindow.open(map, marker);

          infoWindowRef.current = infowindow;
        }
      );

      stationMarkersRef.current.push(marker);
    });
  }, [stations]);

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