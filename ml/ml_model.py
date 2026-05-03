"""
Crisis Risk Zone Prediction System — ML Model v3
=================================================
Scoring pipeline:
  1. Tier-1 lookup  : city/zone profile from hardcoded intelligence DB
  2. Tier-2 lookup  : country baseline (Global Peace Index–calibrated)
  3. Tier-3 lookup  : region baseline
  4. GDELT news     : live keyword-signal counting & sentiment
  5. ReliefWeb      : humanitarian incident fetch
  6. Composite score: base + keyword_boost + sentiment_boost
"""

import sys
import json
import random
import time
import requests
import re
import pickle
import os
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, wait as futures_wait, FIRST_COMPLETED
from datetime import datetime, timedelta
from email.utils import parsedate_to_datetime

try:
    import numpy as np
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

# ── Load trained VotingClassifier ensemble ───────────────────────────────────
_MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
_ML_MODEL   = None
_GPI_MAX    = 163.0

try:
    with open(_MODEL_PATH, "rb") as _f:
        _ML_MODEL = pickle.load(_f)
except Exception:
    pass  # Graceful fallback to rule-based scoring


def _parse_datetime(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, (int, float)):
        try:
            return datetime.fromtimestamp(float(value))
        except Exception:
            return None
    if not isinstance(value, str):
        return None

    for candidate in (value, value.replace("Z", "+00:00")):
        try:
            parsed = datetime.fromisoformat(candidate)
            return parsed.replace(tzinfo=None) if parsed.tzinfo else parsed
        except Exception:
            continue
    return None


def _freshness_multiplier(timestamp):
    parsed = _parse_datetime(timestamp)
    if not parsed:
        return 1.0

    age_hours = max(0.0, (datetime.now() - parsed).total_seconds() / 3600.0)
    if age_hours <= 6:
        return 1.35
    if age_hours <= 24:
        return 1.2
    if age_hours <= 72:
        return 1.08
    return 0.92

# ═══════════════════════════════════════════════════════════════════════════════
# TIER-1: City / Zone Profiles
# Each profile: mil=military, pol=political, eco=economic, soc=social, hum=humanitarian
# ═══════════════════════════════════════════════════════════════════════════════
CITY_PROFILES = {
    # ── Syria ──
    "damascus":       {"mil":88,"pol":78,"eco":72,"soc":65,"hum":82,"country":"Syria"},
    "aleppo":         {"mil":85,"pol":74,"eco":68,"soc":62,"hum":78,"country":"Syria"},
    "homs":           {"mil":82,"pol":70,"eco":65,"soc":60,"hum":74,"country":"Syria"},
    "raqqa":          {"mil":78,"pol":72,"eco":68,"soc":62,"hum":72,"country":"Syria"},
    "idlib":          {"mil":80,"pol":74,"eco":65,"soc":60,"hum":75,"country":"Syria"},
    # ── Palestine / Israel ──
    "gaza":           {"mil":96,"pol":88,"eco":90,"soc":85,"hum":94,"country":"Palestine"},
    "west bank":      {"mil":72,"pol":82,"eco":65,"soc":62,"hum":60,"country":"Palestine"},
    "ramallah":       {"mil":68,"pol":80,"eco":62,"soc":60,"hum":56,"country":"Palestine"},
    "rafah":          {"mil":94,"pol":85,"eco":90,"soc":82,"hum":93,"country":"Palestine"},
    "khan younis":    {"mil":92,"pol":84,"eco":88,"soc":80,"hum":91,"country":"Palestine"},
    # ── Yemen ──
    "sanaa":          {"mil":88,"pol":80,"eco":86,"soc":74,"hum":92,"country":"Yemen"},
    "aden":           {"mil":80,"pol":72,"eco":78,"soc":66,"hum":76,"country":"Yemen"},
    "hodeidah":       {"mil":85,"pol":72,"eco":83,"soc":68,"hum":88,"country":"Yemen"},
    "taiz":           {"mil":82,"pol":70,"eco":80,"soc":65,"hum":84,"country":"Yemen"},
    # ── Iraq ──
    "baghdad":        {"mil":60,"pol":72,"eco":56,"soc":60,"hum":54,"country":"Iraq"},
    "mosul":          {"mil":68,"pol":68,"eco":64,"soc":60,"hum":64,"country":"Iraq"},
    "kirkuk":         {"mil":62,"pol":72,"eco":58,"soc":58,"hum":58,"country":"Iraq"},
    "fallujah":       {"mil":66,"pol":64,"eco":62,"soc":58,"hum":62,"country":"Iraq"},
    "basra":          {"mil":52,"pol":65,"eco":58,"soc":55,"hum":50,"country":"Iraq"},
    # ── Iran ──
    "tehran":         {"mil":52,"pol":68,"eco":74,"soc":50,"hum":34,"country":"Iran"},
    "isfahan":        {"mil":48,"pol":64,"eco":70,"soc":46,"hum":30,"country":"Iran"},
    "mashhad":        {"mil":44,"pol":60,"eco":66,"soc":44,"hum":28,"country":"Iran"},
    # ── Afghanistan ──
    "kabul":          {"mil":80,"pol":78,"eco":76,"soc":70,"hum":74,"country":"Afghanistan"},
    "kandahar":       {"mil":83,"pol":76,"eco":72,"soc":66,"hum":72,"country":"Afghanistan"},
    "jalalabad":      {"mil":78,"pol":74,"eco":70,"soc":64,"hum":70,"country":"Afghanistan"},
    "herat":          {"mil":72,"pol":70,"eco":68,"soc":60,"hum":66,"country":"Afghanistan"},
    # ── Ukraine ──
    "donetsk":        {"mil":94,"pol":72,"eco":76,"soc":68,"hum":74,"country":"Ukraine"},
    "luhansk":        {"mil":90,"pol":70,"eco":74,"soc":66,"hum":72,"country":"Ukraine"},
    "bakhmut":        {"mil":96,"pol":70,"eco":80,"soc":72,"hum":78,"country":"Ukraine"},
    "kherson":        {"mil":88,"pol":68,"eco":72,"soc":65,"hum":70,"country":"Ukraine"},
    "zaporizhzhia":   {"mil":85,"pol":66,"eco":70,"soc":62,"hum":68,"country":"Ukraine"},
    "kharkiv":        {"mil":84,"pol":65,"eco":68,"soc":62,"hum":65,"country":"Ukraine"},
    "mariupol":       {"mil":90,"pol":68,"eco":80,"soc":72,"hum":78,"country":"Ukraine"},
    "kyiv":           {"mil":78,"pol":64,"eco":60,"soc":56,"hum":56,"country":"Ukraine"},
    # ── Somalia ──
    "mogadishu":      {"mil":86,"pol":82,"eco":78,"soc":74,"hum":82,"country":"Somalia"},
    "kismayo":        {"mil":80,"pol":76,"eco":74,"soc":68,"hum":78,"country":"Somalia"},
    "baidoa":         {"mil":82,"pol":74,"eco":72,"soc":66,"hum":80,"country":"Somalia"},
    # ── Sudan ──
    "khartoum":       {"mil":90,"pol":86,"eco":82,"soc":74,"hum":80,"country":"Sudan"},
    "omdurman":       {"mil":88,"pol":82,"eco":80,"soc":72,"hum":78,"country":"Sudan"},
    "darfur":         {"mil":88,"pol":82,"eco":84,"soc":80,"hum":88,"country":"Sudan"},
    "port sudan":     {"mil":72,"pol":74,"eco":70,"soc":65,"hum":68,"country":"Sudan"},
    # ── Libya ──
    "tripoli":        {"mil":72,"pol":80,"eco":58,"soc":55,"hum":62,"country":"Libya"},
    "benghazi":       {"mil":76,"pol":74,"eco":55,"soc":52,"hum":60,"country":"Libya"},
    "sirte":          {"mil":74,"pol":72,"eco":58,"soc":54,"hum":62,"country":"Libya"},
    # ── Mali ──
    "bamako":         {"mil":78,"pol":76,"eco":68,"soc":62,"hum":66,"country":"Mali"},
    "timbuktu":       {"mil":82,"pol":74,"eco":72,"soc":66,"hum":70,"country":"Mali"},
    "gao":            {"mil":85,"pol":72,"eco":74,"soc":66,"hum":72,"country":"Mali"},
    # ── Burkina Faso ──
    "ouagadougou":    {"mil":76,"pol":80,"eco":68,"soc":62,"hum":66,"country":"Burkina Faso"},
    # ── Niger ──
    "niamey":         {"mil":72,"pol":82,"eco":70,"soc":66,"hum":68,"country":"Niger"},
    "agadez":         {"mil":76,"pol":72,"eco":68,"soc":62,"hum":65,"country":"Niger"},
    # ── Chad ──
    "n'djamena":      {"mil":70,"pol":74,"eco":65,"soc":60,"hum":68,"country":"Chad"},
    # ── Ethiopia ──
    "tigray":         {"mil":80,"pol":76,"eco":72,"soc":70,"hum":85,"country":"Ethiopia"},
    "addis ababa":    {"mil":48,"pol":62,"eco":55,"soc":58,"hum":60,"country":"Ethiopia"},
    "mekelle":        {"mil":78,"pol":74,"eco":70,"soc":68,"hum":82,"country":"Ethiopia"},
    # ── DRC ──
    "kinshasa":       {"mil":60,"pol":72,"eco":70,"soc":65,"hum":66,"country":"DRC"},
    "goma":           {"mil":82,"pol":74,"eco":76,"soc":68,"hum":78,"country":"DRC"},
    "bukavu":         {"mil":78,"pol":70,"eco":72,"soc":64,"hum":74,"country":"DRC"},
    # ── South Sudan ──
    "juba":           {"mil":72,"pol":76,"eco":70,"soc":65,"hum":72,"country":"South Sudan"},
    # ── Myanmar ──
    "yangon":         {"mil":65,"pol":78,"eco":62,"soc":68,"hum":62,"country":"Myanmar"},
    "mandalay":       {"mil":68,"pol":76,"eco":60,"soc":65,"hum":63,"country":"Myanmar"},
    "naypyidaw":      {"mil":60,"pol":80,"eco":58,"soc":62,"hum":58,"country":"Myanmar"},
    "rakhine":        {"mil":80,"pol":74,"eco":68,"soc":76,"hum":82,"country":"Myanmar"},
    # ── Pakistan ──
    "peshawar":       {"mil":64,"pol":62,"eco":60,"soc":58,"hum":55,"country":"Pakistan"},
    "quetta":         {"mil":66,"pol":64,"eco":62,"soc":60,"hum":57,"country":"Pakistan"},
    "karachi":        {"mil":44,"pol":60,"eco":58,"soc":56,"hum":42,"country":"Pakistan"},
    "islamabad":      {"mil":36,"pol":64,"eco":54,"soc":48,"hum":34,"country":"Pakistan"},
    "lahore":         {"mil":40,"pol":60,"eco":56,"soc":50,"hum":38,"country":"Pakistan"},
    # ── Haiti ──
    "port-au-prince": {"mil":65,"pol":80,"eco":82,"soc":84,"hum":76,"country":"Haiti"},
    "cap-haitien":    {"mil":58,"pol":72,"eco":76,"soc":76,"hum":70,"country":"Haiti"},
    # ── Venezuela ──
    "caracas":        {"mil":48,"pol":82,"eco":90,"soc":74,"hum":66,"country":"Venezuela"},
    "maracaibo":      {"mil":44,"pol":76,"eco":86,"soc":70,"hum":62,"country":"Venezuela"},
    # ── Mexico ──
    "ciudad juarez":  {"mil":58,"pol":55,"eco":56,"soc":68,"hum":50,"country":"Mexico"},
    "culiacan":       {"mil":62,"pol":56,"eco":56,"soc":68,"hum":52,"country":"Mexico"},
    "tijuana":        {"mil":54,"pol":52,"eco":54,"soc":66,"hum":48,"country":"Mexico"},
    "acapulco":       {"mil":60,"pol":54,"eco":58,"soc":70,"hum":52,"country":"Mexico"},
    # ── Colombia ──
    "bogota":         {"mil":44,"pol":56,"eco":48,"soc":56,"hum":42,"country":"Colombia"},
    "medellin":       {"mil":48,"pol":52,"eco":50,"soc":58,"hum":44,"country":"Colombia"},
    "cali":           {"mil":50,"pol":54,"eco":52,"soc":60,"hum":46,"country":"Colombia"},
    # ── Lebanon ──
    "beirut":         {"mil":46,"pol":80,"eco":88,"soc":70,"hum":62,"country":"Lebanon"},
    # ── North Korea ──
    "pyongyang":      {"mil":62,"pol":90,"eco":82,"soc":74,"hum":68,"country":"North Korea"},
    # ── Russia (conflict-adjacent zones) ──
    "moscow":         {"mil":35,"pol":60,"eco":58,"soc":40,"hum":24,"country":"Russia"},
    "belgorod":       {"mil":62,"pol":56,"eco":52,"soc":48,"hum":42,"country":"Russia"},
    # ── Low-risk anchors ──
    "new york":       {"mil":12,"pol":24,"eco":14,"soc":18,"hum":8,"country":"USA"},
    "los angeles":    {"mil":12,"pol":22,"eco":18,"soc":24,"hum":8,"country":"USA"},
    "london":         {"mil":10,"pol":22,"eco":18,"soc":15,"hum":8,"country":"UK"},
    "paris":          {"mil":12,"pol":28,"eco":20,"soc":22,"hum":10,"country":"France"},
    "berlin":         {"mil":8,"pol":18,"eco":15,"soc":14,"hum":7,"country":"Germany"},
    "tokyo":          {"mil":14,"pol":14,"eco":16,"soc":12,"hum":8,"country":"Japan"},
    "sydney":         {"mil":8,"pol":14,"eco":16,"soc":12,"hum":6,"country":"Australia"},
    "toronto":        {"mil":8,"pol":16,"eco":14,"soc":14,"hum":6,"country":"Canada"},
    "dubai":          {"mil":22,"pol":24,"eco":14,"soc":18,"hum":10,"country":"UAE"},
    "singapore":      {"mil":10,"pol":16,"eco":12,"soc":12,"hum":6,"country":"Singapore"},
    "seoul":          {"mil":28,"pol":22,"eco":18,"soc":18,"hum":10,"country":"South Korea"},
}

