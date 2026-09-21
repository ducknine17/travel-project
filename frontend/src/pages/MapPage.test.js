import { act, fireEvent, render, screen } from "@testing-library/react";
import MapPage from "./MapPage";
import api from "../services/api";

jest.mock("react-router-dom", () => ({Link: ({to,children}) => <a href={to}>{children}</a>}));

jest.mock("../services/api", () => ({ get: jest.fn() }));

jest.mock("../components/KakaoMap", () => function MockKakaoMap({
  places,
  stations,
  buses,
  routePath,
  onMapMove,
  onPlaceClick,
  onStationClick,
}) {
  return (
    <div>
      <button type="button" onClick={() => onMapMove(37.5665, 126.978)}>
        지도 이동
      </button>
      {places.map((place) => (
        <button
          type="button"
          key={place.id}
          onClick={() => onPlaceClick(place)}
        >
          {place.name}
        </button>
      ))}
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
      <span data-testid="route-point-count">{routePath.length}</span>
    </div>
  );
});

test("현재 페이지의 장소를 요청하고 핀을 누르면 해당 장소 게시글을 표시한다", async () => {
  api.get.mockImplementation((url, options) => {
    if (url === "/places/filters") return Promise.resolve({ data: { groups: [] } });
    if (url === "/places") {
      expect(options.params.get("page_size")).toBe("30");
      return Promise.resolve({
        data: {
          items: [{
            id: "126508",
            name: "경복궁",
            lat: 126.9769,
            lng: 37.5796,
            address: "서울특별시 종로구",
            type: "tour",
            tags: [],
          }],
        },
      });
    }
    if (url === "/places/126508/posts") {
      return Promise.resolve({
        data: [{ id: "post-1", title: "휠체어로 다녀온 경복궁", author: "여행자" }],
      });
    }
    return Promise.reject(new Error(`unexpected request: ${url}`));
  });

  render(<MapPage />);

  fireEvent.click(await screen.findByRole("button", { name: "경복궁" }));
  expect(await screen.findByRole("link", { name: "휠체어로 다녀온 경복궁" }))
    .toHaveAttribute("href", "/post/post-1");
  expect(screen.getByText(/여행자 ·/)).toBeInTheDocument();
  expect(screen.getByText(/지도 장소 1개/)).toBeInTheDocument();
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
    if (url === "/bus-route-path") {
      return Promise.resolve({
        data: [
          { latitude: "37.566254", longitude: "126.976921" },
          { latitude: "37.570100", longitude: "126.982000" },
        ],
      });
    }
    return Promise.reject(new Error(`unexpected request: ${url}`));
  });

  render(<MapPage />);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "지도 이동" }));
  });
  fireEvent.click(await screen.findByRole("button", { name: "시청.덕수궁" }));

  expect(await screen.findByRole("button", { name: "701" })).toBeInTheDocument();
  expect(await screen.findByText(/운행 차량 1대를 표시했습니다/)).toBeInTheDocument();
  expect(screen.getByTestId("bus-count")).toHaveTextContent("1");
  expect(screen.getByTestId("route-point-count")).toHaveTextContent("2");
  expect(api.get).toHaveBeenCalledWith("/bus-location", {
    params: { city_code: "11", route_id: "100100118" },
  });
  expect(api.get).toHaveBeenCalledWith("/bus-route-path", {
    params: { city_code: "11", route_id: "100100118" },
  });

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "지도 이동" }));
  });
  expect(screen.queryByRole("heading", { name: "시청.덕수궁" })).not.toBeInTheDocument();
  expect(screen.getByTestId("bus-count")).toHaveTextContent("0");
  expect(screen.getByTestId("route-point-count")).toHaveTextContent("0");
});

test("노선 조회가 실패해도 도착정보에서 접근 중인 노선을 복구한다", async () => {
  api.get.mockImplementation((url) => {
    if (url === "/places/filters") return Promise.resolve({ data: { groups: [] } });
    if (url === "/places") return Promise.resolve({ data: { items: [] } });
    if (url === "/bus-stations") return Promise.resolve({ data: [{
      id: "DJB8001415", name: "대전역네거리", latitude: 36.33, longitude: 127.43,
      cityCode: "25", arrivalSupported: true, locationSupported: true, source: "public-data",
    }] });
    if (url === "/bus-routes") return Promise.reject(new Error("route service failed"));
    if (url === "/bus-arrival") return Promise.resolve({ data: [{
      routeId: "DJB30300042", routeName: "107", routeType: "간선버스",
      remainingStops: 2, vehicleType: "저상버스", arrivalTime: 120,
    }] });
    if (url === "/bus-location") return Promise.resolve({ data: [{
      vehicleNumber: "대전75자1234", latitude: 36.33, longitude: 127.43,
    }] });
    if (url === "/bus-route-path") return Promise.resolve({ data: [
      { latitude: 36.33, longitude: 127.43 }, { latitude: 36.34, longitude: 127.44 },
    ] });
    return Promise.reject(new Error(`unexpected request: ${url}`));
  });

  render(<MapPage />);
  fireEvent.click(screen.getByRole("button", { name: "지도 이동" }));
  fireEvent.click(await screen.findByRole("button", { name: "대전역네거리" }));

  expect(await screen.findByRole("button", { name: "107" })).toBeInTheDocument();
  expect(await screen.findByText("저상버스")).toBeInTheDocument();
  expect(screen.getByTestId("bus-count")).toHaveTextContent("1");
  expect(screen.getByTestId("route-point-count")).toHaveTextContent("2");
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
