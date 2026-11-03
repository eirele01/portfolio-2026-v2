#!/usr/bin/env bash
# [BOT-03] Probe battery for the RAG-only /api/chat — covers the composer's
# main paths: overviews, specific entities, tool lookup, honest miss,
# follow-up resolution, soft confidence, fallback, smalltalk, identity.
set -u
BASE="${1:-http://localhost:3000}"

probe() {
  local label="$1"; shift
  local payload="$1"; shift
  echo "=== $label"
  curl -s --max-time 15 -X POST "$BASE/api/chat" \
    -H 'content-type: application/json' -d "$payload" \
    | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('reply',d))"
  echo
}

echo "=== GET /api/chat self-check"
curl -s --max-time 10 "$BASE/api/chat"; echo; echo

probe "overview: what has he built" \
  '{"messages":[{"role":"user","content":"What has Eirele built?"}]}'
probe "overview: tech stack" \
  '{"messages":[{"role":"user","content":"What'\''s his tech stack?"}]}'
probe "tool: does he know Flutter" \
  '{"messages":[{"role":"user","content":"Does he know Flutter?"}]}'
probe "tool-usage: where has he used Laravel" \
  '{"messages":[{"role":"user","content":"Where has he used Laravel?"}]}'
probe "honest miss: does he know Python" \
  '{"messages":[{"role":"user","content":"Does he know Python?"}]}'
probe "entity: tell me about BrilliantPOS" \
  '{"messages":[{"role":"user","content":"Tell me about BrilliantPOS"}]}'
probe "follow-up: what stack does it use" \
  '{"messages":[{"role":"user","content":"Tell me about BrilliantPOS"},{"role":"assistant","content":"Brilliant POS — Point-of-sale software and hardware for brick-and-mortar industries."},{"role":"user","content":"What stack does it use?"}]}'
probe "entity: experience overview" \
  '{"messages":[{"role":"user","content":"What'\''s his experience?"}]}'
probe "entity: posting" \
  '{"messages":[{"role":"user","content":"What did he do at Tensei?"}]}'
probe "process: explain the story section" \
  '{"messages":[{"role":"user","content":"Explain the story section"}]}'
probe "phase: what is phase 3 about" \
  '{"messages":[{"role":"user","content":"What is phase 3 about?"}]}'
probe "contact: how do I reach him" \
  '{"messages":[{"role":"user","content":"How do I contact him?"}]}'
probe "phone: can I get his number" \
  '{"messages":[{"role":"user","content":"Can I get his phone number?"}]}'
probe "availability: is he open to work" \
  '{"messages":[{"role":"user","content":"Is he available for work?"}]}'
probe "location: where is he based" \
  '{"messages":[{"role":"user","content":"Where is he based?"}]}'
probe "resume: can I download his cv" \
  '{"messages":[{"role":"user","content":"Can I download his CV?"}]}'
probe "metrics: how many devices" \
  '{"messages":[{"role":"user","content":"How many devices does he manage?"}]}'
probe "smalltalk: hi" \
  '{"messages":[{"role":"user","content":"hi"}]}'
probe "identity: are you chatgpt" \
  '{"messages":[{"role":"user","content":"Are you ChatGPT?"}]}'
probe "fallback: weather in paris" \
  '{"messages":[{"role":"user","content":"What'\''s the weather in Paris?"}]}'
probe "soft: why did he switch careers" \
  '{"messages":[{"role":"user","content":"Why did he switch careers?"}]}'

echo "=== invalid payload (expect 400)"
curl -s --max-time 10 -o /dev/null -w "%{http_code}\n" -X POST "$BASE/api/chat" \
  -H 'content-type: application/json' -d '{"messages":[{"role":"assistant","content":"hi"}]}'
echo "=== invalid JSON (expect 400)"
curl -s --max-time 10 -o /dev/null -w "%{http_code}\n" -X POST "$BASE/api/chat" \
  -H 'content-type: application/json' -d 'not-json'
