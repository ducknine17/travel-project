import { Link } from "react-router-dom";
import { useState } from "react";

function RegisterPage() {
  const [id, setId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");

  const register = async () => {

      if (!id) {
          alert("아이디를 입력해주세요.");
          return;
      }

      if (!email) {
          alert("이메일을 입력해주세요.");
          return;
      }

      if (!password) {
          alert("비밀번호를 입력해주세요.");
          return;
      }

      if (password !== passwordCheck) {
          alert("비밀번호가 일치하지 않습니다.");
          return;
      }

      alert("검사 완료! (API 연결 예정)");
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
      <h2
        style={{
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        회원가입
      </h2>

      <div style={{ marginBottom: "15px" }}>
        <label>아이디</label>
        <input
          type="text"
          placeholder="아이디를 입력하세요"
          value={id}
          onChange={(e) => setId(e.target.value)}
          style={{ width: "100%", padding: "10px", marginTop: "5px" }}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>이메일</label>
        <input
          type="email"
          placeholder="이메일을 입력하세요"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px", marginTop: "5px" }}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>비밀번호</label>
        <input
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px", marginTop: "5px" }}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label>비밀번호 확인</label>
        <input
          type="password"
          placeholder="비밀번호를 다시 입력하세요"
          value={passwordCheck}
          onChange={(e) => setPasswordCheck(e.target.value)}
          style={{ width: "100%", padding: "10px", marginTop: "5px" }}
        />
      </div>

      <button
        onClick={register}
        style={{
          width: "100%",
          padding: "12px",
          cursor: "pointer",
        }}
      >
        회원가입
      </button>

      <p
        style={{
          textAlign: "center",
          marginTop: "20px",
        }}
      >
        이미 계정이 있으신가요?{" "}
        <Link to="/login">로그인</Link>
      </p>
    </div>
  );
}

export default RegisterPage;