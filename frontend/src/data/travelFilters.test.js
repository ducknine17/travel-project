import { hasFacility, postCategory, displayTravelTag } from "./travelFilters";
import { readBagSettings } from "./collection";
import { profileName } from "../utils/profile";

afterEach(() => localStorage.clear());
test("기존 이모지 태그와 새 시설 키로 같은 기록을 찾는다", () => {
  expect(hasFacility(["♿ 휠체어|rating:4"], "wheelchair")).toBe(true);
  expect(hasFacility(["wheelchair|rating:4"], "wheelchair")).toBe(true);
  expect(hasFacility(["parking|rating:3"], "wheelchair")).toBe(false);
});
test("직접 선택한 분류를 우선하며 이전 장소는 분류를 추론한다", () => {
  expect(postCategory({place:"서울숲", tag:["category:cafe"]})).toBe("cafe");
  expect(postCategory({place:"서울숲"})).toBe("forest");
  expect(displayTravelTag("category:cafe")).toBe("카페");
  expect(displayTravelTag("elevator|rating:5")).toBe("엘리베이터");
});
test("이메일 주소 대신 표시 이름을 사용하고 이전 고글을 스카프로 이전한다", () => {
  expect(profileName({username:"traveler@example.com"})).toBe("traveler");
  expect(profileName({username:"id",display_name:"나의 이름"})).toBe("나의 이름");
  localStorage.setItem("bef_bag:traveler", JSON.stringify({items:["scarf","goggles"]}));
  expect(readBagSettings("traveler").items).toEqual(["scarf"]);
});
