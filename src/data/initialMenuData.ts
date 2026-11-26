import type { DayMenu, FoodCategoryGroup, FoodLineItem, MealMeta, MealType } from '../types/mess';

export const MEAL_ORDER: MealType[] = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

export const MEAL_META: Record<MealType, MealMeta> = {
  BREAKFAST: {
    type: 'BREAKFAST',
    title: 'Breakfast',
    shortTitle: 'Breakfast',
    channelName: 'Breakfast Menu Reminders',
    workingTiming: '07:30 AM – 09:30 AM',
    holidayTiming: '08:00 AM – 10:00 AM',
    workingStartMinutes: 7 * 60 + 30,
    workingEndMinutes: 9 * 60 + 30,
    holidayStartMinutes: 8 * 60,
    holidayEndMinutes: 10 * 60,
    defaultNotifyTime: '07:00',
  },
  LUNCH: {
    type: 'LUNCH',
    title: 'Lunch',
    shortTitle: 'Lunch',
    channelName: 'Lunch Menu Reminders',
    workingTiming: '11:30 AM – 03:00 PM',
    holidayTiming: '12:30 PM – 03:00 PM',
    workingStartMinutes: 11 * 60 + 30,
    workingEndMinutes: 15 * 60,
    holidayStartMinutes: 12 * 60 + 30,
    holidayEndMinutes: 15 * 60,
    defaultNotifyTime: '11:00',
  },
  SNACKS: {
    type: 'SNACKS',
    title: 'Evening Snacks',
    shortTitle: 'Snacks',
    channelName: 'Evening Snacks Reminders',
    workingTiming: '05:00 PM – 06:30 PM',
    holidayTiming: '05:00 PM – 06:30 PM',
    workingStartMinutes: 17 * 60,
    workingEndMinutes: 18 * 60 + 30,
    holidayStartMinutes: 17 * 60,
    holidayEndMinutes: 18 * 60 + 30,
    defaultNotifyTime: '16:30',
  },
  DINNER: {
    type: 'DINNER',
    title: 'Dinner',
    shortTitle: 'Dinner',
    channelName: 'Dinner Menu Reminders',
    workingTiming: '07:30 PM – 09:30 PM',
    holidayTiming: '07:30 PM – 09:30 PM',
    workingStartMinutes: 19 * 60 + 30,
    workingEndMinutes: 21 * 60 + 30,
    holidayStartMinutes: 19 * 60 + 30,
    holidayEndMinutes: 21 * 60 + 30,
    defaultNotifyTime: '19:00',
  },
};

function item(
  itemId: string,
  subCategory: string,
  originalDishName: string,
  originalAccompaniment?: string,
  isPrimaryDish = true,
  needsVerification = originalDishName.includes('/')
): FoodLineItem {
  return {
    itemId,
    subCategory,
    originalDishName,
    originalAccompaniment,
    isPrimaryDish,
    needsVerification,
  };
}

function seasonalItem(
  itemId: string,
  subCategory: string,
  seasonalAugOct: string,
  seasonalNovFeb: string,
  seasonalMarMay: string
): FoodLineItem {
  return {
    itemId,
    subCategory,
    originalDishName: 'Seasonal Vegetable*',
    isPrimaryDish: true,
    isSeasonalPlaceholder: true,
    seasonalAugOct,
    seasonalNovFeb,
    seasonalMarMay,
    needsVerification: true,
  };
}

function buildBreakfast(
  dayIdx: number,
  item1North: string,
  accomp1: string,
  item2: string,
  accomp2: string | undefined,
  item3South: string | undefined,
  accomp3: string | undefined,
  healthyItem4: string,
  breadItem5: string,
  hasButter: boolean,
  fruit?: string
): FoodCategoryGroup[] {
  const mainDishes: FoodLineItem[] = [
    item(`d${dayIdx}_bf_1`, 'Breakfast-Item 1 (North)', item1North, accomp1, true),
    item(`d${dayIdx}_bf_2`, 'Breakfast-Item 2 (North/South)', item2, accomp2, true),
  ];

  if (item3South) {
    mainDishes.push(
      item(`d${dayIdx}_bf_3`, 'Breakfast-Item 3 (South)', item3South, accomp3, true)
    );
  } else if (accomp3) {
    mainDishes.push(
      item(`d${dayIdx}_bf_3`, 'Breakfast-Item 3 (South Accomp.)', accomp3, undefined, false)
    );
  }

  const healthyAndSides: FoodLineItem[] = [
    item(`d${dayIdx}_bf_4`, 'Healthy Option-Item 4', healthyItem4, undefined, true),
    item(
      `d${dayIdx}_bf_5`,
      'Bread-Item 5',
      breadItem5,
      hasButter ? 'Jam, Butter (One Sachet)' : 'Jam',
      false
    ),
    item(`d${dayIdx}_bf_6`, 'Cereals-Item 6', 'Cornflakes', undefined, false),
  ];

  if (fruit) {
    healthyAndSides.push(item(`d${dayIdx}_bf_fruit`, 'Fruits', fruit, undefined, true));
  }

  return [
    { sectionTitle: 'Primary Breakfast Dishes', items: mainDishes },
    { sectionTitle: 'Healthy Options, Bread & Cereals', items: healthyAndSides },
    {
      sectionTitle: 'Hot Beverages',
      items: [
        item(
          `d${dayIdx}_bf_bev`,
          'Hot Beverages 1, 2 & 3',
          'Masala Tea, Coffee, Plain Milk',
          undefined,
          false
        ),
      ],
    },
  ];
}

