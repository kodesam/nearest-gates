from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


class Gate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    number: int
    name_en: str
    name_ar: str
    latitude: float
    longitude: float
    side: str


class Amenity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    latitude: float
    longitude: float
    description: str = ""


GATES_SEED = [
    {"id": "g1", "number": 1, "name_en": "King Abdul Aziz Gate", "name_ar": "باب الملك عبدالعزيز", "latitude": 21.4208, "longitude": 39.8252, "side": "south"},
    {"id": "g2", "number": 3, "name_en": "Bab Bani Shaybah", "name_ar": "باب بني شيبة", "latitude": 21.4210, "longitude": 39.8260, "side": "south"},
    {"id": "g3", "number": 5, "name_en": "Bab Al Nabi", "name_ar": "باب النبي", "latitude": 21.4207, "longitude": 39.8257, "side": "south"},
    {"id": "g4", "number": 7, "name_en": "Bab Ibrahim", "name_ar": "باب إبراهيم", "latitude": 21.4207, "longitude": 39.8247, "side": "south"},
    {"id": "g5", "number": 11, "name_en": "Bab Ali", "name_ar": "باب علي", "latitude": 21.4207, "longitude": 39.8268, "side": "south"},
    {"id": "g6", "number": 14, "name_en": "Bab Ajyad", "name_ar": "باب أجياد", "latitude": 21.4208, "longitude": 39.8275, "side": "south"},
    {"id": "g7", "number": 17, "name_en": "Bab Al Rahmah", "name_ar": "باب الرحمة", "latitude": 21.4210, "longitude": 39.8280, "side": "southeast"},
    {"id": "g8", "number": 20, "name_en": "Bab Al Mahkamah", "name_ar": "باب المحكمة", "latitude": 21.4212, "longitude": 39.8242, "side": "west"},
    {"id": "g9", "number": 25, "name_en": "Bab Al Qararah", "name_ar": "باب القرارة", "latitude": 21.4218, "longitude": 39.8241, "side": "west"},
    {"id": "g10", "number": 30, "name_en": "Bab Al Qutbi", "name_ar": "باب القطبي", "latitude": 21.4222, "longitude": 39.8240, "side": "west"},
    {"id": "g11", "number": 35, "name_en": "Bab Badr", "name_ar": "باب بدر", "latitude": 21.4228, "longitude": 39.8241, "side": "west"},
    {"id": "g12", "number": 42, "name_en": "Bab Al Malik Abdullah", "name_ar": "باب الملك عبدالله", "latitude": 21.4235, "longitude": 39.8242, "side": "west"},
    {"id": "g13", "number": 45, "name_en": "Bab Al Fatah", "name_ar": "باب الفتح", "latitude": 21.4240, "longitude": 39.8248, "side": "northwest"},
    {"id": "g14", "number": 46, "name_en": "Bab Al Umrah", "name_ar": "باب العمرة", "latitude": 21.4232, "longitude": 39.8242, "side": "west"},
    {"id": "g15", "number": 50, "name_en": "Bab Hamza", "name_ar": "باب حمزة", "latitude": 21.4237, "longitude": 39.8243, "side": "northwest"},
    {"id": "g16", "number": 55, "name_en": "Bab Al Ateeq", "name_ar": "باب العتيق", "latitude": 21.4243, "longitude": 39.8253, "side": "north"},
    {"id": "g17", "number": 62, "name_en": "Bab Al Mualla", "name_ar": "باب المعلا", "latitude": 21.4244, "longitude": 39.8258, "side": "north"},
    {"id": "g18", "number": 73, "name_en": "Bab Al Firdaws", "name_ar": "باب الفردوس", "latitude": 21.4243, "longitude": 39.8272, "side": "north"},
    {"id": "g19", "number": 79, "name_en": "King Fahd Gate", "name_ar": "باب الملك فهد", "latitude": 21.4244, "longitude": 39.8262, "side": "north"},
    {"id": "g20", "number": 80, "name_en": "Bab Al Balad", "name_ar": "باب البلد", "latitude": 21.4244, "longitude": 39.8256, "side": "north"},
    {"id": "g21", "number": 84, "name_en": "Bab Al Siddiq", "name_ar": "باب الصديق", "latitude": 21.4244, "longitude": 39.8268, "side": "north"},
    {"id": "g22", "number": 89, "name_en": "Bab As Salam", "name_ar": "باب السلام", "latitude": 21.4240, "longitude": 39.8284, "side": "east"},
    {"id": "g23", "number": 94, "name_en": "Bab Al Safa", "name_ar": "باب الصفا", "latitude": 21.4228, "longitude": 39.8284, "side": "east"},
    {"id": "g24", "number": 96, "name_en": "Bab Al Marwah", "name_ar": "باب المروة", "latitude": 21.4222, "longitude": 39.8283, "side": "east"},
    {"id": "g25", "number": 99, "name_en": "Bab Al Widaa", "name_ar": "باب الوداع", "latitude": 21.4215, "longitude": 39.8282, "side": "east"},
]

