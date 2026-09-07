import { useEffect, useState } from "react";
import api from "../services/api";
import PostCard from "../components/PostCard";
import FilterDrawer from "../components/FilterDrawer";
import "../styles/Browse.css";
import FilterBar from "../components/FilterBar";
import { getTagLabel, getTagRating } from "../utils/postUtils";

const EMPTY_FILTERS = { tag: "", location: "", minRating: 0 };

const filterPosts = (posts, filters) => {
    const location = filters.location.trim().toLocaleLowerCase("ko-KR");

    return posts.filter((post) => {
        const tags = post.tag || [];
        const matchingTags = filters.tag
            ? tags.filter((tag) => getTagLabel(tag) === filters.tag)
            : tags;
        const matchesTag = !filters.tag || matchingTags.length > 0;
        const matchesLocation = !location || (post.place || "")
            .toLocaleLowerCase("ko-KR")
            .includes(location);
        const matchesRating = !filters.minRating || matchingTags.some(
            (tag) => getTagRating(tag) >= filters.minRating
        );

        return matchesTag && matchesLocation && matchesRating;
    });
};

function BrowsePage() {

    const [posts, setPosts] = useState([]);
    const [likedPosts, setLikedPosts] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [filters, setFilters] = useState(EMPTY_FILTERS);

    useEffect(() => {
        loadPosts();
        loadLikedPosts();
    }, []);

    useEffect(() => {

        if (drawerOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };

    }, [drawerOpen]);

    const loadPosts = async () => {
        try {
            const res = await api.get("/load-post");
            setPosts(res.data || []);
        } catch (err) {
            console.log(err);
            setPosts([]);
        }
    };

    const loadLikedPosts = async () => {

        const token = localStorage.getItem("token");

        if (!token) {
            setLikedPosts([]);
            return;
        }

        try {
            const res = await api.get("/liked-posts");

            console.log("좋아요 게시글:", res.data);
            console.log("좋아요 게시글 개수:", res.data.length);

            setLikedPosts(res.data);

        } catch (err) {
            console.log("좋아요 게시글 불러오기 실패:", err);
            setLikedPosts([]);
        }
    };

    const likedPostIds = likedPosts.map(post => post.id);
    const filteredPosts = filterPosts(posts, filters);
    const filteredLikedPosts = filterPosts(likedPosts, filters);

    const handleDrawerToggle = () => {

        const nextOpen = !drawerOpen;

        setDrawerOpen(nextOpen);

        if (nextOpen) {
            loadLikedPosts();
        }
    };

    return (
        <div style={{ padding: "30px" }}>

            <h2>둘러보기</h2>

            <FilterBar
                filters={filters}
                onChange={setFilters}
                onReset={() => setFilters(EMPTY_FILTERS)}
            />

            <FilterDrawer
                open={drawerOpen}
                onToggle={handleDrawerToggle}
            >
                {filteredLikedPosts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        liked={true}
                    />
                ))}
            </FilterDrawer>

            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "20px"
            }}>

                {filteredPosts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        liked={likedPostIds.includes(post.id)}
                    />
                ))}

                {filteredPosts.length === 0 && (
                    <p>조건에 맞는 게시글이 없습니다.</p>
                )}

            </div>

        </div>
    );
}

export default BrowsePage;
