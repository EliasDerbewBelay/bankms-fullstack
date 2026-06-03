--
-- PostgreSQL database dump
--

\restrict A6pVHz9h32MFQNv5yapTK8WeoebQIRuQNxvDf6WxcAtiftglLvzYhjd8YgitE84

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: account_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.account_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'FROZEN',
    'CLOSED',
    'DORMANT'
);


ALTER TYPE public.account_status OWNER TO postgres;

--
-- Name: application_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.application_status AS ENUM (
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
    'DISBURSED'
);


ALTER TYPE public.application_status OWNER TO postgres;

--
-- Name: atm_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.atm_status AS ENUM (
    'ONLINE',
    'OFFLINE',
    'LOW_CASH',
    'OUT_OF_CASH',
    'UNDER_MAINTENANCE'
);


ALTER TYPE public.atm_status OWNER TO postgres;

--
-- Name: audit_action; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.audit_action AS ENUM (
    'LOGIN',
    'LOGOUT',
    'FAILED_LOGIN',
    'CREATE',
    'UPDATE',
    'DELETE',
    'TRANSACTION',
    'LOAN_APPROVAL',
    'CARD_BLOCK',
    'PASSWORD_CHANGE',
    'REFUND_APPROVAL',
    'ACCOUNT_FREEZE',
    'EXPORT',
    'CONFIG_CHANGE'
);


ALTER TYPE public.audit_action OWNER TO postgres;

--
-- Name: branch_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.branch_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'TEMPORARILY_CLOSED',
    'UNDER_RENOVATION'
);


ALTER TYPE public.branch_status OWNER TO postgres;

--
-- Name: card_network; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.card_network AS ENUM (
    'VISA',
    'MASTERCARD',
    'AMEX',
    'UNIONPAY',
    'LOCAL'
);


ALTER TYPE public.card_network OWNER TO postgres;

--
-- Name: card_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.card_status AS ENUM (
    'ACTIVE',
    'FROZEN',
    'BLOCKED',
    'EXPIRED',
    'CANCELLED'
);


ALTER TYPE public.card_status OWNER TO postgres;

--
-- Name: card_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.card_type AS ENUM (
    'DEBIT',
    'CREDIT',
    'PREPAID'
);


ALTER TYPE public.card_type OWNER TO postgres;

--
-- Name: charge_applicable_to; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.charge_applicable_to AS ENUM (
    'DEPOSIT',
    'WITHDRAWAL',
    'INTERNAL_TRANSFER',
    'INTERBANK_TRANSFER',
    'CARD_PAYMENT',
    'UTILITY_PAYMENT',
    'FX_CONVERSION',
    'LOAN_PROCESSING'
);


ALTER TYPE public.charge_applicable_to OWNER TO postgres;

--
-- Name: charge_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.charge_type AS ENUM (
    'FLAT',
    'PERCENTAGE'
);


ALTER TYPE public.charge_type OWNER TO postgres;

--
-- Name: collateral_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.collateral_status AS ENUM (
    'ACTIVE',
    'RELEASED',
    'SEIZED'
);


ALTER TYPE public.collateral_status OWNER TO postgres;

--
-- Name: collateral_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.collateral_type AS ENUM (
    'PROPERTY',
    'VEHICLE',
    'GOLD',
    'SHARES',
    'FIXED_DEPOSIT',
    'MACHINERY',
    'OTHER'
);


ALTER TYPE public.collateral_type OWNER TO postgres;

--
-- Name: customer_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.customer_type AS ENUM (
    'INDIVIDUAL',
    'CORPORATE',
    'JOINT'
);


ALTER TYPE public.customer_type OWNER TO postgres;

--
-- Name: employee_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.employee_type AS ENUM (
    'FULL_TIME',
    'PART_TIME',
    'CONTRACT',
    'INTERN'
);


ALTER TYPE public.employee_type OWNER TO postgres;

--
-- Name: fee_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.fee_type AS ENUM (
    'SERVICE_CHARGE',
    'VAT',
    'STAMP_DUTY',
    'FX_SPREAD',
    'PROCESSING_FEE',
    'PENALTY'
);


ALTER TYPE public.fee_type OWNER TO postgres;

--
-- Name: guarantor_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.guarantor_status AS ENUM (
    'ACTIVE',
    'RELEASED',
    'CALLED'
);


ALTER TYPE public.guarantor_status OWNER TO postgres;

--
-- Name: guarantor_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.guarantor_type AS ENUM (
    'PERSONAL',
    'CORPORATE',
    'GOVERNMENT'
);


ALTER TYPE public.guarantor_type OWNER TO postgres;

--
-- Name: interest_calc_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.interest_calc_method AS ENUM (
    'SIMPLE',
    'COMPOUND_DAILY',
    'COMPOUND_MONTHLY'
);


ALTER TYPE public.interest_calc_method OWNER TO postgres;

--
-- Name: interest_rate_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.interest_rate_type AS ENUM (
    'FIXED',
    'VARIABLE'
);


ALTER TYPE public.interest_rate_type OWNER TO postgres;

--
-- Name: kyc_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.kyc_status AS ENUM (
    'PENDING',
    'UNDER_REVIEW',
    'VERIFIED',
    'REJECTED',
    'EXPIRED'
);


ALTER TYPE public.kyc_status OWNER TO postgres;

--
-- Name: loan_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.loan_status AS ENUM (
    'PENDING_DISBURSEMENT',
    'ACTIVE',
    'REPAID',
    'DEFAULTED',
    'WRITTEN_OFF',
    'RESTRUCTURED'
);


ALTER TYPE public.loan_status OWNER TO postgres;

--
-- Name: loan_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.loan_type AS ENUM (
    'PERSONAL',
    'HOME',
    'AUTO',
    'CORPORATE',
    'EDUCATION',
    'AGRICULTURE',
    'EMERGENCY'
);


ALTER TYPE public.loan_type OWNER TO postgres;

--
-- Name: notification_channel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_channel AS ENUM (
    'SMS',
    'EMAIL',
    'IN_APP',
    'PUSH'
);


ALTER TYPE public.notification_channel OWNER TO postgres;

--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type AS ENUM (
    'TRANSACTION_ALERT',
    'LOGIN_ALERT',
    'LOAN_REMINDER',
    'CARD_ALERT',
    'OTP',
    'ACCOUNT_ALERT',
    'SYSTEM'
);


ALTER TYPE public.notification_type OWNER TO postgres;

--
-- Name: order_frequency; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_frequency AS ENUM (
    'WEEKLY',
    'BIWEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'ANNUALLY'
);


ALTER TYPE public.order_frequency OWNER TO postgres;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status AS ENUM (
    'ACTIVE',
    'PAUSED',
    'CANCELLED',
    'COMPLETED'
);


ALTER TYPE public.order_status OWNER TO postgres;

--
-- Name: ownership_relationship; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ownership_relationship AS ENUM (
    'SOLE_OWNER',
    'JOINT_OWNER',
    'AUTHORIZED_SIGNATORY',
    'TRUSTEE',
    'GUARDIAN'
);


ALTER TYPE public.ownership_relationship OWNER TO postgres;

--
-- Name: payment_mode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_mode AS ENUM (
    'ACCOUNT_DEBIT',
    'CASH',
    'CHEQUE',
    'STANDING_ORDER'
);


ALTER TYPE public.payment_mode OWNER TO postgres;

--
-- Name: refund_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.refund_status AS ENUM (
    'PENDING_APPROVAL',
    'APPROVED',
    'PROCESSED',
    'REJECTED'
);


ALTER TYPE public.refund_status OWNER TO postgres;

--
-- Name: repayment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.repayment_status AS ENUM (
    'PENDING',
    'PAID',
    'PARTIALLY_PAID',
    'OVERDUE',
    'WAIVED'
);


ALTER TYPE public.repayment_status OWNER TO postgres;

--
-- Name: risk_profile; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.risk_profile AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'BLACKLISTED'
);


ALTER TYPE public.risk_profile OWNER TO postgres;

--
-- Name: transaction_channel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.transaction_channel AS ENUM (
    'BRANCH',
    'ATM',
    'MOBILE',
    'INTERNET',
    'POS',
    'SYSTEM'
);


ALTER TYPE public.transaction_channel OWNER TO postgres;

--
-- Name: transaction_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.transaction_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'REVERSED',
    'REFUNDED'
);


ALTER TYPE public.transaction_status OWNER TO postgres;

--
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.transaction_type AS ENUM (
    'DEPOSIT',
    'WITHDRAWAL',
    'INTERNAL_TRANSFER',
    'INTERBANK_TRANSFER',
    'CARD_PAYMENT',
    'UTILITY_PAYMENT',
    'FX_CONVERSION',
    'LOAN_DISBURSEMENT',
    'LOAN_REPAYMENT',
    'INTEREST_CREDIT',
    'FEE_CHARGE',
    'REFUND',
    'REVERSAL'
);


ALTER TYPE public.transaction_type OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'CUSTOMER',
    'TELLER',
    'SUPERVISOR',
    'BRANCH_MANAGER',
    'ADMIN'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: utility_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.utility_status AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REVERSED'
);


ALTER TYPE public.utility_status OWNER TO postgres;

--
-- Name: utility_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.utility_type AS ENUM (
    'ELECTRICITY',
    'WATER',
    'TELECOM',
    'INTERNET',
    'TAX',
    'INSURANCE',
    'SCHOOL_FEE',
    'OTHER'
);


ALTER TYPE public.utility_type OWNER TO postgres;

