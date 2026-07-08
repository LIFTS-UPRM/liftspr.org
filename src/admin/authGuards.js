const UPR_DOMAIN = 'upr.edu';
const PUERTO_RICO_BOUNDS = {
  minLat: 17.8,
  maxLat: 18.6,
  minLng: -68.1,
  maxLng: -65.0,
};

export function signupEmailError(email) {
  const domain = email.trim().toLowerCase().split('@').pop() || '';
  if (domain === UPR_DOMAIN || domain.endsWith(`.${UPR_DOMAIN}`)) return null;
  return 'Not able to create account. Use a UPR email ending in @upr.edu.';
}

export function isPuertoRicoCoordinate({ latitude, longitude }) {
  return latitude >= PUERTO_RICO_BOUNDS.minLat
    && latitude <= PUERTO_RICO_BOUNDS.maxLat
    && longitude >= PUERTO_RICO_BOUNDS.minLng
    && longitude <= PUERTO_RICO_BOUNDS.maxLng;
}

export function requestPuertoRicoLocation() {
  if (!navigator.geolocation) return Promise.resolve(false);

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve(isPuertoRicoCoordinate(coords)),
      () => resolve(false),
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  });
}
