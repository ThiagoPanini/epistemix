#!/usr/bin/env bash

set -euo pipefail

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

require_tools() {
  need gh
  need git
}

jq_escape() {
  local value=${1-}
  value=${value//\\/\\\\}
  value=${value//\"/\\\"}
  value=${value//$'\n'/\\n}
  printf '%s' "$value"
}

jq_string() {
  printf '"%s"' "$(jq_escape "$1")"
}

repo_name_with_owner() {
  gh repo view --json nameWithOwner --jq '.nameWithOwner'
}

repo_owner() {
  gh repo view --json owner --jq '.owner.login'
}

repo_name() {
  gh repo view --json name --jq '.name'
}

default_branch() {
  gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'
}

current_user() {
  gh api user --jq '.login'
}

project_owner() {
  if [[ -n "${TP_PROJECT_OWNER:-}" ]]; then
    printf '%s\n' "$TP_PROJECT_OWNER"
  else
    repo_owner
  fi
}

project_number() {
  if [[ -n "${TP_PROJECT_NUMBER:-}" ]]; then
    printf '%s\n' "$TP_PROJECT_NUMBER"
    return
  fi

  local owner title title_json number
  owner=$(project_owner)
  title=${TP_PROJECT_TITLE:-talkingpres — roadmap}
  title_json=$(jq_string "$title")
  number=$(
    gh project list --owner "$owner" --limit 100 --format json \
      --jq ".projects[] | select(.title == $title_json) | .number" | head -n 1
  )

  [[ -n "$number" ]] || die "project not found for owner=$owner title=$title; set TP_PROJECT_NUMBER"
  printf '%s\n' "$number"
}

project_id() {
  gh project view "$(project_number)" --owner "$(project_owner)" --format json --jq '.id'
}

status_field() {
  printf '%s\n' "${TP_STATUS_FIELD:-Status}"
}

owner_field() {
  printf '%s\n' "${TP_OWNER_FIELD:-Owner}"
}

issue_url() {
  gh issue view "$1" --json url --jq '.url'
}

issue_title() {
  gh issue view "$1" --json title --jq '.title'
}

issue_assignees() {
  gh issue view "$1" --json assignees --jq '.assignees[].login'
}

project_item_id_for_issue() {
  local issue=$1
  local project=$2
  local repo_full repo_owner_name repo_short
  repo_full=$(repo_name_with_owner)
  repo_owner_name=${repo_full%%/*}
  repo_short=${repo_full#*/}

  gh api graphql \
    -F repoOwner="$repo_owner_name" \
    -F repoName="$repo_short" \
    -F issueNumber="$issue" \
    -f query='
      query($repoOwner: String!, $repoName: String!, $issueNumber: Int!) {
        repository(owner: $repoOwner, name: $repoName) {
          issue(number: $issueNumber) {
            projectItems(first: 50) {
              nodes {
                id
                project { id }
              }
            }
          }
        }
      }
    ' \
    --jq ".data.repository.issue.projectItems.nodes[] | select(.project.id == \"$(jq_escape "$project")\") | .id" |
    head -n 1
}

ensure_project_item_for_issue() {
  local issue=$1
  local project item url
  project=$(project_id)
  item=$(project_item_id_for_issue "$issue" "$project" || true)

  if [[ -n "$item" ]]; then
    printf '%s\n' "$item"
    return
  fi

  url=$(issue_url "$issue")
  gh project item-add "$(project_number)" --owner "$(project_owner)" --url "$url" --format json --jq '.id'
}

field_id() {
  local field=$1
  local field_json id
  field_json=$(jq_string "$field")
  id=$(
    gh project field-list "$(project_number)" --owner "$(project_owner)" --limit 200 --format json \
      --jq ".fields[] | select(.name == $field_json) | .id" | head -n 1
  )
  [[ -n "$id" ]] || die "field not found: $field"
  printf '%s\n' "$id"
}

single_select_option_id() {
  local field=$1
  local option=$2
  local field_json option_json id
  field_json=$(jq_string "$field")
  option_json=$(jq_string "$option")
  id=$(
    gh project field-list "$(project_number)" --owner "$(project_owner)" --limit 200 --format json \
      --jq ".fields[] | select(.name == $field_json) | .options[]? | select(.name == $option_json) | .id" |
      head -n 1
  )
  [[ -n "$id" ]] || die "option not found: field=$field option=$option"
  printf '%s\n' "$id"
}

set_single_select() {
  local issue=$1
  local field=$2
  local option=$3
  local project item field_id_value option_id_value

  project=$(project_id)
  item=$(ensure_project_item_for_issue "$issue")
  field_id_value=$(field_id "$field")
  option_id_value=$(single_select_option_id "$field" "$option")

  gh project item-edit \
    --id "$item" \
    --project-id "$project" \
    --field-id "$field_id_value" \
    --single-select-option-id "$option_id_value" >/dev/null

  printf '%s\n' "$item"
}

get_single_select_value() {
  local issue=$1
  local field=$2
  local project field_json
  local repo_full repo_owner_name repo_short

  project=$(project_id)
  field_json=$(jq_string "$field")
  repo_full=$(repo_name_with_owner)
  repo_owner_name=${repo_full%%/*}
  repo_short=${repo_full#*/}

  gh api graphql \
    -F repoOwner="$repo_owner_name" \
    -F repoName="$repo_short" \
    -F issueNumber="$issue" \
    -f query='
      query($repoOwner: String!, $repoName: String!, $issueNumber: Int!) {
        repository(owner: $repoOwner, name: $repoName) {
          issue(number: $issueNumber) {
            projectItems(first: 50) {
              nodes {
                project { id }
                fieldValues(first: 100) {
                  nodes {
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      name
                      field {
                        ... on ProjectV2SingleSelectField { name }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ' \
    --jq ".data.repository.issue.projectItems.nodes[] | select(.project.id == \"$(jq_escape "$project")\") | .fieldValues.nodes[] | select(.field.name == $field_json) | .name" |
    head -n 1
}

assert_project_scope_hint() {
  local owner
  owner=$(project_owner)
  if ! gh project list --owner "$owner" --limit 1 >/dev/null 2>&1; then
    die "cannot access GitHub Projects for owner=$owner; run: gh auth refresh -s project"
  fi
}
