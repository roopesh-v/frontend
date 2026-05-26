import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import EmployeeForm from "../components/EmployeeForm";
import "./Employees.css";

function getEmployeesFromResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.employees)) return data.employees;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

function getEmployeeId(emp) {
  return emp?.id ?? emp?._id ?? null;
}

function getEmployeeFullName(emp) {
  const first = emp?.firstName ?? emp?.first_name ?? "";
  const last = emp?.lastName ?? emp?.last_name ?? "";
  return (
    (emp?.fullName ?? emp?.name ?? `${first} ${last}`.trim()) || "this employee"
  );
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const refreshEmployees = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await api.get("/employees");
      setEmployees(getEmployeesFromResponse(res?.data));
    } catch (e) {
      setError(e?.message || "Failed to load employees");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const handleDelete = useCallback(
    async (emp) => {
      const id = getEmployeeId(emp);
      if (!id) return;

      const fullName = getEmployeeFullName(emp);
      const confirmed = window.confirm(
        `Delete ${fullName}? This action cannot be undone.`
      );
      if (!confirmed) return;

      setDeletingId(id);
      setError(null);
      try {
        await api.delete(`/employees/${id}`);
        await refreshEmployees({ silent: true });
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e?.response?.data?.error ||
            e?.message ||
            "Failed to delete employee"
        );
      } finally {
        setDeletingId(null);
      }
    },
    [refreshEmployees]
  );

  useEffect(() => {
    refreshEmployees();
  }, [refreshEmployees]);

  return (
    <section className="employeesPage">
      <div className="employeesHeader">
        <div>
          <h1 className="employeesTitle">Employees</h1>
          <p className="employeesSubtitle">Directory and compensation overview</p>
        </div>
        <div className="employeesMeta">
          {loading ? "Loading…" : `${employees.length} total`}
        </div>
      </div>

      <div className="employeesFormWrap">
        <EmployeeForm onSuccess={refreshEmployees} />
      </div>

      <div className="employeesCard">
        {loading ? (
          <div className="employeesState">
            <div className="employeesSpinner" aria-hidden="true" />
            <div>
              <div className="employeesStateTitle">Fetching employees</div>
              <div className="employeesStateHint">
                This should only take a moment.
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="employeesState employeesState--error" role="alert">
            <div className="employeesStateTitle">Couldn’t load employees</div>
            <div className="employeesStateHint">{error}</div>
          </div>
        ) : employees.length === 0 ? (
          <div className="employeesState">
            <div className="employeesStateTitle">No employees found</div>
            <div className="employeesStateHint">
              The API returned an empty list.
            </div>
          </div>
        ) : (
          <div className="employeesTableWrap">
            <table className="employeesTable">
              <thead>
                <tr>
                  <th scope="col">Full name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Country</th>
                  <th scope="col">Job title</th>
                  <th scope="col" className="is-right">
                    Salary
                  </th>
                  <th scope="col" className="is-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, idx) => {
                  const id = getEmployeeId(emp);
                  const fullName = getEmployeeFullName(emp);
                  const email = emp?.email ?? "—";
                  const country = emp?.country ?? emp?.location?.country ?? "—";
                  const jobTitle =
                    emp?.jobTitle ?? emp?.job_title ?? emp?.title ?? "—";
                  const salary = emp?.salary ?? emp?.compensation?.salary;
                  const isDeleting = deletingId === id;

                  return (
                    <tr key={id ?? `${email}-${idx}`}>
                      <td className="employeesName">{fullName}</td>
                      <td className="employeesEmail">{email}</td>
                      <td>{country}</td>
                      <td>{jobTitle}</td>
                      <td className="is-right employeesSalary">
                        {formatMoney(salary)}
                      </td>
                      <td className="is-right employeesActions">
                        <button
                          type="button"
                          className="employeesDeleteBtn"
                          onClick={() => handleDelete(emp)}
                          disabled={!id || isDeleting}
                          aria-label={`Delete ${fullName}`}
                        >
                          {isDeleting ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
