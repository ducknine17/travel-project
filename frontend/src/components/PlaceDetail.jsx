import { useEffect, useState } from "react";
import api from "../services/api";
import Modal from "./Modal";
import TravelPhoto from "./TravelPhoto";
import { Icon } from "./Brand";
import { facilityLabel } from "../data/travelFilters";

export default function PlaceDetail({ place, onClose }) {
  const [detail, setDetail] = useState(null), [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(""); setDetail(null); setPosts([]);
    Promise.allSettled([api.get(`/places/${encodeURIComponent(place.id)}`), api.get(`/places/${encodeURIComponent(place.id)}/posts`)]).then(([info, reviews]) => {
      if (cancelled) return;
      if (info.status === "fulfilled") setDetail(info.value.data);
      if (reviews.status === "fulfilled") setPosts(reviews.value.data || []);
      if (info.status === "rejected" || reviews.status === "rejected") setError("일부 정보를 불러오지 못했어요. 다시 시도해주세요.");
      setLoading(false);
    });
    return () => {cancelled = true;};
  }, [place.id, retry]);
  const photos = [...new Set([...(detail?.photos || []), ...posts.flatMap(p => p.photo || [])])].slice(0, 8);
  return <Modal title={place.name} className="place-detail-modal" onClose={onClose}>
    <p className="place-detail-address"><Icon name="pin" size={17}/> {place.address || "주소 정보가 없습니다."}</p>
    <div className="place-detail-actions"><a className="button primary" href={`https://map.kakao.com/link/search/${encodeURIComponent(`${place.name} ${place.address || ""}`)}`} target="_blank" rel="noreferrer">길찾기·지도에서 보기 <Icon name="arrow" size={15}/></a><a className="button" href={`/write?place=${encodeURIComponent(place.name)}`}>이 장소 리뷰 쓰기</a></div>
    {loading && <p role="status">장소 정보와 여행자 리뷰를 펼치는 중…</p>}
    {error && <p role="alert" className="notice">{error} <button onClick={() => setRetry(v => v + 1)}>다시 불러오기</button></p>}
    {!!photos.length && <><h3>장소 사진</h3><div className="place-photo-gallery">{photos.map((photo, i) => <TravelPhoto key={photo} image={photo} alt={`${place.name} 사진 ${i + 1}`}/>)}</div><p className="settings-note">{detail?.photos?.length ? "한국관광공사 제공 사진과 여행자 리뷰 사진이에요." : "여행자가 리뷰에 남긴 사진이에요."}</p></>}
    {!loading && !photos.length && <p className="place-no-photo"><Icon name="camera" size={30}/>아직 등록된 장소 사진이 없어요.</p>}
    <h3>장소 안내</h3><p className="place-overview">{detail?.overview || (loading ? "안내 정보를 확인하고 있어요." : "상세 소개가 아직 제공되지 않았어요.")}</p>
    {detail?.phone && <p>문의 · {detail.phone}</p>}
    <h3>편의시설·접근성 정보</h3>
    {detail?.facilities?.length ? <dl className="place-facilities">{detail.facilities.map(f => <div key={f.key}><dt>{facilityLabel(f.key)}</dt><dd>{f.description}</dd></div>)}</dl> : <><div className="place-tags">{(place.tags || []).map(tag => <span key={tag}>{facilityLabel(tag)}</span>)}</div><p className="settings-note">등록된 정보 항목이에요. 설치 여부와 이용 조건은 방문 전 확인해주세요.</p></>}
    <h3>이곳을 다녀온 여행자 리뷰 <span>{posts.length}</span></h3>
    <div className="place-review-list">{posts.map(post => <a href={`/post/${post.id}`} key={post.id} aria-label={post.title}>{post.photo?.[0] && <TravelPhoto image={post.photo[0]} alt=""/>}<span><strong>{post.title}</strong><small>{post.author} · {post.written_date?.slice(0, 10)}</small><p>{post.content?.slice(0, 120)}</p></span><Icon name="arrow" size={16}/></a>)}</div>
    {!loading && !posts.length && <p className="settings-note">아직 연결된 여행자 리뷰가 없어요.</p>}
  </Modal>;
}
