import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import BrowsePage from "./pages/BrowsePage";
import WritePage from "./pages/WritePage";
import PostDetailPage from "./pages/PostDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ValidatePage from "./pages/ValidatePage";
import MapPage from "./pages/MapPage";
import ProfileEditPage from "./pages/ProfileEditPage";
import MyPage from "./pages/MyPage";
import CollectionPage from "./pages/CollectionPage";
import { Icon } from "./components/Brand";


function App() {
  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">본문 바로가기</a>
      {process.env.NODE_ENV === "development" && process.env.REACT_APP_DESIGN_PREVIEW === "true" && <div className="preview-banner"><span>디자인 미리보기 · 글·사진·계정은 예시이며 서버에 전송되지 않아요.</span><button onClick={() => {localStorage.setItem("token", "bf-design-preview"); window.location.reload();}}>예시 여행자로 보기</button></div>}
      <Header />

      <Routes>
        <Route path="/" element={<BrowsePage />} />
        <Route path="/write" element={<WritePage />} />
        <Route path="/edit/:id" element={<WritePage />} />
        <Route path="/post/:id" element={<PostDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/validate/:id" element={<ValidatePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/profile/edit" element={<ProfileEditPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/badges" element={<CollectionPage />} />
        <Route path="/bag/decorate" element={<CollectionPage decorate />} />
      </Routes>
      <footer className="site-footer"><span><Icon size={16}/>함께라서, 조금 더 멀리. BF 베프</span><span>모두에게 열린 여행, 우리의 발걸음으로.</span><span>© BF · Barrier Free, Best Friend</span></footer>
    </BrowserRouter>
  );
}

export default App;
