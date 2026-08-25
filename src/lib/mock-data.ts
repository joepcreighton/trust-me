export type Category = "Beauty" | "Home" | "Health" | "Fitness" | "Pets" | "Other";
export type SubCategory =
  | "Hair" | "Nails" | "Brows" | "Skin" | "Lashes"
  | "Cleaning" | "Handyman"
  | "Doctor" | "Dentist" | "Therapy"
  | "Trainer" | "Yoga" | "Gym"
  | "Vet" | "Groomer"
  | "Other";

export type Gender = "woman" | "man" | "non-binary" | "prefer-not-to-say";

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  cities?: string[];
  gender?: Gender;
  friends: string[];
}

export interface Recommendation {
  id: string;
  recommenderId: string;
  businessName: string;
  serviceProvider?: string;
  providerId?: string;
  category: Category;
  subCategory: string;
  city: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  blurb: string;
  photo?: string;
  timestamp: string;
  likesCount: number;
  vouches: string[];
  commentCount: number;
  reservations?: boolean;
  delivery?: boolean;
  openNow?: boolean;
  website?: string;
  phone?: string;
}

// Ava's mock location for map center and "Recs Nearby" filter
export const avaLocation = { lat: 40.7128, lng: -74.006 };

export const currentUser: User = {
  id: "ava",
  name: "Ava Chen",
  username: "avachen",
  avatar: "https://i.pravatar.cc/150?u=ava-chen",
  bio: "I only share what I'd genuinely tell a close friend.",
  cities: ["New York City", "San Diego", "Denver"],
  gender: "woman",
  friends: ["maya", "sarah", "katie", "priya", "zoe", "emma", "lily", "nadia"],
};

export const users: User[] = [
  currentUser,
  {
    id: "maya", name: "Maya Reyes", username: "mayar", avatar: "https://i.pravatar.cc/150?u=maya-reyes",
    cities: ["New York City", "Chicago"],
    friends: ["ava", "sarah", "katie", "nadia", "chloe"],
  },
  {
    id: "sarah", name: "Sarah Kim", username: "sarahk", avatar: "https://i.pravatar.cc/150?u=sarah-kim",
    cities: ["Chicago"],
    friends: ["ava", "maya", "katie", "emma", "hannah"],
  },
  {
    id: "katie", name: "Katie Walsh", username: "katiew", avatar: "https://i.pravatar.cc/150?u=katie-walsh",
    cities: ["Los Angeles"],
    friends: ["ava", "maya", "sarah", "priya", "jasmine"],
  },
  {
    id: "priya", name: "Priya Sharma", username: "priyaS", avatar: "https://i.pravatar.cc/150?u=priya-sharma",
    cities: ["Austin"],
    friends: ["ava", "katie", "zoe", "nadia", "jasmine"],
  },
  {
    id: "zoe", name: "Zoe Laurent", username: "zoelau", avatar: "https://i.pravatar.cc/150?u=zoe-laurent",
    cities: ["Denver", "Los Angeles"],
    friends: ["ava", "priya", "emma", "lily", "chloe"],
  },
  {
    id: "emma", name: "Emma Park", username: "emmapark", avatar: "https://i.pravatar.cc/150?u=emma-park",
    cities: ["New York City", "Boston"],
    friends: ["ava", "sarah", "zoe", "lily", "mia"],
  },
  {
    id: "lily", name: "Lily Thompson", username: "lilyt", avatar: "https://i.pravatar.cc/150?u=lily-thompson",
    cities: ["Brooklyn"],
    friends: ["ava", "zoe", "emma", "nadia", "chloe"],
  },
  {
    id: "nadia", name: "Nadia Hassan", username: "nadiah", avatar: "https://i.pravatar.cc/150?u=nadia-hassan",
    cities: ["Miami", "New York City"],
    friends: ["ava", "maya", "priya", "lily", "jasmine"],
  },
  {
    id: "chloe", name: "Chloe Martin", username: "chloem", avatar: "https://i.pravatar.cc/150?u=chloe-martin",
    friends: ["maya", "zoe", "lily", "hannah", "olivia"],
  },
  {
    id: "hannah", name: "Hannah Brooks", username: "hannahb", avatar: "https://i.pravatar.cc/150?u=hannah-brooks",
    friends: ["sarah", "chloe", "mia", "sofia"],
  },
  {
    id: "jasmine", name: "Jasmine Wu", username: "jasminew", avatar: "https://i.pravatar.cc/150?u=jasmine-wu",
    friends: ["katie", "priya", "nadia", "olivia", "aisha"],
  },
  {
    id: "olivia", name: "Olivia Russo", username: "oliviar", avatar: "https://i.pravatar.cc/150?u=olivia-russo",
    friends: ["chloe", "jasmine", "mia", "aisha"],
  },
  {
    id: "mia", name: "Mia Johnson", username: "miaj", avatar: "https://i.pravatar.cc/150?u=mia-johnson",
    friends: ["emma", "hannah", "olivia", "sofia"],
  },
  {
    id: "aisha", name: "Aisha Okafor", username: "aishao", avatar: "https://i.pravatar.cc/150?u=aisha-okafor",
    friends: ["jasmine", "olivia", "sofia"],
  },
  {
    id: "sofia", name: "Sofia Mendez", username: "sofiam", avatar: "https://i.pravatar.cc/150?u=sofia-mendez",
    friends: ["hannah", "mia", "aisha"],
  },
];

