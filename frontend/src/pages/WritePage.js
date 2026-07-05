import SortablePhoto from "../components/SortablePhoto";
import { useState } from "react";

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
  const [tags, setTags] = useState([]);
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

      <div>
        태그는 다음 단계에서 구현합니다.
      </div>

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
        <button>
          등록
        </button>
      </div>
    </div>
  );
}

export default WritePage;