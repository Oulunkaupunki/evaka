#!/bin/bash

# SPDX-FileCopyrightText: 2017-2021 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

# Run E2E tests inside a container in CircleCI with the app running in compose.
#
# Usage:
#   1. Start compose stack
#   2. Create split test split file under frontend/ for target test runner
#   3. Run this script

set -euo pipefail

if [ "${DEBUG:-X}" = "true" ]; then
  set -x
fi

if [ "${1:-X}" = "X" ]; then
  echo "Usage: $0 <testcafe|playwright>"
  exit 1
fi

COMPOSE_NETWORK=${COMPOSE_NETWORK:-compose_default}
PLAYWRIGHT_VERSION=${PLAYWRIGHT_VERSION:-v1.16.2}
TEST_RUNNER=$1

# Ensure we are in repository root
pushd "$(dirname "${BASH_SOURCE[0]}")"/..

if [ "${CI:-false}" = 'true' ]; then
  pushd frontend
  # Get list of test files that should run on this node.
  if [ "$TEST_RUNNER" = "playwright" ]; then
    mapfile -t FILENAMES < <(circleci tests glob \
        'src/e2e-playwright/specs/**/*.spec.ts' \
        | sort -h \
        | circleci tests split --split-by=timings --timings-type=filename)
    printf '%s\n' 'Spec files selected for node:' "${FILENAMES[@]}"
    printf "%s\n" "${FILENAMES[@]}" > playwright-filenames.txt
  elif [ "$TEST_RUNNER" = "testcafe" ]; then
    # NOTE: Currently testcafe-reporter-junit doesn't provide
    # filenames in its output so they can't be used for splitting
    # -> use fixture names instead.
    mapfile -t FIXTURE_NAMES < <(git grep '^\w*fixture(' -- src/e2e-test/specs/ \
      | awk -F "'" '{print $2}' \
      | sort -h | uniq \
      | circleci tests split --split-by=timings --timings-type classname)
    printf '%s\n' 'Fixtures selected for node:' "${FIXTURE_NAMES[@]}"
    # NOTE: This is extremely brittle but necessary as Testcafe
    # doesn't support multiple --fixture arguments (+ the above
    # report issue) -> everything must be a single regex.
    TESTCAFE_FIXTURE_REGEX=$(printf '%s\n' "${FIXTURE_NAMES[@]}" | sed 's/[^-A-Za-z0-9_]/\\&/g' | awk '{print "^"$0"$"}' | tr '\n' '|')
    # Strip the last "|"
    TESTCAFE_FIXTURE_REGEX=${TESTCAFE_FIXTURE_REGEX%?}
    echo "Prepared arguments for yarn: ${TESTCAFE_FIXTURE_REGEX}"
    echo "$TESTCAFE_FIXTURE_REGEX" > testcafe-fixture-regex.txt
  else
    echo "ERROR: Invalid test_runner: $TEST_RUNNER"
    exit 1
  fi
  popd
else
  rm -f frontend/testcafe-fixture-regex.txt
fi

pushd compose

./test-e2e run "$TEST_RUNNER"
