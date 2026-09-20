import ItemArt from "../components/ItemArt";
import DressedMascot from "../components/DressedMascot";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CHARACTERS } from "../data/collection";
import { Icon, Mascot, PageHeading } from "../components/Brand";
import BadgeArt from "../components/BadgeArt";
import Modal from "../components/Modal";
import useBag from "../hooks/useBag";
import "../styles/MyPage.css";

export default function CollectionPage({ decorate = false }) {
  const bag = useBag(), location = useLocation();
  const params = new URLSearchParams(location.search);
  const [selectedId, setSelectedId] = useState(params.get("badge"));
  const [tab, setTab] = useState(["friend", "badges"].includes(params.get("tab")) ? params.get("tab") : "items");
  const [notice, setNotice] = useState("");
  const { badges, items, settings, username, displayName, loading, error } = bag;
  const [friendName, setFriendName] = useState("");
  const [saving, setSaving] = useState(false);
  const selected = badges.find(b => b.id === selectedId);
  const save = async next => {
    if (!username) { setNotice("로그인하면 나만의 가방을 꾸밀 수 있어요."); return; }
    if (saving || loading) return;
    setSaving(true);
    if (await bag.saveSettings(next)) setNotice("내 가방에 저장했어요.");
    else setNotice("가방 설정을 저장하지 못했어요. 다시 시도해주세요.");
    setSaving(false);
  };
  const toggle = (type,id) => {
    const current = settings[type], max = type === "badges" ? 5 : 3;
    if (!current.includes(id) && current.length >= max) { setNotice(`${type === "badges" ? "배지는" : "아이템은"} 최대 ${max}개까지 달 수 있어요.`); return; }
    save({...settings,[type]:current.includes(id) ? current.filter(v => v !== id) : [...current,id]});
  };
  return <main className="page-shell collection-page" id="main-content"><Link to="/mypage" className="text-link collection-back"><Icon name="back" size={15}/>내 가방으로</Link><PageHeading eyebrow={decorate ? "MAKE IT YOURS" : "LITTLE MOMENTS, LITTLE BADGES"} title={decorate ? "나답게, 가방 꾸미기" : "베프의 여행 배지"} description={decorate ? "좋아하는 친구와 작은 수집품으로, 나만의 여행을 준비해요." : "하나씩 모으는 우리의 발자취. 모든 배지에는 이야기가 있어요."}/>
    {loading && <p role="status" className="notice">가방을 펼치는 중…</p>}{error && <div className="notice" role="alert">{error}<button onClick={bag.reload}>다시 불러오기</button></div>}{!localStorage.getItem("token") && <p className="notice"><Link to="/login">로그인하고 나만의 배지와 아이템을 모아보세요 <Icon name="arrow" size={15}/></Link></p>}
    {decorate ? <div className="decorate-layout"><aside className="decorate-preview"><p className="eyebrow">MY TRAVEL BUDDY</p><DressedMascot character={settings.character} badges={badges.filter(b => b.earned && settings.badges.includes(b.id))} items={items.filter(i => i.earned && settings.items.includes(i.id))}/><h2>{settings.friendName || displayName}의 가방</h2><p>{bag.level}</p><span className="settings-note">직접 고른 배지와 아이템만 가방에 달려요.</span><Link className="button primary" to="/mypage">내 가방에서 보기 <Icon name="arrow" size={15}/></Link></aside><section className="decorate-options"><div className="collection-tabs" role="tablist" aria-label="꾸미기 종류">{[{id:"items",name:"수집 아이템"},{id:"badges",name:"가방에 달 배지"},{id:"friend",name:"여행 친구"}].map(t => <button role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls="decoration-panel" key={t.id} className={tab === t.id ? "active" : ""} onClick={() => { setTab(t.id); setNotice(""); }}>{t.name}</button>)}</div><fieldset disabled={loading || saving} className="decoration-panel" role="tabpanel" id="decoration-panel" aria-labelledby={`tab-${tab}`}>
      {tab === "friend" ? <><p className="collection-help">함께 떠날 강아지를 고르고, 이름도 지어주세요.</p><form className="friend-name-form" onSubmit={e => {e.preventDefault();save({...settings,friendName:friendName.trim()});}}><label htmlFor="friend-name">여행 친구 이름</label><div><input id="friend-name" maxLength={16} placeholder={settings.friendName || "친구의 이름을 지어주세요"} value={friendName} onChange={e => setFriendName(e.target.value)}/><button type="submit">이름 저장</button></div></form><div className="friend-choices">{CHARACTERS.map(c => <button key={c.id} className={settings.character === c.id ? "selected" : ""} aria-pressed={settings.character === c.id} onClick={() => save({...settings,character:c.id})}><Mascot character={c.id}/><strong>{c.name}</strong><span>{c.description}</span>{settings.character === c.id && <span className="selection-check"><Icon name="check" size={15}/></span>}</button>)}</div></> : tab === "items" ? <><p className="collection-help">획득한 아이템을 최대 3개 착용할 수 있어요. 선택한 아이템은 가방에 달려요.</p><div className="collectible-grid">{items.map(item => <button key={item.id} className={`collectible-option ${!item.earned ? "locked" : ""} ${settings.items.includes(item.id) && item.earned ? "selected" : ""}`} aria-pressed={item.earned && settings.items.includes(item.id)} onClick={() => item.earned ? toggle("items",item.id) : setNotice(item.pending ? `${item.name}: 방문 확인 기능이 연결되면 수집할 수 있어요.` : item.condition)}><span className="item-art"><ItemArt item={item}/></span><strong>{item.name}</strong><span>{item.condition}</span><small>{item.earned ? settings.items.includes(item.id) ? "장착 중 · 눌러서 빼기" : "획득 · 가방에 달기" : item.pending ? "준비 중" : "아직 미획득"}</small></button>)}</div></> : <><p className="collection-help">획득한 배지 중 좋아하는 배지를 최대 5개 골라주세요.</p><div className="collectible-grid">{badges.map(b => <button key={b.id} className={`collectible-option ${settings.badges.includes(b.id) && b.earned ? "selected" : ""}`} aria-pressed={b.earned && settings.badges.includes(b.id)} onClick={() => b.earned ? toggle("badges",b.id) : setSelectedId(b.id)}><BadgeArt badge={b}/><strong>{b.name}</strong><small>{b.earned ? settings.badges.includes(b.id) ? "장착 중 · 눌러서 빼기" : "획득 · 가방에 달기" : "미획득 · 조건 보기"}</small></button>)}</div></>}
    </fieldset><p className="save-notice" role="status">{notice || "꾸미기는 현재 브라우저에 자동으로 저장돼요."}</p></section></div> :
    <><div className="collection-summary"><span><Icon/>모은 배지 <strong>{badges.filter(b => b.earned).length}</strong><small>/ {badges.length}</small></span><Link className="button primary" to="/bag/decorate?tab=badges">가방 꾸미기 · 강아지 선택 <Icon name="arrow" size={15}/></Link></div><section className="badge-album">{["여행의 풍경","기록과 나눔","함께한 시간"].map((group,index) => <div className="album-row" key={group}><div className="album-category"><span>0{index+1}</span><h2>{group}</h2><i/></div><div className="album-badges">{badges.filter(b => b.group === group).map(b => <button className="album-badge" key={b.id} onClick={() => setSelectedId(b.id)}><BadgeArt badge={b}/><strong>{b.name}</strong><small>{b.earned ? "함께 모은 배지" : "아직 만나기 전"}</small></button>)}</div></div>)}<div className="album-bottom"><Link className="button primary" to="/bag/decorate">가방 꾸미기 <Icon name="bag" size={18}/></Link><p>서두르지 않아도 괜찮아요.<br/>우리의 속도로, 한 걸음씩 모아가요.</p><Mascot pose="badge"/></div></section></>}
    {selected && <Modal title={selected.name} onClose={() => setSelectedId(null)}><div className="badge-detail"><BadgeArt badge={selected}/><span className="eyebrow">{selected.group}</span><h3>{selected.earned ? "우리의 발걸음으로 모은 배지예요!" : "다음 여행에서 만날 작은 기쁨"}</h3><p>{selected.condition}</p>{selected.pending && <p className="settings-note">이 배지는 활동 확인 기능을 준비하고 있어요.</p>}{selected.earned ? <><p className="settings-note">작성한 여행 기록을 바탕으로 획득했어요.</p><button className="button primary" onClick={() => { toggle("badges",selected.id); setSelectedId(null); }}>{settings.badges.includes(selected.id) ? "가방에서 빼기" : "가방에 배지 달기"}</button></> : !selected.pending && <Link className="button primary" to={username ? "/write" : "/login"}>여행 기록 남기기 <Icon name="arrow" size={15}/></Link>}</div></Modal>}
    {!decorate && notice && <p role="status" className="save-notice">{notice}</p>}
  </main>;
}
