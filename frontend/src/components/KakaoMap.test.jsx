import { render, waitFor } from "@testing-library/react";
import KakaoMap from "./KakaoMap";

class LatLng {
  constructor(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
  }

  getLat() {
    return this.latitude;
  }

  getLng() {
    return this.longitude;
  }
}

const createKakaoMock = () => {
  const defaultCenter = new LatLng(36.3, 127.3);
  const map = {
    getCenter: jest.fn(() => defaultCenter),
    setCenter: jest.fn(),
    setLevel: jest.fn(),
  };
  const Marker = jest.fn((options) => ({
    options,
    setMap: jest.fn(),
  }));
  const InfoWindow = jest.fn((options) => ({
    options,
    open: jest.fn(),
    close: jest.fn(),
  }));

  window.kakao = {
    maps: {
      load: (callback) => callback(),
      LatLng,
      Map: jest.fn(() => map),
      Marker,
      MarkerImage: jest.fn(),
      Size: jest.fn(),
      Point: jest.fn(),
      InfoWindow,
      event: { addListener: jest.fn() },
    },
  };

  return map;
};

afterEach(() => {
  delete window.kakao;
  jest.restoreAllMocks();
});

test("위치 권한을 허용하면 사용자 위치로 지도의 중심을 이동한다", async () => {
  const map = createKakaoMock();
  const onMapMove = jest.fn();
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: jest.fn((success) => success({
        coords: { latitude: 37.5665, longitude: 126.978 },
      })),
    },
  });

  render(<KakaoMap onMapMove={onMapMove} />);

  await waitFor(() => {
    expect(map.setCenter).toHaveBeenCalled();
  });
  const center = map.setCenter.mock.calls[0][0];
  expect(center.getLat()).toBe(37.5665);
  expect(center.getLng()).toBe(126.978);
  expect(map.setLevel).toHaveBeenCalledWith(5);
  expect(onMapMove).toHaveBeenCalledWith(37.5665, 126.978);
});

test("위치 확인이 실패하면 기존 전국 중심을 유지한다", async () => {
  createKakaoMock();
  const onMapMove = jest.fn();
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: jest.fn((_success, error) => error()),
    },
  });

  render(<KakaoMap onMapMove={onMapMove} />);

  await waitFor(() => {
    expect(onMapMove).toHaveBeenCalledWith(36.3, 127.3);
  });
});

test("여행지 핀을 누르면 장소 정보를 안전한 텍스트로 표시한다", async () => {
  const map = createKakaoMock();
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: jest.fn((_success, error) => error()),
    },
  });

  render(
    <KakaoMap
      places={[{
        id: "place-1",
        name: "서울숲",
        address: "서울특별시 성동구 뚝섬로 273",
        type: "tour",
        tags: ["parking", "wheelchair"],
        lat: 127.037,
        lng: 37.544,
      }]}
    />
  );

  await waitFor(() => {
    expect(window.kakao.maps.Marker).toHaveBeenCalled();
  });
  const marker = window.kakao.maps.Marker.mock.results[0].value;
  const markerClick = window.kakao.maps.event.addListener.mock.calls.find(
    ([target, eventName]) => target === marker && eventName === "click"
  );
  markerClick[2]();

  const infoOptions = window.kakao.maps.InfoWindow.mock.calls[0][0];
  expect(infoOptions.content.textContent).toContain("서울숲");
  expect(infoOptions.content.textContent).toContain("서울특별시 성동구");
  expect(infoOptions.content.textContent).toContain("관광지");
  expect(infoOptions.content.textContent).toContain("주차, 휠체어");
  const infoWindow = window.kakao.maps.InfoWindow.mock.results[0].value;
  expect(infoWindow.open).toHaveBeenCalledWith(map, marker);
});
