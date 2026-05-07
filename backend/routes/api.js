import { Router } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();

// Resolve file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");

const sitesFile = path.join(dataDir, "sites.json");
const productsFile = path.join(dataDir, "products.json");
const reviewsFile = path.join(dataDir, "reviews.json");

// ---------- Cache Helpers ----------
const CACHE_TTL = 60_000; // 60 seconds
const cache = new Map();
const inrFormatter = new Intl.NumberFormat("en-IN");

async function readJSON(key, file, fallback = []) {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && now - cached.loadedAt < CACHE_TTL) {
    return cached.data;
  }

  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    cache.set(key, { data: parsed, loadedAt: now });
    return parsed;
  } catch (err) {
    console.error(`[api] Failed to read ${file}`, err);
    cache.set(key, { data: fallback, loadedAt: now });
    return fallback;
  }
}

async function writeJSON(key, file, data) {
  try {
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
    cache.set(key, { data, loadedAt: Date.now() });
  } catch (err) {
    console.error(`[api] Failed to write ${file}`, err);
  }
}

async function getSites({ decorate = false } = {}) {
  const data = await readJSON("sites", sitesFile, []);
  if (!decorate) return data;

  const products = await readJSON("products", productsFile, []);
  return decorateSites(data, products);
}

async function getProducts() {
  const products = await readJSON("products", productsFile, []);
  return decorateProducts(products);
}

async function getReviews() {
  return readJSON("reviews", reviewsFile, []);
}

// ---------- Utility + Enrichment ----------
const DEFAULT_VISIT_DURATION = {
  nature: 150,
  culture: 120,
  adventure: 180,
};

const FOOD_NOTES = new Map([
  ["litti chokha", "Fire-roasted wheat dumplings served with spiced mashed vegetables."],
  ["handia", "Traditional fermented rice beverage served chilled."],
  ["thekua", "Crispy jaggery biscuits offered during festivals."],
  ["rugra curry", "Wild mushroom delicacy cooked with local spices."],
  ["pitha", "Rice cakes stuffed with coconut and jaggery."],
  ["chilka roti", "Fermented rice pancakes paired with spicy chutneys."],
  ["dhuska", "Deep fried rice-lentil breads served with potato curry."],
  ["kadhi bari", "Gram flour dumplings simmered in yogurt gravy."],
  ["bamboo shoot curry", "Smoky bamboo shoots cooked with mustard and chilies."],
  ["sel roti", "Sweet ring-shaped bread popular in the Himalayan region."],
  ["momos", "Steamed dumplings stuffed with vegetables or meat."],
  ["fish curry", "River fish simmered in mustard and tomato gravy."],
]);

const DEFAULT_FOOD_DESCRIPTION = "Regional speciality enjoyed by locals and travellers alike.";
const DEFAULT_MEAL_PLAN = [
  { name: "Seasonal Millet Breakfast", description: "Warm millet porridge with jaggery and fresh fruits." },
  { name: "Regional Thali Lunch", description: "Sampler platter with seasonal vegetables, dals and chutneys." },
  { name: "Chef's Special Dinner", description: "Curated dinner featuring fresh, locally sourced ingredients." },
];

const EARTH_RADIUS_KM = 6371;
const AVERAGE_SPEED_KMPH = 38;
const MIN_TRAVEL_MINUTES = 20;
const MAX_TRAVEL_VISIT_MINUTES = 9 * 60; // cap active sightseeing time per day

function decorateSites(list, productCatalog = []) {
  return Array.isArray(list) ? list.map((site) => decorateSite(site, productCatalog)) : [];
}

function decorateProducts(list) {
  return Array.isArray(list) ? list.map(decorateProduct) : [];
}

function decorateProduct(product) {
  if (!product) return product;

  return {
    ...product,
    image: normalizeAssetPath(product.image),
    category: product.category || "speciality",
  };
}