export const avasDirectFriendIds = new Set(currentUser.friends);

export const CITY_NEIGHBORHOODS: Record<string, string[]> = {
  "New York City": [
    "Astoria", "Bay Ridge", "Brooklyn", "Bushwick", "Chelsea", "Crown Heights",
    "Flatiron", "Gowanus", "Greenpoint", "Harlem", "Hoboken", "LIC",
    "Manhattan", "Midtown", "Murray Hill", "Nolita", "Park Slope", "SoHo",
    "Upper East Side", "Upper West Side", "West Village", "Williamsburg",
  ],
  "San Diego": ["La Jolla", "North Park", "Pacific Beach", "Encinitas", "Solana Beach"],
  "Denver": ["Capitol Hill", "RiNo", "Cherry Creek", "LoDo", "Highlands"],
};

// ─── Ask types ────────────────────────────────────────────────────────────────

export interface AskReply {
  replierId: string;
  recId: string;
  note: string;
}

export interface Ask {
  id: string;
  askerId: string;
  question: string;
  category?: Category;
  timestamp: string;
  replies: AskReply[];
}

export const mockAsks: Ask[] = [
  {
    id: "a1",
    askerId: "emma",
    question: "Looking for a really good therapist in Brooklyn — specializes in anxiety, sliding scale preferred. Feeling overwhelmed by options. Help!",
    category: "Health",
    timestamp: "2026-08-18T14:00:00Z",
    replies: [
      { replierId: "mia", recId: "r13", note: "Dr. Kim Lee at Roots Therapy changed my life. Sliding scale from $40, telehealth too. DM me!" },
      { replierId: "sofia", recId: "r30", note: "The Therapy Collective in Williamsburg — all WOC therapists, group + individual. So good." },
    ],
  },
  {
    id: "a2",
    askerId: "priya",
    question: "Who does the best gel manicures in Williamsburg or BK that actually last 3 weeks?",
    category: "Beauty",
    timestamp: "2026-08-17T20:00:00Z",
    replies: [
      { replierId: "katie", recId: "r3", note: "MANI BY JEN. Hands down. Been going 2 years, never chips. Book her like a month out though." },
    ],
  },
  {
    id: "a3",
    askerId: "lily",
    question: "Need a solid handyman in Bushwick — TV mount + IKEA assembly. Not trying to get overcharged.",
    category: "Home",
    timestamp: "2026-08-17T11:00:00Z",
    replies: [
      { replierId: "jasmine", recId: "r11", note: "Marco from Fix It Right. Booked him last month — reasonable, no mansplaining, cleaned up after." },
    ],
  },
  {
    id: "a4",
    askerId: "zoe",
    question: "Hot yoga recs in West Village? Looking for somewhere non-intimidating for a beginner.",
    category: "Fitness",
    timestamp: "2026-08-16T16:00:00Z",
    replies: [
      { replierId: "priya", recId: "r19", note: "Studio Sol is SO welcoming for beginners. The intro offer is $40 for 2 weeks unlimited 🔥" },
    ],
  },
];

