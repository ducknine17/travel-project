import { useCallback, useEffect, useState } from "react";
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

    api.get("/bus-stations", {
      params: {
        latitude,
        longitude,
      },
    })
      .then((response) => {
        console.log("🚌 정류장 갱신:", response.data);
        console.log("🚌 정류장 개수:", response.data?.length);

        setStations(response.data || []);
      })
      .catch((error) => {
        console.log("버스 정류장 불러오기 실패:", error);
      });
  }, []);

  // 정류장 클릭 시 해당 정류장의 버스 도착정보 가져오기
  const handleStationClick = useCallback((station) => {
    console.log("🚏 선택한 정류장:", station);

    setSelectedStation(station);
    setBusArrivals([]);

    api.get("/bus-arrivals", {
      params: {
        city_code: station.cityCode,
        node_id: station.id,
      },
    })
      .then((response) => {
        console.log("🚌 버스 도착정보:", response.data);

        setBusArrivals(response.data || []);
      })
      .catch((error) => {
        console.log("버스 도착정보 불러오기 실패:", error);
        setBusArrivals([]);
      });
  }, []);

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
        onMapMove={handleMapMove}
        onStationClick={handleStationClick}
      />

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

          {busArrivals.length === 0 ? (
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

      <div style={{ marginTop: "20px" }}>
        {places.map((place) => (
          <div key={place.id}>{place.name}</div>
        ))}
      </div>
    </div>
  );
}

export default MapPage;