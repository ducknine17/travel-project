import { getDateKey } from "../utils/postUtils";

export const BADGES = [
  { id: "sea", name: "바다 한 걸음", icon: "wave", group: "여행의 풍경", color: "sky", condition: "바다 여행 기록이 확인되면 만나요", pending: true },
  { id: "forest", name: "초록 한 걸음", icon: "tree", group: "여행의 풍경", color: "sage", condition: "공원·숲·정원 여행 기록이 확인되면 만나요", pending: true },
  { id: "culture", name: "문화 한 걸음", icon: "culture", group: "여행의 풍경", color: "sand", condition: "문화시설에서의 첫 여행 글을 남겨주세요" },
  { id: "first", name: "첫 여행 기록", icon: "book", group: "기록과 나눔", color: "sky", condition: "첫 여행 글을 등록해주세요" },
  { id: "help", name: "도움이 된 정보", icon: "message", group: "기록과 나눔", color: "sage", condition: "접근성 정보의 도움 평가가 확인되면 만나요", pending: true },
  { id: "report", name: "새로운 길 제보", icon: "pin", group: "기록과 나눔", color: "sand", condition: "장소·접근성 제보가 반영되면 만나요", pending: true },
  { id: "visit", name: "첫 발자취", icon: "paw", group: "함께한 시간", color: "sand", condition: "첫 장소 방문 인증이 확인되면 만나요", pending: true },
  { id: "five", name: "다섯 번의 여행", icon: "flag", group: "함께한 시간", color: "sky", condition: "서로 다른 5일에 여행 글을 남겨주세요" },
  { id: "ten", name: "열 번의 여행", icon: "star", group: "함께한 시간", color: "sage", condition: "서로 다른 10일에 여행 글을 남겨주세요" },
];

export const ITEMS = [
  { id: "compass", name: "나침반", icon: "compass", condition: "서로 다른 장소 5곳의 여행 글 작성" },
  { id: "camera", name: "카메라", icon: "camera", condition: "사진이 있는 여행 글 5개 작성" },
  { id: "bottle", name: "텀블러", icon: "bottle", condition: "친환경 여행지 방문 확인", pending: true },
  { id: "book", name: "여행 수첩", icon: "book", condition: "첫 여행 글 작성" },
  { id: "hat", name: "여행 모자", icon: "hat", condition: "서로 다른 5일에 여행 글 작성" },
  { id: "scarf", name: "파란 스카프", icon: "scarf", condition: "첫 여행 글 작성" },
];

export const CHARACTERS = [{ id: "retriever", name: "리트리버", description: "다정한 발걸음" }, { id: "poodle", name: "푸들", description: "호기심 가득한 친구" }, { id: "shiba", name: "시바견", description: "씩씩한 모험 친구" }, { id: "dachshund", name: "닥스훈트", description: "느긋한 산책 친구" }];
export const CHARACTER_IDS = CHARACTERS.map(character => character.id);

const ACTIVE_CHARACTER_KEY = "bef_active_character";
export const normalizeCharacter = (value, fallback = "retriever") => {
  if (Number.isInteger(value) && CHARACTER_IDS[value]) return CHARACTER_IDS[value];
  return CHARACTER_IDS.includes(value) ? value : fallback;
};
export const getCharacterIndex = character => Math.max(0, CHARACTER_IDS.indexOf(normalizeCharacter(character)));
export const readActiveCharacter = () => normalizeCharacter(localStorage.getItem(ACTIVE_CHARACTER_KEY));
export const setActiveCharacter = character => {
  const normalized = normalizeCharacter(character);
  localStorage.setItem(ACTIVE_CHARACTER_KEY, normalized);
  window.dispatchEvent(new CustomEvent("bef-character-change", { detail: normalized }));
  return normalized;
};

export function getCollection(posts = [], places = []) {
  const dated = posts.filter(p => p.written_date && !Number.isNaN(new Date(p.written_date).getTime()));
  const days = new Set(dated.map(p => getDateKey(p.written_date))).size;
  const culturePlaces = new Set(places.filter(p => p.type === "culture").map(p => p.name));
  const earned = { first: posts.length > 0, culture: posts.some(p => culturePlaces.has(p.place)), five: days >= 5, ten: days >= 10 };
  const placeCount = new Set(posts.map(p => p.place?.trim()).filter(Boolean)).size;
  const items = { compass: placeCount >= 5, camera: posts.filter(p => p.photo?.length).length >= 5, book: posts.length > 0, hat: days >= 5, scarf: posts.length > 0 };
  return { badges: BADGES.map(b => ({ ...b, earned: !!earned[b.id] })), items: ITEMS.map(i => ({ ...i, earned: !!items[i.id] })), days, placeCount, level: days >= 10 ? "든든한 여행 친구" : days >= 5 ? "익숙한 여행 친구" : posts.length ? "첫걸음을 함께한 친구" : "여행을 기다리는 친구" };
}

export function readBagSettings(username) {
  try { const value = JSON.parse(localStorage.getItem(`bef_bag:${username}`)); return { character: normalizeCharacter(value?.character), badges: Array.isArray(value?.badges) ? value.badges : [], items: Array.isArray(value?.items) ? [...new Set(value.items.map(id => id === "map" || id === "goggles" ? "scarf" : id))] : [], friendName: typeof value?.friendName === "string" ? value.friendName.slice(0, 16) : "" }; }
  catch { return { character: "retriever", badges: [], items: [] }; }
}
