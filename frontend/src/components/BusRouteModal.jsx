import Modal from "./Modal";
import { Icon } from "./Brand";
import { BusIllustration } from "./TransitArt";

function numericOrder(value) {
  const order = Number(value);
  return Number.isFinite(order) ? order : null;
}

function nearestStopOrder(bus, stops) {
  const directOrder = numericOrder(bus.nodeOrder);
  if (directOrder != null) return directOrder;

  const latitude = Number(bus.latitude);
  const longitude = Number(bus.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  let nearest = null;
  let nearestDistance = Infinity;
  stops.forEach((stop, index) => {
    const stopLatitude = Number(stop.latitude);
    const stopLongitude = Number(stop.longitude);
    if (!Number.isFinite(stopLatitude) || !Number.isFinite(stopLongitude)) return;
    const distance = (latitude - stopLatitude) ** 2 + (longitude - stopLongitude) ** 2;
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = numericOrder(stop.nodeOrder) ?? index + 1;
    }
  });
  return nearest;
}

export default function BusRouteModal({ route, station, stops, buses, loading, error, onClose }) {
  const orderedStops = [...stops].sort((a, b) => (
    (numericOrder(a.nodeOrder) ?? Infinity) - (numericOrder(b.nodeOrder) ?? Infinity)
  ));
  const busesByOrder = new Map();
  buses.forEach((bus) => {
    const order = nearestStopOrder(bus, orderedStops);
    if (order == null) return;
    const key = String(order);
    busesByOrder.set(key, [...(busesByOrder.get(key) || []), bus]);
  });

  return <Modal title={`${route.routeName ?? "버스"}번 노선도`} className="bus-route-modal" onClose={onClose}>
    <div className="route-modal-summary">
      <span><Icon name="bus" size={18}/> 운행 차량 <strong>{buses.length}대</strong></span>
      <span>현재 위치는 30초마다 갱신됩니다.</span>
    </div>
    {route.startName && route.endName && <p className="route-direction">{route.startName} → {route.endName}</p>}
    {loading && <p role="status">노선과 차량 위치를 불러오는 중…</p>}
    {error && <p role="alert" className="notice">{error}</p>}
    {!loading && !orderedStops.length && <p className="status-message">표시할 노선 정류장 정보가 없습니다.</p>}
    {!!orderedStops.length && <ol className="route-stop-list" aria-label={`${route.routeName}번 정류장 순서`}>
      {orderedStops.map((stop, index) => {
        const order = numericOrder(stop.nodeOrder) ?? index + 1;
        const stopBuses = busesByOrder.get(String(order)) || [];
        const selected = String(stop.nodeId ?? "") === String(station.id ?? "")
          || (!stop.nodeId && stop.nodeName === station.name);
        return <li className={selected ? "selected-stop" : ""} key={`${stop.nodeId ?? stop.nodeName}-${order}`}>
          <span className="route-track" aria-hidden="true"><i/></span>
          <div className="route-stop-copy">
            <small>{order}번째 정류장</small>
            <strong>{stop.nodeName || "이름 없는 정류장"}</strong>
            {selected && <em>선택한 정류장</em>}
          </div>
          {!!stopBuses.length && <div className="route-bus-positions">
            {stopBuses.map((bus, busIndex) => {
              const lowFloor = bus.lowFloor === true || String(bus.vehicleType || "").includes("저상");
              return <span className={lowFloor ? "low-floor" : ""} key={bus.vehicleId || bus.vehicleNumber || busIndex}>
                <BusIllustration lowFloor={lowFloor}/>
                <b>{bus.vehicleNumber || `${route.routeName}번`}</b>
                <small>{lowFloor ? "저상버스 ♿" : "일반버스"}</small>
              </span>;
            })}
          </div>}
        </li>;
      })}
    </ol>}
  </Modal>;
}
