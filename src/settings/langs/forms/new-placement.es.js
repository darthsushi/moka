import SYSTEM from '../system.es';

export default {
  FACES: 'Numero de caras',
  TYPE: 'Tipo de espacio',
  STRUCTURE_HEIGHT: 'Altura de la estructura',
  STRUCTURE_DETAILS: 'Datos de la estructura',
  STRUCTURE_DETAILS_DESCRIPTION: 'Configura la información técnica de tu espacio',
  LATITUDE_LONGITUDE: 'Latitud y Longitud',
  LATITUDE_LONGITUDE_DESCRIPTION: 'Configura la ubicación de tu espacio mediante coordenadas. Presiona Buscar Ubicación para verificar que sean correctas',
  LATITUDE_LONGITUDE_PLACEHOLDER: 'Ej. 20.967834, -89.648758',
  LOCATION: 'Ubicación',
  LOCATION_DESCRIPTION: 'Si la ubicación mostrada es correcta, haz clic en Guardar y continuar para avanzar',
  IMAGES: 'Fotografías de la cara',
  IMAGES_DESCRIPTION: 'Sube de 1 a 3 imágenes de la cara publicitaria',
  DISPLAY_SIZES: 'Ancho y alto de la cara',
  DISPLAY_WIDTH: 'Ancho',
  DISPLAY_HEIGHT: 'Alto',
  RENTAL_PERIOD: 'Periodo de renta',
  PERIOD_PRICE: 'Precio por periodo (15 días)',
  RANGE_DAYS: 'Rango días de renta',
  DESCRIPTION: 'Descripción',
  DESCRIPTION_PLACEHOLDER: 'Descripción del espacio',
  VISIBILITY: 'Visibilidad del espacio',
  OPTIONS: {
    ...SYSTEM.PLACEMENT.TYPES,
    UNIPOLE_BILLBOARD_DESCRIPTION: 'Estructura de un solo poste para alto impacto visual. Soporta hasta 4 caras para captar la atención desde cualquier dirección',
    HAND_PAINTED_MURAL_DESCRIPTION: 'Publicidad pintada directamente sobre muros o bardas. Ideal para campañas a nivel de calle con un toque urbano',
    BARRICADE_DESCRIPTION: 'Anuncio a nivel de piso de gran formato. Alta visibilidad para tráfico vehicular y peatonal',
    BUILDING_WRAP_DESCRIPTION: 'Lona de gran formato instalada sobre la fachada de un edificio. Excelente visibilidad a larga distancia',
    PUBLIC: 'Público',
    PRIVATE: 'Privado',
    UNLISTED: 'No listado',
    PUBLIC_DESCRIPTION: 'Visible para todos los usuarios en la plataforma',
    PRIVATE_DESCRIPTION: 'Solo visible para ti. Nadie más puede reservarlo',
    UNLISTED_DESCRIPTION: 'Acceso solo con enlace directo. No aparece en búsquedas'
  },
  ERRORS: {
    LOCATION_NOT_FOUND_TITLE: 'Ubicación no encontrada',
    LOCATION_NOT_FOUND: 'No pudimos encontrar ninguna ubicación con las coordenadas ingresadas. Por favor, verifica que los datos sean correctos o inténtalo de nuevo más tarde',
  },
  

  TABS: {
    FACE_1: 'Cara A',
    FACE_2: 'Cara B',
    FACE_3: 'Cara C',
    FACE_4: 'Cara D',
  },
  INPUT_METERS_PLACEHOLDER: 'Ej. 15 (metros)',
  
  PRICE_PERIOD_DESCRIPTION: 'Ingresa la tarifa y disponibilidad en periodos de 15 días',
  
  PERIOD_PRICE_PLACEHOLDER: 'Ej. $5000',
  AVAILABLE_PERIODS_PLACEHOLDER: 'Ej. 4 (equivale a 60 días)',
  
  DESCRIPTION_DESCRIPTION: 'Describe las características principales, visibilidad o ventajas de este espacio.',
  PLACEMENT_CREATED: 'Tu espacio se ha publicado!',
  PLACEMENT_NO_CREATED: 'Error al agregar espacio, intentalo mas tarde.',
};
