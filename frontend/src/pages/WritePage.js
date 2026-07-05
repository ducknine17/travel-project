import SortablePhoto from "../components/SortablePhoto";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";

import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

function WritePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [place, setPlace] = useState("");
  const navigate = useNavigate();
  const [tags, setTags] = useState([]);
  const tagList = [
    "♿ 휠체어",
    "🛗 엘리베이터",
    "↗️ 경사로",
    "🚻 장애인 화장실",
    "🅿️ 장애인 주차장",
    "🚼 유아차",
    "🐶 반려동물",
    "☕ 카페",
    "🍴 음식점",
    "🏞 관광지",
  ];
  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };
  const [photos, setPhotos] = useState([]);
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 10) {
      alert("사진은 최대 10장까지 가능합니다.");
      return;
    }
    const newPhotos = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  };
  const removePhoto = (id) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
  };
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    setPhotos(arrayMove(photos, oldIndex, newIndex));
  };
  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }
    if (photos.length === 0) {
      alert("사진을 1장 이상 등록해주세요.");
      return;
    }
    const postData = {
      title,
      author: "testUser", // 로그인 붙이면 여기만 변경
      content,
      photo: photos.map((photo) => photo.file.name), // 임시
      place,
      tag: tags,
    };
    console.log(postData);
    try {
      const response = await fetch("http://localhost:8000/write-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });
      if (!response.ok) {
        throw new Error("등록 실패");
      }
      alert("게시글이 등록되었습니다.");
      navigate("/");
    } catch (error) {
    console.error(error);
    alert("게시글 등록 중 오류가 발생했습니다.");
  }
};

  return (
    <div style={{ maxWidth: "900px", margin: "40px auto" }}>
      <h1>글쓰기</h1>

      <hr />

      <h3>제목</h3>

      <input
        type="text"
        placeholder="제목을 입력하세요."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", padding: "10px" }}
      />

      <h3 style={{ marginTop: "30px" }}>장소</h3>

      <button>
        장소 선택
      </button>

      <p style={{ color: "gray" }}>
        {place || "아직 선택된 장소가 없습니다."}
      </p>

      <h3 style={{ marginTop: "30px" }}>사진</h3>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handlePhotoChange}
      />

      <p>최대 10장까지 업로드 가능합니다.</p>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={photos.map((p) => p.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "15px",
              marginTop: "20px",
            }}
          >
            {photos.map((photo, index) => (
              <SortablePhoto
                key={photo.id}
                photo={photo}
                index={index}
                removePhoto={removePhoto}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <h3 style={{ marginTop: "30px" }}>태그</h3>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginTop: "10px",
        }}
      >
        {tagList.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            style={{
              padding: "10px 16px",
              borderRadius: "999px",
              border: tags.includes(tag)
                ? "2px solid #5B8DEF"
                : "1px solid #ccc",
              backgroundColor: tags.includes(tag)
                ? "#5B8DEF"
                : "white",
              color: tags.includes(tag)
                ? "white"
                : "#333",
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      <p style={{ marginTop: "12px", color: "#666" }}>
        선택된 태그 : {tags.length === 0 ? "없음" : tags.join(", ")}
      </p>

      <h3 style={{ marginTop: "30px" }}>내용</h3>

      <textarea
        rows={10}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          resize: "vertical"
        }}
      />

      <div
        style={{
          marginTop: "40px",
          textAlign: "right"
        }}
      >
        <button onClick={handleSubmit}>
          등록
        </button>
      </div>
    </div>
  );
}

export default WritePage;