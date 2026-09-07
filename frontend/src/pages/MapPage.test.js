import { fireEvent, render, screen } from "@testing-library/react";
import MapPage from "./MapPage";
import api from "../services/api";

jest.mock("../services/api", () => ({ get: jest.fn() }));

jest.mock("../components/KakaoMap", () => function MockKakaoMap({
  stations,
  onMapMove,
  onStationClick,
}) {
  return (
    <div>
      <button type="button" onClick={() => onMapMove(37.5665, 126.978)}>
        지도 이동
      </button>
      {stations.map((station) => (
        <button
          type="button"
          key={station.id}
          onClick={() => onStationClick(station)}
        >
          {station.name}
        </button>
      ))}
    </div>
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

test("공공 API 보조 정류장을 표시하고 지원하지 않는 도착 요청은 보내지 않는다", async () => {
  api.get.mockImplementation((url) => {
    if (url === "/places/filters") return Promise.resolve({ data: { groups: [] } });
    if (url === "/places") return Promise.resolve({ data: { items: [] } });
    if (url === "/bus-stations") {
      return Promise.resolve({
        data: [{
          id: "osm-123",
          name: "테스트 정류장",
          latitude: 37.5,
          longitude: 127,
          cityCode: null,
          arrivalSupported: false,
          source: "openstreetmap",
          routes: ["100"],
        }],
      });
    }
    return Promise.reject(new Error(`unexpected request: ${url}`));
  });

  render(<MapPage />);
  fireEvent.click(screen.getByRole("button", { name: "지도 이동" }));

  const station = await screen.findByRole("button", { name: "테스트 정류장" });
  expect(screen.getByText(/OpenStreetMap contributors/)).toBeInTheDocument();
  fireEvent.click(station);
  expect(await screen.findByText(/실시간 도착 정보는 지원하지 않습니다/)).toBeInTheDocument();
  expect(api.get).not.toHaveBeenCalledWith("/bus-arrival", expect.anything());
});
