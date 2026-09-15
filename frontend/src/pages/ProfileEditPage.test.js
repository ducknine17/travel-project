import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import api from "../services/api";
import ProfileEditPage from "./ProfileEditPage";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  Link: ({ to, children }) => <a href={to}>{children}</a>,
  useNavigate: () => mockNavigate,
}));

jest.mock("../services/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

beforeEach(() => {
  window.history.replaceState({}, "", "/profile/edit?token=email-token");
  api.get.mockResolvedValue({ data: { verified: true } });
  api.put.mockResolvedValue({ data: { message: "success" } });
});

afterEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
  jest.clearAllMocks();
});

test("로그아웃 상태에서도 이메일 토큰을 확인하고 비밀번호를 변경한다", async () => {
  render(<ProfileEditPage />);

  expect(await screen.findByText(/이메일 인증이 완료됐어요/)).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith("/password-change/verify", {
    params: { token: "email-token" },
  });
  expect(api.get).not.toHaveBeenCalledWith("/me");

  fireEvent.change(screen.getByLabelText("새 비밀번호"), {
    target: { value: "new-password" },
  });
  fireEvent.change(screen.getByLabelText("새 비밀번호 확인"), {
    target: { value: "new-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경하기" }));

  await waitFor(() => {
    expect(api.put).toHaveBeenCalledWith("/password-change", {
      password: "new-password",
      verification_token: "email-token",
    });
  });
  expect(mockNavigate).toHaveBeenCalledWith("/login");
});
