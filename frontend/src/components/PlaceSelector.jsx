import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const PLACE_TYPE_LABELS = {
  tour: "관광지",
  culture: "문화시설",
  festival: "축제",
  sports: "레포츠",
  stay: "숙박",
  shopping: "쇼핑",
  food: "음식점",
};

function PlaceSelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || hasLoaded) return undefined;

    let isCancelled = false;

    const loadLegacyPlaceOptions = async () => {
      const firstResponse = await api.get("/places", {
        params: { page: 1, page_size: 100 },
      });
      const firstData = firstResponse.data;
      const pageCount = Math.ceil((firstData.total || 0) / 100);
      const remainingRequests = [];

      for (let page = 2; page <= pageCount; page += 1) {
        remainingRequests.push(
          api.get("/places", { params: { page, page_size: 100 } })
        );
      }

      const remainingResponses = await Promise.all(remainingRequests);
      return [
        ...(firstData.items || []),
        ...remainingResponses.flatMap((response) => response.data.items || []),
      ];
    };

    const loadPlaces = async () => {
      setIsLoading(true);
      setError("");

      try {
        let loadedPlaces;

        try {
          const response = await api.get("/place-options");
          loadedPlaces = response.data || [];
        } catch {
          loadedPlaces = await loadLegacyPlaceOptions();
        }

        if (!isCancelled) {
          setPlaces(loadedPlaces);
          setHasLoaded(true);
        }
      } catch (requestError) {
        console.error(requestError);
        if (!isCancelled) {
          setPlaces([]);
          setError("장소 목록을 불러오지 못했습니다.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPlaces();

    return () => {
      isCancelled = true;
    };
  }, [hasLoaded, isOpen]);

  const filteredPlaces = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("ko-KR");
    if (!keyword) return places;

    return places.filter((place) =>
      [place.name, place.address].some((field) =>
        field?.toLocaleLowerCase("ko-KR").includes(keyword)
      )
    );
  }, [places, query]);

  const selectPlace = (place) => {
    onChange(place.name);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        {value ? "장소 변경" : "장소 선택"}
      </button>

      <p style={{ color: value ? "#333" : "gray" }}>
        {value ? `📍 ${value}` : "아직 선택된 장소가 없습니다."}
      </p>

      {isOpen && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backgroundColor: "rgba(0, 0, 0, 0.45)",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="place-selector-title"
            style={{
              width: "min(600px, 100%)",
              maxHeight: "75vh",
              display: "flex",
              flexDirection: "column",
              padding: "24px",
              borderRadius: "12px",
              backgroundColor: "white",
              boxShadow: "0 12px 36px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h2 id="place-selector-title" style={{ margin: 0 }}>
                장소 선택
              </h2>
              <button
                type="button"
                aria-label="장소 선택 닫기"
                onClick={() => setIsOpen(false)}
                style={{ marginLeft: "auto" }}
              >
                닫기
              </button>
            </div>

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="장소명 또는 주소를 검색하세요."
              autoFocus
              style={{ marginTop: "18px", padding: "12px" }}
            />

            <div
              style={{
                minHeight: "120px",
                marginTop: "14px",
                overflowY: "auto",
                borderTop: "1px solid #eee",
              }}
            >
              {isLoading ? (
                <p style={{ color: "#666" }}>장소를 불러오는 중입니다...</p>
              ) : error ? (
                <p role="alert" style={{ color: "#c62828" }}>{error}</p>
              ) : filteredPlaces.length === 0 ? (
                <p style={{ color: "#666" }}>검색 결과가 없습니다.</p>
              ) : (
                filteredPlaces.map((place) => (
                  <button
                    type="button"
                    key={place.id}
                    onClick={() => selectPlace(place)}
                    style={{
                      width: "100%",
                      padding: "14px 8px",
                      border: "none",
                      borderBottom: "1px solid #eee",
                      backgroundColor: value === place.name ? "#eef4ff" : "white",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <strong>{place.name}</strong>
                    <span style={{ display: "block", marginTop: "4px", color: "#666" }}>
                      {[PLACE_TYPE_LABELS[place.type] || place.type, place.address]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PlaceSelector;
