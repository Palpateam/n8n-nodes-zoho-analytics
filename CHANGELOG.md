# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-03-12

### Added
- **String ID Inputs:** Changed Organization, Workspace, and View input fields from dropdowns (`options`) to text fields (`string`). This allows for explicit configuration to bypass background resolution failures.

### Fixed
- **Refresh Token Expiry (Issue #2):** Made the `authQueryParameters` visible in credentials to enforce `access_type=offline` and `prompt=consent` ensuring proper Refresh Token generation from Zoho during OAuth login instead of session expiration after 3600s.
- **Background Authorization Fails (`ERR_INVALID_URL` Root Cause):** Flattened the nested `{{$self["url"]}}` reference in the OAuth credential's tokens endpoints to use `{{$self["environment"]}}` directly. This prevents n8n from creating malformed URLs during background refreshes.

## [1.1.1] - 2026-03-06

### Added

- URL pre-validation with `new URL()` before every API call — invalid URLs now produce a descriptive error showing the exact URL and parameters.
- Guard clauses that validate `workspaceID` and `viewID` are non-empty before constructing endpoints.
- Environment value sanitization against known Zoho domains (`eu`, `com`, `com.au`, `com.cn`, `in`, `jp`).
- Diagnostic `console.log` output of resolved parameter values and constructed URLs for debugging scheduled executions.

### Fixed

- Persistent `Invalid URL` (ERR_INVALID_URL) error during scheduled executions — now fails early with actionable error messages instead of a cryptic URL error.

## [1.1.0] - 2026-03-04

### Added

- Added `encodeURIComponent` to all API endpoints to handle special characters and spaces in parameters.
- Robust handling of Organization, Workspace, and View IDs by automatic trimming.

### Fixed

- Fixed `Invalid URL` (ERR_INVALID_URL) error during scheduled executions caused by trailing whitespaces or hidden newline characters in dynamic expressions.
- Improved header stability for `ZANALYTICS-ORGID`.

## [1.0.2] - 2026-02-25

### Fixed

- Fixed multipart/form-data encoding for data import operations.
- Resolved build issues and updated dependencies.

## [1.0.0] - 2026-02-24

### Added

- Initial release of Zoho Analytics v2 node.
- Support for row operations (add, update, delete).
- Support for data operations (import, export).
- OAuth2 authentication.
