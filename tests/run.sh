#!/bin/sh
# Полная проверка: обе сборки и все тесты; печатает только провалы и итоги.
#   sh tests/run.sh               всё
#   sh tests/run.sh labs nav      только эти
cd "$(dirname "$0")/.." || exit 1
python3 scripts/build.py > /dev/null || exit 1
python3 scripts/build.py --clean --out dist/site > /dev/null || exit 1
status=0
mkdir -p tests/out
# a suite that hangs (a browser that stopped answering) fails after 30 minutes instead of holding up the rest
limit=""
command -v timeout > /dev/null && limit="timeout 1800"
for t in ${*:-pages clean nav labs overlap controls ills garden perf single}; do
  echo "== $t"
  $limit node "tests/$t.js" > tests/out/run.log 2>&1
  code=$?
  [ $code -eq 0 ] || status=1
  [ $code -eq 124 ] && echo "FAIL $t: no answer for 30 minutes, stopped"
  grep -v '^PASS' tests/out/run.log
done
rm -f tests/out/run.log
exit $status
