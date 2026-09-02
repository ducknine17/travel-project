import { fireEvent, render, screen } from "@testing-library/react";
import PlaceSelector from "./PlaceSelector";
import api from "../services/api";

jest.mock("../services/api", () => ({
  get: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

test("DB에서 불러온 장소를 선택한다", async () => {
  const onChange = jest.fn();
  api.get.mockResolvedValue({
    data: [
      {
        id: "1",
        name: "서울숲",
        type: "tour",
        address: "서울특별시 성동구",
      },
    ],
  });

  render(<PlaceSelector value="" onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: "장소 선택" }));

  const option = await screen.findByRole("button", { name: /서울숲/ });
  expect(option).toHaveTextContent("관광지 · 서울특별시 성동구");
  fireEvent.click(option);

  expect(api.get).toHaveBeenCalledWith("/place-options");
  expect(onChange).toHaveBeenCalledWith("서울숲");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("입력한 장소명이나 주소로 검색한다", async () => {
  api.get.mockResolvedValue({
    data: [
      { id: "1", name: "서울숲", address: "서울특별시 성동구" },
      { id: "2", name: "해운대", address: "부산광역시 해운대구" },
    ],
  });

  render(<PlaceSelector value="" onChange={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "장소 선택" }));
  await screen.findByRole("button", { name: /서울숲/ });
  fireEvent.change(
    screen.getByRole("searchbox"),
    { target: { value: "부산" } }
  );

  expect(screen.getByRole("button", { name: /해운대/ })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /서울숲/ })).not.toBeInTheDocument();
});

test("새 장소 API가 없으면 기존 API의 모든 페이지를 불러온다", async () => {
  api.get.mockImplementation((url, config) => {
    if (url === "/place-options") {
      return Promise.reject({ response: { status: 404 } });
    }

    const page = config.params.page;
    return Promise.resolve({
      data: {
        total: 101,
        items: [
          { id: String(page), name: `${page}페이지 장소`, address: "서울특별시" },
        ],
      },
    });
  });

  render(<PlaceSelector value="" onChange={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "장소 선택" }));

  expect(await screen.findByRole("button", { name: /2페이지 장소/ })).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith("/places", {
    params: { page: 2, page_size: 100 },
  });
});
