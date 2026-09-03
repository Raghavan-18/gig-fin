#!/usr/bin/env bash
# Dhara demo smoke test — walks the full five-minute demo path headlessly
# against a running server and exits non-zero if any beat would fail on stage.
#
# Usage:  ./demo/smoke.sh [base_url]        (default http://localhost:8000)
set -uo pipefail

BASE="${1:-http://localhost:8000}"
FAIL=0
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

py() { python3 -c "$1" 2>/dev/null; }

# check <label> <file> <python-expr-over-d>
check() {
  local label="$1" file="$2" expr="$3"
  local out
  out=$(python3 - "$file" "$expr" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
try:
    print("PASS" if eval(sys.argv[2]) else "FAIL")
except Exception as e:
    print(f"FAIL ({type(e).__name__}: {e})")
PY
)
  if [[ "$out" == PASS ]]; then
    echo "  ok   $label"
  else
    echo "  FAIL $label  -- $out"
    FAIL=1
  fi
}

get() {  # get <path> <outfile>
  local code
  code=$(curl -s -m 90 -o "$2" -w '%{http_code}' "$BASE$1")
  [[ "$code" == 200 ]] || { echo "  FAIL GET $1 -> HTTP $code"; FAIL=1; return 1; }
}

post() { # post <path> <json> <outfile>
  local code
  code=$(curl -s -m 90 -o "$3" -w '%{http_code}' -X POST "$BASE$1" \
         -H 'content-type: application/json' -d "$2")
  [[ "$code" == 200 ]] || { echo "  FAIL POST $1 -> HTTP $code"; FAIL=1; return 1; }
}

echo "=== Dhara demo smoke test against $BASE ==="

echo "[0] server is up"
get /api/health "$TMP/health" && check "health ok"              "$TMP/health" "d['ok'] is True"
  check "ledger integrity holds" "$TMP/health" "all(v['healthy'] for v in d['ledger_integrity'].values())"

echo "[1] dashboard — buffer days is the north star"
get /api/dashboard "$TMP/dash" && {
  check "buffer_days > 0"            "$TMP/dash" "d['buffer_days'] > 0"
  check "essential burn is positive" "$TMP/dash" "d['essential_daily_burn'] > 0"
  check "balances present"           "$TMP/dash" "{'buffer','account','insurance_fund'} <= set(d['balances'])"
  check "safe-to-save is explained"  "$TMP/dash" "'amount' in d['safe_to_save'] and 'reason' in d['safe_to_save']"
}

echo "[2] forecast — an honest p10–p90 band, properly ordered"
get /api/forecast "$TMP/fc" && {
  check "14+ days of forecast"  "$TMP/fc" "len(d['points']) >= 14"
  check "p10 <= p20 <= p50 <= p90" "$TMP/fc" "all(x['p10'] <= x['p20'] <= x['p50'] <= x['p90'] for x in d['points'])"
  check "history to plot against" "$TMP/fc" "len(d['history']) > 0"
  check "coverage inside target band" "$TMP/fc" "d['calibration']['target_band'][0] <= d['calibration']['coverage_p10_p90'] <= d['calibration']['target_band'][1]"
}

echo "[3] the bad week — sweeps pause with a reason, shortfall is called early"
get /api/timeline "$TMP/tl" && {
  check "timeline has events"         "$TMP/tl" "len(d['events']) > 50"
  check "the drought is in window"    "$TMP/tl" "d['drought']['days'] > 0"
  check "sweeps actually paused"      "$TMP/tl" "any(x['paused'] for x in d['daily'])"
  check "pauses carry a reason code"  "$TMP/tl" "all(x['reason'] for x in d['daily'] if x['paused'])"
  check "DROUGHT is one of them"      "$TMP/tl" "any(x['reason']=='DROUGHT' for x in d['daily'])"
  check "surge skim rebuilt buffer"   "$TMP/tl" "any(l['mode']=='SURGE_SKIM' for x in d['daily'] for l in x.get('lines',[]))"
  check "drought never drains buffer" "$TMP/tl" "min(x['buffer'] for x in d['daily'] if x['idx'] >= d['drought']['start_idx']) >= min(x['buffer'] for x in d['daily'])"
  check "buffer recovers from its low" "$TMP/tl" "d['daily'][-1]['buffer'] > min(x['buffer'] for x in d['daily'])"
}
get "/api/replay?day=175" "$TMP/rp" && {
  check "replay returns days"        "$TMP/rp" "len(d['days']) > 0"
  check "each day shows its S2S"     "$TMP/rp" "all('s2s' in x for x in d['days'])"
  check "each sweep line is itemised" "$TMP/rp" "all('mode' in l and 'note' in l for x in d['days'] for l in x.get('lines',[]))"
}

