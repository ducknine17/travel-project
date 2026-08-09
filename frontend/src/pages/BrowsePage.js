import { useEffect, useState } from "react";
import api from "../services/api";
import PostCard from "../components/PostCard";
import FilterDrawer from "../components/FilterDrawer";
import "../styles/Browse.css";
import FilterBar from "../components/FilterBar";

function BrowsePage() {

    const [posts, setPosts] = useState([]);
    const [likedPosts, setLikedPosts] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);

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
            setPosts(res.data);
        } catch (err) {
            console.log(err);
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

            <FilterBar />

            <FilterDrawer
                open={drawerOpen}
                onToggle={handleDrawerToggle}
            >
                {likedPosts.map(post => (
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

                {posts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        liked={likedPostIds.includes(post.id)}
                    />
                ))}

            </div>

        </div>
    );
}

export default BrowsePage;