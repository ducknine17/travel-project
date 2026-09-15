import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { Icon, Mascot, PageHeading } from "../components/Brand";

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const [password,setPassword] = useState(""), [passwordCheck,setPasswordCheck] = useState(""), [username,setUsername] = useState("");
  const [emailSent,setEmailSent] = useState(false), [busy,setBusy] = useState(false), [error,setError] = useState("");
  const verificationToken = new URLSearchParams(window.location.search).get("token");
  useEffect(() => {
    if (!localStorage.getItem("token") && !verificationToken) { navigate("/login"); return; }
    api.get("/me").then(r => setUsername(r.data.username)).catch(() => setError("프로필을 불러오지 못했어요."));
  },[navigate,verificationToken]);
  const sendVerificationEmail = async () => {
    setBusy(true); setError("");
    try { await api.post("/password-change/send-email"); setEmailSent(true); }
    catch { setError("인증 메일 발송에 실패했습니다. 다시 시도해주세요."); }
    finally { setBusy(false); }
  };
  const saveProfile = async e => {
    e.preventDefault();
    if (!verificationToken || busy) return;
    if (password.length < 8) {setError("비밀번호는 8자 이상이어야 합니다."); return;}
    if (password !== passwordCheck) {setError("비밀번호가 일치하지 않습니다."); return;}
    setBusy(true); setError("");
    try { await api.put("/password-change",{password,verification_token:verificationToken}); localStorage.removeItem("token"); navigate("/login"); }
    catch { setError("비밀번호를 변경하지 못했어요. 인증 링크를 확인해주세요."); }
    finally { setBusy(false); }
  };
  return <main className="page-shell settings-page" id="main-content"><PageHeading eyebrow="MY TRAVELER CARD" title="내 프로필" description="함께 떠날 여행 친구의 정보를 살펴보세요."/><div className="settings-layout"><aside className="settings-friend"><Mascot/><h2>{username || "여행 친구"}</h2><Link className="text-link" to="/bag/decorate?tab=friend">여행 친구 바꾸기 <Icon name="arrow" size={15}/></Link><p className="settings-note">친구를 바꿔도 모은 배지는 그대로예요.</p><Link className="button" to="/mypage"><Icon name="bag" size={17}/>내 가방</Link></aside><section className="settings-form"><h2>계정 정보</h2><div className="form-field"><label htmlFor="profile-id">아이디</label><input id="profile-id" value={username} readOnly/></div><hr style={{border:0,borderTop:"1px solid var(--line)",margin:"28px 0"}}/><h2>비밀번호 변경</h2>{!verificationToken ? <><p className="settings-note">등록된 이메일에서 인증한 뒤 새 비밀번호를 설정할 수 있어요.</p><button className="button" onClick={sendVerificationEmail} disabled={busy || emailSent}>{busy ? "발송 중…" : emailSent ? "인증 메일을 발송했습니다" : "이메일 인증하기"}</button>{emailSent && <p role="status" className="notice">메일 속 링크를 눌러 비밀번호 변경을 이어가세요.</p>}</> : <p className="notice">인증 링크를 확인했어요. 새 비밀번호를 입력해주세요.</p>}<form onSubmit={saveProfile}><div className="form-field"><label htmlFor="profile-password">새 비밀번호</label><input id="profile-password" type="password" placeholder="8자 이상 입력해주세요" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} disabled={!verificationToken} required minLength={8}/></div><div className="form-field"><label htmlFor="profile-confirm">새 비밀번호 확인</label><input id="profile-confirm" type="password" placeholder="새 비밀번호를 다시 입력해주세요" autoComplete="new-password" value={passwordCheck} onChange={e => setPasswordCheck(e.target.value)} disabled={!verificationToken} required/></div>{error && <p className="field-error" role="alert">{error}</p>}<button className="button primary" disabled={!verificationToken || busy}>{busy ? "저장 중…" : "비밀번호 변경하기"}</button><p className="settings-note">변경이 완료되면 새 비밀번호로 다시 로그인해주세요.</p></form></section></div></main>;
}