--
-- Name: fn_audit_log_immutable(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_audit_log_immutable() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION
        'audit_log is append-only. UPDATE and DELETE are not permitted.';
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.fn_audit_log_immutable() OWNER TO postgres;

--
-- Name: fn_check_guarantor_not_borrower(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_check_guarantor_not_borrower() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_borrower_id INTEGER;
BEGIN
    -- Get the borrower's customer_id from the loan table
    SELECT customer_id
    INTO   v_borrower_id
    FROM   loan
    WHERE  loan_id = NEW.loan_id;

    -- Reject the insert/update if the guarantor IS the borrower
    IF NEW.customer_id = v_borrower_id THEN
        RAISE EXCEPTION
            'Guarantor (customer_id=%) cannot be the borrower of loan_id=%',
            NEW.customer_id, NEW.loan_id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_check_guarantor_not_borrower() OWNER TO postgres;

--
-- Name: fn_set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account (
    account_id integer NOT NULL,
    account_number character varying(20) NOT NULL,
    iban character varying(34),
    account_type_id integer NOT NULL,
    currency_id integer NOT NULL,
    balance numeric(20,2) DEFAULT 0.00 NOT NULL,
    available_balance numeric(20,2) DEFAULT 0.00 NOT NULL,
    hold_amount numeric(20,2) DEFAULT 0.00 NOT NULL,
    open_date date DEFAULT CURRENT_DATE NOT NULL,
    close_date date,
    status public.account_status DEFAULT 'ACTIVE'::public.account_status NOT NULL,
    branch_id integer NOT NULL,
    opened_by_employee_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_available_balance CHECK ((available_balance >= (0)::numeric)),
    CONSTRAINT chk_balance_not_negative CHECK ((balance >= (0)::numeric)),
    CONSTRAINT chk_close_after_open CHECK (((close_date IS NULL) OR (close_date > open_date))),
    CONSTRAINT chk_hold_not_negative CHECK ((hold_amount >= (0)::numeric))
);


ALTER TABLE public.account OWNER TO postgres;

--
-- Name: account_account_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.account_account_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.account_account_id_seq OWNER TO postgres;

--
-- Name: account_account_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.account_account_id_seq OWNED BY public.account.account_id;


--
-- Name: account_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_type (
    account_type_id integer NOT NULL,
    type_name character varying(100) NOT NULL,
    interest_rate numeric(6,4) DEFAULT 0.0000 NOT NULL,
    minimum_balance numeric(20,2) DEFAULT 0.00 NOT NULL,
    maximum_balance numeric(20,2),
    calc_method public.interest_calc_method DEFAULT 'SIMPLE'::public.interest_calc_method NOT NULL,
    accrual_frequency integer DEFAULT 30 NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_accrual_frequency CHECK ((accrual_frequency > 0)),
    CONSTRAINT chk_interest_rate CHECK (((interest_rate >= (0)::numeric) AND (interest_rate <= (1)::numeric))),
    CONSTRAINT chk_minimum_balance CHECK ((minimum_balance >= (0)::numeric))
);


ALTER TABLE public.account_type OWNER TO postgres;

--
-- Name: account_type_account_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.account_type_account_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.account_type_account_type_id_seq OWNER TO postgres;

--
-- Name: account_type_account_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.account_type_account_type_id_seq OWNED BY public.account_type.account_type_id;


--
-- Name: atm; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.atm (
    atm_id integer NOT NULL,
    atm_code character varying(20) NOT NULL,
    location text NOT NULL,
    latitude numeric(9,6),
    longitude numeric(9,6),
    branch_id integer NOT NULL,
    status public.atm_status DEFAULT 'ONLINE'::public.atm_status NOT NULL,
    cash_balance numeric(20,2) DEFAULT 0.00 NOT NULL,
    low_cash_threshold numeric(20,2) DEFAULT 50000.00 NOT NULL,
    last_refill_date timestamp with time zone,
    last_refill_by_id integer,
    last_maintenance_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_cash_balance_non_negative CHECK ((cash_balance >= (0)::numeric)),
    CONSTRAINT chk_threshold_positive CHECK ((low_cash_threshold > (0)::numeric))
);


ALTER TABLE public.atm OWNER TO postgres;

--
-- Name: atm_atm_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.atm_atm_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.atm_atm_id_seq OWNER TO postgres;

--
-- Name: atm_atm_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.atm_atm_id_seq OWNED BY public.atm.atm_id;


--
-- Name: atm_transaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.atm_transaction (
    atm_txn_id integer NOT NULL,
    atm_id integer NOT NULL,
    transaction_id integer NOT NULL,
    card_number_used character varying(19),
    transaction_type character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.atm_transaction OWNER TO postgres;

--
-- Name: atm_transaction_atm_txn_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.atm_transaction_atm_txn_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.atm_transaction_atm_txn_id_seq OWNER TO postgres;

--
-- Name: atm_transaction_atm_txn_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.atm_transaction_atm_txn_id_seq OWNED BY public.atm_transaction.atm_txn_id;


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    log_id integer NOT NULL,
    action_type public.audit_action NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id integer,
    performed_by_user_id integer,
    old_values jsonb,
    new_values jsonb,
    ip_address character varying(45),
    user_agent text,
    details text,
    is_suspicious boolean DEFAULT false NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- Name: audit_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_log_log_id_seq OWNER TO postgres;

--
-- Name: audit_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_log_log_id_seq OWNED BY public.audit_log.log_id;


--
-- Name: bank; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank (
    bank_id integer NOT NULL,
    bank_code character varying(20) NOT NULL,
    bank_name character varying(200) NOT NULL,
    address text NOT NULL,
    city character varying(100) NOT NULL,
    country character varying(100) DEFAULT 'Ethiopia'::character varying NOT NULL,
    phone_number character varying(20),
    email character varying(150),
    website character varying(255),
    swift_code character varying(11),
    established_date date,
    is_head_office boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bank OWNER TO postgres;

--
-- Name: bank_bank_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bank_bank_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bank_bank_id_seq OWNER TO postgres;

--
-- Name: bank_bank_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bank_bank_id_seq OWNED BY public.bank.bank_id;


--
-- Name: beneficiary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.beneficiary (
    beneficiary_id integer NOT NULL,
    customer_id integer NOT NULL,
    beneficiary_name character varying(200) NOT NULL,
    account_number_or_iban character varying(34) NOT NULL,
    bank_name character varying(200),
    bank_code character varying(20),
    swift_code character varying(11),
    relationship character varying(100),
    is_verified boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.beneficiary OWNER TO postgres;

--
-- Name: beneficiary_beneficiary_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.beneficiary_beneficiary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.beneficiary_beneficiary_id_seq OWNER TO postgres;

--
-- Name: beneficiary_beneficiary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.beneficiary_beneficiary_id_seq OWNED BY public.beneficiary.beneficiary_id;


--
-- Name: branch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branch (
    branch_id integer NOT NULL,
    branch_code character varying(20) NOT NULL,
    branch_name character varying(200) NOT NULL,
    address text NOT NULL,
    city character varying(100) NOT NULL,
    phone_number character varying(20),
    email character varying(150),
    bank_id integer NOT NULL,
    parent_branch_id integer,
    opening_date date NOT NULL,
    status public.branch_status DEFAULT 'ACTIVE'::public.branch_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.branch OWNER TO postgres;

--
-- Name: branch_branch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.branch_branch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.branch_branch_id_seq OWNER TO postgres;

--
-- Name: branch_branch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branch_branch_id_seq OWNED BY public.branch.branch_id;


--
-- Name: card; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.card (
    card_id integer NOT NULL,
    card_number character varying(19) NOT NULL,
    masked_number character varying(19) NOT NULL,
    card_type public.card_type NOT NULL,
    card_network public.card_network NOT NULL,
    expiry_date date NOT NULL,
    cvv_hash text NOT NULL,
    pin_hash text,
    status public.card_status DEFAULT 'ACTIVE'::public.card_status NOT NULL,
    daily_limit numeric(20,2) DEFAULT 10000.00 NOT NULL,
    monthly_limit numeric(20,2) DEFAULT 100000.00 NOT NULL,
    current_month_spend numeric(20,2) DEFAULT 0.00 NOT NULL,
    account_id integer NOT NULL,
    issued_by_branch_id integer NOT NULL,
    issued_date date DEFAULT CURRENT_DATE NOT NULL,
    blocked_date date,
    blocked_by_id integer,
    block_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_block_reason_when_blocked CHECK (((status <> 'BLOCKED'::public.card_status) OR (block_reason IS NOT NULL))),
    CONSTRAINT chk_daily_limit_positive CHECK ((daily_limit > (0)::numeric)),
    CONSTRAINT chk_expiry_future CHECK ((expiry_date > issued_date)),
    CONSTRAINT chk_monthly_gte_daily CHECK ((monthly_limit >= daily_limit)),
    CONSTRAINT chk_spend_non_negative CHECK ((current_month_spend >= (0)::numeric))
);


ALTER TABLE public.card OWNER TO postgres;

--
-- Name: card_card_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.card_card_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.card_card_id_seq OWNER TO postgres;

--
-- Name: card_card_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.card_card_id_seq OWNED BY public.card.card_id;


--
-- Name: card_transaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.card_transaction (
    card_txn_id integer NOT NULL,
    card_id integer NOT NULL,
    transaction_id integer NOT NULL,
    merchant_name character varying(200),
    merchant_category character varying(100),
    merchant_country character varying(3) DEFAULT 'ETH'::character varying,
    auth_code character varying(20),
    is_online boolean DEFAULT false NOT NULL,
    is_international boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.card_transaction OWNER TO postgres;

--
-- Name: card_transaction_card_txn_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.card_transaction_card_txn_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.card_transaction_card_txn_id_seq OWNER TO postgres;

--
-- Name: card_transaction_card_txn_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.card_transaction_card_txn_id_seq OWNED BY public.card_transaction.card_txn_id;


--
-- Name: charge_schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.charge_schedule (
    schedule_id integer NOT NULL,
    charge_name character varying(150) NOT NULL,
    charge_type public.charge_type NOT NULL,
    applicable_to public.charge_applicable_to NOT NULL,
    flat_amount numeric(20,2) DEFAULT 0.00,
    percentage_rate numeric(6,4) DEFAULT 0.0000,
    min_charge numeric(20,2) DEFAULT 0.00,
    max_charge numeric(20,2),
    effective_date date NOT NULL,
    expiry_date date,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_expiry_after_effective CHECK (((expiry_date IS NULL) OR (expiry_date > effective_date))),
    CONSTRAINT chk_flat_amount CHECK ((flat_amount >= (0)::numeric)),
    CONSTRAINT chk_percentage_rate CHECK (((percentage_rate >= (0)::numeric) AND (percentage_rate <= (1)::numeric)))
);


ALTER TABLE public.charge_schedule OWNER TO postgres;

--
-- Name: charge_schedule_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.charge_schedule_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.charge_schedule_schedule_id_seq OWNER TO postgres;

--
-- Name: charge_schedule_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.charge_schedule_schedule_id_seq OWNED BY public.charge_schedule.schedule_id;


--
-- Name: collateral; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collateral (
    collateral_id integer NOT NULL,
    loan_id integer NOT NULL,
    collateral_type public.collateral_type NOT NULL,
    description text NOT NULL,
    estimated_value numeric(20,2) NOT NULL,
    forced_sale_value numeric(20,2) NOT NULL,
    valuation_date date NOT NULL,
    owner_name character varying(200) NOT NULL,
    document_reference character varying(100),
    status public.collateral_status DEFAULT 'ACTIVE'::public.collateral_status NOT NULL,
    valued_by_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_estimated_value_positive CHECK ((estimated_value > (0)::numeric)),
    CONSTRAINT chk_forced_sale_lte_estimated CHECK ((forced_sale_value <= estimated_value)),
    CONSTRAINT chk_forced_sale_positive CHECK ((forced_sale_value > (0)::numeric))
);


ALTER TABLE public.collateral OWNER TO postgres;

--
-- Name: collateral_collateral_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.collateral_collateral_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.collateral_collateral_id_seq OWNER TO postgres;

--
-- Name: collateral_collateral_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.collateral_collateral_id_seq OWNED BY public.collateral.collateral_id;


--
-- Name: collateral_revaluation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collateral_revaluation (
    revaluation_id integer NOT NULL,
    collateral_id integer NOT NULL,
    previous_value numeric(20,2) NOT NULL,
    new_value numeric(20,2) NOT NULL,
    revaluation_date date NOT NULL,
    revalued_by_id integer,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_new_value_positive CHECK ((new_value > (0)::numeric)),
    CONSTRAINT chk_previous_value_positive CHECK ((previous_value > (0)::numeric))
);


ALTER TABLE public.collateral_revaluation OWNER TO postgres;

--
-- Name: collateral_revaluation_revaluation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.collateral_revaluation_revaluation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.collateral_revaluation_revaluation_id_seq OWNER TO postgres;

--
-- Name: collateral_revaluation_revaluation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.collateral_revaluation_revaluation_id_seq OWNED BY public.collateral_revaluation.revaluation_id;


--
-- Name: currency; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.currency (
    currency_id integer NOT NULL,
    currency_code character varying(3) NOT NULL,
    currency_name character varying(100) NOT NULL,
    symbol character varying(10) NOT NULL,
    is_base boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.currency OWNER TO postgres;

--
-- Name: currency_currency_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.currency_currency_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.currency_currency_id_seq OWNER TO postgres;

--
-- Name: currency_currency_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.currency_currency_id_seq OWNED BY public.currency.currency_id;


--
-- Name: customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer (
    customer_id integer NOT NULL,
    customer_code character varying(20) NOT NULL,
    customer_type public.customer_type NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    date_of_birth date,
    national_id character varying(50),
    company_name character varying(200),
    tax_id character varying(50),
    incorporation_date date,
    address text NOT NULL,
    city character varying(100) NOT NULL,
    phone_number character varying(20) NOT NULL,
    email character varying(150),
    kyc_status public.kyc_status DEFAULT 'PENDING'::public.kyc_status NOT NULL,
    risk_profile public.risk_profile DEFAULT 'LOW'::public.risk_profile NOT NULL,
    risk_score numeric(5,2) DEFAULT 0.00,
    registration_date date DEFAULT CURRENT_DATE NOT NULL,
    relationship_manager_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_corporate_fields CHECK (((customer_type <> 'CORPORATE'::public.customer_type) OR ((company_name IS NOT NULL) AND (tax_id IS NOT NULL)))),
    CONSTRAINT chk_dob_realistic CHECK (((date_of_birth IS NULL) OR (date_of_birth < (CURRENT_DATE - '18 years'::interval)))),
    CONSTRAINT chk_individual_fields CHECK (((customer_type <> 'INDIVIDUAL'::public.customer_type) OR ((first_name IS NOT NULL) AND (last_name IS NOT NULL) AND (national_id IS NOT NULL)))),
    CONSTRAINT chk_risk_score CHECK (((risk_score >= (0)::numeric) AND (risk_score <= (100)::numeric)))
);


ALTER TABLE public.customer OWNER TO postgres;

--
-- Name: customer_account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_account (
    customer_id integer NOT NULL,
    account_id integer NOT NULL,
    ownership_percentage numeric(5,2) DEFAULT 100.00 NOT NULL,
    is_primary_owner boolean DEFAULT true NOT NULL,
    relationship_type public.ownership_relationship DEFAULT 'SOLE_OWNER'::public.ownership_relationship NOT NULL,
    joined_date date DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT chk_ownership_percentage CHECK (((ownership_percentage > (0)::numeric) AND (ownership_percentage <= (100)::numeric)))
);


ALTER TABLE public.customer_account OWNER TO postgres;

--
-- Name: customer_customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_customer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_customer_id_seq OWNER TO postgres;

--
-- Name: customer_customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_customer_id_seq OWNED BY public.customer.customer_id;


--
-- Name: department; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department (
    department_id integer NOT NULL,
    department_name character varying(150) NOT NULL,
    branch_id integer NOT NULL,
    manager_employee_id integer,
    cost_center character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.department OWNER TO postgres;

--
-- Name: department_department_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.department_department_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.department_department_id_seq OWNER TO postgres;

--
-- Name: department_department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.department_department_id_seq OWNED BY public.department.department_id;


--
-- Name: employee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee (
    employee_id integer NOT NULL,
    employee_code character varying(20) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    "position" character varying(150) NOT NULL,
    employee_type public.employee_type DEFAULT 'FULL_TIME'::public.employee_type NOT NULL,
    salary numeric(20,2) NOT NULL,
    hire_date date NOT NULL,
    termination_date date,
    phone_number character varying(20),
    email character varying(150) NOT NULL,
    branch_id integer NOT NULL,
    department_id integer,
    manager_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_salary_positive CHECK ((salary > (0)::numeric)),
    CONSTRAINT chk_termination_after_hire CHECK (((termination_date IS NULL) OR (termination_date > hire_date)))
);


ALTER TABLE public.employee OWNER TO postgres;

--
-- Name: employee_employee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_employee_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_employee_id_seq OWNER TO postgres;

--
-- Name: employee_employee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_employee_id_seq OWNED BY public.employee.employee_id;


--
-- Name: exchange_rate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exchange_rate (
    rate_id integer NOT NULL,
    from_currency_id integer NOT NULL,
    to_currency_id integer NOT NULL,
    rate numeric(20,8) NOT NULL,
    effective_date timestamp with time zone DEFAULT now() NOT NULL,
    expiry_date timestamp with time zone,
    source character varying(100) DEFAULT 'NBE'::character varying,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_different_currencies CHECK ((from_currency_id <> to_currency_id)),
    CONSTRAINT chk_expiry_after_effective CHECK (((expiry_date IS NULL) OR (expiry_date > effective_date))),
    CONSTRAINT chk_rate_positive CHECK ((rate > (0)::numeric))
);


ALTER TABLE public.exchange_rate OWNER TO postgres;

--
-- Name: exchange_rate_rate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exchange_rate_rate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exchange_rate_rate_id_seq OWNER TO postgres;

--
-- Name: exchange_rate_rate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exchange_rate_rate_id_seq OWNED BY public.exchange_rate.rate_id;


--
-- Name: guarantor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guarantor (
    guarantor_id integer NOT NULL,
    loan_id integer NOT NULL,
    customer_id integer NOT NULL,
    guarantor_type public.guarantor_type DEFAULT 'PERSONAL'::public.guarantor_type NOT NULL,
    guaranteed_amount numeric(20,2) NOT NULL,
    signed_date date NOT NULL,
    status public.guarantor_status DEFAULT 'ACTIVE'::public.guarantor_status NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_guaranteed_amount_positive CHECK ((guaranteed_amount > (0)::numeric))
);


ALTER TABLE public.guarantor OWNER TO postgres;

--
-- Name: guarantor_guarantor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.guarantor_guarantor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guarantor_guarantor_id_seq OWNER TO postgres;

--
-- Name: guarantor_guarantor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.guarantor_guarantor_id_seq OWNED BY public.guarantor.guarantor_id;


--
-- Name: interest_accrual; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interest_accrual (
    accrual_id integer NOT NULL,
    account_id integer NOT NULL,
    accrued_amount numeric(20,6) NOT NULL,
    accrual_date date NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    rate_applied numeric(6,4) NOT NULL,
    is_posted boolean DEFAULT false NOT NULL,
    posted_at timestamp with time zone,
    transaction_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_accrual_period CHECK ((period_end > period_start)),
    CONSTRAINT chk_accrual_positive CHECK ((accrued_amount > (0)::numeric)),
    CONSTRAINT chk_posted_has_timestamp CHECK (((is_posted = false) OR ((is_posted = true) AND (posted_at IS NOT NULL))))
);


ALTER TABLE public.interest_accrual OWNER TO postgres;

--
-- Name: interest_accrual_accrual_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.interest_accrual_accrual_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interest_accrual_accrual_id_seq OWNER TO postgres;

--
-- Name: interest_accrual_accrual_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interest_accrual_accrual_id_seq OWNED BY public.interest_accrual.accrual_id;


--
-- Name: loan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loan (
    loan_id integer NOT NULL,
    loan_number character varying(30) NOT NULL,
    application_id integer,
    customer_id integer NOT NULL,
    loan_type public.loan_type NOT NULL,
    principal_amount numeric(20,2) NOT NULL,
    outstanding_balance numeric(20,2) NOT NULL,
    interest_rate numeric(6,4) NOT NULL,
    interest_rate_type public.interest_rate_type DEFAULT 'FIXED'::public.interest_rate_type NOT NULL,
    penalty_rate numeric(6,4) DEFAULT 0.0200 NOT NULL,
    term_months integer NOT NULL,
    start_date date NOT NULL,
    maturity_date date NOT NULL,
    disbursement_date date,
    status public.loan_status DEFAULT 'PENDING_DISBURSEMENT'::public.loan_status NOT NULL,
    purpose text,
    disbursement_account_id integer,
    approved_by_id integer,
    disbursed_by_id integer,
    disbursement_transaction_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_interest_rate_range CHECK (((interest_rate >= (0)::numeric) AND (interest_rate <= (1)::numeric))),
    CONSTRAINT chk_maturity_after_start CHECK ((maturity_date > start_date)),
    CONSTRAINT chk_outstanding_lte_principal CHECK ((outstanding_balance <= principal_amount)),
    CONSTRAINT chk_outstanding_non_negative CHECK ((outstanding_balance >= (0)::numeric)),
    CONSTRAINT chk_principal_positive CHECK ((principal_amount > (0)::numeric)),
    CONSTRAINT chk_term_positive CHECK ((term_months > 0))
);


ALTER TABLE public.loan OWNER TO postgres;

--
-- Name: loan_application; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loan_application (
    application_id integer NOT NULL,
    application_number character varying(30) NOT NULL,
    customer_id integer NOT NULL,
    loan_type public.loan_type NOT NULL,
    requested_amount numeric(20,2) NOT NULL,
    requested_term_months integer NOT NULL,
    purpose text NOT NULL,
    status public.application_status DEFAULT 'SUBMITTED'::public.application_status NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_by_id integer,
    reviewed_at timestamp with time zone,
    rejection_reason text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_rejection_reason CHECK (((status <> 'REJECTED'::public.application_status) OR (rejection_reason IS NOT NULL))),
    CONSTRAINT chk_requested_amount_positive CHECK ((requested_amount > (0)::numeric)),
    CONSTRAINT chk_reviewed_at_consistency CHECK (((reviewed_by_id IS NULL) OR (reviewed_at IS NOT NULL))),
    CONSTRAINT chk_term_positive CHECK ((requested_term_months > 0))
);


ALTER TABLE public.loan_application OWNER TO postgres;

--
-- Name: loan_application_application_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.loan_application_application_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.loan_application_application_id_seq OWNER TO postgres;

--
-- Name: loan_application_application_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.loan_application_application_id_seq OWNED BY public.loan_application.application_id;


--
-- Name: loan_loan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.loan_loan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.loan_loan_id_seq OWNER TO postgres;

--
-- Name: loan_loan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.loan_loan_id_seq OWNED BY public.loan.loan_id;


--
-- Name: loan_payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loan_payment (
    payment_id integer NOT NULL,
    loan_id integer NOT NULL,
    repayment_id integer NOT NULL,
    transaction_id integer,
    amount numeric(20,2) NOT NULL,
    principal_portion numeric(20,2) DEFAULT 0.00 NOT NULL,
    interest_portion numeric(20,2) DEFAULT 0.00 NOT NULL,
    penalty_portion numeric(20,2) DEFAULT 0.00 NOT NULL,
    payment_date timestamp with time zone DEFAULT now() NOT NULL,
    payment_mode public.payment_mode DEFAULT 'ACCOUNT_DEBIT'::public.payment_mode NOT NULL,
    processed_by_id integer,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_payment_amount_positive CHECK ((amount > (0)::numeric)),
    CONSTRAINT chk_portions_non_negative CHECK (((principal_portion >= (0)::numeric) AND (interest_portion >= (0)::numeric) AND (penalty_portion >= (0)::numeric))),
    CONSTRAINT chk_portions_sum_to_amount CHECK ((round(((principal_portion + interest_portion) + penalty_portion), 2) = round(amount, 2)))
);


ALTER TABLE public.loan_payment OWNER TO postgres;

--
-- Name: loan_payment_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.loan_payment_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.loan_payment_payment_id_seq OWNER TO postgres;

--
-- Name: loan_payment_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.loan_payment_payment_id_seq OWNED BY public.loan_payment.payment_id;


--
-- Name: notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification (
    notification_id integer NOT NULL,
    user_id integer NOT NULL,
    channel public.notification_channel NOT NULL,
    notification_type public.notification_type NOT NULL,
    subject character varying(255),
    body text NOT NULL,
    is_sent boolean DEFAULT false NOT NULL,
    sent_at timestamp with time zone,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_read_after_sent CHECK (((read_at IS NULL) OR (sent_at IS NULL) OR (read_at >= sent_at))),
    CONSTRAINT chk_read_at_when_read CHECK (((is_read = false) OR (read_at IS NOT NULL))),
    CONSTRAINT chk_sent_at_when_sent CHECK (((is_sent = false) OR (sent_at IS NOT NULL)))
);


ALTER TABLE public.notification OWNER TO postgres;

--
-- Name: notification_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_notification_id_seq OWNER TO postgres;

--
-- Name: notification_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_notification_id_seq OWNED BY public.notification.notification_id;


--
-- Name: online_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.online_user (
    user_id integer NOT NULL,
    username character varying(100) NOT NULL,
    password_hash text NOT NULL,
    salt character varying(255) NOT NULL,
    role public.user_role NOT NULL,
    linked_customer_id integer,
    linked_employee_id integer,
    last_login timestamp with time zone,
    last_login_ip character varying(45),
    two_factor_enabled boolean DEFAULT false NOT NULL,
    two_factor_secret text,
    account_locked boolean DEFAULT false NOT NULL,
    failed_login_attempts integer DEFAULT 0 NOT NULL,
    lockout_until timestamp with time zone,
    must_change_password boolean DEFAULT true NOT NULL,
    password_changed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_failed_attempts_non_negative CHECK ((failed_login_attempts >= 0)),
    CONSTRAINT chk_one_link_only CHECK ((((linked_customer_id IS NOT NULL) AND (linked_employee_id IS NULL)) OR ((linked_customer_id IS NULL) AND (linked_employee_id IS NOT NULL)))),
    CONSTRAINT chk_role_link_consistency CHECK ((((role = 'CUSTOMER'::public.user_role) AND (linked_customer_id IS NOT NULL)) OR ((role <> 'CUSTOMER'::public.user_role) AND (linked_employee_id IS NOT NULL))))
);


ALTER TABLE public.online_user OWNER TO postgres;

--
-- Name: online_user_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.online_user_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.online_user_user_id_seq OWNER TO postgres;

--
-- Name: online_user_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.online_user_user_id_seq OWNED BY public.online_user.user_id;


--
-- Name: password_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_history (
    history_id integer NOT NULL,
    user_id integer NOT NULL,
    password_hash text NOT NULL,
    changed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_history OWNER TO postgres;

--
-- Name: password_history_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_history_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_history_history_id_seq OWNER TO postgres;

--
-- Name: password_history_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_history_history_id_seq OWNED BY public.password_history.history_id;


--
-- Name: refund; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refund (
    refund_id integer NOT NULL,
    original_transaction_id integer NOT NULL,
    account_id integer NOT NULL,
    amount numeric(20,2) NOT NULL,
    reason text NOT NULL,
    status public.refund_status DEFAULT 'PENDING_APPROVAL'::public.refund_status NOT NULL,
    requested_by_id integer,
    approved_by_id integer,
    approved_at timestamp with time zone,
    processed_transaction_id integer,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_approved_at_when_approved CHECK (((status <> ALL (ARRAY['APPROVED'::public.refund_status, 'PROCESSED'::public.refund_status])) OR (approved_at IS NOT NULL))),
    CONSTRAINT chk_processed_txn_when_processed CHECK (((status <> 'PROCESSED'::public.refund_status) OR (processed_transaction_id IS NOT NULL))),
    CONSTRAINT chk_refund_amount_positive CHECK ((amount > (0)::numeric)),
    CONSTRAINT chk_rejection_reason_when_rejected CHECK (((status <> 'REJECTED'::public.refund_status) OR (rejection_reason IS NOT NULL)))
);


ALTER TABLE public.refund OWNER TO postgres;

--
-- Name: refund_refund_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.refund_refund_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refund_refund_id_seq OWNER TO postgres;

--
-- Name: refund_refund_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.refund_refund_id_seq OWNED BY public.refund.refund_id;


--
-- Name: repayment_schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.repayment_schedule (
    repayment_id integer NOT NULL,
    loan_id integer NOT NULL,
    installment_number integer NOT NULL,
    due_date date NOT NULL,
    principal_due numeric(20,2) NOT NULL,
    interest_due numeric(20,2) NOT NULL,
    total_due numeric(20,2) GENERATED ALWAYS AS ((principal_due + interest_due)) STORED,
    principal_paid numeric(20,2) DEFAULT 0.00 NOT NULL,
    interest_paid numeric(20,2) DEFAULT 0.00 NOT NULL,
    penalty_paid numeric(20,2) DEFAULT 0.00 NOT NULL,
    payment_date date,
    status public.repayment_status DEFAULT 'PENDING'::public.repayment_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_interest_due_non_negative CHECK ((interest_due >= (0)::numeric)),
    CONSTRAINT chk_paid_not_exceed_due CHECK (((principal_paid <= principal_due) AND (interest_paid <= interest_due))),
    CONSTRAINT chk_principal_due_positive CHECK ((principal_due > (0)::numeric))
);


ALTER TABLE public.repayment_schedule OWNER TO postgres;

--
-- Name: repayment_schedule_repayment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.repayment_schedule_repayment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.repayment_schedule_repayment_id_seq OWNER TO postgres;

--
-- Name: repayment_schedule_repayment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.repayment_schedule_repayment_id_seq OWNED BY public.repayment_schedule.repayment_id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    session_id integer NOT NULL,
    user_id integer NOT NULL,
    session_token character varying(512) NOT NULL,
    ip_address character varying(45) NOT NULL,
    user_agent text,
    device_name character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    last_active_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT chk_expires_after_created CHECK ((expires_at > created_at))
);


ALTER TABLE public.session OWNER TO postgres;

--
-- Name: session_session_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.session_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.session_session_id_seq OWNER TO postgres;

--
-- Name: session_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.session_session_id_seq OWNED BY public.session.session_id;


--
-- Name: standing_order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.standing_order (
    order_id integer NOT NULL,
    account_id integer NOT NULL,
    beneficiary_id integer NOT NULL,
    currency_id integer NOT NULL,
    amount numeric(20,2) NOT NULL,
    frequency public.order_frequency NOT NULL,
    start_date date NOT NULL,
    end_date date,
    next_execution_date date NOT NULL,
    last_execution_date date,
    status public.order_status DEFAULT 'ACTIVE'::public.order_status NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_amount_positive CHECK ((amount > (0)::numeric)),
    CONSTRAINT chk_end_after_start CHECK (((end_date IS NULL) OR (end_date > start_date))),
    CONSTRAINT chk_next_execution_gte_start CHECK ((next_execution_date >= start_date))
);


ALTER TABLE public.standing_order OWNER TO postgres;

--
-- Name: standing_order_order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.standing_order_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.standing_order_order_id_seq OWNER TO postgres;

--
-- Name: standing_order_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.standing_order_order_id_seq OWNED BY public.standing_order.order_id;


--
-- Name: transaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transaction (
    transaction_id integer NOT NULL,
    reference_number character varying(50) NOT NULL,
    transaction_type public.transaction_type NOT NULL,
    channel public.transaction_channel DEFAULT 'BRANCH'::public.transaction_channel NOT NULL,
    amount numeric(20,2) NOT NULL,
    currency_id integer NOT NULL,
    exchange_rate_applied numeric(20,8),
    settled_amount numeric(20,2),
    settled_currency_id integer,
    account_id integer NOT NULL,
    to_account_id integer,
    to_bank_code character varying(20),
    to_iban character varying(34),
    to_account_name character varying(200),
    reversed_by_transaction_id integer,
    description text,
    transaction_date timestamp with time zone DEFAULT now() NOT NULL,
    value_date date DEFAULT CURRENT_DATE NOT NULL,
    status public.transaction_status DEFAULT 'PENDING'::public.transaction_status NOT NULL,
    failure_reason text,
    processed_by_employee_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_amount_positive CHECK ((amount > (0)::numeric)),
    CONSTRAINT chk_fx_fields_consistent CHECK (((exchange_rate_applied IS NULL) OR ((settled_amount IS NOT NULL) AND (settled_currency_id IS NOT NULL)))),
    CONSTRAINT chk_interbank_needs_destination CHECK (((transaction_type <> 'INTERBANK_TRANSFER'::public.transaction_type) OR ((to_bank_code IS NOT NULL) AND (to_iban IS NOT NULL)))),
    CONSTRAINT chk_internal_transfer_needs_destination CHECK (((transaction_type <> 'INTERNAL_TRANSFER'::public.transaction_type) OR (to_account_id IS NOT NULL))),
    CONSTRAINT chk_no_self_transfer CHECK (((account_id <> to_account_id) OR (to_account_id IS NULL)))
);


ALTER TABLE public.transaction OWNER TO postgres;

--
-- Name: transaction_fee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transaction_fee (
    fee_id integer NOT NULL,
    transaction_id integer NOT NULL,
    fee_type public.fee_type NOT NULL,
    fee_amount numeric(20,2) NOT NULL,
    currency_id integer NOT NULL,
    schedule_id integer,
    charged_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_fee_amount_positive CHECK ((fee_amount > (0)::numeric))
);


ALTER TABLE public.transaction_fee OWNER TO postgres;

--
-- Name: transaction_fee_fee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transaction_fee_fee_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transaction_fee_fee_id_seq OWNER TO postgres;

--
-- Name: transaction_fee_fee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transaction_fee_fee_id_seq OWNED BY public.transaction_fee.fee_id;


--
-- Name: transaction_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transaction_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transaction_transaction_id_seq OWNER TO postgres;

--
-- Name: transaction_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transaction_transaction_id_seq OWNED BY public.transaction.transaction_id;


--
-- Name: utility_payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utility_payment (
    payment_id integer NOT NULL,
    account_id integer NOT NULL,
    customer_id integer NOT NULL,
    transaction_id integer,
    utility_type public.utility_type NOT NULL,
    provider_name character varying(200) NOT NULL,
    provider_code character varying(50),
    provider_account_number character varying(100) NOT NULL,
    subscriber_name character varying(200),
    amount numeric(20,2) NOT NULL,
    currency_id integer NOT NULL,
    payment_date timestamp with time zone DEFAULT now() NOT NULL,
    reference_number character varying(100) NOT NULL,
    provider_reference character varying(100),
    status public.utility_status DEFAULT 'PENDING'::public.utility_status NOT NULL,
    failure_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_failure_reason_when_failed CHECK (((status <> 'FAILED'::public.utility_status) OR (failure_reason IS NOT NULL))),
    CONSTRAINT chk_utility_amount_positive CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.utility_payment OWNER TO postgres;

--
-- Name: utility_payment_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.utility_payment_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.utility_payment_payment_id_seq OWNER TO postgres;

--
-- Name: utility_payment_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.utility_payment_payment_id_seq OWNED BY public.utility_payment.payment_id;


--
-- Name: account account_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account ALTER COLUMN account_id SET DEFAULT nextval('public.account_account_id_seq'::regclass);


--
-- Name: account_type account_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_type ALTER COLUMN account_type_id SET DEFAULT nextval('public.account_type_account_type_id_seq'::regclass);


--
-- Name: atm atm_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atm ALTER COLUMN atm_id SET DEFAULT nextval('public.atm_atm_id_seq'::regclass);


--
-- Name: atm_transaction atm_txn_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atm_transaction ALTER COLUMN atm_txn_id SET DEFAULT nextval('public.atm_transaction_atm_txn_id_seq'::regclass);


--
-- Name: audit_log log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN log_id SET DEFAULT nextval('public.audit_log_log_id_seq'::regclass);


--
-- Name: bank bank_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank ALTER COLUMN bank_id SET DEFAULT nextval('public.bank_bank_id_seq'::regclass);


--
-- Name: beneficiary beneficiary_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary ALTER COLUMN beneficiary_id SET DEFAULT nextval('public.beneficiary_beneficiary_id_seq'::regclass);


--
-- Name: branch branch_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch ALTER COLUMN branch_id SET DEFAULT nextval('public.branch_branch_id_seq'::regclass);


--
-- Name: card card_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.card ALTER COLUMN card_id SET DEFAULT nextval('public.card_card_id_seq'::regclass);


--
-- Name: card_transaction card_txn_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.card_transaction ALTER COLUMN card_txn_id SET DEFAULT nextval('public.card_transaction_card_txn_id_seq'::regclass);


--
-- Name: charge_schedule schedule_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charge_schedule ALTER COLUMN schedule_id SET DEFAULT nextval('public.charge_schedule_schedule_id_seq'::regclass);


--
-- Name: collateral collateral_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collateral ALTER COLUMN collateral_id SET DEFAULT nextval('public.collateral_collateral_id_seq'::regclass);


--
-- Name: collateral_revaluation revaluation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collateral_revaluation ALTER COLUMN revaluation_id SET DEFAULT nextval('public.collateral_revaluation_revaluation_id_seq'::regclass);


--
-- Name: currency currency_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currency ALTER COLUMN currency_id SET DEFAULT nextval('public.currency_currency_id_seq'::regclass);


--
-- Name: customer customer_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer ALTER COLUMN customer_id SET DEFAULT nextval('public.customer_customer_id_seq'::regclass);


--
-- Name: department department_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department ALTER COLUMN department_id SET DEFAULT nextval('public.department_department_id_seq'::regclass);


--
-- Name: employee employee_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee ALTER COLUMN employee_id SET DEFAULT nextval('public.employee_employee_id_seq'::regclass);


--
-- Name: exchange_rate rate_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_rate ALTER COLUMN rate_id SET DEFAULT nextval('public.exchange_rate_rate_id_seq'::regclass);


--
-- Name: guarantor guarantor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guarantor ALTER COLUMN guarantor_id SET DEFAULT nextval('public.guarantor_guarantor_id_seq'::regclass);


--
-- Name: interest_accrual accrual_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interest_accrual ALTER COLUMN accrual_id SET DEFAULT nextval('public.interest_accrual_accrual_id_seq'::regclass);


--
-- Name: loan loan_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan ALTER COLUMN loan_id SET DEFAULT nextval('public.loan_loan_id_seq'::regclass);


--
-- Name: loan_application application_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan_application ALTER COLUMN application_id SET DEFAULT nextval('public.loan_application_application_id_seq'::regclass);


--
-- Name: loan_payment payment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan_payment ALTER COLUMN payment_id SET DEFAULT nextval('public.loan_payment_payment_id_seq'::regclass);


--
-- Name: notification notification_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification ALTER COLUMN notification_id SET DEFAULT nextval('public.notification_notification_id_seq'::regclass);


--
-- Name: online_user user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.online_user ALTER COLUMN user_id SET DEFAULT nextval('public.online_user_user_id_seq'::regclass);


--
-- Name: password_history history_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_history ALTER COLUMN history_id SET DEFAULT nextval('public.password_history_history_id_seq'::regclass);


--
-- Name: refund refund_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund ALTER COLUMN refund_id SET DEFAULT nextval('public.refund_refund_id_seq'::regclass);


--
-- Name: repayment_schedule repayment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repayment_schedule ALTER COLUMN repayment_id SET DEFAULT nextval('public.repayment_schedule_repayment_id_seq'::regclass);


--
-- Name: session session_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session ALTER COLUMN session_id SET DEFAULT nextval('public.session_session_id_seq'::regclass);


--
-- Name: standing_order order_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.standing_order ALTER COLUMN order_id SET DEFAULT nextval('public.standing_order_order_id_seq'::regclass);


--
-- Name: transaction transaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction ALTER COLUMN transaction_id SET DEFAULT nextval('public.transaction_transaction_id_seq'::regclass);


--
-- Name: transaction_fee fee_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_fee ALTER COLUMN fee_id SET DEFAULT nextval('public.transaction_fee_fee_id_seq'::regclass);


--
-- Name: utility_payment payment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_payment ALTER COLUMN payment_id SET DEFAULT nextval('public.utility_payment_payment_id_seq'::regclass);


--
-- Name: account account_account_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_account_number_key UNIQUE (account_number);


--
-- Name: account account_iban_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_iban_key UNIQUE (iban);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (account_id);


--
-- Name: account_type account_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_type
    ADD CONSTRAINT account_type_pkey PRIMARY KEY (account_type_id);


--
-- Name: account_type account_type_type_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_type
    ADD CONSTRAINT account_type_type_name_key UNIQUE (type_name);


--
-- Name: atm atm_atm_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atm
    ADD CONSTRAINT atm_atm_code_key UNIQUE (atm_code);


--
-- Name: atm atm_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atm
    ADD CONSTRAINT atm_pkey PRIMARY KEY (atm_id);


--
-- Name: atm_transaction atm_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atm_transaction
    ADD CONSTRAINT atm_transaction_pkey PRIMARY KEY (atm_txn_id);


--
-- Name: atm_transaction atm_transaction_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atm_transaction
    ADD CONSTRAINT atm_transaction_transaction_id_key UNIQUE (transaction_id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (log_id);


--
-- Name: bank bank_bank_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank
    ADD CONSTRAINT bank_bank_code_key UNIQUE (bank_code);


--
-- Name: bank bank_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank
    ADD CONSTRAINT bank_pkey PRIMARY KEY (bank_id);


--
-- Name: bank bank_swift_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank
    ADD CONSTRAINT bank_swift_code_key UNIQUE (swift_code);


--
-- Name: beneficiary beneficiary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary
    ADD CONSTRAINT beneficiary_pkey PRIMARY KEY (beneficiary_id);


--
-- Name: branch branch_branch_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_branch_code_key UNIQUE (branch_code);


--
-- Name: branch branch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_pkey PRIMARY KEY (branch_id);


--
-- Name: card card_card_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.card
    ADD CONSTRAINT card_card_number_key UNIQUE (card_number);


--
-- Name: card card_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.card
    ADD CONSTRAINT card_pkey PRIMARY KEY (card_id);


--
-- Name: card_transaction card_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.card_transaction
    ADD CONSTRAINT card_transaction_pkey PRIMARY KEY (card_txn_id);


--
-- Name: card_transaction card_transaction_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.card_transaction
    ADD CONSTRAINT card_transaction_transaction_id_key UNIQUE (transaction_id);


--
-- Name: charge_schedule charge_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charge_schedule
    ADD CONSTRAINT charge_schedule_pkey PRIMARY KEY (schedule_id);


--
-- Name: collateral collateral_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collateral
    ADD CONSTRAINT collateral_pkey PRIMARY KEY (collateral_id);


--
-- Name: collateral_revaluation collateral_revaluation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collateral_revaluation
    ADD CONSTRAINT collateral_revaluation_pkey PRIMARY KEY (revaluation_id);


--
-- Name: currency currency_currency_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currency
    ADD CONSTRAINT currency_currency_code_key UNIQUE (currency_code);


--
-- Name: currency currency_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currency
    ADD CONSTRAINT currency_pkey PRIMARY KEY (currency_id);


--
-- Name: customer_account customer_account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_account
    ADD CONSTRAINT customer_account_pkey PRIMARY KEY (customer_id, account_id);


--
-- Name: customer customer_customer_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_customer_code_key UNIQUE (customer_code);


--
-- Name: customer customer_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_email_key UNIQUE (email);


--
-- Name: customer customer_national_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_national_id_key UNIQUE (national_id);


--
-- Name: customer customer_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_phone_number_key UNIQUE (phone_number);


--
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (customer_id);


--
-- Name: customer customer_tax_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_tax_id_key UNIQUE (tax_id);


--
-- Name: department department_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT department_pkey PRIMARY KEY (department_id);


--
-- Name: employee employee_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_email_key UNIQUE (email);


--
-- Name: employee employee_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_employee_code_key UNIQUE (employee_code);


--
-- Name: employee employee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_pkey PRIMARY KEY (employee_id);


--
-- Name: exchange_rate exchange_rate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_rate
    ADD CONSTRAINT exchange_rate_pkey PRIMARY KEY (rate_id);


--
-- Name: guarantor guarantor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guarantor
    ADD CONSTRAINT guarantor_pkey PRIMARY KEY (guarantor_id);


--
-- Name: interest_accrual interest_accrual_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interest_accrual
    ADD CONSTRAINT interest_accrual_pkey PRIMARY KEY (accrual_id);


--
-- Name: loan_application loan_application_application_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan_application
    ADD CONSTRAINT loan_application_application_number_key UNIQUE (application_number);


--
-- Name: loan loan_application_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan
    ADD CONSTRAINT loan_application_id_key UNIQUE (application_id);


--
-- Name: loan_application loan_application_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan_application
    ADD CONSTRAINT loan_application_pkey PRIMARY KEY (application_id);


--
-- Name: loan loan_disbursement_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan
    ADD CONSTRAINT loan_disbursement_transaction_id_key UNIQUE (disbursement_transaction_id);


--
-- Name: loan loan_loan_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan
    ADD CONSTRAINT loan_loan_number_key UNIQUE (loan_number);


--
-- Name: loan_payment loan_payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan_payment
    ADD CONSTRAINT loan_payment_pkey PRIMARY KEY (payment_id);


--
-- Name: loan_payment loan_payment_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan_payment
    ADD CONSTRAINT loan_payment_transaction_id_key UNIQUE (transaction_id);


--
-- Name: loan loan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan
    ADD CONSTRAINT loan_pkey PRIMARY KEY (loan_id);


--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (notification_id);


--
-- Name: online_user online_user_linked_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.online_user
    ADD CONSTRAINT online_user_linked_customer_id_key UNIQUE (linked_customer_id);


--
-- Name: online_user online_user_linked_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.online_user
    ADD CONSTRAINT online_user_linked_employee_id_key UNIQUE (linked_employee_id);


--
-- Name: online_user online_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.online_user
    ADD CONSTRAINT online_user_pkey PRIMARY KEY (user_id);


--
-- Name: online_user online_user_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.online_user
    ADD CONSTRAINT online_user_username_key UNIQUE (username);


--
-- Name: password_history password_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_history
    ADD CONSTRAINT password_history_pkey PRIMARY KEY (history_id);


--
-- Name: refund refund_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund
    ADD CONSTRAINT refund_pkey PRIMARY KEY (refund_id);


--
-- Name: refund refund_processed_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund
    ADD CONSTRAINT refund_processed_transaction_id_key UNIQUE (processed_transaction_id);


--
-- Name: repayment_schedule repayment_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repayment_schedule
    ADD CONSTRAINT repayment_schedule_pkey PRIMARY KEY (repayment_id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (session_id);


--
-- Name: session session_session_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_session_token_key UNIQUE (session_token);


--
-- Name: standing_order standing_order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.standing_order
    ADD CONSTRAINT standing_order_pkey PRIMARY KEY (order_id);


--
-- Name: transaction_fee transaction_fee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_fee
    ADD CONSTRAINT transaction_fee_pkey PRIMARY KEY (fee_id);


--
-- Name: transaction transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction
    ADD CONSTRAINT transaction_pkey PRIMARY KEY (transaction_id);


--
-- Name: transaction transaction_reference_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction
    ADD CONSTRAINT transaction_reference_number_key UNIQUE (reference_number);


--
-- Name: transaction transaction_reversed_by_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction
    ADD CONSTRAINT transaction_reversed_by_transaction_id_key UNIQUE (reversed_by_transaction_id);


--
-- Name: beneficiary uq_customer_beneficiary_account; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary
    ADD CONSTRAINT uq_customer_beneficiary_account UNIQUE (customer_id, account_number_or_iban);


--
-- Name: department uq_dept_name_branch; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT uq_dept_name_branch UNIQUE (department_name, branch_id);


--
-- Name: guarantor uq_guarantor_per_loan; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guarantor
    ADD CONSTRAINT uq_guarantor_per_loan UNIQUE (loan_id, customer_id);


--
-- Name: repayment_schedule uq_loan_installment; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repayment_schedule
    ADD CONSTRAINT uq_loan_installment UNIQUE (loan_id, installment_number);


--
-- Name: utility_payment utility_payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_payment
    ADD CONSTRAINT utility_payment_pkey PRIMARY KEY (payment_id);


--
-- Name: utility_payment utility_payment_reference_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_payment
    ADD CONSTRAINT utility_payment_reference_number_key UNIQUE (reference_number);


--
-- Name: utility_payment utility_payment_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_payment
    ADD CONSTRAINT utility_payment_transaction_id_key UNIQUE (transaction_id);


--
-- Name: idx_account_branch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_account_branch ON public.account USING btree (branch_id);


--
-- Name: idx_account_currency; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_account_currency ON public.account USING btree (currency_id);


--
-- Name: idx_account_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_account_status ON public.account USING btree (status);


--
-- Name: idx_account_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_account_type ON public.account USING btree (account_type_id);


--
-- Name: idx_accrual_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accrual_account ON public.interest_accrual USING btree (account_id, accrual_date DESC);


--
-- Name: idx_accrual_unposted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accrual_unposted ON public.interest_accrual USING btree (is_posted) WHERE (is_posted = false);


--
-- Name: idx_active_rate_per_pair; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_active_rate_per_pair ON public.exchange_rate USING btree (from_currency_id, to_currency_id) WHERE (expiry_date IS NULL);


--
-- Name: idx_app_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_app_customer ON public.loan_application USING btree (customer_id);


--
-- Name: idx_app_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_app_status ON public.loan_application USING btree (status);


--
-- Name: idx_app_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_app_type ON public.loan_application USING btree (loan_type);


--
-- Name: idx_atm_branch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_atm_branch ON public.atm USING btree (branch_id);


--
-- Name: idx_atm_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_atm_status ON public.atm USING btree (status);


--
-- Name: idx_atm_txn_atm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_atm_txn_atm ON public.atm_transaction USING btree (atm_id);


--
-- Name: idx_atm_txn_transaction; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_atm_txn_transaction ON public.atm_transaction USING btree (transaction_id);


--
-- Name: idx_audit_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_action ON public.audit_log USING btree (action_type);


--
-- Name: idx_audit_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_entity ON public.audit_log USING btree (entity_type, entity_id);


--
-- Name: idx_audit_suspicious; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_suspicious ON public.audit_log USING btree (is_suspicious) WHERE (is_suspicious = true);


--
-- Name: idx_audit_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_timestamp ON public.audit_log USING btree ("timestamp" DESC);


--
-- Name: idx_audit_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_user ON public.audit_log USING btree (performed_by_user_id);


--
-- Name: idx_beneficiary_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_beneficiary_active ON public.beneficiary USING btree (customer_id) WHERE (is_active = true);


--
-- Name: idx_beneficiary_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_beneficiary_customer ON public.beneficiary USING btree (customer_id);


--
-- Name: idx_branch_bank_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_branch_bank_id ON public.branch USING btree (bank_id);


--
-- Name: idx_ca_account_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ca_account_id ON public.customer_account USING btree (account_id);


--
-- Name: idx_ca_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ca_customer_id ON public.customer_account USING btree (customer_id);


--
-- Name: idx_card_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_card_account ON public.card USING btree (account_id);


--
-- Name: idx_card_expiry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_card_expiry ON public.card USING btree (expiry_date);


--
-- Name: idx_card_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_card_status ON public.card USING btree (status);


--
-- Name: idx_card_txn_card; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_card_txn_card ON public.card_transaction USING btree (card_id);


--
-- Name: idx_card_txn_transaction; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_card_txn_transaction ON public.card_transaction USING btree (transaction_id);


--
-- Name: idx_collateral_loan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_collateral_loan ON public.collateral USING btree (loan_id);


--
-- Name: idx_collateral_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_collateral_status ON public.collateral USING btree (status);


--
-- Name: idx_currency_base; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_currency_base ON public.currency USING btree (is_base) WHERE (is_base = true);


--
-- Name: idx_customer_kyc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_kyc ON public.customer USING btree (kyc_status);


--
-- Name: idx_customer_manager; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_manager ON public.customer USING btree (relationship_manager_id);


--
-- Name: idx_customer_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_phone ON public.customer USING btree (phone_number);


--
-- Name: idx_customer_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_type ON public.customer USING btree (customer_type);


--
-- Name: idx_department_branch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_department_branch ON public.department USING btree (branch_id);


--
-- Name: idx_employee_branch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_branch ON public.employee USING btree (branch_id);


--
-- Name: idx_employee_manager; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_manager ON public.employee USING btree (manager_id);


--
-- Name: idx_exchange_rate_pair; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exchange_rate_pair ON public.exchange_rate USING btree (from_currency_id, to_currency_id);


--
-- Name: idx_fee_transaction; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fee_transaction ON public.transaction_fee USING btree (transaction_id);


--
-- Name: idx_guarantor_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_guarantor_customer ON public.guarantor USING btree (customer_id);


--
-- Name: idx_guarantor_loan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_guarantor_loan ON public.guarantor USING btree (loan_id);


--
-- Name: idx_loan_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loan_customer ON public.loan USING btree (customer_id);


--
-- Name: idx_loan_maturity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loan_maturity ON public.loan USING btree (maturity_date);


--
-- Name: idx_loan_payment_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loan_payment_date ON public.loan_payment USING btree (payment_date DESC);


--
-- Name: idx_loan_payment_loan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loan_payment_loan ON public.loan_payment USING btree (loan_id);


--
-- Name: idx_loan_payment_repayment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loan_payment_repayment ON public.loan_payment USING btree (repayment_id);


--
-- Name: idx_loan_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loan_status ON public.loan USING btree (status);


--
-- Name: idx_loan_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loan_type ON public.loan USING btree (loan_type);


--
-- Name: idx_notif_unread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_unread ON public.notification USING btree (user_id) WHERE (is_read = false);


--
-- Name: idx_notif_unsent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_unsent ON public.notification USING btree (created_at) WHERE (is_sent = false);


--
-- Name: idx_notif_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_user ON public.notification USING btree (user_id);


--
-- Name: idx_online_user_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_online_user_customer ON public.online_user USING btree (linked_customer_id);


--
-- Name: idx_online_user_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_online_user_employee ON public.online_user USING btree (linked_employee_id);


--
-- Name: idx_online_user_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_online_user_role ON public.online_user USING btree (role);


--
-- Name: idx_password_history_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_history_user ON public.password_history USING btree (user_id, changed_at DESC);


--
-- Name: idx_refund_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refund_account ON public.refund USING btree (account_id);


--
-- Name: idx_refund_original_txn; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refund_original_txn ON public.refund USING btree (original_transaction_id);


--
-- Name: idx_refund_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refund_status ON public.refund USING btree (status);


--
-- Name: idx_reval_collateral; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reval_collateral ON public.collateral_revaluation USING btree (collateral_id, revaluation_date DESC);


--
-- Name: idx_schedule_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedule_due_date ON public.repayment_schedule USING btree (due_date);


--
-- Name: idx_schedule_loan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedule_loan ON public.repayment_schedule USING btree (loan_id, installment_number);


--
-- Name: idx_schedule_overdue; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedule_overdue ON public.repayment_schedule USING btree (due_date) WHERE (status = 'PENDING'::public.repayment_status);


--
-- Name: idx_schedule_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedule_status ON public.repayment_schedule USING btree (status);


--
-- Name: idx_session_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_active ON public.session USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_session_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_token ON public.session USING btree (session_token);


--
-- Name: idx_session_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_user_id ON public.session USING btree (user_id);


--
-- Name: idx_so_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_so_account ON public.standing_order USING btree (account_id);


--
-- Name: idx_so_next_execution; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_so_next_execution ON public.standing_order USING btree (next_execution_date) WHERE (status = 'ACTIVE'::public.order_status);


--
-- Name: idx_txn_account_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_txn_account_date ON public.transaction USING btree (account_id, transaction_date DESC);


--
-- Name: idx_txn_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_txn_date ON public.transaction USING btree (transaction_date DESC);


--
-- Name: idx_txn_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_txn_employee ON public.transaction USING btree (processed_by_employee_id);


--
-- Name: idx_txn_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_txn_status ON public.transaction USING btree (status);


--
-- Name: idx_txn_to_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_txn_to_account ON public.transaction USING btree (to_account_id) WHERE (to_account_id IS NOT NULL);


--
-- Name: idx_txn_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_txn_type ON public.transaction USING btree (transaction_type);


--
-- Name: idx_utility_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_account ON public.utility_payment USING btree (account_id);


--
-- Name: idx_utility_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_customer ON public.utility_payment USING btree (customer_id);


--
-- Name: idx_utility_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_date ON public.utility_payment USING btree (payment_date DESC);


--
-- Name: idx_utility_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utility_type ON public.utility_payment USING btree (utility_type);


--
-- Name: account_type trg_account_type_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_account_type_updated_at BEFORE UPDATE ON public.account_type FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: account trg_account_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_account_updated_at BEFORE UPDATE ON public.account FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: atm trg_atm_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_atm_updated_at BEFORE UPDATE ON public.atm FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: audit_log trg_audit_log_immutable; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_log_immutable BEFORE DELETE OR UPDATE ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_immutable();


--
-- Name: bank trg_bank_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_bank_updated_at BEFORE UPDATE ON public.bank FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: beneficiary trg_beneficiary_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_beneficiary_updated_at BEFORE UPDATE ON public.beneficiary FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: branch trg_branch_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_branch_updated_at BEFORE UPDATE ON public.branch FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: card trg_card_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_card_updated_at BEFORE UPDATE ON public.card FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: charge_schedule trg_charge_schedule_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_charge_schedule_updated_at BEFORE UPDATE ON public.charge_schedule FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: collateral trg_collateral_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_collateral_updated_at BEFORE UPDATE ON public.collateral FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: customer trg_customer_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_customer_updated_at BEFORE UPDATE ON public.customer FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: department trg_department_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_department_updated_at BEFORE UPDATE ON public.department FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: employee trg_employee_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_employee_updated_at BEFORE UPDATE ON public.employee FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: guarantor trg_guarantor_not_borrower; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_guarantor_not_borrower BEFORE INSERT OR UPDATE ON public.guarantor FOR EACH ROW EXECUTE FUNCTION public.fn_check_guarantor_not_borrower();


--
-- Name: guarantor trg_guarantor_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_guarantor_updated_at BEFORE UPDATE ON public.guarantor FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: loan_application trg_loan_application_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_loan_application_updated_at BEFORE UPDATE ON public.loan_application FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: loan trg_loan_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_loan_updated_at BEFORE UPDATE ON public.loan FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: online_user trg_online_user_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_online_user_updated_at BEFORE UPDATE ON public.online_user FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: refund trg_refund_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_refund_updated_at BEFORE UPDATE ON public.refund FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: repayment_schedule trg_repayment_schedule_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_repayment_schedule_updated_at BEFORE UPDATE ON public.repayment_schedule FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: standing_order trg_standing_order_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_standing_order_updated_at BEFORE UPDATE ON public.standing_order FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: account account_account_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_account_type_id_fkey FOREIGN KEY (account_type_id) REFERENCES public.account_type(account_type_id) ON DELETE RESTRICT;


--
-- Name: account account_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: account account_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currency(currency_id) ON DELETE RESTRICT;


--
-- Name: account account_opened_by_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_opened_by_employee_id_fkey FOREIGN KEY (opened_by_employee_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- Name: atm atm_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atm
    ADD CONSTRAINT atm_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: atm atm_last_refill_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atm
    ADD CONSTRAINT atm_last_refill_by_id_fkey FOREIGN KEY (last_refill_by_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- Name: atm_transaction atm_transaction_atm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atm_transaction
    ADD CONSTRAINT atm_transaction_atm_id_fkey FOREIGN KEY (atm_id) REFERENCES public.atm(atm_id) ON DELETE RESTRICT;


--
-- Name: atm_transaction atm_transaction_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atm_transaction
    ADD CONSTRAINT atm_transaction_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transaction(transaction_id) ON DELETE RESTRICT;


--
-- Name: audit_log audit_log_performed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_performed_by_user_id_fkey FOREIGN KEY (performed_by_user_id) REFERENCES public.online_user(user_id) ON DELETE SET NULL;


--
-- Name: beneficiary beneficiary_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary
    ADD CONSTRAINT beneficiary_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE RESTRICT;


--
-- Name: branch branch_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES public.bank(bank_id) ON DELETE RESTRICT;


--
-- Name: branch branch_parent_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_parent_branch_id_fkey FOREIGN KEY (parent_branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: card card_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.card
    ADD CONSTRAINT card_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(account_id) ON DELETE RESTRICT;


--
-- Name: card card_blocked_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.card
    ADD CONSTRAINT card_blocked_by_id_fkey FOREIGN KEY (blocked_by_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- Name: card card_issued_by_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.card
    ADD CONSTRAINT card_issued_by_branch_id_fkey FOREIGN KEY (issued_by_branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: card_transaction card_transaction_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.card_transaction
    ADD CONSTRAINT card_transaction_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.card(card_id) ON DELETE RESTRICT;


--
-- Name: card_transaction card_transaction_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.card_transaction
    ADD CONSTRAINT card_transaction_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transaction(transaction_id) ON DELETE RESTRICT;


--
-- Name: collateral collateral_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collateral
    ADD CONSTRAINT collateral_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loan(loan_id) ON DELETE RESTRICT;


--
-- Name: collateral_revaluation collateral_revaluation_collateral_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collateral_revaluation
    ADD CONSTRAINT collateral_revaluation_collateral_id_fkey FOREIGN KEY (collateral_id) REFERENCES public.collateral(collateral_id) ON DELETE RESTRICT;


--
-- Name: collateral_revaluation collateral_revaluation_revalued_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collateral_revaluation
    ADD CONSTRAINT collateral_revaluation_revalued_by_id_fkey FOREIGN KEY (revalued_by_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- Name: collateral collateral_valued_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collateral
    ADD CONSTRAINT collateral_valued_by_id_fkey FOREIGN KEY (valued_by_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- Name: customer_account customer_account_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_account
    ADD CONSTRAINT customer_account_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(account_id) ON DELETE RESTRICT;


--
-- Name: customer_account customer_account_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_account
    ADD CONSTRAINT customer_account_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE RESTRICT;


--
-- Name: customer customer_relationship_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_relationship_manager_id_fkey FOREIGN KEY (relationship_manager_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- Name: department department_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT department_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: department department_manager_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT department_manager_employee_id_fkey FOREIGN KEY (manager_employee_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- Name: employee employee_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: employee employee_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- Name: exchange_rate exchange_rate_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_rate
    ADD CONSTRAINT exchange_rate_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- Name: exchange_rate exchange_rate_from_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_rate
    ADD CONSTRAINT exchange_rate_from_currency_id_fkey FOREIGN KEY (from_currency_id) REFERENCES public.currency(currency_id) ON DELETE RESTRICT;


--
-- Name: exchange_rate exchange_rate_to_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_rate
    ADD CONSTRAINT exchange_rate_to_currency_id_fkey FOREIGN KEY (to_currency_id) REFERENCES public.currency(currency_id) ON DELETE RESTRICT;


--
-- Name: employee fk_employee_department; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT fk_employee_department FOREIGN KEY (department_id) REFERENCES public.department(department_id) ON DELETE SET NULL;


--
-- Name: guarantor guarantor_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guarantor
    ADD CONSTRAINT guarantor_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE RESTRICT;


--
-- Name: guarantor guarantor_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guarantor
    ADD CONSTRAINT guarantor_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loan(loan_id) ON DELETE RESTRICT;


--
-- Name: interest_accrual interest_accrual_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interest_accrual
    ADD CONSTRAINT interest_accrual_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(account_id) ON DELETE RESTRICT;


--
-- Name: interest_accrual interest_accrual_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interest_accrual
    ADD CONSTRAINT interest_accrual_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transaction(transaction_id) ON DELETE SET NULL;


--
-- Name: loan_application loan_application_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan_application
    ADD CONSTRAINT loan_application_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE RESTRICT;


--
-- Name: loan loan_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan
    ADD CONSTRAINT loan_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.loan_application(application_id) ON DELETE RESTRICT;


--
-- Name: loan_application loan_application_reviewed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan_application
    ADD CONSTRAINT loan_application_reviewed_by_id_fkey FOREIGN KEY (reviewed_by_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- Name: loan loan_approved_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan
    ADD CONSTRAINT loan_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- Name: loan loan_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan
    ADD CONSTRAINT loan_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE RESTRICT;


--
-- Name: loan loan_disbursed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan
    ADD CONSTRAINT loan_disbursed_by_id_fkey FOREIGN KEY (disbursed_by_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- Name: loan loan_disbursement_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan
    ADD CONSTRAINT loan_disbursement_account_id_fkey FOREIGN KEY (disbursement_account_id) REFERENCES public.account(account_id) ON DELETE RESTRICT;


--
-- Name: loan loan_disbursement_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan
    ADD CONSTRAINT loan_disbursement_transaction_id_fkey FOREIGN KEY (disbursement_transaction_id) REFERENCES public.transaction(transaction_id) ON DELETE SET NULL;


--
-- Name: loan_payment loan_payment_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan_payment
    ADD CONSTRAINT loan_payment_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loan(loan_id) ON DELETE RESTRICT;


--
-- Name: loan_payment loan_payment_processed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan_payment
    ADD CONSTRAINT loan_payment_processed_by_id_fkey FOREIGN KEY (processed_by_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- Name: loan_payment loan_payment_repayment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan_payment
    ADD CONSTRAINT loan_payment_repayment_id_fkey FOREIGN KEY (repayment_id) REFERENCES public.repayment_schedule(repayment_id) ON DELETE RESTRICT;


--
-- Name: loan_payment loan_payment_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan_payment
    ADD CONSTRAINT loan_payment_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transaction(transaction_id) ON DELETE RESTRICT;


--
-- Name: notification notification_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.online_user(user_id) ON DELETE CASCADE;


--
-- Name: online_user online_user_linked_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.online_user
    ADD CONSTRAINT online_user_linked_customer_id_fkey FOREIGN KEY (linked_customer_id) REFERENCES public.customer(customer_id) ON DELETE CASCADE;


--
-- Name: online_user online_user_linked_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.online_user
    ADD CONSTRAINT online_user_linked_employee_id_fkey FOREIGN KEY (linked_employee_id) REFERENCES public.employee(employee_id) ON DELETE CASCADE;


--
-- Name: password_history password_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_history
    ADD CONSTRAINT password_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.online_user(user_id) ON DELETE CASCADE;


--
-- Name: refund refund_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund
    ADD CONSTRAINT refund_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(account_id) ON DELETE RESTRICT;


--
-- Name: refund refund_approved_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund
    ADD CONSTRAINT refund_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- Name: refund refund_original_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund
    ADD CONSTRAINT refund_original_transaction_id_fkey FOREIGN KEY (original_transaction_id) REFERENCES public.transaction(transaction_id) ON DELETE RESTRICT;


--
-- Name: refund refund_processed_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund
    ADD CONSTRAINT refund_processed_transaction_id_fkey FOREIGN KEY (processed_transaction_id) REFERENCES public.transaction(transaction_id) ON DELETE RESTRICT;


--
-- Name: refund refund_requested_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund
    ADD CONSTRAINT refund_requested_by_id_fkey FOREIGN KEY (requested_by_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- Name: repayment_schedule repayment_schedule_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repayment_schedule
    ADD CONSTRAINT repayment_schedule_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loan(loan_id) ON DELETE RESTRICT;


--
-- Name: session session_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.online_user(user_id) ON DELETE CASCADE;


--
-- Name: standing_order standing_order_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.standing_order
    ADD CONSTRAINT standing_order_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(account_id) ON DELETE RESTRICT;


--
-- Name: standing_order standing_order_beneficiary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.standing_order
    ADD CONSTRAINT standing_order_beneficiary_id_fkey FOREIGN KEY (beneficiary_id) REFERENCES public.beneficiary(beneficiary_id) ON DELETE RESTRICT;


--
-- Name: standing_order standing_order_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.standing_order
    ADD CONSTRAINT standing_order_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currency(currency_id) ON DELETE RESTRICT;


--
-- Name: transaction transaction_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction
    ADD CONSTRAINT transaction_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(account_id) ON DELETE RESTRICT;


--
-- Name: transaction transaction_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction
    ADD CONSTRAINT transaction_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currency(currency_id) ON DELETE RESTRICT;


--
-- Name: transaction_fee transaction_fee_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_fee
    ADD CONSTRAINT transaction_fee_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currency(currency_id) ON DELETE RESTRICT;


--
-- Name: transaction_fee transaction_fee_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_fee
    ADD CONSTRAINT transaction_fee_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.charge_schedule(schedule_id) ON DELETE SET NULL;


--
-- Name: transaction_fee transaction_fee_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_fee
    ADD CONSTRAINT transaction_fee_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transaction(transaction_id) ON DELETE RESTRICT;


--
-- Name: transaction transaction_processed_by_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction
    ADD CONSTRAINT transaction_processed_by_employee_id_fkey FOREIGN KEY (processed_by_employee_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- Name: transaction transaction_reversed_by_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction
    ADD CONSTRAINT transaction_reversed_by_transaction_id_fkey FOREIGN KEY (reversed_by_transaction_id) REFERENCES public.transaction(transaction_id) ON DELETE RESTRICT;


--
-- Name: transaction transaction_settled_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction
    ADD CONSTRAINT transaction_settled_currency_id_fkey FOREIGN KEY (settled_currency_id) REFERENCES public.currency(currency_id) ON DELETE RESTRICT;


--
-- Name: transaction transaction_to_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction
    ADD CONSTRAINT transaction_to_account_id_fkey FOREIGN KEY (to_account_id) REFERENCES public.account(account_id) ON DELETE RESTRICT;


--
-- Name: utility_payment utility_payment_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_payment
    ADD CONSTRAINT utility_payment_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(account_id) ON DELETE RESTRICT;


--
-- Name: utility_payment utility_payment_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_payment
    ADD CONSTRAINT utility_payment_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currency(currency_id) ON DELETE RESTRICT;


--
-- Name: utility_payment utility_payment_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_payment
    ADD CONSTRAINT utility_payment_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE RESTRICT;


--
-- Name: utility_payment utility_payment_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utility_payment
    ADD CONSTRAINT utility_payment_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transaction(transaction_id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict A6pVHz9h32MFQNv5yapTK8WeoebQIRuQNxvDf6WxcAtiftglLvzYhjd8YgitE84

