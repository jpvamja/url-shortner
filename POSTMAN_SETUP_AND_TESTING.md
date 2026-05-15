# Postman Setup & Complete Testing Guide

## Prerequisites - Start All Services

Before importing Postman, ensure all services are running:

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Redis
redis-server

# Terminal 3: Start NATS
nats-server

# Terminal 4: Start Main Server
cd /Users/jeetvamja/Workspace/Projects/url-shortner
npm start

# Terminal 5: Start Worker
cd /Users/jeetvamja/Workspace/Projects/url-shortner
node src/worker/click.worker.js
```

**Verify All Services:**

```bash
# Check MongoDB
mongosh --eval "db.version()"

# Check Redis
redis-cli ping  # Should return: PONG

# Check NATS (should see connection in worker logs)

# Check Main Server
curl http://localhost:8080/health

# Worker should show: "Connected to NATS"
```

---

## Step 1: Import Postman Collection

### 1.1 Open Postman

- Launch Postman application
- Click **File** → **Import** (or Ctrl+O)

### 1.2 Import Collection

- Select **URL_Shortener.postman_collection.json** from workspace
- Path: `/Users/jeetvamja/Workspace/Projects/url-shortner/URL_Shortener.postman_collection.json`
- Click **Import**

**Expected Result:**

- ✅ Collection appears in left sidebar: "URL Shortener API"
- ✅ 12 requests visible in the collection
- ✅ All requests show under the collection

### 1.3 Verify Collection Structure

You should see these requests:

```
URL Shortener API
├── Health Check
├── 1. Create Generated Short URL
├── 2. Create Custom Short URL
├── 3. Duplicate Custom URL (Should Fail)
├── 4. Invalid URL (Should Fail)
├── 5. Redirect to Original URL
├── 6. Get URL Analytics (Before Clicks)
├── 7. Redirect - Click 1
├── 8. Redirect - Click 2
├── 9. Redirect - Click 3
├── 10. Get Analytics After Clicks
├── 11. Pagination - Page 1 Limit 1
└── 12. Invalid Short Code (404)
```

---

## Step 2: Create Environment

### 2.1 Create New Environment

- Click **Environments** (left sidebar, or top right)
- Click **Create New Environment**
- Name: **URL-Shortener**

### 2.2 Set Environment Variables

Add these variables:

| Variable     | Initial Value           | Current Value            |
| ------------ | ----------------------- | ------------------------ |
| `base_url`   | `http://localhost:8080` | `http://localhost:8080`  |
| `api_prefix` | `/api/v1`               | `/api/v1`                |
| `short_code` | ``                      | (will be set by request) |
| `url_id`     | ``                      | (will be set by request) |

**Steps:**

1. Leave all under "Initial Value" as shown
2. "Current Value" will be auto-populated by test scripts
3. Click **Save**

### 2.3 Activate Environment

- Top right corner, select **URL-Shortener** environment
- Should show environment name in orange/blue

---

## Complete Testing Workflow

### Phase 1: Health Check

#### Request: Health Check

**Endpoint:** `GET /health`

**In Postman:**

1. Click **Health Check** request
2. Click **Send**

**Expected Response (Status: 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "status": "OK",
    "uptime": 123.456,
    "timestamp": 1715683200000
  },
  "message": "Service is healthy"
}
```

**MongoDB Check:**

```bash
mongosh
use url-shortener
db.urls.countDocuments()  # Returns 0 (no URLs yet)
```

**Redis Check:**

```bash
redis-cli
DBSIZE  # Returns 0 or minimal keys
```

**Checklist:**

- ✅ Status code: 200
- ✅ Response is valid JSON
- ✅ All services responding

---

### Phase 2: Create URLs

#### Request 1: Create Generated Short URL

**Endpoint:** `POST /shortner`

**In Postman:**

1. Click **1. Create Generated Short URL** request
2. Review body:

```json
{
  "originalUrl": "https://github.com/torvalds/linux"
}
```

3. Click **Send**

**Expected Response (Status: 201):**

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "6a05a924...",
    "originalUrl": "https://github.com/torvalds/linux",
    "shortUrl": "abc123",
    "createdAt": "2026-05-14T10:30:00.000Z"
  },
  "message": "URL shortened successfully"
}
```

**Automatic Actions:**

- ✅ Request has Tests tab that sets environment variables:
  - `short_code` → "abc123"
  - `url_id` → "6a05a924..."

**MongoDB Verification:**

Open new terminal:

