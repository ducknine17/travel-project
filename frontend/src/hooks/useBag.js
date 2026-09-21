import { useCallback, useEffect, useMemo, useState } from "react";
import { profileName } from "../utils/profile";
import api from "../services/api";
import { getCharacterIndex, getCollection, normalizeCharacter, normalizeCustomization, readBagSettings, setActiveCharacter } from "../data/collection";

const hasCustomization = value => value.badges.length > 0 || value.items.length > 0 || !!value.friendName;
const sameCustomization = (left, right) => JSON.stringify(normalizeCustomization(left)) === JSON.stringify(normalizeCustomization(right));
const customizationPayload = value => ({
  badges: value.badges,
  items: value.items,
  friend_name: value.friendName,
});

export default function useBag() {
  const [profile, setProfile] = useState({});
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
      setProfile(me.data);
      const savedSettings = readBagSettings(me.data.username);
      const serverCustomization = normalizeCustomization(me.data.character_customization);
      const syncKey = `bef_customization_synced:${me.data.username}`;
      let customization = serverCustomization;
      if (!localStorage.getItem(syncKey) && !hasCustomization(serverCustomization) && hasCustomization(savedSettings)) {
        await api.put("/me/character-customization", customizationPayload(savedSettings));
        customization = normalizeCustomization(savedSettings);
      }
      localStorage.setItem(syncKey, "1");
      const nextSettings = {
        ...savedSettings,
        ...customization,
        character: me.data.character == null ? savedSettings.character : normalizeCharacter(me.data.character),
      };
      localStorage.setItem(`bef_bag:${me.data.username}`, JSON.stringify(nextSettings));
      setSettings(nextSettings);
      setActiveCharacter(nextSettings.character);
      setPosts((allPosts.data || []).filter(p => p.author === me.data.username));
    } catch { setError("가방 속 기록을 불러오지 못했어요. 잠시 후 다시 열어주세요."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); api.get("/place-options").then(r => setPlaces(r.data || [])).catch(() => {}); }, [load]);
  const collection = useMemo(() => getCollection(posts, places), [posts, places]);
  const saveSettings = async (next) => {
    if (!username) return false;
    const normalized = { ...normalizeCustomization(next), character: normalizeCharacter(next.character) };
    try {
      const requests = [];
      if (normalized.character !== settings.character) requests.push(
        api.put("/me/character", { character: getCharacterIndex(normalized.character) })
      );
      if (!sameCustomization(normalized, settings)) requests.push(
        api.put("/me/character-customization", customizationPayload(normalized))
      );
      await Promise.all(requests);
      localStorage.setItem(`bef_bag:${username}`, JSON.stringify(normalized));
      setSettings(normalized);
      setActiveCharacter(normalized.character);
      return true;
    }
    catch { setError("가방 설정을 저장하지 못했어요. 잠시 후 다시 시도해주세요."); return false; }
  };
  return { displayName: profileName(profile), avatar: profile.avatar, username, posts, places, loading, error, reload: load, settings, saveSettings, ...collection };
}
