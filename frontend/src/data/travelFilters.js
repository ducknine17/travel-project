import { getTagLabel } from "../utils/postUtils";

export const PLACE_CATEGORIES = [
  { id: "sea", label: "바다" }, { id: "forest", label: "공원·숲" },
  { id: "culture", label: "문화·전시" }, { id: "tour", label: "관광·체험" },
  { id: "food", label: "음식점" }, { id: "cafe", label: "카페" }, { id: "stay", label: "숙박" },
];
export const FACILITY_GROUPS = [
  { key: "mobility", label: "이동·출입", filters: [
    ["parking", "접근 가능한 주차시설", "🅿️ 장애인 주차장"], ["publictransport", "대중교통 접근"],
    ["route", "접근로", "↗️ 경사로"], ["exit", "출입통로"], ["elevator", "엘리베이터", "🛗 엘리베이터"], ["wheelchair", "휠체어 대여", "♿ 휠체어"],
  ] },
  { key: "facilities", label: "시설 이용", filters: [["ticketoffice", "이용 가능한 매표소"], ["restroom", "장애인 화장실", "🚻 장애인 화장실"], ["auditorium", "장애인 관람석"], ["room", "접근 가능한 객실"], ["handicapetc", "기타 이동 편의"]] },
  { key: "visual", label: "시각 안내", filters: [["braileblock", "점자블록"], ["guidesystem", "유도 안내"], ["brailepromotion", "점자 안내물"], ["bigprint", "큰 글씨 안내물"], ["audioguide", "음성 안내"], ["guidehuman", "안내요원"], ["helpdog", "보조견 동반"], ["promotion", "안내 홍보물"], ["blindhandicapetc", "기타 시각 안내"]] },
  { key: "hearing", label: "청각 안내", filters: [["signguide", "수어 안내"], ["videoguide", "자막 안내"], ["hearingroom", "청각 지원 객실"], ["hearinghandicapetc", "기타 청각 안내"]] },
  { key: "family", label: "영유아 동반", filters: [["stroller", "유모차 대여", "🚼 유아차"], ["lactationroom", "수유실"], ["babysparechair", "유아용 의자"], ["infantsfamilyetc", "기타 영유아 편의"]] },
].map(group => ({ ...group, filters: group.filters.map(([key, label, legacy]) => ({ key, label, legacy })) }));
export const FACILITIES = FACILITY_GROUPS.flatMap(group => group.filters);
export const facilityLabel = key => FACILITIES.find(f => f.key === key)?.label || key;
export const hasFacility = (tags = [], key) => {
  const facility = FACILITIES.find(f => f.key === key);
  return tags.some(tag => [key, facility?.label, facility?.legacy].filter(Boolean).includes(getTagLabel(tag)));
};
// Older records only have broad place types. Retain them with a name-based fallback.
export function placeCategory(place = {}) {
  const name = place.name || "";
  if (/카페|커피|찻집|다방/.test(name)) return "cafe";
  if (place.type === "food") return "food";
  if (place.type === "stay") return "stay";
  if (place.type === "culture") return "culture";
  if (/해변|해수욕장|해안|바다|바닷/.test(name)) return "sea";
  if (/공원|수목원|숲|자연휴양림|정원/.test(name)) return "forest";
  return "tour";
}
export function postCategory(post, places = []) {
  const explicit = post.tag?.map(getTagLabel).find(tag => tag.startsWith("category:"));
  if (explicit) return explicit.slice(9);
  if (post.tag?.some(t => getTagLabel(t) === "☕ 카페")) return "cafe";
  if (post.tag?.some(t => getTagLabel(t) === "🍴 음식점")) return "food";
  return placeCategory(places.find(p => p.name === post.place) || { name: post.place });
}

export const displayTravelTag = tag => { const value = getTagLabel(tag); return value.startsWith("category:") ? PLACE_CATEGORIES.find(c => c.id === value.slice(9))?.label || "여행" : facilityLabel(value); };
