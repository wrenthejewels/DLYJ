import csv
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pr": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def clamp(value, low=0.0, high=1.0):
    return max(low, min(high, value))


def normalize_bls_occ_code(value):
    digits = re.sub(r"[^0-9]", "", str(value or ""))
    if len(digits) == 6:
        return digits
    if len(digits) >= 8:
        return digits[:6]
    return ""


def normalize_onet_soc_code(value):
    text = str(value or "").strip()
    if re.fullmatch(r"\d{2}-\d{4}\.\d{2}", text):
        return text
    digits = normalize_bls_occ_code(text)
    if len(digits) == 6:
        return f"{digits[:2]}-{digits[2:]}.00"
    return ""


def try_float(value):
    text = str(value or "").strip()
    if not text or text in {"-", "--", "*", "**", "#"}:
        return None
    text = text.replace(",", "")
    try:
        return float(text)
    except ValueError:
        return None


def to_pct(value):
    numeric = try_float(value)
    if numeric is None:
        return None
    return clamp(numeric / 100.0)


def col_to_index(ref):
    letters = "".join(ch for ch in ref if ch.isalpha())
    index = 0
    for char in letters:
        index = (index * 26) + (ord(char.upper()) - 64)
    return index - 1


def load_shared_strings(archive):
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    values = []
    for item in root.findall("a:si", NS):
        parts = []
        for node in item.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"):
            parts.append(node.text or "")
        values.append("".join(parts))
    return values


def resolve_sheet_target(archive, sheet_name):
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    rel_map = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels.findall("pr:Relationship", NS)}
    for sheet in workbook.find("a:sheets", NS):
        if sheet.attrib.get("name") == sheet_name:
            rid = sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
            return "xl/" + rel_map[rid]
    raise ValueError(f"Missing sheet: {sheet_name}")


def load_sheet_rows(path, sheet_name):
    with zipfile.ZipFile(path) as archive:
        shared = load_shared_strings(archive)
        target = resolve_sheet_target(archive, sheet_name)
        worksheet = ET.fromstring(archive.read(target))
        rows = worksheet.findall(".//a:sheetData/a:row", NS)
        if not rows:
            return []

        parsed_rows = []
        for row in rows:
            values = []
            current_index = 0
            for cell in row.findall("a:c", NS):
                ref = cell.attrib.get("r", "")
                target_index = col_to_index(ref) if ref else current_index
                while current_index < target_index:
                    values.append("")
                    current_index += 1

                cell_type = cell.attrib.get("t")
                value_node = cell.find("a:v", NS)
                if value_node is None:
                    values.append("")
                elif cell_type == "s":
                    values.append(shared[int(value_node.text)])
                else:
                    values.append(value_node.text or "")
                current_index += 1
            parsed_rows.append(values)

    header = parsed_rows[0]
    records = []
    for row in parsed_rows[1:]:
        padded = row + ([""] * max(0, len(header) - len(row)))
        records.append(dict(zip(header, padded[: len(header)])))
    return records


def weighted_frequency(record_map, category, weight_map):
    total = 0.0
    observed = False
    for estimate_text, weight in weight_map.items():
        value = to_pct(record_map.get((category, estimate_text)))
        if value is None:
            continue
        observed = True
        total += value * weight
    return clamp(total) if observed else None


def weighted_blend(components):
    numerator = 0.0
    denominator = 0.0
    for value, weight in components:
        if value is None:
            continue
        numerator += value * weight
        denominator += weight
    if denominator <= 0:
        return None
    return clamp(numerator / denominator)


def share(record_map, category, estimate_text):
    return to_pct(record_map.get((category, estimate_text)))


def average_abs_diff(values):
    numeric = [value for value in values if value is not None]
    if not numeric:
        return None
    return sum(abs(value) for value in numeric) / len(numeric)


