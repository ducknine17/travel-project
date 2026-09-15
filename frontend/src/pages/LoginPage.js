import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../services/api";
import { Icon, Mascot } from "../components/Brand";

export default function LoginPage() {
  const [id,setId] = useState(""), [password,setPassword] = useState("");
  const [busy,setBusy] = useState(false), [error,setError] = useState("");
  const navigate = useNavigate();
  const login = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try { const res = await api.post("/login",{id,password}); localStorage.setItem("token",res.data.access_token); navigate("/"); }
    catch (err) { setError(err.response ? "아이디 또는 비밀번호가 올바르지 않습니다." : "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."); }
    finally { setBusy(false); }
  };
  return <main className="auth-page" id="main-content"><section className="auth-story"><p className="eyebrow">WELCOME BACK, TRAVELER</p><Mascot/><h1>다시 만나서 반가워요.</h1><p>어디로 떠나든, 베프가 함께할게요.<br/>우리의 다음 여행을 펼쳐볼까요?</p></section><section className="auth-form"><h2>로그인</h2><p>나의 작은 여행가방을 열어보세요.</p><form onSubmit={login}><div className="form-field"><label htmlFor="login-id">아이디</label><input id="login-id" placeholder="아이디를 입력하세요" autoComplete="username" value={id} onChange={e => setId(e.target.value)} required/></div><div className="form-field"><label htmlFor="login-password">비밀번호</label><input id="login-password" type="password" placeholder="비밀번호를 입력하세요" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required/></div>{error && <p className="field-error" role="alert">{error}</p>}<button className="button primary" type="submit" disabled={busy}>{busy ? "가방을 여는 중…" : "로그인"}<Icon name="arrow" size={16}/></button></form><p className="auth-switch">아직 여행 친구가 아니라면? <Link to="/register">회원가입</Link></p></section></main>;
}