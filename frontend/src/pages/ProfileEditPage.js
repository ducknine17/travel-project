import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ProfileEditPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const verificationToken = new URLSearchParams(window.location.search).get("token");

  const sendVerificationEmail = async () => {
    try {
      await api.post("/password-change/send-email");
      setEmailSent(true);
      alert("등록된 이메일로 인증 링크를 발송했습니다.");
    } catch (err) {
      alert("인증 메일 발송에 실패했습니다.");
    }
  };

  const saveProfile = async () => {
    if (!verificationToken) {
      alert("이메일 인증을 먼저 완료해주세요.");
      return;
    }

    if (password.length < 8) {
      alert("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (password !== passwordCheck) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await api.put("/password-change", {
        password,
        verification_token: verificationToken,
      });

      alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");

      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      navigate("/login");
    } catch (err) {
      alert("수정에 실패했습니다.");
    }
  };

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "50px auto",
        padding: "30px",
      }}
    >
      <h2>개인정보 수정</h2>

      {!verificationToken && (
        <div style={{ marginTop: "20px" }}>
          <button
            onClick={sendVerificationEmail}
            disabled={emailSent}
            style={{ width: "100%", padding: "12px", cursor: "pointer" }}
          >
            {emailSent ? "인증 메일을 발송했습니다" : "이메일 인증하기"}
          </button>
        </div>
      )}

      {verificationToken && (
        <p style={{ color: "green", marginTop: "20px" }}>
          이메일 인증 링크가 확인되었습니다. 새 비밀번호를 입력해주세요.
        </p>
      )}

      <div style={{ marginTop: "25px" }}>
        <label>아이디</label>
        <input
          type="text"
          value={localStorage.getItem("username")}
          readOnly
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "5px",
            backgroundColor: "#f5f5f5",
            color: "#666",
            cursor: "not-allowed",
          }}
        />
      </div>
      <div style={{ marginTop: "20px" }}>
        <label>새 비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="새 비밀번호"
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "5px",
          }}
        />
      </div>
      <div style={{ marginTop: "20px" }}>
        <label>비밀번호 확인</label>
        <input
          type="password"
          value={passwordCheck}
          onChange={(e) => setPasswordCheck(e.target.value)}
          placeholder="비밀번호 확인"
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "5px",
          }}
        />
      </div>

      <button
        onClick={saveProfile}
        disabled={!verificationToken}
        style={{
          marginTop: "30px",
          width: "100%",
          padding: "12px",
          cursor: "pointer",
        }}
      >
        저장하기
      </button>
    </div>
  );
}

export default ProfileEditPage;
