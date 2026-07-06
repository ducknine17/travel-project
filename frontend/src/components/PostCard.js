import { useNavigate } from "react-router-dom";

function PostCard({ post }) {

    const navigate = useNavigate();

    return (

        <div
            onClick={()=>navigate(`/post/${post.id}`)}
            style={{
                width:"280px",
                cursor:"pointer"
            }}
        >

            <img
                src={post.photo[0]}
                alt={post.place}
                style={{
                    width:"100%",
                    height:"220px",
                    objectFit:"cover",
                    borderRadius:"12px"
                }}
            />

            <p>📍 {post.place}</p>

        </div>

    );

}

export default PostCard;