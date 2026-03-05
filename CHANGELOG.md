# Changelog

All notable changes to this project will be documented in this file.

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
