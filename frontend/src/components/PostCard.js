import { useNavigate } from "react-router-dom";
import "../styles/PostCard.css";
import api from "../services/api";

function PostCard({ post }) {

    const navigate = useNavigate();

    return (
    <div
    className="post-card"
    onClick={()=>navigate(`/post/${post.id}`)}
    >
    <div className="post-image">
        {post.photo && post.photo.length > 0 && (
            <img
                src={`${api.defaults.baseURL}/image/${encodeURIComponent(post.photo[0])}`}
                alt="대표사진"
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "10px",
                }}
            />
        )}
    </div>

    <div className="post-title">
        {post.title}
    </div>

    <div className="post-place">

    📍 {post.place}

    </div>
    <pre>{JSON.stringify(post.photo, null, 2)}</pre>

    </div>

    );

}

export default PostCard;
