import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortablePhoto({ photo, index, removePhoto }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: photo.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    textAlign: "center",
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <img
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        src={URL.createObjectURL(photo.file)}
        alt="preview"
        style={{
          width: "120px",
          height: "120px",
          objectFit: "cover",
          borderRadius: "10px",
          border: index === 0 ? "3px solid #4CAF50" : "1px solid #ccc",
          cursor: "grab",
        }}
      />

      {index === 0 && (
        <div
          style={{
            color: "#4CAF50",
            fontWeight: "bold",
            fontSize: "12px",
            marginTop: "5px",
          }}
        >
          대표사진
        </div>
      )}

      <button
        type="button"
        onClick={() => removePhoto(photo.id)}
      >
        삭제
      </button>
    </div>
  );
}

export default SortablePhoto;