function decorateSite(site, productCatalog = []) {
  if (!site) return site;

  const visitMinutes = estimateVisitMinutes(site);
  const famousFoods = buildFoodSuggestions(site);
  const stayOptions = buildStayOptions(site);
  const localSpecialities = buildLocalSpecialities(site, productCatalog);
  const tourGuides = buildTourGuides(site);
  const entryFee = buildEntryFee(site);

  return {
    ...site,
    image: normalizeAssetPath(site.image),
    visitMinutes,
    visitTime: site.visitTime || formatDuration(visitMinutes),
    famousFoods,
    hotels: stayOptions,
    localSpecialities,
    tourGuides,
    entryFee,
    travelTime: site.travelTime || formatDuration(Math.max(45, Math.round(visitMinutes / 2))),
    travelTips: site.travelTips || "Carry reusable bottles, respect local customs, and keep the trail clean.",
  };
}

function normalizeAssetPath(value) {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("/")) return trimmed;
  return `/${trimmed}`;
}

function estimateVisitMinutes(site) {
  if (!site) return 120;

  if (typeof site.visitMinutes === "number" && site.visitMinutes > 0) {
    return site.visitMinutes;
  }
  if (typeof site.visitDurationMinutes === "number" && site.visitDurationMinutes > 0) {
    return site.visitDurationMinutes;
  }
  if (typeof site.visitTime === "string") {
    const parsed = parseDurationFromString(site.visitTime);
    if (parsed) return parsed;
  }

  const category = (site.category || "").toLowerCase();
  return DEFAULT_VISIT_DURATION[category] || 120;
}

function parseDurationFromString(input) {
  if (typeof input !== "string") return null;
  const hoursMatch = input.match(/(\d+(?:\.\d+)?)\s*hr/i);
  const minutesMatch = input.match(/(\d+(?:\.\d+)?)\s*min/i);

  let total = 0;
  if (hoursMatch) {
    total += parseFloat(hoursMatch[1]) * 60;
  }
  if (minutesMatch) {
    total += parseFloat(minutesMatch[1]);
  }

  return total > 0 ? Math.round(total) : null;
}

function buildFoodSuggestions(site) {
  const foods = Array.isArray(site?.famousFoods)
    ? site.famousFoods
    : Array.isArray(site?.foods)
      ? site.foods
      : [];

  const result = foods.map((name) => ({
    name,
    description: FOOD_NOTES.get(String(name).toLowerCase()) || DEFAULT_FOOD_DESCRIPTION,
  }));

  if (!result.length) {
    return DEFAULT_MEAL_PLAN.map((item) => ({ ...item }));
  }

  return result;
}

function buildStayOptions(site) {
  if (Array.isArray(site?.hotels) && site.hotels.length) {
    return site.hotels.map((entry, index) => ({
      name: entry.name || `${site.name || site.state || "Eco"} Stay ${index + 1}`,
      type: entry.type || "Homestay",
      priceINR: entry.priceINR || entry.price || Math.round((site.estimatedStayCost || 1800) * 0.9),
    }));
  }

  const baseName = (site?.name || "Eco Retreat").split(" ")[0];
  const stayCost = site?.estimatedStayCost || 1800;

  return [
    { name: `${baseName} Eco Lodge`, type: "Eco Lodge", priceINR: Math.round(stayCost * 1.1) },
    { name: `${site?.state || baseName} Heritage Homestay`, type: "Homestay", priceINR: Math.round(stayCost * 0.95) },
    { name: `${baseName} Riverside Camp`, type: "Camp", priceINR: Math.round(stayCost * 0.8) },
  ];
}

function buildEntryFee(site) {
  if (Number.isFinite(Number(site?.entryFee))) {
    return {
      amountINR: Math.max(0, Math.round(Number(site.entryFee))),
      label: `From ₹${inrFormatter.format(Math.max(0, Math.round(Number(site.entryFee))))} per visitor`,
    };
  }

  const category = String(site?.category || "").toLowerCase();
  const amountINR =
    category === "adventure" ? 180 :
    category === "culture" ? 120 :
    80;

  return {
    amountINR,
    label: `From ₹${inrFormatter.format(amountINR)} per visitor`,
  };
}