AMENITIES_SEED = [
    {"id": "a1", "name": "Al Baik Restaurant", "category": "restaurant", "latitude": 21.4195, "longitude": 39.8250, "description": "Famous Saudi fast food chain"},
    {"id": "a2", "name": "Kudu Restaurant", "category": "restaurant", "latitude": 21.4200, "longitude": 39.8290, "description": "Popular Saudi restaurant"},
    {"id": "a3", "name": "Hardees Ajyad", "category": "restaurant", "latitude": 21.4195, "longitude": 39.8270, "description": "International fast food"},
    {"id": "a4", "name": "Al Tazaj Grilled Chicken", "category": "restaurant", "latitude": 21.4250, "longitude": 39.8235, "description": "Grilled chicken restaurant"},
    {"id": "a5", "name": "Herfy Restaurant", "category": "restaurant", "latitude": 21.4248, "longitude": 39.8280, "description": "Saudi fast food chain"},
    {"id": "a6", "name": "BinDawood Supermarket", "category": "grocery", "latitude": 21.4200, "longitude": 39.8240, "description": "Large supermarket near Haram"},
    {"id": "a7", "name": "Al Raya Supermarket", "category": "grocery", "latitude": 21.4190, "longitude": 39.8260, "description": "Grocery and household items"},
    {"id": "a8", "name": "Panda Supermarket", "category": "grocery", "latitude": 21.4250, "longitude": 39.8295, "description": "Full-service supermarket"},
    {"id": "a9", "name": "Al Othaim Market", "category": "grocery", "latitude": 21.4255, "longitude": 39.8250, "description": "Grocery and daily essentials"},
    {"id": "a10", "name": "SAPTCO Bus Station", "category": "bus_stop", "latitude": 21.4180, "longitude": 39.8250, "description": "Main intercity bus terminal"},
    {"id": "a11", "name": "Ajyad Bus Stop", "category": "bus_stop", "latitude": 21.4195, "longitude": 39.8285, "description": "Local bus stop on Ajyad Road"},
    {"id": "a12", "name": "Al Haram Bus Terminal", "category": "bus_stop", "latitude": 21.4260, "longitude": 39.8240, "description": "Shuttle bus terminal"},
    {"id": "a13", "name": "King Abdul Aziz Rd Taxi", "category": "taxi_stand", "latitude": 21.4200, "longitude": 39.8235, "description": "Taxi stand on main road"},
    {"id": "a14", "name": "Ajyad Taxi Stand", "category": "taxi_stand", "latitude": 21.4190, "longitude": 39.8275, "description": "Taxi stand near Ajyad area"},
    {"id": "a15", "name": "Al Haram Taxi Stand", "category": "taxi_stand", "latitude": 21.4255, "longitude": 39.8265, "description": "Taxi stand near north gates"},
    {"id": "a16", "name": "Masjid Aisha (Taneem)", "category": "meqat", "latitude": 21.4435, "longitude": 39.8092, "description": "Nearest Meqat for Umrah from Makkah"},
    {"id": "a17", "name": "Al Hudaybiyah (Shumaysi)", "category": "meqat", "latitude": 21.4550, "longitude": 39.6980, "description": "Meqat on Jeddah-Makkah road"},
    {"id": "a18", "name": "Masjid Al Jiranah", "category": "meqat", "latitude": 21.5030, "longitude": 39.9090, "description": "Historic Meqat location"},
    {"id": "a19", "name": "Zamzam Tower Restaurant", "category": "restaurant", "latitude": 21.4192, "longitude": 39.8263, "description": "Restaurant in Zamzam Tower area"},
    {"id": "a20", "name": "Clock Tower Mall", "category": "grocery", "latitude": 21.4188, "longitude": 39.8257, "description": "Shopping and grocery in Abraj Al-Bait"},
]


