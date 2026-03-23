import csv
import json
import math
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path


API_BASE = "https://api.census.gov/data/2024/acs/acs1/pums"
REQUEST_VARS = ["PWGTP", "WAGP", "SCHL", "INDP", "NAICSP", "COW", "AGEP", "SEX", "ESR"]
EMPLOYED_STATUSES = {"1", "2", "4", "5"}
ACS_SOCP_OVERRIDES = {
    # ACS 2024 PUMS exposes Data Scientists under 15-1251 rather than the newer
    # 15-2051 O*NET/BLS code used elsewhere in the stack.
    "152051": "151251",
}
BTOS_SECTOR_LABELS = {
    "11": "Agriculture, Forestry, Fishing and Hunting",
    "21": "Mining, Quarrying, and Oil and Gas Extraction",
    "22": "Utilities",
    "23": "Construction",
    "31": "Manufacturing",
    "42": "Wholesale Trade",
    "44": "Retail Trade",
    "48": "Transportation and Warehousing",
    "51": "Information",
    "52": "Finance and Insurance",
    "53": "Real Estate and Rental and Leasing",
    "54": "Professional, Scientific, and Technical Services",
    "55": "Management of Companies and Enterprises",
    "56": "Administrative and Support and Waste Management Services",
    "61": "Educational Services",
    "62": "Health Care and Social Assistance",
    "71": "Arts, Entertainment, and Recreation",
    "72": "Accommodation and Food Services",
    "81": "Other Services",
}


def clamp(value, low=0.0, high=1.0):
    return max(low, min(high, value))


def normalize_socp(onet_soc_code):
    digits = re.sub(r"[^0-9]", "", str(onet_soc_code or ""))
    if len(digits) >= 6:
        return digits[:6]
    return ""


def normalize_naicsp(value):
    return str(value or "").strip().upper()


def map_naicsp_to_btos_sector(naicsp_code):
    code = normalize_naicsp(naicsp_code)
    if not code:
        return None
    match = re.match(r"^(\d{2})", code)
    if not match:
        return None
    sector = match.group(1)
    if sector in {"32", "33"}:
        sector = "31"
    elif sector == "45":
        sector = "44"
    elif sector == "49":
        sector = "48"
    if sector not in BTOS_SECTOR_LABELS:
        return None
    return sector


def try_float(value):
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def weighted_quantile(pairs, quantile):
    values = [(value, weight) for value, weight in pairs if value is not None and weight and weight > 0]
    if not values:
        return None
    values.sort(key=lambda item: item[0])
    total_weight = sum(weight for _, weight in values)
    threshold = total_weight * quantile
    cumulative = 0.0
    for value, weight in values:
        cumulative += weight
        if cumulative >= threshold:
            return value
    return values[-1][0]


def weighted_simpson(categories):
    totals = {}
    total_weight = 0.0
    for category, weight in categories:
        if category in (None, "") or not weight or weight <= 0:
            continue
        totals[category] = totals.get(category, 0.0) + weight
        total_weight += weight
    if total_weight <= 0:
        return None
    concentration = sum((weight / total_weight) ** 2 for weight in totals.values())
    return clamp(1.0 - concentration)


def weighted_share(weights_by_key):
    total_weight = sum(weight for weight in weights_by_key.values() if weight and weight > 0)
    if total_weight <= 0:
        return None
    return {key: (weight / total_weight) for key, weight in weights_by_key.items() if weight and weight > 0}


def percentile_map(values):
    numeric = sorted(set(value for value in values if value is not None))
    if not numeric:
        return {}
    if len(numeric) == 1:
        return {numeric[0]: 0.5}
    return {value: index / (len(numeric) - 1) for index, value in enumerate(numeric)}


def age_band(age):
    if age is None:
        return None
    if age < 30:
        return "under_30"
    if age < 40:
        return "30s"
    if age < 50:
        return "40s"
    if age < 60:
        return "50s"
    return "60_plus"


def weighted_blend(components):
    numerator = 0.0
    denominator = 0.0
    for value, weight in components:
        if value is None or weight <= 0:
            continue
        numerator += value * weight
        denominator += weight
    if denominator <= 0:
        return None
    return clamp(numerator / denominator)


def format_num(value):
    if value is None:
        return ""
    return f"{value:.3f}"


def load_occupations(repo_root):
    path = repo_root / "data" / "normalized" / "occupations.csv"
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    occupations = []
    for row in rows:
        if str(row.get("is_active", "")).strip().lower() in {"0", "false"}:
            continue
        socp = normalize_socp(row.get("onet_soc_code"))
        if not socp:
            continue
        occupations.append(
            {
                "occupation_id": row["occupation_id"],
                "onet_soc_code": row["onet_soc_code"],
                "title": row["title"],
                "socp": socp,
            }
        )
    return occupations


