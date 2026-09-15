import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileEditPage from "./ProfileEditPage";
import api from "../services/api";

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock("../services/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  defaults: { baseURL: "https://api.example.com" },
}));

beforeEach(() => {
  jest.spyOn(window, "alert").mockImplementation(() => {});
  api.get.mockResolvedValue({
    data: {
      username: "traveler",
      profile_image_id: null,
      character: 0,
    },
  });
});

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

test("업로드에서 받은 이미지 id와 0~3 캐릭터 값을 프로필에 저장한다", async () => {
  api.post.mockResolvedValue({ data: { id: "uploaded-image-id" } });
  api.put.mockResolvedValue({
    data: { profile_image_id: "uploaded-image-id", character: 3 },
  });

  render(<ProfileEditPage />);
  await screen.findByDisplayValue("traveler");

  const file = new File(["image"], "profile.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("사진 선택"), {
    target: { files: [file] },
  });

  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith("/upload-image/", expect.any(FormData));
  });

  userEvent.click(screen.getByLabelText(/닥스훈트/));
  userEvent.click(screen.getByRole("button", { name: "프로필 저장" }));

  await waitFor(() => {
    expect(api.put).toHaveBeenCalledWith("/profile", {
      profile_image_id: "uploaded-image-id",
      character: 3,
    });
  });
});