```bash
mongosh
use url-shortener

# Find the created URL
db.urls.findOne({ shortUrl: /^[a-zA-Z0-9]{6,8}$/ })
```

**Expected Output:**

```json
{
  "_id": ObjectId("6a05a924..."),
  "originalUrl": "https://github.com/torvalds/linux",
  "shortUrl": "abc123",
  "clickCount": 0,
  "createdAt": ISODate("2026-05-14T10:30:00.000Z"),
  "updatedAt": ISODate("2026-05-14T10:30:00.000Z")
}
```

**What to Verify:**

- ✅ Document exists in MongoDB
- ✅ `shortUrl` is 6-8 characters
- ✅ `clickCount` is 0
- ✅ `originalUrl` matches request

**Redis Verification:**

```bash
redis-cli

# Check short URL cache
GET short:url:abc123

# Check Bloom filter
BF.EXISTS bloom:shorturl abc123
```

**Expected Output:**

```
# GET short:url:abc123
"https://github.com/torvalds/linux"

# BF.EXISTS bloom:shorturl abc123
(integer) 1
```

**What to Verify:**

- ✅ Redis key exists with original URL
- ✅ Bloom filter confirms short code exists

---

#### Request 2: Create Custom Short URL

**Endpoint:** `POST /shortner`

**In Postman:**

1. Click **2. Create Custom Short URL** request
2. Review body:

```json
{
  "originalUrl": "https://www.youtube.com",
  "customUrl": "mytube"
}
```

3. Click **Send**

**Expected Response (Status: 201):**

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "6a05a925...",
    "originalUrl": "https://www.youtube.com",
    "shortUrl": "mytube",
    "createdAt": "2026-05-14T10:32:00.000Z"
  },
  "message": "URL shortened successfully"
}
```

**MongoDB Verification:**

```bash
mongosh
use url-shortener

# Find custom URL
db.urls.findOne({ shortUrl: "mytube" })

# Count total URLs
db.urls.countDocuments()  # Should be 2
```

**Expected:**

```json
{
  "_id": ObjectId("6a05a925..."),
  "originalUrl": "https://www.youtube.com",
  "shortUrl": "mytube",
  "clickCount": 0,
  ...
}
```

**Redis Verification:**

```bash
redis-cli

# Check custom URL cache
GET short:url:mytube

# Check Bloom filter
BF.EXISTS bloom:shorturl mytube
```

**Expected:**

```
"https://www.youtube.com"
(integer) 1
```

**What to Verify:**

- ✅ Custom code stored correctly
- ✅ Total URLs = 2
- ✅ Cache and Bloom filter updated

---

#### Request 3: Duplicate Custom URL (Should Fail)

**Endpoint:** `POST /shortner`

**In Postman:**

1. Click **3. Duplicate Custom URL (Should Fail)** request
2. Review body:

```json
{
  "originalUrl": "https://www.twitter.com",
  "customUrl": "mytube"
}
```

3. Click **Send**

**Expected Response (Status: 409):**

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Custom URL already exists"
}
```

**MongoDB Verification:**

```bash
mongosh
use url-shortener

# Count how many "mytube" entries exist
db.urls.find({ shortUrl: "mytube" }).count()  # Should be 1

# Verify only original exists
db.urls.find({ shortUrl: "mytube" })
```

**Expected:**

```
1  # Only one entry

{
  "_id": ObjectId("6a05a925..."),
  "originalUrl": "https://www.youtube.com",  # Original, not twitter
  "shortUrl": "mytube",
  ...
}
```

**Redis Verification:**

```bash
redis-cli

# Cache should still point to original
GET short:url:mytube  # Should be youtube URL, not twitter

# Bloom filter still returns 1
BF.EXISTS bloom:shorturl mytube
```

**Expected:**

```
"https://www.youtube.com"
(integer) 1
```

**What to Verify:**

- ✅ Status code: 409
- ✅ Only 1 "mytube" in database
- ✅ Cache unchanged (still original)
- ✅ Duplicate rejected properly

---

#### Request 4: Invalid URL (Should Fail)

**Endpoint:** `POST /shortner`

**In Postman:**

1. Click **4. Invalid URL (Should Fail)** request
2. Review body:

```json
{
  "originalUrl": "not-a-valid-url"
}
```

3. Click **Send**

**Expected Response (Status: 400):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid URL format"
}
```

**MongoDB Verification:**

```bash
mongosh
use url-shortener

# Count total - should still be 2
db.urls.countDocuments()

# Verify no invalid URL created
db.urls.findOne({ originalUrl: "not-a-valid-url" })