def fetch_code_rows(socp_code):
    params = {
        "get": ",".join(REQUEST_VARS),
        "SOCP": socp_code,
    }
    url = f"{API_BASE}?{urllib.parse.urlencode(params)}"
    last_error = None
    saw_only_empty = True
    for attempt in range(5):
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": "DLYJ2/acs-pums-normalizer",
                "Accept": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                text = response.read().decode("utf-8")
            if not text.strip():
                raise ValueError("Empty ACS PUMS API response")
            payload = json.loads(text)
            header = payload[0]
            return [dict(zip(header, row)) for row in payload[1:]]
        except Exception as exc:
            last_error = exc
            if not isinstance(exc, ValueError):
                saw_only_empty = False
            time.sleep(1.5 * (attempt + 1))
    if saw_only_empty and isinstance(last_error, ValueError):
        return []
    raise last_error


def fetch_occupation_rows(socp_code):
    override_code = ACS_SOCP_OVERRIDES.get(socp_code)
    if override_code:
        override_rows = fetch_code_rows(override_code)
        if override_rows:
            return override_rows, override_code, "manual_socp_override"
    exact_rows = fetch_code_rows(socp_code)
    if exact_rows:
        return exact_rows, socp_code, "exact_socp"
    grouped_code = f"{socp_code[:5]}0"
    if grouped_code != socp_code:
        grouped_rows = fetch_code_rows(grouped_code)
        if grouped_rows:
            return grouped_rows, grouped_code, "grouped_zero_fallback"
    return [], socp_code, "no_rows"


def derive_metrics(records):
    employed = [row for row in records if str(row.get("ESR", "")).strip() in EMPLOYED_STATUSES]
    weighted_count = 0.0
    wage_pairs = []
    education_pairs = []
    industry_pairs = []
    class_pairs = []
    age_pairs = []
    sex_weights = {"male": 0.0, "female": 0.0}
    industry_weights = {}
    btos_sector_weights = {}

    for row in employed:
        weight = try_float(row.get("PWGTP"))
        if weight is None or weight <= 0:
            continue
        weighted_count += weight

        wage = try_float(row.get("WAGP"))
        if wage is not None and wage > 0:
            wage_pairs.append((wage, weight))

        education_pairs.append((str(row.get("SCHL", "")).strip() or None, weight))
        industry_code = str(row.get("INDP", "")).strip() or None
        industry_pairs.append((industry_code, weight))
        if industry_code:
            industry_weights[industry_code] = industry_weights.get(industry_code, 0.0) + weight
        btos_sector = map_naicsp_to_btos_sector(row.get("NAICSP"))
        if btos_sector:
            btos_sector_weights[btos_sector] = btos_sector_weights.get(btos_sector, 0.0) + weight
        class_pairs.append((str(row.get("COW", "")).strip() or None, weight))
        age_pairs.append((age_band(try_float(row.get("AGEP"))), weight))

        sex = str(row.get("SEX", "")).strip()
        if sex == "1":
            sex_weights["male"] += weight
        elif sex == "2":
            sex_weights["female"] += weight

    wage_p25 = weighted_quantile(wage_pairs, 0.25)
    wage_median = weighted_quantile(wage_pairs, 0.50)
    wage_p75 = weighted_quantile(wage_pairs, 0.75)
    wage_dispersion_ratio = None
    if wage_p25 is not None and wage_p75 is not None and wage_median not in (None, 0):
        wage_dispersion_ratio = (wage_p75 - wage_p25) / wage_median

    sex_share_map = weighted_share(sex_weights)
    sex_mix_balance = None
    if sex_share_map:
        male_share = sex_share_map.get("male", 0.0)
        female_share = sex_share_map.get("female", 0.0)
        sex_mix_balance = clamp(1.0 - abs(male_share - female_share))

    education_dispersion = weighted_simpson(education_pairs)
    industry_dispersion = weighted_simpson(industry_pairs)
    class_of_worker_dispersion = weighted_simpson(class_pairs)
    age_band_dispersion = weighted_simpson(age_pairs)
    worker_mix_dispersion = weighted_blend(
        [
            (age_band_dispersion, 0.40),
            (sex_mix_balance, 0.35),
            (class_of_worker_dispersion, 0.25),
        ]
    )

    employed_count = len(employed)
    wage_record_count = len(wage_pairs)
    completeness = sum(
        value is not None
        for value in [
            wage_dispersion_ratio,
            education_dispersion,
            industry_dispersion,
            class_of_worker_dispersion,
            age_band_dispersion,
            sex_mix_balance,
            worker_mix_dispersion,
        ]
    ) / 7.0
    wage_record_share = 0.0 if employed_count <= 0 else (wage_record_count / employed_count)
    sample_support = 0.0 if employed_count <= 0 else (employed_count / (employed_count + 200.0))
    confidence = clamp((0.50 * sample_support) + (0.25 * wage_record_share) + (0.25 * completeness), 0.35, 0.95)

    return {
        "sample_record_count": len(records),
        "employed_record_count": employed_count,
        "weighted_worker_count": weighted_count,
        "wage_record_count": wage_record_count,
        "median_wage_usd": wage_median,
        "wage_p25_usd": wage_p25,
        "wage_p75_usd": wage_p75,
        "wage_dispersion_ratio": wage_dispersion_ratio,
        "education_dispersion": education_dispersion,
        "industry_dispersion": industry_dispersion,
        "class_of_worker_dispersion": class_of_worker_dispersion,
        "age_band_dispersion": age_band_dispersion,
        "sex_mix_balance": sex_mix_balance,
        "worker_mix_dispersion": worker_mix_dispersion,
        "industry_weights": industry_weights,
        "btos_sector_weights": btos_sector_weights,
        "confidence": confidence,
        "wage_record_share": wage_record_share,
    }


