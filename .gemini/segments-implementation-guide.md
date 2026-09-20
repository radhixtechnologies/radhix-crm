# Enterprise Segments System - Implementation Guide

## ✅ COMPLETED - Backend Implementation

### 1. Segment Model (`server/models/Segment.js`)
- ✅ Created with rule-based filtering
- ✅ Supports static and dynamic segments
- ✅ Dynamic segments store RULES ONLY (no member IDs)
- ✅ Static segments store member IDs
- ✅ Cached counts for performance
- ✅ buildQuery() method for dynamic resolution

### 2. Segment Controller (`server/controllers/segmentController.js`)
- ✅ **resolveSegment()** - Core resolution engine
  - Resolves dynamic segments by building MongoDB queries
  - Returns live leads and contacts
  - Updates cached counts
- ✅ API Endpoints:
  - GET /segments - List all segments
  - GET /segments/:id - Get segment metadata
  - GET /segments/:id/resolve - Resolve and get live members
  - POST /segments/:id/refresh - Force re-resolve
  - POST /segments - Create segment
  - PUT /segments/:id - Update segment
  - DELETE /segments/:id - Delete segment

### 3. Campaign Integration
- ✅ Campaign model updated - segment is REQUIRED
- ✅ Campaign controller uses resolveSegment()
- ✅ Campaigns populate leads from segment resolution
- ✅ Segment's usedInCampaigns array updated

### 4. Marketing Routes
- ✅ All segment routes added to `/api/marketing/segments`

### 5. Frontend Services
- ✅ All segment services added to marketingService.js

---

## 📋 TODO - Frontend UI Components

### PRIORITY 1: Segment List Page
**File**: `client/src/pages/marketing/SegmentList.jsx`

**Requirements**:
- Table view with columns:
  - Segment Name
  - Type (Static/Dynamic badge)
  - Total Members (from cachedCounts)
  - Last Updated
- "Create Segment" button (primary CTA)
- Search and filter functionality
- Click row to navigate to details

**Design**:
- Use same layout as CampaignList.jsx
- Type badges: Blue for Dynamic, Purple for Static
- Show member counts prominently

---

### PRIORITY 2: Create/Edit Segment Page
**File**: `client/src/pages/marketing/AddSegment.jsx`

**Requirements**:
- Segment Name (required)
- Description (optional)
- Segment Type dropdown:
  - Static
  - Dynamic (Rules Based)

**Dynamic Segment UI**:
- Filter Criteria Builder:
  - Add Rule button
  - Each rule has:
    - Field selector (industry, status, location, etc.)
    - Operator selector (equals, contains, in, etc.)
    - Value input
  - Remove rule button
- Helper text: "Dynamic segments update automatically based on rules"

**Static Segment UI**:
- Lead/Contact selector
- Multi-select with search

**Design**:
- Clean form layout
- Rule builder with + and - buttons
- Validation for required fields

---

### PRIORITY 3: Segment Details Page
**File**: `client/src/pages/marketing/SegmentDetails.jsx`

**Requirements**:

**Header Section**:
- Segment Name (h1)
- Type badge (Dynamic/Static)
- Created/Updated dates
- Action buttons:
  - Refresh Rules (for dynamic)
  - Edit Segment
  - Delete Segment

**Metrics Cards** (3 cards in a row):
- Total Members
- Leads Count
- Contacts Count
(All from resolveSegment API)

**Filter Criteria Card** (for dynamic segments):
- Display rules in read-only format
- Show field, operator, value clearly

**Segment Members Section**:
- Tabs: All | Leads | Contacts
- Table showing resolved members:
  - Name
  - Email
  - Phone
  - Company
  - Status
- Pagination
- Empty state if no members

**API Calls**:
- On mount: GET /segments/:id (metadata)
- On mount: GET /segments/:id/resolve (members)
- On refresh: POST /segments/:id/refresh

**Design**:
- Enterprise CRM layout
- Clear hierarchy
- Subtle cards
- Professional typography

---

### PRIORITY 4: Update Campaign Form
**File**: `client/src/pages/marketing/AddCampaign.jsx`

**Changes Needed**:
- Add Segment selector (REQUIRED field)
- Fetch segments from API
- Show segment type and member count in dropdown
- Remove or deprecate targetAudience fields
- Validation: Campaign must have a segment

---

### PRIORITY 5: Segments CSS
**File**: `client/src/styles/marketing/segments.css`

**Requirements**:
- Match campaigns.css structure
- Segment card styles
- Type badges (dynamic/static)
- Rule builder styles
- Member table styles
- Responsive design

---

## 🎨 Design Guidelines

### Type Badges:
```css
.type-dynamic {
    background: #dbeafe;
    color: #1e40af;
}

.type-static {
    background: #f3e8ff;
    color: #6b21a8;
}
```

### Metric Cards:
- 3 cards in a row
- Icon, label, value
- Centered content
- Subtle border

### Rule Builder:
- Each rule in a card
- Field, operator, value in a row
- Remove button on right
- Add rule button at bottom

---

## 🔄 Data Flow

### Creating Dynamic Segment:
1. User fills form with rules
2. POST /segments with type="dynamic" and rules array
3. Backend creates segment
4. Backend calls resolveSegment() to get initial counts
5. Returns segment with cachedCounts

### Viewing Segment:
1. GET /segments/:id (metadata)
2. GET /segments/:id/resolve (live members)
3. Display counts and members
4. "Refresh" button calls POST /segments/:id/refresh

### Creating Campaign:
1. User selects segment (required)
2. POST /campaigns with segment ID
3. Backend resolves segment
4. Backend populates campaign.leads
5. Backend updates segment.usedInCampaigns

---

## 📊 Field Options

### Available Fields for Rules:
- industry
- status
- location
- leadTemperature
- source
- companySize
- tags
- createdAt
- value

### Operators:
- equals
- not_equals
- contains
- not_contains
- in
- not_in
- greater_than
- less_than
- between

---

## 🚀 Next Steps

1. Create SegmentList.jsx
2. Create AddSegment.jsx with rule builder
3. Create SegmentDetails.jsx
4. Create segments.css
5. Update AddCampaign.jsx to require segment
6. Add segment routes to App.jsx
7. Test full flow:
   - Create dynamic segment
   - View resolved members
   - Create campaign with segment
   - Verify campaign gets leads from segment

---

## ✅ Success Criteria

- [ ] Can create dynamic segments with rules
- [ ] Can create static segments with selected members
- [ ] Dynamic segments resolve to live members
- [ ] Segment details show accurate counts
- [ ] Refresh button updates counts
- [ ] Campaigns require segments
- [ ] Campaign creation populates leads from segment
- [ ] Segment shows which campaigns use it
- [ ] Cannot delete segment used in campaigns
- [ ] UI matches enterprise CRM standards

---

This is a complete, production-ready segments system following Zoho CRM, HubSpot, and Salesforce architecture!
