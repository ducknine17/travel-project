import SortablePhoto from "../components/SortablePhoto";
import PlaceSelector from "../components/PlaceSelector";
import { useCallback, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import {
  encodeTagRating,
  getImageSrc,
  getTagLabel,
  getTagRating,
} from "../utils/postUtils";

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
  const { id } = useParams();
  const [tagRatings, setTagRatings] = useState({});
  const [existingPhotos, setExistingPhotos] = useState([]);
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
  const selectedTags = Object.keys(tagRatings);

  const toggleTag = (tag) => {
    if (tagRatings[tag]) {
      const nextRatings = { ...tagRatings };
      delete nextRatings[tag];
      setTagRatings(nextRatings);
    } else {
      setTagRatings({
        ...tagRatings,
        [tag]: 3,
      });
    }
  };
  const setTagRating = (tag, rating) => {
    setTagRatings({
      ...tagRatings,
      [tag]: rating,
    });
  };
  const [photos, setPhotos] = useState([]);
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (existingPhotos.length + photos.length + files.length > 10) {
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
  const removeExistingPhoto = (photoName) => {
    setExistingPhotos((prev) => prev.filter((photo) => photo !== photoName));
  };
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    setPhotos(arrayMove(photos, oldIndex, newIndex));
  };
  const loadPost = useCallback(async () => {
    try {
      const res = await api.get("/load-post");
      const foundPost = res.data.find((p) => p.id === id);
      if (!foundPost) return;
      setTitle(foundPost.title);
      setContent(foundPost.content);
      setPlace(foundPost.place);
      setExistingPhotos(foundPost.photo || []);
      setTagRatings(
        (foundPost.tag || []).reduce((nextRatings, tag) => {
          const label = getTagLabel(tag);
          const rating = getTagRating(tag) || 3;
          return label
            ? {
                ...nextRatings,
                [label]: rating,
              }
            : nextRatings;
        }, {})
      );
    } catch (error) {
      console.error(error);
    }
  }, [id]);

  useEffect(() => {
      if (id) {
          loadPost();
      }
  }, [id, loadPost]);
  const handleSubmit = async () => {
      if (!title.trim()) {
          alert("제목을 입력해주세요.");
          return;
      }

      if (!content.trim()) {
          alert("내용을 입력해주세요.");
          return;
      }

      if (!place) {
          alert("장소를 선택해주세요.");
          return;
      }

      if (photos.length === 0 && existingPhotos.length === 0) {
          alert("사진을 1장 이상 등록해주세요.");
          return;
      }

      try {
          // 사진 먼저 업로드
          const uploadedPhotos = [];

          for (const photo of photos) {
              const formData = new FormData();
              formData.append("file", photo.file);

              const res = await api.post("/upload-image/", formData);

              uploadedPhotos.push(res.data.filename);
          }

          // 게시글 데이터
          const postData = {
              title,
              content,
              photo: [...existingPhotos, ...uploadedPhotos],
              place,
              tag: Object.entries(tagRatings).map(([tag, rating]) =>
                encodeTagRating(tag, rating)
              ),
          };

          console.log(postData);

          if (id) {
              await api.put("/edit-post", {
                  id,
                  ...postData,
              });

              alert("게시글이 수정되었습니다.");
          } else {
              await api.post("/write-post", postData);

              alert("게시글이 등록되었습니다.");
          }

          navigate("/");

      } catch (error) {
          console.error(error);
          alert("게시글 처리 중 오류가 발생했습니다.");
      }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "40px auto" }}>
      <h1>{id ? "글 수정" : "글쓰기"}</h1>

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

      <PlaceSelector value={place} onChange={setPlace} />

      <h3 style={{ marginTop: "30px" }}>사진</h3>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handlePhotoChange}
      />

      <p>최대 10장까지 업로드 가능합니다.</p>

      {existingPhotos.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          {existingPhotos.map((photo) => (
            <div
              key={photo}
              style={{
                width: "120px",
                position: "relative",
              }}
            >
              <img
                src={getImageSrc(photo)}
                alt="기존 사진"
                style={{
                  width: "120px",
                  height: "120px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <button
                type="button"
                onClick={() => removeExistingPhoto(photo)}
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                }}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}

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
        {tagList.map((tag) => {
          const isSelected = Boolean(tagRatings[tag]);

          return (
            <div
              key={tag}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                borderRadius: "12px",
                border: isSelected
                  ? "2px solid #5B8DEF"
                  : "1px solid #ccc",
                backgroundColor: isSelected ? "#eef4ff" : "white",
              }}
            >
              <button
                type="button"
                onClick={() => toggleTag(tag)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#333",
                  cursor: "pointer",
                  fontWeight: isSelected ? "bold" : "normal",
                }}
              >
                {tag}
              </button>

              {isSelected && (
                <div style={{ display: "flex", gap: "2px" }}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      aria-label={`${tag} ${rating}점`}
                      onClick={() => setTagRating(tag, rating)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: rating <= tagRatings[tag] ? "#FFB400" : "#bbb",
                        cursor: "pointer",
                        fontSize: "18px",
                        padding: "0 1px",
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: "12px", color: "#666" }}>
        선택된 태그 :{" "}
        {selectedTags.length === 0
          ? "없음"
          : selectedTags
              .map((tag) => `${tag} ${tagRatings[tag]}점`)
              .join(", ")}
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
          {id ? "수정" : "등록"}
        </button>
      </div>
    </div>
  );
}

export default WritePage;
