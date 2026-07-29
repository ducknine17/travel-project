function FilterBar({ likedMode = false }) {
    return (
        <div className="filter-bar">

            <button>태그</button>

            <button>위치</button>

            <button>별점</button>

            {likedMode && (
                <button>즐겨찾기</button>
            )}

        </div>
    );
}

export default FilterBar;