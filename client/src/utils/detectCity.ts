// utils/detectCity.ts
type City = {
    name: string;
    lat: number;
    lng: number;
  };
  
  const cities: City[] = [
    { name: "جدة", lat: 21.492500, lng: 39.177570 },
    { name: "الرياض", lat: 24.774265, lng: 46.738586 },
    { name: "الدمام", lat: 26.425699, lng: 50.055164 },
    { name: "مكة المكرمة", lat: 21.422510, lng: 39.826168 },
    { name: "الطائف", lat: 21.437273, lng: 40.512714 },
  ];
  
  // --- Haversine formula ---
  function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  
  // --- Detect nearest city ---
  export function detectCityFromCoords(lat: number, lng: number): string {
    let nearestCity: City | null = null;
    let minDistance = Infinity;
  
    for (const city of cities) {
      const distance = haversine(lat, lng, city.lat, city.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }
  
    // Return empty string if no city is within ~50 km
    return minDistance <= 50 ? nearestCity?.name ?? "" : "";
  }
      