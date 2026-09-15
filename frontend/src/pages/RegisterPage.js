import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../services/api";
import { Icon, Mascot } from "../components/Brand";

export default function RegisterPage() {
  const [id,setId] = useState(""), [email,setEmail] = useState(""), [password,setPassword] = useState(""), [passwordCheck,setPasswordCheck] = useState("");
  const [busy,setBusy] = useState(false), [error,setError] = useState(""), [registered,setRegistered] = useState(false), [sent,setSent] = useState(false);
  const navigate = useNavigate();
  const sendEmail = async () => {
    setBusy(true); setError("");
    try { await api.post("/send-email",{id}); setSent(true); }
    catch { setError("가입은 완료됐지만 인증 메일을 보내지 못했어요. 아래 버튼으로 다시 받아주세요."); }
    finally { setBusy(false); }
  };
  const register = async e => {
    e.preventDefault();
    if (password !== passwordCheck) { setError("비밀번호가 일치하지 않습니다."); return; }
    if (busy) return;
    setBusy(true); setError("");
    try { await api.post("/register",{id,email,password}); setRegistered(true); await sendEmail(); }
    catch (err) { setError(err.response?.status === 409 ? "이미 존재하는 아이디입니다." : "회원가입에 실패했습니다. 잠시 후 다시 시도해주세요."); }
    finally { setBusy(false); }
  };
  return <main className="auth-page" id="main-content"><section className="auth-story"><p className="eyebrow">OUR JOURNEY STARTS HERE</p><Mascot pose="badge"/><h1>우리, 여행 친구 할까요?</h1><p>누구나 편안하게 떠나는 여행.<br/>당신의 첫걸음을 기다리고 있어요.</p></section><section className="auth-form"><h2>{registered ? "첫 만남을 준비했어요" : "회원가입"}</h2><p>{registered ? `${email}로 보낸 인증 메일을 확인해주세요.` : "작은 여행가방 하나, 당신을 위해 준비했어요."}</p>{registered ? <><div className="notice">{sent ? "메일 속 인증 링크를 누르면 여행을 시작할 수 있어요." : "인증 메일을 보내고 있어요."}</div>{error && <p className="field-error" role="alert">{error}</p>}<button className="button" onClick={sendEmail} disabled={busy}>{busy ? "발송 중…" : "인증 메일 다시 받기"}</button><button className="button primary" onClick={() => navigate("/login")}>로그인하러 가기 <Icon name="arrow" size={16}/></button></> : <form onSubmit={register}><div className="form-field"><label htmlFor="register-id">아이디</label><input id="register-id" placeholder="아이디를 입력하세요" autoComplete="username" value={id} onChange={e => setId(e.target.value)} required/></div><div className="form-field"><label htmlFor="register-email">이메일</label><input id="register-email" type="email" placeholder="인증 메일을 받을 주소" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required/></div><div className="form-field"><label htmlFor="register-password">비밀번호</label><input id="register-password" type="password" placeholder="비밀번호를 입력하세요" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required/></div><div className="form-field"><label htmlFor="register-confirm">비밀번호 확인</label><input id="register-confirm" type="password" placeholder="비밀번호를 다시 입력하세요" autoComplete="new-password" value={passwordCheck} onChange={e => setPasswordCheck(e.target.value)} required/></div>{error && <p className="field-error" role="alert">{error}</p>}<button className="button primary" type="submit" disabled={busy}>{busy ? "가방을 준비하는 중…" : "베프와 함께 시작하기"}<Icon name="arrow" size={16}/></button></form>}<p className="auth-switch">이미 여행 친구라면? <Link to="/login">로그인</Link></p></section></main>;
}