import type { Category } from "./mock-data";

export interface OnboardingPlace {
  id: string;
  businessName: string;
  category: Category;
  subCategory: string;
  city: string;
  description: string;
  photo: string;
}

const IMG = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=75`;

export const ONBOARDING_PLACES: OnboardingPlace[] = [
  // ── New York City, NY ─────────────────────────────────────────────────────
  {
    id: "ob-nyc-1",
    businessName: "Levain Bakery",
    category: "Other",
    subCategory: "Bakery",
    city: "New York City, NY",
    description: "The thick chocolate chip cookie that started a movement.",
    photo: IMG("1509440159596-0249088772ff"),
  },
  {
    id: "ob-nyc-2",
    businessName: "Drybar",
    category: "Beauty",
    subCategory: "Blowout",
    city: "New York City, NY",
    description: "The blowout you'll be talking about for days.",
    photo: IMG("1522337360788-8b13dee7a37e"),
  },
  {
    id: "ob-nyc-3",
    businessName: "SoulCycle",
    category: "Fitness",
    subCategory: "Indoor Cycling",
    city: "New York City, NY",
    description: "The hardest 45 minutes of your week. Somehow addictive.",
    photo: IMG("1571902943202-507ec2618e8f"),
  },
  {
    id: "ob-nyc-4",
    businessName: "Sweetgreen",
    category: "Health",
    subCategory: "Salads",
    city: "New York City, NY",
    description: "The salad that made salads worth eating.",
    photo: IMG("1512621776951-a57141f2eefd"),
  },
  {
    id: "ob-nyc-5",
    businessName: "The Strand",
    category: "Other",
    subCategory: "Bookstore",
    city: "New York City, NY",
    description: "18 miles of books and one iconic New York afternoon.",
    photo: IMG("1481627834876-b7833e8f5c98"),
  },
  {
    id: "ob-nyc-6",
    businessName: "Exhale Spa",
    category: "Beauty",
    subCategory: "Spa",
    city: "New York City, NY",
    description: "Facials and massage packages that reset your entire week.",
    photo: IMG("1540555700478-4be289fbecef"),
  },
  {
    id: "ob-nyc-7",
    businessName: "Equinox",
    category: "Fitness",
    subCategory: "Gym",
    city: "New York City, NY",
    description: "Amenities that barely justify the monthly tab.",
    photo: IMG("1517836357463-d25dfeac3438"),
  },

  // ── Los Angeles, CA ───────────────────────────────────────────────────────
  {
    id: "ob-la-1",
    businessName: "Erewhon",
    category: "Health",
    subCategory: "Grocery",
    city: "Los Angeles, CA",
    description: "The smoothie bar alone makes it worth the pilgrimage.",
    photo: IMG("1543168256-4fa6b6d38b60"),
  },
  {
    id: "ob-la-2",
    businessName: "Barry's Bootcamp",
    category: "Fitness",
    subCategory: "HIIT",
    city: "Los Angeles, CA",
    description: "The Red Room will humble you. Come back anyway.",
    photo: IMG("1599058945522-28d584b6f0ff"),
  },
  {
    id: "ob-la-3",
    businessName: "Urth Caffé",
    category: "Other",
    subCategory: "Coffee",
    city: "Los Angeles, CA",
    description: "Organic coffee, beautiful patio. Very LA.",
    photo: IMG("1495474472229-d8a5afe5ce2a"),
  },
  {
    id: "ob-la-4",
    businessName: "Milk Bar",
    category: "Other",
    subCategory: "Bakery",
    city: "Los Angeles, CA",
    description: "Crack pie and birthday cake truffles. Dangerous to know about.",
    photo: IMG("1464349095431-e9a21285b5f3"),
  },
  {
    id: "ob-la-5",
    businessName: "Pressed Juicery",
    category: "Health",
    subCategory: "Juice Bar",
    city: "Los Angeles, CA",
    description: "The green cleanse you'll actually finish.",
    photo: IMG("1570197788417-0e82375c9371"),
  },
  {
    id: "ob-la-6",
    businessName: "Kinara Spa",
    category: "Beauty",
    subCategory: "Spa",
    city: "Los Angeles, CA",
    description: "Rosehip facials and staff who actually remember you.",
    photo: IMG("1519824145371-296894a0daa9"),
  },

  // ── Chicago, IL ───────────────────────────────────────────────────────────
  {
    id: "ob-chi-1",
    businessName: "Intelligentsia Coffee",
    category: "Other",
    subCategory: "Coffee",
    city: "Chicago, IL",
    description: "Where specialty coffee got serious in the midwest.",
    photo: IMG("1495474472229-d8a5afe5ce2a"),
  },
  {
    id: "ob-chi-2",
    businessName: "Stan's Donuts",
    category: "Other",
    subCategory: "Bakery",
    city: "Chicago, IL",
    description: "The Nutella pocket donut is a life event.",
    photo: IMG("1509440159596-0249088772ff"),
  },
  {
    id: "ob-chi-3",
    businessName: "CorePower Yoga",
    category: "Fitness",
    subCategory: "Yoga",
    city: "Chicago, IL",
    description: "Hot yoga that's actually hot, instructors who are actually good.",
    photo: IMG("1544367567-0f2fcb009e0b"),
  },
  {
    id: "ob-chi-4",
    businessName: "Waxing the City",
    category: "Beauty",
    subCategory: "Waxing",
    city: "Chicago, IL",
    description: "Clean, quick, and as painless as waxing gets.",
    photo: IMG("1522337360788-8b13dee7a37e"),
  },
  {
    id: "ob-chi-5",
    businessName: "Southport Grocery",
    category: "Other",
    subCategory: "Brunch",
    city: "Chicago, IL",
    description: "Weekend brunch with zero pretension and maximum comfort food.",
    photo: IMG("1414235077428-338989a2e8c0"),
  },

  // ── Austin, TX ────────────────────────────────────────────────────────────
  {
    id: "ob-atx-1",
    businessName: "JuiceLand",
    category: "Health",
    subCategory: "Juice Bar",
    city: "Austin, TX",
    description: "Austin institution. The Glow Up smoothie is not optional.",
    photo: IMG("1570197788417-0e82375c9371"),
  },
  {
    id: "ob-atx-2",
    businessName: "Congress Coffee",
    category: "Other",
    subCategory: "Coffee",
    city: "Austin, TX",
    description: "The most downtown you'll ever feel in a coffee shop.",
    photo: IMG("1495474472229-d8a5afe5ce2a"),
  },
  {
    id: "ob-atx-3",
    businessName: "CorePower Yoga",
    category: "Fitness",
    subCategory: "Yoga",
    city: "Austin, TX",
    description: "The C2 class will change your relationship with your body.",
    photo: IMG("1544367567-0f2fcb009e0b"),
  },
  {
    id: "ob-atx-4",
    businessName: "Franklin Barbecue",
    category: "Other",
    subCategory: "BBQ",
    city: "Austin, TX",
    description: "Get in line at 6am. Worth it. I can't explain why.",
    photo: IMG("1414235077428-338989a2e8c0"),
  },
  {
    id: "ob-atx-5",
    businessName: "Barton Springs Pool",
    category: "Fitness",
    subCategory: "Swimming",
    city: "Austin, TX",
    description: "A natural spring in the middle of the city. Peak Austin.",
    photo: IMG("1441974231531-c6227db76b6e"),
  },

  // ── Denver, CO ────────────────────────────────────────────────────────────
  {
    id: "ob-den-1",
    businessName: "Snooze AM Eatery",
    category: "Other",
    subCategory: "Breakfast",
    city: "Denver, CO",
    description: "Pancake flight. That's the review. Pancake flight.",
    photo: IMG("1414235077428-338989a2e8c0"),
  },
  {
    id: "ob-den-2",
    businessName: "Tattered Cover",
    category: "Other",
    subCategory: "Bookstore",
    city: "Denver, CO",
    description: "A bookstore that makes you believe in physical media again.",
    photo: IMG("1481627834876-b7833e8f5c98"),
  },
  {
    id: "ob-den-3",
    businessName: "CorePower Yoga",
    category: "Fitness",
    subCategory: "Yoga",
    city: "Denver, CO",
    description: "Where it all started. The OG location has the best energy.",
    photo: IMG("1544367567-0f2fcb009e0b"),
  },
  {
    id: "ob-den-4",
    businessName: "Earth Treks",
    category: "Fitness",
    subCategory: "Rock Climbing",
    city: "Denver, CO",
    description: "Bouldering walls for every level. Great community vibes.",
    photo: IMG("1517836357463-d25dfeac3438"),
  },
  {
    id: "ob-den-5",
    businessName: "Vital Root",
    category: "Health",
    subCategory: "Vegan",
    city: "Denver, CO",
    description: "Vegan food that doesn't make you feel like you're missing out.",
    photo: IMG("1512621776951-a57141f2eefd"),
  },

  // ── San Diego, CA ─────────────────────────────────────────────────────────
  {
    id: "ob-sd-1",
    businessName: "Bird Rock Coffee Roasters",
    category: "Other",
    subCategory: "Coffee",
    city: "San Diego, CA",
    description: "Single-origin roasts and a neighborhood vibe that's unbeatable.",
    photo: IMG("1495474472229-d8a5afe5ce2a"),
  },
  {
    id: "ob-sd-2",
    businessName: "Barry's Bootcamp",
    category: "Fitness",
    subCategory: "HIIT",
    city: "San Diego, CA",
    description: "Floor and treadmill intervals that'll completely rewire you.",
    photo: IMG("1599058945522-28d584b6f0ff"),
  },
  {
    id: "ob-sd-3",
    businessName: "Balboa Park",
    category: "Fitness",
    subCategory: "Outdoors",
    city: "San Diego, CA",
    description: "Morning runs through 1,200 acres of California's best green space.",
    photo: IMG("1441974231531-c6227db76b6e"),
  },
  {
    id: "ob-sd-4",
    businessName: "Urban Plates",
    category: "Health",
    subCategory: "Healthy Dining",
    city: "San Diego, CA",
    description: "Fast food done right. Real ingredients, real macros.",
    photo: IMG("1512621776951-a57141f2eefd"),
  },
  {
    id: "ob-sd-5",
    businessName: "Hotel del Coronado Spa",
    category: "Beauty",
    subCategory: "Spa",
    city: "San Diego, CA",
    description: "Oceanfront massage packages. Nothing compares.",
    photo: IMG("1540555700478-4be289fbecef"),
  },
];

export function getPlacesForCities(cities: string[]): OnboardingPlace[] {
  if (cities.length === 0) return ONBOARDING_PLACES;
  return ONBOARDING_PLACES.filter((p) => cities.includes(p.city));
}
