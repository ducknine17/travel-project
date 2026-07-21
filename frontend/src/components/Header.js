import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Header() {
  const navigate = useNavigate();

  const isLogin = !!localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const [showMenu, setShowMenu] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");

    navigate("/");
    window.location.reload();
  };

  return (
    <header
      style={{
        display: "flex",
        gap: "30px",
        padding: "20px",
        borderBottom: "1px solid #ddd",
      }}
    >
      <Link to="/">둘러보기</Link>

      <span
        style={{ cursor: "pointer", color: "#551A8B" }}
        onClick={() => {
          if (!isLogin) {
            alert("로그인이 필요한 서비스입니다.");
            navigate("/login");
            return;
          }
          navigate("/write");
        }}
      >
        글쓰기
      </span>

      <Link to="/map">지도</Link>

      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          gap: "20px",
          alignItems: "center",
        }}
      >
        {!isLogin ? (
          <>
            <Link to="/login">로그인</Link>
            <Link to="/register">회원가입</Link>
          </>
        ) : (
          <>
            <div style={{ position: "relative" }}>
              <span
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  cursor: "pointer",
                  fontWeight: "bold",
                  userSelect: "none",
                }}
              >
                {username} ▼
              </span>

              {showMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    marginTop: "8px",
                    right: 0,
                    background: "white",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                    minWidth: "150px",
                    zIndex: 100,
                  }}
                >
                  <div
                    onClick={() => navigate("/profile/edit")}
                    style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        transition: "0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.background = "#f5f5f5")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.background = "white")
                    }
                  >
                    개인정보 수정
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              로그아웃
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;