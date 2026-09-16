export const profileName = user => user?.display_name?.trim() || user?.username?.split("@")[0] || "여행 친구";
