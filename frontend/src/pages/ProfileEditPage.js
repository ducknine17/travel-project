import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { Icon, PageHeading } from "../components/Brand";
import { getImageSrc } from "../utils/postUtils";
import { profileName } from "../utils/profile";

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const [password,setPassword] = useState(""), [passwordCheck,setPasswordCheck] = useState(""), [username,setUsername] = useState("");
  const [displayName,setDisplayName] = useState(""), [avatar,setAvatar] = useState(""), [photo,setPhoto] = useState(null), [preview,setPreview] = useState("");
  const [emailSent,setEmailSent] = useState(false), [busy,setBusy] = useState(false), [error,setError] = useState(""), [notice,setNotice] = useState(""), [verified,setVerified] = useState(false);
  const verificationToken = new URLSearchParams(window.location.search).get("token");
  useEffect(() => {
    let cancelled = false;
    if (verificationToken) {
      api.get("/password-change/verify", {params:{token:verificationToken}}).then(() => {if (!cancelled) setVerified(true);}).catch(() => {if (!cancelled) setError("인증 링크가 만료되었거나 올바르지 않아요.");});
    } else if (!localStorage.getItem("token")) {navigate("/login");return;}
    if (localStorage.getItem("token")) api.get("/me").then(r => {
      if (cancelled) return;
      setUsername(r.data.username);setDisplayName(profileName(r.data));setAvatar(r.data.avatar || "");
    }).catch(() => {if (!cancelled) setError("프로필을 불러오지 못했어요.");});
    return () => {cancelled = true;};
  },[navigate,verificationToken]);
  useEffect(() => {
    if (!photo) {setPreview("");return;}
    const url = URL.createObjectURL(photo);setPreview(url);
    return () => URL.revokeObjectURL(url);
  },[photo]);
  const saveIdentity = async e => {
    e.preventDefault(); if (busy || !displayName.trim()) return;
    setBusy(true);setError("");setNotice("");
    try {
      let filename = avatar;
      if (photo) {const form = new FormData();form.append("file",photo);filename = (await api.post("/upload-image/",form)).data.filename;}
      const result = await api.put("/me/profile", {display_name:displayName.trim(),avatar:filename});
      setAvatar(result.data.avatar);setDisplayName(result.data.display_name);setPhoto(null);setNotice("프로필을 저장했어요.");
      window.dispatchEvent(new CustomEvent("bef-profile-change", {detail:result.data}));
    } catch {setError("프로필을 저장하지 못했어요. 잠시 후 다시 시도해주세요.");}
    finally {setBusy(false);}
  };
  const choosePhoto = e => {
    const file = e.target.files?.[0];e.target.value = "";if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name) || file.size > 5*1024*1024) {setError("JPG, PNG, WebP 사진을 5MB 이하로 선택해주세요.");return;}
    setPhoto(file);setError("");setNotice("");
  };
  const sendVerificationEmail = async () => {
    setBusy(true);setError("");
    try {await api.post("/password-change/send-email");setEmailSent(true);}
    catch {setError("인증 메일 발송에 실패했습니다. 다시 시도해주세요.");}
    finally {setBusy(false);}
  };
  const savePassword = async e => {
    e.preventDefault();if (!verified || busy) return;
    if (password.length < 8) {setError("비밀번호는 8자 이상이어야 합니다.");return;}
    if (password !== passwordCheck) {setError("비밀번호가 일치하지 않습니다.");return;}
    setBusy(true);setError("");
    try {await api.put("/password-change",{password,verification_token:verificationToken});localStorage.removeItem("token");navigate("/login");}
    catch {setError("비밀번호를 변경하지 못했어요. 인증 링크를 확인해주세요.");}
    finally {setBusy(false);}
  };
  return <main className="page-shell settings-page" id="main-content"><PageHeading eyebrow="MY TRAVELER CARD" title="내 프로필" description="나를 소개하는 사진과 이름을 담아주세요."/><div className="settings-layout">
    <aside className="settings-friend"><div className="profile-avatar">{preview || avatar ? <img src={preview || getImageSrc(avatar)} alt="내 프로필 사진"/> : <Icon name="user" size={65}/>}</div><h2>{displayName || "여행 친구"}</h2><Link className="button" to="/mypage"><Icon name="bag" size={17}/>내 가방</Link></aside>
    <section className="settings-form">{username && <form onSubmit={saveIdentity}><h2>나의 여행자 카드</h2><div className="form-field"><label htmlFor="profile-name">표시 이름</label><input id="profile-name" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={24} required disabled={busy}/><small className="settings-note">최대 24자 · 로그인 아이디는 바뀌지 않아요.</small></div><div className="form-field"><label htmlFor="profile-photo">프로필 사진</label><input id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} disabled={busy}/><small className="settings-note">JPG, PNG, WebP · 최대 5MB</small>{(avatar || photo) && <button type="button" onClick={() => {setAvatar("");setPhoto(null);}} disabled={busy}>사진 제거</button>}</div><button className="button primary" disabled={busy || !displayName.trim()}>프로필 저장</button></form>}
    {notice && <p className="notice" role="status">{notice}</p>}<hr/><h2>비밀번호 변경</h2>
    {!verificationToken ? <><p className="settings-note">등록된 이메일에서 인증한 뒤 새 비밀번호를 설정할 수 있어요.</p><button className="button" onClick={sendVerificationEmail} disabled={busy || emailSent || !username}>{busy ? "발송 중…" : emailSent ? "인증 메일을 발송했습니다" : "이메일 인증하기"}</button></> : <p className="notice">{verified ? "이메일 인증이 완료됐어요. 새 비밀번호를 입력해주세요." : "이메일 인증 링크를 확인하고 있어요."}</p>}
    <form onSubmit={savePassword}><div className="form-field"><label htmlFor="profile-password">새 비밀번호</label><input id="profile-password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} disabled={!verified} required minLength={8}/></div><div className="form-field"><label htmlFor="profile-confirm">새 비밀번호 확인</label><input id="profile-confirm" type="password" autoComplete="new-password" value={passwordCheck} onChange={e => setPasswordCheck(e.target.value)} disabled={!verified} required/></div><button className="button primary" disabled={!verified || busy}>비밀번호 변경하기</button></form>{error && <p className="field-error" role="alert">{error}</p>}</section>
  </div></main>;
}
