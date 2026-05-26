import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/axios";
import "./Dashboard.css";

function getInsightsFromResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.insights)) return data.insights;
  if (Array.isArray(data?.countries)) return data.countries;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getEmployeesFromResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.employees)) return data.employees;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getEmployeeSalary(emp) {
  const salary = emp?.salary ?? emp?.compensation?.salary;
  const num = Number(salary);
  return Number.isNaN(num) ? null : num;
}

function getBucketSize(min, max) {
  const range = max - min;
  if (range <= 50_000) return 10_000;
  if (range <= 150_000) return 25_000;
  return 50_000;
}

function formatRangeLabel(lo, hi) {
  return `${formatAxisMoney(lo)}–${formatAxisMoney(hi)}`;
}

function buildSalaryDistribution(salaries) {
  if (salaries.length === 0) return [];

  const min = Math.min(...salaries);
  const max = Math.max(...salaries);
  const bucketSize = getBucketSize(min, max);
  const rangeStart = Math.floor(min / bucketSize) * bucketSize;
  const rangeEnd = Math.ceil(max / bucketSize) * bucketSize;

  const buckets = [];
  for (let lo = rangeStart; lo < rangeEnd; lo += bucketSize) {
    const hi = lo + bucketSize;
    buckets.push({
      range: formatRangeLabel(lo, hi),
      rangeStart: lo,
      count: 0,
    });
  }

  for (const salary of salaries) {
    const index = Math.min(
      Math.floor((salary - rangeStart) / bucketSize),
      buckets.length - 1
    );
    if (index >= 0) buckets[index].count += 1;
  }

  return buckets;
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

function formatAxisMoney(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1000) return `$${Math.round(num / 1000)}k`;
  return formatMoney(num);
}

function getInsightFields(item) {
  return {
    country: item?.country ?? "—",
    minSalary: item?.min_salary ?? item?.minSalary ?? item?.minimum_salary,
    maxSalary: item?.max_salary ?? item?.maxSalary ?? item?.maximum_salary,
    averageSalary:
      item?.average_salary ??
      item?.avg_salary ??
      item?.averageSalary ??
      item?.mean_salary,
    totalEmployees:
      item?.total_employees ??
      item?.employee_count ??
      item?.totalEmployees ??
      item?.count,
  };
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid rgba(15, 23, 42, 0.10)",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)",
};

