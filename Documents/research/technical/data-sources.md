# FDA Regulatory Data Sources -- Technical Research

Last-Updated: 2026-03-03
Maintainer: Research / Data Pipeline
Status: Active Reference Document

---

## Table of Contents

1. [Federal Register API](#1-federal-register-api)
2. [openFDA API](#2-openfda-api)
3. [FDA.gov Direct Data Sources](#3-fdagov-direct-data-sources)
4. [FDA Data Dashboard API (DDAPI)](#4-fda-data-dashboard-api-ddapi)
5. [Regulations.gov API](#5-regulationsgov-api)
6. [GovInfo API and Bulk Data](#6-govinfo-api-and-bulk-data)
7. [Other Potential Sources](#7-other-potential-sources)
8. [Data Freshness and Notification Mechanisms](#8-data-freshness-and-notification-mechanisms)
9. [Summary Comparison Table](#9-summary-comparison-table)
10. [Recommended Ingestion Priority](#10-recommended-ingestion-priority)

---

## 1. Federal Register API

### Overview

The Federal Register is the "Daily Journal of the United States Government." The API provides
programmatic access to all Federal Register content published since 1994 (with a digitization
project underway for 1936--1994 content). It is operated by the Office of the Federal Register
and the National Archives.

- **Base URL**: `https://www.federalregister.gov/api/v1/`
- **Documentation**: https://www.federalregister.gov/developers/documentation/api/v1
- **Developer Resources**: https://www.federalregister.gov/reader-aids/developer-resources/rest-api
- **Data Coverage**: 1994 to present (all Federal Register documents)
- **Formats**: JSON, CSV (XML available via GPO bulk downloads)
- **Authentication**: NONE required -- fully open, no API key needed
- **Rate Limits**: Not explicitly documented, but the API is free and open
- **Legal Status**: NOT the official legal edition (the official version is on govinfo.gov)

### Endpoints

#### GET /api/v1/documents/{document_number}.json
Retrieve a single document by its Federal Register document number.

**Example**:
```
https://www.federalregister.gov/api/v1/documents/2019-24499.json
```

#### GET /api/v1/documents.json
Search and retrieve multiple documents with filtering.

**Key Query Parameters**:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `conditions[term]` | Full-text keyword search | `conditions[term]=FDA+food+safety` |
| `conditions[agencies][]` | Filter by agency slug | `conditions[agencies][]=food-and-drug-administration` |
| `conditions[type][]` | Filter by document type | `conditions[type][]=RULE` |
| `conditions[publication_date][gte]` | Published on or after date | `conditions[publication_date][gte]=2025-01-01` |
| `conditions[publication_date][lte]` | Published on or before date | `conditions[publication_date][lte]=2025-12-31` |
| `conditions[docket_id]` | Filter by docket ID | `conditions[docket_id]=FDA-2024-N-1234` |
| `per_page` | Results per page (default varies) | `per_page=100` |
| `page` | Page number for pagination | `page=2` |
| `order` | Sort order | `order=newest` or `order=oldest` |
| `fields[]` | Specify which fields to return | `fields[]=title&fields[]=abstract` |

**IMPORTANT PAGINATION LIMIT**: You can only paginate through the first 2,000 results
of any search query. For larger datasets, narrow your search with date ranges or other
filters, or use bulk XML downloads from GPO.

#### Document Type Codes

| Code | Type |
|------|------|
| `RULE` | Final Rule |
| `PRORULE` | Proposed Rule |
| `NOTICE` | Notice |
| `PRESDOCU` | Presidential Document |

**Presidential Document Subtypes**: determination, executive_order, memorandum, notice, proclamation

#### Available Response Fields

The following fields can be requested via the `fields[]` parameter:

- `abstract` -- Summary text of the document
- `abstract_html_url` -- URL to HTML abstract
- `action` -- Action type described in the document
- `agencies` -- Array of agency objects with name, slug, id
- `agency_names` -- Array of agency name strings
- `body_html_url` -- URL to full HTML body
- `cfr_references` -- Code of Federal Regulations references
- `citation` -- Federal Register citation (e.g., "89 FR 12345")
- `comments_close_on` -- Comment period closing date
- `correction_of` -- Reference to corrected document
- `corrections` -- Array of correction references
- `dates` -- Important dates described in the document
- `docket_id` -- Primary docket ID
- `docket_ids` -- All associated docket IDs
- `document_number` -- Unique FR document number
- `effective_on` -- Effective date for rules
- `end_page` -- Ending page in print FR
- `excerpts` -- Search result excerpts
- `executive_order_notes` -- Notes for executive orders
- `executive_order_number` -- EO number
- `full_text_xml_url` -- URL to full XML text
- `html_url` -- URL to document on FederalRegister.gov
- `json_url` -- URL to this document's JSON
- `mods_url` -- URL to MODS metadata
- `page_length` -- Number of pages
- `pdf_url` -- URL to PDF version
- `president` -- President name (for presidential docs)
- `public_inspection_pdf_url` -- Pre-publication PDF URL
- `publication_date` -- Date published in FR
- `raw_text_url` -- URL to raw text
- `regulation_id_number_info` -- RIN information
- `regulation_id_numbers` -- Associated RINs
- `regulations_dot_gov_info` -- Regulations.gov metadata
- `regulations_dot_gov_url` -- Link to Regulations.gov
- `significant` -- Whether document is "significant" under EO 12866
- `signing_date` -- Date signed (presidential docs)
- `start_page` -- Starting page in print FR
- `subtype` -- Document subtype
- `title` -- Document title
- `toc_doc` -- Table of contents reference
- `toc_subject` -- TOC subject classification
- `topics` -- Array of topic strings
- `type` -- Document type (Rule, Proposed Rule, Notice, Presidential Document)
- `volume` -- FR volume number

#### FDA-Specific Filtering

To get only FDA documents:
```
https://www.federalregister.gov/api/v1/documents.json?conditions[agencies][]=food-and-drug-administration&per_page=20&order=newest
```

The FDA agency slug is: `food-and-drug-administration`

### Bulk XML from GPO

For large-scale data needs, the Government Publishing Office provides bulk XML files:
- Federal Register issues from September 2012 onward available in XML
- Available via govinfo.gov bulk data repository
- Includes full document text and MODS metadata
- Can append `/xml` or `/json` to govinfo bulkdata URLs for machine-readable listings

---

## 2. openFDA API

### Overview

openFDA is an Elasticsearch-based API created by the FDA to serve public datasets about drugs,
medical devices, foods, and other FDA-regulated products. It is the primary structured data API
for FDA enforcement and safety data.

- **Base URL**: `https://api.fda.gov/`
- **Documentation**: https://open.fda.gov/apis/
- **GitHub Repository**: https://github.com/FDA/openfda
- **Format**: JSON only
- **Authentication**: Optional API key (recommended for production use)
- **Data License**: Creative Commons CC0 public domain

### Authentication and Rate Limits

| Access Level | Requests/Minute | Requests/Day |
|-------------|----------------|--------------|
| No API key | 240 | 1,000 |
| With API key | 240 | 120,000 |

**How to get an API key**: Register at https://open.fda.gov/apis/authentication/ -- free, instant

### Query Parameters (All Endpoints)

| Parameter | Description | Max Value |
|-----------|-------------|-----------|
| `search` | Filter by field:value | N/A |
| `sort` | Sort by field:asc or field:desc | N/A |
| `count` | Count unique values of a field | Returns top 1,000 values |
| `limit` | Max records to return | 1,000 |
| `skip` | Offset for pagination | 25,000 |

**Search Syntax Examples**:
- Exact match: `search=field:"value"`
- AND: `search=field1:"a"+AND+field2:"b"`
- OR: `search=field1:"a"+field2:"b"`
- Date range: `search=report_date:[20200101+TO+20201231]`
- Wildcard: `search=product_description:"*vitamin*"`

**Pagination Note**: `skip` maxes out at 25,000. For datasets exceeding 26,000 records
(limit + skip), use the bulk download files or narrow searches with date ranges.

### Drug Endpoints

#### Drug Enforcement (Recalls)
- **URL**: `https://api.fda.gov/drug/enforcement.json`
- **Data Source**: FDA Recall Enterprise System (RES)
- **Coverage**: 2004 to present
- **Update Frequency**: Weekly
- **Use Case**: Track drug product recalls by classification, firm, reason, and status

**Key Searchable Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `classification` | string | Recall class: "Class I", "Class II", or "Class III" |
| `status` | string | "Ongoing", "Completed", or "Terminated" |
| `recalling_firm` | string | Company name |
| `product_description` | string | Description of recalled product |
| `reason_for_recall` | string | Why the recall was initiated |
| `recall_number` | string | Unique recall identifier |
| `recall_initiation_date` | string | Date recall began (YYYYMMDD) |
| `report_date` | string | Date of enforcement report |
| `voluntary_mandated` | string | "Voluntary" or "Mandated" |
| `distribution_pattern` | string | Geographic distribution |
| `product_type` | string | "Drugs" |
| `product_quantity` | string | Amount of product |
| `code_info` | string | Lot/batch codes |
| `event_id` | string | Unique event ID |
| `city` | string | City of recalling firm |
| `state` | string | State of recalling firm |
| `country` | string | Country of recalling firm |
| `openfda` | object | Harmonized fields (brand_name, generic_name, manufacturer_name, etc.) |

**Example Query** -- Class I drug recalls in 2025:
```
https://api.fda.gov/drug/enforcement.json?search=classification:"Class+I"+AND+report_date:[20250101+TO+20251231]&limit=100
```

#### Drug Adverse Events (FAERS)
- **URL**: `https://api.fda.gov/drug/event.json`
- **Data Source**: FDA Adverse Event Reporting System (FAERS)
- **Coverage**: 2004 to present
- **Update Frequency**: Quarterly (may lag 3+ months)
- **Standard**: ICH E2b/M2 version 2.1
- **Use Case**: Monitor drug safety signals, side effects, medication errors

**Key Searchable Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `receivedate` | string | Date FDA received the report |
| `receiptdate` | string | Date of most recent info |
| `serious` | string | "1" for serious, "2" for non-serious |
| `seriousnessdeath` | string | "1" if patient died |
| `seriousnesshospitalization` | string | "1" if hospitalized |
| `patient.drug.medicinalproduct` | string | Drug name |
| `patient.drug.drugindication` | string | Indication for use |
| `patient.reaction.reactionmeddrapt` | string | Adverse reaction (MedDRA term) |
| `patient.patientsex` | string | "1" male, "2" female |
| `patient.patientonsetage` | string | Patient age at onset |
| `primarysource.qualification` | string | Reporter type |

**Limitations**:
- Reports are unverified and may be incomplete
- No causal relationship can be established
- Individual drugs cannot be definitively linked to specific reactions within a report
- Not suitable as a real-time alert system

**Example Query** -- Adverse events for a specific drug:
```
https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"metformin"&limit=10
```

#### Drug Labeling
- **URL**: `https://api.fda.gov/drug/label.json`
- **Data Source**: Structured Product Labeling (SPL)
- **Coverage**: Current approved drug labels
- **Use Case**: Access prescribing information, warnings, contraindications

#### Drug NDC (National Drug Code)
- **URL**: `https://api.fda.gov/drug/ndc.json`
- **Use Case**: Drug identification by NDC code

#### Drug Shortages
- **URL**: `https://api.fda.gov/drug/shortages.json`
- **Use Case**: Track current drug supply disruptions

### Food Endpoints

#### Food Enforcement (Recalls)
- **URL**: `https://api.fda.gov/food/enforcement.json`
- **Data Source**: FDA Recall Enterprise System (RES)
- **Coverage**: 2004 to present
- **Update Frequency**: Weekly
- **Fields**: Same structure as drug enforcement endpoint
- **Use Case**: Track food product recalls

#### Food Adverse Events (CAERS)
- **URL**: `https://api.fda.gov/food/event.json`
- **Data Source**: CFSAN Adverse Event Reporting System (CAERS)
- **Coverage**: 2004 to present
- **Use Case**: Adverse events for foods, dietary supplements, cosmetics

### Device Endpoints

#### Device Adverse Events (MAUDE)
- **URL**: `https://api.fda.gov/device/event.json`
- **Data Source**: MAUDE (Manufacturer and User Facility Device Experience)
- **Coverage**: ~1992 to present
- **Update Frequency**: Weekly
- **Use Case**: Medical device safety surveillance

**Key fields**: device name, manufacturer, event type, patient outcome, report date,
MDR report key, product code, UDI-DI (added October 2022)

#### Device Recalls
- **URL**: `https://api.fda.gov/device/recall.json`
- **Use Case**: Medical device recall tracking

#### Device Enforcement
- **URL**: `https://api.fda.gov/device/enforcement.json`
- **Data Source**: Recall Enterprise System (RES)
- **Coverage**: 2004 to present
- **Update Frequency**: Weekly

#### Device Classification
- **URL**: `https://api.fda.gov/device/classification.json`
- **Use Case**: Look up device product codes, panels, regulatory classifications

#### Device 510(k)
- **URL**: `https://api.fda.gov/device/510k.json`
- **Use Case**: Premarket notification clearance data

#### Device PMA (Premarket Approval)
- **URL**: `https://api.fda.gov/device/pma.json`
- **Use Case**: Premarket approval application data

#### Device UDI (Unique Device Identifier)
- **URL**: `https://api.fda.gov/device/udi.json`
- **Use Case**: Device identification via UDI system

#### Device Registration and Listing
- **URL**: `https://api.fda.gov/device/registrationlisting.json`
- **Use Case**: Facility registration and device listing data

### Other Endpoints

- **Animal & Veterinary Adverse Events**: `https://api.fda.gov/animalandveterinary/event.json`
- **Substance Data**: `https://api.fda.gov/other/substance.json`
- **NSDE (Non-Standard Data Elements)**: `https://api.fda.gov/other/nsde.json`

### Bulk Data Downloads

- **Download Page**: https://open.fda.gov/apis/downloads/
- **Format**: Zipped JSON files, same schema as API responses
- **Total Size**: ~23 GB compressed, ~100 GB uncompressed
- **Structure**: Large datasets are split into multiple part files
- **Hosted at**: `https://download.open.fda.gov/`
- **Update Strategy**: Must re-download when data updates (no incremental downloads)
- **Use Case**: Building local search indices, offline analysis, avoiding rate limits

### Harmonized Fields (openfda object)

openFDA enriches records across all categories with standardized identifiers when applicable:
- `brand_name` -- Brand names
- `generic_name` -- Generic drug names
- `manufacturer_name` -- Manufacturer
- `substance_name` -- Active ingredients
- `product_type` -- Product classification
- `route` -- Route of administration
- `application_number` -- NDA/ANDA number
- `product_ndc` -- National Drug Code

---

## 3. FDA.gov Direct Data Sources

These are data sources available directly from FDA web properties that do NOT have structured
APIs (or have limited programmatic access).

### 3a. Warning Letters

- **URL**: https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/compliance-actions-and-activities/warning-letters
- **Total Count**: ~3,313 entries (as of February 2026)
- **API**: NO formal API. The page uses a Solr-indexed DataTables interface with AJAX
  requests to `/datatables/views/ajax`
- **Export Options**: XLSX export available via "Export Excel" button
- **Data.gov Dataset**: Available at https://catalog.data.gov/dataset/warning-letters

**Metadata per Warning Letter**:

| Field | Description |
|-------|-------------|
| Company Name | Name of the warned company |
| Issuing Office | FDA center that issued the letter (e.g., CDRH, CDER, CFSAN) |
| Subject | Classification of violation (e.g., "CGMP/QSR/Medical Devices/Adulterated") |
| Letter Issue Date | Date the letter was issued |
| Posted Date | Date published on FDA website |
| Response Letter | Whether a response has been received |
| Closeout Letter | Whether the matter has been closed |

**Volume**: FDA issues approximately 400-600 warning letters per year across all centers.

**Data Access Strategy**:
1. Use the XLSX export for bulk historical data
2. Scrape the DataTables AJAX endpoint for incremental updates
3. Third-party databases (e.g., Redica Systems with 10,000+ letters) offer enriched data
4. The warning letter full text is available as HTML at individual URLs

**Scraping Considerations**:
- The DataTables interface uses server-side processing
- AJAX calls return JSON with pagination support
- Letters themselves are HTML pages that need parsing for full text
- GitHub example: https://github.com/ireapps/cfj-2018 (Selenium-based scraper)

### 3b. Guidance Documents

- **URL**: https://www.fda.gov/regulatory-information/search-fda-guidance-documents
- **API**: NO formal API. Web-based search interface only.
- **Last Updated**: Content current as of 03/02/2026

**Available Search Filters**:

| Filter | Options |
|--------|---------|
| Product | Animal & Veterinary, Biologics, Cosmetics, Dietary Supplements, Drugs, Food & Beverages, Medical Devices, Radiation-Emitting Products, Tobacco |
| FDA Organization | 10 centers/offices |
| Topic | 70+ specialized topics |
| Issue Date | Last 7/30/60/90 days |
| Status | Draft or Final |
| Comment Period | Open/closed comment dates |

**Metadata per Guidance Document**:
- Title / Summary
- Issue Date
- FDA Organization
- Topic classification
- Draft or Final status
- Open for Comment indicator
- Comment Closing Date
- Docket Number

**Data Access Strategy**:
- Email subscription available for newly issued guidance
- No API or bulk download -- requires web scraping
- Each guidance document is a separate PDF or HTML page
- Could scrape the search results page for metadata extraction

### 3c. Import Alerts

- **URL**: https://www.fda.gov/industry/actions-enforcement/import-alerts
- **Database URL**: https://www.accessdata.fda.gov/cms_ia/
- **API**: NO public REST API. Web-based search interface.
- **Updates**: Real-time database updates

**Browse/Search Options**:
- By Country/Area
- By Industry
- By Assigned Alert Number
- By Last Published Date
- Keyword search (matches words independently)

**Data per Import Alert**:
- Alert number and title
- Reason for the alert
- Affected products and firms
- Violated FDA laws and regulations
- DWPE (Detention Without Physical Examination) guidance
- Color-coded lists:
  - Yellow/Red Lists: Firms/products subject to DWPE
  - Green Lists: Firms/products exempt from DWPE
- Release/removal procedures

**Data Access Strategy**:
- Scrape the accessdata.fda.gov import alert pages
- The FDA Data Dashboard API (see section 4) has an `import_refusals` endpoint
- Alert pages are relatively structured HTML

### 3d. Inspection Classification Database

- **URL**: https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/inspection-classification-database
- **Search Interface**: https://www.accessdata.fda.gov/scripts/inspsearch/
- **API**: Available through FDA Data Dashboard API (see section 4)

**Searchable Fields**:
- Firm name
- Project area
- Inspection end date range
- Classification (NAI, VAI, OAI)

**Classifications**:
- **NAI** -- No Action Indicated (no objectionable conditions found)
- **VAI** -- Voluntary Action Indicated (objectionable conditions found, not significant enough for regulatory action)
- **OAI** -- Official Action Indicated (significant violations warranting regulatory action)

**Exclusions**: Pre-approval inspections, mammography facility inspections, inspections pending
final enforcement action, and non-clinical lab inspections are NOT in the public database.

**Export**: XLSX download available from the web interface.

### 3e. CFSAN Adverse Event Reporting System (CAERS)

- **URL**: https://www.fda.gov/food/compliance-enforcement-food/cfsan-adverse-event-reporting-system-caers
- **API**: Available through openFDA food/event endpoint (see section 2)
- **Direct Data Files**: Excel format downloads available from FDA
- **Coverage**: January 2004 forward
- **Contact**: CAERS@fda.hhs.gov

**Data Includes**:
- Reports from consumers and healthcare practitioners
- Voluntary industry reports
- Mandatory dietary supplement industry reports (since 2007)
- Demographic and administrative information
- CAERS report ID numbers

### 3f. Complete Response Letters Table

- **URL**: https://open.fda.gov/crltable/
- **Format**: Tabular data of FDA complete response letters for drug applications
- **Use Case**: Track drug application rejections/feedback

---

## 4. FDA Data Dashboard API (DDAPI)

### Overview

A separate RESTful API from the FDA's Office of Inspections and Investigations (OII).
Provides structured programmatic access to compliance and enforcement data that is otherwise
only available through the web-based Data Dashboard.

- **Base URL**: `https://api-datadashboard.fda.gov/v1/`
- **Documentation**: https://datadashboard.fda.gov/oii/api/index.htm
- **Format**: JSON (request and response)
- **Protocol**: HTTPS with TLS 1.2 required
- **Authentication**: REQUIRED (email + API key)
- **Contact**: FDADataDashboard@fda.hhs.gov

### Authentication

**Registration Process**:
1. Submit request through OII Unified Logon application
2. Provide: valid email, first name, last name, organization
3. Receive FDA-generated API key

**Required HTTP Headers**:
```
Content-Type: application/json
Authorization-User: <approved email>
Authorization-Key: <FDA-generated key>
```

### Endpoints

All endpoints use POST method with JSON request bodies.

#### POST /inspections_classifications
Inspection classification data.

#### POST /inspections_citations
Inspection citation records (FDA Form 483 observations).

#### POST /compliance_actions
Compliance action information (warning letters, injunctions, seizures, consent decrees).

#### POST /import_refusals
Import refusal data.

### Request Body Structure

```json
{
  "sort": "fieldname",
  "sortorder": "desc",
  "start": 1,
  "rows": 5000,
  "returntotalcount": true,
  "filters": {
    "FEINumber": [3004249948],
    "LegalName": ["SearchTerm"]
  },
  "columns": ["LegalName", "FEINumber", "Classification", "InspectionEndDate"]
}
```

**Required Parameters**: `sort`, `sortorder`, `filters`, `columns`
**Optional Parameters**: `start` (default 1), `rows` (default/max 5000), `returntotalcount`

### Pagination

- Maximum 5,000 rows per response
- Use `start` parameter to paginate: `start = previous_start + resultcount`
- Include `returntotalcount: true` on first request only
- Continue until `resultcount < rows`

### Date Filtering

Use `FieldnameFrom` and `FieldnameTo` keys in filters:
```json
"filters": {
  "InspectionEndDateFrom": ["2025-01-01"],
  "InspectionEndDateTo": ["2025-12-31"]
}
```

Supported formats: MM-DD-YYYY, MM/DD/YYYY, YYYY-MM-DD. Responses always use ISO format.

### Status Codes

| Code | Meaning |
|------|---------|
| 400 | Success (NOTE: this is not standard HTTP -- FDA uses 400 for success) |
| 401 | Not Authorized |
| 402 | Invalid JSON |
| 403 | Invalid request format |
| 406 | Invalid fieldname in columns |
| 407 | Invalid fieldname in sort |
| 410 | Missing required parameters |
| 412 | No results found |
| 413 | Invalid fieldname in filters |
| 415 | Rows parameter exceeds 5000 |

**NOTE**: The FDA Data Dashboard API uses non-standard HTTP status codes. Code 400 means
success, which is the opposite of standard HTTP conventions. This must be handled in code.

---

## 5. Regulations.gov API

### Overview

Regulations.gov is the federal portal for public participation in the rulemaking process.
The API provides access to dockets, documents, and public comments for all federal agencies,
including FDA.

- **Base URL**: `https://api.regulations.gov`
- **Staging URL**: `https://api-staging.regulations.gov`
- **Documentation**: https://open.gsa.gov/api/regulationsgov/
- **OpenAPI Spec**: `https://api.regulations.gov/v4/openapi.yaml`
- **Format**: JSON (JSON:API specification)
- **Authentication**: REQUIRED (API key via api.data.gov)

### Authentication

- **Header**: `X-Api-Key` in every request
- **Demo Key**: `DEMO_KEY` available for testing
- **Registration**: Sign up at api.data.gov
- **Key Format**: 40-character string

### Rate Limits

| Use Case | Limit |
|----------|-------|
| Standard GET requests | 1,000 requests per hour |
| Commenting API (POST) | 50 requests/minute, 500 requests/hour |

Rate limit monitoring via response headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`

Rate limit increases can be requested from GSA on a case-by-case basis.

### Endpoints

#### GET /v4/documents
Search for documents (rules, proposed rules, notices, supporting materials).

**Query Parameters**:
| Parameter | Description | Example |
|-----------|-------------|---------|
| `filter[searchTerm]` | Full text search | `filter[searchTerm]=food+safety` |
| `filter[agencyId]` | Agency ID (comma-separated for multiple) | `filter[agencyId]=FDA` |
| `filter[documentType]` | Document type filter | `filter[documentType]=Proposed Rule` |
| `filter[postedDate]` | Exact date | `filter[postedDate]=2025-01-15` |
| `filter[postedDate][ge]` | Date greater than or equal | `filter[postedDate][ge]=2025-01-01` |
| `filter[postedDate][le]` | Date less than or equal | `filter[postedDate][le]=2025-12-31` |
| `filter[docketId]` | Filter by docket | `filter[docketId]=FDA-2025-N-1234` |
| `page[size]` | Results per page (max 250) | `page[size]=100` |
| `page[number]` | Page number | `page[number]=2` |
| `sort` | Sort field (prefix `-` for descending) | `sort=-postedDate` |
| `include` | Include related resources | `include=attachments` |

**Document Types**: Proposed Rule, Rule, Supporting & Related, Other

#### GET /v4/documents/{documentId}
Retrieve a single document with optional attachments.

#### GET /v4/comments
Search for public comments.

**Parameters**: Same filter structure as documents, plus:
| Parameter | Description |
|-----------|-------------|
| `filter[commentOnId]` | Filter comments on a specific document |
| `filter[lastModifiedDate][ge]` | Comments modified after date (beta) |

#### GET /v4/comments/{commentId}
Retrieve a single comment.

#### GET /v4/dockets
Search for dockets.

**Example -- FDA dockets**:
```
https://api.regulations.gov/v4/dockets?filter[agencyId]=FDA&api_key=DEMO_KEY
```

#### GET /v4/dockets/{docketId}
Retrieve a single docket.

### Comment Data Fields

**Always Public**: agencyId, comment, docketId, postedDate, receiveDate, title, trackingNbr,
documentId, documentType, withdrawn, restrictReasonType

**Agency Configurable (may or may not be public)**: firstName, lastName, organization, city,
stateProvinceRegion, country, zip, postmarkDate

**Never Public**: email, phone, fax, address fields

### Pagination Limitation

Standard pagination caps out. For >5,000 comments, use the beta `lastModifiedDate` filtering
parameter to page through results. This parameter may be replaced when a permanent bulk
download solution becomes available.

---

## 6. GovInfo API and Bulk Data

### Overview

GovInfo (govinfo.gov) is the official source for government publications, operated by GPO.
It provides an API and bulk data downloads for Federal Register content and other collections.

- **Developer Hub**: https://www.govinfo.gov/developers
- **GitHub**: https://github.com/usgpo/api
- **Bulk Data GitHub**: https://github.com/usgpo/bulk-data
- **Authentication**: API key from api.data.gov required
- **Legal Status**: This IS the official electronic version of the Federal Register

### API Endpoints

#### Collections Service
Lists documents that have been added or updated within a collection.

#### Packages Service
Provides access to package-level summary information, content files, and metadata.

### Bulk Data Collections

Available in XML (and some in JSON):
- **Federal Register Issues**: From September 2012 onward
- **Code of Federal Regulations (CFR)**: Annual edition
- **Electronic Code of Federal Regulations (eCFR)**: Current regulations

**Format Access**:
- Append `/xml` to any bulkdata URL for XML listing
- Append `/json` to any bulkdata URL for JSON listing
- Set appropriate `Accept` headers when crawling programmatically

### Relevance for Policy Canary

GovInfo is most useful for:
1. Getting the official legal text of Federal Register documents
2. Bulk downloading historical regulatory content
3. Cross-referencing CFR sections affected by FDA rules

---

## 7. Other Potential Sources

### 7a. USP (United States Pharmacopeia)

- **URL**: https://www.usp.org/
- **Access**: PAID subscription required (not open data)
- **Content**: Drug quality standards, ingredient specifications, reference standards
- **API**: No public API; USP operates as a subscription-based standards body
- **Relevance**: Useful for understanding compliance standards but NOT a primary data source for regulatory intelligence due to access restrictions

### 7b. California Proposition 65

- **Official List**: https://oehha.ca.gov/proposition-65/proposition-65-list
- **Warnings Site**: https://www.p65warnings.ca.gov/
- **Format**: PDF and Excel download of chemical list
- **API**: NO public API
- **Update Frequency**: Chemicals added/removed periodically; significant updates in 2025/2026
- **Content**: List of chemicals known to cause cancer or reproductive harm
- **Recent Changes**: As of January 1, 2026, short-form warnings must include at least one named chemical

**Data Access Strategy**:
- Download Excel file periodically for chemical list updates
- Monitor OEHHA notices page for additions: https://oehha.ca.gov/proposition-65/notices
- Web scrape for enforcement actions and settlement data

### 7c. State-Level Regulatory Databases

State-level food safety and pharmaceutical regulation varies widely. Key states:

- **New York**: NY Department of Health, food service inspections
- **California**: CDFA (California Department of Food and Agriculture), CDPH
- **Texas**: DSHS (Department of State Health Services)
- **Florida**: DBPR (Department of Business and Professional Regulation)

Most state databases lack APIs and would require web scraping. Consider these as Phase 2+
enhancements rather than MVP data sources.

### 7d. DailyMed (NLM)

- **URL**: https://dailymed.nlm.nih.gov/dailymed/
- **Content**: FDA-approved drug labeling (SPL format)
- **RSS Feed**: https://dailymed.nlm.nih.gov/dailymed/rss-updates.cfm
- **Format**: XML (SPL), with web interface
- **API**: REST API available for searching drug labels
- **Relevance**: Complements openFDA drug labeling data; authoritative source

### 7e. AccessGUDID (Global Unique Device Identification Database)

- **URL**: https://accessgudid.nlm.nih.gov/
- **Content**: Medical device UDI data
- **API**: REST API and RSS feeds available
- **Format**: JSON, XML
- **Relevance**: Device identification and tracking

### 7f. ClinicalTrials.gov

- **URL**: https://clinicaltrials.gov/
- **API**: REST API available (recently modernized)
- **Relevance**: Useful for tracking drugs in pipeline that may face future regulatory actions

---

## 8. Data Freshness and Notification Mechanisms

### Update Frequencies by Source

| Source | Update Frequency | Latency |
|--------|-----------------|---------|
| Federal Register API | Daily (same day as print publication) | Same day |
| openFDA Drug Enforcement | Weekly | ~1 week |
| openFDA Food Enforcement | Weekly | ~1 week |
| openFDA Device Enforcement | Weekly | ~1 week |
| openFDA Drug Adverse Events | Quarterly | 3+ months |
| openFDA Device Adverse Events (MAUDE) | Weekly | ~1 week |
| openFDA Food Adverse Events (CAERS) | Quarterly | Variable |
| FDA Warning Letters | As posted | Days to weeks after issuance |
| FDA Guidance Documents | As posted | N/A |
| FDA Import Alerts | Real-time | Same day |
| FDA Data Dashboard | Weekly | ~1 week |
| Regulations.gov | As posted | Same day |
| GovInfo | Daily | Same day |

### RSS Feeds Available from FDA

All feeds are at `https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/`

| Feed | Path (append to base URL) |
|------|---------------------------|
| Consumer Health Info | `consumers/rss.xml` |
| Criminal Investigations | `oci-press-releases/rss.xml` |
| Drug Safety Podcasts | `drug-safety-podcast/rss.xml` |
| FDA Outbreaks | `fda-outbreaks/rss.xml` |
| Food Allergies | `food-allergies/rss.xml` |
| Food Safety Recalls | `food-safety-recalls/rss.xml` |
| Health Fraud | `health-fraud/rss.xml` |
| MedWatch Safety Alerts | `medwatch/rss.xml` |
| Press Releases | `press-releases/rss.xml` |
| Recalls (all products) | `recalls/rss.xml` |
| Tainted Supplements | `tainted-dietary-supplements/rss.xml` |
| What's New: Drugs | `drugs/rss.xml` |
| What's New: Biologics | `biologics/rss.xml` |

### Other Notification Options

- **FDA Email Subscriptions**: Available for guidance documents, recalls, and other updates
  via FDA.gov subscription services
- **Federal Register Email Alerts**: Customizable email subscriptions for new documents
  matching specified criteria (agency, topic, keyword)
- **DailyMed RSS**: Drug label updates via RSS
- **Regulations.gov**: No RSS, but API polling with date filters achieves same effect

### Recommended Polling Strategy for Policy Canary

1. **Real-time (poll every 1-4 hours)**:
   - FDA RSS feeds (recalls, safety alerts, press releases)
   - Federal Register API (new FDA documents)

2. **Daily**:
   - Regulations.gov (new FDA dockets and comment periods)
   - FDA warning letters page (AJAX scraping)

3. **Weekly**:
   - openFDA enforcement endpoints (drug, food, device recalls)
   - FDA Data Dashboard API (inspections, compliance actions)
   - openFDA device adverse events (MAUDE)

4. **Monthly/Quarterly**:
   - openFDA drug adverse events (FAERS -- quarterly source)
   - openFDA bulk data downloads (for full dataset refresh)
   - Prop 65 chemical list

---

## 9. Summary Comparison Table

| Source | API Quality | Auth Required | Rate Limit | Data Format | Coverage |
|--------|-----------|---------------|------------|-------------|----------|
| Federal Register | Good REST API | No | Not published | JSON, CSV | 1994-present |
| openFDA | Excellent (Elasticsearch) | Optional (recommended) | 240/min, 120K/day (with key) | JSON | 2004-present (most) |
| FDA Warning Letters | No API (scrape) | No | N/A | HTML, XLSX export | ~3,300 total |
| FDA Guidance Docs | No API (scrape) | No | N/A | HTML, PDF | Ongoing |
| FDA Import Alerts | No API (scrape) | No | N/A | HTML | Real-time |
| FDA Data Dashboard API | Good REST API | Yes (email + key) | Max 5,000 rows/request | JSON | Varies |
| Regulations.gov | Good REST API | Yes (api.data.gov key) | 1,000/hour | JSON (JSON:API) | Comprehensive |
| GovInfo | Good REST API | Yes (api.data.gov key) | Not published | XML, JSON | 2012-present (FR XML) |
| Prop 65 | No API (download) | No | N/A | PDF, Excel | Current list |
| DailyMed | REST API + RSS | No | Not published | XML (SPL) | Current labels |

---

## 10. Recommended Ingestion Priority

### Phase 1 -- MVP Core (Build First)

These sources provide the highest value with the least friction:

1. **Federal Register API** -- No auth, excellent filtering by FDA agency, covers rules/proposed rules/notices. This is the backbone of regulatory intelligence.

2. **openFDA Drug/Food/Device Enforcement** -- Free API key, weekly updates, structured recall data. Core compliance intelligence.

3. **FDA RSS Feeds** -- Zero-cost, real-time notifications for recalls, safety alerts, and press releases. Simple to parse.

### Phase 2 -- Enrichment Layer

4. **Regulations.gov API** -- Comment periods, docket tracking, public participation data. Requires API key but straightforward.

5. **FDA Warning Letters** -- Scraping required but high-value enforcement data. Start with XLSX export for historical data, then incremental AJAX scraping.

6. **openFDA Adverse Events (Drug + Device)** -- Larger datasets, less frequent updates, but critical for safety signal detection.

### Phase 3 -- Deep Intelligence

7. **FDA Data Dashboard API** -- Inspection data, compliance actions, import refusals. Requires authentication approval from FDA.

8. **FDA Guidance Documents** -- Scraping required. Important for understanding regulatory direction but lower urgency than enforcement data.

9. **FDA Import Alerts** -- Scraping required. Valuable for import/export businesses.

10. **GovInfo Bulk Data** -- For full-text analysis of Federal Register documents and CFR cross-referencing.

### Phase 4 -- Extended Coverage

11. **Prop 65 / State-level data** -- Periodic manual downloads
12. **DailyMed** -- Drug label intelligence
13. **ClinicalTrials.gov** -- Pipeline tracking
14. **AccessGUDID** -- Device identification enrichment

---

## Technical Notes for Implementation

### Key Challenges

1. **No Single Source of Truth**: FDA data is fragmented across many systems with different
   APIs, formats, and access patterns. Policy Canary must unify these.

2. **Pagination Limits**: Both Federal Register (2,000 results) and openFDA (25,000 skip)
   have hard limits. Use date-range windowing for complete data extraction.

3. **Non-Standard APIs**: The FDA Data Dashboard uses HTTP 400 for success responses.
   Must handle this explicitly.

4. **Scraping Dependencies**: Warning letters, guidance documents, and import alerts
   have no formal API. Any scraping solution is fragile and must handle format changes.

5. **Data Staleness**: FAERS data lags 3+ months. MAUDE and enforcement data lag ~1 week.
   Federal Register and RSS are near-real-time.

6. **Entity Resolution**: The same company may appear differently across data sources
   (different name spellings, subsidiaries vs. parent companies). An enrichment/matching
   layer will be needed.

7. **Volume**: openFDA bulk data is ~100 GB uncompressed. FAERS alone has millions of
   records. Plan storage and processing accordingly.

### Recommended Tech Patterns

- **API Ingestion**: HTTP client with retry logic, rate limit awareness, and date-windowed
  pagination for complete extraction
- **RSS Polling**: Lightweight cron job checking FDA RSS feeds every 1-4 hours
- **Web Scraping**: Playwright or similar for FDA warning letters and guidance documents
  (JavaScript-rendered DataTables)
- **Data Storage**: Store raw JSON/XML with parsed fields; maintain source provenance
- **Deduplication**: Use document_number (FR), recall_number (openFDA), and composite keys
  to prevent duplicates across ingestion runs
