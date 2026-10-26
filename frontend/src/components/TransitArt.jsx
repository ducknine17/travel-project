export function BusIllustration({ lowFloor = false, className = "", label }) {
  const body = lowFloor ? "#82b58a" : "#85afc8";
  const accent = lowFloor ? "#5f956a" : "#5d91b1";
  return <svg className={`bus-illustration ${className}`} viewBox="0 0 190 82" role="img" aria-label={label || (lowFloor ? "저상버스" : "일반버스")}>
    <g fill="none" stroke="#315777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 58V29c0-9 6-15 15-16h143c7 0 11 5 11 12v35H12Z" fill={body}/>
      <path d="M12 29h7l7-16M181 28h-5"/>
      <path d="M29 19h42v25H23V30c0-6 2-9 6-11Z" fill="#dcebf0"/>
      <path d="M77 19h92v25H77Z" fill="#dcebf0"/>
      <path d="M100 19v25m25-25v25m25-25v25M77 44v16m92-41v41"/>
      <path d="M9 60h175M23 50h48M80 50h88" stroke={accent} strokeWidth="4"/>
      <rect x="82" y="22" width="14" height="35" rx="1" fill="#c9e0e7"/>
      <path d="M89 22v35"/>
      <path d="M3 31v17m0-17c0-4 3-7 7-7"/>
      <circle cx="48" cy="61" r="10" fill="#eef1ec"/>
      <circle cx="48" cy="61" r="4" fill="#728493"/>
      <circle cx="148" cy="61" r="10" fill="#eef1ec"/>
      <circle cx="148" cy="61" r="4" fill="#728493"/>
      <path d="M20 34h-8m168 10h5"/>
    </g>
    {lowFloor && <g transform="translate(108 42)" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="-8" r="3" fill="#fff" stroke="none"/>
      <path d="M7-4v9h8l4 7M7 0h7M6 3a8 8 0 1 0 9 8"/>
    </g>}
  </svg>;
}

export function BusStopIllustration({ className = "" }) {
  return <svg className={`bus-stop-illustration ${className}`} viewBox="0 0 82 116" role="img" aria-label="버스 정류장">
    <g fill="none" stroke="#315777" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="15" y="5" width="52" height="52" rx="10" fill="#89b2ca"/>
      <rect x="21" y="11" width="40" height="40" rx="6" fill="#fffaf0"/>
      <rect x="29" y="19" width="24" height="19" rx="4" fill="#5d91b1"/>
      <path d="M29 31h24M34 38v5m14-5v5M38 23h7"/>
      <path d="M41 57v47"/>
      <path d="M31 104h20l3 7H28Z" fill="#6f9dbb"/>
    </g>
  </svg>;
}
