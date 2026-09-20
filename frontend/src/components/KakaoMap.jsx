import { useEffect, useRef, useState } from "react";
import { facilityLabel } from "../data/travelFilters";
import { markerImage } from "./mapMarkers";

export const BUS_STATION_MAX_LEVEL = 5;

function KakaoMap({
  places = [],
  stations = [],
  buses = [],
  routePath = [],
  onPlaceClick,
  onMapMove,
  onStationClick,
  onStatus,
}) {
  const [ready, setReady] = useState(false);
  const [mapLevel, setMapLevel] = useState(10);
  const mapRef = useRef(null);
  const placeMarkersRef = useRef([]);
  const stationMarkersRef = useRef([]);
  const busMarkersRef = useRef([]);
  const routeLineRef = useRef(null);
  const clusterRef = useRef(null);
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

      navigator.geolocation?.getCurrentPosition(({coords}) => {
        if (cancelled) return;
        map.setCenter(new window.kakao.maps.LatLng(coords.latitude, coords.longitude));
        map.setLevel(5); setMapLevel(5);
        onMapMove?.(coords.latitude, coords.longitude);
      }, () => {}, {timeout: 6000, maximumAge: 300000});
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
      busMarkersRef.current.forEach(marker => marker.setMap(null));
      routeLineRef.current?.setMap(null);
      clusterRef.current?.clear();
      mapRef.current = null;
    };
  }, [onMapMove, onStatus]);

  // 여행지 마커
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !window.kakao?.maps) return;

    clusterRef.current?.clear();
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
          image: markerImage("place"),
        });

      window.kakao.maps.event.addListener(marker, "click", () => {
        infoWindowRef.current?.close();
        const label = document.createElement("div");
        label.style.cssText = "padding:12px;max-width:260px;white-space:normal;color:#173858";
        label.textContent = `${place.name} · ${place.address || ""} · ${{tour:"관광지",culture:"문화시설",food:"음식점",stay:"숙박"}[place.type] || "여행지"} · ${(place.tags || []).map(facilityLabel).join(", ")}`;
        const info = new window.kakao.maps.InfoWindow({content: label});
        info.open(map, marker); infoWindowRef.current = info;
        onPlaceClick?.(place);
      });
      placeMarkersRef.current.push(marker);
    });
    if (window.kakao.maps.MarkerClusterer) clusterRef.current = new window.kakao.maps.MarkerClusterer({map, markers: placeMarkersRef.current, averageCenter: true, minLevel: 7});
  }, [places, ready, onPlaceClick]);

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

    const busIcon = markerImage("station");

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

  // 선택한 노선의 정류장 좌표를 순서대로 이어 경로를 표시한다.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !window.kakao?.maps?.Polyline) return;
    routeLineRef.current?.setMap(null);
    routeLineRef.current = null;
    const path = routePath
      .filter(point => Number.isFinite(Number(point.latitude)) && Number.isFinite(Number(point.longitude)))
      .map(point => new window.kakao.maps.LatLng(Number(point.latitude), Number(point.longitude)));
    if (path.length < 2) return;
    routeLineRef.current = new window.kakao.maps.Polyline({
      map,
      path,
      strokeWeight: 6,
      strokeColor: "#517ea6",
      strokeOpacity: 0.82,
      strokeStyle: "solid",
      zIndex: 2,
    });
  }, [routePath, ready]);

  // 실시간 버스 위치와 저상버스 여부를 차량 마커로 표시한다.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    busMarkersRef.current.forEach(marker => marker.setMap(null));
    busMarkersRef.current = buses.filter(bus => Number.isFinite(Number(bus.latitude)) && Number.isFinite(Number(bus.longitude))).map(bus => {
      const isLowFloor = bus.lowFloor === true || String(bus.vehicleType || "").includes("저상");
      const hasVehicleType = bus.lowFloor != null || Boolean(bus.vehicleType);
      const vehicleTypeLabel = isLowFloor ? "♿ 저상버스" : (hasVehicleType ? (bus.vehicleType || "일반버스") : "차량 유형 미제공");
      const marker = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(Number(bus.latitude), Number(bus.longitude)),
        title: bus.vehicleNumber || "운행 버스",
        zIndex: 5,
        image: markerImage(isLowFloor ? "lowBus" : (hasVehicleType ? "bus" : "unknownBus")),
      });
      window.kakao.maps.event.addListener(marker, "click", () => {
        infoWindowRef.current?.close();
        const label = document.createElement("div");
        label.className = "bus-map-info";
        label.textContent = `🚌 ${bus.vehicleNumber || "운행 버스"} · ${vehicleTypeLabel}${bus.nodeName ? ` · ${bus.nodeName} 인근` : ""}`;
        const info = new window.kakao.maps.InfoWindow({content: label});
        info.open(map, marker);
        infoWindowRef.current = info;
      });
      return marker;
    });
  }, [buses, ready]);

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
