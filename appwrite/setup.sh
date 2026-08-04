#!/usr/bin/env bash
# ============================================================
# BHARAT INVENTORY - APPWRITE SETUP
#
# Provisions the database, collections, attributes, indexes,
# and default categories used by this app in a fresh Appwrite
# project. Run this once against your own project.
#
# Requires:
#   APPWRITE_ENDPOINT   e.g. https://cloud.appwrite.io/v1
#   APPWRITE_PROJECT    Project ID (Console -> Settings)
#   APPWRITE_KEY        Server API Key with Databases scopes
#                        (Console -> your project -> API Keys)
# ============================================================
set -euo pipefail

: "${APPWRITE_ENDPOINT:?Set APPWRITE_ENDPOINT}"
: "${APPWRITE_PROJECT:?Set APPWRITE_PROJECT}"
: "${APPWRITE_KEY:?Set APPWRITE_KEY}"

EP="$APPWRITE_ENDPOINT"
PROJ="$APPWRITE_PROJECT"
KEY="$APPWRITE_KEY"
DB_ID="bharat_inventory"

hdr=(-H "X-Appwrite-Project: $PROJ" -H "X-Appwrite-Key: $KEY" -H "Content-Type: application/json")

call() {
  local method="$1" path="$2" data="${3:-}"
  if [ -n "$data" ]; then
    curl -sS -X "$method" "${hdr[@]}" -d "$data" "$EP$path"
  else
    curl -sS -X "$method" "${hdr[@]}" "$EP$path"
  fi
}

wait_available() {
  local coll="$1" key="$2"
  for _ in $(seq 1 20); do
    local status
    status=$(call GET "/databases/$DB_ID/collections/$coll/attributes/$key" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).status)}catch{console.log('unknown')}})")
    if [ "$status" = "available" ]; then return 0; fi
    sleep 1
  done
}

echo "== Creating database =="
call POST /databases "{\"databaseId\":\"$DB_ID\",\"name\":\"Bharat Inventory\"}"; echo

create_collection() {
  local id="$1" name="$2"
  echo "== Creating collection: $id =="
  call POST "/databases/$DB_ID/collections" "{\"collectionId\":\"$id\",\"name\":\"$name\",\"permissions\":[\"create(\\\"users\\\")\"],\"documentSecurity\":true}"; echo
}

create_string_attr() {
  local coll="$1" key="$2" size="$3" required="$4" default="${5:-}"
  local body="{\"key\":\"$key\",\"size\":$size,\"required\":$required"
  if [ -n "$default" ]; then body="$body,\"default\":\"$default\""; fi
  body="$body}"
  call POST "/databases/$DB_ID/collections/$coll/attributes/string" "$body"; echo
  wait_available "$coll" "$key"
}

create_bool_attr() {
  local coll="$1" key="$2" required="$3" default="${4:-}"
  local body="{\"key\":\"$key\",\"required\":$required"
  if [ -n "$default" ]; then body="$body,\"default\":$default"; fi
  body="$body}"
  call POST "/databases/$DB_ID/collections/$coll/attributes/boolean" "$body"; echo
  wait_available "$coll" "$key"
}

create_int_attr() {
  local coll="$1" key="$2" required="$3" default="${4:-}"
  local body="{\"key\":\"$key\",\"required\":$required"
  if [ -n "$default" ]; then body="$body,\"default\":$default"; fi
  body="$body}"
  call POST "/databases/$DB_ID/collections/$coll/attributes/integer" "$body"; echo
  wait_available "$coll" "$key"
}

create_float_attr() {
  local coll="$1" key="$2" required="$3"
  call POST "/databases/$DB_ID/collections/$coll/attributes/float" "{\"key\":\"$key\",\"required\":$required}"; echo
  wait_available "$coll" "$key"
}

create_index() {
  local coll="$1" key="$2" type="$3" attrs="$4"
  call POST "/databases/$DB_ID/collections/$coll/indexes" "{\"key\":\"$key\",\"type\":\"$type\",\"attributes\":$attrs}"; echo
}

