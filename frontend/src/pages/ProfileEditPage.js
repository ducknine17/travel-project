import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { PROFILE_CHARACTERS } from "../data/profileCharacters";
import { getImageSrc } from "../utils/postUtils";
import "../styles/ProfileEdit.css";

function ProfileEditPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [username, setUsername] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [profileImageId, setProfileImageId] = useState(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [character, setCharacter] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const verificationToken = new URLSearchParams(window.location.search).get("token");

  const sendVerificationEmail = async () => {
    try {
      await api.post("/password-change/send-email");
      setEmailSent(true);
      alert("등록된 이메일로 인증 링크를 발송했습니다.");
    } catch (err) {
      alert("인증 메일 발송에 실패했습니다.");
    }
  };

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await api.get("/me");
        setUsername(res.data.username);
        setProfileImageId(res.data.profile_image_id || null);
        setProfilePreview(getImageSrc(res.data.profile_image_id));
        setCharacter(res.data.character ?? 0);
      } catch (err) {
        console.error(err);
      }
    };

    loadMe();
  }, []);

  const uploadProfileImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);

    try {
      const res = await api.post("/upload-image/", formData);
      setProfileImageId(res.data.id);
      setProfilePreview(getImageSrc(res.data.id));
    } catch (err) {
      alert("프로필 사진 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const saveAppearance = async () => {
    setProfileSaving(true);
    try {
      const res = await api.put("/profile", {
        profile_image_id: profileImageId,
        character,
      });
      setProfileImageId(res.data.profile_image_id);
      setCharacter(res.data.character);
      alert("프로필이 저장되었습니다.");
    } catch (err) {
      alert("프로필 저장에 실패했습니다.");
    } finally {
      setProfileSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!verificationToken) {
      alert("이메일 인증을 먼저 완료해주세요.");
      return;
    }

    if (password.length < 8) {
      alert("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (password !== passwordCheck) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await api.put("/password-change", {
        password,
        verification_token: verificationToken,
      });

      alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");

      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      alert("수정에 실패했습니다.");
    }
  };

  return (
    <div className="profile-edit-page">
      <h2>개인정보 수정</h2>

      <section className="profile-appearance-section">
        <h3>프로필 설정</h3>

        <div className="profile-photo-editor">
          <div className="profile-photo-preview">
            {profilePreview ? (
              <img src={profilePreview} alt="프로필 미리보기" />
            ) : (
              <img
                src={PROFILE_CHARACTERS[character].image}
                alt={`${PROFILE_CHARACTERS[character].name} 캐릭터`}
              />
            )}
          </div>
          <div>
            <strong>프로필 사진</strong>
            <p>나를 나타낼 사진을 선택해주세요.</p>
            <label className="profile-upload-button">
              {uploading ? "업로드 중..." : "사진 선택"}
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={uploadProfileImage}
              />
            </label>
            {profileImageId && (
              <button
                type="button"
                className="profile-photo-remove"
                onClick={() => {
                  setProfileImageId(null);
                  setProfilePreview("");
                }}
              >
                사진 삭제
              </button>
            )}
          </div>
        </div>

        <fieldset className="character-picker">
          <legend>캐릭터 선택</legend>
          <div>
            {PROFILE_CHARACTERS.map((option) => (
              <label
                key={option.id}
                className={character === option.id ? "selected" : ""}
              >
                <input
                  type="radio"
                  name="character"
                  value={option.id}
                  checked={character === option.id}
                  onChange={() => setCharacter(option.id)}
                />
                <img src={option.image} alt="" />
                <strong>{option.name}</strong>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          className="profile-save-button"
          onClick={saveAppearance}
          disabled={uploading || profileSaving}
        >
          {profileSaving ? "저장 중..." : "프로필 저장"}
        </button>
      </section>

      <section className="password-edit-section">
        <h3>비밀번호 변경</h3>

        {!verificationToken && (
          <div style={{ marginTop: "20px" }}>
            <button
              onClick={sendVerificationEmail}
              disabled={emailSent}
              style={{ width: "100%", padding: "12px", cursor: "pointer" }}
            >
              {emailSent ? "인증 메일을 발송했습니다" : "이메일 인증하기"}
            </button>
          </div>
        )}

        {verificationToken && (
          <p style={{ color: "green", marginTop: "20px" }}>
            이메일 인증 링크가 확인되었습니다. 새 비밀번호를 입력해주세요.
          </p>
        )}

        <div style={{ marginTop: "25px" }}>
          <label>아이디</label>
          <input
            type="text"
            value={username}
            readOnly
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
              backgroundColor: "#f5f5f5",
              color: "#666",
              cursor: "not-allowed",
            }}
          />
        </div>
        <div style={{ marginTop: "20px" }}>
          <label>새 비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="새 비밀번호"
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          />
        </div>
        <div style={{ marginTop: "20px" }}>
          <label>비밀번호 확인</label>
          <input
            type="password"
            value={passwordCheck}
            onChange={(e) => setPasswordCheck(e.target.value)}
            placeholder="비밀번호 확인"
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          />
        </div>

        <button
          onClick={saveProfile}
          disabled={!verificationToken}
          style={{
            marginTop: "30px",
            width: "100%",
            padding: "12px",
            cursor: "pointer",
          }}
        >
          비밀번호 저장
        </button>
      </section>
    </div>
  );
}

export default ProfileEditPage;
