import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ProfileEditPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");

  const saveProfile = async () => {
    if (password !== passwordCheck) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await api.put("/edit-user", {
        password,
      });

      alert("개인정보가 수정되었습니다.");

      navigate("/mypage");
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