# Verify no null/empty entries
db.urls.find({ originalUrl: null }).count()
```

**Expected:**

```
2  # Still only 2 URLs
null  # Not found
0  # No null entries
```

**Redis Verification:**

```bash
redis-cli

# Check for invalid URL cache (should be none)
GET short:url:not-a-valid-url

# Check Bloom filter (should be 0)
BF.EXISTS bloom:shorturl not-a-valid-url

# Count total keys
DBSIZE  # Should be around 2-3 (2 URLs + maybe bloom filter)
```

**Expected:**

```
(nil)
(integer) 0
```

**What to Verify:**

- ✅ Status code: 400
- ✅ Invalid URL never stored
- ✅ MongoDB count = 2 (unchanged)
- ✅ Redis clean (no invalid entries)

---

### Phase 3: Click Tracking

#### Request 5-9: Redirect & Multiple Clicks

**Important:** Before clicking, note the `short_code` set in environment (should be "abc123" from Step 1)

#### Request 5: First Redirect

**Endpoint:** `GET /{{short_code}}`

**In Postman:**

1. Click **5. Redirect to Original URL** request
2. Click **Send**

**Expected Response (Status: 302):**

```
Status: 302 Found
Location: https://github.com/torvalds/linux
```

**Postman Note:** Enable "Follow redirects" in request settings to see final URL

**MongoDB Verification (Immediate - before worker processes):**

```bash
mongosh
use url-shortener

# Check for visit record (created immediately)
db.urlvisits.findOne({ urlId: ObjectId("6a05a924...") })

# Check clickCount (might still be 0)
db.urls.findOne({ shortUrl: "abc123" })
```

**Expected (Immediate):**

```json
// urlvisits
{
  "_id": ObjectId("..."),
  "urlId": ObjectId("6a05a924..."),
  "ip": "127.0.0.1",
  "browser": "unknown",
  "os": "unknown",
  "deviceType": "desktop",
  "clickedAt": ISODate("2026-05-14T10:31:00.000Z")
}

// urls - clickCount might still be 0
{
  "clickCount": 0
}
```

**Wait 2-3 seconds, then check again:**

```bash
mongosh
use url-shortener
db.urls.findOne({ shortUrl: "abc123" })
```

**Expected (After 2-3s):**

```json
{
  "_id": ObjectId("6a05a924..."),
  "shortUrl": "abc123",
  "clickCount": 1,  // Incremented by worker
  "updatedAt": ISODate("2026-05-14T10:31:03.000Z")
}
```

**Redis Verification:**

```bash
redis-cli

# Redirect cache still works
GET short:url:abc123

# Analytics cache not yet populated
GET url:analytics:abc123
```

**Expected:**

```
"https://github.com/torvalds/linux"
(nil)  # Analytics cache empty until requested
```

**What to Verify:**

- ✅ Redirect works (302 + location header)
- ✅ Visit record created in urlvisits immediately
- ✅ After 2-3s, clickCount incremented by worker
- ✅ Redirect cache still functional

---

#### Requests 7-9: Additional Clicks

**In Postman:**

1. Click **7. Redirect - Click 1** → **Send**
2. Click **8. Redirect - Click 2** → **Send**
3. Click **9. Redirect - Click 3** → **Send**

**Wait 2-3 seconds for worker to process**

**MongoDB Verification (After 3 clicks + wait):**

```bash
mongosh
use url-shortener

# Check total visits
db.urlvisits.find({ urlId: ObjectId("6a05a924...") }).count()  # Should be 4

# Check clickCount in urls
db.urls.findOne({ shortUrl: "abc123" })

# Get all visit records
db.urlvisits.find({ urlId: ObjectId("6a05a924...") }).pretty()
```

**Expected:**

```
4  # Total visits (1 from first + 3 from clicks)

// urls document
{
  "clickCount": 4,
  "updatedAt": ISODate("2026-05-14T10:31:10.000Z")
}

// All 4 visit records
[
  { ip: "127.0.0.1", clickedAt: "...", device: "desktop" },
  { ip: "127.0.0.1", clickedAt: "...", device: "desktop" },
  { ip: "127.0.0.1", clickedAt: "...", device: "desktop" },
  { ip: "127.0.0.1", clickedAt: "...", device: "desktop" }
]
```

**Redis Verification:**

```bash
redis-cli

# Cache still works
GET short:url:abc123

