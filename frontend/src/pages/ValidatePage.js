import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

function ValidatePage() {
    const { id } = useParams();

    const [message, setMessage] = useState("이메일 인증 중입니다...");

    useEffect(() => {
        validate();
    }, []);

    const validate = async () => {
        try {
            await api.get(`/validate/${id}`);
            setMessage("✅ 이메일 인증이 완료되었습니다.");
        } catch (error) {
            console.error(error);
            setMessage("❌ 인증에 실패했습니다.");
        }
    };

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
        </div>
    );
}

export default ValidatePage;