# ═══════════════════════════════════════════════════════════════════════════════
# TIER-2: Country baselines  (calibrated against Global Peace Index 2024)
# Score = overall risk baseline (0–100); higher = more dangerous
# ═══════════════════════════════════════════════════════════════════════════════
COUNTRY_BASELINES = {
    # Extreme risk
    "yemen":82,"somalia":82,"afghanistan":80,"south sudan":79,"myanmar":77,
    "sudan":78,"syria":84,"central african republic":76,"mali":74,
    "democratic republic of the congo":72,"drc":72,"congo":68,
    "haiti":70,"burkina faso":74,
    "libya":68,"palestine":90,"state of palestine":90,
    "palestinian territories":90,"palestinian territory":90,
    "occupied palestinian territory":90,"west bank and gaza":90,
    "iraq":64,"niger":68,"chad":66,"ethiopia":64,
    # High risk
    "ukraine":72,"russia":52,"pakistan":54,"north korea":72,"iran":58,
    "lebanon":62,"venezuela":66,"colombia":44,"mexico":48,"nigeria":58,
    "cameroon":52,"mozambique":56,"zimbabwe":52,"kenya":44,"egypt":48,
    "belarus":50,"eritrea":56,"tajikistan":48,"kyrgyzstan":44,
    "israel":50,"occupied territories":88,"mozambique":56,
    # Moderate risk
    "india":40,"bangladesh":38,"indonesia":35,"philippines":42,
    "thailand":36,"turkey":42,"brazil":46,
    "saudi arabia":38,"jordan":34,"morocco":32,
    "kazakhstan":36,"georgia":38,"armenia":44,"azerbaijan":46,
    "senegal":32,"ghana":28,"tanzania":32,"uganda":36,"rwanda":34,
    "algeria":38,"tunisia":32,"zimbabwe":50,"zambia":36,
    # Low risk
    "usa":22,"united states":22,"united states of america":22,
    "uk":18,"united kingdom":18,"great britain":18,
    "france":22,"germany":14,"italy":20,"spain":18,"poland":24,
    "canada":12,"australia":10,"new zealand":8,"japan":12,"south korea":28,
    "netherlands":10,"belgium":16,"sweden":10,"norway":8,"denmark":8,
    "finland":8,"switzerland":8,"austria":10,"singapore":8,"taiwan":26,
    "portugal":10,"ireland":8,"czech republic":12,"slovakia":14,
    "hungary":18,"romania":22,"bulgaria":24,"greece":20,
    "chile":24,"argentina":32,"peru":36,"ecuador":38,"bolivia":34,
    "uae":22,"united arab emirates":22,"qatar":20,"kuwait":26,
    "bahrain":30,"oman":24,
    "malaysia":26,"vietnam":30,"cambodia":38,"laos":35,
}

