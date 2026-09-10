import { useEffect, useRef, useState } from "react";

const PLACE_TYPE_LABELS = {
  tour: "관광지",
  culture: "문화시설",
  festival: "축제",
  sports: "레포츠",
  stay: "숙박",
  shopping: "쇼핑",
  food: "음식점",
};

const ACCESSIBILITY_LABELS = {
  parking: "주차",
  publictransport: "대중교통",
  route: "접근로",
  wheelchair: "휠체어",
  exit: "출입통로",
  elevator: "엘리베이터",
  restroom: "화장실",
  braileblock: "점자블록",
  helpdog: "보조견 동반",
  signguide: "수어 안내",
  stroller: "유모차",
  lactationroom: "수유실",
};

const createInfoContent = (title, rows = []) => {
  const content = document.createElement("div");
  Object.assign(content.style, {
    width: "240px",
    padding: "12px 14px",
    color: "#1f2937",
    fontSize: "13px",
    lineHeight: "1.5",
    wordBreak: "keep-all",
  });

  const heading = document.createElement("strong");
  heading.textContent = title;
  Object.assign(heading.style, {
    display: "block",
    marginBottom: "6px",
    fontSize: "15px",
  });
  content.appendChild(heading);

  rows.filter(Boolean).forEach((row) => {
    const line = document.createElement("div");
    line.textContent = row;
    line.style.marginTop = "3px";
    content.appendChild(line);
  });

  return content;
};

