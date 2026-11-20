"""Import the supplied Johannesburg research without replacing stronger evidence.

Uses Python's standard library only. Run from any directory; --check detects stale
generated data without writing. Provider checks are dated snapshots, not live rates.
"""
import argparse
import csv
import io
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'Res Data/johannesburg-student-accommodations-complete-breakdown.xlsx'
DATA = ROOT / 'web/src/data'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
MARKER = ' Johannesburg workbook supplement: '
# Reviewed building-level crosswalk. Similar names alone are not sufficient.
MATCHES = {1: 'GSA-P0001', 4: 'GSA-P0003', 10: 'GSA-P0010',
           11: 'GSA-P0011', 13: 'GSA-P0008', 17: 'GSA-P0006',
           18: 'GSA-P0005', 20: 'GSA-P0007', 25: 'GSA-P0012',
           26: 'GSA-P0015', 31: 'GSA-P0009'}
EXPECTED_NAMES = {
    1: 'Campus Africa | Braamlofts', 2: 'Campus Africa | Rennie House',
    3: 'Campus Africa | 80 Jorissen', 4: 'Campus Africa | Amani House (49 Jorissen)',
    5: 'Campus Africa | Wynton Joy', 6: 'Campus Africa | Dunvista Mansions',
    10: 'Thrive | Horizon Heights', 11: 'Thrive | The Richmond & Richmond Central',
    13: 'Respublica | Yale Village', 14: 'Respublica | The Fields',
    17: 'South Point | 46 De Korte', 18: 'South Point | 56 Jorissen',
    20: 'South Point | Relyant House', 25: 'The Campus Luxury Student Accommodation',
    26: 'Twickenham Student Apartments', 31: 'Aspire Student Living | Quintal'
}
MONEY = r'R\s*([\d,]+(?:\.\d{2})?)'


def read_rows(path):
    """Read the detailed sheet, including shared or inline strings, by cell address."""
    with zipfile.ZipFile(path) as archive:
        shared = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            tree = ET.fromstring(archive.read('xl/sharedStrings.xml'))
            shared = [''.join(t.itertext()) for t in tree.findall('s:si', NS)]
        workbook = ET.fromstring(archive.read('xl/workbook.xml'))
        sheet = next(s for s in workbook.findall('s:sheets/s:sheet', NS)
                     if s.attrib['name'] == 'All JHB Residences (Detailed)')
        relation_id = sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
        relations = ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
        target = next(r.attrib['Target'] for r in relations if r.attrib['Id'] == relation_id)
        sheet_path = target.lstrip('/') if target.startswith('/') else 'xl/' + target
        tree = ET.fromstring(archive.read(sheet_path))
        rows = []
        for row in tree.findall('s:sheetData/s:row', NS):
            values = [''] * 19
            for cell in row.findall('s:c', NS):
                letters = re.match(r'[A-Z]+', cell.attrib['r'])[0]
                col = 0
                for letter in letters:
                    col = col * 26 + ord(letter) - 64
                if col > 19:
                    continue
                value = cell.findtext('s:v', default='', namespaces=NS)
                if cell.attrib.get('t') == 's':
                    value = shared[int(value)]
                elif cell.attrib.get('t') == 'inlineStr':
                    value = ''.join(t.text or '' for t in cell.findall('s:is//s:t', NS))
                values[col - 1] = value
            rows.append(values)
    if rows[0][0] != 'ID' or rows[0][14] != 'Detailed Price Breakdown by Room Type (2026)':
        raise ValueError('Unexpected workbook columns; review the importer before refreshing.')
    result = [row for row in rows[1:] if row[0]]
    ids = [int(row[0]) for row in result]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate workbook IDs')
    for row in result:
        low, high = float(row[12]), float(row[13])
        if not 0 < low <= high:
            raise ValueError(f'Invalid monthly price range for row {row[0]}')
    return result


def money(value):
    return f'R{float(value):,.0f}'


