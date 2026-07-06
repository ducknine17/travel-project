import { useNavigate } from "react-router-dom";
import "../styles/PostCard.css";

function PostCard({ post }) {

    const navigate = useNavigate();

    return (
    <div
    className="post-card"
    onClick={()=>navigate(`/post/${post.id}`)}
    >
    <div className="post-image">

    대표사진

    </div>

    <div className="post-place">

    📍 {post.place}

    </div>

    </div>

    );

}

export default PostCard;