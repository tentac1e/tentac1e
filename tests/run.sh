#!/bin/sh
# Полная проверка: обе сборки и все тесты; печатает только провалы и итоги.
#   sh tests/run.sh               всё
#   sh tests/run.sh labs nav      только эти
cd "$(dirname "$0")/.." || exit 1
python3 scripts/build.py > /dev/null || exit 1
python3 scripts/build.py --clean --out dist/site > /dev/null || exit 1
status=0
mkdir -p tests/out
for t in ${*:-pages clean nav labs overlap controls garden perf single}; do
  echo "== $t"
  node "tests/$t.js" > tests/out/run.log 2>&1 || status=1
  grep -v '^PASS' tests/out/run.log
done
rm -f tests/out/run.log
exit $status
