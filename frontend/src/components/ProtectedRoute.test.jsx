import { render, screen, waitFor } from "@testing-library/react";
import ProtectedRoute from "./ProtectedRoute";
import api from "../services/api";

jest.mock("react-router-dom", () => ({
  Navigate: () => <div>로그인으로 이동</div>,
  useLocation: () => ({ pathname: "/write" }),
}));

jest.mock("../services/api", () => ({ get: jest.fn() }));

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

test("토큰이 없으면 보호된 화면을 렌더링하지 않는다", () => {
  render(<ProtectedRoute><div>글쓰기 화면</div></ProtectedRoute>);

  expect(screen.getByText("로그인으로 이동")).toBeInTheDocument();
  expect(screen.queryByText("글쓰기 화면")).not.toBeInTheDocument();
});

test("서버가 인증한 사용자만 보호된 화면을 렌더링한다", async () => {
  localStorage.setItem("token", "valid-token");
  api.get.mockResolvedValue({ data: { username: "traveler" } });

  render(<ProtectedRoute><div>글쓰기 화면</div></ProtectedRoute>);

  await waitFor(() => {
    expect(screen.getByText("글쓰기 화면")).toBeInTheDocument();
  });
  expect(api.get).toHaveBeenCalledWith("/me");
});
