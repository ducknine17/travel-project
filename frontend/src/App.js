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


function App() {
  return (
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
