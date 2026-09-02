import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../services/api";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [authStatus, setAuthStatus] = useState(
    localStorage.getItem("token") ? "checking" : "unauthenticated"
  );
  const [username, setUsername] = useState("");

  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setAuthStatus("unauthenticated");
      setUsername("");
      return;
    }

    let isCancelled = false;
    setAuthStatus("checking");

    const loadMe = async () => {
      try {
        const res = await api.get("/me");
        if (isCancelled) return;

        setUsername(res.data.username);
        setAuthStatus("authenticated");
      } catch (err) {
        if (isCancelled) return;

        console.error(err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
        }
        setUsername("");
        setShowMenu(false);
        setAuthStatus("unauthenticated");
      }
    };

    loadMe();

    return () => {
      isCancelled = true;
    };
  }, [location.pathname]);

  const isLogin = authStatus === "authenticated";

  const logout = () => {
    localStorage.removeItem("token");
    setUsername("");
    setShowMenu(false);
    setAuthStatus("unauthenticated");

    navigate("/");
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
        {authStatus === "unauthenticated" ? (
          <>
            <Link to="/login">로그인</Link>
            <Link to="/register">회원가입</Link>
          </>
        ) : authStatus === "authenticated" ? (
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
        ) : null}
      </div>
    </header>
  );
}

export default Header;