export const recommendations: Recommendation[] = [
  {
    id: "r1",
    recommenderId: "maya",
    businessName: "Maria's Color Studio",
    category: "Beauty", subCategory: "Hair",
    city: "Brooklyn, NY", neighborhood: "Brooklyn", lat: 40.6782, lng: -73.9442,
    blurb: "She's been doing my highlights for 3 years and I've never had brassy hair since. Book months in advance but SO worth it — she maps everything to your current base before touching anything.",
    photo: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    timestamp: "2026-08-17T09:30:00Z",
    likesCount: 31, vouches: ["sarah", "katie", "zoe", "emma", "lily"], commentCount: 8,
    reservations: true, openNow: true,
    phone: "(718) 555-0283",
  },
  {
    id: "r2",
    recommenderId: "sarah",
    businessName: "Dr. Ami Park, DDS",
    serviceProvider: "Dr. Ami Park", providerId: "p3",
    category: "Health", subCategory: "Dentist",
    city: "Manhattan, NY", neighborhood: "Manhattan", lat: 40.7614, lng: -73.9776,
    blurb: "The only dentist I've ever actually looked forward to seeing. Zero judgment, zero pain, and she explains every single thing before doing it. Takes most insurance.",
    timestamp: "2026-08-17T07:15:00Z",
    likesCount: 44, vouches: ["katie", "priya", "maya"], commentCount: 12,
    reservations: true, openNow: false,
    website: "https://dramparkdds.com", phone: "(212) 555-0192",
  },
  {
    id: "r3",
    recommenderId: "katie",
    businessName: "Mani by Jen",
    serviceProvider: "Jen Kim", providerId: "p2",
    category: "Beauty", subCategory: "Nails",
    city: "Williamsburg, NY", neighborhood: "Williamsburg", lat: 40.7081, lng: -73.9571,
    blurb: "Gel sets that genuinely last 3 weeks without a single chip. Tiny studio, always smells like jasmine tea. She's meticulous — she'll redo a nail before you even notice something's off.",
    photo: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
    timestamp: "2026-08-16T20:00:00Z",
    likesCount: 27, vouches: ["maya", "zoe", "hannah"], commentCount: 5,
    reservations: true, openNow: true,
  },
  {
    id: "r4",
    recommenderId: "priya",
    businessName: "Spotless Home Co.",
    category: "Home", subCategory: "Cleaning",
    city: "Hoboken, NJ", neighborhood: "Hoboken", lat: 40.744, lng: -74.0324,
    blurb: "Maria and her team have cleaned my apartment for 2 years. They reorganize while they clean — I come home to a better version of my apartment every single time.",
    photo: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80",
    timestamp: "2026-08-16T14:00:00Z",
    likesCount: 19, vouches: ["nadia", "emma"], commentCount: 4,
    reservations: true, openNow: false,
  },
  {
    id: "r5",
    recommenderId: "zoe",
    businessName: "Flow & Glow Yoga",
    serviceProvider: "Elena Vasquez", providerId: "p1",
    category: "Fitness", subCategory: "Yoga",
    city: "Park Slope, NY", neighborhood: "Park Slope", lat: 40.6726, lng: -73.9769,
    blurb: "Sunday morning classes with Elena will reset your entire week. The studio is small and she actually knows your name. I've tried 10 studios and this one is the only one I've stayed with.",
    photo: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80",
    timestamp: "2026-08-16T10:30:00Z",
    likesCount: 38, vouches: ["lily", "hannah", "chloe", "mia"], commentCount: 9,
    reservations: false, openNow: true,
    website: "https://flowandglowyoga.studio", phone: "(718) 555-0419",
  },
  {
    id: "r6",
    recommenderId: "emma",
    businessName: "The Brow Studio by Nina",
    category: "Beauty", subCategory: "Brows",
    city: "SoHo, NY", neighborhood: "SoHo", lat: 40.7233, lng: -74.003,
    blurb: "Nina saved my over-tweezed 2009 brows. She does microblading + threading and maps everything perfectly to your face shape — no cookie cutter arches here.",
    timestamp: "2026-08-15T18:00:00Z",
    likesCount: 52, vouches: ["sarah", "katie", "priya", "aisha", "sofia"], commentCount: 14,
    reservations: true, openNow: true,
  },
  {
    id: "r7",
    recommenderId: "lily",
    businessName: "Dr. Yemi Osei, MD",
    category: "Health", subCategory: "Doctor",
    city: "Midtown, NY", neighborhood: "Midtown", lat: 40.7549, lng: -73.984,
    blurb: "A GP who actually listens. Books within a week, takes most insurance, and sends a text summary of your visit. I didn't know this was possible.",
    timestamp: "2026-08-15T12:00:00Z",
    likesCount: 61, vouches: ["maya", "sarah", "chloe"], commentCount: 17,
    reservations: true, openNow: false,
    website: "https://dryemiosei.com", phone: "(212) 555-0147",
  },
  {
    id: "r8",
    recommenderId: "nadia",
    businessName: "The Cleaning Collective",
    category: "Home", subCategory: "Cleaning",
    city: "Astoria, NY", neighborhood: "Astoria", lat: 40.7722, lng: -73.9301,
    blurb: "Deep cleaned my entire 2BR in under 3 hours. Bring your own eco supplies or they'll use theirs for a small fee. Left my bathroom looking genuinely new.",
    timestamp: "2026-08-15T08:00:00Z",
    likesCount: 15, vouches: ["priya"], commentCount: 3,
    openNow: true,
  },
  {
    id: "r9",
    recommenderId: "chloe",
    businessName: "Lash Lab NYC — Chloe T.",
    category: "Beauty", subCategory: "Lashes",
    city: "Upper East Side, NY", neighborhood: "Upper East Side", lat: 40.7735, lng: -73.9565,
    blurb: "Best lash tech I've found in the city. Natural set that still lasts 6 weeks. My lashes have never looked more 'mine' — she takes your eye shape into account.",
    timestamp: "2026-08-14T16:00:00Z",
    likesCount: 29, vouches: ["emma", "lily", "jasmine"], commentCount: 6,
    reservations: true, openNow: true,
  },
  {
    id: "r10",
    recommenderId: "hannah",
    businessName: "Westside Dermatology — Dr. Patel",
    category: "Health", subCategory: "Skin",
    city: "Chelsea, NY", neighborhood: "Chelsea", lat: 40.7465, lng: -74.0014,
    blurb: "Board certified, no upsells, and she actually looked at my face for more than 30 seconds. Getting a derm I actually trust was genuinely life-changing.",
    photo: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80",
    timestamp: "2026-08-14T11:00:00Z",
    likesCount: 47, vouches: ["maya", "sarah", "katie", "zoe"], commentCount: 11,
    reservations: true, openNow: false,
  },
  {
    id: "r11",
    recommenderId: "jasmine",
    businessName: "Fix It Right Handyman — Marco",
    serviceProvider: "Marco Santos", providerId: "p4",
    category: "Home", subCategory: "Handyman",
    city: "Bushwick, NY", neighborhood: "Bushwick", lat: 40.6944, lng: -73.9213,
    blurb: "Mounted my TV, fixed a leaky faucet, and assembled IKEA furniture all in one afternoon. Reasonable rates, no mansplaining, actually cleaned up after himself.",
    timestamp: "2026-08-13T19:00:00Z",
    likesCount: 22, vouches: ["nadia", "priya"], commentCount: 5,
    openNow: true,
  },
  {
    id: "r13",
    recommenderId: "mia",
    businessName: "Roots Therapy — Dr. Kim Lee",
    category: "Health", subCategory: "Therapy",
    city: "Flatiron, NY", neighborhood: "Flatiron", lat: 40.7401, lng: -73.9903,
    blurb: "Specializes in anxiety and life transitions. Takes sliding scale. I've been going for a year and I'm a completely different person. Telehealth available.",
    timestamp: "2026-08-12T20:00:00Z",
    likesCount: 74, vouches: ["sarah", "chloe", "hannah", "sofia"], commentCount: 22,
    reservations: true, openNow: false,
    website: "https://rootstherapynyc.com",
  },
  {
    id: "r14",
    recommenderId: "aisha",
    businessName: "Golden Hour Nails",
    serviceProvider: "Jen Kim", providerId: "p2",
    category: "Beauty", subCategory: "Nails",
    city: "Crown Heights, NY", neighborhood: "Crown Heights", lat: 40.6736, lng: -73.9466,
    blurb: "Nail art that's actually worth posting. They do gel, dip, and bio-gel. Prices are genuinely fair and they never rush you — you're there as long as you need.",
    timestamp: "2026-08-12T15:00:00Z",
    likesCount: 33, vouches: ["katie", "emma", "jasmine"], commentCount: 7,
    openNow: true,
  },
  {
    id: "r15",
    recommenderId: "sofia",
    businessName: "Paws & Claws Vet Clinic",
    category: "Pets", subCategory: "Vet",
    city: "Greenpoint, NY", neighborhood: "Greenpoint", lat: 40.7291, lng: -73.9516,
    blurb: "Dr. Walsh treats my anxious rescue like royalty. She emails follow-ups after every appointment and has a 24h nurse hotline. I've never felt more confident as a dog mom.",
    timestamp: "2026-08-12T10:00:00Z",
    likesCount: 40, vouches: ["mia", "olivia"], commentCount: 8,
    reservations: true, openNow: true,
  },
  {
    id: "r16",
    recommenderId: "maya",
    businessName: "FitWith Alicia",
    category: "Fitness", subCategory: "Trainer",
    city: "Online",
    blurb: "Best money I spent last year. 4x/week personalized programming and she texts you if you skip. No shame, actual results. She meets you where you are.",
    photo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    timestamp: "2026-08-11T18:00:00Z",
    likesCount: 45, vouches: ["zoe", "priya", "hannah"], commentCount: 10,
    delivery: true, openNow: true,
  },
  {
    id: "r17",
    recommenderId: "sarah",
    businessName: "Bare Face Skin Studio",
    category: "Beauty", subCategory: "Skin",
    city: "Nolita, NY", neighborhood: "Nolita", lat: 40.723, lng: -73.996,
    blurb: "Got a customized facial and my skin hasn't been the same since — in the best way. She doesn't push products, but the ones she suggests genuinely work.",
    timestamp: "2026-08-11T12:00:00Z",
    likesCount: 28, vouches: ["emma", "aisha"], commentCount: 6,
    reservations: true, openNow: true,
  },
  {
    id: "r19",
    recommenderId: "priya",
    businessName: "Studio Sol — Hot Pilates",
    serviceProvider: "Elena Vasquez", providerId: "p1",
    category: "Fitness", subCategory: "Gym",
    city: "West Village, NY", neighborhood: "West Village", lat: 40.7336, lng: -74.003,
    blurb: "Changed my core strength in 4 weeks. The hot room sounds scary but you get used to it fast. They have a killer intro offer — 2 weeks unlimited for $40.",
    photo: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80",
    timestamp: "2026-08-10T10:00:00Z",
    likesCount: 36, vouches: ["zoe", "emma", "mia"], commentCount: 9,
    reservations: false, openNow: true,
  },
  {
    id: "r20",
    recommenderId: "zoe",
    businessName: "La Maison de Couleur — Isabelle",
    category: "Beauty", subCategory: "Hair",
    city: "Upper West Side, NY", neighborhood: "Upper West Side", lat: 40.787, lng: -73.9754,
    blurb: "Strictly by-referral colorist. She's the only person in NYC who can do a perfect sandy blonde on dark hair without a single visit looking brassy. 3-month waitlist, worth every day.",
    timestamp: "2026-08-09T14:00:00Z",
    likesCount: 58, vouches: ["maya", "sarah", "hannah"], commentCount: 15,
    reservations: true, openNow: false,
  },
  {
    id: "r21",
    recommenderId: "emma",
    businessName: "BK Dog Spa & Grooming",
    category: "Pets", subCategory: "Groomer",
    city: "Park Slope, NY", neighborhood: "Park Slope", lat: 40.6786, lng: -73.978,
    blurb: "They have a spa package with a blueberry facial and my doodle comes home smelling like an actual dream. No cage drying — they stay with your dog the whole time.",
    photo: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80",
    timestamp: "2026-08-09T09:00:00Z",
    likesCount: 42, vouches: ["sofia", "olivia", "mia"], commentCount: 11,
    reservations: true, openNow: true,
  },
  {
    id: "r23",
    recommenderId: "nadia",
    businessName: "ThreadLift Beauty Spa",
    category: "Beauty", subCategory: "Lashes",
    city: "Murray Hill, NY", neighborhood: "Murray Hill", lat: 40.7469, lng: -73.9791,
    blurb: "Specializes in lash lifts, not extensions. My natural lashes look 3x longer and I haven't touched a curler in 6 months. Lower maintenance than extensions, lower cost.",
    timestamp: "2026-08-08T12:00:00Z",
    likesCount: 34, vouches: ["chloe", "katie"], commentCount: 7,
    reservations: true, openNow: false,
  },
  {
    id: "r24",
    recommenderId: "chloe",
    businessName: "Dr. Simone Reyes, MD",
    category: "Health", subCategory: "Doctor",
    city: "Brooklyn, NY", neighborhood: "Brooklyn", lat: 40.686, lng: -73.944,
    blurb: "Female internist who takes a whole-body approach. She asked about stress, sleep, and nutrition before touching a prescription pad. Telehealth available too.",
    timestamp: "2026-08-07T16:00:00Z",
    likesCount: 53, vouches: ["hannah", "lily", "sarah"], commentCount: 14,
    reservations: true, openNow: true,
  },
  {
    id: "r25",
    recommenderId: "hannah",
    businessName: "Pure & Clean Service",
    category: "Home", subCategory: "Cleaning",
    city: "Bay Ridge, NY", neighborhood: "Bay Ridge", lat: 40.6353, lng: -74.0175,
    blurb: "Move-out cleaning legends. They got back my full security deposit when my landlord was already preparing to fight over it. Book 2 weeks out.",
    timestamp: "2026-08-07T10:00:00Z",
    likesCount: 26, vouches: ["nadia", "priya", "jasmine"], commentCount: 5,
    openNow: false,
  },
  {
    id: "r26",
    recommenderId: "jasmine",
    businessName: "Peaks Strength Collective",
    category: "Fitness", subCategory: "Gym",
    city: "LIC, NY", neighborhood: "LIC", lat: 40.7487, lng: -73.944,
    blurb: "Strength training gym with coaches who are genuinely invested in your progress. Group classes feel personal. Majority-women space — no bro culture whatsoever.",
    timestamp: "2026-08-06T15:00:00Z",
    likesCount: 37, vouches: ["zoe", "emma"], commentCount: 8,
    openNow: true,
  },
  {
    id: "r27",
    recommenderId: "olivia",
    businessName: "Color Theory Hair — Tara",
    category: "Beauty", subCategory: "Hair",
    city: "Astoria, NY", neighborhood: "Astoria", lat: 40.7722, lng: -73.9231,
    blurb: "Does the best keratin treatment in the outer boroughs at literally half the Manhattan price. My hair is still straight 4 months after one session.",
    timestamp: "2026-08-06T10:00:00Z",
    likesCount: 24, vouches: ["maya", "aisha"], commentCount: 6,
    reservations: true, openNow: false,
  },
  {
    id: "r29",
    recommenderId: "aisha",
    businessName: "Green Paws Holistic Vet",
    category: "Pets", subCategory: "Vet",
    city: "Harlem, NY", neighborhood: "Harlem", lat: 40.8116, lng: -73.9465,
    blurb: "Holistic vet who does acupuncture for animals (sounds woo but totally works). Managed my cat's hip problems without surgery. She explains every option clearly.",
    timestamp: "2026-08-05T12:00:00Z",
    likesCount: 18, vouches: ["sofia"], commentCount: 4,
    reservations: true, openNow: true,
  },
  {
    id: "r30",
    recommenderId: "sofia",
    businessName: "The Therapy Collective",
    category: "Health", subCategory: "Therapy",
    city: "Williamsburg, NY", neighborhood: "Williamsburg", lat: 40.7132, lng: -73.9535,
    blurb: "Group therapy + individual therapy under one roof. Community vibe, all therapists are WOC. Sliding scale starting at $40/session. Telehealth always available.",
    timestamp: "2026-08-04T16:00:00Z",
    likesCount: 68, vouches: ["mia", "chloe", "hannah", "nadia", "priya"], commentCount: 20,
    reservations: true, openNow: false,
  },
  {
    id: "r32",
    recommenderId: "sofia",
    businessName: "Meridian Acupuncture",
    category: "Health", subCategory: "Doctor",
    city: "Gowanus, NY", neighborhood: "Gowanus", lat: 40.674, lng: -73.9895,
    blurb: "Fixed my chronic shoulder tension after years of PT going nowhere. The practitioner takes 20 minutes just learning your history before touching a needle. Nothing woo — purely effective.",
    timestamp: "2026-08-02T14:00:00Z",
    likesCount: 29, vouches: [], commentCount: 5,
    reservations: true, openNow: false,
  },
];

