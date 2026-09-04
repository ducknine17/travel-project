import "../styles/MyPage.css";

function KoreaConquestMap({
  regions,
  postsByRegion,
  selectedRegionKey,
  onSelectRegion,
}) {
  return (
    <div className="korea-map-shell" aria-label="대한민국 방문 지도">
      <svg
        className="korea-map-shape"
        viewBox="0 0 220 320"
        role="img"
        aria-labelledby="korea-map-title"
      >
        <title id="korea-map-title">대한민국 지도</title>
        <path
          d="M90 12 C121 11 151 29 162 58 C177 96 154 118 168 150 C181 179 193 199 181 230 C170 258 142 263 129 292 C119 315 87 312 75 291 C64 272 51 268 34 253 C13 235 18 204 37 190 C58 174 58 153 47 130 C35 104 43 76 62 61 C78 48 70 18 90 12 Z"
          fill="#f7faf7"
          stroke="#285943"
          strokeWidth="5"
        />
        <path
          d="M82 24 C95 31 108 45 111 63"
          fill="none"
          stroke="#9fc0ad"
          strokeWidth="3"
        />
        <path
          d="M66 102 C94 106 122 103 151 88"
          fill="none"
          stroke="#d3dfd7"
          strokeWidth="2"
        />
        <path
          d="M55 171 C93 164 127 170 169 157"
          fill="none"
          stroke="#d3dfd7"
          strokeWidth="2"
        />
        <path
          d="M45 230 C81 215 127 223 158 244"
          fill="none"
          stroke="#d3dfd7"
          strokeWidth="2"
        />
        <ellipse
          cx="78"
          cy="292"
          rx="25"
          ry="13"
          fill="#f7faf7"
          stroke="#285943"
          strokeWidth="4"
        />
      </svg>

      {regions.map((region) => {
        const count = postsByRegion[region.key]?.length || 0;
        const selected = selectedRegionKey === region.key;

        return (
          <button
            type="button"
            key={region.key}
            className={`region-marker ${count > 0 ? "claimed" : ""} ${
              selected ? "selected" : ""
            }`}
            style={{ left: `${region.x}%`, top: `${region.y}%` }}
            onClick={() => onSelectRegion(region.key)}
            aria-label={`${region.label} ${count}개 기록`}
          >
            <span>{region.label}</span>
            {count > 0 && <strong>{count}</strong>}
          </button>
        );
      })}
    </div>
  );
}

export default KoreaConquestMap;