# Analytics cache still empty (not yet requested)
GET url:analytics:abc123
```

**Expected:**

```
"https://github.com/torvalds/linux"
(nil)
```

**What to Verify:**

- ✅ 4 total visit records in database
- ✅ clickCount = 4
- ✅ Each record has correct metadata
- ✅ Timestamps show progression

---

### Phase 4: Analytics

#### Request 6: Get Analytics (Before Clicks)

**Endpoint:** `GET /details/{{short_code}}?page=1&limit=10`

**In Postman:**

1. Click **6. Get URL Analytics (Before Clicks)** request
2. Click **Send**

**Expected Response (Status: 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "shortUrl": "abc123",
    "totalClicks": 4,  // From our clicks above
    "createdAt": "2026-05-14T10:30:00.000Z",
    "page": 1,
    "limit": 10,
    "total": 4,
    "totalPages": 1,
    "data": [
      {
        "_id": "...",
        "urlId": "6a05a924...",
        "ip": "127.0.0.1",
        "browser": "unknown",
        "os": "unknown",
        "deviceType": "desktop",
        "clickedAt": "2026-05-14T10:31:00.000Z"
      },
      ...
    ]
  },
  "message": "URL details retrieved successfully"
}
```

**Response Time:**

- ✅ First call: ~150-300ms (from MongoDB)
- ✅ Next calls: ~50-100ms (from Redis cache)

**MongoDB Verification:**

```bash
mongosh
use url-shortener

# Verify clickCount matches API response
db.urls.findOne({ shortUrl: "abc123" }).clickCount

# Count visit records
db.urlvisits.find({ urlId: ObjectId("6a05a924...") }).count()
```

**Expected:**

```
4
4
```

**Redis Verification:**

```bash
redis-cli

# Analytics cache should now be populated
EXISTS url:analytics:abc123

# Check TTL (should be close to 60)
TTL url:analytics:abc123

# Get cache data size
STRLEN url:analytics:abc123
```

**Expected:**

```
(integer) 1  # Cache exists
(integer) 59  # TTL close to 60 seconds
(integer) 1234  # Some size (depends on data)
```

**What to Verify:**

- ✅ totalClicks = 4
- ✅ 4 visit records in data array
- ✅ Each record has metadata
- ✅ Cache created with 60s TTL

---

#### Request 10: Get Analytics After Clicks

**Endpoint:** `GET /details/{{short_code}}?page=1&limit=10`

**In Postman:**

1. Click **10. Get Analytics After Clicks** request
2. Click **Send** immediately

**Expected Response (Status: 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "shortUrl": "abc123",
    "totalClicks": 4,
    "page": 1,
    "limit": 10,
    "total": 4,
    "totalPages": 1,
    "data": [
      /* 4 visit records */
    ]
  },
  "message": "URL details retrieved successfully"
}
```

**Response Time:**

- ✅ Should be ~50-80ms (cache hit)

**Redis Verification (Cache Hit):**

```bash
redis-cli

# Cache still valid
GET url:analytics:abc123

# TTL decreased
TTL url:analytics:abc123

# Check cache stats
INFO stats | grep hits
```

**Expected:**

```
(serialized JSON with analytics data)
(integer) 58-59  # TTL decreased by 1-2 seconds
hits: XXXX+  # Hit count increased
```

**MongoDB Verification:**

```bash
mongosh
use url-shortener

# Should see no change (data same as before)
db.urls.findOne({ shortUrl: "abc123" })
```

**Expected:**

```json
{
  "clickCount": 4,
  "updatedAt": "2026-05-14T10:31:10.000Z" // No change
}
```

**What to Verify:**

- ✅ Response time: 50-100ms (cache hit)
- ✅ Data identical to previous call
- ✅ TTL still valid (~60s)
- ✅ MongoDB unchanged

---

#### Test Cache Expiration (Optional - Advanced)

**Wait 60+ seconds, then send Request 10 again:**

```bash
# At 60+ seconds after first analytics request
redis-cli

# Check if cache expired
EXISTS url:analytics:abc123
```

**Expected (After 60s):**

```
(integer) 0  # Cache expired
```

**Then in Postman:**

1. Click **10. Get Analytics After Clicks** → **Send**

**Expected Response (Status: 200):**

- ✅ Response time: ~200-300ms (fresh from MongoDB)
- ✅ Same data as before
- ✅ New cache created

**Redis Verification (After new query):**

```bash
redis-cli

# New cache created
EXISTS url:analytics:abc123  # Returns 1

