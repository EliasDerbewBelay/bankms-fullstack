# AASTU Bank Management System — Database Schema Reference

> **Database:** PostgreSQL | **ORM:** Prisma  
> **Total Tables:** 34 | **Total Enums:** 30  
> **Normal Form:** BCNF (Boyce–Codd Normal Form)

---

## Table of Contents

1. [Enums](#enums)
2. [Tables](#tables)
   - [bank](#1-bank)
   - [branch](#2-branch)
   - [department](#3-department)
   - [employee](#4-employee)
   - [currency](#5-currency)
   - [exchange_rate](#6-exchange_rate)
   - [account_type](#7-account_type)
   - [customer](#8-customer)
   - [account](#9-account)
   - [customer_account](#10-customer_account)
   - [online_user](#11-online_user)
   - [session](#12-session)
   - [password_history](#13-password_history)
   - [transaction](#14-transaction)
   - [transaction_fee](#15-transaction_fee)
   - [interest_accrual](#16-interest_accrual)
   - [loan_application](#17-loan_application)
   - [loan](#18-loan)
   - [collateral](#19-collateral)
   - [collateral_revaluation](#20-collateral_revaluation)
   - [repayment_schedule](#21-repayment_schedule)
   - [loan_payment](#22-loan_payment)
   - [guarantor](#23-guarantor)
   - [card](#24-card)
   - [card_transaction](#25-card_transaction)
   - [beneficiary](#26-beneficiary)
   - [standing_order](#27-standing_order)
   - [atm](#28-atm)
   - [atm_transaction](#29-atm_transaction)
   - [utility_payment](#30-utility_payment)
   - [refund](#31-refund)
   - [charge_schedule](#32-charge_schedule)
   - [notification](#33-notification)
   - [audit_log](#34-audit_log)
   - [teller_drawer](#35-teller_drawer)
   - [dispute](#36-dispute)
3. [Entity Relationships Summary](#entity-relationships-summary)
4. [Role Permissions Summary](#role-permissions-summary)

---

## Enums

| Enum | Values |
|------|--------|
| `account_status` | ACTIVE, INACTIVE, FROZEN, CLOSED, DORMANT |
| `application_status` | SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, CANCELLED, DISBURSED |
| `atm_status` | ONLINE, OFFLINE, LOW_CASH, OUT_OF_CASH, UNDER_MAINTENANCE |
| `audit_action` | LOGIN, LOGOUT, FAILED_LOGIN, CREATE, UPDATE, DELETE, TRANSACTION, LOAN_APPROVAL, CARD_BLOCK, PASSWORD_CHANGE, REFUND_APPROVAL, ACCOUNT_FREEZE, EXPORT, CONFIG_CHANGE |
| `branch_status` | ACTIVE, INACTIVE, TEMPORARILY_CLOSED, UNDER_RENOVATION |
| `card_network` | VISA, MASTERCARD, AMEX, UNIONPAY, LOCAL |
| `card_status` | ACTIVE, FROZEN, BLOCKED, EXPIRED, CANCELLED |
| `card_type` | DEBIT, CREDIT, PREPAID |
| `charge_applicable_to` | DEPOSIT, WITHDRAWAL, INTERNAL_TRANSFER, INTERBANK_TRANSFER, CARD_PAYMENT, UTILITY_PAYMENT, FX_CONVERSION, LOAN_PROCESSING |
| `charge_type` | FLAT, PERCENTAGE |
| `collateral_status` | ACTIVE, RELEASED, SEIZED |
| `collateral_type` | PROPERTY, VEHICLE, GOLD, SHARES, FIXED_DEPOSIT, MACHINERY, OTHER |
| `customer_type` | INDIVIDUAL, CORPORATE, JOINT |
| `dispute_status` | OPEN, UNDER_REVIEW, ESCALATED, RESOLVED, REJECTED |
| `employee_type` | FULL_TIME, PART_TIME, CONTRACT, INTERN |
| `fee_type` | SERVICE_CHARGE, VAT, STAMP_DUTY, FX_SPREAD, PROCESSING_FEE, PENALTY |
| `guarantor_status` | ACTIVE, RELEASED, CALLED |
| `guarantor_type` | PERSONAL, CORPORATE, GOVERNMENT |
| `interest_calc_method` | SIMPLE, COMPOUND_DAILY, COMPOUND_MONTHLY |
| `interest_rate_type` | FIXED, VARIABLE |
| `kyc_status` | PENDING, UNDER_REVIEW, VERIFIED, REJECTED, EXPIRED |
| `loan_status` | PENDING_DISBURSEMENT, ACTIVE, REPAID, DEFAULTED, WRITTEN_OFF, RESTRUCTURED |
| `loan_type` | PERSONAL, HOME, AUTO, CORPORATE, EDUCATION, AGRICULTURE, EMERGENCY |
| `notification_channel` | SMS, EMAIL, IN_APP, PUSH |
| `notification_type` | TRANSACTION_ALERT, LOGIN_ALERT, LOAN_REMINDER, CARD_ALERT, OTP, ACCOUNT_ALERT, SYSTEM |
| `order_frequency` | WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, ANNUALLY |
| `order_status` | ACTIVE, PAUSED, CANCELLED, COMPLETED |
| `ownership_relationship` | SOLE_OWNER, JOINT_OWNER, AUTHORIZED_SIGNATORY, TRUSTEE, GUARDIAN |
| `payment_mode` | ACCOUNT_DEBIT, CASH, CHEQUE, STANDING_ORDER |
| `refund_status` | PENDING_APPROVAL, APPROVED, PROCESSED, REJECTED |
| `repayment_status` | PENDING, PAID, PARTIALLY_PAID, OVERDUE, WAIVED |
| `risk_profile` | LOW, MEDIUM, HIGH, BLACKLISTED |
| `teller_drawer_status` | OPEN, CLOSED, BALANCING |
| `transaction_channel` | BRANCH, ATM, MOBILE, INTERNET, POS, SYSTEM |
| `transaction_status` | PENDING, PROCESSING, COMPLETED, FAILED, REVERSED, REFUNDED |
| `transaction_type` | DEPOSIT, WITHDRAWAL, INTERNAL_TRANSFER, INTERBANK_TRANSFER, CARD_PAYMENT, UTILITY_PAYMENT, FX_CONVERSION, LOAN_DISBURSEMENT, LOAN_REPAYMENT, INTEREST_CREDIT, FEE_CHARGE, REFUND, REVERSAL |
| `user_role` | CUSTOMER, TELLER, SUPERVISOR, BRANCH_MANAGER, ADMIN |
| `utility_status` | PENDING, COMPLETED, FAILED, REVERSED |
| `utility_type` | ELECTRICITY, WATER, TELECOM, INTERNET, TAX, INSURANCE, SCHOOL_FEE, OTHER |

---

## Tables

### 1. `bank`
Stores information about banks in the system (head office and partner banks for interbank transfers).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `bank_id` | INT | PK, AUTO | Primary key |
| `bank_code` | VARCHAR(20) | UNIQUE, NOT NULL | Bank identifier code (e.g. CBE, BOA) |
| `bank_name` | VARCHAR(200) | NOT NULL | Full bank name |
| `address` | TEXT | NOT NULL | Physical address |
| `city` | VARCHAR(100) | NOT NULL | City |
| `country` | VARCHAR(100) | DEFAULT 'Ethiopia' | Country |
| `phone_number` | VARCHAR(20) | NULL | Contact phone |
| `email` | VARCHAR(150) | NULL | Contact email |
| `website` | VARCHAR(255) | NULL | Bank website URL |
| `swift_code` | VARCHAR(11) | UNIQUE, NULL | SWIFT/BIC code |
| `established_date` | DATE | NULL | Date established |
| `is_head_office` | BOOLEAN | DEFAULT false | Whether this is the system's own bank |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Relations:** One bank → many `branch`

---

### 2. `branch`
Represents a physical branch of a bank. Supports self-referential hierarchy via `parent_branch_id`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `branch_id` | INT | PK, AUTO | Primary key |
| `branch_code` | VARCHAR(20) | UNIQUE, NOT NULL | Branch identifier code |
| `branch_name` | VARCHAR(200) | NOT NULL | Branch display name |
| `address` | TEXT | NOT NULL | Street address |
| `city` | VARCHAR(100) | NOT NULL | City |
| `phone_number` | VARCHAR(20) | NULL | Branch phone |
| `email` | VARCHAR(150) | NULL | Branch email |
| `bank_id` | INT | FK → bank | Owning bank |
| `parent_branch_id` | INT | FK → branch (self), NULL | Parent branch (for sub-branches) |
| `opening_date` | DATE | NOT NULL | Date branch opened |
| `status` | branch_status | DEFAULT ACTIVE | Operational status |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Relations:** Many branches → one `bank`; self-join hierarchy; one branch → many `department`, `employee`, `account`, `atm`, `card`, `teller_drawer`

---

### 3. `department`
A department within a branch. Unique per (department_name, branch_id).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `department_id` | INT | PK, AUTO | Primary key |
| `department_name` | VARCHAR(150) | NOT NULL | Department name |
| `branch_id` | INT | FK → branch | Owning branch |
| `manager_employee_id` | INT | FK → employee, NULL | Department manager |
| `cost_center` | VARCHAR(50) | NULL | Cost center code |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Unique constraint:** `(department_name, branch_id)`  
**Relations:** Many departments → one `branch`; optional manager → `employee`; one department → many `employee`

---

### 4. `employee`
Staff records across all branches. Self-referential manager hierarchy.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `employee_id` | INT | PK, AUTO | Primary key |
| `employee_code` | VARCHAR(20) | UNIQUE, NOT NULL | System-generated employee code |
| `first_name` | VARCHAR(100) | NOT NULL | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `position` | VARCHAR(150) | NOT NULL | Job title / position |
| `employee_type` | employee_type | DEFAULT FULL_TIME | Employment type |
| `salary` | DECIMAL(20,2) | NOT NULL | Monthly salary |
| `hire_date` | DATE | NOT NULL | Employment start date |
| `termination_date` | DATE | NULL | Employment end date (if applicable) |
| `phone_number` | VARCHAR(20) | NULL | Contact phone |
| `email` | VARCHAR(150) | UNIQUE, NOT NULL | Work email |
| `branch_id` | INT | FK → branch | Assigned branch |
| `department_id` | INT | FK → department, NULL | Assigned department |
| `manager_id` | INT | FK → employee (self), NULL | Direct manager |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Relations:** Many employees → one `branch`; optional `department`; self-join for manager hierarchy; linked to `online_user` (1:1)

---

### 5. `currency`
Supported currencies. The base currency (ETB) is enforced by a partial unique index.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `currency_id` | INT | PK, AUTO | Primary key |
| `currency_code` | VARCHAR(3) | UNIQUE, NOT NULL | ISO 4217 code (e.g. ETB, USD) |
| `currency_name` | VARCHAR(100) | NOT NULL | Full currency name |
| `symbol` | VARCHAR(10) | NOT NULL | Display symbol (e.g. Br, $) |
| `is_base` | BOOLEAN | DEFAULT false | Only one base currency allowed |
| `is_active` | BOOLEAN | DEFAULT true | Whether currency is in use |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |

**Relations:** One currency → many `account`, `exchange_rate`, `transaction`, `transaction_fee`, `standing_order`, `utility_payment`

---

### 6. `exchange_rate`
Historical exchange rates. Rates are never updated — only expired (immutable audit trail).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `rate_id` | INT | PK, AUTO | Primary key |
| `from_currency_id` | INT | FK → currency | Source currency |
| `to_currency_id` | INT | FK → currency | Target currency |
| `rate` | DECIMAL(20,8) | NOT NULL | Exchange rate value |
| `effective_date` | TIMESTAMPTZ | DEFAULT now() | When this rate became active |
| `expiry_date` | TIMESTAMPTZ | NULL | When this rate was retired (null = active) |
| `source` | VARCHAR(100) | DEFAULT 'NBE' | Rate source (National Bank of Ethiopia) |
| `created_by` | INT | FK → employee, NULL | Who created this rate |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |

---

### 7. `account_type`
Account product definitions (Savings, Current, Fixed Deposit, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `account_type_id` | INT | PK, AUTO | Primary key |
| `type_name` | VARCHAR(100) | UNIQUE, NOT NULL | Product name (e.g. Savings, Current) |
| `interest_rate` | DECIMAL(6,4) | DEFAULT 0.0000 | Annual interest rate (e.g. 0.0750 = 7.5%) |
| `minimum_balance` | DECIMAL(20,2) | DEFAULT 0.00 | Minimum required balance |
| `maximum_balance` | DECIMAL(20,2) | NULL | Maximum allowed balance (null = no limit) |
| `calc_method` | interest_calc_method | DEFAULT SIMPLE | Interest calculation method |
| `accrual_frequency` | INT | DEFAULT 30 | Days between interest accruals |
| `description` | TEXT | NULL | Product description |
| `is_active` | BOOLEAN | DEFAULT true | Whether this product is offered |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

---

### 8. `customer`
Retail and corporate customers. Supports INDIVIDUAL, CORPORATE, and JOINT types.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `customer_id` | INT | PK, AUTO | Primary key |
| `customer_code` | VARCHAR(20) | UNIQUE, NOT NULL | System-generated customer code |
| `customer_type` | customer_type | NOT NULL | INDIVIDUAL / CORPORATE / JOINT |
| `first_name` | VARCHAR(100) | NULL | Individual first name |
| `last_name` | VARCHAR(100) | NULL | Individual last name |
| `date_of_birth` | DATE | NULL | Date of birth (individuals) |
| `national_id` | VARCHAR(50) | UNIQUE, NULL | National ID number |
| `company_name` | VARCHAR(200) | NULL | Corporate entity name |
| `tax_id` | VARCHAR(50) | UNIQUE, NULL | Tax identification number |
| `incorporation_date` | DATE | NULL | Company incorporation date |
| `address` | TEXT | NOT NULL | Residential/business address |
| `city` | VARCHAR(100) | NOT NULL | City |
| `phone_number` | VARCHAR(20) | UNIQUE, NOT NULL | Primary contact number |
| `email` | VARCHAR(150) | UNIQUE, NULL | Email address |
| `kyc_status` | kyc_status | DEFAULT PENDING | KYC verification status |
| `risk_profile` | risk_profile | DEFAULT LOW | AML risk classification |
| `risk_score` | DECIMAL(5,2) | DEFAULT 0.00 | Computed risk score |
| `registration_date` | DATE | DEFAULT now() | Registration date |
| `relationship_manager_id` | INT | FK → employee, NULL | Assigned RM employee |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Relations:** One customer → many `customer_account`, `loan`, `loan_application`, `guarantor`, `beneficiary`, `utility_payment`, `dispute`; optional one `online_user`

---

### 9. `account`
Bank accounts. Linked to customers via `customer_account` (supports joint ownership).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `account_id` | INT | PK, AUTO | Primary key |
| `account_number` | VARCHAR(20) | UNIQUE, NOT NULL | Bank account number |
| `iban` | VARCHAR(34) | UNIQUE, NULL | IBAN (for international transfers) |
| `account_type_id` | INT | FK → account_type | Product type |
| `currency_id` | INT | FK → currency | Account currency |
| `balance` | DECIMAL(20,2) | DEFAULT 0.00 | Ledger balance |
| `available_balance` | DECIMAL(20,2) | DEFAULT 0.00 | Spendable balance (excl. holds) |
| `hold_amount` | DECIMAL(20,2) | DEFAULT 0.00 | Amount on hold |
| `open_date` | DATE | DEFAULT now() | Date account was opened |
| `close_date` | DATE | NULL | Date account was closed |
| `status` | account_status | DEFAULT ACTIVE | Account status |
| `branch_id` | INT | FK → branch | Home branch |
| `opened_by_employee_id` | INT | FK → employee, NULL | Teller who opened the account |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Relations:** One account → many `customer_account`, `transaction`, `card`, `standing_order`, `utility_payment`, `refund`, `interest_accrual`

---

### 10. `customer_account`
Junction table for the many-to-many relationship between customers and accounts (joint accounts).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `customer_id` | INT | PK (composite), FK → customer | Customer |
| `account_id` | INT | PK (composite), FK → account | Account |
| `ownership_percentage` | DECIMAL(5,2) | DEFAULT 100.00 | Share of ownership |
| `is_primary_owner` | BOOLEAN | DEFAULT true | Whether this customer is primary owner |
| `relationship_type` | ownership_relationship | DEFAULT SOLE_OWNER | Ownership type |
| `joined_date` | DATE | DEFAULT now() | Date customer joined the account |

**Primary Key:** `(customer_id, account_id)`

---

### 11. `online_user`
Authentication and authorization table for all system users (customers and employees).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | INT | PK, AUTO | Primary key |
| `username` | VARCHAR(100) | UNIQUE, NOT NULL | Login username |
| `password_hash` | TEXT | NOT NULL | Argon2id password hash |
| `salt` | VARCHAR(255) | NOT NULL | Password salt |
| `role` | user_role | NOT NULL | CUSTOMER / TELLER / SUPERVISOR / BRANCH_MANAGER / ADMIN |
| `linked_customer_id` | INT | UNIQUE FK → customer, NULL | Linked customer profile |
| `linked_employee_id` | INT | UNIQUE FK → employee, NULL | Linked employee profile |
| `last_login` | TIMESTAMPTZ | NULL | Timestamp of last successful login |
| `last_login_ip` | VARCHAR(45) | NULL | IP address of last login |
| `two_factor_enabled` | BOOLEAN | DEFAULT false | TOTP 2FA enabled |
| `two_factor_secret` | TEXT | NULL | TOTP shared secret (encrypted) |
| `account_locked` | BOOLEAN | DEFAULT false | Whether account is locked |
| `failed_login_attempts` | INT | DEFAULT 0 | Consecutive failed login count |
| `lockout_until` | TIMESTAMPTZ | NULL | Lockout expiry timestamp |
| `must_change_password` | BOOLEAN | DEFAULT true | Force password change on next login |
| `password_changed_at` | TIMESTAMPTZ | NULL | Timestamp of last password change |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Relations:** Optional 1:1 with `customer` or `employee`; one user → many `session`, `password_history`, `audit_log`, `notification`

---

### 12. `session`
Active authentication sessions (JWT-based). Supports force-invalidation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `session_id` | INT | PK, AUTO | Primary key |
| `user_id` | INT | FK → online_user | Session owner |
| `session_token` | VARCHAR(512) | UNIQUE, NOT NULL | Opaque session token |
| `ip_address` | VARCHAR(45) | NOT NULL | Client IP address |
| `user_agent` | TEXT | NULL | Browser/client user agent |
| `device_name` | VARCHAR(100) | NULL | Device identifier |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Session creation timestamp |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Session expiry timestamp |
| `last_active_at` | TIMESTAMPTZ | DEFAULT now() | Last activity timestamp |
| `is_active` | BOOLEAN | DEFAULT true | Whether session is valid (false = force-revoked) |

---

### 13. `password_history`
Prevents password reuse. Stores previous hashes per user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `history_id` | INT | PK, AUTO | Primary key |
| `user_id` | INT | FK → online_user | Account owner |
| `password_hash` | TEXT | NOT NULL | Previous Argon2id hash |
| `changed_at` | TIMESTAMPTZ | DEFAULT now() | Timestamp of change |

---

### 14. `transaction`
Central financial ledger. All monetary movements are recorded here. **Records are immutable** — no UPDATE or DELETE allowed at DB level.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `transaction_id` | INT | PK, AUTO | Primary key |
| `reference_number` | VARCHAR(50) | UNIQUE, NOT NULL | Human-readable reference (e.g. TXN-20260604-XXXX) |
| `transaction_type` | transaction_type | NOT NULL | Type of transaction |
| `channel` | transaction_channel | DEFAULT BRANCH | Processing channel |
| `amount` | DECIMAL(20,2) | NOT NULL | Transaction amount |
| `currency_id` | INT | FK → currency | Transaction currency |
| `exchange_rate_applied` | DECIMAL(20,8) | NULL | FX rate used (if applicable) |
| `settled_amount` | DECIMAL(20,2) | NULL | Amount in settlement currency |
| `settled_currency_id` | INT | FK → currency, NULL | Settlement currency |
| `account_id` | INT | FK → account | Source / debit account |
| `to_account_id` | INT | FK → account, NULL | Destination account (internal transfers) |
| `to_bank_code` | VARCHAR(20) | NULL | Destination bank code (interbank) |
| `to_iban` | VARCHAR(34) | NULL | Destination IBAN (interbank) |
| `to_account_name` | VARCHAR(200) | NULL | Beneficiary name (interbank) |
| `reversed_by_transaction_id` | INT | UNIQUE, NULL | ID of the reversing transaction |
| `description` | TEXT | NULL | Free-text description |
| `transaction_date` | TIMESTAMPTZ | DEFAULT now() | Transaction timestamp |
| `value_date` | DATE | DEFAULT now() | Effective / value date |
| `status` | transaction_status | DEFAULT PENDING | Processing status |
| `failure_reason` | TEXT | NULL | Reason if failed |
| `processed_by_employee_id` | INT | FK → employee, NULL | Teller/employee who processed it |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |

**Relations:** One transaction → optional `transaction_fee[]`, `loan_payment`, `utility_payment`, `refund`, `card_transaction`, `atm_transaction`, `interest_accrual[]`, `dispute[]`

---

### 15. `transaction_fee`
Fee charges applied to transactions (linked to charge schedules).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `fee_id` | INT | PK, AUTO | Primary key |
| `transaction_id` | INT | FK → transaction | Parent transaction |
| `fee_type` | fee_type | NOT NULL | SERVICE_CHARGE / VAT / STAMP_DUTY / etc. |
| `fee_amount` | DECIMAL(20,2) | NOT NULL | Fee amount charged |
| `currency_id` | INT | FK → currency | Fee currency |
| `schedule_id` | INT | FK → charge_schedule, NULL | Applied charge rule |
| `charged_at` | TIMESTAMPTZ | DEFAULT now() | When fee was applied |

---

### 16. `interest_accrual`
Daily/periodic interest accrual ledger for savings and other interest-bearing accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `accrual_id` | INT | PK, AUTO | Primary key |
| `account_id` | INT | FK → account | Account earning interest |
| `accrued_amount` | DECIMAL(20,6) | NOT NULL | Accrued interest amount |
| `accrual_date` | DATE | NOT NULL | Date of accrual |
| `period_start` | DATE | NOT NULL | Accrual period start |
| `period_end` | DATE | NOT NULL | Accrual period end |
| `rate_applied` | DECIMAL(6,4) | NOT NULL | Interest rate used |
| `is_posted` | BOOLEAN | DEFAULT false | Whether credited to account |
| `posted_at` | TIMESTAMPTZ | NULL | When it was posted |
| `transaction_id` | INT | FK → transaction, NULL | Posting transaction |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |

---

### 17. `loan_application`
Customer loan applications before disbursement. Supervisor reviews → Branch Manager disburses.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `application_id` | INT | PK, AUTO | Primary key |
| `application_number` | VARCHAR(30) | UNIQUE, NOT NULL | Application reference number |
| `customer_id` | INT | FK → customer | Applicant |
| `loan_type` | loan_type | NOT NULL | PERSONAL / HOME / AUTO / CORPORATE / etc. |
| `requested_amount` | DECIMAL(20,2) | NOT NULL | Requested loan amount |
| `requested_term_months` | INT | NOT NULL | Requested repayment period in months |
| `purpose` | TEXT | NOT NULL | Purpose of the loan |
| `status` | application_status | DEFAULT SUBMITTED | Current status |
| `submitted_at` | TIMESTAMPTZ | DEFAULT now() | Application submission timestamp |
| `reviewed_by_id` | INT | FK → employee, NULL | Supervisor who reviewed |
| `reviewed_at` | TIMESTAMPTZ | NULL | Review timestamp |
| `rejection_reason` | TEXT | NULL | Required when status = REJECTED |
| `notes` | TEXT | NULL | Internal review notes |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

---

### 18. `loan`
Active loan records. Created by Branch Manager after application approval. EMI schedule auto-generated on disbursement.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `loan_id` | INT | PK, AUTO | Primary key |
| `loan_number` | VARCHAR(30) | UNIQUE, NOT NULL | Loan reference number |
| `application_id` | INT | UNIQUE FK → loan_application, NULL | Source application |
| `customer_id` | INT | FK → customer | Borrower |
| `loan_type` | loan_type | NOT NULL | Loan category |
| `principal_amount` | DECIMAL(20,2) | NOT NULL | Original disbursed amount |
| `outstanding_balance` | DECIMAL(20,2) | NOT NULL | Remaining balance |
| `interest_rate` | DECIMAL(6,4) | NOT NULL | Annual interest rate (e.g. 0.12 = 12%) |
| `interest_rate_type` | interest_rate_type | DEFAULT FIXED | Fixed or variable rate |
| `penalty_rate` | DECIMAL(6,4) | DEFAULT 0.0200 | Penalty rate for overdue payments |
| `term_months` | INT | NOT NULL | Total repayment term in months |
| `start_date` | DATE | NOT NULL | Loan start date |
| `maturity_date` | DATE | NOT NULL | Loan maturity date |
| `disbursement_date` | DATE | NULL | Actual disbursement date |
| `status` | loan_status | DEFAULT PENDING_DISBURSEMENT | Loan lifecycle status |
| `purpose` | TEXT | NULL | Loan purpose |
| `disbursement_account_id` | INT | FK → account, NULL | Account funds were disbursed into |
| `approved_by_id` | INT | FK → employee, NULL | Supervisor who approved |
| `disbursed_by_id` | INT | FK → employee, NULL | Branch Manager who disbursed |
| `disbursement_transaction_id` | INT | UNIQUE FK → transaction, NULL | Disbursement transaction |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

---

### 19. `collateral`
Physical or financial assets pledged as loan security.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `collateral_id` | INT | PK, AUTO | Primary key |
| `loan_id` | INT | FK → loan | Secured loan |
| `collateral_type` | collateral_type | NOT NULL | PROPERTY / VEHICLE / GOLD / etc. |
| `description` | TEXT | NOT NULL | Asset description |
| `estimated_value` | DECIMAL(20,2) | NOT NULL | Market value |
| `forced_sale_value` | DECIMAL(20,2) | NOT NULL | Liquidation value |
| `valuation_date` | DATE | NOT NULL | Date of last valuation |
| `owner_name` | VARCHAR(200) | NOT NULL | Legal owner of the asset |
| `document_reference` | VARCHAR(100) | NULL | Title deed / registration number |
| `status` | collateral_status | DEFAULT ACTIVE | ACTIVE / RELEASED / SEIZED |
| `valued_by_id` | INT | FK → employee, NULL | Appraiser employee |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

---

### 20. `collateral_revaluation`
Tracks changes in collateral value over time.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `revaluation_id` | INT | PK, AUTO | Primary key |
| `collateral_id` | INT | FK → collateral | Asset being revalued |
| `previous_value` | DECIMAL(20,2) | NOT NULL | Previous assessed value |
| `new_value` | DECIMAL(20,2) | NOT NULL | Updated assessed value |
| `revaluation_date` | DATE | NOT NULL | Date of revaluation |
| `revalued_by_id` | INT | FK → employee, NULL | Employee who performed revaluation |
| `notes` | TEXT | NULL | Revaluation notes |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |

---

### 21. `repayment_schedule`
EMI installment schedule auto-generated on loan disbursement. Unique per (loan_id, installment_number).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `repayment_id` | INT | PK, AUTO | Primary key |
| `loan_id` | INT | FK → loan | Parent loan |
| `installment_number` | INT | NOT NULL | Installment sequence number (1, 2, …n) |
| `due_date` | DATE | NOT NULL | Payment due date |
| `principal_due` | DECIMAL(20,2) | NOT NULL | Principal component of EMI |
| `interest_due` | DECIMAL(20,2) | NOT NULL | Interest component of EMI |
| `total_due` | DECIMAL(20,2) | NOT NULL | Total EMI amount |
| `principal_paid` | DECIMAL(20,2) | DEFAULT 0.00 | Principal paid so far |
| `interest_paid` | DECIMAL(20,2) | DEFAULT 0.00 | Interest paid so far |
| `penalty_paid` | DECIMAL(20,2) | DEFAULT 0.00 | Penalty paid so far |
| `payment_date` | DATE | NULL | Actual payment date |
| `status` | repayment_status | DEFAULT PENDING | Payment status |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Unique constraint:** `(loan_id, installment_number)`

---

### 22. `loan_payment`
Individual loan payment transactions linked to installment schedules.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `payment_id` | INT | PK, AUTO | Primary key |
| `loan_id` | INT | FK → loan | Parent loan |
| `repayment_id` | INT | FK → repayment_schedule | Installment being paid |
| `transaction_id` | INT | UNIQUE FK → transaction, NULL | Payment transaction |
| `amount` | DECIMAL(20,2) | NOT NULL | Total payment amount |
| `principal_portion` | DECIMAL(20,2) | DEFAULT 0.00 | Amount applied to principal |
| `interest_portion` | DECIMAL(20,2) | DEFAULT 0.00 | Amount applied to interest |
| `penalty_portion` | DECIMAL(20,2) | DEFAULT 0.00 | Amount applied to penalty |
| `payment_date` | TIMESTAMPTZ | DEFAULT now() | Payment timestamp |
| `payment_mode` | payment_mode | DEFAULT ACCOUNT_DEBIT | ACCOUNT_DEBIT / CASH / CHEQUE / STANDING_ORDER |
| `processed_by_id` | INT | FK → employee, NULL | Processing employee |
| `notes` | TEXT | NULL | Payment notes |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |

---

### 23. `guarantor`
Customers who guarantee a loan. Unique per (loan_id, customer_id).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `guarantor_id` | INT | PK, AUTO | Primary key |
| `loan_id` | INT | FK → loan | Guaranteed loan |
| `customer_id` | INT | FK → customer | Guarantor customer |
| `guarantor_type` | guarantor_type | DEFAULT PERSONAL | PERSONAL / CORPORATE / GOVERNMENT |
| `guaranteed_amount` | DECIMAL(20,2) | NOT NULL | Amount being guaranteed |
| `signed_date` | DATE | NOT NULL | Date guarantee was signed |
| `status` | guarantor_status | DEFAULT ACTIVE | ACTIVE / RELEASED / CALLED |
| `notes` | TEXT | NULL | Additional notes |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Unique constraint:** `(loan_id, customer_id)`

---

### 24. `card`
Debit, credit, and prepaid cards linked to accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `card_id` | INT | PK, AUTO | Primary key |
| `card_number` | VARCHAR(19) | UNIQUE, NOT NULL | Full card number (stored encrypted) |
| `masked_number` | VARCHAR(19) | NOT NULL | Masked display number (e.g. **** **** **** 1234) |
| `card_type` | card_type | NOT NULL | DEBIT / CREDIT / PREPAID |
| `card_network` | card_network | NOT NULL | VISA / MASTERCARD / AMEX / UNIONPAY / LOCAL |
| `expiry_date` | DATE | NOT NULL | Card expiry date |
| `cvv_hash` | TEXT | NOT NULL | Hashed CVV |
| `pin_hash` | TEXT | NULL | Hashed PIN |
| `status` | card_status | DEFAULT ACTIVE | ACTIVE / FROZEN / BLOCKED / EXPIRED / CANCELLED |
| `daily_limit` | DECIMAL(20,2) | DEFAULT 10000.00 | Daily spending limit |
| `monthly_limit` | DECIMAL(20,2) | DEFAULT 100000.00 | Monthly spending limit |
| `current_month_spend` | DECIMAL(20,2) | DEFAULT 0.00 | Month-to-date spending |
| `account_id` | INT | FK → account | Linked account |
| `issued_by_branch_id` | INT | FK → branch | Issuing branch |
| `issued_date` | DATE | DEFAULT now() | Card issuance date |
| `blocked_date` | DATE | NULL | Date card was blocked |
| `blocked_by_id` | INT | FK → employee, NULL | Employee who blocked the card |
| `block_reason` | TEXT | NULL | Documented block reason (required by policy) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

---

### 25. `card_transaction`
Extension table for card-specific transaction metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `card_txn_id` | INT | PK, AUTO | Primary key |
| `card_id` | INT | FK → card | Used card |
| `transaction_id` | INT | UNIQUE FK → transaction | Parent transaction |
| `merchant_name` | VARCHAR(200) | NULL | Merchant name |
| `merchant_category` | VARCHAR(100) | NULL | MCC / merchant category |
| `merchant_country` | VARCHAR(3) | DEFAULT 'ETH' | Merchant country ISO code |
| `auth_code` | VARCHAR(20) | NULL | Authorization code |
| `is_online` | BOOLEAN | DEFAULT false | Whether card-not-present |
| `is_international` | BOOLEAN | DEFAULT false | Whether cross-border |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |

---

### 26. `beneficiary`
Saved payment beneficiaries for customers. Unique per (customer_id, account_number_or_iban).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `beneficiary_id` | INT | PK, AUTO | Primary key |
| `customer_id` | INT | FK → customer | Owning customer |
| `beneficiary_name` | VARCHAR(200) | NOT NULL | Recipient name |
| `account_number_or_iban` | VARCHAR(34) | NOT NULL | Target account / IBAN |
| `bank_name` | VARCHAR(200) | NULL | Recipient bank name |
| `bank_code` | VARCHAR(20) | NULL | Recipient bank code |
| `swift_code` | VARCHAR(11) | NULL | SWIFT code for international |
| `relationship` | VARCHAR(100) | NULL | Relationship to customer |
| `is_verified` | BOOLEAN | DEFAULT false | Whether account has been verified |
| `is_active` | BOOLEAN | DEFAULT true | Whether beneficiary is active |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Unique constraint:** `(customer_id, account_number_or_iban)`

---

### 27. `standing_order`
Recurring automated payment instructions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `order_id` | INT | PK, AUTO | Primary key |
| `account_id` | INT | FK → account | Debit account |
| `beneficiary_id` | INT | FK → beneficiary | Payment recipient |
| `currency_id` | INT | FK → currency | Payment currency |
| `amount` | DECIMAL(20,2) | NOT NULL | Transfer amount |
| `frequency` | order_frequency | NOT NULL | WEEKLY / BIWEEKLY / MONTHLY / QUARTERLY / ANNUALLY |
| `start_date` | DATE | NOT NULL | First execution date |
| `end_date` | DATE | NULL | Last execution date (null = indefinite) |
| `next_execution_date` | DATE | NOT NULL | Next scheduled execution |
| `last_execution_date` | DATE | NULL | Last successful execution |
| `status` | order_status | DEFAULT ACTIVE | ACTIVE / PAUSED / CANCELLED / COMPLETED |
| `description` | TEXT | NULL | Order description |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

---

### 28. `atm`
ATM machines across all branches with cash management data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `atm_id` | INT | PK, AUTO | Primary key |
| `atm_code` | VARCHAR(20) | UNIQUE, NOT NULL | ATM identifier code |
| `location` | TEXT | NOT NULL | Physical location description |
| `latitude` | DECIMAL(9,6) | NULL | GPS latitude |
| `longitude` | DECIMAL(9,6) | NULL | GPS longitude |
| `branch_id` | INT | FK → branch | Owning branch |
| `status` | atm_status | DEFAULT ONLINE | Operational status |
| `cash_balance` | DECIMAL(20,2) | DEFAULT 0.00 | Current cash level |
| `low_cash_threshold` | DECIMAL(20,2) | DEFAULT 50000.00 | Threshold for LOW_CASH alert |
| `last_refill_date` | TIMESTAMPTZ | NULL | When cash was last added |
| `last_refill_by_id` | INT | FK → employee, NULL | Employee who refilled |
| `last_maintenance_date` | TIMESTAMPTZ | NULL | Last maintenance timestamp |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

---

### 29. `atm_transaction`
Extension table for ATM-specific transaction metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `atm_txn_id` | INT | PK, AUTO | Primary key |
| `atm_id` | INT | FK → atm | ATM used |
| `transaction_id` | INT | UNIQUE FK → transaction | Parent transaction |
| `card_number_used` | VARCHAR(19) | NULL | Masked card number used |
| `transaction_type` | VARCHAR(50) | NULL | Withdrawal / Balance Enquiry / etc. |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |

---

### 30. `utility_payment`
Utility bill payments (electricity, water, telecom, taxes, school fees, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `payment_id` | INT | PK, AUTO | Primary key |
| `account_id` | INT | FK → account | Debit account |
| `customer_id` | INT | FK → customer | Paying customer |
| `transaction_id` | INT | UNIQUE FK → transaction, NULL | Linked transaction |
| `utility_type` | utility_type | NOT NULL | ELECTRICITY / WATER / TELECOM / INTERNET / TAX / INSURANCE / SCHOOL_FEE / OTHER |
| `provider_name` | VARCHAR(200) | NOT NULL | Utility provider (e.g. EEU, AAWSA) |
| `provider_code` | VARCHAR(50) | NULL | Provider system code |
| `provider_account_number` | VARCHAR(100) | NOT NULL | Customer's utility account number |
| `subscriber_name` | VARCHAR(200) | NULL | Subscriber name on utility account |
| `amount` | DECIMAL(20,2) | NOT NULL | Payment amount |
| `currency_id` | INT | FK → currency | Payment currency |
| `payment_date` | TIMESTAMPTZ | DEFAULT now() | Payment timestamp |
| `reference_number` | VARCHAR(100) | UNIQUE, NOT NULL | Internal reference |
| `provider_reference` | VARCHAR(100) | NULL | Provider confirmation number |
| `status` | utility_status | DEFAULT PENDING | PENDING / COMPLETED / FAILED / REVERSED |
| `failure_reason` | TEXT | NULL | Reason if failed |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |

---

### 31. `refund`
Refund requests initiated by Tellers/Customers. Requires Supervisor approval (four-eyes principle).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `refund_id` | INT | PK, AUTO | Primary key |
| `original_transaction_id` | INT | FK → transaction | Transaction being refunded |
| `account_id` | INT | FK → account | Account to credit |
| `amount` | DECIMAL(20,2) | NOT NULL | Refund amount |
| `reason` | TEXT | NOT NULL | Reason for refund |
| `status` | refund_status | DEFAULT PENDING_APPROVAL | PENDING_APPROVAL / APPROVED / PROCESSED / REJECTED |
| `requested_by_id` | INT | FK → employee, NULL | Requester (Teller) |
| `approved_by_id` | INT | FK → employee, NULL | Approver (must differ from requester) |
| `approved_at` | TIMESTAMPTZ | NULL | Approval timestamp |
| `processed_transaction_id` | INT | UNIQUE FK → transaction, NULL | Credit transaction created on approval |
| `rejection_reason` | TEXT | NULL | Reason if rejected |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

---

### 32. `charge_schedule`
Fee rules for transaction types. Historical rules preserved — setting expiry_date retires a rule.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `schedule_id` | INT | PK, AUTO | Primary key |
| `charge_name` | VARCHAR(150) | NOT NULL | Rule name |
| `charge_type` | charge_type | NOT NULL | FLAT / PERCENTAGE |
| `applicable_to` | charge_applicable_to | NOT NULL | Transaction type this fee applies to |
| `flat_amount` | DECIMAL(20,2) | DEFAULT 0.00 | Fixed fee amount (FLAT type) |
| `percentage_rate` | DECIMAL(6,4) | DEFAULT 0.0000 | Percentage rate (PERCENTAGE type) |
| `min_charge` | DECIMAL(20,2) | DEFAULT 0.00 | Minimum fee cap |
| `max_charge` | DECIMAL(20,2) | NULL | Maximum fee cap (null = no limit) |
| `effective_date` | DATE | NOT NULL | When rule becomes active |
| `expiry_date` | DATE | NULL | When rule expires (null = active) |
| `is_active` | BOOLEAN | DEFAULT true | Whether rule is in effect |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

---

### 33. `notification`
System notifications delivered to users via multiple channels.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `notification_id` | INT | PK, AUTO | Primary key |
| `user_id` | INT | FK → online_user | Recipient user |
| `channel` | notification_channel | NOT NULL | SMS / EMAIL / IN_APP / PUSH |
| `notification_type` | notification_type | NOT NULL | TRANSACTION_ALERT / LOGIN_ALERT / LOAN_REMINDER / CARD_ALERT / OTP / ACCOUNT_ALERT / SYSTEM |
| `subject` | VARCHAR(255) | NULL | Notification subject |
| `body` | TEXT | NOT NULL | Notification body content |
| `is_sent` | BOOLEAN | DEFAULT false | Delivery status |
| `sent_at` | TIMESTAMPTZ | NULL | Delivery timestamp |
| `is_read` | BOOLEAN | DEFAULT false | Whether user has read it |
| `read_at` | TIMESTAMPTZ | NULL | Read timestamp |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |

---

### 34. `audit_log`
Immutable system audit trail. **Append-only — DB-level trigger prevents UPDATE/DELETE even by ADMIN.**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `log_id` | INT | PK, AUTO | Primary key |
| `action_type` | audit_action | NOT NULL | Type of action logged |
| `entity_type` | VARCHAR(100) | NOT NULL | Affected entity name (e.g. 'account', 'loan') |
| `entity_id` | INT | NULL | ID of affected entity |
| `performed_by_user_id` | INT | FK → online_user, NULL | User who performed the action |
| `old_values` | JSON | NULL | Previous state (for UPDATE actions) |
| `new_values` | JSON | NULL | New state |
| `ip_address` | VARCHAR(45) | NULL | Request IP address |
| `user_agent` | TEXT | NULL | Client user agent |
| `details` | TEXT | NULL | Human-readable action description |
| `is_suspicious` | BOOLEAN | DEFAULT false | Flagged for security review |
| `timestamp` | TIMESTAMPTZ | DEFAULT now() | Event timestamp |

---

### 35. `teller_drawer`
Cash drawer sessions for Teller employees. Tracks opening/closing balances per shift.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `drawer_id` | INT | PK, AUTO | Primary key |
| `employee_id` | INT | FK → employee | Teller who owns this drawer |
| `branch_id` | INT | FK → branch | Branch where drawer is located |
| `status` | teller_drawer_status | DEFAULT CLOSED | OPEN / CLOSED / BALANCING |
| `opening_balance` | DECIMAL(20,2) | DEFAULT 0.00 | Cash at start of shift |
| `current_balance` | DECIMAL(20,2) | DEFAULT 0.00 | Current cash in drawer |
| `opened_at` | TIMESTAMPTZ | NULL | Shift start timestamp |
| `closed_at` | TIMESTAMPTZ | NULL | Shift end timestamp |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

---

### 36. `dispute`
Customer disputes over transactions. Handled by Supervisors and Branch Managers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `dispute_id` | INT | PK, AUTO | Primary key |
| `customer_id` | INT | FK → customer | Disputing customer |
| `transaction_id` | INT | FK → transaction | Disputed transaction |
| `status` | dispute_status | DEFAULT OPEN | OPEN / UNDER_REVIEW / ESCALATED / RESOLVED / REJECTED |
| `description` | TEXT | NOT NULL | Dispute description |
| `remarks` | JSON | NULL | Resolution notes (JSON for multi-step history) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

---

## Entity Relationships Summary

```
bank ──────────────── branch (1:N)
branch ────────────── department (1:N)
branch ────────────── employee (1:N)
branch ────────────── account (1:N)
branch ────────────── atm (1:N)
branch ────────────── teller_drawer (1:N)
branch ────────────── branch (self, hierarchy)
department ────────── employee (1:N, manager 1:1)
employee ──────────── online_user (1:1)
employee ──────────── employee (self, manager)
customer ──────────── online_user (1:1)
customer ──────────── customer_account (1:N)
account ───────────── customer_account (1:N)
customer_account ──── [customer × account] (M:N junction)
account_type ──────── account (1:N)
currency ──────────── account, transaction, exchange_rate (1:N)
transaction ───────── transaction_fee (1:N)
transaction ───────── card_transaction (1:1)
transaction ───────── atm_transaction (1:1)
transaction ───────── loan_payment (1:1)
transaction ───────── utility_payment (1:1)
transaction ───────── refund (1:N, original + processed)
transaction ───────── interest_accrual (1:N)
transaction ───────── dispute (1:N)
loan_application ──── loan (1:1)
loan ──────────────── collateral (1:N)
loan ──────────────── repayment_schedule (1:N)
loan ──────────────── loan_payment (1:N)
loan ──────────────── guarantor (1:N)
repayment_schedule ── loan_payment (1:N)
customer ──────────── beneficiary (1:N)
beneficiary ───────── standing_order (1:N)
card ──────────────── card_transaction (1:N)
charge_schedule ───── transaction_fee (1:N)
online_user ───────── session, notification, audit_log (1:N)
```

---

## Role Permissions Summary

| Permission | CUSTOMER | TELLER | SUPERVISOR | BRANCH_MANAGER | ADMIN |
|-----------|----------|--------|------------|----------------|-------|
| View own accounts/transactions | ✓ | — | — | — | — |
| Apply for loans | ✓ | — | — | — | — |
| Transfers / Beneficiaries | ✓ | — | — | — | — |
| Utility Payments | ✓ | ✓ | ✓ | ✓ | ✓ |
| Deposit / Withdrawal (teller) | — | ✓ | ✓ | ✓ | ✓ |
| Open accounts / Register customers | — | ✓ | ✓ | ✓ | ✓ |
| Issue cards | — | ✓ | ✓ | ✓ | ✓ |
| Transaction lookup | — | ✓ | ✓ | ✓ | ✓ |
| KYC updates | — | — | ✓ | ✓ | ✓ |
| Account freeze/unfreeze | — | — | ✓ | ✓ | ✓ |
| Loan review (approve/reject) | — | — | ✓ | ✓ | ✓ |
| Refund approval (four-eyes) | — | — | ✓ | ✓ | ✓ |
| Card blocking | — | — | ✓ | ✓ | ✓ |
| Withdrawal override | — | — | ✓ | ✓ | ✓ |
| Loan disbursement | — | — | — | ✓ | ✓ |
| Transaction & loan statistics | — | — | — | ✓ | ✓ |
| Employee roster (read) | — | — | — | ✓ | ✓ |
| Audit log access | — | — | — | ✓ | ✓ |
| Exchange rates (read) | — | — | — | ✓ | ✓ |
| Charge schedules (read) | — | — | — | ✓ | ✓ |
| ATM management (read) | — | — | ✓ | ✓ | ✓ |
| Exchange rates (write) | — | — | — | — | ✓ |
| Charge schedules (write) | — | — | — | — | ✓ |
| User account management | — | — | — | — | ✓ |
| Employee management (write) | — | — | — | — | ✓ |
| Branch & department config | — | — | — | — | ✓ |
| Currency management | — | — | — | — | ✓ |
| Account type config | — | — | — | — | ✓ |
| Session management / Security | — | — | — | — | ✓ |
| Suspicious activity investigation | — | — | — | — | ✓ |
| System-wide reports | — | — | — | — | ✓ |

---

*Generated from `backend/prisma/schema.prisma` — AASTU Bank Management System*
