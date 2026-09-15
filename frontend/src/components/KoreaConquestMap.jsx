import { Icon } from "./Brand";
import "../styles/MyPage.css";

const POINTS = { seoul:[42,24], incheon:[29,31], gyeonggi:[53,33], gangwon:[68,20], chungcheong:[43,48], gyeongsang:[67,59], jeolla:[37,66], jeju:[31,89] };
export default function KoreaConquestMap({ regions, postsByRegion, likedByRegion = {}, selectedRegionKey, onSelectRegion }) {
  const active = regions.filter(r => postsByRegion[r.key]?.length);
  return <div className="korea-map-shell" aria-label="지역별 여행 기록 지도">
    <svg className="illustrated-map" viewBox="0 0 600 440" aria-hidden="true">
      <defs><pattern id="sea-lines" width="70" height="65" patternUnits="userSpaceOnUse"><path d="M8 35q5 5 10 0t10 0" fill="none" stroke="#f9fcf8" strokeWidth="1.7" opacity=".7"/></pattern><pattern id="map-grain" width="17" height="17" patternUnits="userSpaceOnUse"><circle cx="3" cy="9" r=".7" fill="#b5a37a" opacity=".22"/></pattern></defs>
      <rect x="0" y="0" width="600" height="440" rx="20" fill="#c2dce3"/><rect width="600" height="440" fill="url(#sea-lines)"/>
      <path d="M259 45 304 47 348 30 365 50 378 83 399 108 409 142 421 173 431 205 424 244 436 267 421 284 397 292 381 313 351 322 335 307 319 320 301 312 279 337 263 324 242 344 225 323 207 318 189 300 208 281 193 263 214 242 205 226 224 211 216 196 236 179 227 159 241 140 227 126 248 110 240 93 263 83Z" fill="#f7f0db" stroke="#b4b995" strokeWidth="1.7"/>
      <path d="m256 169 12-37 19 38 19-43 25 38m21 46 13-36 17 38 19-51 25 52m-141 54 13-32 16 34 15-40 26 42" fill="#b2bf9c" stroke="none" opacity=".55"/>
      <path d="m266 164 8-22 13 23m20-9 6-17 10 19m72 50 7-24 12 25" fill="#cbd4b6"/>
      <path d="M327 78c-42 73 53 126-28 219" fill="none" stroke="#bed9dd" strokeWidth="5"/>
      <ellipse cx="189" cy="390" rx="38" ry="15" fill="#f7f0db" stroke="#b4b995" strokeWidth="1.5"/><ellipse cx="449" cy="100" rx="6" ry="4" fill="#f7f0db"/>
      <path d="M160 250l-8 18h16Zm285-42-8 18h16Zm-81 114-8 18h16ZM330 85l-8 18h16Z" fill="#879f8b"/><path d="M160 268v8m285-50v8m-81 102v8M330 103v8" stroke="#6d8370" strokeWidth="3"/>
      <g transform="translate(493 278)" stroke="#8c9aa2" strokeWidth="1.3"><path d="M-9 34h24l-4-34H-4Z" fill="#fff7e4"/><path d="M-7 12h20M-5 4h16M-7 20h21" stroke="#ccab86" strokeWidth="5"/><path d="m-8-2 11-8 12 8Z" fill="#6d8291"/></g>
      <g transform="translate(91 99)" stroke="#b69a69" strokeWidth="1.2"><path d="m0-19 5 14 14 5-14 5-5 14-5-14-14-5 14-5Z" fill="#fff8e8"/><path d="M0-19V19M-19 0h38"/></g>
      <text x="88" y="65" fill="#6e95a4" fontSize="12" fontFamily="serif">N</text>
      <path d="M466 382h32l-8 12h-18Z" fill="#6e8c9c"/><path d="M482 351v29h-19Z" fill="#fff9ec"/><path d="M484 347v35" stroke="#899da4" strokeWidth="1.5"/>
      {active.length > 1 && <polyline points={active.map(r => `${POINTS[r.key][0]*6},${POINTS[r.key][1]*4.4}`).join(" ")} fill="none" stroke="#527494" strokeWidth="2" strokeDasharray="5 8" opacity=".75"/>}
      <path d="M259 45 304 47 348 30 365 50 378 83 399 108 409 142 421 173 431 205 424 244 436 267 421 284 397 292 381 313 351 322 335 307 319 320 301 312 279 337 263 324 242 344 225 323 207 318 189 300 208 281 193 263 214 242 205 226 224 211 216 196 236 179 227 159 241 140 227 126 248 110 240 93 263 83Z" fill="url(#map-grain)" />
    </svg>
    {regions.map(region => {
      const count = postsByRegion[region.key]?.length || 0, saved = likedByRegion[region.key]?.length || 0;
      return <button type="button" key={region.key} className={`region-marker ${count ? "recorded" : ""} ${selectedRegionKey === region.key ? "selected" : ""}`} style={{left: `${POINTS[region.key][0]}%`, top:`${POINTS[region.key][1]}%`}} onClick={() => onSelectRegion(region.key)} aria-pressed={selectedRegionKey === region.key} aria-label={`${region.label} 여행 기록 ${count}개, 좋아요한 장소 ${saved}개`}>
        {count ? <Icon size={25}/> : saved ? <Icon name="pin" size={25}/> : <span className="map-dot"/>}<span>{region.label}{count > 0 && <b>{count}</b>}</span>
      </button>;
    })}
    <span className="map-footnote">지역별 기록을 펼쳐보세요</span>
  </div>;
}