function buildLocalSpecialities(site, productCatalog = []) {
  const matchingProducts = productCatalog
    .filter((product) => (product.state || "").toLowerCase() === (site?.state || "").toLowerCase())
    .slice(0, 3)
    .map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description || "Locally loved speciality from regional artisans.",
      priceINR: Number(product.price) || 0,
      image: normalizeAssetPath(product.image),
      type: product.category || "speciality",
    }));

  if (matchingProducts.length) {
    return matchingProducts;
  }

  return buildFoodSuggestions(site).slice(0, 3).map((food, index) => ({
    id: `${site?.id || "site"}-speciality-${index + 1}`,
    name: food.name,
    description: food.description,
    priceINR: 120 + index * 80,
    image: "",
    type: "local speciality",
  }));
}

function buildTourGuides(site) {
  const firstWord = (site?.name || site?.state || "Heritage").split(" ")[0];
  const category = String(site?.category || "").toLowerCase();
  const guideTheme =
    category === "adventure" ? "treks, safety briefings, and outdoor routes" :
    category === "culture" ? "history walks, rituals, and local storytelling" :
    "nature trails, photography spots, and eco experiences";

  return [
    {
      id: `${site?.id || "site"}-guide-1`,
      name: `${firstWord} Explorer Guide`,
      languages: ["English", "Hindi"],
      experienceYears: 5,
      priceINR: 1500,
      speciality: `Best for ${guideTheme}.`,
    },
    {
      id: `${site?.id || "site"}-guide-2`,
      name: `${site?.state || "Local"} Heritage Host`,
      languages: ["English", "Hindi", "Local"],
      experienceYears: 8,
      priceINR: 2200,
      speciality: "Great for families, culture seekers, and flexible custom day tours.",
    },
  ];
}

function formatDuration(minutes) {
  if (!Number.isFinite(minutes)) return "—";
  if (minutes <= 0) return "0 min";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hrs && mins) return `${hrs} hr ${mins} min`;
  if (hrs) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
  return `${mins} min`;
}

