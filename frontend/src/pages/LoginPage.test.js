import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./LoginPage";
import api from "../services/api";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  Link: ({ to, children }) => {
    const React = require("react");
    return React.createElement("a", { href: to }, children);
  },
  useNavigate: () => mockNavigate,
}));

jest.mock("../services/api", () => ({
  post: jest.fn(),
}));

beforeEach(() => {
  jest.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

test("비밀번호 입력창에서 Enter를 누르면 로그인한다", async () => {
  api.post.mockResolvedValue({ data: { access_token: "access-token" } });
  render(<LoginPage />);

  userEvent.type(screen.getByPlaceholderText("아이디를 입력하세요"), "traveler");
  userEvent.type(screen.getByPlaceholderText("비밀번호를 입력하세요"), "password{enter}");

  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith("/login", {
      id: "traveler",
      password: "password",
    });
  });
  expect(localStorage.getItem("token")).toBe("access-token");
  expect(mockNavigate).toHaveBeenCalledWith("/");
});