def derive_metrics(record_map):
    external_interaction = weighted_frequency(
        record_map,
        "Personal contacts: Verbal interactions, external",
        {
            "Percent of workers that required external verbal interactions every few minutes": 1.00,
            "Percent of workers that required external verbal interactions at least once per hour": 0.80,
            "Percent of workers that required external verbal interactions at least once per day": 0.55,
            "Percent of workers that required external verbal interactions at least once per week": 0.25,
            "Percent of workers that required external verbal interactions less than once per week, including never": 0.00,
        },
    )
    internal_interaction = weighted_frequency(
        record_map,
        "Personal contacts: Verbal interactions, internal",
        {
            "Percent of workers that required internal verbal interactions every few minutes": 1.00,
            "Percent of workers that required internal verbal interactions at least once per hour": 0.80,
            "Percent of workers that required internal verbal interactions at least once per day": 0.55,
            "Percent of workers that required internal verbal interactions at least once per week": 0.25,
            "Percent of workers that required internal verbal interactions less than once per week, including never": 0.00,
        },
    )
    people_skill = share(
        record_map,
        "Personal contacts: People skills",
        "Percent of workers that required more than basic people skills",
    )
    speaking = weighted_frequency(
        record_map,
        "Speaking",
        {
            "Percent of workers that did not require speaking": 0.00,
            "Percent of workers that required speaking, seldom": 0.15,
            "Percent of workers that required speaking, occasionally": 0.40,
            "Percent of workers that required speaking, frequently": 0.75,
            "Percent of workers that required speaking, constantly": 1.00,
        },
    )
    self_paced = share(
        record_map,
        "Pace: Control of workload",
        "Percent of workers that had a self-paced workload",
    )
    people_control = share(
        record_map,
        "Pace: Control of workload",
        "Percent of workers that had workload controlled by people",
    )
    software_control = share(
        record_map,
        "Pace: Control of workload",
        "Percent of workers that had workload controlled by machinery, equipment, or software",
    )
    target_control = share(
        record_map,
        "Pace: Control of workload",
        "Percent of workers that had workload controlled by numerical performance targets",
    )
    pause_control = share(
        record_map,
        "Pace: Pause control",
        "Percent of workers that had the ability to pause work",
    )
    fast_pace = share(
        record_map,
        "Pace: Work pace",
        "Percent of workers that had a consistent, generally fast work pace",
    )
    review_intensity = weighted_frequency(
        record_map,
        "Work review: Frequency of work being checked",
        {
            "Percent of workers that had work reviewed by a supervisor every few minutes": 1.00,
            "Percent of workers that had work reviewed by a supervisor at least once per hour": 0.80,
            "Percent of workers that had work reviewed by a supervisor at least once per day": 0.50,
            "Percent of workers that had work reviewed by a supervisor at least once per week": 0.25,
            "Percent of workers that had work reviewed by a supervisor less than once per week, including never": 0.05,
        },
    )
    supervisor_present = share(
        record_map,
        "Work review: Presence of supervisor",
        "Percent of workers that had a supervisor present",
    )
    supervising_others = share(
        record_map,
        "Work review: Supervising others",
        "Percent of workers that were required to perform supervisory duties",
    )
    telework = share(
        record_map,
        "Telework",
        "Percent of workers that had the ability to telework",
    )
    schedule_variability = share(
        record_map,
        "Adaptability: Work schedule variability",
        "Percent of workers that had work schedule variability required",
    )

    autonomy_intensity = weighted_blend(
        [
            (self_paced, 0.40),
            (pause_control, 0.25),
            ((1 - review_intensity) if review_intensity is not None else None, 0.20),
            (supervising_others, 0.15),
        ]
    )
    interaction_intensity = weighted_blend(
        [
            (external_interaction, 0.50),
            (internal_interaction, 0.20),
            (people_skill, 0.20),
            (speaking, 0.10),
        ]
    )
    pace_constraint_intensity = weighted_blend(
        [
            (people_control, 0.32),
            (target_control, 0.28),
            (software_control, 0.22),
            (fast_pace, 0.18),
        ]
    )
    # ORS works best here as an accountability/autonomy guardrail signal, not a generic
    # "human contact" score. External interaction alone was adding noise for routine
    # service/admin roles, so the structural index now leans on decision latitude,
    # supervisory ownership, and the ability to control pace.
    human_constraint_index = weighted_blend(
        [
            (autonomy_intensity, 0.40),
            (supervising_others, 0.30),
            ((1 - pace_constraint_intensity) if pace_constraint_intensity is not None else None, 0.20),
            (pause_control, 0.10),
        ]
    )

    core_values = [
        external_interaction,
        internal_interaction,
        people_skill,
        speaking,
        self_paced,
        pause_control,
        review_intensity,
        supervising_others,
        fast_pace,
        telework,
        schedule_variability,
    ]
    completeness = sum(value is not None for value in core_values) / len(core_values)

    return {
        "external_interaction_intensity": external_interaction,
        "internal_interaction_intensity": internal_interaction,
        "people_skill_intensity": people_skill,
        "speaking_intensity": speaking,
        "autonomy_intensity": autonomy_intensity,
        "review_intensity": review_intensity,
        "pause_control_share": pause_control,
        "self_paced_share": self_paced,
        "supervisor_present_share": supervisor_present,
        "supervising_others_share": supervising_others,
        "pace_constraint_intensity": pace_constraint_intensity,
        "people_control_share": people_control,
        "software_control_share": software_control,
        "target_control_share": target_control,
        "fast_pace_share": fast_pace,
        "telework_ability_share": telework,
        "work_schedule_variability_share": schedule_variability,
        "interaction_intensity": interaction_intensity,
        "human_constraint_index": human_constraint_index,
        "completeness": completeness,
    }


