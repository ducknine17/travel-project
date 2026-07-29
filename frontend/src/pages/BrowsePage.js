import { useEffect, useState } from "react";
import api from "../services/api";
import PostCard from "../components/PostCard";
import FilterDrawer from "../components/FilterDrawer";
import "../styles/Browse.css";
import FilterBar from "../components/FilterBar";

function BrowsePage() {

    const [posts, setPosts] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const res = await api.get("/load-post");
            setPosts(res.data);
        }
        catch(err){
            console.log(err);
        }
    }

    return (
        <div style={{ padding: "30px" }}>

            <h2>둘러보기</h2>

            <FilterBar />

            <FilterDrawer
                open={drawerOpen}
                onToggle={() => setDrawerOpen(!drawerOpen)}
            />

            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "20px"
            }}>

                {posts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                    />
                ))}

            </div>

        </div>
    );
}

export default BrowsePage;