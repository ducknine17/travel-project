export const PROFILE_CHARACTERS = [
  { id: 0, image: "/characters/retriever.png", name: "리트리버" },
  { id: 1, image: "/characters/poodle.png", name: "푸들" },
  { id: 2, image: "/characters/shiba.png", name: "시바견" },
  { id: 3, image: "/characters/dachshund.png", name: "닥스훈트" },
];

export const getProfileCharacter = (character) =>
  PROFILE_CHARACTERS.find((option) => option.id === character) ||
  PROFILE_CHARACTERS[0];
