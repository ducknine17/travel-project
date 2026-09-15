import { useEffect, useRef, useState } from "react";

export const BUS_STATION_MAX_LEVEL = 5;

function KakaoMap({
  places = [],
  stations = [],
  onMapMove,
  onStationClick,
  onStatus,
}) {
  const [ready, setReady] = useState(false);
  const [mapLevel, setMapLevel] = useState(10);
  const mapRef = useRef(null);
  const placeMarkersRef = useRef([]);
  const stationMarkersRef = useRef([]);
  const infoWindowRef = useRef(null);

  // 지도는 처음 한 번만 생성
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      onStatus?.("error");
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => onStatus?.("error"), 12000);
    window.kakao.maps.load(() => {
      if (cancelled) return;
      const container = document.getElementById("map");

      if (!container) return;

      const options = {
        center: new window.kakao.maps.LatLng(36.3, 127.3),
        level: 10,
      };

      const map = new window.kakao.maps.Map(container, options);

      mapRef.current = map;
      setMapLevel(map.getLevel());
      clearTimeout(timer);
      setReady(true);
      onStatus?.("ready");

      // 지도 빈 곳 클릭 → 정보창 닫기
      window.kakao.maps.event.addListener(map, "click", () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
          infoWindowRef.current = null;
        }
      });

      // 지도 드래그 시작 → 정보창 닫기
      window.kakao.maps.event.addListener(map, "dragstart", () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
          infoWindowRef.current = null;
        }
      });

      // 지도 이동/확대축소가 끝났을 때
      window.kakao.maps.event.addListener(map, "idle", () => {
        const center = map.getCenter();
        setMapLevel(map.getLevel());

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

      // 최초 위치에서도 정류장 요청
      const center = map.getCenter();

      if (onMapMove) {
        onMapMove(
          center.getLat(),
          center.getLng()
        );
      }
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
      placeMarkersRef.current.forEach(marker => marker.setMap(null));
      stationMarkersRef.current.forEach(marker => marker.setMap(null));
      infoWindowRef.current?.close();
      mapRef.current = null;
    };
  }, [onMapMove, onStatus]);

  // 여행지 마커
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !window.kakao?.maps) return;

    // 기존 마커 제거
    placeMarkersRef.current.forEach((marker) => {
      marker.setMap(null);
    });

    placeMarkersRef.current = [];

    places.forEach((place) => {
      // 기존 데이터 구조 유지
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
  }, [places, ready]);

  // 버스 정류장 마커
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !window.kakao?.maps) return;

    // 기존 정류장 마커 제거
    stationMarkersRef.current.forEach((marker) => {
      marker.setMap(null);
    });

    stationMarkersRef.current = [];

    // 정류장 목록이나 줌 상태가 바뀌면 열려 있던 정보창도 닫기
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

    // 카카오맵은 level 숫자가 작을수록 더 확대된 상태다.
    if (mapLevel > BUS_STATION_MAX_LEVEL) return;

    // 버스 정류장 전용 아이콘
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

          // 정류장 이름 표시
          const label = document.createElement("div");
          label.style.cssText = "padding:10px 14px;font-size:14px;font-weight:bold;white-space:nowrap;color:#173858";
          label.textContent = `🚌 ${station.name}`;
          const infowindow =
            new window.kakao.maps.InfoWindow({
              content: label,
            });

          infowindow.open(map, marker);

          infoWindowRef.current = infowindow;

          // ⭐ MapPage에 선택한 정류장 전달
          if (onStationClick) {
            onStationClick(station);
          }
        }
      );

      stationMarkersRef.current.push(marker);
    });
  }, [stations, onStationClick, ready, mapLevel]);

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