function formatTime(minutesFromMidnight) {
  const minutes = Math.round(minutesFromMidnight);
  const hrs = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return 0;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function computeTravelSegment(fromPoint, toPoint) {
  if (!fromPoint || !toPoint) {
    return { minutes: 45, distanceKm: 25 };
  }

  const distanceKm = haversineDistanceKm(fromPoint.lat, fromPoint.lng, toPoint.lat, toPoint.lng);
  if (!Number.isFinite(distanceKm)) {
    return { minutes: 45, distanceKm: 25 };
  }

  const minutes = Math.max(
    MIN_TRAVEL_MINUTES,
    Math.round((distanceKm / AVERAGE_SPEED_KMPH) * 60 + 10)
  );

  return { minutes, distanceKm };
}

function normalizePoint(input) {
  if (!input) return null;

  if (Array.isArray(input) && input.length === 2) {
    const [lat, lng] = input.map((value) => Number(value));
    if ([lat, lng].every(Number.isFinite)) {
      return { lat, lng };
    }
    return null;
  }

  const lat = Number(input.lat);
  const lng = Number(input.lng ?? input.lon);

  if ([lat, lng].every(Number.isFinite)) {
    return { lat, lng };
  }

  return null;
}

function chunkSitesIntoDays({
  sites,
  startPoint,
  maxTravelVisitMinutes = MAX_TRAVEL_VISIT_MINUTES,
}) {
  if (!Array.isArray(sites) || !sites.length) {
    return [];
  }

  const assignments = [];
  let pointer = 0;
  let currentStart = normalizePoint(startPoint) || normalizePoint(sites[0]);

  while (pointer < sites.length) {
    const daySites = [];
    let minutesUsed = 0;
    let lastPoint = currentStart;

    while (pointer < sites.length) {
      const site = sites[pointer];
      const travel = computeTravelSegment(lastPoint, site);
      const visitMinutes = site.visitMinutes || estimateVisitMinutes(site);
      const buffer = daySites.length === 0 ? 45 : 25;
      const projected = minutesUsed + travel.minutes + visitMinutes + buffer;

      if (!daySites.length && projected > maxTravelVisitMinutes) {
        daySites.push(site);
        pointer += 1;
        minutesUsed = maxTravelVisitMinutes;
        lastPoint = { lat: site.lat, lng: site.lng };
        break;
      }

      if (daySites.length && projected > maxTravelVisitMinutes) {
        break;
      }

      daySites.push(site);
      minutesUsed = Math.min(projected, maxTravelVisitMinutes);
      pointer += 1;
      lastPoint = { lat: site.lat, lng: site.lng };

      if (projected >= maxTravelVisitMinutes) {
        break;
      }
    }

    assignments.push({
      sites: daySites,
      startPoint: currentStart,
    });

    currentStart = daySites.length
      ? { lat: daySites[daySites.length - 1].lat, lng: daySites[daySites.length - 1].lng }
      : currentStart;
  }

  return assignments;
}

function selectMeals(foodsPool, dayIndex) {
  const source = foodsPool?.length ? foodsPool : DEFAULT_MEAL_PLAN;
  const wrapPick = (offset, fallback) => {
    if (!source.length) return { ...fallback };
    const item = source[(dayIndex + offset) % source.length] || fallback;
    return { ...item };
  };

  return {
    breakfast: wrapPick(0, DEFAULT_MEAL_PLAN[0]),
    lunch: wrapPick(1, DEFAULT_MEAL_PLAN[1]),
    dinner: wrapPick(2, DEFAULT_MEAL_PLAN[2]),
  };
}

function buildDayPlan({ dayIndex, daySites, startPoint, foodsPool }) {
  const timeline = [];
  const summary = {
    travelMinutes: 0,
    activitiesMinutes: 0,
    mealsMinutes: 0,
    restMinutes: 0,
    sleepMinutes: 0,
    distanceKm: 0,
  };

  let current = 7 * 60; // Start day at 07:00
  const normalizedStart = normalizePoint(startPoint);
  const registerSlot = (type, minutes, label, meta = {}) => {
    if (!Number.isFinite(minutes) || minutes <= 0) return null;
    const startMinutes = current;
    const start = formatTime(startMinutes);
    current += minutes;
    const end = formatTime(current);

    const slot = {
      type,
      label,
      minutes,
      start,
      end,
      ...meta,
    };

    timeline.push(slot);

    switch (type) {
      case "travel":
        summary.travelMinutes += minutes;
        if (Number.isFinite(meta.distanceKm)) {
          summary.distanceKm += meta.distanceKm;
        }
        break;
      case "visit":
        summary.activitiesMinutes += minutes;
        break;
      case "food":
        summary.mealsMinutes += minutes;
        break;
      case "rest":
        summary.restMinutes += minutes;
        break;
      case "sleep":
        summary.sleepMinutes += minutes;
        break;
      default:
        break;
    }

    return slot;
  };

  const meals = selectMeals(foodsPool, dayIndex);
  registerSlot("food", 45, `Breakfast: ${meals.breakfast.name}`, {
    context: meals.breakfast.description,
    mealType: "breakfast",
  });

  let previousPoint =
    normalizedStart ||
    (daySites[0]
      ? { lat: daySites[0].lat, lng: daySites[0].lng }
      : null);
  let lastVisitedPoint = previousPoint;

  const daySitesDetail = [];

  if (!daySites.length) {
    registerSlot("rest", 120, "Guided local experience & sightseeing");
    registerSlot("food", 50, `Lunch: ${meals.lunch.name}`, {
      context: meals.lunch.description,
      mealType: "lunch",
    });
    registerSlot("rest", 90, "Free time for shopping or cultural workshops");
  } else {
    daySites.forEach((site, index) => {
      const travel = computeTravelSegment(previousPoint, site);
      const travelSlot = registerSlot("travel", travel.minutes, `Travel to ${site.name}`, {
        siteId: site.id,
        distanceKm: Number(travel.distanceKm.toFixed(1)),
      });

      const visitSlot = registerSlot(
        "visit",
        site.visitMinutes,
        `Explore ${site.name}`,
        {
          siteId: site.id,
          site,
        }
      );

      daySitesDetail.push({
        ...site,
        arrivalTime: visitSlot?.start,
        departureTime: visitSlot?.end,
        visitDurationFormatted: formatDuration(site.visitMinutes),
        travelMinutesFromPrevious: travelSlot?.minutes || null,
        travelDurationFormatted: travelSlot ? formatDuration(travelSlot.minutes) : null,
        travelDistanceKmFromPrevious: travelSlot?.distanceKm ?? null,
      });

      if (index === 0) {
        registerSlot("rest", 20, "Hydration & photo break");
        registerSlot("food", 50, `Lunch: ${meals.lunch.name}`, {
          context: meals.lunch.description,
          mealType: "lunch",
        });
      } else {
        registerSlot("rest", 15, "Travel buffer & refreshments");
      }

      if (index === daySites.length - 1) {
        registerSlot("rest", 30, "Souvenir shopping & sunset views");
      }

      previousPoint = { lat: site.lat, lng: site.lng };
      lastVisitedPoint = previousPoint;
    });
  }

  registerSlot("food", 60, `Dinner: ${meals.dinner.name}`, {
    context: meals.dinner.description,
    mealType: "dinner",
  });
  registerSlot("rest", 40, "Evening unwind & plan for next day");
  registerSlot("sleep", 480, "Overnight stay & rest");

  const totalDayTimeMinutes =
    summary.travelMinutes +
    summary.activitiesMinutes +
    summary.mealsMinutes +
    summary.restMinutes +
    summary.sleepMinutes;

  const mealsMapped = timeline
    .filter((slot) => slot.mealType)
    .reduce((acc, slot) => {
      acc[slot.mealType] = {
        name: slot.label.replace(/^[^:]+:\s*/, ""),
        description: slot.context,
        time: `${slot.start} – ${slot.end}`,
      };
      return acc;
    }, {});

  return {
    day: dayIndex + 1,
    sites: daySitesDetail,
    timeline,
    meals: mealsMapped,
    summary: {
      travelMinutes: summary.travelMinutes,
      activitiesMinutes: summary.activitiesMinutes,
      mealsMinutes: summary.mealsMinutes,
      restMinutes: summary.restMinutes,
      sleepMinutes: summary.sleepMinutes,
      distanceKm: Number(summary.distanceKm.toFixed(1)),
    },
    totalDayTimeMinutes,
    totalDayTimeFormatted: formatDuration(totalDayTimeMinutes),
    awakeTimeFormatted: formatDuration(
      totalDayTimeMinutes - summary.sleepMinutes
    ),
    endPoint: lastVisitedPoint || normalizedStart || null,
  };
}

function buildItineraryPlan({ days, assignments = [], startPoint, foodsPool = [] }) {
  const plan = [];
  let nextStartPoint = normalizePoint(startPoint) || normalizePoint(assignments[0]?.startPoint);
  const safeFoodsPool = Array.isArray(foodsPool) ? foodsPool : [];

  for (let i = 0; i < days; i += 1) {
    const assignment = assignments[i] || { sites: [] };
    const effectiveStart =
      nextStartPoint ||
      normalizePoint(assignment.startPoint) ||
      normalizePoint(assignment.sites?.[0]);

    const dayPlan = buildDayPlan({
      dayIndex: i,
      daySites: assignment.sites || [],
      startPoint: effectiveStart,
      foodsPool: safeFoodsPool,
    });

    plan.push(dayPlan);
    nextStartPoint = dayPlan.endPoint || nextStartPoint;
  }

  return plan;
}

function buildOverallSummary(plan) {
  const totals = plan.reduce(
    (acc, day) => {
      acc.travelMinutes += day.summary.travelMinutes;
      acc.activitiesMinutes += day.summary.activitiesMinutes;
      acc.mealsMinutes += day.summary.mealsMinutes;
      acc.restMinutes += day.summary.restMinutes;
      acc.sleepMinutes += day.summary.sleepMinutes;
      acc.distanceKm += day.summary.distanceKm;
      return acc;
    },
    {
      travelMinutes: 0,
      activitiesMinutes: 0,
      mealsMinutes: 0,
      restMinutes: 0,
      sleepMinutes: 0,
      distanceKm: 0,
    }
  );

  const awakeMinutes =
    totals.travelMinutes + totals.activitiesMinutes + totals.mealsMinutes + totals.restMinutes;

  return {
    totalTravel: formatDuration(totals.travelMinutes),
    totalActivities: formatDuration(totals.activitiesMinutes),
    totalMealTime: formatDuration(totals.mealsMinutes),
    totalRest: formatDuration(totals.restMinutes),
    totalSleep: formatDuration(totals.sleepMinutes),
    awakeTimeFormatted: formatDuration(awakeMinutes),
    totalDistanceKm: Number(totals.distanceKm.toFixed(1)),
    avgDistancePerDay: Number((totals.distanceKm / plan.length || 0).toFixed(1)),
  };
}

function computeBudget(days, budgetKey, summary, sites) {
  const multipliers = {
    low: 0.85,
    medium: 1,
    high: 1.35,
  };

  const multiplier = multipliers[budgetKey] ?? multipliers.medium;
  const averageStay =
    sites.reduce((acc, site) => acc + (site.estimatedStayCost || 1800), 0) /
    (sites.length || 1);

  const accommodationPerNight = Math.max(900, Math.round(averageStay * multiplier));
  const foodPerDay = Math.max(350, Math.round(550 * multiplier));
  const distanceCost = (summary.totalDistanceKm || 0) * 6.5;
  const transportTotal = Math.max(
    400,
    Math.round((distanceCost + days * 220) * multiplier)
  );

  const estimatedTripBudget =
    accommodationPerNight * days + foodPerDay * days + transportTotal;

  return {
    accommodationPerNight: toINR(accommodationPerNight),
    foodPerDay: toINR(foodPerDay),
    transportTotal: toINR(transportTotal),
    estimatedTripBudget: toINR(estimatedTripBudget),
  };
}

function toINR(value) {
  return `₹${inrFormatter.format(Math.round(value))}`;
}

// ---------- STATES ----------
const states = [
  { code: "AN", name: "Andaman and Nicobar Islands", center: [11.7401, 92.6586] },
  { code: "AP", name: "Andhra Pradesh", center: [15.9129, 79.7400] },
  { code: "AR", name: "Arunachal Pradesh", center: [28.2180, 94.7278] },
  { code: "AS", name: "Assam", center: [26.2006, 92.9376] },
  { code: "BR", name: "Bihar", center: [25.0961, 85.3131] },
  { code: "CT", name: "Chhattisgarh", center: [21.2787, 81.8661] },
  { code: "GA", name: "Goa", center: [15.2993, 74.1240] },
  { code: "GJ", name: "Gujarat", center: [23.0225, 72.5714] },
  { code: "HR", name: "Haryana", center: [29.0588, 76.0856] },
  { code: "HP", name: "Himachal Pradesh", center: [31.1048, 77.1734] },
  { code: "JH", name: "Jharkhand", center: [23.3441, 85.3096] },
  { code: "KA", name: "Karnataka", center: [12.9716, 77.5946] },
  { code: "KL", name: "Kerala", center: [10.8505, 76.2711] },
  { code: "MP", name: "Madhya Pradesh", center: [22.9734, 78.6569] },
  { code: "MH", name: "Maharashtra", center: [19.0760, 72.8777] },
  { code: "MN", name: "Manipur", center: [24.6637, 93.9063] },
  { code: "ML", name: "Meghalaya", center: [25.4670, 91.3662] },
  { code: "MZ", name: "Mizoram", center: [23.1645, 92.9376] },
  { code: "NL", name: "Nagaland", center: [26.1584, 94.5624] },
  { code: "OR", name: "Odisha", center: [20.9517, 85.0985] },
  { code: "PB", name: "Punjab", center: [30.7333, 76.7794] },
  { code: "RJ", name: "Rajasthan", center: [26.9124, 75.7873] },
  { code: "SK", name: "Sikkim", center: [27.5330, 88.5122] },
  { code: "TN", name: "Tamil Nadu", center: [11.1271, 78.6569] },
  { code: "TG", name: "Telangana", center: [17.3850, 78.4867] },
  { code: "TR", name: "Tripura", center: [23.9408, 91.9882] },
  { code: "UP", name: "Uttar Pradesh", center: [26.8467, 80.9462] },
  { code: "UK", name: "Uttarakhand", center: [30.0668, 79.0193] },
  { code: "WB", name: "West Bengal", center: [22.9868, 87.8550] },
];

// ---------- API ROUTES ----------

// GET all states
router.get("/states", (req, res) => {
  res.json({ states });
});

// GET sites by state
router.get("/sites", async (req, res) => {
  const { state } = req.query;
  const list = await getSites({ decorate: true });

  const result = state
    ? list.filter((s) => (s.state || "").toLowerCase() === state.toLowerCase())
    : list;

  res.json({ sites: result });
});

// ---------- ITINERARY ----------
router.get("/itinerary", async (req, res) => {
  try {
    const days = Number(req.query.days) || 3;
    const stateQuery = (req.query.state || "").toLowerCase();
    const interest = (req.query.interest || "all").toLowerCase();
    const budget = (req.query.budget || "medium").toLowerCase();
    const originLat = Number(req.query.originLat);
    const originLng = Number(req.query.originLng);
    const userOrigin =
      Number.isFinite(originLat) && Number.isFinite(originLng)
        ? { lat: originLat, lng: originLng }
        : null;
    const stateInfo = states.find((s) => s.name.toLowerCase() === stateQuery);
    const stateCenterPoint = stateInfo?.center
      ? { lat: stateInfo.center[0], lng: stateInfo.center[1] }
      : null;

    if (!stateQuery) {
      return res.status(400).json({ error: "State parameter is required." });
    }

    const sitesData = await getSites({ decorate: true });
    let filtered = sitesData.filter(
      (site) => (site.state || "").toLowerCase() === stateQuery
    );

    if (interest !== "all") {
      filtered = filtered.filter(
        (site) => (site.category || "").toLowerCase() === interest
      );
    }

    if (!filtered.length) {
      const fallbackPlan = buildItineraryPlan({
        days,
        assignments: [],
        startPoint: stateCenterPoint,
        foodsPool: [],
      });
      const fallbackSummary = buildOverallSummary(fallbackPlan);
      const fallbackMeals = [
        ...new Map(
          fallbackPlan.flatMap((day) => Object.values(day.meals || {}))
            .map((meal) => [meal.name, meal])
        ).values()
      ];

      return res.json({
        state: req.query.state,
        plan: fallbackPlan,
        totalSites: 0,
        summary: fallbackSummary,
        budgetBreakdown: computeBudget(days, budget, fallbackSummary, []),
        availableFoods: fallbackMeals,
        recommendedStays: [],
        maxDaysAvailable: 0,
      });
    }

    const startPoint =
      userOrigin ||
      stateCenterPoint ||
      (Number.isFinite(filtered[0]?.lat) && Number.isFinite(filtered[0]?.lng)
        ? { lat: filtered[0].lat, lng: filtered[0].lng }
        : null);

    const assignments = chunkSitesIntoDays({
      sites: filtered,
      startPoint,
    });

    const normalizedAssignments = assignments.length
      ? assignments
      : Array.from(
          { length: Math.ceil(filtered.length / 2) || 1 },
          (_, index) => ({
            sites: filtered.slice(index * 2, (index + 1) * 2),
            startPoint,
          })
        );

    const maxDaysAvailable = normalizedAssignments.length;

    if (maxDaysAvailable > 0 && days > maxDaysAvailable) {
      return res.status(400).json({
        error: `Itinerary available for up to ${maxDaysAvailable} day${maxDaysAvailable > 1 ? "s" : ""} based on ${filtered.length} place${filtered.length === 1 ? "" : "s"}. Please reduce the duration.`,
        maxDays: maxDaysAvailable,
        totalSites: filtered.length,
      });
    }

    const foodsPool = filtered.flatMap((site) => site.famousFoods || []);
    const planAssignments = normalizedAssignments.slice(0, days);
    const plan = buildItineraryPlan({
      days,
      assignments: planAssignments,
      startPoint,
      foodsPool,
    });

    const summary = buildOverallSummary(plan);
    const budgetBreakdown = computeBudget(days, budget, summary, filtered);
    const meals = [...new Map(
      plan.flatMap((day) => Object.values(day.meals || {}))
        .map((meal) => [meal.name, meal])
    ).values()];
    const recommendedStays = filtered
      .flatMap((site) => site.hotels || [])
      .slice(0, 6);

    res.json({
      state: req.query.state,
      plan,
      totalSites: filtered.length,
      summary,
      budgetBreakdown,
      availableFoods: meals,
      recommendedStays,
      maxDaysAvailable,
    });
  } catch (err) {
    console.error("[api] itinerary generation failed", err);
    res.status(500).json({ error: "Itinerary generation failed." });
  }
});

// ---------- Marketplace ----------
router.get("/marketplace", async (req, res) => {
  const { state } = req.query;
  const items = await getProducts();

  const result = state
    ? items.filter((p) => (p.state || "").toLowerCase() === state.toLowerCase())
    : items;

  res.json({ items: result });
});


// ---------- Demo Payment ----------
router.post("/payment/create-order", (req, res) => {
  const amount = Number(req.body?.amount);
  const currency = req.body?.currency || "INR";
  const items = Array.isArray(req.body?.items) ? req.body.items : [];

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "A positive amount is required." });
  }

  res.json({
    orderId: `order_${Date.now()}`,
    amount,
    currency,
    items,
    status: "created",
  });
});

