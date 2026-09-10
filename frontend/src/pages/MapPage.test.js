import { fireEvent, render, screen } from "@testing-library/react";
import MapPage from "./MapPage";
import api from "../services/api";

jest.mock("../services/api", () => ({ get: jest.fn() }));

jest.mock("../components/KakaoMap", () => function MockKakaoMap({
  stations,
  buses,
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
      <span data-testid="bus-count">{buses.length}</span>
    </div>
  );
});

test("서울 정류장을 누르면 노선과 실시간 차량 위치를 지도에 전달한다", async () => {
  api.get.mockImplementation((url) => {
    if (url === "/places/filters") return Promise.resolve({ data: { groups: [] } });
    if (url === "/places") return Promise.resolve({ data: { items: [] } });
    if (url === "/bus-stations") {
      return Promise.resolve({
        data: [{
          id: "101000227",
          arsId: "02662",
          name: "시청.덕수궁",
          latitude: 37.566254,
          longitude: 126.976921,
          cityCode: "11",
          arrivalSupported: false,
          locationSupported: true,
          source: "seoul-public-data",
          routes: [],
        }],
      });
    }
    if (url === "/bus-routes") {
      return Promise.resolve({
        data: [{ routeId: "100100118", routeName: "701" }],
      });
    }
    if (url === "/bus-location") {
      return Promise.resolve({
        data: [{
          vehicleId: "111049708",
          vehicleNumber: "서울74사4513",
          latitude: "37.623453",
          longitude: "126.916968",
        }],
      });
    }
    return Promise.reject(new Error(`unexpected request: ${url}`));
  });

  render(<MapPage />);
  fireEvent.click(screen.getByRole("button", { name: "지도 이동" }));
  fireEvent.click(await screen.findByRole("button", { name: "시청.덕수궁" }));

  expect(await screen.findByRole("button", { name: "701" })).toBeInTheDocument();
  expect(await screen.findByText(/운행 차량 1대를 표시했습니다/)).toBeInTheDocument();
  expect(screen.getByTestId("bus-count")).toHaveTextContent("1");
  expect(api.get).toHaveBeenCalledWith("/bus-location", {
    params: { city_code: "11", route_id: "100100118" },
  });
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
