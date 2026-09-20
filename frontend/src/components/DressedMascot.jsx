import { Mascot } from "./Brand";
import BadgeArt from "./BadgeArt";
import ItemArt from "./ItemArt";
import HangingAccessories from "./HangingAccessories";

export default function DressedMascot({ character, badges = [], items = [], className = "" }) {
  const hat = items.find(item => item.id === "hat");
  const tools = items.filter(item => item.id !== "hat");
  return <div className={`dressed-mascot character-${character} ${className}`} aria-label="배지와 아이템을 착용한 여행 친구">
    <Mascot character={character}/>
    {hat && <span className="worn-hat" title={hat.name}><ItemArt item={hat}/></span>}
    <HangingAccessories items={tools} className="worn-tools"/>
    <div className="worn-badges">{badges.map(b => <BadgeArt key={b.id} badge={b} small/>)}</div>
  </div>;
}
