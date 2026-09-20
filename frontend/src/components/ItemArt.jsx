import "../styles/ItemArt.css";

// Each viewBox displays one accessory from the shared transparent sprite.
const FRAMES = {
  compass: "90 80 390 440",
  camera: "560 100 430 400",
  bottle: "1145 65 300 470",
  book: "85 530 390 420",
  hat: "500 600 540 340",
  scarf: "1050 650 460 330",
};

export default function ItemArt({ item, className = "" }) {
  const frame = FRAMES[item.id];
  if (!frame) return null;
  return (
    <svg className={`travel-item-art ${className}`} viewBox={frame} preserveAspectRatio="xMidYMin meet" aria-hidden="true" focusable="false">
      <image href={`${process.env.PUBLIC_URL}/assets/bf/travel-items.png?v=20260921`} width="1536" height="1024"/>
    </svg>
  );
}