function buildSnacks(
  dayIdx: number,
  snack: string,
  accomp: string | undefined,
  bev2: string
): FoodCategoryGroup[] {
  return [
    {
      sectionTitle: 'Evening Snack',
      items: [item(`d${dayIdx}_sn_1`, 'Snack', snack, accomp, true)],
    },
    {
      sectionTitle: 'Beverages',
      items: [
        item(`d${dayIdx}_sn_bev1`, 'Beverage 1', 'Tea', undefined, false),
        item(
          `d${dayIdx}_sn_bev2`,
          'Beverage 2',
          bev2,
          bev2 === 'Coffee' ? undefined : 'Apr–Sep (Coffee served Oct–Mar)',
          false,
          false
        ),
      ],
    },
  ];
}

export const INITIAL_14_DAY_MENU: DayMenu[] = [
  // DAY 1: SUNDAY 1
  {
    cycleDayIndex: 1,
    pdfColumnName: 'Sunday 1',
    dayOfWeekIndex: 0,
    weekNumber: 1,
    meals: {
      BREAKFAST: buildBreakfast(
        1,
        'Masala Dosa',
        'Sambhar',
        'Cold Sandwich',
        'Tomato Ketchup',
        'Garlic Tomato Chutney',
        undefined,
        'Moth Bean Sprouts',
        'White Bread',
        true
      ),
      LUNCH: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d1_lu_s2', 'Main Veg 1', 'Cabbage Poriyal', undefined, true),
            item('d1_lu_s1', 'Lentils 1 (Sambhar/Rasam)', 'Kara Kuzhambu', undefined, true),
            item('d1_lu_s3', 'Staple Carbs 1', 'Puliyodharai', undefined, true),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d1_lu_n1', 'Lentils 2', 'Pindi Chhole', undefined, true),
            item('d1_lu_n2', 'Main Veg 2', 'Aloo Pyaz Masaledar', undefined, true),
            item('d1_lu_n3', 'Staple Carbs 2', 'Plain Rice', undefined, false),
            item('d1_lu_n4', 'Curd / Raita', 'Boondi Raita', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread & Salad',
          items: [
            item('d1_lu_b1', 'Indian Breads', 'Roti and Bhatura', undefined, true),
            item('d1_lu_b2', 'Accompaniment', 'Pickled Salad', undefined, false),
          ],
        },
      ],
      SNACKS: buildSnacks(1, 'Kulcha', 'Nutri Gravy', 'Coffee'),
      DINNER: [
        {
          sectionTitle: 'South Indian',
          items: [
            seasonalItem('d1_di_s2', 'Main Veg 1', 'Zimikand Pulusu', 'Cauliflower Poriyal', 'Kundru Masala'),
            item('d1_di_s1', 'Lentils 1 (Sambhar/Rasam)', 'Mysore Sambhar', undefined, true),
            item('d1_di_s3', 'Staple Carbs 1', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d1_di_n2', 'Main Veg 2', 'Gatta Curry', undefined, true),
            item('d1_di_n1', 'Lentils 2', 'Moong Chhilka Dal', undefined, true),
            item('d1_di_n3', 'Staple Carbs 2', 'Bhuna Onion Pulao', undefined, true),
          ],
        },
        {
          sectionTitle: 'Bread, Salad & Dessert',
          items: [
            item('d1_di_b3', 'Dessert', 'Gulab Jamun', undefined, true),
            item('d1_di_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d1_di_b2', 'Accompaniment', 'Fryums', undefined, false),
          ],
        },
      ],
    },
  },

  // DAY 2: MONDAY 1
  {
    cycleDayIndex: 2,
    pdfColumnName: 'Monday 1',
    dayOfWeekIndex: 1,
    weekNumber: 1,
    meals: {
      BREAKFAST: buildBreakfast(
        2,
        'Stuffed Mix Prantha',
        'Packed Curd',
        'Veg. Stuffed Toast',
        'Tomato Ketchup',
        'Idli with Sambhar',
        'Coconut Chutney',
        'Sweet Dalia',
        'Brown Bread',
        true
      ),
      LUNCH: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d2_lu_s2', 'Main Veg 1', 'Tomato Meal Maker', undefined, true),
            item('d2_lu_s1', 'Lentils 1 (Sambhar/Rasam)', 'Mudha Pappu', undefined, true),
            item('d2_lu_s3', 'Staple Carbs 1', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            seasonalItem('d2_lu_n2', 'Main Veg 2', 'Bhindi Masala', 'Jimikand Matar', 'Aloo Beans'),
            item('d2_lu_n1', 'Lentils 2', 'Dal Milijuli', undefined, true),
            item('d2_lu_n3', 'Staple Carbs 2', 'Veg Pulao', undefined, true),
            item('d2_lu_n4', 'Curd / Raita', 'Plain Curd', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread & Salad',
          items: [
            item('d2_lu_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d2_lu_b2', 'Accompaniment', 'Fryums', undefined, false),
          ],
        },
      ],
      SNACKS: buildSnacks(2, 'Momos (3 pc.)', 'Garlic Chutney', 'Lemon Water'),
      DINNER: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d2_di_s2', 'Main Veg 1', 'Donda Kaya Fry', undefined, true),
            item('d2_di_s3', 'Staple Carbs 1', 'Soya Biryani', undefined, true),
            item('d2_di_s1', 'Lentils 1 (Sambhar/Rasam)', 'Majjiga Pulusu', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d2_di_n2', 'Main Veg 2', 'Palak Paneer / Kadai Paneer', undefined, true),
            item('d2_di_n1', 'Lentils 2', 'Yellow Dal Fry', undefined, true),
            item('d2_di_n3', 'Staple Carbs 2', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread, Salad & Dessert',
          items: [
            item('d2_di_b3', 'Dessert', 'Semiya Kheer', undefined, true),
            item('d2_di_b1', 'Indian Breads', 'Roti and Missi Roti', undefined, true),
            item('d2_di_b2', 'Accompaniment', 'Green Salad', undefined, false),
          ],
        },
      ],
    },
  },

  // DAY 3: TUESDAY 1
  {
    cycleDayIndex: 3,
    pdfColumnName: 'Tuesday 1',
    dayOfWeekIndex: 2,
    weekNumber: 1,
    meals: {
      BREAKFAST: buildBreakfast(
        3,
        'Poori',
        'Aloo Curry',
        'Black Chana Masala',
        'Tomato Ketchup',
        'Mysore Bonda',
        'South Tomato Chutney',
        'Moong Sprouts',
        'White Bread',
        false,
        'Banana'
      ),
      LUNCH: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d3_lu_s1', 'Lentils 1 (Sambhar/Rasam)', 'Vankaya Curry', undefined, true),
            item('d3_lu_s2', 'Main Veg 1', 'Mor Kuzhambu', undefined, true),
            item('d3_lu_s3', 'Staple Carbs 1', 'Lemon Rice', undefined, true),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d3_lu_n1', 'Lentils 2', 'Rajma', undefined, true),
            item('d3_lu_n2', 'Main Veg 2', 'Mix Veg', undefined, true),
            item('d3_lu_n3', 'Staple Carbs 2', 'Plain Rice', undefined, false),
            item('d3_lu_n4', 'Curd / Raita', 'Mix-Veg Raita', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread & Salad',
          items: [
            item('d3_lu_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d3_lu_b2', 'Accompaniment', 'Green Salad', undefined, false),
          ],
        },
      ],
      SNACKS: buildSnacks(3, 'Vada Pav', 'Tomato Ketchup', 'Coffee'),
      DINNER: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d3_di_s2', 'Main Veg 1', 'Vada Curry', undefined, true),
            item('d3_di_s1', 'Lentils 1 (Sambhar/Rasam)', 'Beerakaya Pappu', undefined, true),
            item('d3_di_s3', 'Staple Carbs 1', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d3_di_n2', 'Main Veg 2', 'Mushroom Matar / Methi Malai Matar', undefined, true),
            item('d3_di_n3', 'Staple Carbs 2', 'Veg Dum Biryani', undefined, true),
            item('d3_di_n1', 'Lentils 2', 'Sabut Masoor Dal', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread, Salad & Dessert',
          items: [
            item('d3_di_b3', 'Dessert', 'Besan Burfi', undefined, true),
            item('d3_di_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d3_di_b2', 'Accompaniment', 'Green Salad', undefined, false),
          ],
        },
      ],
    },
  },

  // DAY 4: WEDNESDAY 1
  {
    cycleDayIndex: 4,
    pdfColumnName: 'Wednesday 1',
    dayOfWeekIndex: 3,
    weekNumber: 1,
    meals: {
      BREAKFAST: buildBreakfast(
        4,
        'Kulcha (Toasted)',
        'Chana / Matar Gravy',
        'Vermicelli Upma',
        'Tomato Ketchup',
        'Mix Veg Uthapam',
        'Coconut Chutney',
        'Vegetable Dalia',
        'Brown Bread',
        true
      ),
      LUNCH: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d4_lu_s2', 'Main Veg 1', 'Veg 65 / Mirchi Bajji', undefined, true),
            item('d4_lu_s3', 'Staple Carbs 1', 'Bisi Belle Bath', undefined, true),
            item('d4_lu_s1', 'Lentils 1 (Sambhar/Rasam)', 'Tomato Pappu', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            seasonalItem('d4_lu_n2', 'Main Veg 2', 'Louki / Tori Lababdar', 'Shalgam Matar', 'Ghia Kofta Curry'),
            item('d4_lu_n1', 'Lentils 2', 'Yellow Dal Fry', undefined, true),
            item('d4_lu_n3', 'Staple Carbs 2', 'Jeera Onion Pulao', undefined, true),
            item('d4_lu_n4', 'Curd / Raita', 'Lauki Mint Raita', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread & Salad',
          items: [
            item('d4_lu_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d4_lu_b2', 'Accompaniment', 'Fryums', undefined, false),
          ],
        },
      ],
      SNACKS: buildSnacks(4, 'Bombay Sandwich', 'Tomato Ketchup', 'Rooh Afza'),
      DINNER: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d4_di_s2', 'Main Veg 1', 'Potato Peas Poriyal', undefined, true),
            item('d4_di_s1', 'Lentils 1 (Sambhar/Rasam)', 'Tamarind Rasam', undefined, false),
            item('d4_di_s3', 'Staple Carbs 1', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d4_di_n2', 'Main Veg 2', 'Aloo Bengan Chokha', undefined, true),
            item('d4_di_n1', 'Lentils 2', 'Maah Ki Dal', undefined, true),
            item('d4_di_n3', 'Staple Carbs 2', 'Jeera Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread, Salad & Dessert',
          items: [
            item('d4_di_b3', 'Dessert', 'Rasgulla', undefined, true),
            item('d4_di_b1', 'Indian Breads', 'Roti / Litti', undefined, true),
            item('d4_di_b2', 'Accompaniment', 'Fryums', undefined, false),
          ],
        },
      ],
    },
  },

  // DAY 5: THURSDAY 1
  {
    cycleDayIndex: 5,
    pdfColumnName: 'Thursday 1',
    dayOfWeekIndex: 4,
    weekNumber: 1,
    meals: {
      BREAKFAST: buildBreakfast(
        5,
        'Plain Prantha',
        'Aloo Bhujia',
        'Vegetable Macroni',
        'Tomato Ketchup',
        'Minapa Punugulu',
        'Peanut Chutney',
        'Black Chana Sprouts',
        'White Bread',
        false,
        'Seasonal Fruit'
      ),
      LUNCH: [
        {
          sectionTitle: 'South Indian',
          items: [
            seasonalItem('d5_lu_s2', 'Main Veg 1', 'Mix Veg Poriyal', 'Beans Poriyal', 'Drumstick Tomato'),
            item('d5_lu_s1', 'Lentils 1 (Sambhar/Rasam)', 'Pachi Pulusu', undefined, true),
            item('d5_lu_s3', 'Staple Carbs 1', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d5_lu_n1', 'Lentils 2', 'Punjabi Kadhi Pakoda', undefined, true),
            item('d5_lu_n2', 'Main Veg 2', 'Aloo Matar Gravy', undefined, true),
            item('d5_lu_n3', 'Staple Carbs 2', 'Plain Rice', undefined, false),
            item('d5_lu_n4', 'Curd / Raita', 'Majjiga Pulusu', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread & Salad',
          items: [
            item('d5_lu_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d5_lu_b2', 'Accompaniment', 'Green Salad', undefined, false),
          ],
        },
      ],
      SNACKS: buildSnacks(5, 'Hakka Noodles', 'Tomato Ketchup', 'Coffee'),
      DINNER: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d5_di_s2', 'Main Veg 1', 'Meal Maker Curry', undefined, true),
            item('d5_di_s1', 'Lentils 1 (Sambhar/Rasam)', 'Kandhi Pappu', undefined, false),
            item('d5_di_s3', 'Staple Carbs 1', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d5_di_n2', 'Main Veg 2', 'Paneer Do Pyaza', undefined, true),
            item('d5_di_n1', 'Lentils 2', 'Dal Palak', undefined, true),
            item('d5_di_n3', 'Staple Carbs 2', 'Matar Pulao', undefined, true),
          ],
        },
        {
          sectionTitle: 'Bread, Salad & Dessert',
          items: [
            item('d5_di_b3', 'Dessert', 'Moong Dal Halwa / Ice Cream', undefined, true),
            item('d5_di_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d5_di_b2', 'Accompaniment', 'Green Salad', undefined, false),
          ],
        },
      ],
    },
  },

  // DAY 6: FRIDAY 1
  {
    cycleDayIndex: 6,
    pdfColumnName: 'Friday 1',
    dayOfWeekIndex: 5,
    weekNumber: 1,
    meals: {
      BREAKFAST: buildBreakfast(
        6,
        'Stuffed Mooli / Onion Prantha',
        'Packed Curd',
        'Aloo Bonda',
        'Tomato Ketchup',
        'Vegetable Rawa Upma',
        'Tomato Gojju',
        'Mix Dal Sprouts',
        'Brown Bread',
        true
      ),
      LUNCH: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d6_lu_s2', 'Main Veg 1', 'Bagara Baingan', undefined, true),
            item('d6_lu_s1', 'Lentils 1 (Sambhar/Rasam)', 'Sambhar', undefined, false),
            item('d6_lu_s3', 'Staple Carbs 1', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d6_lu_n2', 'Main Veg 2', 'Mix Veg Kofta', undefined, true),
            item('d6_lu_n1', 'Lentils 2', 'Black Chana', undefined, true),
            item('d6_lu_n3', 'Staple Carbs 2', 'Veg Pulao', undefined, true),
            item('d6_lu_n4', 'Curd / Raita', 'Fruit Raita', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread & Salad',
          items: [
            item('d6_lu_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d6_lu_b2', 'Accompaniment', 'Pickled Salad', undefined, false),
          ],
        },
      ],
      SNACKS: buildSnacks(6, 'Bread Pakoda', 'Tomato Ketchup', 'Aam Panna'),
      DINNER: [
        {
          sectionTitle: 'South Indian',
          items: [
            seasonalItem('d6_di_s2', 'Main Veg 1', 'Bhindi Pulusu', 'Chikkadukaya Curry', 'Zimikand Pulusu'),
            item('d6_di_s3', 'Staple Carbs 1', 'Tomato Rice', undefined, true),
            item('d6_di_s1', 'Lentils 1 (Sambhar/Rasam)', 'Tomato Rasam', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d6_di_n2', 'Main Veg 2', 'Mix Veg', undefined, true),
            item('d6_di_n1', 'Lentils 2', 'Arhar Dal', undefined, true),
            item('d6_di_n3', 'Staple Carbs 2', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread, Salad & Dessert',
          items: [
            item('d6_di_b3', 'Dessert', 'Balushahi', undefined, true),
            item('d6_di_b1', 'Indian Breads', 'Roti and Ajwain Roti', undefined, true),
            item('d6_di_b2', 'Accompaniment', 'Fryums', undefined, false),
          ],
        },
      ],
    },
  },

  // DAY 7: SATURDAY 1
  {
    cycleDayIndex: 7,
    pdfColumnName: 'Saturday 1',
    dayOfWeekIndex: 6,
    weekNumber: 1,
    meals: {
      BREAKFAST: buildBreakfast(
        7,
        'Soya Paneer Prantha',
        'Pickle',
        'Sweet Dalia',
        undefined,
        'Medu Vada with Sambhar',
        'Peanut Chutney',
        'Mixed Cut Fruits',
        'White Bread',
        true
      ),
      LUNCH: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d7_lu_s2', 'Main Veg 1', 'Paruppu Urundai Kulambu', undefined, true),
            item('d7_lu_s3', 'Staple Carbs 1', 'Khuska', undefined, true),
            item('d7_lu_s1', 'Lentils 1 (Sambhar/Rasam)', 'Senaga Pappu', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d7_lu_n1', 'Lentils 2', 'Matar Paneer / Matar Mushroom', undefined, true),
            seasonalItem(
              'd7_lu_n2',
              'Main Veg 2',
              'Arbi Ajwaini Masala',
              'Bengan Bhartha / Gobhi Gajar Matar',
              'Aloo Gobhi Adraki'
            ),
            item('d7_lu_n4', 'Curd / Raita', 'Dahi Bhalla', undefined, true),
            item('d7_lu_n3', 'Staple Carbs 2', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread & Salad',
          items: [
            item('d7_lu_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d7_lu_b2', 'Accompaniment', 'Green Salad and Imly Chutney', undefined, false),
          ],
        },
      ],
      SNACKS: buildSnacks(7, 'Samosa', 'Tomato Ketchup', 'Coffee'),
      DINNER: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d7_di_s3', 'Staple Carbs 1', 'Soya & Matar Dum Biryani', undefined, true),
            item('d7_di_s2', 'Main Veg 1', 'Artikai Vepudu', undefined, true),
            item('d7_di_s1', 'Lentils 1 (Sambhar/Rasam)', 'Vengaya Sambhar (Onion)', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d7_di_n1', 'Lentils 2', 'Rajma', undefined, true),
            item('d7_di_n2', 'Main Veg 2', 'Aloo Shimla', undefined, true),
            item('d7_di_n3', 'Staple Carbs 2', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread, Salad & Dessert',
          items: [
            item('d7_di_b3', 'Dessert', 'Kheer', undefined, true),
            item('d7_di_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d7_di_b2', 'Accompaniment', 'Green Salad', undefined, false),
          ],
        },
      ],
    },
  },

  // DAY 8: SUNDAY 2
  {
    cycleDayIndex: 8,
    pdfColumnName: 'Sunday 2',
    dayOfWeekIndex: 0,
    weekNumber: 2,
    meals: {
      BREAKFAST: buildBreakfast(
        8,
        'Masala Dosa / Veg Uthapam',
        'Sambhar',
        'Indori Poha',
        'Tomato Ketchup',
        undefined,
        'Coconut Chutney',
        'Broken Wheat Upma',
        'Brown Bread',
        true
      ),
      LUNCH: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d8_lu_s2', 'Main Veg 1', 'Gutti Vankaya', undefined, true),
            item('d8_lu_s3', 'Staple Carbs 1', 'Tomato Rice', undefined, true),
            item('d8_lu_s1', 'Lentils 1 (Sambhar/Rasam)', 'Garlic Pepper Rasam', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d8_lu_n1', 'Lentils 2', 'Pindi Chhole', undefined, true),
            item('d8_lu_n2', 'Main Veg 2', 'Khatta Meetha Petha', undefined, true),
            item('d8_lu_n3', 'Staple Carbs 2', 'Jeera Rice', undefined, false),
            item('d8_lu_n4', 'Curd / Raita', 'Plain Curd', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread & Salad',
          items: [
            item('d8_lu_b1', 'Indian Breads', 'Roti and Bhatura', undefined, true),
            item('d8_lu_b2', 'Accompaniment', 'Pickled Onion', undefined, false),
          ],
        },
      ],
      SNACKS: buildSnacks(8, 'Veg Coleslaw Sandwich', 'Green Chutney', 'Tang'),
      DINNER: [
        {
          sectionTitle: 'South Indian',
          items: [
            seasonalItem('d8_di_s2', 'Main Veg 1', 'Beans Poriyal', 'Cabbage Dum Fry with Chana Dal', 'Kundru 65'),
            item('d8_di_s1', 'Lentils 1 (Sambhar/Rasam)', 'Thakkali Sambhar', undefined, true),
            item('d8_di_s3', 'Staple Carbs 1', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d8_di_n2', 'Main Veg 2', 'Nutri Chilly', undefined, true),
            item('d8_di_n1', 'Lentils 2', 'Hari Moong Dal', undefined, true),
            item('d8_di_n3', 'Staple Carbs 2', 'Veg Pulao', undefined, true),
          ],
        },
        {
          sectionTitle: 'Bread, Salad & Dessert',
          items: [
            item('d8_di_b3', 'Dessert', 'Suji Halwa', undefined, true),
            item('d8_di_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d8_di_b2', 'Accompaniment', 'Fryums', undefined, false),
          ],
        },
      ],
    },
  },

  // DAY 9: MONDAY 2
  {
    cycleDayIndex: 9,
    pdfColumnName: 'Monday 2',
    dayOfWeekIndex: 1,
    weekNumber: 2,
    meals: {
      BREAKFAST: buildBreakfast(
        9,
        'Stuffed Aloo / Mooli Methi Prantha',
        'Packed Curd',
        'Vermicelli Upma',
        'Tomato Ketchup',
        'Minapa Punugulu',
        'South Tomato Chutney',
        'Steamed Vegetables',
        'White Bread',
        true
      ),
      LUNCH: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d9_lu_s2', 'Main Veg 1', 'Vegetable Sagu', undefined, true),
            item('d9_lu_s1', 'Lentils 1 (Sambhar/Rasam)', 'Chamagadda Pulusu', undefined, true),
            item('d9_lu_s3', 'Staple Carbs 1', 'Curd Rice', undefined, true),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d9_lu_n1', 'Lentils 2', 'Dal Makhni', undefined, true),
            seasonalItem('d9_lu_n2', 'Main Veg 2', 'Bhindi Do Pyaza', 'Aloo Gobhi Matar', 'Aloo Hara Pyaz'),
            item('d9_lu_n3', 'Staple Carbs 2', 'Plain Rice', undefined, false),
            item('d9_lu_n4', 'Curd / Raita', 'Cucumber / Ghiya Raita', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread & Salad',
          items: [
            item('d9_lu_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d9_lu_b2', 'Accompaniment', 'Green Salad', undefined, false),
          ],
        },
      ],
      SNACKS: buildSnacks(9, 'Veg Bajji', 'Green Chutney', 'Coffee'),
      DINNER: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d9_di_s2', 'Main Veg 1', 'Aloo Gadda Vepudu', undefined, true),
            item('d9_di_s3', 'Staple Carbs 1', 'Chitranna Rice', undefined, true),
            item('d9_di_s1', 'Lentils 1 (Sambhar/Rasam)', 'Tomato Pappu', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            seasonalItem(
              'd9_di_n2',
              'Main Veg 2',
              'Aloo Parwal / Shimla Mirch',
              'Sarso Saag + Makairoti / Poori',
              'Karela Aloo Fry'
            ),
            item('d9_di_n1', 'Lentils 2', 'Yellow Moong Dal', undefined, true),
            item('d9_di_n3', 'Staple Carbs 2', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread, Salad & Dessert',
          items: [
            item('d9_di_b3', 'Dessert', 'Coconut Laddu', undefined, true),
            item('d9_di_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d9_di_b2', 'Accompaniment', 'Green Salad', undefined, false),
          ],
        },
      ],
    },
  },

  // DAY 10: TUESDAY 2
  {
    cycleDayIndex: 10,
    pdfColumnName: 'Tuesday 2',
    dayOfWeekIndex: 2,
    weekNumber: 2,
    meals: {
      BREAKFAST: buildBreakfast(
        10,
        'Stuffed Mix Prantha',
        'Pickle',
        'Vegetable Pasta',
        'Tomato Ketchup',
        'Masala Vegetable Idli',
        'Peanut Chutney',
        'Mix Dal Sprouts',
        'Brown Bread',
        false,
        'Banana'
      ),
      LUNCH: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d10_lu_s2', 'Main Veg 1', 'Potato 65', undefined, true),
            item('d10_lu_s1', 'Lentils 1 (Sambhar/Rasam)', 'Drum Stick Sambhar', undefined, true),
            item('d10_lu_s3', 'Staple Carbs 1', 'Coconut Rice', undefined, true),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d10_lu_n1', 'Lentils 2', 'Lobia Dal', undefined, true),
            item('d10_lu_n2', 'Main Veg 2', 'Mix Veg', undefined, true),
            item('d10_lu_n3', 'Staple Carbs 2', 'Plain Rice', undefined, false),
            item('d10_lu_n4', 'Curd / Raita', 'Mix-Veg Raita', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread & Salad',
          items: [
            item('d10_lu_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d10_lu_b2', 'Accompaniment', 'Green Salad', undefined, false),
          ],
        },
      ],
      SNACKS: buildSnacks(10, 'Bhel Poori', 'Imly Chutney', 'Lemon Water'),
      DINNER: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d10_di_s3', 'Staple Carbs 1', 'Hyderabadi Biryani', undefined, true),
            item('d10_di_s2', 'Main Veg 1', 'Vegetable Kurma', undefined, true),
            item('d10_di_s1', 'Lentils 1 (Sambhar/Rasam)', 'Beerakaya Pappu', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d10_di_n2', 'Main Veg 2', 'Paneer Butter Masala', undefined, true),
            item('d10_di_n1', 'Lentils 2', 'Maah Chana Dal', undefined, true),
            item('d10_di_n3', 'Staple Carbs 2', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread, Salad & Dessert',
          items: [
            item('d10_di_b3', 'Dessert', 'Gulab Jamun', undefined, true),
            item('d10_di_b1', 'Indian Breads', 'Roti and Spinach Roti', undefined, true),
            item('d10_di_b2', 'Accompaniment', 'Fryums', undefined, false),
          ],
        },
      ],
    },
  },

  // DAY 11: WEDNESDAY 2
  {
    cycleDayIndex: 11,
    pdfColumnName: 'Wednesday 2',
    dayOfWeekIndex: 3,
    weekNumber: 2,
    meals: {
      BREAKFAST: buildBreakfast(
        11,
        'Poori',
        'Aloo Chana Curry',
        'Cold Sandwich',
        'Tomato Ketchup',
        'Vegetable Rawa Upma',
        'Tomato Gojju',
        'Millet Upma',
        'White Bread',
        false,
        'Seasonal Fruit'
      ),
      LUNCH: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d11_lu_s2', 'Main Veg 1', 'Mushroom Chettinad Curry', undefined, true),
            item('d11_lu_s3', 'Staple Carbs 1', 'Pudina Rice', undefined, true),
            item('d11_lu_s1', 'Lentils 1 (Sambhar/Rasam)', 'Tamarind Rasam', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            seasonalItem('d11_lu_n2', 'Main Veg 2', 'Nutri Keema Matar', 'Aloo Methi', 'Aloo Shimla Mirch'),
            item('d11_lu_n1', 'Lentils 2', 'Sabut Masoor Dal', undefined, true),
            item('d11_lu_n3', 'Staple Carbs 2', 'Plain Rice', undefined, false),
            item('d11_lu_n4', 'Curd / Raita', 'Boondi Raita', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread & Salad',
          items: [
            item('d11_lu_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d11_lu_b2', 'Accompaniment', 'Fryums', undefined, false),
          ],
        },
      ],
      SNACKS: buildSnacks(11, 'Pav', 'Bhaji', 'Coffee'),
      DINNER: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d11_di_s2', 'Main Veg 1', 'Donda Kaya Fry', undefined, true),
            item('d11_di_s3', 'Staple Carbs 1', 'Puliyodharai', undefined, true),
            item('d11_di_s1', 'Lentils 1 (Sambhar/Rasam)', 'Pasi Paruppu Sambar', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d11_di_n1', 'Lentils 2', 'Rajma Rasila', undefined, true),
            item('d11_di_n2', 'Main Veg 2', 'Aloo Matar Dry', undefined, true),
            item('d11_di_n3', 'Staple Carbs 2', 'Veg Pulao', undefined, true),
          ],
        },
        {
          sectionTitle: 'Bread, Salad & Dessert',
          items: [
            item('d11_di_b3', 'Dessert', 'Besan Barfi', undefined, true),
            item('d11_di_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d11_di_b2', 'Accompaniment', 'Green Salad', undefined, false),
          ],
        },
      ],
    },
  },

  // DAY 12: THURSDAY 2
  {
    cycleDayIndex: 12,
    pdfColumnName: 'Thursday 2',
    dayOfWeekIndex: 4,
    weekNumber: 2,
    meals: {
      BREAKFAST: buildBreakfast(
        12,
        'Missa Prantha',
        'Pickle',
        'Vegetable Macroni',
        'Tomato Ketchup',
        'Idli with Sambhar',
        'Coconut Chutney',
        'Moong Sprouts',
        'Brown Bread',
        true
      ),
      LUNCH: [
        {
          sectionTitle: 'South Indian',
          items: [
            seasonalItem(
              'd12_lu_s2',
              'Main Veg 1',
              'Beans Tomato Aaloo Curry',
              'Palak Corn + Makairoti / Poori',
              'Drumstick Baigan Matar'
            ),
            item('d12_lu_s3', 'Staple Carbs 1', 'Soya Biryani', undefined, true),
            item('d12_lu_s1', 'Lentils 1 (Sambhar/Rasam)', 'Pappu Charu', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d12_lu_n1', 'Lentils 2', 'Punjabi Kadhi Pakoda', undefined, true),
            item('d12_lu_n2', 'Main Veg 2', 'Dum Aloo', undefined, true),
            item('d12_lu_n3', 'Staple Carbs 2', 'Plain Rice', undefined, false),
            item('d12_lu_n4', 'Curd / Raita', 'Majjiga Pulusu', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread & Salad',
          items: [
            item('d12_lu_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d12_lu_b2', 'Accompaniment', 'Green Salad', undefined, false),
          ],
        },
      ],
      SNACKS: buildSnacks(12, 'Kachouri', 'Aloo Sabji', 'Rooh Afza'),
      DINNER: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d12_di_s2', 'Main Veg 1', 'Avial', undefined, true),
            item('d12_di_s1', 'Lentils 1 (Sambhar/Rasam)', 'Senaga Pappu', undefined, false),
            item('d12_di_s3', 'Staple Carbs 1', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d12_di_n2', 'Main Veg 2', 'Manchurian', undefined, true),
            item('d12_di_n3', 'Staple Carbs 2', 'Fried Rice / Noodles', undefined, true),
            item('d12_di_n1', 'Lentils 2', 'White Chana', undefined, true),
          ],
        },
        {
          sectionTitle: 'Bread, Salad & Dessert',
          items: [
            item('d12_di_b3', 'Dessert', 'Boondi Laddu', undefined, true),
            item('d12_di_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d12_di_b2', 'Accompaniment', 'Green Salad', undefined, false),
          ],
        },
      ],
    },
  },

  // DAY 13: FRIDAY 2
  {
    cycleDayIndex: 13,
    pdfColumnName: 'Friday 2',
    dayOfWeekIndex: 5,
    weekNumber: 2,
    meals: {
      BREAKFAST: buildBreakfast(
        13,
        'Plain Prantha',
        'Soya Paneer Bhurji',
        'Aloo Bonda',
        'Coconut Chutney',
        'Vermicelli Upma',
        'Tomato Ketchup',
        'Mixed Cut Fruits',
        'White Bread',
        true
      ),
      LUNCH: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d13_lu_s2', 'Main Veg 1', 'Veg 65 / Cabbage 65', undefined, true),
            item('d13_lu_s1', 'Lentils 1 (Sambhar/Rasam)', 'Mysore Sambhar', undefined, true),
            item('d13_lu_s3', 'Staple Carbs 1', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d13_lu_n2', 'Main Veg 2', 'Soya Chaap Masala', undefined, true),
            item('d13_lu_n1', 'Lentils 2', 'Dal Palak', undefined, true),
            item('d13_lu_n3', 'Staple Carbs 2', 'Jeera Rice', undefined, false),
            item('d13_lu_n4', 'Curd / Raita', 'Plain Curd', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread & Salad',
          items: [
            item('d13_lu_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d13_lu_b2', 'Accompaniment', 'Fryums', undefined, false),
          ],
        },
      ],
      SNACKS: buildSnacks(13, 'Dabeli', 'Imly Chutney', 'Coffee'),
      DINNER: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d13_di_s2', 'Main Veg 1', 'Kerala Urulai Roast', undefined, true),
            item('d13_di_s1', 'Lentils 1 (Sambhar/Rasam)', 'Meal Maker Curry', undefined, true),
            item('d13_di_s3', 'Staple Carbs 1', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d13_di_n1', 'Lentils 2', 'Dal Makhni', undefined, true),
            seasonalItem('d13_di_n2', 'Main Veg 2', 'Bhindi Masala', 'Palak Corn / Chana', 'Ghia Kofta Curry'),
            item('d13_di_n3', 'Staple Carbs 2', 'Vegetable Khichdi', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread, Salad & Dessert',
          items: [
            item('d13_di_b3', 'Dessert', 'Gajar Ka Halwa / Ice Cream', undefined, true),
            item('d13_di_b1', 'Indian Breads', 'Roti and Ajwain Roti', undefined, true),
            item('d13_di_b2', 'Accompaniment', 'Green Salad', undefined, false),
          ],
        },
      ],
    },
  },

  // DAY 14: SATURDAY 2
  {
    cycleDayIndex: 14,
    pdfColumnName: 'Saturday 2',
    dayOfWeekIndex: 6,
    weekNumber: 2,
    meals: {
      BREAKFAST: buildBreakfast(
        14,
        'Stuffed Aloo Onion Prantha',
        'Packed Curd',
        'Indori Poha',
        'Tomato Ketchup',
        'Medu Vada with Sambhar',
        'Peanut Chutney',
        'Soyaseed Sprouts',
        'Brown Bread',
        true
      ),
      LUNCH: [
        {
          sectionTitle: 'South Indian',
          items: [
            item('d14_lu_s3', 'Staple Carbs 1', 'Andhara Veg Biryani', undefined, true),
            item('d14_lu_s2', 'Main Veg 1', 'Aloo Gadda Vepudu', undefined, true),
            item('d14_lu_s1', 'Lentils 1 (Sambhar/Rasam)', 'Cabbage Pappu', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d14_lu_n2', 'Main Veg 2', 'Kadai Paneer', undefined, true),
            item('d14_lu_n1', 'Lentils 2', 'Rajma', undefined, true),
            item('d14_lu_n4', 'Curd / Raita', 'Dahi Bhalla', undefined, true),
            item('d14_lu_n3', 'Staple Carbs 2', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread & Salad',
          items: [
            item('d14_lu_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d14_lu_b2', 'Accompaniment', 'Green Salad and Imly Chutney', undefined, false),
          ],
        },
      ],
      SNACKS: buildSnacks(14, 'Maggi', undefined, 'Tang'),
      DINNER: [
        {
          sectionTitle: 'South Indian',
          items: [
            seasonalItem('d14_di_s2', 'Main Veg 1', 'Arbi Pulusu', 'Turnip Peas Curry', 'Beans Dum Fry'),
            item('d14_di_s3', 'Staple Carbs 1', 'Bisi Belle Bath', undefined, true),
            item('d14_di_s1', 'Lentils 1 (Sambhar/Rasam)', 'Pepper Rasam', undefined, false),
          ],
        },
        {
          sectionTitle: 'North Indian',
          items: [
            item('d14_di_n1', 'Lentils 2', 'Panchratani Dal', undefined, true),
            item('d14_di_n2', 'Main Veg 2', 'Mix Veg', undefined, true),
            item('d14_di_n3', 'Staple Carbs 2', 'Plain Rice', undefined, false),
          ],
        },
        {
          sectionTitle: 'Bread, Salad & Dessert',
          items: [
            item('d14_di_b3', 'Dessert', 'Fruit Custard', undefined, true),
            item('d14_di_b1', 'Indian Breads', 'Roti', undefined, false),
            item('d14_di_b2', 'Accompaniment', 'Fryums', undefined, false),
          ],
        },
      ],
    },
  },
];

export const MESS_SERVICES_NOTES = [
  {
    title: 'Soft Food & Sick Diet',
    detail: 'Available on request via UMS for unwell residents (khichdi, dalia, plain toast).',
  },
  {
    title: 'Packed Breakfast & Lunch Box',
    detail: 'Request in advance through UMS if you have early morning classes or off-campus labs.',
  },
  {
    title: 'Fasting Meals & Warm Water',
    detail: 'Fasting meal options on major festivals and warm drinking water available at the mess counter.',
  },
  {
    title: 'Extra Milk & Fruits',
    detail: 'Available as add-ons per Mess Services 2026–2027 guidelines.',
  },
];
