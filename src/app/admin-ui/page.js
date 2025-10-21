"use client";

import { useEffect, useState } from "react";
import axios from "axios";

// const API = `${
//   process.env.NEXT_PUBLIC_API_URL ||
//   "https://partnersdb-backend.onrender.com/api"
// }/partners/`;

// const UPLOAD_API = `${
//   process.env.NEXT_PUBLIC_API_URL ||
//   "http://127.0.0.1:8000/api"

// }/upload-excel/`;

const API = "http://127.0.0.1:8000/api/partners/";
const UPLOAD_API = `http://127.0.0.1:8000/api/upload-excel/`;

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
      // ✅ No custom headers → axios auto handles multipart
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
    <div className="p-6 max-w-5xl mx-auto">
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-lg">
          Error: {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-red-700 dark:text-red-800">
          Create Firms
        </h1>
        {/* Excel Upload */}
        {/* <form onSubmit={handleUpload} className="flex items-center gap-3">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-200 dark:file:bg-gray-600 file:text-gray-700 dark:file:text-gray-200 hover:file:bg-gray-300 dark:hover:file:bg-gray-500 transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 transition-all font-medium"
          >
            Upload Excel
          </button>
        </form> */}
        <form onSubmit={handleUpload}>
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600"
            } hover:border-blue-400 dark:hover:border-blue-500`}
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
                <svg
                  className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.71 6L16 6a5 5 0 011 9.71M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
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
          <button
            type="submit"
            disabled={loading || !file}
            className="mt-4 w-full px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Uploading..." : "Upload Excel"}
          </button>
        </form>
      </div>

      {uploadMessage && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-lg">
          {uploadMessage}
        </div>
      )}

      {uploadErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-lg">
          <p>Errors:</p>
          <ul className="list-disc pl-5">
            {uploadErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={save}
        className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6"
      >
        <input
          className="border px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="Firm Name *"
          required
          value={form.firm_name}
          onChange={(e) => setForm({ ...form, firm_name: e.target.value })}
        />
        <input
          className="border px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="HQ (Country)"
          value={form.hq}
          onChange={(e) => setForm({ ...form, hq: e.target.value })}
        />
        <input
          className="border px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="Contact"
          value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })}
        />
        <input
          className="border px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="Current Partnership Status"
          value={form.current_partnership_status}
          onChange={(e) =>
            setForm({ ...form, current_partnership_status: e.target.value })
          }
        />
        <textarea
          className="border px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all md:col-span-2"
          rows={3}
          placeholder="Focus Area"
          value={form.focus_area}
          onChange={(e) => setForm({ ...form, focus_area: e.target.value })}
        />
        <textarea
          className="border px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all md:col-span-2"
          rows={3}
          placeholder="Donor Experience"
          value={form.donor_experience}
          onChange={(e) =>
            setForm({ ...form, donor_experience: e.target.value })
          }
        />
        <div className="md:col-span-2 flex gap-2">
          <button
            disabled={loading}
            className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 transition-all font-medium"
          >
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-900 dark:bg-blue-900 text-white">
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
            ) : rows.length ? (
              rows.map((r) => (
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
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => del(r.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
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
    </div>
  );
}