function KakaoMap({
  places = [],
  stations = [],
  buses = [],
  onMapMove,
  onPlaceClick,
  onStationClick,
}) {
  const [map, setMap] = useState(null);
  const placeMarkersRef = useRef([]);
  const placeClustererRef = useRef(null);
  const stationMarkersRef = useRef([]);
  const busMarkersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const lastReportedCenterRef = useRef("");

  // 지도는 처음 한 번만 생성
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      console.error("카카오 지도가 아직 로드되지 않았습니다.");
      return;
    }

    let isDisposed = false;

    window.kakao.maps.load(() => {
      if (isDisposed) return;

      const container = document.getElementById("map");

      if (!container) return;

      const options = {
        center: new window.kakao.maps.LatLng(36.3, 127.3),
        level: 10,
      };

      const createdMap = new window.kakao.maps.Map(container, options);
      setMap(createdMap);

      const reportCenter = (latitude, longitude) => {
        const centerKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
        if (lastReportedCenterRef.current === centerKey) return;

        lastReportedCenterRef.current = centerKey;
        onMapMove?.(latitude, longitude);
      };

      const closeInfoWindow = () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
          infoWindowRef.current = null;
        }
      };

      // 지도 빈 곳 클릭 → 정보창 닫기
      window.kakao.maps.event.addListener(createdMap, "click", closeInfoWindow);

      // 지도 드래그 시작 → 정보창 닫기
      window.kakao.maps.event.addListener(createdMap, "dragstart", closeInfoWindow);

      // 지도 이동/확대축소가 끝났을 때
      const handleIdle = () => {
        const center = createdMap.getCenter();
        const latitude = center.getLat();
        const longitude = center.getLng();

        console.log(
          "🗺️ 현재 지도 위치:",
          latitude,
          longitude
        );

        reportCenter(latitude, longitude);
      };
      window.kakao.maps.event.addListener(createdMap, "idle", handleIdle);

      const reportDefaultCenter = () => {
        const center = createdMap.getCenter();
        reportCenter(center.getLat(), center.getLng());
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            if (isDisposed) return;

            const latitude = Number(coords.latitude);
            const longitude = Number(coords.longitude);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
              reportDefaultCenter();
              return;
            }

            createdMap.setCenter(new window.kakao.maps.LatLng(latitude, longitude));
            createdMap.setLevel(5);
            reportCenter(latitude, longitude);
          },
          reportDefaultCenter,
          {
            enableHighAccuracy: false,
            timeout: 7000,
            maximumAge: 300000,
          }
        );
      } else {
        reportDefaultCenter();
      }
    });

    return () => {
      isDisposed = true;
    };
  }, [onMapMove]);

  // 여행지 마커
  useEffect(() => {
    if (!map || !window.kakao?.maps) return;

    // 기존 마커 제거
    if (placeClustererRef.current) {
      placeClustererRef.current.clear();
      placeClustererRef.current = null;
    }
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

      window.kakao.maps.event.addListener(marker, "click", () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }

        const facilities = (place.tags || [])
          .map((tag) => ACCESSIBILITY_LABELS[tag] || tag)
          .join(", ");
        const infoWindow = new window.kakao.maps.InfoWindow({
          content: createInfoContent(`📍 ${place.name}`, [
            PLACE_TYPE_LABELS[place.type] || place.type,
            place.address,
            facilities && `편의시설: ${facilities}`,
          ]),
          removable: true,
        });

        infoWindow.open(map, marker);
        infoWindowRef.current = infoWindow;
        onPlaceClick?.(place);
      });

      placeMarkersRef.current.push(marker);
    });

    if (window.kakao.maps.MarkerClusterer) {
      placeClustererRef.current = new window.kakao.maps.MarkerClusterer({
        map,
        markers: placeMarkersRef.current,
        averageCenter: true,
        minLevel: 7,
      });
    }
  }, [map, places, onPlaceClick]);

  // 버스 정류장 마커
  useEffect(() => {
    if (!map || !window.kakao?.maps) return;

    // 기존 정류장 마커 제거
    stationMarkersRef.current.forEach((marker) => {
      marker.setMap(null);
    });

    stationMarkersRef.current = [];

    // 정류장 목록이 바뀌면 기존 정보창도 닫기
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

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
          const infowindow =
            new window.kakao.maps.InfoWindow({
              content: createInfoContent(`🚌 ${station.name}`, [
                station.routes?.length && `노선: ${station.routes.join(", ")}`,
                station.locationSupported && "실시간 차량 위치 제공",
                station.arrivalSupported === false &&
                  !station.locationSupported &&
                  "정류장 위치만 제공",
              ]),
              removable: true,
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
  }, [map, stations, onStationClick]);

  // 선택한 노선의 실시간 운행 차량 마커
  useEffect(() => {
    if (!map || !window.kakao?.maps) return;

    busMarkersRef.current.forEach((marker) => marker.setMap(null));
    busMarkersRef.current = [];

    const liveBusIconSvg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#ef4444" stroke="white" stroke-width="3" />
        <text x="20" y="27" text-anchor="middle" font-size="20">🚌</text>
      </svg>
    `;
    const liveBusIcon = new window.kakao.maps.MarkerImage(
      "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(liveBusIconSvg),
      new window.kakao.maps.Size(40, 40),
      { offset: new window.kakao.maps.Point(20, 20) }
    );

    buses.forEach((bus) => {
      const latitude = Number(bus.latitude);
      const longitude = Number(bus.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      const marker = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(latitude, longitude),
        title: bus.vehicleNumber || "운행 중인 버스",
        image: liveBusIcon,
        zIndex: 5,
      });

      window.kakao.maps.event.addListener(marker, "click", () => {
        if (infoWindowRef.current) infoWindowRef.current.close();
        const infoWindow = new window.kakao.maps.InfoWindow({
          content: createInfoContent("🚌 운행 중인 버스", [
            bus.vehicleNumber && `차량번호: ${bus.vehicleNumber}`,
            bus.nodeName && `인근 정류장: ${bus.nodeName}`,
            bus.updatedAt && `갱신시각: ${bus.updatedAt}`,
          ]),
          removable: true,
        });
        infoWindow.open(map, marker);
        infoWindowRef.current = infoWindow;
      });

      busMarkersRef.current.push(marker);
    });
  }, [map, buses]);

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
