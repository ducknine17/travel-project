import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { getImageSrc, getTagLabel, getTagRating } from "../utils/postUtils";

function PostDetailPage() {

  const { id } = useParams();

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [loginUser, setLoginUser] = useState("");
  useEffect(() => {
    if (!localStorage.getItem("token")) return;

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
    setIsLoading(true);
    setError("");

    try {
      const res = await api.get(`/posts/${encodeURIComponent(id)}`);
      setPost(res.data);
    } catch (err) {
      console.error(err);
      setPost(null);
      setError(
        err.response?.status === 404
          ? "존재하지 않거나 삭제된 게시글입니다."
          : "게시글을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return <div style={{ padding: "30px" }}>불러오는 중...</div>;
  }

  if (error || !post) {
    return (
      <div style={{ padding: "30px" }} role="alert">
        <p>{error || "게시글을 찾을 수 없습니다."}</p>
        <button type="button" onClick={() => navigate("/")}>둘러보기로 돌아가기</button>
      </div>
    );
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
