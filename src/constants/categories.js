// Item categories for TheHomeKeeper
export const CATEGORIES = [
  {
    id: 'hvac',
    name: 'HVAC',
    icon: 'wind',
    color: '#5C8A5C',
    description: 'Air filters, furnace, AC',
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    icon: 'droplet',
    color: '#4A90E2',
    description: 'Water heater, pipes, faucets',
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: 'zap',
    color: '#E5A84B',
    description: 'Smoke detectors, panels, outlets',
  },
  {
    id: 'exterior',
    name: 'Exterior',
    icon: 'home',
    color: '#8B6F47',
    description: 'Roof, gutters, deck, siding',
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    icon: 'disc',
    color: '#9B59B6',
    description: 'Deep clean, carpets, windows',
  },
  {
    id: 'appliances',
    name: 'Appliances',
    icon: 'package',
    color: '#E74C3C',
    description: 'Fridge, washer, dryer, oven',
  },
  {
    id: 'yard',
    name: 'Yard',
    icon: 'sun',
    color: '#27AE60',
    description: 'Lawn, trees, irrigation, garden',
  },
  {
    id: 'car',
    name: 'Car',
    icon: 'truck',
    color: '#3D5A80',
    description: 'Oil change, tires, brakes, fluids',
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'more-horizontal',
    color: '#95A5A6',
    description: 'Miscellaneous items',
  },
];

// Get category by ID
export const getCategoryById = (id) => {
  return CATEGORIES.find(cat => cat.id === id) || CATEGORIES[CATEGORIES.length - 1]; // Default to "Other"
};

// Get category icon name
export const getCategoryIcon = (categoryId) => {
  const category = getCategoryById(categoryId);
  return category.icon;
};

// Get category color
export const getCategoryColor = (categoryId) => {
  const category = getCategoryById(categoryId);
  return category.color;
};
