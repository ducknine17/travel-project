import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

function PostDetailPage() {

  const { id } = useParams();

  const [post, setPost] = useState(null);

  // 👇 여기에 넣기
  useEffect(() => {
    loadPost();
  }, []);

  const loadPost = async () => {
    try {
      const res = await api.get("/load-post");

      const foundPost = res.data.find((p) => p.id === id);

      setPost(foundPost);

    } catch (err) {
      console.error(err);
    }
  };

  // 👇 이것도 여기
  if (!post) {
    return <div style={{ padding: "30px" }}>불러오는 중...</div>;
  }

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1>{post.title}</h1>
      <h3>📍 {post.place}</h3>
      <p>{post.content}</p>
      <hr />
      <p>작성자 : {post.author}</p>
      <p>좋아요 : {post.likes}</p>
      <p>조회수 : {post.views}</p>
    </div>
  );
}
export default PostDetailPage;