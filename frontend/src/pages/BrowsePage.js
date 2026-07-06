import { useEffect, useState } from "react";
import api from "../services/api";
import PostCard from "../components/PostCard";

function BrowsePage() {

    const [posts, setPosts] = useState([]);

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
        <div style={{padding:"30px"}}>

            <h2>둘러보기</h2>

            <div style={{
                display:"flex",
                flexWrap:"wrap",
                gap:"20px"
            }}>

                {posts.map(post=>(
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