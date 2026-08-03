import { useEffect } from "react";

function KakaoMap({ places = [] }) {
  useEffect(() => {
    window.kakao.maps.load(() => {
      const container = document.getElementById("map");

      const options = {
        center: new window.kakao.maps.LatLng(37.6317, 127.0775),
        level: 3,
      };

      const map = new window.kakao.maps.Map(container, options);
      const bounds = new window.kakao.maps.LatLngBounds();
      let markerCount = 0;

      places.forEach((place) => {
        const latitude = Number(place.lng);
        const longitude = Number(place.lat);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        const position = new window.kakao.maps.LatLng(latitude, longitude);
        new window.kakao.maps.Marker({ map, position, title: place.name });
        bounds.extend(position);
        markerCount += 1;
      });

      if (markerCount > 0) {
        map.setBounds(bounds);
      }
    });
  }, [places]);

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
