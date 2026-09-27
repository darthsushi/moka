import { supabase } from './supabase';
import { applyListFilter, normalizeFaceCounts, serializeDayRange } from '@/helpers/utilities.helpers';

const FULL_PLACEMENT_CODE_PATTERN = /^(?:[A-Z]{2}-[A-Z0-9]{1,3}|OTR)-\d+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
const SUBDIVISION_CODE_PATTERN = /^[A-Z]{2}-[A-Z0-9]{1,3}$/;

const DEFAULT_PUBLIC_PAGE_SIZE = 24;
const MAX_PUBLIC_PAGE_SIZE = 100;
const MAX_PUBLIC_SEARCH_LENGTH = 160;
const MAX_PUBLIC_SEARCH_TERMS = 8;
const MIN_PUBLIC_SEARCH_TERM_LENGTH = 2;

const PUBLIC_PLACEMENT_SELECT = `
  id,
  code,
  type,
  latitude,
  longitude,
  structure_height,
  face_count,
  country,
  country_code,
  state,
  subdivision_code,
  city,
  display_name,
  created_at,
  faces:placement_faces (
    id,
    images,
    day_range,
    period_price
  )
`;

const PLACEMENT_DETAIL_SELECT = `
  id,
  code,
  user_id,
  type,
  latitude,
  longitude,
  structure_height,
  face_count,
  country,
  state,
  city,
  display_name,
  description,
  visibility,
  owner_status,
  review_status,
  faces:placement_faces (
    id,
    images,
    display_width,
    display_height,
    day_range,
    period_price,
    created_at
  )
`;

const toArray = (value) => {
  if (value instanceof Set) return [...value];
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === '' || value === 'all') return [];

  return [value];
};

