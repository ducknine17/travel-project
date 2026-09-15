import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { formatPostDate, getTagLabel, getTagRating } from "../utils/postUtils";
import TravelPhoto from "../components/TravelPhoto";
import { Bookmark, EmptyState, Icon, Mascot } from "../components/Brand";
import useLikes, { notifyLikes } from "../hooks/useLikes";

export default function PostDetailPage() {
  const {id} = useParams(), navigate = useNavigate();
  const [post,setPost] = useState(null), [loginUser,setLoginUser] = useState(""), [loading,setLoading] = useState(true), [error,setError] = useState(""), [busy,setBusy] = useState(false);
  const {likedPosts,error:likesError} = useLikes();
  const liked = likedPosts.some(p => String(p.id) === id);
  const loadPost = useCallback(async () => {
    setLoading(true); setError("");
    try {const res = await api.get("/load-post"); setPost((res.data || []).find(p => String(p.id) === id) || null);}
    catch {setError("이 여행 이야기를 불러오지 못했어요.");}
    finally {setLoading(false);}
  },[id]);
  useEffect(() => {loadPost();},[loadPost]);
  useEffect(() => {if (localStorage.getItem("token")) api.get("/me").then(res => setLoginUser(res.data.username)).catch(() => {});},[]);
  const toggleLike = async () => {
    if (!localStorage.getItem("token")) {navigate("/login"); return;}
    if (busy) return;
    setBusy(true); setError("");
    try {const res = liked ? await api.delete(`/posts/${id}/like`) : await api.post(`/posts/${id}/like`); setPost(current => ({...current,likes:res.data.likes})); notifyLikes();}
    catch {setError("좋아요를 저장하지 못했어요. 다시 시도해주세요.");}
    finally {setBusy(false);}
  };
  const deletePost = async () => {
    if (!window.confirm("이 여행 기록을 삭제할까요? 삭제한 글은 되돌릴 수 없어요.")) return;
    setBusy(true);
    try {await api.delete("/delete-post",{data:{id:post.id}}); notifyLikes(); navigate("/");}
    catch {setError("기록을 삭제하지 못했어요.");setBusy(false);}
  };
  if (loading) return <main className="page-shell" id="main-content"><div className="empty-state" role="status"><Mascot pose="read"/><p>여행 이야기를 펼치는 중…</p></div></main>;
  if (!post) return <main className="page-shell" id="main-content"><EmptyState title={error || "이 여행 기록을 찾지 못했어요"} description="다른 여행 이야기를 둘러볼까요?" action="둘러보기" to="/"/>{error && <button onClick={loadPost}>다시 불러오기</button>}</main>;
  return <main className="page-shell detail-page" id="main-content"><Link className="text-link" to="/"><Icon name="back" size={16}/>둘러보기</Link><div className="detail-top"><div><h1>{post.title}</h1><p className="detail-location"><Icon name="pin" size={18}/>{post.place}</p><p className="detail-meta">{post.author}의 여행 · {formatPostDate(post.written_date)}</p></div><div className="detail-bookmark"><Bookmark liked={liked} busy={busy} onClick={toggleLike}/><span>{liked ? "좋아요 취소" : "수첩에 담기"}</span></div></div>{(error || likesError) && <p role="alert" className="field-error">{error || likesError}</p>}{post.photo?.[0] && <TravelPhoto className="detail-hero" image={post.photo[0]} alt={`${post.title} 대표 여행 사진`}/>}<div className="detail-content">{post.content}</div><div className="detail-gallery">{post.photo?.slice(1).map((img,index) => <TravelPhoto key={img+index} loading="lazy" image={img} alt={`${post.title} 여행 사진 ${index+2}`}/>)}</div>{post.tag?.length > 0 && <section style={{marginTop:30}}><h2 style={{fontSize:17}}>함께 나눈 접근성 정보</h2><div className="tag-rating-list">{post.tag.map(tag => <span key={tag}>{getTagLabel(tag)}{getTagRating(tag) > 0 && ` · ${getTagRating(tag)} / 5점`}</span>)}</div></section>}<div className="detail-bottom"><div><p className="detail-meta">좋아요 {post.likes || 0} · 조회 {post.views || 0}</p>{loginUser === post.author && <div className="button-row"><Link className="button" to={`/edit/${post.id}`}>수정하기</Link><button className="button danger-button" onClick={deletePost} disabled={busy}>삭제</button></div>}<Link className="text-link" to="/" style={{fontSize:12,marginTop:15}}><Icon name="back" size={14}/>다른 여행 이야기</Link></div><Mascot pose="read"/></div></main>;
}
