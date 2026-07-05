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

      <a href="/">지도</a>

      <a href="/">로그인</a>
    </header>
  );
}

export default Header;