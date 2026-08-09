function FilterDrawer({ open, onToggle, children }) {
    return (
        <>
            <div className={`filter-drawer ${open ? " open" : ""}`}>

                <div className="drawer-content">

                    <div className="drawer-top">
                        <button>태그</button>
                        <button>위치</button>
                        <button>별점</button>
                    </div>

                    <div className="drawer-posts">
                        {children}
                    </div>

                </div>

            </div>

            <button
                className={`drawer-handle ${open ? "open" : ""}`}
                onClick={onToggle}
            >
                {open ? "◀" : "▶"}
            </button>
        </>
    );
}

export default FilterDrawer;