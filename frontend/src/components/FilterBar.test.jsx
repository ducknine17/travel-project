import { fireEvent, render, screen } from "@testing-library/react";
import FilterBar from "./FilterBar";

test("태그, 위치, 별점 필터 값을 변경하고 초기화한다", () => {
  const onChange = jest.fn();
  const onReset = jest.fn();
  const filters = { tag: "", location: "", minRating: 0 };

  render(<FilterBar filters={filters} onChange={onChange} onReset={onReset} />);

  fireEvent.change(screen.getByLabelText("태그 필터"), {
    target: { value: "♿ 휠체어" },
  });
  expect(onChange).toHaveBeenCalledWith({
    tag: "♿ 휠체어",
    location: "",
    minRating: 0,
  });

  fireEvent.change(screen.getByLabelText("위치 필터"), {
    target: { value: "서울" },
  });
  expect(onChange).toHaveBeenCalledWith({
    tag: "",
    location: "서울",
    minRating: 0,
  });

  fireEvent.click(screen.getByRole("button", { name: "초기화" }));
  expect(onReset).toHaveBeenCalled();
});