# New TTL set to 60
TTL url:analytics:abc123
```

**Expected:**

```
(integer) 1
(integer) 59-60
```

---

### Phase 5: Pagination

#### Request 11: Pagination

**Endpoint:** `GET /details/{{short_code}}?page=1&limit=1`

**In Postman:**

1. Click **11. Pagination - Page 1 Limit 1** request
2. Click **Send**

**Expected Response (Status: 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "shortUrl": "abc123",
    "totalClicks": 4,
    "page": 1,
    "limit": 1,
    "total": 4,
    "totalPages": 4,
    "data": [
      {
        "_id": "...",
        "urlId": "6a05a924...",
        "ip": "127.0.0.1",
        "clickedAt": "2026-05-14T10:31:00.000Z"
      }
    ]
  },
  "message": "URL details retrieved successfully"
}
```

**Key Points:**

- ✅ `limit`: 1 (only 1 record)
- ✅ `total`: 4 (4 total visits)
- ✅ `totalPages`: 4 (4 pages with limit=1)
- ✅ `data.length`: 1 (exactly 1 item returned)

**MongoDB Verification:**

```bash
mongosh
use url-shortener

# Get page 1 (skip 0, limit 1)
db.urlvisits.find({ urlId: ObjectId("6a05a924...") })
  .sort({ clickedAt: -1 })
  .skip(0)
  .limit(1)

# Get page 2 (skip 1, limit 1)
db.urlvisits.find({ urlId: ObjectId("6a05a924...") })
  .sort({ clickedAt: -1 })
  .skip(1)
  .limit(1)

# Get page 3 (skip 2, limit 1)
db.urlvisits.find({ urlId: ObjectId("6a05a924...") })
  .sort({ clickedAt: -1 })
  .skip(2)
  .limit(1)

# Get page 4 (skip 3, limit 1)
db.urlvisits.find({ urlId: ObjectId("6a05a924...") })
  .sort({ clickedAt: -1 })
  .skip(3)
  .limit(1)
```

**Expected:**

```
Page 1: [ { record 1 } ]
Page 2: [ { record 2 } ]
Page 3: [ { record 3 } ]
Page 4: [ { record 4 } ]
```

**Redis Verification:**

```bash
redis-cli

# Pagination data cached
EXISTS url:analytics:abc123  # Should be 1

# Check cache contains pagination info
GET url:analytics:abc123
```

**Expected:**

```
(integer) 1
(serialized data with pagination)
```

**What to Verify:**

- ✅ Only 1 record per page
- ✅ totalPages = 4
- ✅ Records retrieved in correct order (newest first)
- ✅ Cache works for paginated requests

---

### Phase 6: Error Handling

#### Request 12: Invalid Short Code

**Endpoint:** `GET /invalidcode`

**In Postman:**

1. Click **12. Invalid Short Code (404)** request
2. Click **Send**

**Expected Response (Status: 404):**

```json
{
  "success": false,
  "statusCode": 404,
  "message": "URL not found"
}
```

**MongoDB Verification:**

```bash
mongosh
use url-shortener

# Verify no document with this code
db.urls.findOne({ shortUrl: "invalidcode" })

# Count total (should still be 2)
db.urls.countDocuments()
```

**Expected:**

```
null  # Not found
2     # Still only our 2 URLs
```

**Redis Verification:**

```bash
redis-cli

# Check no cache for invalid code
GET short:url:invalidcode

# Check Bloom filter (should return 0)
BF.EXISTS bloom:shorturl invalidcode
```

**Expected:**

```
(nil)
(integer) 0
```

**What to Verify:**

- ✅ Status code: 404
- ✅ Database unchanged
- ✅ No invalid entries created
- ✅ Cache clean

---

## Final Verification Summary

### MongoDB - Final State

```bash
mongosh
use url-shortener

# Total documents
db.urls.countDocuments()  # Should be 2

# Show all documents
db.urls.find()

# Total visits
db.urlvisits.countDocuments()  # Should be 4

# Verify no orphaned data
db.urls.find({ clickCount: { $lt: 0 } }).count()  # Should be 0
db.urls.find({ originalUrl: null }).count()  # Should be 0
```

**Expected Final State:**

```
Collections: 2
Documents: 2 URLs (abc123, mytube)
Visits: 4 (all from abc123)
Data Integrity: All checks pass
```

---

### Redis - Final State

```bash
redis-cli

# Total keys
DBSIZE

# All cache keys
KEYS *

# Detailed breakdown
KEYS short:url:*    # Should have 2 entries
KEYS url:analytics:*  # Should have 0-1 (depends on timing)
KEYS bloom:*        # Should have bloom filter
KEYS ratelimit:*    # Rate limiter keys

# Cache stats
INFO stats
```