def merge_metrics(primary_metrics, backstop_metrics):
    merged = {}
    drift_inputs = []
    for key, value in primary_metrics.items():
        if key == "completeness":
            continue
        merged[key] = value if value is not None else backstop_metrics.get(key)
        if key in backstop_metrics and value is not None and backstop_metrics.get(key) is not None:
            drift_inputs.append(value - backstop_metrics[key])

    completeness = primary_metrics.get("completeness", 0.0)
    if backstop_metrics:
        completeness = max(completeness, backstop_metrics.get("completeness", 0.0))
    stability_delta = average_abs_diff(drift_inputs)
    stability = 0.72 if stability_delta is None else clamp(1 - stability_delta)
    source_support = 1.0 if backstop_metrics else 0.72
    confidence = clamp((0.55 * completeness) + (0.25 * stability) + (0.20 * source_support), 0.35, 0.95)
    return merged, confidence, stability


def format_num(value):
    if value is None:
        return ""
    return f"{value:.3f}"


def load_occupation_map(repo_root):
    occupations_path = repo_root / "data" / "normalized" / "occupations.csv"
    crosswalk_path = repo_root / "data" / "crosswalks" / "crosswalk_onet_to_bls.csv"

    with occupations_path.open("r", encoding="utf-8-sig", newline="") as handle:
        occupations = list(csv.DictReader(handle))
    with crosswalk_path.open("r", encoding="utf-8-sig", newline="") as handle:
        crosswalk = list(csv.DictReader(handle))

    bls_by_onet = {}
    for row in crosswalk:
        onet_code = normalize_onet_soc_code(row.get("onet_soc_code"))
        bls_code = normalize_bls_occ_code(row.get("bls_occ_code"))
        if onet_code and bls_code:
            bls_by_onet[onet_code] = bls_code

    mapped = []
    for row in occupations:
        onet_code = normalize_onet_soc_code(row.get("onet_soc_code"))
        bls_code = bls_by_onet.get(onet_code, normalize_bls_occ_code(onet_code))
        if not bls_code:
            continue
        mapped.append(
            {
                "occupation_id": row["occupation_id"],
                "onet_soc_code": onet_code,
                "bls_occ_code": bls_code,
                "title": row["title"],
            }
        )
    return mapped


def build_record_maps(records, bls_codes):
    result = {}
    for row in records:
        bls_code = normalize_bls_occ_code(row.get("2018 SOC CODE"))
        if bls_code not in bls_codes:
            continue
        estimate = row.get("ESTIMATE")
        if not estimate:
            continue
        key = (row.get("CATEGORY", ""), row.get("ESTIMATE TEXT", ""))
        result.setdefault(bls_code, {})[key] = estimate
    return result


