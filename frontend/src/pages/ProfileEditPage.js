function ProfileEditPage() {
  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "50px auto",
        padding: "30px",
      }}
    >
      <h2>개인정보 수정</h2>

      <div style={{ marginTop: "25px" }}>
        <label>아이디</label>
        <input
          type="text"
          disabled
          value={localStorage.getItem("username") || ""}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "5px",
          }}
        />
      </div>

      <div style={{ marginTop: "20px" }}>
        <label>새 비밀번호</label>
        <input
          type="password"
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
          placeholder="비밀번호 확인"
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "5px",
          }}
        />
      </div>

      <button
        style={{
          marginTop: "30px",
          width: "100%",
          padding: "12px",
          cursor: "pointer",
        }}
      >
        저장하기
      </button>
    </div>
  );
}

export default ProfileEditPage;