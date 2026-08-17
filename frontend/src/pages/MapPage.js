import { useEffect, useState } from "react";
import KakaoMap from "../components/KakaoMap";
import api from "../services/api";

function MapPage() {
  const [filterGroups, setFilterGroups] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [places, setPlaces] = useState([]);
  const [stations, setStations] = useState([]);

  useEffect(() => {
    api.get("/places/filters")
      .then((response) => setFilterGroups(response.data.groups || []))
      .catch((error) => console.log(error));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    selectedFilters.forEach((filter) => params.append("filters", filter));

    api.get("/places", { params })
      .then((response) => {
        setPlaces(response.data.items || []);
      })
      .catch((error) => console.log(error));
  }, [selectedFilters]);

  useEffect(() => {
    api.get("/bus-stations", {
      params: {
        latitude: 36.3,
        longitude: 127.3,
      },
    })
      .then((response) => {
        console.log("🚌 버스 정류장 API 결과:", response.data);
        console.log("🚌 정류장 개수:", response.data?.length);

        setStations(response.data || []);
      })
      .catch((error) => {
        console.log("버스 정류장 불러오기 실패:", error);
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
            <label key={filter.key} style={{ marginRight: "10px" }}>
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

      <KakaoMap places={places} stations={stations} />

      <div style={{ marginTop: "20px" }}>
        {places.map((place) => (
          <div key={place.id}>{place.name}</div>
        ))}
      </div>
    </div>
  );
}

export default MapPage;