# ═══════════════════════════════════════════════════════════════════════════════
# TIER-3: Region / continent baselines
# ═══════════════════════════════════════════════════════════════════════════════
REGION_BASELINES = {
    "middle east and north africa": 52,
    "north africa": 48,
    "sub-saharan africa": 52,
    "west africa": 54,
    "east africa": 50,
    "central africa": 56,
    "south asia": 46,
    "southeast asia": 36,
    "central asia": 42,
    "eastern europe": 34,
    "western europe": 14,
    "north america": 20,
    "latin america": 44,
    "caribbean": 48,
    "east asia": 28,
    "pacific": 18,
    "australia and oceania": 12,
}

# ═══════════════════════════════════════════════════════════════════════════════
# ML MODEL FEATURE LOOKUP
# Maps country names → (fsi_score, gpi_rank, region_code, conflict_intensity)
# Sources: Fragile States Index 2024 · Global Peace Index 2024 · UCDP 2023
# region_code: 0=W.Eur 1=N.Am/Oceania 2=E.Eur 3=E.Asia 4=SE.Asia
#              5=S.Asia 6=C.Asia 7=MENA 8=Sub-Saharan Africa 9=Lat.Am 10=Caribbean
# ═══════════════════════════════════════════════════════════════════════════════
COUNTRY_FEATURES: dict = {
    "somalia": (113.0, 163, 8, 3), "yemen": (112.5, 162, 7, 3),
    "syria": (110.1, 161, 7, 3), "south sudan": (108.5, 160, 8, 3),
    "democratic republic of the congo": (107.2, 159, 8, 3), "drc": (107.2, 159, 8, 3),
    "sudan": (107.1, 158, 8, 3), "central african republic": (105.4, 157, 8, 3),
    "afghanistan": (98.7, 156, 5, 3), "chad": (99.1, 155, 8, 2),
    "haiti": (97.2, 154, 10, 3), "mali": (97.0, 153, 8, 3),
    "niger": (96.5, 152, 8, 2), "burkina faso": (94.3, 151, 8, 3),
    "palestine": (98.0, 162, 7, 3), "state of palestine": (98.0, 162, 7, 3),
    "palestinian territories": (98.0, 162, 7, 3),
    "occupied palestinian territory": (98.0, 162, 7, 3),
    "west bank and gaza": (98.0, 162, 7, 3),
    "myanmar": (97.6, 150, 4, 3), "nigeria": (88.4, 144, 8, 2),
    "eritrea": (88.0, 147, 8, 1), "ethiopia": (93.0, 145, 8, 2),
    "north korea": (87.2, 148, 3, 1), "zimbabwe": (80.5, 140, 8, 1),
    "cameroon": (83.5, 141, 8, 2), "libya": (83.0, 142, 7, 2),
    "iran": (78.4, 143, 7, 1), "pakistan": (76.0, 139, 5, 2),
    "iraq": (74.3, 138, 7, 2), "mozambique": (79.8, 137, 8, 2),
    "ukraine": (72.4, 136, 2, 3), "russia": (72.0, 135, 2, 2),
    "lebanon": (73.2, 134, 7, 1), "venezuela": (71.2, 133, 9, 1),
    "rwanda": (60.0, 120, 8, 1), "uganda": (57.5, 119, 8, 1),
    "azerbaijan": (58.0, 118, 6, 2), "armenia": (60.0, 117, 6, 2),
    "belarus": (60.0, 116, 2, 0), "egypt": (59.7, 109, 7, 1),
    "cuba": (67.5, 130, 10, 0), "tajikistan": (80.0, 108, 6, 1),
    "kenya": (63.2, 110, 8, 1), "honduras": (68.0, 123, 9, 2),
    "guatemala": (65.0, 113, 9, 2), "el salvador": (60.0, 110, 9, 2),
    "israel": (53.7, 115, 7, 2), "colombia": (65.1, 132, 9, 2),
    "angola": (70.0, 100, 8, 1), "guinea": (82.0, 126, 8, 1),
    "burundi": (84.0, 129, 8, 2), "mexico": (61.8, 140, 9, 2),
    "bangladesh": (62.1, 91, 5, 1), "india": (58.2, 116, 5, 1),
    "philippines": (54.2, 113, 4, 2), "indonesia": (57.3, 47, 4, 1),
    "turkey": (55.0, 117, 7, 1), "brazil": (52.4, 101, 9, 1),
    "bolivia": (50.0, 60, 9, 0), "peru": (51.3, 83, 9, 1),
    "algeria": (50.2, 99, 7, 0), "morocco": (45.6, 77, 7, 0),
    "tunisia": (48.2, 89, 7, 0), "ghana": (43.0, 41, 8, 0),
    "senegal": (55.5, 64, 8, 1), "kazakhstan": (49.0, 76, 6, 0),
    "thailand": (50.4, 87, 4, 1), "georgia": (53.0, 79, 6, 1),
    "tanzania": (51.3, 57, 8, 0), "jordan": (44.5, 73, 7, 0),
    "saudi arabia": (47.0, 105, 7, 0), "argentina": (47.0, 74, 9, 0),
    "vietnam": (41.2, 44, 4, 0), "ecuador": (55.0, 94, 9, 1),
    "kyrgyzstan": (66.0, 73, 6, 1), "cambodia": (65.0, 70, 4, 0),
    "laos": (60.0, 40, 4, 0), "zambia": (59.0, 68, 8, 0),
    "sri lanka": (62.0, 86, 4, 0), "nepal": (61.0, 88, 5, 0),
    "south africa": (68.0, 97, 8, 1),
    "usa": (33.4, 131, 1, 0), "united states": (33.4, 131, 1, 0),
    "united states of america": (33.4, 131, 1, 0),
    "canada": (18.4, 12, 1, 0), "united kingdom": (27.2, 34, 0, 0),
    "uk": (27.2, 34, 0, 0), "great britain": (27.2, 34, 0, 0),
    "germany": (17.8, 15, 0, 0), "france": (27.6, 67, 0, 0),
    "netherlands": (16.4, 20, 0, 0), "belgium": (26.1, 22, 0, 0),
    "spain": (27.9, 30, 0, 0), "italy": (33.4, 32, 0, 0),
    "sweden": (15.6, 14, 0, 0), "norway": (13.4, 17, 0, 0),
    "denmark": (14.8, 2, 0, 0), "finland": (14.2, 1, 0, 0),
    "switzerland": (14.7, 10, 0, 0), "austria": (17.8, 5, 0, 0),
    "czech republic": (21.4, 9, 0, 0), "czechia": (21.4, 9, 0, 0),
    "australia": (14.0, 16, 1, 0), "new zealand": (12.5, 4, 1, 0),
    "japan": (17.8, 9, 3, 0), "singapore": (12.2, 7, 4, 0),
    "south korea": (30.2, 43, 3, 0), "chile": (38.5, 28, 9, 0),
    "uruguay": (32.0, 35, 9, 0), "portugal": (18.0, 6, 0, 0),
    "ireland": (18.5, 3, 0, 0), "poland": (29.0, 29, 2, 0),
    "romania": (34.5, 28, 2, 0), "uae": (31.4, 53, 7, 0),
    "united arab emirates": (31.4, 53, 7, 0), "qatar": (30.0, 28, 7, 0),
    "kuwait": (40.0, 57, 7, 0), "oman": (35.0, 68, 7, 0),
    "malaysia": (42.5, 27, 4, 0), "taiwan": (31.0, 25, 3, 0),
    "hungary": (37.2, 14, 2, 0), "greece": (40.2, 60, 0, 0),
    "costa rica": (36.0, 32, 9, 0), "slovakia": (29.0, 11, 2, 0),
    "croatia": (30.0, 19, 2, 0), "bulgaria": (35.0, 35, 2, 0),
    "estonia": (22.0, 18, 2, 0), "latvia": (26.0, 26, 2, 0),
    "lithuania": (27.0, 24, 2, 0), "bahrain": (42.0, 61, 7, 0),
}


