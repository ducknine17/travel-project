import { getImageSrc } from "../utils/postUtils";

// The opt-in design preview displays crops from the user's supplied reference.
// The source file stays intact; live posts always use their original photographs.
const frames = [[100,253,443,239],[573,253,442,239],[1045,253,442,239],[100,595,443,242],[573,595,442,242],[1045,595,442,242]];
export default function TravelPhoto({ image, alt = "", className = "", onError, loading }) {
  const isPreview = process.env.NODE_ENV === "development" && process.env.REACT_APP_DESIGN_PREVIEW === "true" && String(image).startsWith("preview-photo:");
  if (isPreview) {
    const [x,y,width,height] = frames[Number(image.split(":")[1])] || frames[0];
    return <span className={`travel-photo reference-photo ${className}`}><img src="/assets/bf/reference-travel.png" alt={alt} style={{width:`${1586/width*100}%`,height:`${992/height*100}%`,left:`${-x/width*100}%`,top:`${-y/height*100}%`,maxWidth:"none",position:"absolute",objectFit:"fill"}}/></span>;
  }
  return <span className={`travel-photo ${className}`}><img src={getImageSrc(image)} alt={alt} onError={onError} loading={loading}/></span>;
}
