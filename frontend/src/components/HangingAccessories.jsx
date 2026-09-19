import ItemArt from "./ItemArt";
import "../styles/HangingAccessories.css";

const RINGS = { compass: [0.64, 3], camera: [0.51, 3], bottle: [0.48, 3], book: [0.51, 3], map: [0.19, 4] };

export default function HangingAccessories({ items, className = "" }) {
  if (!items.length) return null;
  const positions = items.length === 1 ? [[24, 58]] : items.length === 2 ? [[3, 52], [57, 94]] : [[0, 48], [58, 78], [18, 122]];
  return <svg className={`hanging-accessories ${className}`} viewBox="0 0 120 190" role="img" aria-label={`가방 고리에 매단 ${items.map(item => item.name).join(", ")}`}>
    <rect className="hanger-tab" x="18" y="1" width="21" height="27" rx="5"/>
    <path className="hanger-stitch" d="M23 5v13M34 5v13"/>
    <circle className="hanger-rivet" cx="28.5" cy="9" r="2.5"/>
    <ellipse className="hanger-ring" cx="28.5" cy="29" rx="10" ry="12"/>
    {items.slice(0, 3).map((item, index) => {
      const [x, y] = positions[index];
      const [ringX, ringY] = RINGS[item.id] || [0.5, 3];
      const endX = x + 56 * ringX, endY = y + ringY;
      return <path key={item.id} className="hanger-cord" d={`M28.5 38 Q${endX + 8} ${endY - 18} ${endX} ${endY}`}/>;
    })}
    {items.slice(0, 3).map((item, index) => <svg key={item.id} x={positions[index][0]} y={positions[index][1]} width="56" height="66" className="hanger-piece"><title>{item.name}</title><ItemArt item={item}/></svg>)}
  </svg>;
}
