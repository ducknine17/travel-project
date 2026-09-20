import { useCallback, useEffect, useRef, useState } from "react";
import KakaoMap from "../components/KakaoMap";
import api from "../services/api";
import { Icon, PageHeading } from "../components/Brand";
import TravelFilters from "../components/TravelFilters";
import PlaceDetail from "../components/PlaceDetail";
import { facilityLabel } from "../data/travelFilters";

export default function MapPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]), [category, setCategory] = useState("");
  const [places, setPlaces] = useState([]), [stations, setStations] = useState([]), [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null), [busArrivals, setBusArrivals] = useState([]);
  const [routes, setRoutes] = useState([]), [buses, setBuses] = useState([]), [routePath, setRoutePath] = useState([]), [activeRoute, setActiveRoute] = useState("");
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [page, setPage] = useState(1), [total, setTotal] = useState(0), [query, setQuery] = useState(""), [search, setSearch] = useState("");
  const [mapStatus, setMapStatus] = useState("loading"), [busLoading, setBusLoading] = useState(false), [busError, setBusError] = useState("");
  const [retry, setRetry] = useState(0);
  const stationRequest = useRef(0), arrivalRequest = useRef(0), routeRequest = useRef(0);
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({page: String(page), page_size: "30"});
    selectedFilters.forEach(filter => params.append("filters", filter));
    if (search) params.set("q", search);
    if (category) params.set("category", category);
    setLoading(true); setError("");
    api.get("/places", {params}).then(r => {
      if (!cancelled) { setPlaces(r.data.items || []); setTotal(r.data.total ?? r.data.items?.length ?? 0); }
    }).catch(() => { if (!cancelled) {setPlaces([]);setTotal(0);setError("여행지를 불러오지 못했어요. 다시 시도해주세요.");} }).finally(() => {if (!cancelled) setLoading(false);});
    return () => {cancelled = true;};
  }, [selectedFilters, category, page, search, retry]);
  const handleMapMove = useCallback((latitude, longitude) => {
    const request = ++stationRequest.current;
    api.get("/bus-stations", {params: {latitude, longitude}}).then(r => {if (request === stationRequest.current) setStations(r.data || []);}).catch(() => {if (request === stationRequest.current) setStations([]);});
  }, []);
  const loadRoute = useCallback(async (station, routeId) => {
    const request = ++routeRequest.current;
    setActiveRoute(routeId); setBuses([]); setRoutePath([]); setBusError(""); setBusLoading(true);
    try {
      const params = {city_code: station.cityCode, route_id: routeId};
      const [locationResult, pathResult] = await Promise.allSettled([
        api.get("/bus-location", {params}),
        api.get("/bus-route-path", {params}),
      ]);
      if (request !== routeRequest.current) return;
      if (locationResult.status === "fulfilled") setBuses(locationResult.value.data || []);
      if (pathResult.status === "fulfilled") setRoutePath(pathResult.value.data || []);
      if (locationResult.status === "rejected" && pathResult.status === "rejected") throw locationResult.reason;
      if (locationResult.status === "rejected") setBusError("차량 위치를 불러오지 못했어요. 노선 경로만 표시합니다.");
      else if (pathResult.status === "rejected") setBusError("노선 경로를 불러오지 못했어요. 차량 위치만 표시합니다.");
    } catch {if (request === routeRequest.current) setBusError("차량 위치와 노선 경로를 불러오지 못했어요.");}
    finally {if (request === routeRequest.current) setBusLoading(false);}
  }, []);
  const handleStationClick = useCallback(async station => {
    const request = ++arrivalRequest.current; ++routeRequest.current;
    setSelectedStation(station); setBusArrivals([]); setRoutes([]); setBuses([]); setRoutePath([]); setActiveRoute(""); setBusError(""); setBusLoading(true);
    try {
      if (station.locationSupported) {
        const r = await api.get("/bus-routes", {params: {city_code: station.cityCode, node_id: station.id, ars_id: station.arsId}});
        if (request !== arrivalRequest.current) return;
        setRoutes(r.data || []);
        if (r.data?.[0]) await loadRoute(station, r.data[0].routeId);
      }
      if (station.arrivalSupported !== false && station.cityCode) {
        const r = await api.get("/bus-arrival", {params: {city_code: station.cityCode, node_id: station.id}});
        if (request === arrivalRequest.current) setBusArrivals(r.data || []);
      }
    } catch {if (request === arrivalRequest.current) setBusError("버스 정보를 불러오지 못했어요.");}
    finally {if (request === arrivalRequest.current) setBusLoading(false);}
  }, [loadRoute]);
  useEffect(() => {
    if (!selectedStation?.cityCode || !activeRoute) return undefined;
    let cancelled = false;
    const refresh = () => api.get("/bus-location", {
      params: {city_code: selectedStation.cityCode, route_id: activeRoute},
    }).then(r => {if (!cancelled) setBuses(r.data || []);}).catch(() => {});
    const interval = window.setInterval(refresh, 30000);
    return () => {cancelled = true; window.clearInterval(interval);};
  }, [selectedStation, activeRoute]);
  return <main className="page-shell map-page" id="main-content">
    <PageHeading eyebrow="FIND YOUR NEXT FOOTPRINT" title="여행 지도" description="나에게 편안한 길을 찾아, 한 걸음 더." bag/>
    <form className="map-search" onSubmit={e => {e.preventDefault();setSearch(query.trim());setPage(1);}}><label className="search-field"><Icon name="search" size={18}/><input type="search" aria-label="지도에서 장소 검색" placeholder="장소명이나 지역을 검색해보세요" value={query} onChange={e => setQuery(e.target.value)}/></label><button className="button primary" type="submit">찾기</button></form>
    <div className="map-layout">
      <aside className="map-filters"><button type="button" className="mobile-filter-toggle" aria-expanded={filtersOpen} aria-controls="map-filter-body" onClick={() => setFiltersOpen(open => !open)}>여행 조건 {selectedFilters.length + (category ? 1 : 0)}개 · {filtersOpen ? "접기" : "필터 펼치기"}</button><div id="map-filter-body" className={filtersOpen ? "map-filter-body" : "map-filter-body collapsed"}><h2><Icon name="compass" size={21}/> 편안한 여행의 조건</h2><TravelFilters category={category} onCategory={value => {setCategory(value);setPage(1);}} selected={selectedFilters} onToggle={key => {setPage(1);setSelectedFilters(current => current.includes(key) ? current.filter(k => k !== key) : [...current,key]);}} onReset={() => {setSelectedFilters([]);setCategory("");setPage(1);}}/><p className="settings-note">선택한 시설 정보가 모두 등록된 장소를 찾아요.</p></div></aside>
      <section className="map-content">
        <section className="place-results"><div className="section-heading"><h2>함께 떠날 수 있는 곳 <span>{total}</span></h2><span className="settings-note">장소를 누르면 사진과 리뷰가 열려요</span></div>
          {loading ? <p role="status">여행지를 찾고 있어요…</p> : error ? <div className="notice" role="alert">{error}<button onClick={() => setRetry(v => v+1)}>다시 불러오기</button></div> : !places.length ? <p className="status-message">조건에 맞는 여행지가 없어요. 검색어나 필터를 바꿔보세요.</p> : <div className="place-results-list">{places.map(place => <button type="button" className="place-result" key={place.id} onClick={() => setSelectedPlace(place)}><strong><Icon name="pin" size={15}/> {place.name}</strong><p>{place.address}</p><div className="place-tags">{(place.tags || []).slice(0, 3).map(tag => <span key={tag}>{facilityLabel(tag)}</span>)}</div><span className="place-open">장소 상세·리뷰 <Icon name="arrow" size={13}/></span></button>)}</div>}
          {total > 30 && <nav className="button-row" aria-label="여행지 목록 페이지"><button disabled={page === 1 || loading} onClick={() => setPage(p => p-1)}>이전</button><span className="pagination-label">{page} / {Math.ceil(total/30)}</span><button disabled={page >= Math.ceil(total/30) || loading} onClick={() => setPage(p => p+1)}>다음</button></nav>}
        </section>
        <div className="map-stage"><KakaoMap places={places} stations={stations} buses={buses} routePath={routePath} onPlaceClick={setSelectedPlace} onMapMove={handleMapMove} onStationClick={handleStationClick} onStatus={setMapStatus}/>{mapStatus !== "ready" && <div className="map-status" role="status"><div><Icon name="map" size={35}/><h3>{mapStatus === "error" ? "지도를 펼치지 못했어요" : "지도를 펼치는 중…"}</h3><p>{mapStatus === "error" ? "지도 서비스 연결을 확인해주세요. 여행지 목록에서 사진과 리뷰를 볼 수 있어요." : "잠시만 기다려주세요."}</p></div></div>}</div>
        <div className="map-legend"><span><Icon name="pin" size={16}/>지도 장소 {places.length}개 · 현재 목록 기준</span>{activeRoute ? <><span className="route-legend">선택 노선 경로</span><span className="bus-legend normal">일반 버스</span><span className="bus-legend low-floor">저상 버스 ♿</span><span className="bus-legend unknown">차량 유형 미제공</span></> : <span>확대 후 정류장을 눌러 버스 정보를 확인하세요.</span>}</div>
        {stations.some(s => s.source === "openstreetmap") && <small>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></small>}
        {selectedStation && <section className="bus-panel" aria-live="polite"><h3>{selectedStation.name}</h3>{busLoading && <p>버스 정보를 확인하는 중…</p>}{busError && <p role="alert">{busError}</p>}{selectedStation.arrivalSupported === false && <p className="settings-note">이 정류장은 실시간 도착 정보는 지원하지 않습니다.</p>}<div className="filter-pills">{routes.map(route => <button key={route.routeId} aria-pressed={activeRoute === route.routeId} onClick={() => loadRoute(selectedStation, route.routeId)}>{route.routeName}</button>)}</div>{activeRoute && <p>노선 경로와 운행 차량 {buses.length}대를 표시했습니다. 저상버스는 초록색 ♿ 마커로 구분됩니다.</p>}{!busLoading && !busArrivals.length && selectedStation.arrivalSupported !== false && <p>현재 도착 예정 버스가 없습니다.</p>}{busArrivals.map((bus,index) => <div className="bus-row" key={`${bus.routeId}-${index}`}><span className={`bus-type ${String(bus.vehicleType || "").includes("저상") ? "low-floor" : ""}`}><Icon name="bus"/>{bus.vehicleType || "차량 정보 미제공"}</span><strong>{bus.routeName}번</strong>{bus.remainingStops != null && ` · ${bus.remainingStops}정거장 전`}{bus.arrivalTime != null && ` · 약 ${Math.max(1,Math.ceil(Number(bus.arrivalTime)/60))}분 후`}</div>)}</section>}
      </section>
    </div>
    {selectedPlace && <PlaceDetail key={selectedPlace.id} place={selectedPlace} onClose={() => setSelectedPlace(null)}/>}
  </main>;
}
