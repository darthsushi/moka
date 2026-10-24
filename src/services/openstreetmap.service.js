import { not } from '@/helpers/ramda.helpers';

const fetchOpenStreetMap = async (latitude, longitude) => {
    try {
      const nominatimURL = new URL('https://nominatim.openstreetmap.org/reverse');
      nominatimURL.search = new URLSearchParams({
        lat: latitude,
        lon: longitude,
        format: 'jsonv2',
        'accept-language': 'es-MX'
      });

      const nominatimResponse = await fetch(nominatimURL);

      if (not(nominatimResponse.ok)) {
        throw new Error(`Error HTTP: ${nominatimResponse.status}`);
      }

      const {
        address: {
          ["ISO3166-2-lvl4"]: isoCode,
          county,
          town,
          city,
          country,
          country_code,
          municipality,
          neighbourhood,
          postcode,
          region,
          road,
          state,
          village
        },
        display_name
      } = await nominatimResponse.json();

      return {
        isoCode,
        display_name,
        country_code,
        neighbourhood,
        postcode,
        road,
        country,
        state: state || region,
        city: city || town || village || municipality || county,
      }
    } catch {
      return {};
    }
  };

  export { fetchOpenStreetMap };
  