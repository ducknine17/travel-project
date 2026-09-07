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
import ProtectedRoute from "./components/ProtectedRoute";


function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<BrowsePage />} />
        <Route path="/write" element={<ProtectedRoute><WritePage /></ProtectedRoute>} />
        <Route path="/edit/:id" element={<ProtectedRoute><WritePage /></ProtectedRoute>} />
        <Route path="/post/:id" element={<PostDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/validate/:id" element={<ValidatePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/profile/edit" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
        <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
