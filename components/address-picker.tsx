"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  Check,
  Loader2,
  LocateFixed,
  MapPin,
  Search,
} from "lucide-react";
import {
  loadGoogleMaps,
  type GooglePlaceResult,
} from "@/lib/google-maps";
import { cn } from "@/lib/utils";

const AddressMapPreview = dynamic(
  () => import("@/components/address-map-preview"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[200px] place-items-center rounded-xl border border-brand-500/10 bg-ink-850 text-xs text-slate-500">
        Loading map preview…
      </div>
    ),
  },
);

const GOOGLE_MAPS_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || "";

export type AddressValues = {
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: string;
  lng: string;
};

type AddressErrors = Partial<Record<keyof AddressValues, string>>;

type NominatimPlace = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  address?: Record<string, string>;
};

type Suggestion =
  | {
      key: string;
      label: string;
      secondary: string;
      source: "google";
      placeId: string;
    }
  | {
      key: string;
      label: string;
      secondary: string;
      source: "osm";
      place: NominatimPlace;
    };

function AddressField({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="field-error" role="alert">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function safeCoord(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function AddressPicker({
  values,
  errors,
  onChange,
}: {
  values: AddressValues;
  errors?: AddressErrors;
  onChange: (patch: Partial<AddressValues>) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searchError, setSearchError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setActive(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const searchOpenStreetMap = useCallback(async (input: string) => {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");
    url.searchParams.set("q", input);

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Address search failed.");
    const places = (await response.json()) as NominatimPlace[];

    return places.map<Suggestion>((place) => ({
      key: `osm-${place.place_id}`,
      label: place.name || place.display_name.split(",")[0]?.trim() || place.display_name,
      secondary: place.display_name,
      source: "osm",
      place,
    }));
  }, []);

  const searchGoogle = useCallback(async (input: string) => {
    const google = await loadGoogleMaps(GOOGLE_MAPS_KEY);
    return new Promise<Suggestion[]>((resolve, reject) => {
      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        { input, types: ["address"] },
        (predictions, status) => {
          if (status !== "OK" && status !== "ZERO_RESULTS") {
            reject(new Error(status));
            return;
          }
          resolve(
            (predictions ?? []).map<Suggestion>((prediction) => ({
              key: `google-${prediction.place_id}`,
              label:
                prediction.structured_formatting?.main_text ||
                prediction.description,
              secondary:
                prediction.structured_formatting?.secondary_text ||
                prediction.description,
              source: "google",
              placeId: prediction.place_id,
            })),
          );
        },
      );
    });
  }, []);

  const runSearch = useCallback(
    async (input: string) => {
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      setSearching(true);
      setSearchError("");

      try {
        let next: Suggestion[] = [];
        if (GOOGLE_MAPS_KEY) {
          try {
            next = await searchGoogle(input);
          } catch {
            next = await searchOpenStreetMap(input);
          }
        } else {
          next = await searchOpenStreetMap(input);
        }
        if (requestRef.current !== requestId) return;
        setSuggestions(next);
        setActiveIndex(next.length > 0 ? 0 : -1);
      } catch {
        if (requestRef.current !== requestId) return;
        setSuggestions([]);
        setActiveIndex(-1);
        setSearchError(
          "Address search is unavailable right now. You can enter the address manually.",
        );
      } finally {
        if (requestRef.current === requestId) setSearching(false);
      }
    },
    [searchGoogle, searchOpenStreetMap],
  );

  useEffect(() => {
    if (!active) return;
    const input = query.trim();
    if (input.length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    const timer = window.setTimeout(() => {
      void runSearch(input);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [active, query, runSearch]);

  function applyGooglePlace(place: GooglePlaceResult, fallbackLabel: string) {
    const components = place.address_components ?? [];
    const component = (type: string) =>
      components.find((entry) => entry.types.includes(type))?.long_name ?? "";

    const street = [component("street_number"), component("route")]
      .filter(Boolean)
      .join(" ");
    const address =
      street ||
      component("premise") ||
      place.formatted_address?.split(",")[0]?.trim() ||
      place.name ||
      fallbackLabel.split(",")[0]?.trim() ||
      values.address;
    const city =
      component("locality") ||
      component("postal_town") ||
      component("sublocality_level_1") ||
      component("administrative_area_level_2") ||
      values.city;
    const state = component("administrative_area_level_1") || values.state;
    const pincode = component("postal_code") || values.pincode;
    const location = place.geometry?.location;

    onChange({
      address,
      city,
      state,
      pincode,
      lat: location ? location.lat.toFixed(6) : values.lat,
      lng: location ? location.lng.toFixed(6) : values.lng,
    });
  }

  function applyOpenStreetMapPlace(place: NominatimPlace) {
    const details = place.address ?? {};
    const address =
      [details.house_number, details.road].filter(Boolean).join(" ") ||
      details.building ||
      place.name ||
      place.display_name.split(",")[0]?.trim() ||
      values.address;
    const city =
      details.city ||
      details.town ||
      details.village ||
      details.municipality ||
      details.suburb ||
      details.neighbourhood ||
      details.county ||
      values.city;
    const state =
      details.state || details["ISO3166-2-lvl4"] || values.state;
    const pincode = details.postcode || values.pincode;
    const lat = safeCoord(place.lat);
    const lng = safeCoord(place.lon);

    onChange({
      address,
      city,
      state,
      pincode,
      lat: lat != null ? lat.toFixed(6) : values.lat,
      lng: lng != null ? lng.toFixed(6) : values.lng,
    });
  }

  async function selectSuggestion(suggestion: Suggestion) {
    setActive(false);
    setActiveIndex(-1);
    setSuggestions([]);
    setSearchError("");
    setQuery(suggestion.label);

    if (suggestion.source === "osm") {
      applyOpenStreetMapPlace(suggestion.place);
      return;
    }

    setResolving(true);
    try {
      const google = await loadGoogleMaps(GOOGLE_MAPS_KEY);
      const service = new google.maps.places.PlacesService(
        document.createElement("div"),
      );
      service.getDetails(
        {
          placeId: suggestion.placeId,
          fields: [
            "address_components",
            "formatted_address",
            "geometry",
            "name",
          ],
        },
        (place) => {
          setResolving(false);
          if (!place) {
            setSearchError(
              "We could not load that address. Try another result or enter it manually.",
            );
            return;
          }
          applyGooglePlace(place, suggestion.label);
        },
      );
    } catch {
      setResolving(false);
      setSearchError(
        "Address details are unavailable. You can enter the address manually.",
      );
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!active) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        suggestions.length === 0 ? -1 : (index + 1) % suggestions.length,
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        suggestions.length === 0
          ? -1
          : (index - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }
    if (event.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault();
      void selectSuggestion(suggestions[activeIndex]);
      return;
    }
    if (event.key === "Escape") {
      setActive(false);
      setActiveIndex(-1);
    }
  }

  async function useCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setSearchError("Location is not supported by this browser. Search instead.");
      return;
    }

    setLocating(true);
    setSearchError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        onChange({ lat: lat.toFixed(6), lng: lng.toFixed(6) });

        try {
          if (GOOGLE_MAPS_KEY) {
            const google = await loadGoogleMaps(GOOGLE_MAPS_KEY);
            await new Promise<void>((resolve) => {
              new google.maps.Geocoder().geocode(
                { location: { lat, lng } },
                (results) => {
                  if (results?.[0]) {
                    applyGooglePlace(results[0], "Current location");
                  } else {
                    setSearchError(
                      "We captured your coordinates, but could not resolve the address.",
                    );
                  }
                  resolve();
                },
              );
            });
          } else {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`,
              { headers: { Accept: "application/json" } },
            );
            if (!response.ok) throw new Error("Reverse geocoding failed.");
            applyOpenStreetMapPlace(
              (await response.json()) as NominatimPlace,
            );
          }
          setQuery("Current location");
        } catch {
          setSearchError(
            "We captured your coordinates, but could not resolve the address. Add the address details manually.",
          );
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setSearchError(
          "Location permission was not granted. You can search for the address instead.",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  const lat = safeCoord(values.lat);
  const lng = safeCoord(values.lng);
  const hasPin =
    lat != null &&
    lng != null &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180;

  const previewLabel = useMemo(
    () =>
      [values.address, values.city, values.state]
        .filter(Boolean)
        .join(", ")
        .trim(),
    [values.address, values.city, values.state],
  );

  const showDropdown = active && query.trim().length >= 3;

  return (
    <div ref={rootRef} className="space-y-4">
      <div>
        <label className="label" htmlFor="address-search">
          Find your address
        </label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="address-search"
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(true);
                setSearchError("");
              }}
              onFocus={() => {
                if (query.trim().length >= 3) setActive(true);
              }}
              onKeyDown={handleKeyDown}
              className="input input-icon pr-10"
              placeholder="Start typing a street, area or landmark"
              autoComplete="off"
              role="combobox"
              aria-expanded={showDropdown}
              aria-controls="address-suggestions"
              aria-autocomplete="list"
              aria-activedescendant={
                activeIndex >= 0 && suggestions[activeIndex]
                  ? `address-suggestion-${suggestions[activeIndex].key}`
                  : undefined
              }
            />
            {searching || resolving ? (
              <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-500" />
            ) : null}

            {showDropdown ? (
              <div
                id="address-suggestions"
                role="listbox"
                className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-brand-500/15 bg-ink-900 shadow-panel"
              >
                {searching && suggestions.length === 0 ? (
                  <p className="flex items-center gap-2 px-3.5 py-3 text-xs text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Searching addresses…
                  </p>
                ) : null}
                {!searching && suggestions.length === 0 ? (
                  <p className="px-3.5 py-3 text-xs leading-relaxed text-slate-500">
                    No matches found. Try a nearby landmark, or fill in the fields
                    below.
                  </p>
                ) : null}
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.key}
                    id={`address-suggestion-${suggestion.key}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => void selectSuggestion(suggestion)}
                    className={cn(
                      "flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition",
                      index === activeIndex
                        ? "bg-brand-500/[0.08]"
                        : "hover:bg-brand-500/[0.05]",
                    )}
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-brand-900">
                        {suggestion.label}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {suggestion.secondary}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void useCurrentLocation()}
            className="btn-secondary shrink-0 whitespace-nowrap !px-3"
            disabled={locating}
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Use current location</span>
          </button>
        </div>
        {searchError ? (
          <p className="field-error" role="alert">
            <AlertCircle className="h-3.5 w-3.5" />
            {searchError}
          </p>
        ) : (
          <p className="mt-1.5 text-[11px] text-slate-500">
            Search fills the address fields and places a pin on the map. You can
            edit any field afterwards.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-6">
        <AddressField
          className="sm:col-span-6"
          label="Street address"
          htmlFor="address"
          error={errors?.address}
        >
          <input
            id="address"
            className="input"
            value={values.address}
            onChange={(event) => onChange({ address: event.target.value })}
            placeholder="12, FC Road, Shivajinagar"
            aria-invalid={Boolean(errors?.address)}
            required
          />
        </AddressField>
        <AddressField
          className="sm:col-span-2"
          label="City"
          htmlFor="city"
          error={errors?.city}
        >
          <input
            id="city"
            className="input"
            value={values.city}
            onChange={(event) => onChange({ city: event.target.value })}
            aria-invalid={Boolean(errors?.city)}
            required
          />
        </AddressField>
        <AddressField
          className="sm:col-span-2"
          label="State"
          htmlFor="state"
          error={errors?.state}
        >
          <input
            id="state"
            className="input"
            value={values.state}
            onChange={(event) => onChange({ state: event.target.value })}
            aria-invalid={Boolean(errors?.state)}
          />
        </AddressField>
        <AddressField
          className="sm:col-span-2"
          label="Pincode"
          htmlFor="pincode"
          error={errors?.pincode}
        >
          <input
            id="pincode"
            className="input"
            value={values.pincode}
            onChange={(event) => onChange({ pincode: event.target.value })}
            inputMode="numeric"
            aria-invalid={Boolean(errors?.pincode)}
            required
          />
        </AddressField>
      </div>

      <details className="rounded-xl border border-brand-500/10 bg-ink-850/60 px-3.5 py-2.5">
        <summary className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-brand-700">
          <Check
            className={cn(
              "h-3.5 w-3.5",
              hasPin ? "text-emerald-500" : "text-slate-500",
            )}
          />
          {hasPin
            ? `Location pin: ${values.lat}, ${values.lng}`
            : "No location pin set yet"}
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <AddressField label="Latitude" htmlFor="lat" error={errors?.lat}>
            <input
              id="lat"
              className="input"
              value={values.lat}
              onChange={(event) => onChange({ lat: event.target.value })}
              inputMode="decimal"
              aria-invalid={Boolean(errors?.lat)}
              required
            />
          </AddressField>
          <AddressField label="Longitude" htmlFor="lng" error={errors?.lng}>
            <input
              id="lng"
              className="input"
              value={values.lng}
              onChange={(event) => onChange({ lng: event.target.value })}
              inputMode="decimal"
              aria-invalid={Boolean(errors?.lng)}
              required
            />
          </AddressField>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          Coordinates place your centre on the comparison and directions maps.
          Search or use your current location to set them automatically.
        </p>
      </details>

      {hasPin ? (
        <div>
          <p className="mb-1.5 text-[11px] font-medium text-slate-500">
            Map preview
          </p>
          <AddressMapPreview lat={lat} lng={lng} label={previewLabel} />
        </div>
      ) : null}
    </div>
  );
}