def room_rates(breakdown):
    rates = []
    for part in breakdown.split(';'):
        if ':' not in part:
            continue
        name, price = part.split(':', 1)
        amounts = re.findall(MONEY, price.split('(')[0])
        if not amounts:
            continue
        # Do not assign one mixed single/studio or ensuite/studio price to a category.
        if re.search(r'sharing|shared|sleeper', name, re.I):
            category = 'sharing'
        elif re.search(r'single', name, re.I) and not re.search(r'studio', name, re.I):
            category = 'single'
        elif re.search(r'studio|bachelor', name, re.I) and not re.search(r'ensuite|en-suite|single', name, re.I):
            category = 'studio'
        elif re.search(r'apartment', name, re.I):
            category = 'apartment'
        else:
            continue
        numbers = [float(a.replace(',', '')) for a in amounts]
        monthly = money(min(numbers))
        if min(numbers) != max(numbers):
            monthly += '–' + money(max(numbers))
        qualifier = 'Up to' if 'up to' in price.lower() else 'From' if 'from' in price.lower() else 'Listed'
        rates.append({'category': category, 'name': name.strip(), 'monthly': monthly,
                      'basis': 'basis unconfirmed',
                      'note': f'{qualifier} · workbook 2026 estimate; confirm current rent and lease length'})
    return rates


def append_note(original, note):
    return original.split(MARKER)[0] + MARKER + note


