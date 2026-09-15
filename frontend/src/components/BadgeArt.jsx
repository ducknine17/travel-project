import { Icon } from "./Brand";
export default function BadgeArt({ badge, small = false }) {
  return <span className={`badge-art badge-${badge.color || "sky"} ${badge.earned ? "earned" : "unearned"} ${small ? "small" : ""}`}><span className="badge-scene"><Icon name={badge.icon} size={small ? 27 : 44}/></span><span className="badge-paw"><Icon size={small ? 10 : 13}/></span></span>;
}