echo "[4] the comparison — the slide that wins the room"
get /api/compare "$TMP/cmp" && {
  check "traditional bounces"        "$TMP/cmp" "d['traditional']['bounces'] > 0"
  check "dhara does not bounce"      "$TMP/cmp" "d['dhara']['bounces'] == 0"
  check "fees avoided is positive"   "$TMP/cmp" "d['delta']['fees_avoided'] > 0"
  check "dhara ends with more buffer days" "$TMP/cmp" "d['dhara']['buffer_days'] > d['traditional']['buffer_days']"
}

echo "[5] credit — the refusal path, and why"
post /api/credit/apply '{"amount":40000,"purpose":"bike repair"}' "$TMP/cr" && {
  check "large ask is not approved in full" "$TMP/cr" "d['decision']['outcome'] != 'APPROVE'"
  check "a binding constraint is named"     "$TMP/cr" "bool(d['decision']['binding_constraint'])"
  check "every policy rule is reported"     "$TMP/cr" "len(d['decision']['rules']) >= 4"
  check "an alternative is offered"        "$TMP/cr" "d['alternative'] is not None"
  check "the scorecard is shown"           "$TMP/cr" "'attributes' in d['scorecard']"
  check "both structures are backtested"   "$TMP/cr" "{'income_linked','fixed_emi'} <= set(d['structures'])"
  check "income-linked bounces less"       "$TMP/cr" "d['structures']['income_linked']['bounces'] <= d['structures']['fixed_emi']['bounces']"
  check "income-linked costs less in fees" "$TMP/cr" "d['structures']['income_linked']['fees'] <= d['structures']['fixed_emi']['fees']"
}

echo "[6] assistant — every digit traceable to a tool result"
for q in "how many buffer days do I have?" \
         "why did my savings stop this week?" \
         "can I afford a 40000 rupee loan?"; do
  post /api/assistant/ask "$(python3 -c "import json,sys;print(json.dumps({'text':sys.argv[1],'force_deterministic':True}))" "$q")" "$TMP/as" && {
    check "answered: $q"        "$TMP/as" "len(d['answer']) > 20"
    check "validator clean: $q" "$TMP/as" "d['validation']['ok'] is True"
    check "tools were used: $q" "$TMP/as" "len(d['tool_calls']) > 0"
  }
done

echo "[7] persona picker, mock AA consent, and income classification"
post /api/session '{"persona_id":"ravi"}' "$TMP/se" && {
  check "session opens for Ravi"      "$TMP/se" "d['persona']['id']=='ravi'"
  check "consent is labelled mock"    "$TMP/se" "d['consent']['simulated'] is True"
  check "180 days of history"         "$TMP/se" "d['days_of_history']==180"
}
code=$(curl -s -m 60 -o "$TMP/se2" -w '%{http_code}' -X POST "$BASE/api/session" \
       -H 'content-type: application/json' -d '{"persona_id":"sunita"}')
if [[ "$code" == 409 ]]; then
  echo "  ok   unseeded persona is refused, not faked"
else
  echo "  FAIL unseeded persona returned HTTP $code (expected 409)"; FAIL=1
fi
get /api/classify "$TMP/cl" && {
  check "classifier is honest about method" "$TMP/cl" "'not a trained model' in d['method']"
  check "self-transfers excluded"           "$TMP/cl" "d['excluded_total'] > 0"
  check "assessed < gross inflow"           "$TMP/cl" "d['assessed_income'] < d['gross_inflow']"
}
post /api/simulate/day '{"day":173}' "$TMP/sd" && {
  check "day steps and reports state" "$TMP/sd" "d['day']['idx']==173 and 's2s' in d['day']"
  check "mid-drought reads DROUGHT"   "$TMP/sd" "d['day']['reason']=='DROUGHT'"
  check "and the sweep is paused"     "$TMP/sd" "d['day']['paused'] is True"
}

echo "[8] the page itself loads"
code=$(curl -s -m 30 -o "$TMP/idx" -w '%{http_code}' "$BASE/")
if [[ "$code" == 200 ]] && grep -q "Dhara" "$TMP/idx"; then
  echo "  ok   index.html served ($(wc -c < "$TMP/idx") bytes)"
else
  echo "  FAIL index.html -> HTTP $code"; FAIL=1
fi

echo
if [[ $FAIL -eq 0 ]]; then
  echo "✓ All demo beats pass. Safe to present."
else
  echo "✗ Demo path is broken. Fix before presenting."
fi
exit $FAIL
