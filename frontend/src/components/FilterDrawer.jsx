function FilterDrawer({ open, onToggle, children }) {
    return (
        <>
            <div className={`filter-drawer ${open ? " open" : ""}`}>

                <div className="drawer-content">

                    <div className="drawer-top">
                        <h2>좋아요한 여행</h2>
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
