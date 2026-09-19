import { getCollection, readBagSettings } from "./collection";

afterEach(() => localStorage.clear());

test("기존 스카프와 고글 선택은 중복 없이 지도로 이어진다", () => {
  localStorage.setItem("bef_bag:traveler", JSON.stringify({
    character: "shiba", items: ["scarf", "goggles", "map", "book"], badges: ["first"],
  }));
  expect(readBagSettings("traveler")).toMatchObject({
    character: "shiba", items: ["map", "book"], badges: ["first"],
  });
});

test("지도는 첫 여행 글로 획득하고 텀블러는 방문 확인 전까지 잠긴다", () => {
  expect(getCollection().items.find(item => item.id === "map").earned).toBe(false);
  const { items } = getCollection([{ place: "서울숲" }]);
  expect(items.find(item => item.id === "map").earned).toBe(true);
  expect(items.find(item => item.id === "bottle").earned).toBe(false);
  expect(items).toHaveLength(6);
});
