export const heroImages = {
  plate: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=85',
  interior: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=85',
  menu: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=85',
  auth: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1500&q=85',
};

export const fallbackCategories = [
  { id: 'tasting', code: 'TASTING', name: 'Tasting' },
  { id: 'fire', code: 'FIRE', name: 'Fire room' },
  { id: 'dessert', code: 'DESSERT', name: 'Dessert' },
  { id: 'drinks', code: 'DRINKS', name: 'Drinks' },
];

export const fallbackMenuItems = [
  {
    id: 'garden',
    category_id: 'tasting',
    category_name: 'Tasting',
    name: 'Garden opening',
    description: 'Young herbs, apple vinegar, chilled broth',
    price: 450000,
    image_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=85',
    is_available: true,
  },
  {
    id: 'oyster',
    category_id: 'tasting',
    category_name: 'Tasting',
    name: 'Oyster leaf',
    description: 'Oyster, lovage oil, citrus snow',
    price: 620000,
    image_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=85',
    is_available: true,
  },
  {
    id: 'beef',
    category_id: 'fire',
    category_name: 'Fire room',
    name: 'Fire aged beef',
    description: 'Rib, smoked marrow sauce, black garlic',
    price: 980000,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85',
    is_available: true,
  },
  {
    id: 'duck',
    category_id: 'fire',
    category_name: 'Fire room',
    name: 'Duck ember',
    description: 'Aged duck, plum lacquer, bitter greens',
    price: 820000,
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=85',
    is_available: true,
  },
  {
    id: 'pear',
    category_id: 'dessert',
    category_name: 'Dessert',
    name: 'Pear ash',
    description: 'Poached pear, malt cream, toasted hay',
    price: 320000,
    image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=85',
    is_available: true,
  },
  {
    id: 'martini',
    category_id: 'drinks',
    category_name: 'Drinks',
    name: 'Garden martini',
    description: 'Gin, basil oil, dry vermouth',
    price: 260000,
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=85',
    is_available: true,
  },
];

export const fallbackReviews = [
  {
    id: 1,
    rating: 5,
    comment: 'Beautiful atmosphere, exquisite dishes and perfectly paced service.',
    customer_name: 'Nguyen Minh Anh',
  },
  {
    id: 2,
    rating: 5,
    comment: 'A wonderful anniversary dinner, especially the table by the window.',
    customer_name: 'Le Hoang Nam',
  },
];
