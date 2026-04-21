#!/bin/bash
set -e
cd "$(dirname "$0")"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp -n .env.example .env || true
python run.py
