export const KOREA_REGIONS = [
  { key: "seoul", label: "서울", x: 44, y: 20, aliases: ["서울", "서울숲", "경복궁", "홍대", "명동"] },
  { key: "gyeonggi", label: "경기", x: 50, y: 27, aliases: ["경기", "수원", "파주", "가평", "용인"] },
  { key: "incheon", label: "인천", x: 36, y: 28, aliases: ["인천", "송도", "강화"] },
  { key: "gangwon", label: "강원", x: 66, y: 20, aliases: ["강원", "강릉", "속초", "양양", "춘천", "안목"] },
  { key: "chungcheong", label: "충청", x: 49, y: 43, aliases: ["충청", "대전", "세종", "청주", "공주", "단양"] },
  { key: "gyeongsang", label: "경상", x: 67, y: 55, aliases: ["경상", "부산", "대구", "울산", "경주", "포항", "해운대", "대릉원"] },
  { key: "jeolla", label: "전라", x: 42, y: 64, aliases: ["전라", "광주", "전주", "여수", "순천", "목포", "한옥마을"] },
  { key: "jeju", label: "제주", x: 38, y: 88, aliases: ["제주", "성산", "성산일출봉", "서귀포", "협재"] },
];

export const findRegionByPlace = (placeName = "") => {
  const normalized = placeName.toLocaleLowerCase("ko-KR");

  return (
    KOREA_REGIONS.find((region) =>
      region.aliases.some((alias) =>
        normalized.includes(alias.toLocaleLowerCase("ko-KR"))
      )
    ) || KOREA_REGIONS[1]
  );
};
