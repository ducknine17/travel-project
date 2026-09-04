import { useNavigate } from "react-router-dom";
import "../styles/PostCard.css";
import api from "../services/api";
import { useEffect, useState } from "react";
import { getImageSrc } from "../utils/postUtils";

function PostCard({ post, liked: initialLiked = false }) {

    const navigate = useNavigate();
    const [liked, setLiked] = useState(initialLiked);

    useEffect(() => {
        setLiked(initialLiked);
    }, [initialLiked]);

    const handleLike = async (e) => {

        e.stopPropagation();

        const token = localStorage.getItem("token");

        if (!token) {

            const ok = window.confirm(
                "좋아요는 로그인 후 이용할 수 있습니다.\n로그인하시겠습니까?"
            );

            if (ok) {
                navigate("/login");
            }

            return;
        }

        try {

            if (post.id?.startsWith("mock-")) {
                setLiked(!liked);
                return;
            }

            if (!liked) {

                await api.post("/posts/" + post.id + "/like");

                setLiked(true);

            } else {

                await api.delete("/posts/" + post.id + "/like");

                setLiked(false);
            }

        } catch (error) {

            console.error("좋아요 처리 실패:", error);
            alert("좋아요 처리 중 오류가 발생했습니다.");

        }
    };

    return (
        <div
            className="post-card"
            onClick={() => navigate("/post/" + post.id)}
        >

            <div className="post-image">

                {post.photo && post.photo.length > 0 && (
                    <img
                        src={getImageSrc(post.photo[0])}
                        alt="대표사진"
                    />
                )}

                <div className="post-icons">

                    <button
                        className="icon-button"
                        onClick={handleLike}
                    >
                        {liked ? "❤️" : "🤍"}
                    </button>

                </div>

            </div>

            <div className="post-title">
                {post.title}
            </div>

            <div className="post-place">
                📍 {post.place}
            </div>

        </div>
    );
}

export default PostCard;