def main():
    repo_root = Path(__file__).resolve().parents[2]
    raw_dir = repo_root / "data" / "raw" / "bls"
    normalized_dir = repo_root / "data" / "normalized"
    output_path = normalized_dir / "occupation_ors_structural_context.csv"

    occupations = load_occupation_map(repo_root)
    wanted_bls_codes = {row["bls_occ_code"] for row in occupations}

    rows_2025 = load_sheet_rows(raw_dir / "ors_2025_complete_dataset.xlsx", "ORS 2025 dataset")
    rows_2023 = load_sheet_rows(raw_dir / "ors_2023_complete_dataset.xlsx", "ORS 2023 dataset")
    map_2025 = build_record_maps(rows_2025, wanted_bls_codes)
    map_2023 = build_record_maps(rows_2023, wanted_bls_codes)

    header = [
        "occupation_id",
        "onet_soc_code",
        "bls_occ_code",
        "ors_reference_year",
        "ors_reference_wave",
        "interaction_intensity",
        "external_interaction_intensity",
        "internal_interaction_intensity",
        "people_skill_intensity",
        "speaking_intensity",
        "autonomy_intensity",
        "review_intensity",
        "pause_control_share",
        "self_paced_share",
        "supervisor_present_share",
        "supervising_others_share",
        "pace_constraint_intensity",
        "people_control_share",
        "software_control_share",
        "target_control_share",
        "fast_pace_share",
        "telework_ability_share",
        "work_schedule_variability_share",
        "human_constraint_index",
        "ors_confidence",
        "source_mix",
        "notes",
    ]

    output_rows = []
    for occupation in occupations:
        bls_code = occupation["bls_occ_code"]
        primary_raw = map_2025.get(bls_code, {})
        primary = derive_metrics(primary_raw)
        backstop_raw = map_2023.get(bls_code, {})
        backstop = derive_metrics(backstop_raw) if backstop_raw else {}
        merged, confidence, stability = merge_metrics(primary, backstop)
        source_mix = "src_bls_ors_2025_prelim" if primary_raw else ""
        if backstop_raw:
            source_mix = f"{source_mix}|src_bls_ors_2023" if source_mix else "src_bls_ors_2023"

        if primary_raw:
            reference_year = "2025"
            reference_wave = "third_wave_preliminary"
            source_primary = "2025"
        elif backstop_raw:
            reference_year = "2023"
            reference_wave = "second_wave_final"
            source_primary = "2023"
        else:
            reference_year = ""
            reference_wave = "no_rows"
            source_primary = "none"

        output_rows.append(
            {
                "occupation_id": occupation["occupation_id"],
                "onet_soc_code": occupation["onet_soc_code"],
                "bls_occ_code": bls_code,
                "ors_reference_year": reference_year,
                "ors_reference_wave": reference_wave,
                "interaction_intensity": format_num(merged.get("interaction_intensity")),
                "external_interaction_intensity": format_num(merged.get("external_interaction_intensity")),
                "internal_interaction_intensity": format_num(merged.get("internal_interaction_intensity")),
                "people_skill_intensity": format_num(merged.get("people_skill_intensity")),
                "speaking_intensity": format_num(merged.get("speaking_intensity")),
                "autonomy_intensity": format_num(merged.get("autonomy_intensity")),
                "review_intensity": format_num(merged.get("review_intensity")),
                "pause_control_share": format_num(merged.get("pause_control_share")),
                "self_paced_share": format_num(merged.get("self_paced_share")),
                "supervisor_present_share": format_num(merged.get("supervisor_present_share")),
                "supervising_others_share": format_num(merged.get("supervising_others_share")),
                "pace_constraint_intensity": format_num(merged.get("pace_constraint_intensity")),
                "people_control_share": format_num(merged.get("people_control_share")),
                "software_control_share": format_num(merged.get("software_control_share")),
                "target_control_share": format_num(merged.get("target_control_share")),
                "fast_pace_share": format_num(merged.get("fast_pace_share")),
                "telework_ability_share": format_num(merged.get("telework_ability_share")),
                "work_schedule_variability_share": format_num(merged.get("work_schedule_variability_share")),
                "human_constraint_index": format_num(merged.get("human_constraint_index")),
                "ors_confidence": format_num(confidence),
                "source_mix": source_mix,
                "notes": f"source_primary={source_primary}|completeness={primary.get('completeness', 0.0):.2f}|stability={stability:.2f}",
            }
        )

    output_rows.sort(key=lambda row: row["occupation_id"])
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=header)
        writer.writeheader()
        writer.writerows(output_rows)

    print(
        {
            "rows": len(output_rows),
            "output_path": str(output_path),
            "primary_source": "src_bls_ors_2025_prelim",
            "backstop_source": "src_bls_ors_2023",
        }
    )


if __name__ == "__main__":
    main()
