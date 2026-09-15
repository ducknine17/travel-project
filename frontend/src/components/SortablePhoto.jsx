import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Icon } from "./Brand";

export default function SortablePhoto({photo,index,isCover,removePhoto}) {
  const {attributes,listeners,setNodeRef,transform,transition} = useSortable({id:photo.id});
  const [url,setUrl] = useState("");
  useEffect(() => { const next = URL.createObjectURL(photo.file); setUrl(next); return () => URL.revokeObjectURL(next); },[photo.file]);
  return <div className="uploaded-photo" ref={setNodeRef} style={{transform:CSS.Transform.toString(transform),transition}}><button type="button" className="photo-drag" {...attributes} {...listeners} aria-label={`사진 ${index+1} 순서 바꾸기`}><img src={url} alt={`여행 사진 ${index+1} 미리보기`}/></button>{isCover && <small>대표 사진</small>}<button type="button" className="photo-remove" onClick={() => removePhoto(photo.id)} aria-label={`사진 ${index+1} 삭제`}><Icon name="close" size={15}/></button></div>;
}