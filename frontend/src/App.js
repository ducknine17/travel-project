import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import BrowsePage from "./pages/BrowsePage";
import WritePage from "./pages/WritePage";
import PostDetailPage from "./pages/PostDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<BrowsePage />} />
        <Route path="/write" element={<WritePage />} />
        <Route path="/post/:id" element={<PostDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;