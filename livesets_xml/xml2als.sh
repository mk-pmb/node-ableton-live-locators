#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-
for XML_FN in *.xml; do
  ALS_FN="$(basename "$XML_FN" .xml).als"
  echo -n "$XML_FN -> $ALS_FN: "
  if [ -f "$ALS_FN" ]; then
    echo 'target exists, skip.'
    continue
  fi
  XML_SZ="$(stat -c %s "$XML_FN")"
  echo -n "$XML_SZ -> "
  gzip --best --to-stdout "$XML_FN" >"$ALS_FN"
  ALS_SZ="$(stat -c %s "$ALS_FN")"
  echo "$ALS_SZ ($(( (100 * $ALS_SZ) / $XML_SZ ))%)"
done