router.post("/payment/verify", (req, res) => {
  const { orderId, paymentId, signature } = req.body || {};

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ error: "orderId, paymentId, and signature are required." });
  }

  res.json({ success: true, orderId, paymentId, status: "paid" });
});

// ---------- Reviews ----------
router.get("/sites/:id/reviews", async (req, res) => {
  const id = req.params.id;
  const allReviews = await getReviews();
  const siteReviews = allReviews.filter((r) => r.siteId === id);
  res.json({ reviews: siteReviews });
});

router.post("/sites/:id/reviews", async (req, res) => {
  const id = req.params.id;
  const { name, rating, text } = req.body;

  const review = {
    id: `rev_${Date.now()}`,
    siteId: id,
    name,
    rating,
    text,
    createdAt: new Date().toISOString(),
  };

  const allReviews = await getReviews();
  allReviews.push(review);
  await writeJSON("reviews", reviewsFile, allReviews);

  res.json({ success: true, review });
});
// ---------- ANALYTICS (supports optional siteId) ----------
router.get("/analytics", async (req, res) => {
  const { siteId } = req.query;

  try {
    const [sitesData, products] = await Promise.all([
      getSites({ decorate: true }),
      getProducts(),
    ]);

    let site = null;
    if (siteId) {
      site = sitesData.find((s) => s.id === siteId);
      if (!site) {
        return res.json({
          error: "Invalid siteId",
          visitorsByMonth: [],
          topSites: [],
          sentimentTrend: [],
          featuredProducts: [],
        });
      }
    }

    const visitorsByMonth = [800, 1200, 1500, 1800, 2100, 2600, 3200, 3000, 2400, 2000, 1700, 1400];

    const topSites = (site ? [site] : sitesData.slice(0, 10)).map((s) => ({
      name: s.name,
      visits: Math.floor(500 + Math.random() * 2500),
      category: s.category,
      state: s.state,
    }));

    const sentimentTrend = site
      ? [4.0, 4.2, 4.5, 4.1, 4.3, 4.4, 4.2, 4.5, 4.3, 4.4, 4.3, 4.2]
      : [3.8, 4.0, 4.1, 4.2, 4.1, 4.3, 4.4, 4.3, 4.2, 4.3, 4.1, 4.2];

    const featuredProducts = (products || [])
      .filter((item) => {
        if (!site) return true;
        return (item.state || "").toLowerCase() === (site.state || "").toLowerCase();
      })
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        description: item.description,
        category: item.category,
        state: item.state,
      }));

    res.json({
      site: site || null,
      visitorsByMonth,
      topSites,
      sentimentTrend,
      featuredProducts,
    });
  } catch (err) {
    console.error("[api] analytics error", err);
    res.status(500).json({ error: "Analytics unavailable" });
  }
});



export default router;
