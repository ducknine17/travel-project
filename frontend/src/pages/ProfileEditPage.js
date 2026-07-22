import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ProfileEditPage() {
  const navigate = useNavigate();

  const [id, setId] = useState(localStorage.getItem("username") || "");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const currentId = localStorage.getItem("username");

    // 현재 아이디 그대로면 검사 안 함
    if (id === currentId) {
      setAvailable(true);
      return;
    }

    if (!id.trim()) {
      setAvailable(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/check-id/${id}`);
        setAvailable(res.data.available);
      } catch {
        setAvailable(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [id]);

  const saveProfile = async () => {
    if (!available) {
      alert("이미 사용 중인 아이디입니다.");
      return;
    }
    if (password !== passwordCheck) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await api.put("/edit-user", {
        id,
        password,
      });

      localStorage.setItem("username", id);

      alert("개인정보가 수정되었습니다.");

      navigate("/mypage");
    } catch (err) {
      if (err.response?.status === 409) {
        alert("이미 사용 중인 아이디입니다.");
      } else {
        alert("수정에 실패했습니다.");
      }
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
          value={id}
          onChange={(e) => setId(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "5px",
          }}
        />
      </div>
      {id !== localStorage.getItem("username") && (
        <p
          style={{
            color: available ? "green" : "red",
            marginTop: "5px",
            fontSize: "14px",
          }}
        >
          {available
            ? "✔ 사용할 수 있는 아이디입니다."
            : "✖ 이미 사용 중인 아이디입니다."}
        </p>
      )}
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
        disabled={!available}
        style={{
            marginTop: "30px",
            width: "100%",
            padding: "12px",
            cursor: available ? "pointer" : "not-allowed",
            opacity: available ? 1 : 0.6,
        }}
      >
        저장하기
      </button>
    </div>
  );
}

export default ProfileEditPage;