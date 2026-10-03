#!/bin/sh
# Полная проверка: обе сборки и все тесты; печатает только провалы и итоги.
#   sh tests/run.sh               всё
#   sh tests/run.sh labs nav      только эти
#   sh tests/run.sh --changed     только те, что касаются изменённых файлов (git status: правки и новые файлы)
#   sh tests/run.sh --changed --list   только назвать их, ничего не запуская
#   JOBS=2 sh tests/run.sh        сколько наборов идут сразу (по умолчанию 3)
# Наборы идут по нескольку сразу, самые долгие первыми; то, что меряет время на замедленном процессоре
# (perf и загрузка картинок, ills --net), — в конце, по одному. Вывод каждого — tests/out/run-<имя>.log,
# на экран — в обычном порядке.
cd "$(dirname "$0")/.." || exit 1
mkdir -p tests/out
# a suite that hangs (a browser that stopped answering) fails after 30 minutes instead of holding up the rest
limit=""
command -v timeout > /dev/null && limit="timeout 1800"

# one suite, run by the pool below: its log, then its exit code and seconds
if [ "$1" = "--one" ]; then
  t=$2
  case "$t" in
    ills) set -- tests/ills.js --no-net ;;
    ills-net) set -- tests/ills.js --net ;;
    *) set -- "tests/$t.js" ;;
  esac
  s=$(date +%s)
  $limit node "$@" > "tests/out/run-$t.log" 2>&1
  echo "$? $(( $(date +%s) - s ))" > "tests/out/run-$t.code"
  exit 0
fi

ALL="pages clean nav labs overlap controls gestures ills garden agronom pwa perf single"
# the suites a changed file concerns (the first pattern that fits); a file the table does not know — all of them
suites_for() {
  case "$1" in
    tests/run.sh|tests/lib.js|scripts/build.py|scripts/serve.py|scripts/bundle.py) echo "$ALL" ;;
    tests/gallery.js) echo "" ;;
    tests/*.js) basename "$1" .js ;;
    src/labs/*) echo "labs overlap controls ills single" ;;
    src/pages/moy/*) echo "garden agronom controls pwa" ;;
    src/js/app/22-garden*|src/js/data/08-*|src/js/data/09-*|src/js/data/10-*) echo "garden agronom controls" ;;
    src/sw.js|src/sw-off.js|src/js/app/22-install.js|src/icons/*) echo "pwa clean" ;;
    src/js/app/02-router.js|src/js/app/03-sheets.js|src/js/app/22-reading-pos.js|src/js/data/00-nav.js|src/layout.html|src/js/haptics.js) echo "nav pages clean gestures single" ;;
    src/js/app/04-search*) echo "nav pages" ;;
    src/css/*) echo "overlap controls gestures ills pages" ;;
    src/pages/*) echo "pages overlap controls ills single" ;;
    src/js/scene/*) echo "perf ills" ;;
    # written by the build, or prose
    *.html|*.md|assets/*|dist/*|tests/out/*) echo "" ;;
    *) echo "$ALL" ;;
  esac
}

list_only=""
for a in "$@"; do [ "$a" = "--list" ] && list_only=1; done
if [ -n "$list_only" ]; then
  rest=""
  for a in "$@"; do [ "$a" = "--list" ] || rest="$rest $a"; done
  set -- $rest
fi
if [ "$1" = "--changed" ]; then
  want=""
  for f in $(git status --porcelain --untracked-files=all | sed 's/^...//; s/.* -> //'); do want="$want $(suites_for "$f")"; done
  # pages always: it is quick and catches a broken build
  set -- pages $want
fi
# the chosen ones in the usual order, each once
list=""
for t in $ALL; do
  for w in ${*:-$ALL}; do [ "$w" = "$t" ] && { list="$list $t"; break; }; done
done
for w in "$@"; do
  case " $ALL " in *" $w "*) ;; *) echo "нет такого набора: $w"; exit 1 ;; esac
done

echo "наборы:$list"
[ -n "$list_only" ] && exit 0
start=$(date +%s)
# both builds at once: the hosting one does not touch the root (build.py)
python3 scripts/build.py > tests/out/run-build.log 2>&1 & b1=$!
python3 scripts/build.py --clean --out dist/site > tests/out/run-build-clean.log 2>&1 & b2=$!
wait $b1 || { cat tests/out/run-build.log; exit 1; }
wait $b2 || { cat tests/out/run-build-clean.log; exit 1; }

# the pool: the longest first, so that the short ones fill the gaps at the end
pool="" tail=""
for t in ills labs nav controls agronom overlap garden gestures pages clean single pwa; do
  case " $list " in *" $t "*) pool="$pool $t" ;; esac
done
case " $list " in *" ills "*) tail="$tail ills-net" ;; esac
case " $list " in *" perf "*) tail="$tail perf" ;; esac
for t in $pool $tail; do rm -f "tests/out/run-$t.code"; done
[ -n "$pool" ] && printf '%s\n' $pool | xargs -P "${JOBS:-3}" -I{} sh tests/run.sh --one {}
for t in $tail; do sh tests/run.sh --one "$t"; done

status=0
for t in $list; do
  for part in $t $( [ "$t" = ills ] && echo ills-net ); do
    read -r code secs 2> /dev/null < "tests/out/run-$part.code" || { code=1; secs=0; }
    echo "== $part  $secs с"
    [ "$code" -eq 0 ] || status=1
    [ "$code" -eq 124 ] && echo "FAIL $part: no answer for 30 minutes, stopped"
    grep -v '^PASS' "tests/out/run-$part.log"
    rm -f "tests/out/run-$part.code"
  done
done
echo "— всё за $(( $(date +%s) - start )) с"
exit $status
