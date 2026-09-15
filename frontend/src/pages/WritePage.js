import SortablePhoto from "../components/SortablePhoto";
import PlaceSelector from "../components/PlaceSelector";
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { encodeTagRating, getImageSrc, getTagLabel, getTagRating } from "../utils/postUtils";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { Icon, Mascot, PageHeading } from "../components/Brand";
import Modal from "../components/Modal";

const TAGS = ["♿ 휠체어","🛗 엘리베이터","↗️ 경사로","🚻 장애인 화장실","🅿️ 장애인 주차장","🚼 유아차","🐶 반려동물","☕ 카페","🍴 음식점","🏞 관광지"];
export default function WritePage() {
  const [title,setTitle] = useState(""), [content,setContent] = useState(""), [place,setPlace] = useState("");
  const [tagRatings,setTagRatings] = useState({}), [existingPhotos,setExistingPhotos] = useState([]), [photos,setPhotos] = useState([]);
  const [error,setError] = useState(""), [busy,setBusy] = useState(false), [loading,setLoading] = useState(false), [success,setSuccess] = useState(false);
  const navigate = useNavigate(), {id} = useParams();
  const sensors = useSensors(useSensor(PointerSensor,{activationConstraint:{distance:6}}),useSensor(KeyboardSensor,{coordinateGetter:sortableKeyboardCoordinates}));
  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([api.get("/load-post"),api.get("/me")]).then(([res,me]) => {
      if (cancelled) return;
      const post = res.data.find(p => String(p.id) === id);
      if (!post || post.author !== me.data.username) { setError("수정할 수 있는 여행 글을 찾지 못했어요."); return; }
      setTitle(post.title); setContent(post.content); setPlace(post.place); setExistingPhotos(post.photo || []);
      setTagRatings(Object.fromEntries((post.tag || []).map(t => [getTagLabel(t),getTagRating(t) || 3])));
    }).catch(() => { if (!cancelled) setError("여행 글을 불러오지 못했어요."); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => {cancelled = true;};
  },[id,navigate]);
  const handlePhotoChange = e => {
    const files = Array.from(e.target.files || []); e.target.value = "";
    if (existingPhotos.length + photos.length + files.length > 10) {setError("사진은 최대 10장까지 담을 수 있어요."); return;}
    if (files.some(file => !file.type.startsWith("image/"))) {setError("이미지 파일을 선택해주세요."); return;}
    setPhotos(current => [...current,...files.map(file => ({id:crypto.randomUUID(),file}))]); setError("");
  };
  const toggleTag = tag => setTagRatings(current => {
    const next = {...current}; if (next[tag]) delete next[tag]; else next[tag] = 3; return next;
  });
  const handleSubmit = async e => {
    e.preventDefault();
    if (busy) return;
    if (!title.trim() || !content.trim() || !place) {setError("제목, 장소, 여행 이야기를 모두 채워주세요."); return;}
    if (!photos.length && !existingPhotos.length) {setError("여행 사진을 한 장 이상 담아주세요."); return;}
    setBusy(true); setError("");
    try {
      const uploaded = [];
      for (const photo of photos) {
        const form = new FormData(); form.append("file",photo.file);
        const res = await api.post("/upload-image/",form); uploaded.push(res.data.filename);
      }
      const data = {title:title.trim(),content:content.trim(),place,photo:[...existingPhotos,...uploaded],tag:Object.entries(tagRatings).map(([tag,rating]) => encodeTagRating(tag,rating))};
      if (id) await api.put("/edit-post",{id,...data}); else await api.post("/write-post",data);
      setSuccess(true);
    } catch {setError("여행 기록을 저장하지 못했어요. 입력한 내용은 그대로 있으니 다시 시도해 주세요.");}
    finally {setBusy(false);}
  };
  return <main className="page-shell write-page" id="main-content"><PageHeading eyebrow="A PAGE OF YOUR JOURNEY" title={id ? "여행 기록 다듬기" : "여행 기록 남기기"} description="좋았던 풍경, 특별한 순간을 함께 나눠주세요."/><Mascot pose="write" className="write-mascot"/>{loading && <p role="status" className="notice">여행 기록을 펼치는 중…</p>}<form className="write-notebook" onSubmit={handleSubmit}><fieldset disabled={busy || loading || success} style={{border:0,padding:0,margin:0,minWidth:0}}><div className="form-field"><label htmlFor="post-title">제목</label><input id="post-title" placeholder="여행의 제목을 적어주세요" value={title} onChange={e => setTitle(e.target.value)} required/></div><h3>장소 <small>다녀온 장소를 찾아주세요</small></h3><div className="write-place"><PlaceSelector value={place} onChange={setPlace}/></div><h3>사진 <small>{existingPhotos.length + photos.length} / 10장</small></h3><label className="photo-upload"><Icon name="camera" size={38}/><strong>사진 추가</strong><small>마음에 남은 풍경을 담아주세요</small><input aria-label="여행 사진 추가" type="file" multiple accept="image/*" onChange={handlePhotoChange}/></label><div className="photo-previews">{existingPhotos.map((photo,index) => <div key={photo} className="uploaded-photo"><img src={getImageSrc(photo)} alt={`기존 사진 ${index+1}`}/>{index === 0 && <small>대표 사진</small>}<button type="button" aria-label={`기존 사진 ${index+1} 삭제`} onClick={() => setExistingPhotos(current => current.filter(p => p !== photo))}><Icon name="close" size={15}/></button></div>)}</div><DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({active,over}) => {if (over && active.id !== over.id) setPhotos(current => arrayMove(current,current.findIndex(p => p.id === active.id),current.findIndex(p => p.id === over.id)));}}><SortableContext items={photos.map(p => p.id)} strategy={rectSortingStrategy}><div className="photo-previews">{photos.map((photo,index) => <SortablePhoto key={photo.id} photo={photo} index={index} isCover={!existingPhotos.length && index === 0} removePhoto={photoId => setPhotos(current => current.filter(p => p.id !== photoId))}/>)}</div></SortableContext></DndContext>{photos.length > 1 && <p className="settings-note">사진을 끌어 순서를 바꿀 수 있어요. 키보드는 사진 선택 후 Space와 방향키를 이용하세요.</p>}
    <h3>함께 나눌 접근성 정보 <small>경험한 항목을 골라 별점을 남겨주세요</small></h3><div className="tag-choices">{TAGS.map(tag => <div className={`tag-choice ${tagRatings[tag] ? "selected" : ""}`} key={tag}><button type="button" aria-pressed={!!tagRatings[tag]} onClick={() => toggleTag(tag)}>{tag}</button>{!!tagRatings[tag] && <span className="rating-stars">{[1,2,3,4,5].map(rating => <button type="button" key={rating} aria-label={`${tag} ${rating}점`} aria-pressed={tagRatings[tag] === rating} className={rating <= tagRatings[tag] ? "selected" : ""} onClick={() => setTagRatings(current => ({...current,[tag]:rating}))}>★</button>)}</span>}</div>)}</div><div className="form-field" style={{marginTop:28}}><label htmlFor="post-content">여행 이야기</label><textarea id="post-content" rows={8} placeholder="어떤 길을 걸었나요? 편안했던 순간과 도움이 될 정보를 들려주세요." value={content} onChange={e => setContent(e.target.value)} required/></div><p className="write-hint"><Icon size={15}/>첫 여행 기록은 내 가방의 첫 배지가 돼요.</p>{error && <p className="field-error" role="alert">{error}</p>}<div className="button-row"><Link className="button" to={id ? `/post/${id}` : "/"}>취소</Link><button className="button primary" type="submit" disabled={busy || loading}>{busy ? "기록을 담는 중…" : id ? "수정하기" : "등록하기"}<Icon name="arrow" size={16}/></button></div></fieldset></form>
    {success && <Modal title={id ? "기록을 다듬었어요" : "여행이 가방에 담겼어요"} onClose={() => navigate(id ? `/post/${id}` : "/")}><div className="empty-state"><Mascot pose="badge"/><h3>{id ? "더 좋은 여행 이야기로 만나요." : "한 페이지 더, 함께한 여행."}</h3><p>오늘의 이야기가 누군가에게 새로운 길이 될 거예요. 내 가방에서 기록과 모은 배지를 확인해보세요.</p><Link className="button primary" to="/mypage">내 가방 열기 <Icon name="bag" size={18}/></Link><div style={{marginTop:18}}><Link className="text-link" to="/">다른 여행 둘러보기 <Icon name="arrow" size={14}/></Link></div></div></Modal>}
  </main>;
}