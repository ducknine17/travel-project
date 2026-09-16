import { render, screen } from "@testing-library/react";
import PostDetailPage from "./PostDetailPage";
import api from "../services/api";

jest.mock("react-router-dom", () => ({
  Link: ({to, children}) => <a href={to}>{children}</a>,
  useParams: () => ({ id: "missing-post" }),
  useNavigate: () => jest.fn(),
}));

jest.mock("../services/api", () => ({ get: jest.fn() }));

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

test("없는 게시글이면 계속 로딩하지 않고 안내한다", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  api.get.mockResolvedValue({ data: [] });

  render(<PostDetailPage />);

  expect(
    await screen.findByText("이 여행 기록을 찾지 못했어요")
  ).toBeInTheDocument();
  expect(screen.queryByText("불러오는 중...")).not.toBeInTheDocument();
});