// ─── Provider profiles ────────────────────────────────────────────────────────

export interface Provider {
  id: string;
  name: string;
  profession: string;
  avatar: string;
  businesses: string[];
  verified: boolean;
  bio: string;
}

export const providers: Provider[] = [
  {
    id: "p1",
    name: "Elena Vasquez",
    profession: "Yoga & Pilates Instructor",
    avatar: "https://i.pravatar.cc/150?u=elena-vasquez",
    businesses: ["Flow & Glow Yoga", "Studio Sol — Hot Pilates"],
    verified: true,
    bio: "200-hr YTT certified. Teaching hot yoga and pilates in NYC for 7 years. Specializes in alignment-based vinyasa and heated pilates — beginners welcome and encouraged.",
  },
  {
    id: "p2",
    name: "Jen Kim",
    profession: "Nail Technician",
    avatar: "https://i.pravatar.cc/150?u=jen-kim-nails",
    businesses: ["Mani by Jen", "Golden Hour Nails"],
    verified: true,
    bio: "10 years in nail art. Specializes in gel sets, bio-gel, and intricate nail art. Every set is custom-mapped to your nail shape, lifestyle, and vibe.",
  },
  {
    id: "p3",
    name: "Dr. Ami Park",
    profession: "Dentist, DDS",
    avatar: "https://i.pravatar.cc/150?u=dr-ami-park",
    businesses: ["Dr. Ami Park, DDS", "Midtown Dental Collective"],
    verified: true,
    bio: "Columbia Dental grad. Practicing for 12 years with a focus on anxiety-free dentistry. Always explains everything she's about to do — before she does it.",
  },
  {
    id: "p4",
    name: "Marco Santos",
    profession: "Handyman & Home Services",
    avatar: "https://i.pravatar.cc/150?u=marco-santos-hw",
    businesses: ["Fix It Right Handyman", "HomePro NYC"],
    verified: true,
    bio: "Licensed general contractor in NY & NJ. TV mounting, IKEA assembly, plumbing, electrical. 500+ clients across Brooklyn and Queens — always cleans up after.",
  },
];