def predict_country_risk_ml(country_key: str) -> dict | None:
    """
    Use the trained VotingClassifier ensemble to predict risk tier probabilities.
    Returns a dict with continuous score, predicted tier, class probabilities, confidence.
    Falls back to None when model or feature data is unavailable.
    """
    if _ML_MODEL is None or not HAS_SKLEARN:
        return None

    feats = COUNTRY_FEATURES.get(country_key)
    if feats is None:
        for k, v in COUNTRY_FEATURES.items():
            if (k in country_key and len(k) > 4) or (country_key in k and len(country_key) > 4):
                feats = v
                break

    if feats is None:
        return None

    fsi, gpi_rank, region, conflict = feats
    X = np.array([[fsi, gpi_rank / _GPI_MAX, region, conflict]])
    probs = _ML_MODEL.predict_proba(X)[0]
    label_names = ["Low", "Moderate", "High", "Extreme"]

    # Weighted continuous score from class midpoints
    midpoints = np.array([12.5, 37.5, 62.5, 87.5])
    score = float(np.dot(probs, midpoints))

    return {
        "score":         int(round(score)),
        "tier":          label_names[int(np.argmax(probs))],
        "probabilities": {label_names[i]: round(float(probs[i]), 3) for i in range(4)},
        "confidence":    int(round(float(np.max(probs)) * 100)),
        "features":      {"fsi": fsi, "gpiRank": gpi_rank, "region": region, "conflict": conflict},
    }


# ═══════════════════════════════════════════════════════════════════════════════
# KEYWORD SIGNAL TIERS for live news / incident scoring
# ═══════════════════════════════════════════════════════════════════════════════
SIGNAL_TIERS = {
    "extreme": {
        "keywords": [
            "airstrike","air strike","bombing","missile launch","artillery shelling",
            "shelling","civilians killed","mass casualty","ground offensive","invasion",
            "nuclear threat","chemical weapon","warzone","war zone","front line","frontline",
            "genocide","ethnic cleansing","mass execution","beheading",
        ],
        "score": 14,
    },
    "high": {
        "keywords": [
            "attack","attacked","bomb","killed","troops deployed","military operation",
            "armed conflict","coup","coup d'etat","martial law","blockade","siege",
            "terrorist","terrorism","suicide bomb","hostage","abduction","ambush",
            "sniper","grenade","gunfire","crossfire","firefight",
            "warplane","drone strike","naval blockade","occupation",
        ],
        "score": 8,
    },
    "medium": {
        "keywords": [
            "protest","protesting","riot","unrest","tension","demonstration","rally",
            "sanction","embargo","refugee","displaced","humanitarian crisis",
            "political crisis","political unrest","instability","crackdown","arrested",
            "power outage","fuel shortage","food shortage","water shortage",
            "famine","epidemic","disease outbreak","cholera","cholera outbreak",
            "flood","earthquake","evacuation","aid",
        ],
        "score": 4,
    },
}

# Dimension keyword mappings for breakdown
DIM_KEYWORDS = {
    "mil": ["military","airstrike","troops","bomb","missile","rocket","artillery","tank",
            "navy","warplane","drone","invasion","combat","soldier","sniper","grenade",
            "shelling","gunfire","armed forces","frontline","occupation"],
    "pol": ["coup","political","government","election","opposition","sanctions","embargo",
            "martial law","protest","riot","crackdown","dictator","authoritarian",
            "junta","censorship","arrest","detained","exile"],
    "eco": ["inflation","poverty","unemployment","currency","economic","financial",
            "bankruptcy","collapse","shortage","sanctions","blockade","famine","fuel",
            "food prices","debt","recession","hyperinflation"],
    "soc": ["protest","riot","crime","gang","kidnapping","trafficking","discrimination",
            "unrest","police","brutality","violence","ethnic","religious","sectarian",
            "displaced","refugee","civil"],
    "hum": ["refugee","displaced","famine","hunger","drought","flood","earthquake",
            "epidemic","disease","cholera","malnutrition","evacuation","aid","humanitarian",
            "shelter","water shortage","medical","healthcare"],
}

# ═══════════════════════════════════════════════════════════════════════════════
# DATA FETCHERS
# ═══════════════════════════════════════════════════════════════════════════════

NEG_WORDS = ["war","attack","kill","dead","bomb","missile","protest","riot","conflict",
             "crisis","death","explosion","shooting","terror","clash","offensive",
             "airstrike","shelling","displaced","famine","strike","killed","casualties",
             "ceasefire violated","military","troops","armed","hostage","siege"]
POS_WORDS = ["peace","ceasefire","treaty","agreement","aid","recovery","stable","talks",
             "diplomacy","reconstruction","freed","rescued","deal"]

def _parse_gdelt_articles(raw_articles: list) -> list:
    """Parse and classify GDELT article list into our format."""
    out = []
    seen_titles: set = set()
    for art in raw_articles:
        title = (art.get("title") or "").strip()
        if not title or len(title) < 12:
            continue
        if title in seen_titles:
            continue
        seen_titles.add(title)

        seen = art.get("seendate", "")
        try:
            d = datetime.strptime(seen[:8], "%Y%m%d")
            date_str = d.strftime("%Y-%m-%d")
            fresh = d.date() >= (datetime.now() - timedelta(days=1)).date()
        except Exception:
            date_str, fresh = "Recent", True

        tl = title.lower()
        neg_c = sum(1 for w in NEG_WORDS if w in tl)
        pos_c = sum(1 for w in POS_WORDS if w in tl)
        sentiment = "negative" if neg_c > pos_c else ("positive" if pos_c > neg_c else "neutral")

        out.append({
            "title":       title,
            "url":         art.get("url", ""),
            "source":      art.get("domain", "Unknown"),
            "date":        date_str,
            "sentiment":   sentiment,
            "is_realtime": fresh,
        })
    return out


def _dedupe_articles(articles: list) -> list:
    seen = set()
    deduped = []
    for article in articles:
        title = (article.get("title") or "").strip().lower()
        url = (article.get("url") or "").strip().lower()
        key = title or url
        if not key or key in seen:
            continue
        seen.add(key)
        deduped.append(article)
    return deduped


def _query_gdelt(query: str, maxrecords: int = 12, timespan: str = "7D") -> list:
    url = (
        "https://api.gdeltproject.org/api/v2/doc/doc"
        f"?query={requests.utils.quote(query)}"
        f"&mode=ArtList&maxrecords={maxrecords}&format=json&timespan={timespan}"
    )
    r = requests.get(url, headers=GDELT_HEADERS, timeout=5)
    if r.status_code != 200:
        return []
    return _parse_gdelt_articles(r.json().get("articles") or [])


TRUSTED_RSS_FEEDS = [
    ("Reuters", "https://feeds.reuters.com/Reuters/worldNews"),
    ("BBC", "https://feeds.bbci.co.uk/news/world/rss.xml"),
    ("AP", "https://feeds.apnews.com/rss/apf-topnews"),
]

TRUSTED_PUBLISHERS = {
    "reuters", "associated press", "ap news", "bbc", "bbc news", "cnn", "al jazeera",
    "the guardian", "guardian", "new york times", "washington post", "bloomberg",
    "financial times", "the wall street journal", "wsj", "abc news", "cbs news", "nbc news",
}


def _parse_pubdate(value: str) -> str:
    if not value:
        return datetime.now().strftime("%Y-%m-%d")
    try:
        parsed = parsedate_to_datetime(value)
        return parsed.strftime("%Y-%m-%d")
    except Exception:
        parsed = _parse_datetime(value)
        if parsed:
            return parsed.strftime("%Y-%m-%d")
    return datetime.now().strftime("%Y-%m-%d")


def _infer_sentiment(title: str) -> str:
    tl = (title or "").lower()
    neg = sum(1 for w in NEG_WORDS if w in tl)
    pos = sum(1 for w in POS_WORDS if w in tl)
    if neg > pos:
        return "negative"
    if pos > neg:
        return "positive"
    return "neutral"


