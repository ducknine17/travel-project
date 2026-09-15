import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";
import TravelPhoto from "./TravelPhoto";
import { Bookmark, Icon } from "./Brand";
import { notifyLikes } from "../hooks/useLikes";
import "../styles/PostCard.css";

export default function PostCard({ post, liked: initialLiked = false }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(initialLiked), [busy, setBusy] = useState(false);
  const [imageError, setImageError] = useState(false), [error, setError] = useState("");
  useEffect(() => { setLiked(initialLiked); }, [initialLiked]);
  const handleLike = async () => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    if (busy) return;
    setBusy(true); setError("");
    try {
      if (liked) await api.delete(`/posts/${post.id}/like`); else await api.post(`/posts/${post.id}/like`);
      setLiked(!liked); notifyLikes();
    } catch { setError("좋아요를 저장하지 못했어요. 다시 눌러주세요."); }
    finally { setBusy(false); }
  };
  return <article className="post-card"><div className="post-image"><Link to={`/post/${post.id}`} tabIndex={-1} aria-hidden="true">{post.photo?.[0] && !imageError ? <TravelPhoto image={post.photo[0]} alt="" loading="lazy" onError={() => setImageError(true)}/> : <span className="photo-placeholder"><Icon name="camera" size={38}/><span>사진으로 담은 여행</span></span>}</Link><Bookmark liked={liked} busy={busy} onClick={handleLike} label={`${post.title} ${liked ? "좋아요 취소" : "좋아요"}`}/></div><Link className="post-title" to={`/post/${post.id}`}>{post.title}</Link><p className="post-place"><Icon name="pin" size={15}/>{post.place || "장소 미등록"}</p>{error && <p className="field-error" role="alert">{error}</p>}</article>;
}
