import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { profileName } from "../utils/profile";
import api from "../services/api";
import { Icon, Logo } from "./Brand";
import { notifyLikes } from "../hooks/useLikes";
import { normalizeCharacter, setActiveCharacter } from "../data/collection";

export default function Header() {
  const navigate = useNavigate(), location = useLocation();
  const [authStatus, setAuthStatus] = useState(localStorage.getItem("token") ? "checking" : "unauthenticated");
  const [username, setUsername] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const menu = useRef(null);
  useEffect(() => {
    setShowMenu(false);
    if (!localStorage.getItem("token")) { setAuthStatus("unauthenticated"); setUsername(""); setActiveCharacter("retriever"); return; }
    let cancelled = false;
    setAuthStatus("checking");
    api.get("/me").then(res => {
      if (!cancelled) { setUsername(profileName(res.data)); setActiveCharacter(normalizeCharacter(res.data.character)); setAuthStatus("authenticated"); }
    }).catch(err => {
      if (cancelled) return;
      if (err.response?.status === 401) localStorage.removeItem("token");
      setUsername(""); setActiveCharacter("retriever"); setAuthStatus("unauthenticated");
    });
    return () => { cancelled = true; };
  }, [location.pathname]);
  useEffect(() => {
    const dismiss = e => { if (!menu.current?.contains(e.target)) setShowMenu(false); };
    const escape = e => { if (e.key === "Escape") setShowMenu(false); };
    document.addEventListener("mousedown", dismiss); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", dismiss); document.removeEventListener("keydown", escape); };
  }, []);
  useEffect(() => {
    const update = e => setUsername(profileName(e.detail));
    window.addEventListener("bef-profile-change", update);
    return () => window.removeEventListener("bef-profile-change", update);
  }, []);
  const logout = () => { localStorage.removeItem("token"); setActiveCharacter("retriever"); setAuthStatus("unauthenticated"); setUsername(""); setShowMenu(false); notifyLikes(); navigate("/"); };
  const bagPage = location.pathname === "/mypage";
  return <header className={`site-header ${bagPage ? "bag-header" : ""}`}><div className="header-inner"><Logo/>
    {bagPage ? <Link className="bag-close" to="/">닫기 <Icon name="close"/></Link> : <>
      <nav className="main-nav" aria-label="주 메뉴">
        <Link to="/" aria-current={location.pathname === "/" ? "page" : undefined}>둘러보기</Link>
        <Link to={authStatus === "authenticated" ? "/write" : "/login"} aria-current={location.pathname === "/write" || location.pathname.startsWith("/edit/") ? "page" : undefined}>글쓰기</Link>
        <Link to="/map" aria-current={location.pathname === "/map" ? "page" : undefined}>지도</Link>
      </nav>
      <div className="header-account">
        {authStatus === "authenticated" ? <><div className="account-dropdown" ref={menu}><button className="text-button" aria-expanded={showMenu} onClick={() => setShowMenu(!showMenu)}>{username} ▼</button>{showMenu && <div className="account-menu"><Link to="/mypage"><Icon name="bag" size={18}/>내 가방</Link><Link to="/profile/edit"><Icon name="user" size={18}/>개인정보 수정</Link></div>}</div><span className="header-divider"/><button className="text-button logout" onClick={logout}>로그아웃</button></> : authStatus === "unauthenticated" ? <><Link to="/login">로그인</Link><Link className="join-link" to="/register">함께 시작하기</Link></> : <span className="muted">가방 챙기는 중…</span>}
      </div>
    </>}
  </div></header>;
}