def main():
    repo_root = Path(__file__).resolve().parents[2]
    occupations = load_occupations(repo_root)
    normalized_dir = repo_root / "data" / "normalized"
    output_path = normalized_dir / "occupation_heterogeneity_context.csv"
    industry_mix_path = normalized_dir / "occupation_industry_mix.csv"
    sector_mix_path = normalized_dir / "occupation_btos_sector_mix.csv"

    metrics_by_socp = {}
    for socp_code in sorted({row["socp"] for row in occupations}):
        records, resolved_code, query_mode = fetch_occupation_rows(socp_code)
        metrics_by_socp[socp_code] = {
            **derive_metrics(records),
            "resolved_code": resolved_code,
            "query_mode": query_mode,
        }

    wage_percentiles = percentile_map(
        [metrics["wage_dispersion_ratio"] for metrics in metrics_by_socp.values()]
    )

    fieldnames = [
        "occupation_id",
        "onet_soc_code",
        "acs_reference_year",
        "acs_release_label",
        "acs_socp_code",
        "acs_query_mode",
        "sample_record_count",
        "employed_record_count",
        "weighted_worker_count",
        "wage_record_count",
        "median_wage_usd",
        "wage_p25_usd",
        "wage_p75_usd",
        "wage_dispersion_ratio",
        "wage_dispersion_percentile",
        "education_dispersion",
        "industry_dispersion",
        "class_of_worker_dispersion",
        "age_band_dispersion",
        "sex_mix_balance",
        "worker_mix_dispersion",
        "heterogeneity_index",
        "acs_confidence",
        "source_mix",
        "notes",
    ]
    industry_mix_fieldnames = [
        "occupation_id",
        "onet_soc_code",
        "acs_reference_year",
        "acs_release_label",
        "acs_socp_code",
        "acs_query_mode",
        "acs_industry_code",
        "industry_rank",
        "industry_weighted_worker_count",
        "industry_share",
        "source_mix",
        "notes",
    ]
    sector_mix_fieldnames = [
        "occupation_id",
        "onet_soc_code",
        "acs_reference_year",
        "acs_release_label",
        "acs_socp_code",
        "acs_query_mode",
        "btos_sector_code",
        "btos_sector_label",
        "sector_rank",
        "sector_weighted_worker_count",
        "sector_share",
        "covered_sector_share",
        "covered_sector_share_normalized",
        "source_mix",
        "notes",
    ]

    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for occupation in occupations:
            metrics = metrics_by_socp[occupation["socp"]]
            wage_dispersion_percentile = wage_percentiles.get(metrics["wage_dispersion_ratio"])
            heterogeneity_index = weighted_blend(
                [
                    (metrics["industry_dispersion"], 0.35),
                    (metrics["education_dispersion"], 0.25),
                    (metrics["worker_mix_dispersion"], 0.20),
                    (wage_dispersion_percentile, 0.20),
                ]
            )
            writer.writerow(
                {
                    "occupation_id": occupation["occupation_id"],
                    "onet_soc_code": occupation["onet_soc_code"],
                    "acs_reference_year": "2024",
                    "acs_release_label": "acs_1yr_pums",
                    "acs_socp_code": metrics["resolved_code"],
                    "acs_query_mode": metrics["query_mode"],
                    "sample_record_count": int(metrics["sample_record_count"]),
                    "employed_record_count": int(metrics["employed_record_count"]),
                    "weighted_worker_count": format_num(metrics["weighted_worker_count"]),
                    "wage_record_count": int(metrics["wage_record_count"]),
                    "median_wage_usd": format_num(metrics["median_wage_usd"]),
                    "wage_p25_usd": format_num(metrics["wage_p25_usd"]),
                    "wage_p75_usd": format_num(metrics["wage_p75_usd"]),
                    "wage_dispersion_ratio": format_num(metrics["wage_dispersion_ratio"]),
                    "wage_dispersion_percentile": format_num(wage_dispersion_percentile),
                    "education_dispersion": format_num(metrics["education_dispersion"]),
                    "industry_dispersion": format_num(metrics["industry_dispersion"]),
                    "class_of_worker_dispersion": format_num(metrics["class_of_worker_dispersion"]),
                    "age_band_dispersion": format_num(metrics["age_band_dispersion"]),
                    "sex_mix_balance": format_num(metrics["sex_mix_balance"]),
                    "worker_mix_dispersion": format_num(metrics["worker_mix_dispersion"]),
                    "heterogeneity_index": format_num(heterogeneity_index),
                    "acs_confidence": format_num(metrics["confidence"]),
                    "source_mix": "src_census_acs_2024_1yr_pums_api",
                    "notes": (
                        f"acs_api_records={int(metrics['sample_record_count'])}|"
                        f"employed_records={int(metrics['employed_record_count'])}|"
                        f"wage_record_share={metrics['wage_record_share']:.3f}|"
                        f"query_mode={metrics['query_mode']}"
                    ),
                }
            )

    with industry_mix_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=industry_mix_fieldnames)
        writer.writeheader()
        for occupation in occupations:
            metrics = metrics_by_socp[occupation["socp"]]
            total_weight = metrics["weighted_worker_count"]
            ranked_industries = sorted(
                metrics["industry_weights"].items(),
                key=lambda item: item[1],
                reverse=True,
            )
            for index, (industry_code, industry_weight) in enumerate(ranked_industries, start=1):
                share = None if not total_weight else (industry_weight / total_weight)
                writer.writerow(
                    {
                        "occupation_id": occupation["occupation_id"],
                        "onet_soc_code": occupation["onet_soc_code"],
                        "acs_reference_year": "2024",
                        "acs_release_label": "acs_1yr_pums",
                        "acs_socp_code": metrics["resolved_code"],
                        "acs_query_mode": metrics["query_mode"],
                        "acs_industry_code": industry_code,
                        "industry_rank": index,
                        "industry_weighted_worker_count": format_num(industry_weight),
                        "industry_share": format_num(share),
                        "source_mix": "src_census_acs_2024_1yr_pums_api",
                        "notes": (
                            f"acs_api_records={int(metrics['sample_record_count'])}|"
                            f"employed_records={int(metrics['employed_record_count'])}|"
                            f"query_mode={metrics['query_mode']}"
                        ),
                    }
                )

    with sector_mix_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=sector_mix_fieldnames)
        writer.writeheader()
        for occupation in occupations:
            metrics = metrics_by_socp[occupation["socp"]]
            total_weight = metrics["weighted_worker_count"]
            covered_weight = sum(metrics["btos_sector_weights"].values())
            ranked_sectors = sorted(
                metrics["btos_sector_weights"].items(),
                key=lambda item: item[1],
                reverse=True,
            )
            for index, (sector_code, sector_weight) in enumerate(ranked_sectors, start=1):
                sector_share = None if not total_weight else (sector_weight / total_weight)
                normalized_share = None if not covered_weight else (sector_weight / covered_weight)
                writer.writerow(
                    {
                        "occupation_id": occupation["occupation_id"],
                        "onet_soc_code": occupation["onet_soc_code"],
                        "acs_reference_year": "2024",
                        "acs_release_label": "acs_1yr_pums",
                        "acs_socp_code": metrics["resolved_code"],
                        "acs_query_mode": metrics["query_mode"],
                        "btos_sector_code": sector_code,
                        "btos_sector_label": BTOS_SECTOR_LABELS.get(sector_code, ""),
                        "sector_rank": index,
                        "sector_weighted_worker_count": format_num(sector_weight),
                        "sector_share": format_num(sector_share),
                        "covered_sector_share": format_num(covered_weight / total_weight) if total_weight else "",
                        "covered_sector_share_normalized": format_num(normalized_share),
                        "source_mix": "src_census_acs_2024_1yr_pums_api",
                        "notes": (
                            f"acs_api_records={int(metrics['sample_record_count'])}|"
                            f"employed_records={int(metrics['employed_record_count'])}|"
                            f"query_mode={metrics['query_mode']}"
                        ),
                    }
                )

    print(
        {
            "rows": len(occupations),
            "output_path": str(output_path),
            "industry_mix_path": str(industry_mix_path),
            "sector_mix_path": str(sector_mix_path),
            "source": "src_census_acs_2024_1yr_pums_api",
        }
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(exc, file=sys.stderr)
        sys.exit(1)