@app.on_event("startup")
async def startup():
    gates_count = await db.gates.count_documents({})
    if gates_count == 0:
        for gate_data in GATES_SEED:
            gate = Gate(**gate_data)
            await db.gates.insert_one(gate.dict())
        logger.info(f"Seeded {len(GATES_SEED)} gates")

    amenities_count = await db.amenities.count_documents({})
    if amenities_count == 0:
        # Try fetching real data from OpenStreetMap first
        real_amenities = await fetch_osm_amenities()
        if real_amenities and len(real_amenities) > 5:
            for a in real_amenities:
                await db.amenities.insert_one(a)
            logger.info(f"Loaded {len(real_amenities)} real amenities from OpenStreetMap")
        else:
            for amenity_data in AMENITIES_SEED:
                amenity = Amenity(**amenity_data)
                await db.amenities.insert_one(amenity.dict())
            logger.info(f"Seeded {len(AMENITIES_SEED)} fallback amenities")


OVERPASS_API = "https://overpass-api.de/api/interpreter"
OVERPASS_QUERY = """[out:json][timeout:30];
(
  node["amenity"~"restaurant|fast_food|cafe"](around:1000,21.4225,39.8262);
  node["shop"~"supermarket|convenience|mall"](around:1000,21.4225,39.8262);
  node["highway"="bus_stop"](around:1000,21.4225,39.8262);
  node["amenity"="taxi"](around:1000,21.4225,39.8262);
  node["amenity"="place_of_worship"]["religion"="muslim"](around:5000,21.4225,39.8262);
);
out body 150;"""


async def fetch_osm_amenities():
    """Fetch real amenities from OpenStreetMap Overpass API."""
    import httpx
    try:
        query = (
            '[out:json][timeout:30];'
            '(node["amenity"~"restaurant|fast_food|cafe"](around:1000,21.4225,39.8262);'
            'node["shop"~"supermarket|convenience|mall"](around:1000,21.4225,39.8262);'
            'node["highway"="bus_stop"](around:1000,21.4225,39.8262);'
            'node["amenity"="taxi"](around:1000,21.4225,39.8262);'
            'node["amenity"="place_of_worship"]["religion"="muslim"](around:5000,21.4225,39.8262);'
            ');out body 150;'
        )
        async with httpx.AsyncClient(timeout=20.0) as http:
            resp = await http.post(
                OVERPASS_API,
                content=f"data={query}",
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": "HaramNavigator/1.0",
                },
            )
            if resp.status_code != 200:
                logger.warning(f"Overpass API returned {resp.status_code}")
                return None
            data = resp.json()
            elements = data.get("elements", [])
            results = []
            seen_ids = set()
            counter = 0
            for el in elements:
                tags = el.get("tags", {})
                lat = el.get("lat")
                lon = el.get("lon")
                if not lat or not lon:
                    continue

                name = tags.get("name:en") or tags.get("name") or None
                if not name or name in seen_ids:
                    continue
                seen_ids.add(name)

                # Categorize
                amenity_tag = tags.get("amenity", "")
                shop_tag = tags.get("shop", "")
                highway_tag = tags.get("highway", "")

                if amenity_tag in ("restaurant", "fast_food", "cafe"):
                    category = "restaurant"
                    cuisine = tags.get("cuisine", "")
                    desc = f"{cuisine.replace(';', ', ')}" if cuisine else "Restaurant"
                elif shop_tag:
                    category = "grocery"
                    desc = shop_tag.replace("_", " ").title()
                elif highway_tag == "bus_stop":
                    category = "bus_stop"
                    desc = tags.get("operator", "Bus Stop")
                elif amenity_tag == "taxi":
                    category = "taxi_stand"
                    desc = "Taxi Stand"
                elif amenity_tag == "place_of_worship":
                    category = "meqat"
                    desc = tags.get("denomination", "Mosque")
                else:
                    continue

                counter += 1
                results.append({
                    "id": f"osm_{el.get('id', counter)}",
                    "name": name,
                    "category": category,
                    "latitude": lat,
                    "longitude": lon,
                    "description": desc,
                    "source": "openstreetmap",
                })
            return results
    except Exception as e:
        logger.warning(f"Failed to fetch from Overpass API: {e}")
        return None