export default function Dashboard() {
  const [insights, setInsights] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [insightsRes, employeesRes] = await Promise.all([
          api.get("/insights/country"),
          api.get("/employees"),
        ]);
        if (!mounted) return;
        setInsights(getInsightsFromResponse(insightsRes?.data));
        setEmployees(getEmployeesFromResponse(employeesRes?.data));
      } catch (e) {
        if (mounted) {
          setError(e?.message || "Failed to load dashboard data");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const chartData = useMemo(() => {
    return insights
      .map((item) => {
        const { country, averageSalary } = getInsightFields(item);
        const avg = Number(averageSalary);
        return {
          country,
          averageSalary: Number.isNaN(avg) ? null : avg,
        };
      })
      .filter((row) => row.averageSalary != null)
      .sort((a, b) => b.averageSalary - a.averageSalary);
  }, [insights]);

  const salaryDistributionData = useMemo(() => {
    const salaries = employees
      .map(getEmployeeSalary)
      .filter((s) => s != null);
    return buildSalaryDistribution(salaries);
  }, [employees]);

  return (
    <section className="dashboardPage">
      <div className="dashboardHeader">
        <div>
          <h1 className="dashboardTitle">Dashboard</h1>
          <p className="dashboardSubtitle">
            Salary and headcount insights by country
          </p>
        </div>
        <div className="dashboardMeta">
          {loading ? "Loading…" : `${insights.length} countries`}
        </div>
      </div>

      {loading ? (
        <div className="dashboardState">
          <div className="dashboardSpinner" aria-hidden="true" />
          <div>
            <div className="dashboardStateTitle">Fetching insights</div>
            <div className="dashboardStateHint">This should only take a moment.</div>
          </div>
        </div>
      ) : error ? (
        <div className="dashboardState dashboardState--error" role="alert">
          <div className="dashboardStateTitle">Couldn’t load insights</div>
          <div className="dashboardStateHint">{error}</div>
        </div>
      ) : insights.length === 0 ? (
        <div className="dashboardState">
          <div className="dashboardStateTitle">No insights found</div>
          <div className="dashboardStateHint">
            The API returned an empty list.
          </div>
        </div>
      ) : (
        <>
          <div className="dashboardCharts">
            {chartData.length > 0 && (
              <div className="dashboardChartPanel">
                <h2 className="dashboardChartTitle">Average salary by country</h2>
                <div className="dashboardChartWrap">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={chartData}
                      margin={{ top: 12, right: 12, left: 4, bottom: 64 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(15, 23, 42, 0.08)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="country"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(15, 23, 42, 0.12)" }}
                        tickLine={false}
                        angle={-35}
                        textAnchor="end"
                        height={70}
                        interval={0}
                      />
                      <YAxis
                        tickFormatter={formatAxisMoney}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={56}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(37, 99, 235, 0.08)" }}
                        contentStyle={tooltipStyle}
                        formatter={(value) => [
                          formatMoney(value),
                          "Average salary",
                        ]}
                        labelFormatter={(label) => String(label)}
                      />
                      <Bar
                        dataKey="averageSalary"
                        fill="#2563eb"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={56}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {salaryDistributionData.length > 0 && (
              <div className="dashboardChartPanel">
                <h2 className="dashboardChartTitle">Salary distribution</h2>
                <p className="dashboardChartHint">
                  Number of employees in each salary range
                </p>
                <div className="dashboardChartWrap">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={salaryDistributionData}
                      margin={{ top: 12, right: 12, left: 4, bottom: 64 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(15, 23, 42, 0.08)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="range"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={{ stroke: "rgba(15, 23, 42, 0.12)" }}
                        tickLine={false}
                        angle={-35}
                        textAnchor="end"
                        height={70}
                        interval={0}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                        label={{
                          value: "Employees",
                          angle: -90,
                          position: "insideLeft",
                          fill: "#64748b",
                          fontSize: 12,
                        }}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
                        contentStyle={tooltipStyle}
                        formatter={(value) => [value, "Employees"]}
                        labelFormatter={(label) => `Range: ${label}`}
                      />
                      <Bar
                        dataKey="count"
                        fill="#10b981"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          <div className="dashboardGrid">
          {insights.map((item, idx) => {
            const {
              country,
              minSalary,
              maxSalary,
              averageSalary,
              totalEmployees,
            } = getInsightFields(item);

            return (
              <article
                key={`${country}-${idx}`}
                className="dashboardCard"
              >
                <header className="dashboardCardHeader">
                  <h2 className="dashboardCardCountry">{country}</h2>
                  <span className="dashboardCardBadge">
                    {totalEmployees != null ? totalEmployees : "—"} employees
                  </span>
                </header>

                <dl className="dashboardCardStats">
                  <div className="dashboardStat">
                    <dt>Min salary</dt>
                    <dd>{formatMoney(minSalary)}</dd>
                  </div>
                  <div className="dashboardStat">
                    <dt>Max salary</dt>
                    <dd>{formatMoney(maxSalary)}</dd>
                  </div>
                  <div className="dashboardStat dashboardStat--highlight">
                    <dt>Average salary</dt>
                    <dd>{formatMoney(averageSalary)}</dd>
                  </div>
                  <div className="dashboardStat">
                    <dt>Total employees</dt>
                    <dd>{totalEmployees ?? "—"}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
          </div>
        </>
      )}
    </section>
  );
}
