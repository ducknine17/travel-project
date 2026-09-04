import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { getImageSrc, getTagLabel, getTagRating } from "../utils/postUtils";

function PostDetailPage() {

  const { id } = useParams();

  const [post, setPost] = useState(null);

  const [loginUser, setLoginUser] = useState("");
  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await api.get("/me");
        console.log(res.data);
        setLoginUser(res.data.username);
      } catch (err) {
        console.error(err);
      }
    };

    loadMe();
  }, []);

  const navigate = useNavigate();

  const loadPost = useCallback(async () => {
    try {
      const res = await api.get("/load-post");

      const foundPost = (res.data || []).find((p) => p.id === id);

      setPost(foundPost);

    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const editPost = () => {
      navigate(`/edit/${post.id}`);
  };

  const deletePost = async () => {
      if (!window.confirm("정말 삭제하시겠습니까?")) {
          return;
      }

      try {
          await api.delete("/delete-post", {
              data: {
                  id: post.id,
              },
          });

          alert("게시글이 삭제되었습니다.");
          navigate("/");
      } catch (error) {
          console.error(error);
          alert("삭제에 실패했습니다.");
      }
  };

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
      {post.photo?.map((img, index) => (
        <img
          key={index}
          src={getImageSrc(img)}
          alt={`사진 ${index + 1}`}
          style={{
            width: "100%",
            marginBottom: "10px",
            borderRadius: "10px",
          }}
        />
      ))}
      <p>{post.content}</p>
      {post.tag?.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {post.tag.map((tag) => {
            const rating = getTagRating(tag);

            return (
              <span
                key={tag}
                style={{
                  padding: "7px 10px",
                  borderRadius: "999px",
                  background: "#eef7f1",
                  color: "#294d39",
                }}
              >
                {getTagLabel(tag)}
                {rating > 0 && ` ${"★".repeat(rating)}${"☆".repeat(5 - rating)}`}
              </span>
            );
          })}
        </div>
      )}
      <hr />
      <p>작성자 : {post.author}</p>
      <p>좋아요 : {post.likes}</p>
      <p>조회수 : {post.views}</p>
      {loginUser === post.author && (
        <div style={{ marginTop: "20px" }}>
          <button
              onClick={editPost}
              style={{
                  marginRight: "10px",
                  padding: "8px 16px",
                  cursor: "pointer",
              }}
          >
              수정
          </button>
          <button
            onClick={deletePost}
            style={{
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}
export default PostDetailPage;
