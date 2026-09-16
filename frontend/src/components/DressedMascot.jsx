import { Icon, Mascot } from "./Brand";
import BadgeArt from "./BadgeArt";

export default function DressedMascot({ character, badges = [], items = [], className = "" }) {
  return <div className={`dressed-mascot ${className}`} aria-label="배지와 아이템을 착용한 여행 친구"><Mascot character={character}/><div className="worn-badges">{badges.map(b => <BadgeArt key={b.id} badge={b} small/>)}</div>{items.map(item => <span key={item.id} className={`worn-item worn-${item.id}`} title={item.name}><Icon name={item.icon} size={42}/></span>)}</div>;
}
