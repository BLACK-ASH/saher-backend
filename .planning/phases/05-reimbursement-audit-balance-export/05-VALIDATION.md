# Phase 05: Validation Strategy

## Goal
Verify reimbursement module integrity, balance updates, and bill export generation.

## 1. Functional Verification
*   **Balance Accuracy:** Create test scenarios:
    *   Submit bill (pending).
    *   Admin approve/settle (check balance decrement).
    *   Admin reject (balance remains same).
*   **Export Pipeline:**
    *   Enqueue export job (PDF/Excel).
    *   Verify notification action URL matches download endpoint.
    *   Verify generated file exists and contains correct bill data.

## 2. Integrity Constraints
*   `05-VAL-01`: Bill approval cannot lead to negative balance (if business rule enforces).
*   `05-VAL-02`: Export files MUST be cleaned up after 24h.
