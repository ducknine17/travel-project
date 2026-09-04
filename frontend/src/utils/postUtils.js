import api from "../services/api";

export const TAG_RATING_SEPARATOR = "|rating:";

export const parseTagRating = (tag) => {
  if (typeof tag !== "string") {
    return { label: "", rating: 0 };
  }

  const [label, ratingValue] = tag.split(TAG_RATING_SEPARATOR);
  const rating = Number(ratingValue);

  return {
    label: label.trim(),
    rating: Number.isFinite(rating) ? rating : 0,
  };
};

export const encodeTagRating = (label, rating) =>
  `${label}${TAG_RATING_SEPARATOR}${rating}`;

export const getTagLabel = (tag) => parseTagRating(tag).label || tag;

export const getTagRating = (tag) => parseTagRating(tag).rating;

export const getImageSrc = (image) => {
  if (!image) return "";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:") ||
    image.startsWith("blob:")
  ) {
    return image;
  }

  return `${api.defaults.baseURL}/image/${encodeURIComponent(image)}`;
};

export const formatPostDate = (value) => {
  if (!value) return "날짜 없음";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const getDateKey = (value) => {
  if (!value) return "unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

  return date.toISOString().slice(0, 10);
};