# ── categories ──────────────────────────────────────────────
create_collection "categories" "Categories"
create_string_attr categories user_id 64 false
create_string_attr categories name 128 true
create_string_attr categories icon 16 false "📦"
create_string_attr categories color 16 false "#94A3B8"
create_bool_attr categories is_default false false
create_index categories idx_user_id key '["user_id"]'

# ── suppliers ───────────────────────────────────────────────
create_collection "suppliers" "Suppliers"
create_string_attr suppliers user_id 64 true
create_string_attr suppliers name 128 true
create_string_attr suppliers phone 32 false
create_string_attr suppliers email 128 false
create_string_attr suppliers address 256 false
create_index suppliers idx_user_id key '["user_id"]'

# ── products ────────────────────────────────────────────────
# NOTE: expiry_date / manufacture_date are plain 'yyyy-MM-dd' strings,
# not Appwrite 'datetime' attributes -- the app compares/sorts them as
# date strings (calendar view, range filters) and a datetime attribute
# would store a full ISO timestamp with timezone, breaking that.
create_collection "products" "Products"
create_string_attr products user_id 64 true
create_string_attr products name 256 true
create_string_attr products category_id 64 false
create_string_attr products barcode 64 false
create_string_attr products batch_number 64 false
create_string_attr products manufacture_date 10 false
create_string_attr products expiry_date 10 true
create_int_attr products quantity false 1
create_string_attr products unit 16 false "pcs"
create_string_attr products supplier_id 64 false
create_float_attr products price false
create_string_attr products location 128 false
create_string_attr products notes 1024 false
create_string_attr products image_url 512 false
create_bool_attr products is_archived false false
create_index products idx_user_id key '["user_id"]'
create_index products idx_expiry_date key '["expiry_date"]'
create_index products idx_user_archived key '["user_id","is_archived"]'

# ── notification_settings ──────────────────────────────────
create_collection "notification_settings" "Notification Settings"
create_string_attr notification_settings user_id 64 true
create_int_attr notification_settings days_before true
create_bool_attr notification_settings is_enabled false true
create_string_attr notification_settings channel 16 false "push"
create_index notification_settings idx_user_id key '["user_id"]'
create_index notification_settings idx_unique unique '["user_id","days_before","channel"]'

# ── notification_logs ───────────────────────────────────────
create_collection "notification_logs" "Notification Logs"
create_string_attr notification_logs user_id 64 true
create_string_attr notification_logs product_id 64 true
create_int_attr notification_logs days_before true
create_string_attr notification_logs status 16 false "pending"
call POST "/databases/$DB_ID/collections/notification_logs/attributes/datetime" '{"key":"sent_at","required":false}'; echo
wait_available notification_logs sent_at
create_index notification_logs idx_user_id key '["user_id"]'

# ── user_profiles ────────────────────────────────────────────
create_collection "user_profiles" "User Profiles"
create_string_attr user_profiles full_name 128 false
create_string_attr user_profiles avatar_url 512 false

# ── seed default categories ─────────────────────────────────
seed_category() {
  local name="$1" icon="$2" color="$3"
  call POST "/databases/$DB_ID/collections/categories/documents" \
    "{\"documentId\":\"unique()\",\"data\":{\"name\":\"$name\",\"icon\":\"$icon\",\"color\":\"$color\",\"is_default\":true},\"permissions\":[\"read(\\\"users\\\")\"]}" > /dev/null
  echo "seeded category: $name"
}

seed_category "Dairy" "🥛" "#00D4FF"
seed_category "Grocery" "🥫" "#00FF94"
seed_category "Fruits" "🍎" "#FF6B35"
seed_category "Vegetables" "🥦" "#4ADE80"
seed_category "Medicines" "💊" "#A855F7"
seed_category "Cosmetics" "🧴" "#F472B6"
seed_category "Frozen Food" "🧊" "#38BDF8"
seed_category "Bakery" "🍞" "#F59E0B"
seed_category "Beverages" "🧃" "#FB923C"
seed_category "Electronics" "📱" "#818CF8"
seed_category "Others" "📦" "#94A3B8"

echo "Done. Set EXPO_PUBLIC_APPWRITE_DATABASE_ID=$DB_ID in your .env"
