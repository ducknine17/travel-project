import { Mascot } from "./Brand";
import BadgeArt from "./BadgeArt";
import HangingAccessories from "./HangingAccessories";

export default function DressedMascot({ character, badges = [], items = [], className = "" }) {
  return <div className={`dressed-mascot character-${character} ${className}`} aria-label="배지와 아이템을 착용한 여행 친구">
    <Mascot character={character}/>
    <HangingAccessories items={items} className="worn-tools"/>
    <div className="worn-badges">{badges.map(b => <BadgeArt key={b.id} badge={b} small/>)}</div>
  </div>;
}
