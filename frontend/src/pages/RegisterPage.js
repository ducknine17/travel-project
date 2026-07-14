import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../services/api";

function RegisterPage() {
  const [id, setId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const navigate = useNavigate();

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

      try {
          await api.post("/register", {
              id,
              email,
              password,
          });

          // 회원가입 성공 후 인증 메일 발송
          await api.post("/send-email", {
              id,
          });

          alert("회원가입이 완료되었습니다.\n인증 메일을 확인해주세요.");
          navigate("/login");
                } catch (error) {
                    console.error(error);

                    if (error.response?.status === 409) {
                        alert("이미 존재하는 아이디입니다.");
                    } else {
                        alert("회원가입에 실패했습니다.");
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