**Expected Final State:**

```
KEYS short:url:*
1) "short:url:abc123"
2) "short:url:mytube"

Analytics cache: 0-1 (depending on TTL)
Bloom filter: 1 entry
```

---

## Testing Checklist

### ✅ Health & Setup

- [ ] All 5 services running
- [ ] Postman collection imported
- [ ] Environment variables configured
- [ ] Health check returns 200

### ✅ URL Creation Tests

- [ ] Generated URL: Status 201, shortUrl set in env
- [ ] Custom URL: Status 201, custom code matches
- [ ] Duplicate URL: Status 409, no duplicate in DB
- [ ] Invalid URL: Status 400, no entry in DB

### ✅ Click Tracking Tests

- [ ] Single redirect: Visit record created, clickCount increments after 2-3s
- [ ] Multiple clicks: 4 visit records, clickCount = 4
- [ ] All records have IP, browser, OS, device info
- [ ] Timestamps show correct sequence

### ✅ Analytics Tests

- [ ] First call: Response time ~150-300ms (DB)
- [ ] Subsequent calls: Response time ~50-100ms (cache)
- [ ] totalClicks matches database
- [ ] All visit records returned

### ✅ Cache Tests

- [ ] Cache TTL is 60 seconds
- [ ] Cache expires after 60 seconds
- [ ] New cache created on refresh
- [ ] Cache hit reduces response time

### ✅ Pagination Tests

- [ ] Page 1 limit 1: Returns 1 record
- [ ] Page 2 limit 1: Returns different record
- [ ] totalPages calculated correctly
- [ ] Records ordered by clickedAt descending

### ✅ Error Handling Tests

- [ ] Invalid code: Status 404
- [ ] Malformed request: Status 400
- [ ] No data corruption on errors
- [ ] Cache remains clean

### ✅ Database Integrity

- [ ] MongoDB: 2 URLs, 4 visits
- [ ] No negative clickCounts
- [ ] No null/empty fields
- [ ] All visits linked to correct URL

### ✅ Cache Integrity

- [ ] Redis: 2 redirect caches
- [ ] Bloom filter contains both codes
- [ ] Analytics cache expires properly
- [ ] No stale data

### ✅ Performance

- [ ] Create: 50-150ms
- [ ] Redirect (first): 100-200ms
- [ ] Redirect (cached): 30-50ms
- [ ] Analytics (first): 150-300ms
- [ ] Analytics (cached): 50-100ms

---

## Common Issues & Solutions

### Issue: Environment variables not updating

**Solution:** Ensure Test tab scripts run after request completes

### Issue: clickCount not incrementing

**Solution:** Wait 2-3 seconds, check worker logs for NATS connection

### Issue: Slow response times

**Solution:** Check if services are using full CPU, restart if needed

### Issue: Bloom filter commands error

**Solution:** Bloom filter is optional, system works without it

### Issue: Cache not expiring

**Solution:** Check Redis TTL with `TTL url:analytics:abc123`

### Issue: Worker not processing

**Solution:** Verify NATS is running and worker shows "Connected to NATS"

---

## Run All Tests as a Collection

**In Postman:**

1. Click collection name: **URL Shortener API**
2. Click **Run** (or Ctrl+Shift+R)
3. Select all requests or custom order:
   - Health Check
   - 1. Create Generated Short URL
   - 2. Create Custom Short URL
   - 3. Duplicate Custom URL (Should Fail)
   - 4. Invalid URL (Should Fail)
   - 5. Redirect to Original URL
   - 6. Get URL Analytics (Before Clicks)
   - 7. Redirect - Click 1
   - 8. Redirect - Click 2
   - 9. Redirect - Click 3
   - 10. Get Analytics After Clicks
   - 11. Pagination - Page 1 Limit 1
   - 12. Invalid Short Code (404)

4. Click **Run URL Shortener API**
5. View results in Collection Runner

**Expected:**

- ✅ All tests show green checkmarks
- ✅ No failures
- ✅ All assertions pass

---

## Notes

- 🔔 **Always wait 2-3 seconds after redirect clicks before checking analytics** (worker processing time)
- 🔔 **Cache TTL is 60 seconds** - plan timing accordingly for cache expiration tests
- 🔔 **Bloom filter is optional** - system functions without it
- 🔔 **Worker must be running** - NATS events won't process without it
- 🔔 **All 5 services must be running** - any missing service will cause failures