const uniqueBy = (items, getKey) => {
  const seen = new Set();

  return items.filter((item) => {
    const key = getKey(item);

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

const toPostgrestLiteral = (value) => {
  const sanitizedValue = String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');

  return `"${sanitizedValue}"`;
};

const normalizePublicPageSize = (pageSize) => {
  const normalizedPageSize = Number(pageSize ?? DEFAULT_PUBLIC_PAGE_SIZE);

  if (
    !Number.isInteger(normalizedPageSize) ||
    normalizedPageSize < 1 ||
    normalizedPageSize > MAX_PUBLIC_PAGE_SIZE
  ) {
    throw new Error('INVALID_PUBLIC_PAGE_SIZE');
  }

  return normalizedPageSize;
};

const normalizePublicCursor = (cursor) => {
  if (cursor === null || cursor === undefined) return null;

  if (typeof cursor !== 'object' || Array.isArray(cursor)) {
    throw new Error('INVALID_PUBLIC_CURSOR');
  }

  const createdAt = cursor.createdAt ?? cursor.created_at;
  const id = cursor.id;

  if (
    typeof createdAt !== 'string' ||
    Number.isNaN(Date.parse(createdAt)) ||
    typeof id !== 'string' ||
    !UUID_PATTERN.test(id)
  ) {
    throw new Error('INVALID_PUBLIC_CURSOR');
  }

  return { createdAt, id };
};

const normalizePublicSearch = (search) => {
  if (search === null || search === undefined || search === '') {
    return {
      exactCode: null,
      hasSearch: false,
      isTooShort: false,
      terms: []
    };
  }

  if (typeof search !== 'string') {
    throw new Error('INVALID_PUBLIC_SEARCH');
  }

  const trimmedSearch = search.trim();

  if (!trimmedSearch) {
    return {
      exactCode: null,
      hasSearch: false,
      isTooShort: false,
      terms: []
    };
  }

  if (trimmedSearch.length > MAX_PUBLIC_SEARCH_LENGTH) {
    throw new Error('PUBLIC_SEARCH_TOO_LONG');
  }

  const exactCode = trimmedSearch.toUpperCase();

  if (FULL_PLACEMENT_CODE_PATTERN.test(exactCode)) {
    return {
      exactCode,
      hasSearch: true,
      isTooShort: false,
      terms: []
    };
  }

  // Mirrors private.normalize_placement_search_value() in PostgreSQL:
  // lowercase + remove accents + replace punctuation with spaces.
  const normalizedSearch = trimmedSearch
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const allTerms = normalizedSearch ? normalizedSearch.split(' ') : [];
  const terms = [...new Set(
    allTerms.filter(term => term.length >= MIN_PUBLIC_SEARCH_TERM_LENGTH)
  )].slice(0, MAX_PUBLIC_SEARCH_TERMS);

  return {
    exactCode: null,
    hasSearch: true,
    isTooShort: terms.length === 0,
    terms
  };
};

const normalizeCountryCodes = (country) => {
  const countryCodes = toArray(country).map((item) => {
    const rawCode = typeof item === 'string'
      ? item
      : item?.country_code;

    const countryCode = rawCode?.trim().toUpperCase();

    if (!countryCode || !COUNTRY_CODE_PATTERN.test(countryCode)) {
      throw new Error('INVALID_PUBLIC_COUNTRY_FILTER');
    }

    return countryCode;
  });

  return [...new Set(countryCodes)];
};

const normalizeStateScopes = (state) => {
  const scopes = toArray(state).map((item) => {
    if (typeof item === 'string') {
      const subdivisionCode = item.trim().toUpperCase();

      if (!SUBDIVISION_CODE_PATTERN.test(subdivisionCode)) {
        throw new Error('INVALID_PUBLIC_STATE_FILTER');
      }

      return {
        countryCode: subdivisionCode.slice(0, 2),
        subdivisionCode,
        state: null
      };
    }

    const countryCode = item?.country_code?.trim().toUpperCase();
    const subdivisionCode = item?.subdivision_code?.trim().toUpperCase() || null;
    const stateName = (item?.value ?? item?.label ?? item?.state)?.trim() || null;

    if (!countryCode || !COUNTRY_CODE_PATTERN.test(countryCode)) {
      throw new Error('INVALID_PUBLIC_STATE_FILTER');
    }

    if (subdivisionCode && !SUBDIVISION_CODE_PATTERN.test(subdivisionCode)) {
      throw new Error('INVALID_PUBLIC_STATE_FILTER');
    }

    if (!subdivisionCode && !stateName) {
      throw new Error('INVALID_PUBLIC_STATE_FILTER');
    }

    return {
      countryCode,
      subdivisionCode,
      state: stateName
    };
  });

  return uniqueBy(
    scopes,
    scope => `${scope.countryCode}|${scope.subdivisionCode ?? ''}|${scope.state ?? ''}`
  );
};

const normalizeCityScopes = (city) => {
  const scopes = toArray(city).map((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      throw new Error('INVALID_PUBLIC_CITY_FILTER');
    }

    const countryCode = item.country_code?.trim().toUpperCase();
    const subdivisionCode = item.subdivision_code?.trim().toUpperCase() || null;
    const stateName = item.state?.trim() || null;
    const cityName = (item.value ?? item.label ?? item.city)?.trim();

    if (!countryCode || !COUNTRY_CODE_PATTERN.test(countryCode) || !cityName) {
      throw new Error('INVALID_PUBLIC_CITY_FILTER');
    }

    if (subdivisionCode && !SUBDIVISION_CODE_PATTERN.test(subdivisionCode)) {
      throw new Error('INVALID_PUBLIC_CITY_FILTER');
    }

    if (!subdivisionCode && !stateName) {
      throw new Error('INVALID_PUBLIC_CITY_FILTER');
    }

    return {
      countryCode,
      subdivisionCode,
      state: stateName,
      city: cityName
    };
  });

  return uniqueBy(
    scopes,
    scope => `${scope.countryCode}|${scope.subdivisionCode ?? ''}|${scope.state ?? ''}|${scope.city}`
  );
};

const normalizePublicMapFilters = (filters = {}) => {
  const {
    search = '',
    country = null,
    state = null,
    city = null,
    type = null
  } = filters;

  const normalizedSearch = normalizePublicSearch(search);

  const types = [
    ...new Set(
      toArray(type)
        .map(item => {
          if (typeof item === 'string') {
            return item.trim();
          }

          return item?.value ?? item?.id ?? null;
        })
        .filter(Boolean)
    )
  ];

  const stateScopes = normalizeStateScopes(state).map(scope => ({
    country_code: scope.countryCode,
    subdivision_code: scope.subdivisionCode,
    state: scope.state
  }));

  const cityScopes = normalizeCityScopes(city).map(scope => ({
    country_code: scope.countryCode,
    subdivision_code: scope.subdivisionCode,
    state: scope.state,
    city: scope.city
  }));

  return {
    isTooShort: normalizedSearch.isTooShort,
    exactCode: normalizedSearch.exactCode,
    searchTerms: normalizedSearch.terms,
    countryCodes: normalizeCountryCodes(country),
    stateScopes,
    cityScopes,
    types
  };
};

const normalizePublicViewport = (viewport) => {
  if (!viewport) return null;

  const south = Number(viewport.south);
  const west = Number(viewport.west);
  const north = Number(viewport.north);
  const east = Number(viewport.east);

  if (
    !Number.isFinite(south) ||
    !Number.isFinite(west) ||
    !Number.isFinite(north) ||
    !Number.isFinite(east)
  ) {
    throw new Error('INVALID_PUBLIC_VIEWPORT');
  }

  if (
    south < -90 ||
    south > 90 ||
    north < -90 ||
    north > 90 ||
    south >= north
  ) {
    throw new Error('INVALID_PUBLIC_VIEWPORT');
  }

  if (
    west < -180 ||
    west > 180 ||
    east < -180 ||
    east > 180 ||
    west === east
  ) {
    throw new Error('INVALID_PUBLIC_VIEWPORT');
  }

  return {
    south,
    west,
    north,
    east
  };
};

const applyStateScopes = (query, state) => {
  const scopes = normalizeStateScopes(state);

  if (!scopes.length) return query;

  const conditions = scopes.map((scope) => {
    const countryCondition = `country_code.eq.${toPostgrestLiteral(scope.countryCode)}`;

    if (scope.subdivisionCode) {
      return `and(${countryCondition},subdivision_code.eq.${toPostgrestLiteral(scope.subdivisionCode)})`;
    }

    return `and(${countryCondition},subdivision_code.is.null,state.eq.${toPostgrestLiteral(scope.state)})`;
  });

  return query.or(conditions.join(','));
};

const applyCityScopes = (query, city) => {
  const scopes = normalizeCityScopes(city);

  if (!scopes.length) return query;

  const conditions = scopes.map((scope) => {
    const conditionsForCity = [
      `country_code.eq.${toPostgrestLiteral(scope.countryCode)}`,
      `city.eq.${toPostgrestLiteral(scope.city)}`
    ];

    if (scope.subdivisionCode) {
      conditionsForCity.push(
        `subdivision_code.eq.${toPostgrestLiteral(scope.subdivisionCode)}`
      );
    } else {
      conditionsForCity.push(
        'subdivision_code.is.null',
        `state.eq.${toPostgrestLiteral(scope.state)}`
      );
    }

    return `and(${conditionsForCity.join(',')})`;
  });

  return query.or(conditions.join(','));
};

const applyPublicCursor = (query, cursor) => {
  const normalizedCursor = normalizePublicCursor(cursor);

  if (!normalizedCursor) return query;

  const createdAt = toPostgrestLiteral(normalizedCursor.createdAt);
  const id = toPostgrestLiteral(normalizedCursor.id);

  return query.or(
    `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`
  );
};

const toPublicPlacement = (placement) => ({
  ...placement,

  // Temporary compatibility layer for the current Home card in main.
  // The persisted `location` JSON is deprecated and no longer stored.
  location: {
    country: placement.country,
    state: placement.state,
    city: placement.city,
    display_name: placement.display_name
  }
});

const getPublicPlacementPageInView = async ({
  pageSize,
  cursor,
  filters,
  viewport
}) => {
  const normalizedPageSize =
    normalizePublicPageSize(pageSize);

  const normalizedCursor =
    normalizePublicCursor(cursor);

  const normalizedViewport =
    normalizePublicViewport(viewport);

  const normalizedFilters =
    normalizePublicMapFilters(filters);

  if (normalizedFilters.isTooShort) {
    return {
      placements: [],
      hasMore: false,
      nextCursor: null,
      pageSize: normalizedPageSize
    };
  }

  const {
    exactCode,
    searchTerms,
    countryCodes,
    stateScopes,
    cityScopes,
    types
  } = normalizedFilters;

  const {
    data: pageRows,
    error: pageError
  } = await supabase.rpc(
    'get_public_placement_page_in_view',
    {
      p_south: normalizedViewport.south,
      p_west: normalizedViewport.west,
      p_north: normalizedViewport.north,
      p_east: normalizedViewport.east,

      // Pedimos uno extra para saber si existe
      // una página posterior.
      p_limit: normalizedPageSize + 1,

      p_cursor_created_at:
        normalizedCursor?.createdAt ?? null,

      p_cursor_id:
        normalizedCursor?.id ?? null,

      p_exact_code: exactCode,
      p_search_terms: searchTerms,
      p_country_codes: countryCodes,
      p_state_scopes: stateScopes,
      p_city_scopes: cityScopes,
      p_types: types
    }
  );

  if (pageError) throw pageError;

  const rows = pageRows ?? [];

  const hasMore =
    rows.length > normalizedPageSize;

  const visibleRows = hasMore
    ? rows.slice(0, normalizedPageSize)
    : rows;

  if (visibleRows.length === 0) {
    return {
      placements: [],
      hasMore: false,
      nextCursor: null,
      pageSize: normalizedPageSize
    };
  }

  const placementIds =
    visibleRows.map(({ id }) => id);

  /*
   * Ahora obtenemos únicamente los placements
   * que necesitamos para las Cards.
   *
   * Esta consulta sí trae faces/images.
   */
  const {
    data: placements,
    error: placementsError
  } = await supabase
    .from('placements')
    .select(PUBLIC_PLACEMENT_SELECT)
    .eq('visibility', 'public')
    .eq('owner_status', 'active')
    .eq('review_status', 'approved')
    .in('id', placementIds);

  if (placementsError) {
    throw placementsError;
  }

  /*
   * .in() no garantiza el mismo orden que
   * nuestro RPC, así que lo reconstruimos.
   */
  const placementsById = new Map(
    (placements ?? []).map(placement => [
      placement.id,
      placement
    ])
  );

  const orderedPlacements = visibleRows
    .map(({ id }) => placementsById.get(id))
    .filter(Boolean)
    .map(toPublicPlacement);

  const lastPlacement =
    visibleRows.at(-1);

  return {
    placements: orderedPlacements,
    hasMore,

    nextCursor:
      hasMore && lastPlacement
        ? {
            createdAt:
              lastPlacement.created_at,

            id:
              lastPlacement.id
          }
        : null,

    pageSize: normalizedPageSize
  };
};

export const placementsService = {
  async getPlacementDetails({ code, id, shareToken }) {
    if (id || shareToken) {
      if (!UUID_PATTERN.test(id ?? '') || !UUID_PATTERN.test(shareToken ?? '')) {
        return null;
      }

      const { data, error } = await supabase.rpc('get_unlisted_placement', {
        p_placement_id: id,
        p_share_token: shareToken
      });

      if (error) throw error;
      if (!data?.placement) return null;

      return { ...data.placement, faces: data.faces ?? [] };
    }

    if (!FULL_PLACEMENT_CODE_PATTERN.test(code?.toUpperCase() ?? '')) {
      return null;
    }

    // RLS exposes published public placements to everyone and unpublished
    // placements only to their owner (or the roles authorized by the database).
    const { data, error } = await supabase
      .from('placements')
      .select(PLACEMENT_DETAIL_SELECT)
      .eq('code', code.toUpperCase())
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createPlacement(formattedData, userId) {
    const { faces, ...placementData } = formattedData;

    // TODO: Remove all LOGS:
    console.log(placementData)

    const { data: placement, error: placementError } = await supabase
      .from('placements')
      .insert({
        ...placementData,
        user_id: userId
      })
      .select()
      .single();

    if (placementError) throw placementError;

    const facesToInsert = faces.map(face => ({
      ...face,
      day_range: serializeDayRange(face.day_range),
      placement_id: placement.id 
    }));

    const { data: createdFaces, error: facesError } = await supabase
      .from('placement_faces')
      .insert(facesToInsert)
      .select();

    if (facesError) throw facesError;

    return {
      placement: {
        ...placement,
        face_count: createdFaces.length
      },
      faces: createdFaces
    };
  },

  async getPublicPlacementFilterOptions() {
    const { data, error } = await supabase.rpc(
      'get_public_placement_filter_options'
    );

    if (error) throw error;

    return {
      countries: data?.countries ?? [],
      states: data?.states ?? [],
      cities: data?.cities ?? [],
      types: data?.types ?? []
    };
  },

  async getPublicPlacements({
    pageSize = DEFAULT_PUBLIC_PAGE_SIZE,
    cursor = null,
    filters = {},
    viewport = null
  } = {}) {
    if (viewport) {
      return getPublicPlacementPageInView({
        pageSize,
        cursor,
        filters,
        viewport
      });
    }

    const normalizedPageSize = normalizePublicPageSize(pageSize);
    const {
      search = '',
      country = null,
      state = null,
      city = null,
      type = null
    } = filters;

    const normalizedSearch = normalizePublicSearch(search);

    if (normalizedSearch.isTooShort) {
      return {
        placements: [],
        hasMore: false,
        nextCursor: null,
        pageSize: normalizedPageSize
      };
    }

    let query = supabase
      .from('placements')
      .select(PUBLIC_PLACEMENT_SELECT)
      // Keep these explicit even though RLS also enforces public visibility.
      // PostgreSQL needs the predicates to match Home's partial indexes.
      .eq('visibility', 'public')
      .eq('owner_status', 'active')
      .eq('review_status', 'approved');

    if (normalizedSearch.exactCode) {
      query = query.eq('code', normalizedSearch.exactCode);
    } else {
      normalizedSearch.terms.forEach((term) => {
        query = query.ilike('search_text', `%${term}%`);
      });
    }

    const countryCodes = normalizeCountryCodes(country);

    query = applyListFilter(query, 'country_code', countryCodes);
    query = applyStateScopes(query, state);
    query = applyCityScopes(query, city);
    query = applyListFilter(query, 'type', type);
    query = applyPublicCursor(query, cursor);

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(normalizedPageSize + 1);

    if (error) throw error;

    const rows = data ?? [];
    const hasMore = rows.length > normalizedPageSize;
    const visibleRows = hasMore
      ? rows.slice(0, normalizedPageSize)
      : rows;
    const lastPlacement = visibleRows.at(-1);

    return {
      placements: visibleRows.map(toPublicPlacement),
      hasMore,
      nextCursor: hasMore && lastPlacement
        ? {
            createdAt: lastPlacement.created_at,
            id: lastPlacement.id
          }
        : null,
      pageSize: normalizedPageSize
    };
  },

  async getPublicPlacementsInView({
    south,
    west,
    north,
    east,
    limit = 1000,
    filters = {}
  } = {}) {
    const normalizedFilters = normalizePublicMapFilters(filters);

    if (normalizedFilters.isTooShort) {
      return [];
    }

    const {
      exactCode,
      searchTerms,
      countryCodes,
      stateScopes,
      cityScopes,
      types
    } = normalizedFilters;

    const { data, error } = await supabase.rpc(
      'get_public_placements_in_view',
      {
        p_south: south,
        p_west: west,
        p_north: north,
        p_east: east,
        p_limit: limit,

        p_exact_code: exactCode,
        p_search_terms: searchTerms,
        p_country_codes: countryCodes,
        p_state_scopes: stateScopes,
        p_city_scopes: cityScopes,
        p_types: types
      }
    );

    if (error) throw error;

    return data ?? [];
  },

  async getInventoryFilterOptions() {
    const { data, error } = await supabase.rpc(
      'get_inventory_filter_options'
    );

    if (error) throw error;

    return {
      countries: data?.countries ?? [],
      states: data?.states ?? [],
      cities: data?.cities ?? [],
      faceCounts: data?.faceCounts ?? []
    };
  },

  async getInventoryPlacements({
    userId,
    page = 1,
    pageSize = 10,
    filters = {}
  } = {}) {
    if (!userId) {
      throw new Error('USER_ID_REQUIRED');
    }

    if (!Number.isInteger(page) || page < 1) {
      throw new Error('INVALID_PAGE');
    }

    if (!Number.isInteger(pageSize) || pageSize < 1) {
      throw new Error('INVALID_PAGE_SIZE');
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const {
      search = '',
      faceCount = null,
      city = null,
      state = null,
      country = null,
      owner_status = null,
      review_status = null,
      visibility = null,
      type = null
    } = filters;

    const normalizedSearch = typeof search === 'string'
      ? search.trim().toUpperCase()
      : '';
    const normalizedFaceCounts = normalizeFaceCounts(faceCount);

    let query = supabase
      .from('placements')
      .select(`
        id,
        user_id,
        code,
        face_count,
        city,
        state,
        country,
        type,
        latitude,
        longitude,
        structure_height,
        description,
        visibility,
        owner_status,
        review_status,
        display_name,
        share_token,
        updated_at,
        created_at,
        faces:placement_faces (
          id,
          placement_id,
          display_width,
          display_height,
          period_price,
          day_range,
          images,
          updated_at,
          created_at
        )
      `, { count: 'exact' });

    query = query.eq('user_id', userId).neq('owner_status', 'withdrawn');

    if (normalizedSearch) {
      query = FULL_PLACEMENT_CODE_PATTERN.test(normalizedSearch)
        ? query.eq('code', normalizedSearch)
        : query.ilike('code', `%${normalizedSearch}%`);
    }

    query = applyListFilter(query, 'face_count', normalizedFaceCounts);
    query = applyListFilter(query, 'city', city);
    query = applyListFilter(query, 'state', state);
    query = applyListFilter(query, 'country', country);
    query = applyListFilter(query, 'owner_status', owner_status);
    query = applyListFilter(query, 'review_status', review_status);
    query = applyListFilter(query, 'visibility', visibility);
    query = applyListFilter(query, 'type', type);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const total = count ?? 0;

    return {
      placements: data ?? [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  },

  async getInventoryPlacementsInView({ userId, bounds, filters = {}, limit = 500 } = {}) {
    if (!userId) throw new Error('USER_ID_REQUIRED');

    const { south, west, north, east } = bounds ?? {};
    if (![south, west, north, east].every(Number.isFinite) || south >= north || west >= east) {
      throw new Error('INVALID_VIEWPORT');
    }

    const {
      search = '', faceCount = null, city = null, state = null,
      country = null, owner_status = null, review_status = null,
      visibility = null, type = null
    } = filters;
    const normalizedSearch = typeof search === 'string' ? search.trim().toUpperCase() : '';

    let query = supabase.from('placements').select(`
      id, code, type, latitude, longitude, face_count, city, state, country,
      display_name, owner_status, review_status, visibility, share_token
    `)
      .eq('user_id', userId)
      .neq('owner_status', 'withdrawn')
      .gte('latitude', south)
      .lte('latitude', north);

    // Mapbox may return longitudes outside [-180, 180] when the globe wraps.
    // Restrict only if the view spans less than the full globe.
    if (east - west < 360) {
      const normalizedWest = ((west + 180) % 360 + 360) % 360 - 180;
      const normalizedEast = ((east + 180) % 360 + 360) % 360 - 180;
      query = normalizedWest <= normalizedEast
        ? query.gte('longitude', normalizedWest).lte('longitude', normalizedEast)
        : query.or(`longitude.gte.${normalizedWest},longitude.lte.${normalizedEast}`);
    }

    if (normalizedSearch) {
      query = FULL_PLACEMENT_CODE_PATTERN.test(normalizedSearch)
        ? query.eq('code', normalizedSearch)
        : query.ilike('code', `%${normalizedSearch}%`);
    }

    query = applyListFilter(query, 'face_count', normalizeFaceCounts(faceCount));
    query = applyListFilter(query, 'city', city);
    query = applyListFilter(query, 'state', state);
    query = applyListFilter(query, 'country', country);
    query = applyListFilter(query, 'owner_status', owner_status);
    query = applyListFilter(query, 'review_status', review_status);
    query = applyListFilter(query, 'visibility', visibility);
    query = applyListFilter(query, 'type', type);

    const { data, error } = await query.order('code').limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async updatePlacementOwnerStatus(placementId, ownerStatus) {
    const { data, error } = await supabase
      .from('placements')
      .update({ owner_status: ownerStatus })
      .eq('id', placementId)
      .select('id, owner_status, review_status')
      .single();

    if (error) throw error;
    return data;
  },

  async updatePlacementReviewStatus(placementId, reviewStatus) {
    const { data, error } = await supabase
      .from('placements')
      .update({ review_status: reviewStatus })
      .eq('id', placementId)
      .select('id, owner_status, review_status')
      .single();

    if (error) throw error;
    return data;
  }
};
