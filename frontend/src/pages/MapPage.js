import { useCallback, useEffect, useRef, useState } from "react";
import KakaoMap from "../components/KakaoMap";
import api from "../services/api";

function MapPage() {
  const [filterGroups, setFilterGroups] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [places, setPlaces] = useState([]);
  const [stations, setStations] = useState([]);

  // 추가
  const [selectedStation, setSelectedStation] = useState(null);
  const [busArrivals, setBusArrivals] = useState([]);
  const [busRoutes, setBusRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [buses, setBuses] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationsError, setStationsError] = useState("");
  const [arrivalStatus, setArrivalStatus] = useState("idle");
  const [routeStatus, setRouteStatus] = useState("idle");
  const [locationStatus, setLocationStatus] = useState("idle");
  const stationRequestIdRef = useRef(0);
  const routeRequestIdRef = useRef(0);

  useEffect(() => {
    api.get("/places/filters")
      .then((response) => setFilterGroups(response.data.groups || []))
      .catch((error) => console.log(error));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();

    selectedFilters.forEach((filter) =>
      params.append("filters", filter)
    );

    api.get("/places", { params })
      .then((response) => {
        setPlaces(response.data.items || []);
      })
      .catch((error) => console.log(error));
  }, [selectedFilters]);

  // 지도 이동이 끝났을 때 주변 정류장 검색
  const handleMapMove = useCallback((latitude, longitude) => {
    console.log("🗺️ 지도 이동:", latitude, longitude);
    const requestId = stationRequestIdRef.current + 1;
    stationRequestIdRef.current = requestId;
    routeRequestIdRef.current += 1;
    setStationsLoading(true);
    setStationsError("");
    setSelectedStation(null);
    setBusArrivals([]);
    setBusRoutes([]);
    setSelectedRoute(null);
    setBuses([]);
    setArrivalStatus("idle");
    setRouteStatus("idle");
    setLocationStatus("idle");

    api.get("/bus-stations", {
      params: {
        latitude,
        longitude,
      },
    })
      .then((response) => {
        if (stationRequestIdRef.current !== requestId) return;
        console.log("🚌 정류장 갱신:", response.data);
        console.log("🚌 정류장 개수:", response.data?.length);

        setStations(response.data || []);
      })
      .catch((error) => {
        if (stationRequestIdRef.current !== requestId) return;
        console.log("버스 정류장 불러오기 실패:", error);
        setStations([]);
        setStationsError("주변 버스 정류장을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (stationRequestIdRef.current === requestId) {
          setStationsLoading(false);
        }
      });
  }, []);

  // 정류장 클릭 시 해당 정류장의 버스 도착정보 가져오기
  const handleStationClick = useCallback((station) => {
    console.log("🚏 선택한 정류장:", station);

    setSelectedStation(station);
    setBusArrivals([]);
    setBusRoutes([]);
    setSelectedRoute(null);
    setBuses([]);

    const routeRequestId = routeRequestIdRef.current + 1;
    routeRequestIdRef.current = routeRequestId;

    if (station.locationSupported === false || !station.cityCode) {
      setRouteStatus("unsupported");
    } else {
      setRouteStatus("loading");
      api.get("/bus-routes", {
        params: {
          city_code: station.cityCode,
          node_id: station.id,
          ...(station.arsId ? { ars_id: station.arsId } : {}),
        },
      })
        .then((response) => {
          if (routeRequestIdRef.current !== routeRequestId) return;
          const routes = response.data || [];
          setBusRoutes(routes);
          setRouteStatus(routes.length ? "ready" : "empty");
          setSelectedRoute(routes[0] || null);
        })
        .catch((error) => {
          if (routeRequestIdRef.current !== routeRequestId) return;
          console.log("정류장 노선정보 불러오기 실패:", error);
          setBusRoutes([]);
          setRouteStatus("error");
        });
    }

    if (station.arrivalSupported === false || !station.cityCode) {
      setArrivalStatus("unsupported");
      return;
    }

    setArrivalStatus("loading");

    api.get("/bus-arrival", {
      params: {
        city_code: station.cityCode,
        node_id: station.id,
      },
    })
      .then((response) => {
        console.log("🚌 버스 도착정보:", response.data);

        setBusArrivals(response.data || []);
        setArrivalStatus((response.data || []).length ? "ready" : "empty");
      })
      .catch((error) => {
        console.log("버스 도착정보 불러오기 실패:", error);
        setBusArrivals([]);
        setArrivalStatus("error");
      });
  }, []);

  // 선택 노선의 차량 좌표를 즉시 조회하고 15초마다 갱신
  useEffect(() => {
    if (!selectedStation?.cityCode || !selectedRoute?.routeId) {
      setBuses([]);
      setLocationStatus("idle");
      return undefined;
    }

    let active = true;
    let hasLoaded = false;

    const loadBusLocations = () => {
      if (!hasLoaded) setLocationStatus("loading");
      api.get("/bus-location", {
        params: {
          city_code: selectedStation.cityCode,
          route_id: selectedRoute.routeId,
        },
      })
        .then((response) => {
          if (!active) return;
          const nextBuses = response.data || [];
          setBuses(nextBuses);
          setLocationStatus(nextBuses.length ? "ready" : "empty");
          hasLoaded = true;
        })
        .catch((error) => {
          if (!active) return;
          console.log("실시간 버스 위치 불러오기 실패:", error);
          setLocationStatus("error");
          hasLoaded = true;
        });
    };

    loadBusLocations();
    const intervalId = window.setInterval(loadBusLocations, 15000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [selectedRoute, selectedStation]);

  const toggleFilter = (filterKey) => {
    setSelectedFilters((current) =>
      current.includes(filterKey)
        ? current.filter((key) => key !== filterKey)
        : [...current, filterKey]
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>여행 지도</h1>

      {filterGroups.map((group) => (
        <div key={group.key} style={{ marginBottom: "10px" }}>
          <strong>{group.label}: </strong>

          {group.filters.map((filter) => (
            <label
              key={filter.key}
              style={{ marginRight: "10px" }}
            >
              <input
                type="checkbox"
                checked={selectedFilters.includes(filter.key)}
                onChange={() => toggleFilter(filter.key)}
              />

              {filter.label}
            </label>
          ))}
        </div>
      ))}

      <KakaoMap
        places={places}
        stations={stations}
        buses={buses}
        onMapMove={handleMapMove}
        onStationClick={handleStationClick}
      />

      {stationsLoading && <p role="status">주변 버스 정류장을 찾는 중입니다...</p>}
      {stationsError && <p role="alert">{stationsError}</p>}
      {!stationsLoading && !stationsError && stations.length === 0 && (
        <p>현재 지도 중심 주변에서 정류장을 찾지 못했습니다.</p>
      )}
      {stations.some((station) => station.source === "openstreetmap") && (
        <small>
          공공 API 연결 지연으로 보조 정류장 데이터를 표시합니다. © OpenStreetMap contributors
        </small>
      )}

      {/* 정류장 버스 도착정보 */}
      {selectedStation && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >
          <h3>🚌 {selectedStation.name}</h3>

          <div style={{ marginBottom: "12px" }}>
            <strong>실시간 차량 위치</strong>
            {routeStatus === "loading" ? (
              <p>운행 노선을 불러오는 중입니다...</p>
            ) : routeStatus === "unsupported" ? (
              <p>이 정류장은 실시간 차량 위치를 지원하지 않습니다.</p>
            ) : routeStatus === "error" ? (
              <p role="alert">운행 노선을 불러오지 못했습니다.</p>
            ) : routeStatus === "empty" ? (
              <p>현재 확인 가능한 운행 노선이 없습니다.</p>
            ) : busRoutes.length > 0 ? (
              <>
                <div style={{ marginTop: "8px" }}>
                  {busRoutes.map((route) => (
                    <button
                      type="button"
                      key={route.routeId}
                      onClick={() => setSelectedRoute(route)}
                      aria-pressed={selectedRoute?.routeId === route.routeId}
                      style={{ margin: "0 6px 6px 0" }}
                    >
                      {route.routeName || route.routeId}
                    </button>
                  ))}
                </div>
                {locationStatus === "loading" ? (
                  <p>차량 위치를 불러오는 중입니다...</p>
                ) : locationStatus === "error" ? (
                  <p role="alert">실시간 차량 위치를 불러오지 못했습니다.</p>
                ) : locationStatus === "empty" ? (
                  <p>현재 운행 중인 차량이 없습니다.</p>
                ) : locationStatus === "ready" ? (
                  <p>지도에 운행 차량 {buses.length}대를 표시했습니다. (15초마다 갱신)</p>
                ) : null}
              </>
            ) : null}
          </div>

          {arrivalStatus === "loading" ? (
            <p>도착 정보를 불러오는 중입니다...</p>
          ) : arrivalStatus === "unsupported" ? (
            <p>이 정류장은 실시간 도착 정보는 지원하지 않습니다.</p>
          ) : arrivalStatus === "error" ? (
            <p role="alert">버스 도착 정보를 불러오지 못했습니다.</p>
          ) : busArrivals.length === 0 ? (
            <p>현재 도착 예정 버스가 없습니다.</p>
          ) : (
            busArrivals.map((bus, index) => (
              <div
                key={`${bus.routeId}-${index}`}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <strong>{bus.routeName}번</strong>

                {bus.vehicleType && (
                  <>
                    {" · "}
                    {bus.vehicleType}
                  </>
                )}

                {bus.remainingStops != null && (
                  <>
                    {" · "}
                    {bus.remainingStops}정거장 전
                  </>
                )}

                {bus.arrivalTime != null && (
                  <>
                    {" · "}
                    약 {Math.max(
                      1,
                      Math.ceil(Number(bus.arrivalTime) / 60)
                    )}분 후
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default MapPage;
