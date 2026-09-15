import { useCallback, useEffect, useRef, useState } from "react";
import KakaoMap from "../components/KakaoMap";
import api from "../services/api";
import { Icon, Mascot, PageHeading } from "../components/Brand";

export default function MapPage() {
  const [filterGroups,setFilterGroups] = useState([]), [selectedFilters,setSelectedFilters] = useState([]);
  const [places,setPlaces] = useState([]), [stations,setStations] = useState([]);
  const [selectedStation,setSelectedStation] = useState(null), [busArrivals,setBusArrivals] = useState([]);
  const [loading,setLoading] = useState(true), [error,setError] = useState(""), [filterError,setFilterError] = useState("");
  const [page,setPage] = useState(1), [total,setTotal] = useState(0), [query,setQuery] = useState(""), [search,setSearch] = useState("");
  const [mapStatus,setMapStatus] = useState("loading"), [busLoading,setBusLoading] = useState(false), [busError,setBusError] = useState("");
  const [retry,setRetry] = useState(0);
  const stationRequest = useRef(0), arrivalRequest = useRef(0);
  useEffect(() => {
    api.get("/places/filters").then(r => setFilterGroups(r.data.groups || [])).catch(() => setFilterError("접근성 필터를 불러오지 못했어요."));
  },[]);
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({page:String(page),page_size:"30"});
    selectedFilters.forEach(filter => params.append("filters",filter));
    if (search) params.set("q",search);
    setLoading(true); setError("");
    api.get("/places",{params}).then(r => {
      if (!cancelled) {setPlaces(r.data.items || []);setTotal(r.data.total || 0);}
    }).catch(() => {if (!cancelled) setError("여행지를 불러오지 못했어요. 다시 시도해주세요.");}).finally(() => {if (!cancelled) setLoading(false);});
    return () => {cancelled = true;};
  },[selectedFilters,page,search,retry]);
  const handleMapMove = useCallback((latitude,longitude) => {
    const request = ++stationRequest.current;
    api.get("/bus-stations",{params:{latitude,longitude}}).then(r => {if (request === stationRequest.current) setStations(r.data || []);}).catch(() => {if (request === stationRequest.current) setStations([]);});
  },[]);
  const handleStationClick = useCallback(station => {
    const request = ++arrivalRequest.current;
    setSelectedStation(station);setBusArrivals([]);setBusLoading(true);setBusError("");
    api.get("/bus-arrival",{params:{city_code:station.cityCode,node_id:station.id}}).then(r => {if (request === arrivalRequest.current) setBusArrivals(r.data || []);}).catch(() => {if (request === arrivalRequest.current) setBusError("버스 도착 정보를 불러오지 못했어요.");}).finally(() => {if (request === arrivalRequest.current) setBusLoading(false);});
  },[]);
  const toggleFilter = key => {setPage(1);setSelectedFilters(current => current.includes(key) ? current.filter(k => k !== key) : [...current,key]);};
  return <main className="page-shell map-page" id="main-content"><PageHeading eyebrow="FIND YOUR NEXT FOOTPRINT" title="여행 지도" description="나에게 편안한 길을 찾아, 한 걸음 더." bag/><div className="map-layout"><aside className="map-filters"><h2><Icon name="compass" size={21}/> 편안한 여행의 조건</h2><p className="settings-note">필요한 시설을 고르면, 조건에 맞는 여행지를 보여드려요.</p>{filterError && <p role="alert" className="field-error">{filterError}</p>}{filterGroups.map(group => <fieldset className="map-filter-group" key={group.key}><legend>{group.label}</legend>{group.filters.map(filter => <label key={filter.key}><input type="checkbox" checked={selectedFilters.includes(filter.key)} onChange={() => toggleFilter(filter.key)}/>{filter.label}</label>)}</fieldset>)}{selectedFilters.length > 0 && <button className="text-button" onClick={() => {setSelectedFilters([]);setPage(1);}}>필터 초기화</button>}<Mascot pose="read"/></aside><section><form className="map-search" onSubmit={e => {e.preventDefault();setSearch(query.trim());setPage(1);}}><label className="search-field"><Icon name="search" size={18}/><input type="search" aria-label="지도에서 장소 검색" placeholder="장소명이나 지역을 검색해보세요" value={query} onChange={e => setQuery(e.target.value)}/></label><button className="button primary" type="submit">찾기</button></form><div className="map-stage"><KakaoMap places={places} stations={stations} onMapMove={handleMapMove} onStationClick={handleStationClick} onStatus={setMapStatus}/>{mapStatus !== "ready" && <div className="map-status" role="status"><div><Icon name="map" size={35}/><h3>{mapStatus === "error" ? "지도를 펼치지 못했어요" : "지도를 펼치는 중…"}</h3><p>{mapStatus === "error" ? "지도 서비스 연결을 확인해주세요. 아래 여행지 목록은 계속 이용할 수 있어요." : "잠시만 기다려주세요."}</p></div></div>}</div><div className="map-legend"><span><Icon name="pin" size={16}/>현재 목록의 여행지</span><span>버스 정류장을 누르면 도착 정보를 볼 수 있어요.</span></div>{selectedStation && <div className="bus-panel" aria-live="polite"><h3>{selectedStation.name}</h3>{busLoading ? <p>도착 정보를 확인하는 중…</p> : busError ? <p role="alert">{busError}</p> : !busArrivals.length ? <p className="muted">현재 도착 예정 버스가 없습니다.</p> : busArrivals.map((bus,index) => <div className="bus-row" key={`${bus.routeId}-${index}`}><strong>{bus.routeName}번</strong>{bus.vehicleType && ` · ${bus.vehicleType}`}{bus.remainingStops != null && ` · ${bus.remainingStops}정거장 전`}{bus.arrivalTime != null && ` · 약 ${Math.max(1,Math.ceil(Number(bus.arrivalTime)/60))}분 후`}</div>)}</div>}</section></div><section className="place-results"><div className="section-heading"><h2>함께 떠날 수 있는 곳 <span>{total}</span></h2><span className="settings-note">여행지의 최신 시설 정보는 방문 전 확인해주세요.</span></div>{loading ? <p className="status-message" role="status">여행지를 찾고 있어요…</p> : error ? <div className="notice" role="alert">{error}<button onClick={() => setRetry(v => v+1)}>다시 불러오기</button></div> : !places.length ? <p className="status-message">조건에 맞는 여행지가 없어요. 검색어나 필터를 바꿔보세요.</p> : <div className="place-results-list">{places.map(place => <article className="place-result" key={place.id}><strong><Icon name="pin" size={15}/> {place.name}</strong><p>{place.address}</p><div className="place-tags">{(place.tags || []).slice(0,3).map(tag => <span key={tag}>{tag}</span>)}</div></article>)}</div>}{total > 30 && <nav className="button-row" aria-label="여행지 목록 페이지"><button disabled={page === 1 || loading} onClick={() => setPage(p => p-1)}>이전</button><span className="pagination-label">{page} / {Math.ceil(total/30)}</span><button disabled={page >= Math.ceil(total/30) || loading} onClick={() => setPage(p => p+1)}>다음</button></nav>}</section></main>;
}