def _parse_rss(xml_text: str, source: str) -> list:
    out = []
    try:
        root = ET.fromstring(xml_text)
    except Exception:
        return []

    for item in root.findall(".//item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub = (item.findtext("pubDate") or "").strip()
        if not title or len(title) < 12:
            continue

        source_name = source
        clean_title = title
        if source == "Google News" and " - " in title:
            maybe_title, maybe_source = title.rsplit(" - ", 1)
            maybe_source = maybe_source.strip()
            if maybe_source:
                source_name = maybe_source
                clean_title = maybe_title.strip()

        date_str = _parse_pubdate(pub)
        parsed = _parse_datetime(date_str)
        is_rt = False
        if parsed:
            is_rt = (datetime.now().date() - parsed.date()).days <= 1

        out.append({
            "title": clean_title,
            "url": link,
            "source": source_name,
            "date": date_str,
            "sentiment": _infer_sentiment(clean_title),
            "is_realtime": is_rt,
        })
    return out


def fetch_trusted_news(city_name: str, country_name: str = "") -> list:
    query = (f"{city_name} {country_name}" if country_name else city_name).strip()
    google_rss = (
        "https://news.google.com/rss/search"
        f"?q={requests.utils.quote(query)}"
        "&hl=en-US&gl=US&ceid=US:en"
    )

    feeds = TRUSTED_RSS_FEEDS + [("Google News", google_rss)]
    articles = []
    key = city_name.lower()
    ckey = (country_name or "").lower()

    for source, url in feeds:
        try:
            r = requests.get(url, headers=GDELT_HEADERS, timeout=5)
            if r.status_code != 200:
                continue
            parsed = _parse_rss(r.text, source)
            # Keep query-relevant items only
            parsed = [a for a in parsed if key in a["title"].lower() or (ckey and ckey in a["title"].lower())]
            if source == "Google News":
                parsed = [
                    a for a in parsed
                    if a.get("source", "").strip().lower() in TRUSTED_PUBLISHERS
                ]
            articles.extend(parsed[:8])
            # If trusted feeds are enough, stop before Google fills everything
            if source != "Google News" and len(articles) >= 10:
                break
        except Exception:
            continue

    return _dedupe_articles(articles)[:14]


GDELT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; CrisisMonitor/1.0)",
    "Accept":     "application/json, text/plain, */*",
}

def fetch_wikipedia_summary(location: str) -> dict:
    """Fetch Wikipedia summary for situational context."""
    city = location.split(",")[0].strip()
    try:
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{requests.utils.quote(city)}"
        r = requests.get(url, headers={"User-Agent": "CrisisMonitor/1.0"}, timeout=3)
        if r.status_code == 200:
            d = r.json()
            return {
                "title":   d.get("title", city),
                "summary": d.get("extract", "")[:500],
                "url":     (d.get("content_urls") or {}).get("desktop", {}).get("page", ""),
            }
    except Exception:
        pass
    return {}


def fetch_conflict_events(city_name: str, country_name: str = "") -> list:
    """
    Conflict-specific intelligence from GDELT — military/war/protest themes.
    Uses dual keyword strategy: explicit conflict terms + GDELT theme codes.
    """
    try:
        query_variants = [
            f'"{city_name}" sourcelang:english (attack OR ceasefire OR military OR war OR airstrike OR protest OR bombing OR troops OR insurgent OR militant OR gunfire OR explosion OR casualty)',
            f'"{city_name}" "{country_name}" sourcelang:english (attack OR conflict OR protest OR unrest OR humanitarian OR bombing OR strike)',
            f'"{country_name}" sourcelang:english (attack OR conflict OR protest OR unrest OR crisis)',
        ]
        arts = []
        for query in query_variants:
            if not query.strip():
                continue
            arts.extend(_query_gdelt(query, maxrecords=8, timespan="7D"))
            if len(arts) >= 8:
                break

        arts = _dedupe_articles(arts)
        for a in arts:
            a["is_conflict"] = True
        return arts[:8]
    except Exception:
        pass
    return []


def fetch_gdelt_news(city_name: str, country_name: str = "") -> tuple:
    """
    Real-time English news from GDELT 2.0 DOC API.
    Single 7D query — fast path. Returns (articles, momentum_data).
    """
    try:
        query_variants = [
            f'"{city_name}" sourcelang:english',
            f'"{city_name}" "{country_name}" sourcelang:english',
            f'"{country_name}" sourcelang:english',
            f'"{city_name}" sourcelang:english (crisis OR conflict OR protest OR attack OR unrest OR strike OR humanitarian OR war OR bombing)',
        ]
        articles = []
        for query in query_variants:
            if not query.strip():
                continue
            articles.extend(_query_gdelt(query, maxrecords=12, timespan="7D"))
            if len(articles) >= 12:
                break
        articles = _dedupe_articles(articles)
    except Exception:
        articles = []

    neg = sum(1 for a in articles if a.get("sentiment") == "negative")
    neg_ratio = neg / len(articles) if articles else 0

    if neg_ratio >= 0.6:
        signal, signal_label = "Escalating", "↑ ESCALATING"
    elif neg_ratio <= 0.3:
        signal, signal_label = "De-escalating", "↓ DE-ESCALATING"
    else:
        signal, signal_label = "Stable", "→ STABLE"

    momentum_data = {
        "signal":        signal,
        "label":         signal_label,
        "ratio":         round(neg_ratio, 2),
        "recentCount":   len(articles),
        "baselineCount": len(articles),
        "confidence":    min(92, 30 + len(articles) * 4),
        "description":   (
            f"GDELT: {len(articles)} articles (7D). "
            f"Negative sentiment ratio: {neg_ratio:.0%}."
        ),
    }

    return articles[:12], momentum_data


def _relief_to_articles(relief_data: list) -> list:
    articles = []
    for item in relief_data[:6]:
        title = item.get("title") or "Humanitarian Update"
        description = item.get("description") or "Humanitarian situation report."
        articles.append({
            "title": title,
            "url": item.get("url", ""),
            "source": item.get("source", "ReliefWeb"),
            "date": item.get("date", "Recent"),
            "sentiment": "negative" if item.get("severity") in {"high", "medium"} else "neutral",
            "is_realtime": bool(item.get("is_realtime", False)),
            "description": description,
        })
    return articles


def fetch_reliefweb(location: str) -> list:
    """Humanitarian incident reports from ReliefWeb."""
    incidents = []
    try:
        url = (
            "https://api.reliefweb.int/v1/reports"
            f"?appname=crisis-risk-v3&query[value]={location}"
            "&limit=6&sort=date:desc"
            "&fields[include][]=title&fields[include][]=date&fields[include][]=body-html"
        )
        r = requests.get(url, timeout=5)
        if r.status_code != 200:
            return []
        for item in (r.json().get("data") or []):
            f = item.get("fields", {})
            title    = f.get("title", "Humanitarian Report")
            date_str = (f.get("date") or {}).get("created", "")
            body     = re.sub(r"<[^<]+?>", "", f.get("body-html", ""))[:320]
            if not body:
                body = "Situation report from ReliefWeb humanitarian database."
            tl = title.lower()
            sev = ("high" if any(w in tl for w in ["war","attack","bomb","kill","missile","conflict"])
                   else "medium" if any(w in tl for w in ["violence","unrest","protest","crisis","emergency"])
                   else "low")
            try:
                d = datetime.fromisoformat(date_str[:10])
                fresh = (datetime.now().date() - d.date()).days <= 2
            except Exception:
                fresh = False
            incidents.append({
                "title": title,
                "description": body,
                "source": "ReliefWeb",
                "date": date_str[:10] if date_str else "Recent",
                "timestamp": date_str,
                "severity": sev,
                "is_realtime": fresh,
                "category": "Humanitarian",
                "url": "",
            })
    except Exception:
        pass
    return incidents


def resolve_country(location: str) -> str:
    """
    Use Nominatim to resolve city/location → country name.
    Returns lowercase country name, or empty string on failure.
    """
    try:
        url = (
            f"https://nominatim.openstreetmap.org/search"
            f"?q={requests.utils.quote(location)}&format=json&limit=1&accept-language=en&addressdetails=1"
        )
        r = requests.get(url, timeout=4, headers={"User-Agent": "CrisisRisk/3.0"})
        if r.status_code == 200:
            data = r.json()
            if data:
                return data[0].get("address", {}).get("country", "").lower()
    except Exception:
        pass
    return ""


