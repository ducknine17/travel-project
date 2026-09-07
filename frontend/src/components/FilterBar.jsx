const TAG_OPTIONS = [
  "♿ 휠체어",
  "🛗 엘리베이터",
  "↗️ 경사로",
  "🚻 장애인 화장실",
  "🅿️ 장애인 주차장",
  "🚼 유아차",
  "🐶 반려동물",
  "☕ 카페",
  "🍴 음식점",
  "🏞 관광지",
];

function FilterBar({ filters, onChange, onReset }) {
  return (
    <div className="filter-bar" aria-label="게시글 필터">
      <label>
        태그
        <select
          aria-label="태그 필터"
          value={filters.tag}
          onChange={(event) => onChange({ ...filters, tag: event.target.value })}
        >
          <option value="">전체</option>
          {TAG_OPTIONS.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </label>

      <label>
        위치
        <input
          type="search"
          aria-label="위치 필터"
          placeholder="장소명 검색"
          value={filters.location}
          onChange={(event) => onChange({ ...filters, location: event.target.value })}
        />
      </label>

      <label>
        최소 별점
        <select
          aria-label="별점 필터"
          value={filters.minRating}
          onChange={(event) => onChange({ ...filters, minRating: Number(event.target.value) })}
        >
          <option value={0}>전체</option>
          {[1, 2, 3, 4, 5].map((rating) => (
            <option key={rating} value={rating}>{rating}점 이상</option>
          ))}
        </select>
      </label>

      <button type="button" onClick={onReset}>초기화</button>
    </div>
  );
}

export default FilterBar;