def generate(rows, original, checks):
    records = {item['id']: item for item in original}
    rates = {}
    review = []
    for row in rows:
        number = int(row[0])
        if number in EXPECTED_NAMES and row[2] != EXPECTED_NAMES[number]:
            raise ValueError(f'Building identity changed for workbook ID {number}; review the crosswalk and provider checks.')
        if number == 2:
            review.append([number, row[2], '', 'Held for identity review',
                           'Workbook: 18 Hoofd Street; existing Rennie House Apartments: 19 Ameshoff Street. No automatic merge.'])
            continue
        existing_id = MATCHES.get(number)
        identifier = existing_id or f'JHB-WB-{number:04d}'
        checked = checks.get(str(number))
        source_note = f'{SOURCE.name}, detailed sheet row {number + 1} (ID {number}). Source has no research date; 2026 rates are estimates unless a dated provider check is stated.'
        campus = f'Workbook estimates, not verified routes: {row[10]}. Walking estimate to {row[7]}: {row[9]}.'
        if existing_id:
            item = records[existing_id]
            item['contact'] = append_note(item['contact'], f'{row[18]}. Social media: {row[17]}. Contacts not independently confirmed.')
            item['campus'] = append_note(item['campus'], campus)
            item['verification'] = append_note(item['verification'], source_note)
            # Keep existing provider-read prices, amenities, addresses, pins and funding evidence.
            item['gaps'] = append_note(item['gaps'], 'Workbook rates may conflict with existing provider research. Existing provider-read rates retained; workbook funding and campus estimates remain unverified.')
            if number in (26, 31):
                item['advertisedPrice'] = f'Workbook estimate: {money(row[12])}–{money(row[13])} per month. {row[14]}. Confirm current rent, lease length and per-person/per-room basis with the provider.'
                item['pricePeriod'] = '2026 workbook estimates imported 2026-11-20; not confirmed for 2027. The previously reviewed provider page did not publish a numeric rent.'
                item['rooms'] = append_note(item['rooms'], row[14].split(' (')[0] + '. Workbook room descriptions and prices are unconfirmed.')
                rates[identifier] = room_rates(row[14])
                action = 'Filled missing rent with labelled workbook estimate'
            else:
                action = 'Added contacts/campus context; retained provider-read prices'
            review.append([number, row[2], identifier, action,
                           'Combined Richmond/Richmond Central row: no combined rates assigned to The Richmond.' if number == 11 else 'Existing addresses, amenities, coordinates and funding evidence retained.'])
            continue

        name = row[2].split(' | ')[-1]
        funding = ('Workbook reports NSFAS funding compatibility; official property-level approval is not verified.'
                   if 'NSFAS' in row[11] else 'Workbook reports private/cash/bursary options; eligibility not verified.')
        item = dict.fromkeys(original[0].keys(), '')
        item.update({
            'id': identifier, 'name': name, 'provider': row[1], 'address': row[4],
            'locality': row[3] + ', City of Johannesburg',
            'region': ('West and Southwest Johannesburg (Soweto, Auckland Park, Westdene, Melville and nearby areas)'
                       if any(area in row[3] for area in ['Auckland Park', 'Westdene', 'Hurst Hill'])
                       else 'Central Johannesburg (Braamfontein, Parktown, Hillbrow, Doornfontein, Yeoville, Berea and Johannesburg CBD)'),
            'classification': 'Student accommodation',
            'latitude': float(row[5]) if row[5] else None,
            'longitude': float(row[6]) if row[6] else None,
            'coordinateStatus': 'Workbook coordinate; not independently verified',
            'coordinatePrecision': 'Approximate; entrance not verified',
            'coordinateNotes': 'Supplied workbook pin. Confirm the street address and entrance with the provider before travel.',
            'coordinateSource': 'Supplied Johannesburg accommodation workbook',
            'website': checked['url'] if checked else row[16],
            'contact': f'{row[18]}. Workbook contact details; not independently confirmed. Social media: {row[17]}.',
            'advertisedPrice': f'Workbook estimate: {money(row[12])}–{money(row[13])} per month. {row[14]}. Confirm current rent, lease length and per-person/per-room basis.',
            'pricePeriod': '2026 workbook estimates imported 2026-11-20. Source research date unavailable; not confirmed for 2027.',
            'rooms': row[14] + '. Workbook room descriptions and rates; confirm availability.',
            'amenities': row[15] + ' Workbook-reported features; inclusion in rent and availability not independently verified.',
            'campus': campus, 'funding': funding,
            'fundingEvidence': 'The workbook funding claim is not official approval evidence. Confirm property, academic year and personal eligibility with the institution/funder.',
            'verification': source_note,
            'confidence': 'Workbook research only; current pricing, amenities, location and funding require provider confirmation.',
            'gaps': 'Current availability, billing basis, deposits, fee terms, utilities and academic-year applicability require confirmation. Map pins and walking distances are approximate.',
            'witsStatus': 'Not assessed against the Wits provider register.',
            'ujStatus': 'Not assessed against the UJ provider register.',
            'tutStatus': 'Not assessed against the TUT provider register.',
            'upStatus': 'Not assessed against the UP provider register.',
            'institutionNotes': 'Workbook funding statement is a research claim, not institutional accreditation.',
            'sources': [checked['url'] if checked else row[16]], 'completeness': ''
        })
        rates[identifier] = room_rates(row[14])
        if checked:
            item.update({k: checked[k] for k in ['advertisedPrice', 'pricePeriod']})
            item['verification'] += f" Provider room rates checked {checked['checkedOn']}: {checked['url']}. Workbook prices superseded by provider-advertised prices; availability and approval remain unverified."
            item['rooms'] = checked['rooms']
            rates[identifier] = checked['rates']
        if number == 6:
            # A known street-address conflict must not produce a misleading map pin.
            item['latitude'] = item['longitude'] = None
            item['coordinateStatus'] = 'Withheld pending address reconciliation'
            item['coordinatePrecision'] = ''
            item['coordinateNotes'] = 'Workbook says 70 Banket Street; provider header says 3 Nugget Street. Confirm the building entrance before mapping.'
            item['gaps'] += ' Address conflict: workbook 70 Banket Street versus provider header 3 Nugget Street; coordinate withheld.'
        records[identifier] = item
        review.append([number, row[2], identifier,
                       'Added with provider-advertised rates' if checked else 'Added with labelled workbook estimates',
                       item['coordinateNotes'] if number == 6 else 'Workbook pins, amenities, campus distances and funding are unverified.'])
    report = io.StringIO(newline='')
    writer = csv.writer(report, lineterminator='\n')
    writer.writerow(['workbook_id', 'workbook_residence', 'property_id', 'action', 'review_note'])
    writer.writerows(review)
    return {
        DATA / 'researchProperties.json': json.dumps(list(records.values()), ensure_ascii=False, indent=2) + '\n',
        DATA / 'johannesburgWorkbookRates.json': json.dumps(rates, ensure_ascii=False, indent=2) + '\n',
        ROOT / 'Res Data/johannesburg-import-review.csv': report.getvalue()
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    original = json.loads((DATA / 'researchProperties.json').read_text(encoding='utf-8'))
    checks = json.loads((ROOT / 'Res Data/johannesburg-provider-checks.json').read_text(encoding='utf-8'))
    outputs = generate(read_rows(SOURCE), original, checks)
    stale = []
    for path, content in outputs.items():
        if not path.exists() or path.read_text(encoding='utf-8') != content:
            stale.append(str(path.relative_to(ROOT)))
            if not args.check:
                path.write_text(content, encoding='utf-8', newline='\n')
    if args.check and stale:
        raise SystemExit('Stale generated data: ' + ', '.join(stale))
    print('Johannesburg workbook: 37 rows reviewed; 11 matched, 25 added, 1 held for identity review.')


if __name__ == '__main__':
    main()
