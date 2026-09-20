import HangingAccessories from "../components/HangingAccessories";
import ItemArt from "../components/ItemArt";
import DressedMascot from "../components/DressedMascot";
import { getImageSrc } from "../utils/postUtils";
import { displayTravelTag } from "../data/travelFilters";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import KoreaConquestMap from "../components/KoreaConquestMap";
import { KOREA_REGIONS, findRegionByPlace } from "../data/koreaRegions";
import { EmptyState, Icon } from "../components/Brand";
import BadgeArt from "../components/BadgeArt";
import Modal from "../components/Modal";
import useBag from "../hooks/useBag";
import useLikes from "../hooks/useLikes";
import TravelPhoto from "../components/TravelPhoto";
import { formatPostDate, getDateKey, getTagRating } from "../utils/postUtils";
import "../styles/MyPage.css";

export default function MyPage() {
  const bag = useBag();
  const { likedPosts, error: likesError } = useLikes();
  const [selectedRegionKey, setSelectedRegionKey] = useState("seoul");
  const [openRegion, setOpenRegion] = useState(false);
  const [memories, setMemories] = useState({});
  const [memoryError, setMemoryError] = useState("");
  const { displayName, avatar, username, posts, places, settings, badges, items, level, loading, error } = bag;
  const regionFor = p => {
    const place = places.find(option => option.name === p.place);
    return findRegionByPlace(place ? `${place.city || ""} ${place.address || ""}` : p.place);
  };
  const groups = useMemo(() => {
    const group = list => list.reduce((result, post) => {
      const place = places.find(option => option.name === post.place);
      const region = findRegionByPlace(place ? `${place.city || ""} ${place.address || ""}` : post.place);
      if (region) (result[region.key] ||= []).push(post);
      return result;
    }, {});
    return { written: group(posts), liked: group(likedPosts) };
  }, [posts, places, likedPosts]);
  useEffect(() => {
    if (!username) return;
    try {
      const scoped = localStorage.getItem(`bef_private_memories:${username}`);
      const legacy = JSON.parse(localStorage.getItem("bef_private_memories") || "{}");
      const ownKeys = new Set(posts.map(p => `${p.id}-${getDateKey(p.written_date)}`));
      setMemories(scoped ? JSON.parse(scoped) : Object.fromEntries(Object.entries(legacy).filter(([key]) => ownKeys.has(key))));
    } catch { setMemoryError("이 브라우저의 개인 기록을 읽지 못했어요."); }
  }, [username, posts]);
  const saveMemory = (key, change) => {
    const next = {...memories, [key]: {...memories[key], ...change}};
    try { localStorage.setItem(`bef_private_memories:${username}`, JSON.stringify(next)); setMemories(next); setMemoryError(""); }
    catch { setMemoryError("저장 공간이 부족해요. 개인 사진을 줄인 뒤 다시 시도해 주세요."); }
  };
  const uploadPrivate = async (event, key) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.some(f => !f.type.startsWith("image/") || f.size > 1500000)) { setMemoryError("개인 사진은 1장당 1.5MB 이하의 이미지로 골라주세요."); return; }
    try {
      const photos = await Promise.all(files.map(file => new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); })));
      saveMemory(key, {privatePhotos:[...(memories[key]?.privatePhotos || []), ...photos]});
    } catch { setMemoryError("사진을 읽지 못했어요. 다른 파일로 시도해 주세요."); }
  };
  const earnedBadges = badges.filter(b => b.earned), equippedItems = items.filter(i => i.earned && settings.items.includes(i.id));
  const equippedBadges = earnedBadges.filter(b => settings.badges.includes(b.id));
  const selectedRegion = KOREA_REGIONS.find(r => r.key === selectedRegionKey);
  const selectRegion = key => { setSelectedRegionKey(key); setOpenRegion(true); };
  return <main className="bag-page" id="main-content">
    <div className="bag-title"><p className="eyebrow">MY LITTLE TRAVEL BAG</p><h1>내 가방을 열면</h1><p>함께 모은 여행이 펼쳐져요.</p></div>
    {loading && <p className="bag-status" role="status">소중한 기록을 가방에서 꺼내는 중…</p>}
    {error && <div className="notice" role="alert">{error} <button onClick={bag.reload}>다시 열기</button></div>}
    {!localStorage.getItem("token") && <div className="guest-note"><Icon name="bag" size={18}/><span>나만의 가방에 여행을 차곡차곡 담아보세요.</span><Link to="/login">로그인하고 시작하기 <Icon name="arrow" size={14}/></Link></div>}
    <div className="travel-bag">
      <div className="bag-handle"/><DressedMascot character={settings.character} className="peeking-friend"/>
      <div className="bag-lining">
        <section className="bag-pocket badge-pocket"><div className="pocket-paper"><div className="pocket-heading"><h2><Icon/>배지첩</h2><span className="tiny-label">MY BADGES</span></div><p className="pocket-description">한 걸음마다 모이는 작은 기쁨</p><div className="badge-preview">{badges.slice(0,6).map(b => <Link key={b.id} to={`/badges?badge=${b.id}`} title={b.name} aria-label={`${b.name} · ${b.earned ? "획득" : "미획득"}`}><BadgeArt badge={b}/><span>{b.name}</span></Link>)}</div><Link className="badge-count" to="/badges">모은 배지 <strong>{earnedBadges.length}</strong><span>/ {badges.length}</span><Icon name="arrow" size={15}/></Link></div><div className="pocket-lip"><span>작은 발걸음, 빛나는 기억</span></div></section>
        <section className="map-paper"><div className="map-paper-heading"><h2><Icon name="map" size={25}/>나의 여행 지도</h2><div className="map-legend"><span><Icon size={14}/>남긴 기록</span><span><Icon name="pin" size={14}/>좋아요한 장소</span></div></div><KoreaConquestMap regions={KOREA_REGIONS} postsByRegion={groups.written} likedByRegion={groups.liked} selectedRegionKey={selectedRegionKey} onSelectRegion={selectRegion}/><div className="map-summary"><span>기록이 쌓일수록, 우리의 여행도 넓어져요.</span><strong>{Object.keys(groups.written).length}<small>개 지역</small><b>·</b>{posts.length}<small>개의 기록</small></strong></div><p className="map-data-note">작성한 글의 장소를 지역별로 표시해요. 방문 인증과는 구분돼요.</p>{likesError && <p className="field-error">{likesError}</p>}</section>
        <div className="bag-right"><section className="bag-pocket traveler-pocket"><div className="pocket-paper"><h2><Icon name="user"/>여행자 카드</h2><div className="traveler-identity"><div className="traveler-avatar">{avatar ? <img src={getImageSrc(avatar)} alt="내 프로필 사진"/> : <Icon name="user" size={28}/>}</div><div><span className="tiny-label">BF TRAVELER</span><h3>{displayName}</h3><p>{level}</p></div></div><nav aria-label="나의 여행 메뉴"><Link to="/profile/edit"><Icon name="user" size={16}/>내 프로필<Icon name="arrow" size={15}/></Link><a href="#my-records"><Icon name="book" size={16}/>작성한 글<span>{posts.length}</span><Icon name="arrow" size={15}/></a><Link to="/?saved=1"><Icon name="heart" size={16}/>좋아요한 글<span>{likedPosts.length}</span><Icon name="arrow" size={15}/></Link></nav></div><div className="pocket-lip"/></section>
        <section className="bag-pocket items-pocket"><div className="pocket-paper"><div className="pocket-heading"><h2><Icon name="bag" size={20}/>수집 아이템</h2><Link to="/bag/decorate" aria-label="가방 꾸미기"><Icon name="arrow" size={16}/></Link></div><div className="item-preview">{items.slice(0,3).map(i => <Link key={i.id} className={i.earned ? "earned" : "locked"} to="/bag/decorate" title={i.condition}><ItemArt item={i}/><span>{i.name}</span>{!i.earned && <Icon className="item-lock" name="lock" size={12}/>}</Link>)}</div><Link className="button primary decorate-cta" to="/bag/decorate">가방 꾸미기 <Icon name="arrow" size={13}/></Link></div><div className="pocket-lip"/></section></div>
      </div>
      <HangingAccessories items={equippedItems} className="bag-charms"/><div className="bag-front"><div className="bag-zip"/><span className="zip-pull"/><div className="equipped-stickers">{equippedBadges.map(b => <BadgeArt badge={b} small key={b.id}/>)}</div><Icon className="front-paw" size={40}/><p>함께라서, 조금 더 멀리.</p></div>
    </div>
    <div className="bag-shortcuts"><Link to="/"><Icon name="book"/>여행 둘러보기<Icon name="arrow" size={15}/></Link><Link to={username ? "/write" : "/login"}><Icon name="camera"/>기록 남기기<Icon name="arrow" size={15}/></Link><Link to="/map"><Icon name="compass"/>지도 펼치기<Icon name="arrow" size={15}/></Link></div>
    <section className="my-posts-section" id="my-records"><div className="section-heading"><div><p className="eyebrow">PAGES FROM MY JOURNEY</p><h2>가방 속 여행 기록 <span>{posts.length}</span></h2></div><Link className="text-link" to={username ? "/write" : "/login"}>새 기록 남기기 <Icon name="arrow" size={15}/></Link></div>{posts.length ? <div className="my-posts-list">{posts.map(post => <Link to={`/post/${post.id}`} key={post.id}><span className="record-thumb">{post.photo?.[0] ? <TravelPhoto image={post.photo[0]} alt=""/> : <Icon name="book"/>}</span><span><strong>{post.title}</strong><small>{regionFor(post)?.label || "지역 미분류"} · {formatPostDate(post.written_date)}</small></span><Icon name="arrow" size={17}/></Link>)}</div> : <EmptyState title="아직 펼치지 않은 첫 페이지" description="여행에서 만난 풍경과 마음을 남겨주세요. 기록은 이 가방 안에 차곡차곡 모여요." action="여행 이야기 남기기" to={username ? "/write" : "/login"}/>}</section>
    {openRegion && <Modal title={`${selectedRegion.label}의 여행 기록`} onClose={() => setOpenRegion(false)}><p className="drawer-intro">공개 글 옆에, 나만의 여행 일기를 남겨요.</p><p className="settings-note">개인 일기와 사진은 현재 브라우저에만 저장돼요.</p>{memoryError && <p className="field-error" role="alert">{memoryError}</p>}{(groups.written[selectedRegionKey] || []).length ? groups.written[selectedRegionKey].map(post => {
      const key = `${post.id}-${getDateKey(post.written_date)}`, memory = memories[key] || {};
      return <article className="memory-card" key={key}><div className="memory-top">{post.photo?.[0] && <TravelPhoto image={post.photo[0]} alt=""/>}<div><time>{formatPostDate(post.written_date)}</time><h3>{post.title}</h3><Link className="text-link" to={`/post/${post.id}`}>공개 글 보기 <Icon name="arrow" size={13}/></Link></div></div><div className="tag-rating-list">{(post.tag || []).map(tag => <span key={tag}>{displayTravelTag(tag)} {getTagRating(tag) > 0 ? `${getTagRating(tag)}점` : ""}</span>)}</div><label className="form-field"><span>나만의 여행 일기</span><textarea value={memory.diary || ""} onChange={e => saveMemory(key, {diary:e.target.value})} placeholder="그날의 기분, 잊고 싶지 않은 순간."/></label><label className="private-photo-uploader"><Icon name="camera" size={16}/>개인 사진 추가<input type="file" accept="image/*" multiple onChange={e => uploadPrivate(e,key)}/></label><div className="private-photo-grid">{(memory.privatePhotos || []).map((photo,index) => <div key={index}><img src={photo} alt={`개인 여행 사진 ${index+1}`}/><button aria-label={`개인 사진 ${index+1} 삭제`} onClick={() => saveMemory(key,{privatePhotos:memory.privatePhotos.filter((_,i) => i !== index)})}><Icon name="close" size={14}/></button></div>)}</div></article>;
    }) : <EmptyState title="이곳의 첫 발걸음을 기다려요" description="여행 후 이야기를 남기면 지도에도 기록이 생겨요." action="여행 기록 남기기" to={username ? "/write" : "/login"}/>}
    {(groups.liked[selectedRegionKey] || []).length > 0 && <section className="region-liked"><h3>마음에 담아둔 장소</h3>{groups.liked[selectedRegionKey].map(post => <Link key={post.id} to={`/post/${post.id}`}><Icon name="pin" size={16}/>{post.title}<Icon name="arrow" size={14}/></Link>)}</section>}</Modal>}
  </main>;
}
