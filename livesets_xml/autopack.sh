#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-
SELFPATH="$(readlink -m "$0"/..)"


function main () {
  local BFNS=()
  readarray -t BFNS < <(find "$@" -type f | sed -nre '
    s:^\./::
    s:\.(xml|als)$::p
    ' | sort -u)
  local BFN=
  for BFN in "${BFNS[@]}"; do
    echo -n "$BFN: "
    if [ -s "$BFN".xml ]; then
      echo -n '.xml already unpacked. '
    else
      echo -n 'unpack xml: '
      gzip --decompress --to-stdout "$BFN".als >"$BFN".xml
      echo -n "rv=$?. "
    fi
    if [ -s "$BFN".als ]; then
      echo '.als already packed.'
    else
      echo -n 'pack .als: '
      gzip --best --to-stdout "$BFN".xml >"$BFN".als
      echo "rv=$?"
    fi
  done

  return 0
}













main "$@"; exit $?
