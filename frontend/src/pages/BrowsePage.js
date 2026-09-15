import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";
import PostCard from "../components/PostCard";
import FilterDrawer from "../components/FilterDrawer";
import { EmptyState, Icon, PageHeading } from "../components/Brand";
import useLikes from "../hooks/useLikes";
import { getTagLabel } from "../utils/postUtils";
import "../styles/Browse.css";

export default function BrowsePage() {
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const { likedPosts, refresh, error: likesError, loading: likesLoading } = useLikes();
  const [drawerOpen, setDrawerOpen] = useState(location.search === "?saved=1");
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [query, setQuery] = useState(""), [tag, setTag] = useState(""), [sort, setSort] = useState("recent");
  const loadPosts = useCallback(async () => {
    setLoading(true); setError("");
    try { const res = await api.get("/load-post"); setPosts(res.data || []); }
    catch { setError("여행 이야기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadPosts(); }, [loadPosts]);
  const tags = useMemo(() => [...new Set(posts.flatMap(p => (p.tag || []).map(getTagLabel)))].slice(0, 8), [posts]);
  const filtered = useMemo(() => posts.filter(p => `${p.title} ${p.place}`.toLowerCase().includes(query.trim().toLowerCase()) && (!tag || p.tag?.some(t => getTagLabel(t) === tag))).sort((a,b) => sort === "popular" ? (b.likes || 0) - (a.likes || 0) : (Date.parse(b.written_date) || 0) - (Date.parse(a.written_date) || 0)), [posts, query, tag, sort]);
  const toggleDrawer = () => { if (!drawerOpen) refresh(); setDrawerOpen(!drawerOpen); };
  return <main className="page-shell browse-page" id="main-content"><PageHeading eyebrow="EVERY LITTLE JOURNEY" title="둘러보기" description="서로의 발걸음이, 다음 여행의 길이 되도록." bag/>
    <div className="browse-toolbar"><div className="filter-pills"><button className={!tag ? "active" : ""} onClick={() => setTag("")} aria-pressed={!tag}>모든 여행</button>{tags.map(t => <button key={t} className={tag === t ? "active" : ""} aria-pressed={tag === t} onClick={() => setTag(tag === t ? "" : t)}>{t}</button>)}</div><label className="search-field"><Icon name="search" size={18}/><input aria-label="여행 이야기 검색" type="search" placeholder="어떤 여행을 찾고 있나요?" value={query} onChange={e => setQuery(e.target.value)}/></label></div>
    <div className="list-caption"><span>함께 나눈 여행 <strong>{filtered.length}</strong></span><select aria-label="게시글 정렬" value={sort} onChange={e => setSort(e.target.value)}><option value="recent">최근 이야기순</option><option value="popular">좋아요 많은순</option></select></div>
    <FilterDrawer open={drawerOpen} onToggle={toggleDrawer}>{likesError ? <div className="status-message" role="alert"><p>{likesError}</p><button onClick={refresh}>다시 불러오기</button></div> : likesLoading ? <p role="status">수첩을 펼치는 중…</p> : likedPosts.length ? likedPosts.map(post => <PostCard key={post.id} post={post} liked/>) : <EmptyState title="마음에 드는 여행을 모아보세요" description="사진 위 발바닥 책갈피를 누르면 여기에 모여요." action={!localStorage.getItem("token") ? "로그인하고 모으기" : undefined} to="/login"/>}</FilterDrawer>
    {loading ? <div className="post-grid" role="status" aria-label="여행 이야기 불러오는 중">{Array.from({length:6},(_,i) => <div className="post-skeleton" key={i}><span/><i/><i/></div>)}</div> : error ? <div className="status-message" role="alert"><EmptyState title="잠시 여행 이야기를 가져오지 못했어요" description={error}/><button className="button primary" onClick={loadPosts}>다시 불러오기</button></div> : filtered.length ? <div className="post-grid">{filtered.map(post => <PostCard key={post.id} post={post} liked={likedPosts.some(p => p.id === post.id)}/>)}</div> : <EmptyState title={query || tag ? "아직 찾는 여행이 없어요" : "우리의 첫 여행 이야기를 기다려요"} description={query || tag ? "다른 장소나 검색어로 찾아보세요." : "좋았던 풍경과 편안했던 길을 함께 나눠주세요."} action={query || tag ? undefined : "첫 여행 기록 남기기"} to={localStorage.getItem("token") ? "/write" : "/login"}/>}
    <div className="browse-note"><Icon size={17}/><span>당신의 작은 기록이 누군가에게는 여행의 시작이 됩니다.</span></div>
  </main>;
}