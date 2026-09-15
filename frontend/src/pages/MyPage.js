import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import KoreaConquestMap from "../components/KoreaConquestMap";
import { KOREA_REGIONS, findRegionByPlace } from "../data/koreaRegions";
import { getProfileCharacter } from "../data/profileCharacters";
import api from "../services/api";
import "../styles/MyPage.css";
import {
  formatPostDate,
  getDateKey,
  getImageSrc,
  getTagLabel,
  getTagRating,
} from "../utils/postUtils";

const MEMORY_STORAGE_KEY = "bef_private_memories";

function readMemories() {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function MyPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [profileImageId, setProfileImageId] = useState(null);
  const [character, setCharacter] = useState(0);
  const [posts, setPosts] = useState([]);
  const [selectedRegionKey, setSelectedRegionKey] = useState("seoul");
  const [memories, setMemories] = useState(readMemories);

  useEffect(() => {
    const loadMyPage = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("로그인이 필요한 서비스입니다.");
        navigate("/login");
        return;
      }

      try {
        const [meResponse, postsResponse] = await Promise.all([
          api.get("/me"),
          api.get("/load-post"),
        ]);
        const me = meResponse.data.username;
        const loadedPosts = postsResponse.data || [];
        const myPosts = loadedPosts.filter((post) => post.author === me);

        setUsername(me);
        setProfileImageId(meResponse.data.profile_image_id || null);
        setCharacter(meResponse.data.character ?? 0);
        setPosts(myPosts);
      } catch (error) {
        console.error(error);
        setPosts([]);
      }
    };

    loadMyPage();
  }, [navigate]);

  const postsByRegion = useMemo(() => {
    return posts.reduce((groups, post) => {
      const region = findRegionByPlace(post.place);
      return {
        ...groups,
        [region.key]: [...(groups[region.key] || []), post],
      };
    }, {});
  }, [posts]);

  useEffect(() => {
    const firstClaimedRegion = KOREA_REGIONS.find(
      (region) => postsByRegion[region.key]?.length
    );

    if (firstClaimedRegion) {
      setSelectedRegionKey(firstClaimedRegion.key);
    }
  }, [postsByRegion]);

  const selectedRegion = KOREA_REGIONS.find(
    (region) => region.key === selectedRegionKey
  );
  const selectedPosts = postsByRegion[selectedRegionKey] || [];
  const totalClaimed = Object.keys(postsByRegion).length;
  const selectedCharacter = getProfileCharacter(character);

  const saveMemory = (memoryKey, nextMemory) => {
    setMemories((current) => {
      const next = {
        ...current,
        [memoryKey]: {
          ...(current[memoryKey] || {}),
          ...nextMemory,
        },
      };

      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handlePrivatePhotoChange = async (event, memoryKey) => {
    const files = Array.from(event.target.files || []);
    const encodedPhotos = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          })
      )
    );

    const currentPhotos = memories[memoryKey]?.privatePhotos || [];
    saveMemory(memoryKey, {
      privatePhotos: [...currentPhotos, ...encodedPhotos],
    });
  };

  return (
    <main className="mypage">
      <section className="mypage-hero">
        <div className="mypage-profile-summary">
          <div className="mypage-profile-avatar">
            {profileImageId ? (
              <img src={getImageSrc(profileImageId)} alt={`${username} 프로필`} />
            ) : (
              <img
                src={selectedCharacter.image}
                alt={`${selectedCharacter.name} 캐릭터`}
              />
            )}
          </div>
          <div>
            <p className="eyebrow">MY PAGE</p>
            <h1>{username}님의 여행 점령 지도</h1>
            <p>
              공개 글은 모두가 보는 여행 정보로, 이곳의 일기와 비공개 사진은
              나만 보는 기록으로 따로 남겨집니다.
            </p>
            <small className="mypage-character-name">
              {selectedCharacter.name}
            </small>
          </div>
        </div>
        <div className="conquest-score">
          <strong>{totalClaimed}</strong>
          <span>점령 지역</span>
        </div>
      </section>

      <section className="mypage-grid">
        <KoreaConquestMap
          regions={KOREA_REGIONS}
          postsByRegion={postsByRegion}
          selectedRegionKey={selectedRegionKey}
          onSelectRegion={setSelectedRegionKey}
        />

        <div className="region-panel">
          <div className="region-panel-head">
            <div>
              <p className="eyebrow">CLAIMED AREA</p>
              <h2>{selectedRegion?.label || "지역"} 기록</h2>
            </div>
            <button type="button" onClick={() => navigate("/write")}>
              글쓰기
            </button>
          </div>

          {selectedPosts.length === 0 ? (
            <div className="empty-region">
              <h3>아직 깃발이 꽂히지 않았어요.</h3>
              <p>이 지역 여행을 다녀오면 공개 글과 개인 기록을 함께 모을 수 있습니다.</p>
            </div>
          ) : (
            selectedPosts.map((post) => {
              const memoryKey = `${post.id}-${getDateKey(post.written_date)}`;
              const memory = memories[memoryKey] || {};
              const photos = memory.privatePhotos || [];

              return (
                <article className="memory-card" key={memoryKey}>
                  <div className="memory-top">
                    <img src={getImageSrc(post.photo?.[0])} alt={post.title} />
                    <div>
                      <time>{formatPostDate(post.written_date)}</time>
                      <h3>{post.title}</h3>
                      <button
                        type="button"
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        공개 글 보기
                      </button>
                    </div>
                  </div>

                  <div className="tag-rating-list">
                    {(post.tag || []).map((tag) => {
                      const label = getTagLabel(tag);
                      const rating = getTagRating(tag);

                      return (
                        <span key={tag}>
                          {label}
                          {rating > 0 && ` ${"★".repeat(rating)}${"☆".repeat(5 - rating)}`}
                        </span>
                      );
                    })}
                  </div>

                  <textarea
                    value={memory.diary || ""}
                    onChange={(event) =>
                      saveMemory(memoryKey, { diary: event.target.value })
                    }
                    placeholder="이날의 일기를 나만 볼 수 있게 적어보세요."
                  />

                  <label className="private-photo-uploader">
                    비공개 사진 추가
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) =>
                        handlePrivatePhotoChange(event, memoryKey)
                      }
                    />
                  </label>

                  {photos.length > 0 && (
                    <div className="private-photo-grid">
                      {photos.map((photo, index) => (
                        <img
                          key={`${memoryKey}-${index}`}
                          src={photo}
                          alt={`${post.title} 비공개 사진 ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="my-posts-section">
        <h2>내가 쓴 글</h2>
        <div className="my-posts-list">
          {posts.map((post) => (
            <button
              type="button"
              key={post.id}
              onClick={() => navigate(`/post/${post.id}`)}
            >
              <span>{post.title}</span>
              <small>
                {findRegionByPlace(post.place).label} · {formatPostDate(post.written_date)}
              </small>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

export default MyPage;