@api_router.post("/amenities/refresh")
async def refresh_amenities_from_osm():
    """Re-fetch amenities from OpenStreetMap and replace cached data."""
    real_amenities = await fetch_osm_amenities()
    if not real_amenities or len(real_amenities) < 3:
        return {"status": "error", "message": "Could not fetch from OpenStreetMap. Keeping existing data."}
    await db.amenities.delete_many({})
    for a in real_amenities:
        await db.amenities.insert_one(a)
    return {
        "status": "ok",
        "source": "openstreetmap",
        "count": len(real_amenities),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@api_router.get("/")
async def root():
    return {"message": "Masjid Al Haram Navigator API"}


@api_router.get("/gates")
async def get_gates():
    gates = await db.gates.find({}, {"_id": 0}).to_list(200)
    return gates


@api_router.get("/amenities")
async def get_amenities(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    amenities = await db.amenities.find(query, {"_id": 0}).to_list(200)
    return amenities


@api_router.get("/sync/status")
async def get_sync_status():
    gates_count = await db.gates.count_documents({})
    amenities_count = await db.amenities.count_documents({})
    return {
        "last_synced": datetime.now(timezone.utc).isoformat(),
        "gates_count": gates_count,
        "amenities_count": amenities_count,
    }


# Base density weights - south gates near Kaaba entrance are busier
GATE_BASE_DENSITY = {
    "g1": 75, "g2": 80, "g3": 70, "g4": 65, "g5": 72, "g6": 60, "g7": 55,
    "g8": 40, "g9": 35, "g10": 30, "g11": 25, "g12": 35, "g13": 45, "g14": 50,
    "g15": 40, "g16": 55, "g17": 50, "g18": 45, "g19": 70, "g20": 55, "g21": 50,
    "g22": 65, "g23": 60, "g24": 55, "g25": 50,
}

_density_cache = {"data": None, "updated_at": None}
_live_density = {"data": None, "updated_at": None}  # Stores live-pushed data


class LiveDensityInput(BaseModel):
    gate_id: str
    density_percentage: int = Field(ge=0, le=100)


class LiveDensityBatch(BaseModel):
    entries: List[LiveDensityInput]
    source: str = "external"


class DataSourceConfig(BaseModel):
    mode: str = "simulation"  # "simulation" or "live"
    live_api_url: Optional[str] = None
    description: Optional[str] = None


def get_density_level(pct: int) -> str:
    if pct < 30:
        return "low"
    if pct < 55:
        return "medium"
    if pct < 80:
        return "high"
    return "very_high"


async def get_data_source_config():
    config = await db.config.find_one({"key": "data_source"}, {"_id": 0})
    if not config:
        return {"mode": "simulation", "live_api_url": None}
    return config


async def fetch_from_live_api(url: str, gates):
    """Try to fetch density from an external live API."""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=5.0) as client_http:
            resp = await client_http.get(url)
            if resp.status_code == 200:
                data = resp.json()
                # Expected format: list of {gate_id, density_percentage}
                if isinstance(data, list):
                    return data
                if isinstance(data, dict) and "density" in data:
                    return data["density"]
    except Exception as e:
        logger.warning(f"Live API fetch failed: {e}")
    return None


async def generate_density_data():
    now = datetime.now(timezone.utc)

    # Check if live data was pushed recently (within 2 minutes)
    if _live_density["data"] and _live_density["updated_at"]:
        elapsed = (now - _live_density["updated_at"]).total_seconds()
        if elapsed < 120:
            return _live_density["data"]

    # Check data source config
    config = await get_data_source_config()

    # If live mode with API URL, try fetching
    if config.get("mode") == "live" and config.get("live_api_url"):
        gates = await db.gates.find({}, {"_id": 0}).to_list(200)
        live_data = await fetch_from_live_api(config["live_api_url"], gates)
        if live_data:
            result = []
            for entry in live_data:
                gate_id = entry.get("gate_id", "")
                pct = entry.get("density_percentage", 50)
                gate_info = next((g for g in gates if g["id"] == gate_id), None)
                result.append({
                    "gate_id": gate_id,
                    "gate_number": gate_info.get("number") if gate_info else 0,
                    "name_en": gate_info.get("name_en", "") if gate_info else "",
                    "density_percentage": pct,
                    "density_level": get_density_level(pct),
                    "source": "live",
                    "updated_at": now.isoformat(),
                })
            _live_density["data"] = result
            _live_density["updated_at"] = now
            return result

    # Fallback: Simulation mode
    if _density_cache["data"] and _density_cache["updated_at"]:
        elapsed = (now - _density_cache["updated_at"]).total_seconds()
        if elapsed < 30:
            return _density_cache["data"]

    gates = await db.gates.find({}, {"_id": 0}).to_list(200)
    result = []
    for gate in gates:
        gate_id = gate.get("id", "")
        base = GATE_BASE_DENSITY.get(gate_id, 50)
        drift = random.randint(-15, 15)
        pct = max(5, min(95, base + drift))
        level = get_density_level(pct)
        result.append({
            "gate_id": gate_id,
            "gate_number": gate.get("number"),
            "name_en": gate.get("name_en"),
            "density_percentage": pct,
            "density_level": level,
            "source": "simulation",
            "updated_at": now.isoformat(),
        })

    _density_cache["data"] = result
    _density_cache["updated_at"] = now
    return result


@api_router.get("/gates/density")
async def get_gates_density():
    density_data = await generate_density_data()
    config = await get_data_source_config()
    source = "live" if density_data and len(density_data) > 0 and density_data[0].get("source") == "live" else "simulation"
    return {
        "density": density_data,
        "source": source,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@api_router.post("/gates/density/push")
async def push_live_density(batch: LiveDensityBatch):
    """Push live density data from an external source."""
    now = datetime.now(timezone.utc)
    gates = await db.gates.find({}, {"_id": 0}).to_list(200)
    result = []
    for entry in batch.entries:
        gate_info = next((g for g in gates if g["id"] == entry.gate_id), None)
        pct = entry.density_percentage
        result.append({
            "gate_id": entry.gate_id,
            "gate_number": gate_info.get("number") if gate_info else 0,
            "name_en": gate_info.get("name_en", "") if gate_info else "",
            "density_percentage": pct,
            "density_level": get_density_level(pct),
            "source": batch.source,
            "updated_at": now.isoformat(),
        })
    _live_density["data"] = result
    _live_density["updated_at"] = now
    return {"status": "ok", "entries_received": len(result), "source": batch.source}


@api_router.get("/config/datasource")
async def get_datasource():
    config = await get_data_source_config()
    return config


@api_router.post("/config/datasource")
async def set_datasource(config: DataSourceConfig):
    """Set the data source mode: 'simulation' or 'live' with optional API URL."""
    await db.config.update_one(
        {"key": "data_source"},
        {"$set": {"key": "data_source", "mode": config.mode, "live_api_url": config.live_api_url, "description": config.description}},
        upsert=True,
    )
    # Clear caches when switching modes
    _density_cache["data"] = None
    _density_cache["updated_at"] = None
    _live_density["data"] = None
    _live_density["updated_at"] = None
    return {"status": "ok", "mode": config.mode, "live_api_url": config.live_api_url}


@api_router.get("/gates/recommend")
async def get_gate_recommendation(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
):
    """Recommend the best gate based on distance + crowd density score."""
    density_data = await generate_density_data()
    gates = await db.gates.find({}, {"_id": 0}).to_list(200)

    recommendations = []
    for gate in gates:
        gate_id = gate.get("id", "")
        density_info = next((d for d in density_data if d["gate_id"] == gate_id), None)
        density_pct = density_info["density_percentage"] if density_info else 50

        # Calculate distance if user location provided
        dist = 0
        if lat is not None and lng is not None:
            import math
            R = 6371000
            dLat = math.radians(gate["latitude"] - lat)
            dLon = math.radians(gate["longitude"] - lng)
            a = (math.sin(dLat / 2) ** 2 +
                 math.cos(math.radians(lat)) * math.cos(math.radians(gate["latitude"])) *
                 math.sin(dLon / 2) ** 2)
            dist = R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        # Score: lower is better. Weighted: 40% distance (normalized), 60% density
        dist_score = dist / 1000  # km
        density_score = density_pct / 100
        combined_score = (0.4 * dist_score) + (0.6 * density_score)

        recommendations.append({
            **gate,
            "density_percentage": density_pct,
            "density_level": get_density_level(density_pct),
            "distance_m": round(dist),
            "score": round(combined_score, 3),
        })

    recommendations.sort(key=lambda x: x["score"])
    best = recommendations[0] if recommendations else None

    return {
        "recommended_gate": best,
        "all_ranked": recommendations[:5],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
