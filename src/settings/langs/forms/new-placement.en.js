import SYSTEM from '../system.en';

export default {
  FACES: 'Number of faces',
  TYPE: 'Type of placement',
  STRUCTURE_HEIGHT: 'Structure height',
  STRUCTURE_DETAILS: 'Structure Details',
  STRUCTURE_DETAILS_DESCRIPTION: 'Configure the technical information of your space',
  LATITUDE_LONGITUDE: 'Latitude and Longitude',
  LATITUDE_LONGITUDE_DESCRIPTION: 'Set your ad space location using coordinates. Click Search Location to verify they are correct',
  LATITUDE_LONGITUDE_PLACEHOLDER: 'e.g., 20.967834, -89.648758',
  LOCATION: 'Location',
  LOCATION_DESCRIPTION: 'If the displayed location is correct, click Save and continue to proceed',
  IMAGES: 'Face Photos',
  IMAGES_DESCRIPTION: 'Upload 1 to 3 images of the advertising face',
  DISPLAY_SIZES: 'Face width and height',
  DISPLAY_WIDTH: 'Width',
  DISPLAY_HEIGHT: 'Height',
  RENTAL_PERIOD: 'Rental Period',
  PERIOD_PRICE: 'Price per period (15 days)',
  RANGE_DAYS: 'Rental day range',
  DESCRIPTION: 'Description',
  DESCRIPTION_PLACEHOLDER: 'Placement Description',
  VISIBILITY: 'Space Visibility',
  OPTIONS: {
    ...SYSTEM.PLACEMENT.TYPES,
    UNIPOLE_BILLBOARD_DESCRIPTION: 'Single-pole structure for high visual impact. Supports up to 4 faces to capture attention from any direction',
    HAND_PAINTED_MURAL_DESCRIPTION: 'Advertising painted directly onto walls. Ideal for street-level campaigns with an urban touch',
    BARRICADE_DESCRIPTION: 'Large-format ground-level billboard. High visibility for vehicular and pedestrian traffic',
    BUILDING_WRAP_DESCRIPTION: 'Large-format banner installed on a building facade. Excellent long-distance visibility',
    PUBLIC: 'Public',
    PRIVATE: 'Private',
    UNLISTED: 'Unlisted',
    PUBLIC_DESCRIPTION: 'Visible to all users on the platform',
    PRIVATE_DESCRIPTION: 'Only visible to you. Closed for bookings',
    UNLISTED_DESCRIPTION: 'Accessible only via direct link. Excluded from search results'
  },
  ERRORS: {
    LOCATION_NOT_FOUND_TITLE: 'Location Not Found',
    LOCATION_NOT_FOUND: 'We couldn\'t find any location using the provided coordinates. Please verify that the details are correct or try again later',
  },

  TABS: {
    FACE_1: 'Face A',
    FACE_2: 'Face B',
    FACE_3: 'Face C',
    FACE_4: 'Face D',
  },
  
  INPUT_METERS_PLACEHOLDER: 'e.g., 15 (meters)',
  
  
  PERIOD_PRICE_PLACEHOLDER: 'Ex. $500',
  RANGE_DAYS_PLACEHOLDER: 'Ex. 4 (equals 60 days)',
  DESCRIPTION_DESCRIPTION: 'Describe the main features, visibility, or advantages of this space.',
  
  

  PRICE_PERIOD_DESCRIPTION: 'Enter the rate and availability in 15-day periods.',
  PLACEMENT_NO_CREATED: 'Error creating placement, try later.',
  PLACEMENT_CREATED: 'All okay',
  
};
