// SVG markers follow the cream/navy/blue reference; low-floor buses carry ♿ as well as green.
const bus = (color, accessible) => `<rect x="4" y="9" width="56" height="29" rx="7" fill="${color}"/><path d="M9 14h43v13H9z" fill="#e4f0f4"/><path d="M22 14v13m13-13v13M5 30h52"/><circle cx="16" cy="39" r="5" fill="#fffcf3"/><circle cx="49" cy="39" r="5" fill="#fffcf3"/>${accessible ? '<text x="35" y="37" font-size="14" fill="white" stroke="none">♿</text>' : ''}`;
export function markerImage(kind) {
  const shapes = {
    place: '<path d="M10 4h26q6 0 6 6v22q0 6-6 6h-8l-5 9-5-9h-8q-6 0-6-6V10q0-6 6-6Z" fill="#fffcf3"/><path d="M23 29s-13-8-9-14q5-5 9 1 4-6 9-1 4 6-9 14Z" fill="#517ea6" stroke="none"/>',
    station: '<path d="M22 31v18M14 49h16"/><rect x="5" y="3" width="34" height="32" rx="8" fill="#91b8cf"/><rect x="12" y="9" width="20" height="20" rx="4" fill="#fffcf3"/><path d="M15 13h14v8H15z" fill="#517ea6"/><path d="M17 28v3m10-3v3"/>',
    bus: bus('#517ea6', false), lowBus: bus('#749b73', true), unknownBus: bus('#7e8991', false),
  };
  const isBus = kind === 'bus' || kind === 'lowBus' || kind === 'unknownBus', width = isBus ? 64 : 46, height = isBus ? 48 : 52;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" stroke="#173858" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${shapes[kind]}</svg>`;
  return new window.kakao.maps.MarkerImage(`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, new window.kakao.maps.Size(width, height), {offset: new window.kakao.maps.Point(width / 2, height - 2)});
}
