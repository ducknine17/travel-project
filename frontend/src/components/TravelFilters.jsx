import { FACILITY_GROUPS, PLACE_CATEGORIES } from "../data/travelFilters";

export default function TravelFilters({ category, onCategory, selected, onToggle, onReset, available }) {
  return <div className="travel-filters">
    <fieldset className="category-filter"><legend>장소 종류 <span>어디로 갈까요?</span></legend><div className="filter-pills">
      <button type="button" className={!category ? "active" : ""} aria-pressed={!category} onClick={() => onCategory("")}>모든 여행</button>
      {PLACE_CATEGORIES.map(c => <button type="button" key={c.id} className={category === c.id ? "active" : ""} aria-pressed={category === c.id} onClick={() => onCategory(category === c.id ? "" : c.id)}>{c.label}</button>)}
    </div></fieldset>
    <fieldset className="facility-filter"><legend>편의시설 <span>무엇이 필요할까요?</span></legend><div className="facility-groups">
      {FACILITY_GROUPS.map(group => <details key={group.key}><summary>{group.label}{selected.some(key => group.filters.some(f => f.key === key)) && <b>{group.filters.filter(f => selected.includes(f.key)).length}</b>}</summary><div className="facility-options">{group.filters.filter(f => !available || available.includes(f.key)).map(f => <label key={f.key}><input type="checkbox" checked={selected.includes(f.key)} onChange={() => onToggle(f.key)}/>{f.label}</label>)}</div></details>)}
    </div></fieldset>
    {(category || selected.length > 0) && <button type="button" className="text-button filter-reset" onClick={onReset}>필터 초기화 · {selected.length + (category ? 1 : 0)}개 선택</button>}
  </div>;
}
