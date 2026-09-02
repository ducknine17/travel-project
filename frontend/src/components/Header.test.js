import { render, screen, waitFor } from "@testing-library/react";
import Header from "./Header";
import api from "../services/api";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children }) => {
    const React = require("react");
    return React.createElement("a", { href: to }, children);
  },
  useLocation: () => ({ pathname: "/" }),
  useNavigate: () => jest.fn(),
}));

jest.mock("../services/api", () => ({
  get: jest.fn(),
}));

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

test("유효하지 않은 JWT가 있으면 로그인 메뉴를 표시한다", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  localStorage.setItem("token", "invalid-token");
  api.get.mockRejectedValue({ response: { status: 401 } });

  render(<Header />);

  expect(await screen.findByRole("link", { name: "로그인" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "로그아웃" })).not.toBeInTheDocument();
  expect(localStorage.getItem("token")).toBeNull();
});

test("유효한 JWT가 있으면 사용자와 로그아웃 메뉴를 표시한다", async () => {
  localStorage.setItem("token", "valid-token");
  api.get.mockResolvedValue({ data: { username: "traveler" } });

  render(<Header />);

  await waitFor(() => {
    expect(screen.getByText("traveler ▼")).toBeInTheDocument();
  });
  expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
});
