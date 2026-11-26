#!/usr/bin/env python3
"""
Example LRecordFlow script.

Usage:
    python3 example_pipeline.py --sample=<value>

Outputs a JSON dictionary of results, keyed by column name. The values are
written back to the record as `<script_name>:<column>` columns.
"""
import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser(description='LRecordFlow example pipeline')
    parser.add_argument('--sample', required=True, help='The record identifier')
    args = parser.parse_args()

    # Simulate work...
    print(f'Processing sample: {args.sample}', file=sys.stderr)

    results = {
        'coverage': '35.2',
        'n_contigs': '12',
        'status': 'complete'
    }

    print(json.dumps(results))
    return 0


if __name__ == '__main__':
    sys.exit(main())
