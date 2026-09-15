import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

export const notifyLikes = () => window.dispatchEvent(new Event("bef-likes-changed"));

export default function useLikes() {
  const [likedPosts, setLikedPosts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(async () => {
    if (!localStorage.getItem("token")) { setLikedPosts([]); return; }
    setLoading(true); setError("");
    try { const res = await api.get("/liked-posts"); setLikedPosts(res.data || []); }
    catch { setError("좋아요한 글을 불러오지 못했어요. 다시 시도해 주세요."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); window.addEventListener("bef-likes-changed", refresh); return () => window.removeEventListener("bef-likes-changed", refresh); }, [refresh]);
  return { likedPosts, refresh, error, loading };
}
