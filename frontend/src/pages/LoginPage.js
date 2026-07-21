import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function LoginPage() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const login = async () => {
    try {
      const res = await api.post("/login", {
        id,
        password,
      });

      console.log(res.data);

      // JWT 저장

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("userId", res.data.user.uid);   // 내부 식별자
      localStorage.setItem("username", res.data.user.id);  // 로그인 아이디

      alert("로그인 성공!");
      navigate("/");
    } catch (error) {
      console.error(error);

      if (error.response) {
        alert("아이디 또는 비밀번호가 올바르지 않습니다.");
      } else {
        alert("서버에 연결할 수 없습니다.");
      }
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "60px auto",
        padding: "30px",
        border: "1px solid #ddd",
        borderRadius: "10px",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
        로그인
      </h2>

      <div style={{ marginBottom: "15px" }}>
        <label>아이디</label>
        <input
          type="text"
          placeholder="아이디를 입력하세요"
          value={id}
          onChange={(e) => setId(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "5px",
          }}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label>비밀번호</label>
        <input
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "5px",
          }}
        />
      </div>

      <button onClick={login}
        style={{
          width: "100%",
          padding: "12px",
          cursor: "pointer",
        }}
      >
        로그인
      </button>

      <p
        style={{
          textAlign: "center",
          marginTop: "20px",
        }}
      >
        계정이 없으신가요?{" "}
        <Link to="/register">회원가입</Link>
      </p>
    </div>
  );
}

export default LoginPage;