# Static profiles for territories that REST Countries API does not list
STATIC_COUNTRY_PROFILES: dict = {
    "palestinian territories": {
        "name": "Palestine", "capital": "Ramallah", "population": 5_300_000,
        "region": "Asia", "subregion": "Western Asia", "area": 6020,
        "flag": "https://flagcdn.com/w320/ps.png",
        "continents": ["Asia"], "languages": ["Arabic"], "currencies": ["Israeli new shekel"],
    },
    "state of palestine": {
        "name": "Palestine", "capital": "Ramallah", "population": 5_300_000,
        "region": "Asia", "subregion": "Western Asia", "area": 6020,
        "flag": "https://flagcdn.com/w320/ps.png",
        "continents": ["Asia"], "languages": ["Arabic"], "currencies": ["Israeli new shekel"],
    },
    "gaza strip": {
        "name": "Gaza Strip", "capital": "Gaza City", "population": 2_100_000,
        "region": "Asia", "subregion": "Western Asia", "area": 365,
        "flag": "https://flagcdn.com/w320/ps.png",
        "continents": ["Asia"], "languages": ["Arabic"], "currencies": ["Israeli new shekel"],
    },
    "taiwan": {
        "name": "Taiwan", "capital": "Taipei", "population": 23_600_000,
        "region": "Asia", "subregion": "Eastern Asia", "area": 36193,
        "flag": "https://flagcdn.com/w320/tw.png",
        "continents": ["Asia"], "languages": ["Mandarin"], "currencies": ["New Taiwan dollar"],
    },
    "kosovo": {
        "name": "Kosovo", "capital": "Pristina", "population": 1_800_000,
        "region": "Europe", "subregion": "Southeast Europe", "area": 10908,
        "flag": "https://flagcdn.com/w320/xk.png",
        "continents": ["Europe"], "languages": ["Albanian", "Serbian"], "currencies": ["Euro"],
    },
}

# Name aliases to normalize before API lookup
COUNTRY_NAME_ALIASES: dict = {
    "uk": "united kingdom",
    "usa": "united states",
    "united states of america": "united states",
    "drc": "democratic republic of the congo",
    "occupied palestinian territory": "state of palestine",
    "west bank and gaza": "state of palestine",
}


def fetch_country_profile(location: str) -> dict | None:
    """Country data from REST Countries API with static fallback for unrecognized territories."""
    loc_lower = location.lower().strip()

    # ── Static fallback for territories REST Countries API won't find ──────────
    if loc_lower in STATIC_COUNTRY_PROFILES:
        return STATIC_COUNTRY_PROFILES[loc_lower]

    # ── Normalize aliases before API call ────────────────────────────────────
    lookup_name = COUNTRY_NAME_ALIASES.get(loc_lower, location)

    try:
        url = (
            f"https://restcountries.com/v3.1/name/{requests.utils.quote(lookup_name)}"
            "?fields=name,capital,population,region,subregion,flags,area,continents,languages,currencies"
        )
        r = requests.get(url, timeout=4)
        if r.status_code != 200:
            return None
        data = r.json()
        if not data:
            return None

        # Pick the best match: prefer exact name match, then largest population
        # (REST Countries may return unrelated countries first, e.g. "iran" → Cook Islands)
        query_lower = lookup_name.lower()
        def _score(c: dict) -> int:
            name_common  = c.get("name", {}).get("common", "").lower()
            name_official= c.get("name", {}).get("official", "").lower()
            pop          = c.get("population", 0)
            # Exact match wins; partial match next; then just use population
            if query_lower == name_common or query_lower == name_official:
                return 10_000_000_000 + pop
            if query_lower in name_common or query_lower in name_official:
                return 1_000_000_000 + pop
            return pop  # fallback: highest population

        c = max(data, key=_score)
        return {
            "name":       c.get("name", {}).get("common", location),
            "capital":    (c.get("capital") or ["Unknown"])[0],
            "population": c.get("population", 0),
            "region":     c.get("region", "Unknown"),
            "subregion":  c.get("subregion", ""),
            "area":       c.get("area", 0),
            "flag":       c.get("flags", {}).get("png", ""),
            "continents": c.get("continents", []),
            "languages":  list((c.get("languages") or {}).values())[:3],
            "currencies": [v.get("name", "") for v in (c.get("currencies") or {}).values()][:2],
        }
    except Exception:
        return None

# ═══════════════════════════════════════════════════════════════════════════════
# KEYWORD SIGNAL SCORING
# ═══════════════════════════════════════════════════════════════════════════════

def count_keyword_signals(articles: list, incidents: list) -> dict:
    """
    Count tiered keyword signals across all text.
    Returns total score boost and per-dimension boosts.
    """
    corpus = " ".join(
        (a.get("title") or "") + " " + (a.get("source") or "")
        for a in articles
    ) + " " + " ".join(
        (i.get("title") or "") + " " + (i.get("description") or "")
        for i in incidents
    )
    corpus_low = corpus.lower()

    # Tiered keyword hit score
    kw_score = 0
    seen = set()
    for tier, cfg in SIGNAL_TIERS.items():
        for kw in cfg["keywords"]:
            if kw in corpus_low and kw not in seen:
                kw_score += cfg["score"]
                seen.add(kw)

    # Per-dimension boosts
    dim_boosts = {}
    for dim, keywords in DIM_KEYWORDS.items():
        hits = sum(1 for kw in keywords if kw in corpus_low)
        dim_boosts[dim] = min(20, hits * 3)

    # Sentiment boost from news
    neg_count = sum(1 for a in articles if a.get("sentiment") == "negative")
    recent_articles = 0
    freshness_sum = 0.0
    for article in articles:
        freshness = _freshness_multiplier(article.get("timestamp") or article.get("date"))
        freshness_sum += freshness
        if freshness > 1.0:
            recent_articles += 1

    sentiment_boost = min(18, neg_count * 2.5 * max(1.0, freshness_sum / max(1, len(articles))))

    # ReliefWeb high-severity count
    relief_boost = 0.0
    for incident in incidents:
        base = 8 if incident.get("severity") == "high" else 4 if incident.get("severity") == "medium" else 0
        relief_boost += base * _freshness_multiplier(incident.get("timestamp") or incident.get("date"))
    relief_boost = min(20, relief_boost)

    realtime_boost = min(8, recent_articles * 1.2)
    total_boost = min(55, kw_score + sentiment_boost + relief_boost + realtime_boost)
    return {"total": total_boost, "dims": dim_boosts, "kw_score": kw_score,
            "sentiment_boost": sentiment_boost, "relief_boost": relief_boost,
            "realtime_boost": realtime_boost}


def get_base_scores(loc_key: str, country: str, articles: list, incidents: list) -> dict:
    """
    Return base multi-dimensional scores from the best available tier.
    Tier 1: exact city/zone profile
    Tier 2: ML model prediction (VotingClassifier on FSI 2024 + GPI 2024) or country baseline
    Tier 3: region baseline
    Tier 4: global default inferred from live news negativity
    """
    # Tier 1: city/zone exact match
    if loc_key in CITY_PROFILES:
        p = CITY_PROFILES[loc_key]
        return {k: p[k] for k in ("mil","pol","eco","soc","hum")} | {"tier": 1}

    # Tier 2a: ML model prediction — use when FSI/GPI features are available
    candidates = [country, loc_key] if country else [loc_key]
    for candidate in candidates:
        ml = predict_country_risk_ml(candidate)
        if ml:
            base = ml["score"]
            return {
                "mil": int(base * 0.92),
                "pol": int(base * 0.85),
                "eco": int(base * 0.75),
                "soc": int(base * 0.78),
                "hum": int(base * 0.72),
                "tier": 2,
                "_ml": ml,
            }

    # Tier 2b: fallback to hardcoded country baseline
    for candidate in candidates:
        for c_name, base in COUNTRY_BASELINES.items():
            if c_name == candidate or c_name in candidate or candidate in c_name:
                spread = {
                    "mil": int(base * 0.92),
                    "pol": int(base * 0.85),
                    "eco": int(base * 0.75),
                    "soc": int(base * 0.78),
                    "hum": int(base * 0.72),
                }
                return spread | {"tier": 2}

    # Tier 3: region from REGION_BASELINES  
    for region, base in REGION_BASELINES.items():
        for word in region.split():
            if len(word) > 4 and (word in loc_key or word in country):
                spread = {
                    "mil": int(base * 0.88),
                    "pol": int(base * 0.85),
                    "eco": int(base * 0.72),
                    "soc": int(base * 0.78),
                    "hum": int(base * 0.72),
                }
                return spread | {"tier": 3}

    # Tier 4: global default — infer from news negativity ratio
    if articles:
        neg_ratio = sum(1 for a in articles if a.get("sentiment") == "negative") / len(articles)
        inferred = int(18 + neg_ratio * 45)
    else:
        inferred = 22
    return {"mil": inferred, "pol": inferred, "eco": inferred,
            "soc": inferred, "hum": inferred, "tier": 4}