// ─── External search fallback ─────────────────────────────────────────────────

export interface ExternalResult {
  id: string;
  businessName: string;
  category: Category;
  city: string;
  rating: number;
  reviewCount: number;
  source: "Yelp" | "Google";
  viewUrl: string;
  tasteMatch: number; // percentage 0–100
}

const EXTERNAL_RESULTS_POOL: ExternalResult[] = [
  { id: "ext-1",  businessName: "Glow Skin Studio",         category: "Beauty",  city: "Los Angeles, CA",    rating: 4.7, reviewCount: 312, source: "Yelp",   viewUrl: "https://yelp.com/biz/glow-skin-studio-la",               tasteMatch: 82 },
  { id: "ext-2",  businessName: "The Mindful Practice",      category: "Health",  city: "Brooklyn, NY",       rating: 4.9, reviewCount: 87,  source: "Google", viewUrl: "https://maps.google.com/?q=The+Mindful+Practice+Brooklyn", tasteMatch: 78 },
  { id: "ext-3",  businessName: "Apex Strength Studio",      category: "Fitness", city: "Austin, TX",         rating: 4.6, reviewCount: 214, source: "Google", viewUrl: "https://maps.google.com/?q=Apex+Strength+Studio+Austin",  tasteMatch: 74 },
  { id: "ext-4",  businessName: "Velvet Nail Lounge",        category: "Beauty",  city: "Miami, FL",          rating: 4.8, reviewCount: 503, source: "Yelp",   viewUrl: "https://yelp.com/biz/velvet-nail-lounge-miami",           tasteMatch: 71 },
  { id: "ext-5",  businessName: "Pacific Family Dental",     category: "Health",  city: "San Diego, CA",      rating: 4.9, reviewCount: 156, source: "Google", viewUrl: "https://maps.google.com/?q=Pacific+Family+Dental+San+Diego", tasteMatch: 86 },
  { id: "ext-6",  businessName: "Fresh Start Cleaning Co.",  category: "Home",    city: "Chicago, IL",        rating: 4.5, reviewCount: 289, source: "Yelp",   viewUrl: "https://yelp.com/biz/fresh-start-cleaning-chicago",       tasteMatch: 69 },
  { id: "ext-7",  businessName: "Happy Paws Grooming",       category: "Pets",    city: "Denver, CO",         rating: 4.8, reviewCount: 178, source: "Google", viewUrl: "https://maps.google.com/?q=Happy+Paws+Grooming+Denver",   tasteMatch: 77 },
  { id: "ext-8",  businessName: "Radiance Aesthetics",       category: "Beauty",  city: "Seattle, WA",        rating: 4.7, reviewCount: 421, source: "Yelp",   viewUrl: "https://yelp.com/biz/radiance-aesthetics-seattle",        tasteMatch: 83 },
  { id: "ext-9",  businessName: "Urban Handyman Pro",        category: "Home",    city: "New York City, NY",  rating: 4.6, reviewCount: 334, source: "Google", viewUrl: "https://maps.google.com/?q=Urban+Handyman+Pro+New+York",  tasteMatch: 72 },
  { id: "ext-10", businessName: "CoreFit Pilates",           category: "Fitness", city: "San Francisco, CA",  rating: 4.8, reviewCount: 267, source: "Yelp",   viewUrl: "https://yelp.com/biz/corefit-pilates-san-francisco",      tasteMatch: 80 },
];

// Deterministic shuffle so different queries surface different results.
export function getMockExternalResults(query: string, count = 5): ExternalResult[] {
  const h = [...query.toLowerCase()].reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0);
  return [...EXTERNAL_RESULTS_POOL]
    .sort((a, b) => ((h * 7 + a.id.charCodeAt(a.id.length - 1)) & 0xffff) - ((h * 7 + b.id.charCodeAt(b.id.length - 1)) & 0xffff))
    .slice(0, count);
}
