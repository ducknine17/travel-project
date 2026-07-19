import { Link } from "react-router-dom";

function Header() {
  return (
    <header
      style={{
        display: "flex",
        gap: "30px",
        padding: "20px",
        borderBottom: "1px solid #ddd"
      }}
    >
      <Link to="/">둘러보기</Link>

      <Link to="/write">글쓰기</Link>

      <Link to="/map">지도</Link>

      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          gap: "20px",
        }}
      >
        <Link to="/login">로그인</Link>
        <Link to="/register">회원가입</Link>
      </div>
    </header>
  );
}

export default Header;