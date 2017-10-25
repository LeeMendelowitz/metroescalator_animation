#!/bin/bash
set -euo pipefail

curl -o dcmetrometrics.zip http://dcmetrometrics.com/download/dcmetrometrics.zip
unzip -o dcmetrometrics.zip
python3 prepare_data.py
ln -s unit_by_date.json www/unit_by_date.json