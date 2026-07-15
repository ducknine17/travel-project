import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

function ValidatePage() {
    const { id } = useParams();

    const [message, setMessage] = useState("이메일 인증 중입니다...");

    useEffect(() => {
        const validate = async () => {
            try {
                await api.get(`/validate/${id}`);
                setMessage("✅ 이메일 인증이 완료되었습니다.");
            } catch (error) {
                console.error(error);
                setMessage("❌ 유효하지 않거나 이미 사용된 인증 링크입니다.");
            }
        };

        validate();
    }, [id]);

    return (
        <div
            style={{
                maxWidth: "500px",
                margin: "100px auto",
                textAlign: "center",
            }}
        >
            <h1>이메일 인증</h1>
            <p>{message}</p>
            <Link to="/login">
              <button
                  style={{
                      marginTop: "20px",
                      padding: "10px 20px",
                      cursor: "pointer",
                  }}
              >
                  로그인 하러가기
              </button>
          </Link>
        </div>
    );
}

export default ValidatePage;