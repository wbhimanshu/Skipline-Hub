export type GoogleLatLng = { lat: number; lng: number };

export type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type GooglePlaceResult = {
  address_components?: GoogleAddressComponent[];
  formatted_address?: string;
  name?: string;
  geometry?: { location: GoogleLatLng };
};

export type GooglePlacePrediction = {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
};

export type GoogleMapInstance = {
  setCenter: (position: GoogleLatLng) => void;
  setZoom: (zoom: number) => void;
};

export type GoogleMarkerInstance = {
  setMap: (map: GoogleMapInstance | null) => void;
  addListener: (event: string, handler: () => void) => { remove: () => void };
};

export type GoogleInfoWindowInstance = {
  setContent: (content: string) => void;
  open: (options: { anchor: GoogleMarkerInstance; map: GoogleMapInstance }) => void;
  close: () => void;
};

export type GoogleAutocompleteService = {
  getPlacePredictions: (
    request: {
      input: string;
      types?: string[];
      componentRestrictions?: { country: string | string[] };
    },
    callback: (
      predictions: GooglePlacePrediction[] | null,
      status: string,
    ) => void,
  ) => void;
};

export type GooglePlacesService = {
  getDetails: (
    request: { placeId: string; fields: string[] },
    callback: (place: GooglePlaceResult | null, status: string) => void,
  ) => void;
};

export type GoogleGeocoder = {
  geocode: (
    request: { location: GoogleLatLng },
    callback: (results: GooglePlaceResult[] | null, status: string) => void,
  ) => void;
};

export type GoogleMapsApi = {
  maps: {
    Map: new (
      element: HTMLElement,
      options: Record<string, unknown>,
    ) => GoogleMapInstance;
    Marker: new (options: Record<string, unknown>) => GoogleMarkerInstance;
    InfoWindow: new (
      options: Record<string, unknown>,
    ) => GoogleInfoWindowInstance;
    Geocoder: new () => GoogleGeocoder;
    SymbolPath: { CIRCLE: number };
    places: {
      AutocompleteService: new () => GoogleAutocompleteService;
      PlacesService: new (container: HTMLElement) => GooglePlacesService;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsApi;
  }
}

let loaderPromise: Promise<GoogleMapsApi> | null = null;

export function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps) return Promise.resolve(window.google);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<GoogleMapsApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps) resolve(window.google);
      else reject(new Error("Google Maps did not initialise."));
    };
    script.onerror = () => reject(new Error("Google Maps could not be loaded."));
    document.head.appendChild(script);
  });

  return loaderPromise;
}
