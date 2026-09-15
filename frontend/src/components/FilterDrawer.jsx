import Modal from "./Modal";
import { Icon } from "./Brand";

export default function FilterDrawer({ open, onToggle, children }) {
  return <>{open && <Modal className="liked-drawer" title="좋아요한 글" onClose={onToggle}><p className="drawer-intro">마음에 든 여행을, 수첩 한쪽에.</p><div className="drawer-posts">{children}</div></Modal>}<button type="button" className="drawer-handle" onClick={onToggle} aria-label="좋아요한 글 수첩 열기" aria-expanded={open}><Icon name="paw" size={22}/><Icon name="arrow" size={15}/><span>좋아요한 글</span></button></>;
}