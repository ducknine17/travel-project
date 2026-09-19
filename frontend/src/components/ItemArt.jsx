import "../styles/ItemArt.css";

// Each viewBox displays one accessory from the shared transparent sprite.
const FRAMES = {
  compass: "140 120 310 370",
  camera: "600 130 340 325",
  bottle: "1145 90 240 400",
  book: "140 545 310 365",
  hat: "560 668 420 230",
  map: "1085 580 370 340",
};

export default function ItemArt({ item, className = "" }) {
  const frame = FRAMES[item.id];
  if (!frame) return null;
  return (
    <svg className={`travel-item-art ${className}`} viewBox={frame} preserveAspectRatio="xMidYMin meet" aria-hidden="true" focusable="false">
      <image href={`${process.env.PUBLIC_URL}/assets/bf/travel-items.png`} width="1536" height="1024"/>
    </svg>
  );
}
