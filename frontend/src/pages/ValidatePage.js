import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { Icon, Mascot } from "../components/Brand";

export default function ValidatePage() {
  const { id } = useParams();
  const [status,setStatus] = useState("loading");
  useEffect(() => { let cancelled = false; api.get(`/validate/${id}`).then(() => {if (!cancelled) setStatus("success");}).catch(() => {if (!cancelled) setStatus("error");}); return () => {cancelled = true;}; },[id]);
  return <main className="page-shell" id="main-content"><div className="empty-state" style={{padding:"65px 20px"}}><Mascot pose={status === "success" ? "badge" : "read"}/><p className="eyebrow">READY FOR OUR JOURNEY</p><h1 style={{fontSize:36}}>이메일 인증</h1><p role="status">{status === "loading" ? "여행 친구를 확인하고 있어요…" : status === "success" ? "이메일 인증이 완료되었습니다. 이제 함께 떠나요!" : "유효하지 않거나 이미 사용된 인증 링크입니다."}</p><Link className="button primary" to="/login">로그인하러 가기 <Icon name="arrow" size={16}/></Link></div></main>;
}