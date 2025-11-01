"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FaUpload, FaPlus, FaSearch, FaEdit, FaTrash } from "react-icons/fa";

const API = `${
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
}/partners/`;

const UPLOAD_API = `${
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
}/upload-excel/`;

const emptyForm = {
  firm_name: "",
  hq: "",
  focus_area: "",
  contact: "",
  sector: "",
  donor_experience: "",
  current_partnership_status: "",
};

export default function AdminUI() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Excel upload states
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadErrors, setUploadErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // New: search state for client-side filtering
  const [search, setSearch] = useState("");

  // Fetch data
  const fetchRows = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching from:", API);
      const res = await fetch(API, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `HTTP error! Status: ${res.status}, Message: ${errorText}`
        );
      }
      const data = await res.json();
      setRows(data.results || data); // Handle pagination & non-pagination
    } catch (err) {
      console.error("Error fetching rows:", err);
      setError(err.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  // client-side filtered rows (search across name, hq, contact)
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        (r.firm_name || "").toLowerCase().includes(q) ||
        (r.hq || "").toLowerCase().includes(q) ||
        (r.contact || "").toLowerCase().includes(q) ||
        (r.focus_area || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  // Save new or edit partner
  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API}${editingId}/` : API;
      console.log("Saving to:", url, "Method:", method);
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `HTTP error! Status: ${res.status}, Message: ${errorText}`
        );
      }
      setForm(emptyForm);
      setEditingId(null);
      await fetchRows();
    } catch (err) {
      console.error("Error saving:", err);
      setError(`Failed to save: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Edit row
  const editRow = (r) => {
    setForm({
      firm_name: r.firm_name || "",
      hq: r.hq || "",
      focus_area: r.focus_area || "",
      contact: r.contact || "",
      sector: r.sector || "",
      donor_experience: r.donor_experience || "",
      current_partnership_status: r.current_partnership_status || "",
    });
    setEditingId(r.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete row
  const del = async (id) => {
    if (!confirm("Delete this partner?")) return;
    setError(null);
    try {
      const url = `${API}${id}/`;
      console.log("Deleting:", url);
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `HTTP error! Status: ${res.status}, Message: ${errorText}`
        );
      }
      await fetchRows();
    } catch (err) {
      console.error("Error deleting:", err);
      setError(`Failed to delete: ${err.message}`);
    }
  };

  // File change
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadMessage("");
    setUploadErrors([]);
    setError(null);
  };

  // Upload Excel
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadMessage("Please select an Excel file");
      return;
    }
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      console.log("Uploading to:", UPLOAD_API);
      const response = await axios.post(UPLOAD_API, formData);

      setUploadMessage("Uploaded successfully!");
      if (response.data.skipped) {
        setUploadErrors(response.data.skipped);
      }
      setFile(null);
      await fetchRows();
    } catch (error) {
      console.error("Error uploading:", error);
      setUploadMessage(error.response?.data?.error || "Upload failed");
      setUploadErrors([]);
      setError(error.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Top header: title, search and create button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Create Firms
          </h1>
          <p className="text-sm text-gray-500">Manage partner firms quickly</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <FaSearch />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search firms, HQ, contact or focus area..."
              className="pl-10 pr-4 py-2 w-full sm:w-80 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-600 text-white rounded-lg shadow hover:from-blue-600 hover:to-indigo-500 transition"
          >
            <FaPlus />
            New
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left: Create/Edit form card */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
            {editingId ? "Edit Firm" : "Add Firm"}
          </h2>
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Firm Name *
              </label>
              <input
                required
                value={form.firm_name}
                onChange={(e) =>
                  setForm({ ...form, firm_name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                HQ (Country)
              </label>
              <input
                value={form.hq}
                onChange={(e) => setForm({ ...form, hq: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Contact
              </label>
              <input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Current Partnership Status
              </label>
              <input
                value={form.current_partnership_status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    current_partnership_status: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Sector
              </label>
              <input
                value={form.current_partnership_status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sector: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Focus Area
              </label>
              <textarea
                rows={3}
                value={form.focus_area}
                onChange={(e) =>
                  setForm({ ...form, focus_area: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Donor Experience
              </label>
              <textarea
                rows={3}
                value={form.donor_experience}
                onChange={(e) =>
                  setForm({ ...form, donor_experience: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition"
              >
                {editingId ? (
                  <>
                    <FaEdit /> Update
                  </>
                ) : (
                  <>
                    <FaPlus /> Create
                  </>
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  className="px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right: Upload card spanning two columns on large screens */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100">
                  Bulk Upload
                </h3>
                <p className="text-sm text-gray-500">
                  Upload an Excel file to import multiple partners
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {file ? file.name : null}
              </div>
            </div>

            <form onSubmit={handleUpload}>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10"
                    : "border-gray-200 dark:border-gray-700"
                } hover:border-indigo-400 dark:hover:border-indigo-500`}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  if (e.dataTransfer.files) {
                    setFile(e.dataTransfer.files[0]);
                    setUploadMessage("");
                    setUploadErrors([]);
                    setError(null);
                  }
                }}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <FaUpload className="text-3xl text-indigo-500 mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {file
                        ? file.name
                        : "Drag and drop your Excel file here, or click to browse"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Supports .xlsx and .xls files
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={loading || !file}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 flex gap-2 items-center"
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setUploadMessage("");
                    setUploadErrors([]);
                  }}
                  className="px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                >
                  Clear
                </button>
              </div>

              {uploadMessage && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md">
                  {uploadMessage}
                </div>
              )}

              {uploadErrors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
                  <p className="font-medium">Errors:</p>
                  <ul className="list-disc pl-5 mt-2 text-sm">
                    {uploadErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </form>
          </div>

          {/* Data display */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
            <h3 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-100">
              Firms
            </h3>

            {/* Desktop: compact table */}
            <div className="hidden md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wide">
                      Firm Name
                    </th>
                    <th className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wide">
                      HQ
                    </th>
                    <th className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wide">
                      Contact
                    </th>
                    <th className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : filteredRows.length ? (
                    filteredRows.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                      >
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {r.firm_name}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {r.hq || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {r.contact || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => editRow(r)}
                            className="text-indigo-600 mr-3 hover:underline inline-flex items-center gap-2"
                          >
                            <FaEdit />
                            Edit
                          </button>
                          <button
                            onClick={() => del(r.id)}
                            className="text-red-600 hover:underline inline-flex items-center gap-2"
                          >
                            <FaTrash />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                      >
                        No firms found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile: card list */}
            <div className="md:hidden grid gap-3">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : filteredRows.length ? (
                filteredRows.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {r.firm_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {r.hq || "-"}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {r.contact || "-"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editRow(r)}
                          className="text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-700 p-2 rounded-md"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => del(r.id)}
                          className="text-red-600 hover:bg-red-100 dark:hover:bg-red-700 p-2 rounded-md"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    {r.focus_area && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {r.focus_area}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No firms found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
