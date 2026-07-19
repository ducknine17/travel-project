import { useEffect } from "react";

function KakaoMap() {
  useEffect(() => {
    window.kakao.maps.load(() => {
      const container = document.getElementById("map");

      const options = {
        center: new window.kakao.maps.LatLng(37.6317, 127.0775),
        level: 3,
      };

      new window.kakao.maps.Map(container, options);
    });
  }, []);

  return (
    <div
      id="map"
      style={{
        width: "100%",
        height: "500px",
      }}
    />
  );
}

export default KakaoMap;