import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getCollection, readBagSettings } from "../data/collection";

export default function useBag() {
  const [username, setUsername] = useState("");
  const [posts, setPosts] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(!!localStorage.getItem("token"));
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(() => readBagSettings(""));
  const load = useCallback(async () => {
    if (!localStorage.getItem("token")) { setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const [me, allPosts] = await Promise.all([api.get("/me"), api.get("/load-post")]);
      setUsername(me.data.username);
      setSettings(readBagSettings(me.data.username));
      setPosts((allPosts.data || []).filter(p => p.author === me.data.username));
    } catch { setError("가방 속 기록을 불러오지 못했어요. 잠시 후 다시 열어주세요."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); api.get("/place-options").then(r => setPlaces(r.data || [])).catch(() => {}); }, [load]);
  const collection = useMemo(() => getCollection(posts, places), [posts, places]);
  const saveSettings = (next) => {
    if (!username) return false;
    try { localStorage.setItem(`bef_bag:${username}`, JSON.stringify(next)); setSettings(next); return true; }
    catch { setError("꾸미기를 저장할 공간이 부족해요. 브라우저 저장 공간을 확인해주세요."); return false; }
  };
  return { username, posts, places, loading, error, reload: load, settings, saveSettings, ...collection };
}