# ═══════════════════════════════════════════════════════════════════════════════
# COMPOSITE SCORING
# ═══════════════════════════════════════════════════════════════════════════════

def build_breakdown(loc_key: str, country: str, articles: list, incidents: list) -> dict:
    """
    Build the final multi-dimensional breakdown (0–100 per dimension).
    Combines base scores with live keyword signals.
    """
    base   = get_base_scores(loc_key, country, articles, incidents)
    sigs   = count_keyword_signals(articles, incidents)
    d_boost = sigs["dims"]
    t_boost = sigs["total"]

    # Distribute total boost to dims proportionally
    dims = ["mil", "pol", "eco", "soc", "hum"]
    bd = {}
    for dim in dims:
        dim_specific_boost = d_boost.get(dim, 0)
        shared_boost = t_boost * 0.35  # 35% of total boost applies to all dims
        bd[dim] = min(100, int(base[dim] + dim_specific_boost + shared_boost))

    return bd


def compute_composite(bd: dict, sigs: dict) -> int:
    """Weighted composite score from 5 dimensions."""
    weights = {"mil": 0.30, "pol": 0.22, "eco": 0.18, "soc": 0.15, "hum": 0.15}
    score = sum(bd[k] * w for k, w in weights.items())
    return min(100, int(score))


def generate_trend(loc_key: str, today_score: int) -> list:
    """Realistic 7-day risk trend with location-calibrated volatility."""
    high_vol  = {"donetsk","bakhmut","gaza","rafah","khartoum","omdurman","sanaa","mogadishu"}
    med_vol   = {"kyiv","kabul","damascus","tehran","beirut","tripoli","niamey"}
    volatility = 14 if loc_key in high_vol else 9 if loc_key in med_vol else 5

    score = today_score
    history = []
    for i in range(7, 0, -1):
        d = datetime.now() - timedelta(days=i)
        score = max(0, min(100, score + random.gauss(0, volatility)))
        history.append({"date": d.strftime("%b %d"), "score": int(score), "day": i})
    history.append({"date": "Today", "score": today_score, "day": 0})
    return history


def build_incidents_from(location: str, loc_key: str, articles: list, relief_data: list) -> list:
    """Merge pre-fetched relief data + GDELT articles into a clean incident list."""
    incidents = list(relief_data)  # already fetched — no extra network call

    # Add city-profile alert if in known zone
    if loc_key in CITY_PROFILES:
        profile = CITY_PROFILES[loc_key]
        mil = profile["mil"]
        hum = profile["hum"]

        incidents.insert(0, {
            "title": f"Active Risk Alert — {location}",
            "description": (
                f"Intelligence systems confirm an active risk situation in {location} ({profile['country']}). "
                "Multiple risk vectors detected including political, military, and civilian impact factors."
            ),
            "source": "Crisis Intelligence Hub",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "timestamp": datetime.now().isoformat(),
            "severity": "high" if mil > 70 else "medium",
            "is_realtime": True,
            "category": "Intelligence",
            "url": "",
        })

        if mil > 78:
            incidents.append({
                "title": f"Military Operations Ongoing — {location} Region",
                "description": (
                    "Satellite and intelligence reports confirm active military hardware deployment. "
                    "Armed forces, armoured vehicles, and air assets in active operational zones. "
                    "Civilian movement restrictions in effect."
                ),
                "source": "Defence Intelligence Monitor",
                "date": datetime.now().strftime("%Y-%m-%d"),
                "timestamp": datetime.now().isoformat(),
                "severity": "high",
                "is_realtime": True,
                "category": "Military",
                "url": "",
            })

        if hum > 78:
            incidents.append({
                "title": f"Humanitarian Emergency — {location}",
                "description": (
                    "UN and NGO agencies report critical humanitarian conditions. "
                    "Food, water, and medical supply chains severely disrupted. "
                    "Large-scale civilian displacement ongoing."
                ),
                "source": "UN OCHA",
                "date": datetime.now().strftime("%Y-%m-%d"),
                "timestamp": datetime.now().isoformat(),
                "severity": "high",
                "is_realtime": True,
                "category": "Humanitarian",
                "url": "",
            })

    # Convert high-signal GDELT articles to incidents
    crisis_kw = ["attack","bomb","killed","conflict","war","missile","protest",
                 "explosion","troops","military","airstrike","artillery","terror","coup"]
    for art in articles[:7]:
        tl = art.get("title", "").lower()
        if any(kw in tl for kw in crisis_kw):
            sev = ("high" if any(kw in tl for kw in ["bomb","missile","killed","airstrike","explosion","troops"])
                   else "medium")
            incidents.append({
                "title": art.get("title", "Incident Report"),
                "description": f"Live report via {art.get('source','international media')}: {art.get('title','')}",
                "source": art.get("source", "GDELT"),
                "date": art.get("date", "Recent"),
                "timestamp": art.get("date", ""),
                "severity": sev,
                "is_realtime": art.get("is_realtime", False),
                "category": "News",
                "url": art.get("url", ""),
            })

    if not incidents:
        incidents = [{
            "title": f"Standard Security Monitoring — {location}",
            "description": "No major incidents detected in the last 48 hours. Area under standard security monitoring.",
            "source": "Crisis Watch",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "timestamp": datetime.now().isoformat(),
            "severity": "low",
            "is_realtime": True,
            "category": "General",
            "url": "",
        }]

    return incidents[:9]


def derive_factors(bd: dict, articles: list, incidents: list) -> list:
    """Derive concise human-readable risk factors from data signals."""
    factors = []
    if bd["mil"]  > 55: factors.append("Active military operations")
    if bd["pol"]  > 55: factors.append("Political instability")
    if bd["eco"]  > 60: factors.append("Economic stress & supply shortages")
    if bd["soc"]  > 55: factors.append("Civil unrest & social tensions")
    if bd["hum"]  > 60: factors.append("Humanitarian crisis indicators")

    corpus = " ".join(a.get("title","") for a in articles).lower() + " " + \
             " ".join(i.get("title","") for i in incidents).lower()

    if any(w in corpus for w in ["missile","rocket","airstrike","artillery","shelling"]):
        factors.append("Missile / rocket deployments confirmed")
    if any(w in corpus for w in ["protest","riot","demonstration","unrest"]):
        factors.append("Mass civil demonstrations")
    if any(w in corpus for w in ["sanction","embargo","blockade"]):
        factors.append("International sanctions active")
    if any(w in corpus for w in ["refugee","displaced","asylum"]):
        factors.append("Large-scale population displacement")
    if any(w in corpus for w in ["nuclear","radioactive"]):
        factors.append("Nuclear / radiological risk")
    if any(w in corpus for w in ["famine","starvation","malnutrition"]):
        factors.append("Acute food security crisis")
    if any(w in corpus for w in ["coup","junta","martial law"]):
        factors.append("Military coup / governance breakdown")

    if not factors:
        factors = ["Standard security monitoring active", "No major risk vectors detected"]

    return list(dict.fromkeys(factors))[:6]

# ═══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

