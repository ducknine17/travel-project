import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import BrowsePage from "./pages/BrowsePage";
import WritePage from "./pages/WritePage";
import PostDetailPage from "./pages/PostDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";


function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<BrowsePage />} />
        <Route path="/write" element={<WritePage />} />
        <Route path="/post/:id" element={<PostDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;