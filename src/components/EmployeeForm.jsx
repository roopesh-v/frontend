import { useMemo, useState } from "react";
import api from "../api/axios";
import "./EmployeeForm.css";

const EMPTY = Object.freeze({
  first_name: "",
  last_name: "",
  email: "",
  country: "",
  job_title: "",
  department: "",
  salary: "",
});

function normalizeRailsErrors(payload) {
  if (!payload) return {};

  // Common Rails shapes:
  // - { errors: { field: ["msg"] } }
  // - { errors: ["msg1", "msg2"] }
  // - { error: "msg" }
  const errors = payload.errors ?? payload.error ?? payload;

  if (Array.isArray(errors)) return { _base: errors };

  if (typeof errors === "object" && errors !== null) {
    const out = {};
    for (const [key, value] of Object.entries(errors)) {
      out[key] = Array.isArray(value) ? value : [String(value)];
    }
    return out;
  }

  if (typeof errors === "string") return { _base: [errors] };
  return {};
}

export default function EmployeeForm({
  onSuccess,
  initialValues,
  submitLabel = "Create employee",
  title = "New employee",
}) {
  const initial = useMemo(() => ({ ...EMPTY, ...(initialValues || {}) }), [initialValues]);
  const [values, setValues] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  function setField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev?.[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setSuccessMessage("");

    try {
      const payload = {
        employee: {
          ...values,
          salary: values.salary === "" ? null : Number(values.salary),
        },
      };

      await api.post("/employees", payload);

      setValues({ ...EMPTY });
      setSuccessMessage("Employee created.");
      if (typeof onSuccess === "function") onSuccess();
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 422) {
        setErrors(normalizeRailsErrors(data));
      } else {
        setErrors({
          _base: [data?.message || err?.message || "Something went wrong."],
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const baseErrors = errors?._base || [];

  return (
    <section className="employeeFormCard">
      <header className="employeeFormHeader">
        <h2 className="employeeFormTitle">{title}</h2>
        <p className="employeeFormSubtitle">Fill in the details below to add an employee.</p>
      </header>

      {baseErrors.length > 0 && (
        <div className="employeeFormAlert" role="alert">
          <div className="employeeFormAlertTitle">Please fix the errors</div>
          <ul className="employeeFormAlertList">
            {baseErrors.map((m, i) => (
              <li key={`${m}-${i}`}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {successMessage && (
        <div className="employeeFormToast" role="status">
          {successMessage}
        </div>
      )}

      <form className="employeeForm" onSubmit={onSubmit}>
        <div className="employeeFormGrid">
          <Field
            label="First name"
            name="first_name"
            value={values.first_name}
            error={errors.first_name}
            onChange={setField}
            autoComplete="given-name"
          />
          <Field
            label="Last name"
            name="last_name"
            value={values.last_name}
            error={errors.last_name}
            onChange={setField}
            autoComplete="family-name"
          />
          <Field
            label="Email"
            name="email"
            type="email"
            value={values.email}
            error={errors.email}
            onChange={setField}
            autoComplete="email"
          />
          <Field
            label="Country"
            name="country"
            value={values.country}
            error={errors.country}
            onChange={setField}
            autoComplete="country-name"
          />
          <Field
            label="Job title"
            name="job_title"
            value={values.job_title}
            error={errors.job_title}
            onChange={setField}
          />
          <Field
            label="Department"
            name="department"
            value={values.department}
            error={errors.department}
            onChange={setField}
          />
          <Field
            label="Salary"
            name="salary"
            type="number"
            inputMode="numeric"
            value={values.salary}
            error={errors.salary}
            onChange={setField}
            placeholder="e.g. 85000"
          />
        </div>

        <div className="employeeFormActions">
          <button className="employeeFormSubmit" type="submit" disabled={submitting}>
            {submitting ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  name,
  value,
  error,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
}) {
  const id = `employeeForm_${name}`;
  const message = Array.isArray(error) ? error[0] : null;

  return (
    <div className={`employeeFormField ${message ? "has-error" : ""}`}>
      <label className="employeeFormLabel" htmlFor={id}>
        {label}
      </label>
      <input
        className="employeeFormInput"
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        aria-invalid={message ? "true" : "false"}
        aria-describedby={message ? `${id}__error` : undefined}
      />
      {message && (
        <div className="employeeFormError" id={`${id}__error`}>
          {message}
        </div>
      )}
    </div>
  );
}
