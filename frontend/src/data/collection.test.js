import { getCollection, readBagSettings } from "./collection";

afterEach(() => localStorage.clear());

test("기존 지도와 고글 선택은 중복 없이 스카프로 이어진다", () => {
  localStorage.setItem("bef_bag:traveler", JSON.stringify({
    character: "shiba", items: ["map", "goggles", "scarf", "book"], badges: ["first"],
  }));
  expect(readBagSettings("traveler")).toMatchObject({
    character: "shiba", items: ["scarf", "book"], badges: ["first"],
  });
});

test("스카프는 첫 여행 글로 획득하고 텀블러는 방문 확인 전까지 잠긴다", () => {
  expect(getCollection().items.find(item => item.id === "scarf").earned).toBe(false);
  const { items } = getCollection([{ place: "서울숲" }]);
  expect(items.find(item => item.id === "scarf").earned).toBe(true);
  expect(items.find(item => item.id === "bottle").earned).toBe(false);
  expect(items).toHaveLength(6);
});