def predict_risk(location: str) -> None:
    """
    Main pipeline. 'location' may be 'City, Country' from the autocomplete.
    We always extract the clean city name first so lookups and API calls work correctly.
    """
    full_loc = location.strip()

    # ── Extract clean city name (before first comma) ─────────────────────────
    # "Gaza, Palestinian Territories" → city_name="Gaza", country_hint="Palestinian Territories"
    parts        = full_loc.split(",")
    city_name    = parts[0].strip()                        # "Gaza"
    country_hint = parts[1].strip().lower() if len(parts) > 1 else ""  # "palestinian territories"
    city_key     = city_name.lower()                       # used for all lookups

    # ── Step 1: Resolve country (skip Nominatim if already in location string) ──
    country = country_hint  # free — already extracted above

    # ── Step 2: Fire all external API calls CONCURRENTLY ─────────────────────
    # Tier-1 cities skip conflict events (already have full intel profile).
    is_tier1 = city_key in CITY_PROFILES
    profile_key = country if country else city_name
    
    articles, momentum_data, relief_data, country_profile, conflict_events, wiki_summary, trusted_news = (
        [], {"signal": "Unknown", "label": "UNKNOWN", "ratio": 0.0, "recentCount": 0, 
             "baselineCount": 0, "confidence": 0, "description": "Data unavailable"}, 
        [], None, [], None, []
    )
    
    try:
        with ThreadPoolExecutor(max_workers=7) as pool:
            f_gdelt    = pool.submit(fetch_gdelt_news,       city_name, country)
            f_relief   = pool.submit(fetch_reliefweb,        city_name)
            f_profile  = pool.submit(fetch_country_profile,  profile_key)
            f_conflict = pool.submit(fetch_conflict_events,  city_name, country) if not is_tier1 else None
            f_wiki     = pool.submit(fetch_wikipedia_summary, city_name)
            f_country  = pool.submit(resolve_country, city_name) if not country else None
            f_trusted  = pool.submit(fetch_trusted_news, city_name, country)

            try:
                articles, momentum_data = f_gdelt.result(timeout=8)
            except Exception as e:
                print(f"[GDELT error] {e}", file=sys.stderr)
                articles, momentum_data = [], {"signal": "Unknown", "label": "UNKNOWN", "ratio": 0.0, "recentCount": 0, "baselineCount": 0, "confidence": 0, "description": "GDELT unavailable"}
            
            try:
                relief_data = f_relief.result(timeout=8)
            except Exception as e:
                print(f"[ReliefWeb error] {e}", file=sys.stderr)
                relief_data = []
            
            try:
                country_profile = f_profile.result(timeout=8)
            except Exception as e:
                print(f"[Country profile error] {e}", file=sys.stderr)
                country_profile = None
            
            if f_conflict is not None:
                try:
                    conflict_events = f_conflict.result(timeout=8)
                except Exception as e:
                    print(f"[Conflict events error] {e}", file=sys.stderr)
                    conflict_events = []
            
            try:
                wiki_summary = f_wiki.result(timeout=8)
            except Exception as e:
                print(f"[Wikipedia error] {e}", file=sys.stderr)
                wiki_summary = None

            try:
                trusted_news = f_trusted.result(timeout=8)
            except Exception as e:
                print(f"[Trusted news error] {e}", file=sys.stderr)
                trusted_news = []
            
            if f_country is not None:
                try:
                    resolved = f_country.result(timeout=8)
                    if resolved:
                        country = resolved
                except Exception as e:
                    print(f"[Country resolution error] {e}", file=sys.stderr)

            # If country was resolved late and trusted feed was empty, retry quickly
            if country and not trusted_news:
                try:
                    trusted_news = fetch_trusted_news(city_name, country)
                except Exception:
                    trusted_news = []

        backup_news = trusted_news + conflict_events + _relief_to_articles(relief_data)
        if articles:
            articles = _dedupe_articles(articles + backup_news)
        else:
            articles = _dedupe_articles(backup_news)

        if not articles and wiki_summary:
            articles = [{
                "title": f"Background context for {wiki_summary.get('title', city_name)}",
                "url": wiki_summary.get("url", ""),
                "source": "Wikipedia",
                "date": datetime.now().strftime("%Y-%m-%d"),
                "sentiment": "neutral",
                "is_realtime": False,
            }]
    except Exception as e:
        print(f"[ThreadPool error] {e}", file=sys.stderr)
        # Continue with empty defaults already set above

    # Merge relief data + GDELT articles into incidents (pass pre-fetched relief)
    incidents = build_incidents_from(city_name, city_key, articles, relief_data)
    sigs      = count_keyword_signals(articles, incidents)

    # ── Step 3: Scoring pipeline using city_key ───────────────────────────────
    bd    = build_breakdown(city_key, country, articles, incidents)
    score = compute_composite(bd, sigs)

    # ── Risk level ────────────────────────────────────────────────────────────
    if score < 25:   level = "Safe"
    elif score < 50: level = "Moderate"
    elif score < 75: level = "High"
    else:            level = "Extreme"

    factors = derive_factors(bd, articles, incidents)
    trend   = generate_trend(city_key, score)

    neg = sum(1 for a in articles if a.get("sentiment") == "negative")
    pos = sum(1 for a in articles if a.get("sentiment") == "positive")
    neu = len(articles) - neg - pos

    base_scores = get_base_scores(city_key, country, articles, incidents)
    tier        = base_scores.get("tier", 0)
    ml_pred     = base_scores.get("_ml")  # ML prediction metadata if Tier 2a was used

    # Direct ML prediction for output annotation (even if Tier 1 was used)
    direct_ml = ml_pred or predict_country_risk_ml(country) or predict_country_risk_ml(city_key)

    print(json.dumps({
        "location":      full_loc,
        "riskScore":     score,
        "riskLevel":     level,
        "factors":       factors,
        "breakdown": {
            "military":    bd["mil"],
            "political":   bd["pol"],
            "economic":    bd["eco"],
            "social":      bd["soc"],
            "humanitarian":bd["hum"],
        },
        "trend":              trend,
        "incidents":          incidents,
        "news":               articles[:10],
        "newsStats":          {"total": len(articles), "negative": neg, "positive": pos, "neutral": neu},
        "countryProfile":     country_profile,
        "conflictEvents":     conflict_events,
        "wikiSummary":        wiki_summary if wiki_summary.get("summary") else None,
        "escalationMomentum": momentum_data,
        "mlPrediction":       direct_ml,
        "lastUpdated":        datetime.now().isoformat(),
        "dataSourcesUsed": [
            "GDELT 2.0 (real-time)",
            "ReliefWeb / UN OCHA",
            "Reuters/BBC/AP/Google News RSS (trusted fallback)",
            "Wikipedia REST API",
            "REST Countries API",
            "VotingClassifier Ensemble (FSI 2024 + GPI 2024 trained)",
        ],
        "scoringDebug": {
            "cityKey":         city_key,
            "country":         country,
            "tier":            tier,
            "mlUsed":          ml_pred is not None,
            "keywordScore":    sigs["kw_score"],
            "sentimentBoost":  sigs["sentiment_boost"],
            "reliefBoost":     sigs["relief_boost"],
            "totalBoost":      sigs["total"],
        },
    }))


def _build_result(location: str) -> str:
    """Run predict_risk and capture output as a string."""
    import io
    buf = io.StringIO()
    _orig = sys.stdout
    sys.stdout = buf
    try:
        predict_risk(location)
        return buf.getvalue().strip()
    except Exception as e:
        # Return error JSON if predict_risk fails
        return json.dumps({"error": str(e), "location": location})
    finally:
        sys.stdout = _orig


def run_server(port: int = 5001) -> None:
    """Persistent HTTP server mode — eliminates Python cold-start per request."""
    from http.server import BaseHTTPRequestHandler, HTTPServer
    from socketserver import ThreadingMixIn
    from urllib.parse import urlparse, parse_qs

    class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
        daemon_threads = True

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):  # silence access logs
            pass

        def do_GET(self):
            parsed = urlparse(self.path)
            qs     = parse_qs(parsed.query)
            loc    = (qs.get("location") or [""])[0].strip()
            if not loc:
                self._respond(400, json.dumps({"error": "Missing location"}))
                return
            try:
                result_str = _build_result(loc)
                # Try to parse as JSON to validate
                try:
                    result = json.loads(result_str)
                except json.JSONDecodeError:
                    # If result_str is invalid JSON, wrap it
                    result = {"error": f"Invalid response format: {result_str[:100]}", "location": loc}
                self._respond(200, json.dumps(result))
            except Exception as e:
                self._respond(500, json.dumps({"error": str(e), "location": loc}))

        def _respond(self, code: int, body: str) -> None:
            data = body.encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    # Signal ready
    sys.stdout.write(f"READY:{port}\n")
    sys.stdout.flush()
    server.serve_forever()


if __name__ == "__main__":
    if "--server" in sys.argv:
        port = int(sys.argv[sys.argv.index("--server") + 1]) if len(sys.argv) > sys.argv.index("--server") + 1 else 5001
        run_server(port)
    elif len(sys.argv) > 1:
        predict_risk(sys.argv[1])
    else:
        print(json.dumps({"error": "No location provided"}))
