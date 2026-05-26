import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import EmployeeForm, { employeeToFormValues } from "../components/EmployeeForm";
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

function getEmployeeCountry(emp) {
  return emp?.country ?? emp?.location?.country ?? "";
}

function matchesNameSearch(emp, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const first = (emp?.firstName ?? emp?.first_name ?? "").toLowerCase();
  const last = (emp?.lastName ?? emp?.last_name ?? "").toLowerCase();
  const full = getEmployeeFullName(emp).toLowerCase();

  return full.includes(q) || first.includes(q) || last.includes(q);
}

function matchesCountryFilter(emp, country) {
  if (!country) return true;
  return getEmployeeCountry(emp) === country;
}

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 10;

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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
        setEditingEmployee((current) =>
          getEmployeeId(current) === id ? null : current
        );
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

  const handleFormSuccess = useCallback(async () => {
    setEditingEmployee(null);
    await refreshEmployees({ silent: true });
  }, [refreshEmployees]);

  const editingId = editingEmployee ? getEmployeeId(editingEmployee) : null;

  useEffect(() => {
    refreshEmployees();
  }, [refreshEmployees]);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(searchQuery),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, countryFilter]);

  const countryOptions = useMemo(() => {
    const countries = employees.map(getEmployeeCountry).filter(Boolean);
    return [...new Set(countries)].sort((a, b) => a.localeCompare(b));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (emp) =>
        matchesNameSearch(emp, debouncedSearch) &&
        matchesCountryFilter(emp, countryFilter)
    );
  }, [employees, debouncedSearch, countryFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / PAGE_SIZE)
  );
  const activePage = Math.min(currentPage, totalPages);

  const paginatedEmployees = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE;
    return filteredEmployees.slice(start, start + PAGE_SIZE);
  }, [filteredEmployees, activePage]);

  const rangeStart =
    filteredEmployees.length === 0 ? 0 : (activePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(activePage * PAGE_SIZE, filteredEmployees.length);

  const isFiltering =
    debouncedSearch.trim().length > 0 || countryFilter !== "";
  const countLabel = loading
    ? "Loading…"
    : isFiltering
      ? `${filteredEmployees.length} of ${employees.length}`
      : `${employees.length} total`;

  return (
    <section className="employeesPage">
      <div className="employeesHeader">
        <div>
          <h1 className="employeesTitle">Employees</h1>
          <p className="employeesSubtitle">Directory and compensation overview</p>
        </div>
        <div className="employeesMeta">{countLabel}</div>
      </div>

      <div className="employeesFormWrap" id="employee-form">
        <EmployeeForm
          key={editingId ?? "new"}
          employeeId={editingId}
          initialValues={
            editingEmployee ? employeeToFormValues(editingEmployee) : undefined
          }
          onSuccess={handleFormSuccess}
          onCancel={() => setEditingEmployee(null)}
        />
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
          <>
            <div className="employeesToolbar">
              <div className="employeesFilters">
                <label className="employeesSearch" htmlFor="employee-search">
                  <span className="employeesSearchLabel">Search by name</span>
                  <input
                    id="employee-search"
                    type="search"
                    className="employeesSearchInput"
                    placeholder="Search employees…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                  />
                </label>
                <label className="employeesFilter" htmlFor="employee-country">
                  <span className="employeesSearchLabel">Country</span>
                  <select
                    id="employee-country"
                    className="employeesSelect"
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                  >
                    <option value="">All countries</option>
                    {countryOptions.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {searchQuery !== debouncedSearch && (
                <span className="employeesSearchPending" aria-live="polite">
                  Searching…
                </span>
              )}
            </div>

            {filteredEmployees.length === 0 ? (
              <div className="employeesState">
                <div className="employeesStateTitle">No matching employees</div>
                <div className="employeesStateHint">
                  Try different filters or clear your search and country selection.
                </div>
              </div>
            ) : (
          <>
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
                {paginatedEmployees.map((emp, idx) => {
                  const id = getEmployeeId(emp);
                  const fullName = getEmployeeFullName(emp);
                  const email = emp?.email ?? "—";
                  const country = getEmployeeCountry(emp) || "—";
                  const jobTitle =
                    emp?.jobTitle ?? emp?.job_title ?? emp?.title ?? "—";
                  const salary = emp?.salary ?? emp?.compensation?.salary;
                  const isDeleting = deletingId === id;
                  const isEditing = editingId === id;

                  return (
                    <tr
                      key={id ?? `${email}-${idx}`}
                      className={isEditing ? "employeesRow--editing" : undefined}
                    >
                      <td className="employeesName">{fullName}</td>
                      <td className="employeesEmail">{email}</td>
                      <td>{country}</td>
                      <td>{jobTitle}</td>
                      <td className="is-right employeesSalary">
                        {formatMoney(salary)}
                      </td>
                      <td className="is-right employeesActions">
                        <div className="employeesActionGroup">
                          <button
                            type="button"
                            className="employeesEditBtn"
                            onClick={() => {
                              setEditingEmployee(emp);
                              document
                                .getElementById("employee-form")
                                ?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            disabled={!id || isDeleting}
                            aria-label={`Edit ${fullName}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="employeesDeleteBtn"
                            onClick={() => handleDelete(emp)}
                            disabled={!id || isDeleting}
                            aria-label={`Delete ${fullName}`}
                          >
                            {isDeleting ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

            {totalPages > 1 && (
              <nav
                className="employeesPagination"
                aria-label="Employee list pagination"
              >
                <p className="employeesPaginationInfo">
                  Showing {rangeStart}–{rangeEnd} of {filteredEmployees.length}
                </p>
                <div className="employeesPaginationControls">
                  <button
                    type="button"
                    className="employeesPaginationBtn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={activePage <= 1}
                  >
                    Previous
                  </button>
                  <span className="employeesPaginationStatus">
                    Page {activePage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="employeesPaginationBtn"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={activePage >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </nav>
            )}
          </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
