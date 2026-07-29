import { useNavigate } from "react-router-dom";
import "../styles/PostCard.css";
import api from "../services/api";

function PostCard({ post }) {

    const navigate = useNavigate();

    const handleLike = (e) => {
        e.stopPropagation();

        const token = localStorage.getItem("token");

        if (!token) {
            if (window.confirm("좋아요는 로그인 후 이용할 수 있습니다.\n로그인하시겠습니까?")) {
                navigate("/login");
            }
            return;
        }

        // TODO : 좋아요 API
    };

    const handleFavorite = (e) => {
        e.stopPropagation();

        const token = localStorage.getItem("token");

        if (!token) {
            if (window.confirm("즐겨찾기는 로그인 후 이용할 수 있습니다.\n로그인하시겠습니까?")) {
                navigate("/login");
            }
            return;
        }

        // TODO : 즐겨찾기 API
    };

    return (

        <div
            className="post-card"
            onClick={() => navigate(`/post/${post.id}`)}
        >

            <div className="post-image">

                {post.photo && post.photo.length > 0 && (
                    <img
                        src={`${api.defaults.baseURL}/image/${encodeURIComponent(post.photo[0])}`}
                        alt="대표사진"
                    />
                )}

                <div className="post-icons">

                    <button
                        className="icon-button"
                        onClick={handleLike}
                    >
                        🤍
                    </button>

                    <button
                        className="icon-button"
                        onClick={handleFavorite}
                    >
                        ⭐
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