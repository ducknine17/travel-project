import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { normalizeCharacter, readActiveCharacter } from "../data/collection";
import "../styles/Header.css";

export function Icon({ name = "paw", size = 22, ...props }) {
  const paths = {
    bus: <><rect x="4" y="3" width="16" height="16" rx="3"/><path d="M4 11h16M8 19v3M16 19v3M8 6h8"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></>,
    goggles: <><path d="M2 10h20M10 12h4"/><rect x="3" y="8" width="7" height="8" rx="3"/><rect x="14" y="8" width="7" height="8" rx="3"/></>,
    map: <><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z"/><path d="M9 3v16M15 5v16"/></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    book: <><path d="M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Z"/><path d="M12 5v16M6 8h3M15 8h3M6 12h3M15 12h3"/></>,
    camera: <><path d="M3 7h4l2-3h6l2 3h4v14H3Z"/><circle cx="12" cy="13" r="4"/></>,
    compass: <><circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/></>,
    bag: <><path d="M8 6V5a4 4 0 0 1 8 0v1M5 7h14l2 14H3Z"/><path d="M7 14h10v5H7Z"/></>,
    user: <><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2Z"/></>,
    arrow: <path d="m9 5 7 7-7 7"/>,
    back: <path d="m15 5-7 7 7 7"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/></>,
    wave: <><circle cx="16" cy="5" r="3"/><path d="M2 13q3-4 6 0t6 0 8 0M2 19q3-4 6 0t6 0 8 0"/></>,
    tree: <><path d="m8 2-6 11h4l-4 5h12l-4-5h4ZM8 18v4M18 4l-4 9h3l-3 5h8l-3-5h3ZM18 18v4"/></>,
    culture: <><path d="m2 8 10-6 10 6ZM3 21h18M5 11v7M12 11v7M19 11v7"/></>,
    message: <><path d="M21 11c0 6-6 10-12 7l-6 3 1-6C0 5 11-1 18 4a8 8 0 0 1 3 7Z"/><path d="m8 10 3 3 5-5"/></>,
    flag: <><path d="M5 22V2l15 3-15 5M10 22h-9"/><path d="m12 20 2-2 2 2 3-3"/></>,
    star: <path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>,
    bottle: <><path d="M9 2h6v5l3 3v12H6V10l3-3ZM9 5h6M9 14h6M12 11v6"/></>,
    scarf: <><path d="M5 3h14v6H5ZM8 9l-2 12h6l2-12M14 9l4 9 4-3-5-6"/></>,
    heart: <path d="M12 21S1 14 2 7c1-6 8-6 10-1 2-5 9-5 10 1 1 7-10 14-10 14Z"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{name === "paw" ? <g fill="currentColor" stroke="none"><ellipse cx="5" cy="9" rx="2.6" ry="3.5" transform="rotate(-25 5 9)"/><ellipse cx="9.5" cy="5" rx="2.5" ry="3.3"/><ellipse cx="15.2" cy="5.5" rx="2.5" ry="3.3" transform="rotate(15 15 5)"/><ellipse cx="19.6" cy="10" rx="2.6" ry="3.4" transform="rotate(25 20 10)"/><path d="M5.8 18c0-3 3.5-7 6.3-7s6.5 4.2 6.5 7.2c0 4.8-4.1 2.2-6.4 2.2S5.8 22.7 5.8 18Z"/></g> : paths[name] || paths.star}</svg>;
}

export function Logo() {
  return <Link className="brand-logo" to="/" aria-label="BF 베프 홈"><img src={`${process.env.PUBLIC_URL}/assets/bf/bef-logo.png`} alt=""/></Link>;
}

export function Mascot({ pose = "bag", className = "", character }) {
  const [activeCharacter, setActiveCharacter] = useState(readActiveCharacter);
  useEffect(() => {
    const updateCharacter = event => setActiveCharacter(normalizeCharacter(event.detail));
    window.addEventListener("bef-character-change", updateCharacter);
    return () => window.removeEventListener("bef-character-change", updateCharacter);
  }, []);
  const displayedCharacter = normalizeCharacter(character ?? activeCharacter);
  return <span aria-hidden="true" className={`mascot mascot-${pose} ${displayedCharacter !== "retriever" ? `mascot-friend friend-${displayedCharacter}` : ""} ${className}`} />;
}

export function BagLink() {
  return <Link className="bag-link" to="/mypage"><Mascot/><span>내 가방 <Icon name="arrow" size={16}/></span></Link>;
}

export function PageHeading({ eyebrow, title, description, bag = false, children }) {
  return <div className="page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-description">{description}</p>}{children}</div>{bag && <BagLink/>}</div>;
}

export function EmptyState({ title = "아직 담긴 여행이 없어요", description, action, to = "/write", pose = "read" }) {
  return <div className="empty-state"><Mascot pose={pose}/><h3>{title}</h3><p>{description}</p>{action && <Link className="button primary" to={to}>{action}<Icon name="arrow" size={16}/></Link>}</div>;
}

export function Bookmark({ liked, busy, onClick, label }) {
  return <button className={`bookmark ${liked ? "is-liked" : ""}`} type="button" aria-label={label || (liked ? "좋아요 취소" : "좋아요")} aria-pressed={liked} disabled={busy} onClick={onClick}><span className="bookmark-heart"><Icon name="heart" size={33}/><Icon size={17}/></span></button>;
}
