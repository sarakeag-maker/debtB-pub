import Papa from 'papaparse'

export interface ParsedRow {
  propertyAddress: string
  flatRef: string
  leaseholderName: string
  description: string
  amount: string
  fromDate: string
  toDate?: string
  category?: string
}

export interface ParseCSVResult {
  rows: ParsedRow[]
  rawHeaders: string[]
  errors: { row: number; message: string }[]
}

/**
 * Maps common column header variations (lowercase) to canonical field names.
 */
const COLUMN_ALIASES: Record<string, keyof ParsedRow> = {
  // propertyAddress
  propertyaddress: 'propertyAddress',
  property_address: 'propertyAddress',
  property: 'propertyAddress',
  address: 'propertyAddress',
  building: 'propertyAddress',
  buildingaddress: 'propertyAddress',

  // flatRef
  flatref: 'flatRef',
  flat_ref: 'flatRef',
  flat: 'flatRef',
  unit: 'flatRef',
  unitref: 'flatRef',
  unit_ref: 'flatRef',
  flatnumber: 'flatRef',
  flat_number: 'flatRef',
  unitnumber: 'flatRef',

  // leaseholderName
  leaseholdername: 'leaseholderName',
  leaseholder_name: 'leaseholderName',
  leaseholder: 'leaseholderName',
  tenant: 'leaseholderName',
  tenantname: 'leaseholderName',
  tenant_name: 'leaseholderName',
  owner: 'leaseholderName',
  ownername: 'leaseholderName',

  // description
  description: 'description',
  desc: 'description',
  details: 'description',
  chargedescription: 'description',
  charge_description: 'description',
  notes: 'description',

  // amount
  amount: 'amount',
  amountdue: 'amount',
  amount_due: 'amount',
  balance: 'amount',
  debt: 'amount',
  outstanding: 'amount',
  outstandingbalance: 'amount',

  // fromDate
  fromdate: 'fromDate',
  from_date: 'fromDate',
  datefrom: 'fromDate',
  date_from: 'fromDate',
  startdate: 'fromDate',
  start_date: 'fromDate',
  duedate: 'fromDate',
  due_date: 'fromDate',
  date: 'fromDate',

  // toDate
  todate: 'toDate',
  to_date: 'toDate',
  dateto: 'toDate',
  date_to: 'toDate',
  enddate: 'toDate',
  end_date: 'toDate',

  // category
  category: 'category',
  chargetype: 'category',
  charge_type: 'category',
  type: 'category',
  debtcategory: 'category',
  debt_category: 'category',
}

const REQUIRED_FIELDS: Array<keyof ParsedRow> = [
  'propertyAddress',
  'flatRef',
  'leaseholderName',
  'amount',
  'fromDate',
]

/**
 * Parses a CSV buffer into structured rows, applying header aliases and
 * validating that required fields are present.
 *
 * Row numbers in errors are CSV row numbers (header = row 1, first data row = row 2).
 */
export function parseCSVBuffer(buffer: Buffer): ParseCSVResult {
  const csvText = buffer.toString('utf-8')
  const errors: { row: number; message: string }[] = []
  const rows: ParsedRow[] = []
  let rawHeaders: string[] = []

  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => {
      const normalised = header.trim().toLowerCase().replace(/\s+/g, '')
      const canonical = COLUMN_ALIASES[normalised]
      return canonical ?? normalised
    },
  })

  // Capture raw (pre-transform) headers by re-parsing the first line
  const firstLine = csvText.split(/\r?\n/)[0]
  if (firstLine) {
    rawHeaders = firstLine.split(',').map((h) => h.trim())
  }

  if (result.errors.length > 0) {
    result.errors.forEach((e) => {
      const rowNum = typeof e.row === 'number' ? e.row + 2 : 0
      errors.push({ row: rowNum, message: `Parse error: ${e.message}` })
    })
  }

  result.data.forEach((record, index) => {
    // CSV data rows start at row 2 (row 1 is the header)
    const csvRowNumber = index + 2

    const missingFields: string[] = []
    for (const field of REQUIRED_FIELDS) {
      const value = record[field]
      if (!value || value.trim() === '') {
        missingFields.push(field)
      }
    }

    if (missingFields.length > 0) {
      errors.push({
        row: csvRowNumber,
        message: `Missing required field(s): ${missingFields.join(', ')}`,
      })
      return
    }

    const parsedRow: ParsedRow = {
      propertyAddress: record['propertyAddress'].trim(),
      flatRef: record['flatRef'].trim(),
      leaseholderName: record['leaseholderName'].trim(),
      description: (record['description'] ?? '').trim(),
      amount: record['amount'].trim(),
      fromDate: record['fromDate'].trim(),
    }

    const toDate = record['toDate']
    if (toDate && toDate.trim() !== '') {
      parsedRow.toDate = toDate.trim()
    }

    const category = record['category']
    if (category && category.trim() !== '') {
      parsedRow.category = category.trim().toUpperCase()
    }

    rows.push(parsedRow)
  })

  return { rows, rawHeaders, errors }
}
