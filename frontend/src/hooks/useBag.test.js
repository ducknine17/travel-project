import { act, renderHook, waitFor } from "@testing-library/react";
import api from "../services/api";
import useBag from "./useBag";

jest.mock("../services/api", () => ({ get: jest.fn(), put: jest.fn() }));

beforeEach(() => {
  localStorage.setItem("token", "test-token");
  api.get.mockImplementation(url => {
    if (url === "/me") return Promise.resolve({ data: { username: "traveler", character: 1 } });
    if (url === "/load-post" || url === "/place-options") return Promise.resolve({ data: [] });
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
  api.put.mockResolvedValue({ data: { character: 2 } });
});

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

test("DB 캐릭터를 읽고 변경한 캐릭터를 다시 DB에 저장한다", async () => {
  const { result } = renderHook(() => useBag());

  await waitFor(() => expect(result.current.settings.character).toBe("poodle"));

  let saved;
  await act(async () => {
    saved = await result.current.saveSettings({
      ...result.current.settings,
      character: "shiba",
    });
  });

  expect(saved).toBe(true);
  expect(api.put).toHaveBeenCalledWith("/me/character", { character: 2 });
  expect(result.current.settings.character).toBe("shiba");
});
