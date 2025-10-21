"use client";

import { useEffect, useMemo, useState } from "react";
import { FaEdit, FaTrashAlt, FaTimes, FaSearch } from "react-icons/fa";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"; // Fallback for local dev

export default function Page() {
  const [rows, setRows] = useState([]);
  const [hqs, setHqs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const DEFAULT_PAGE_SIZE = 6;
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [hq, setHq] = useState("");
  const [loading, setLoading] = useState(false);

  // For popup
  const [selectedRow, setSelectedRow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteRowId, setDeleteRowId] = useState(null);

  // For success or error messages
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadErrors, setUploadErrors] = useState([]);

  // Search and filter + pagination
  const fetchRows = async ({
    q = "",
    hq = "",
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (hq) params.set("hq", hq);
      params.set("page", page);
      params.set("page_size", pageSize);

      const url = `${API}/partners/?${params.toString()}`;
      console.log("Fetching partners URL:", url); // Debug
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();

      setRows(data.results || []);
      setTotalPages(Math.ceil(data.count / pageSize));
    } catch (err) {
      console.error("Error fetching rows:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const capitalizeFirst = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Fetch HQ options
  const fetchHqs = async () => {
    try {
      const url = `${API}/hqs/`;
      console.log("Fetching HQs URL:", url); // Debug
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      const uniqueHqs = Array.from(new Set(data)).sort();
      setHqs(uniqueHqs);
    } catch (err) {
      console.error("Error fetching HQs:", err);
      setHqs([]);
    }
  };

  useEffect(() => {
    fetchRows({ q: query, hq, page: currentPage });
    fetchHqs();
  }, [currentPage, query, hq]); // Added query, hq to dependencies for real-time updates

  const onSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRows({ q: query, hq, page: 1 });
  };

  const headers = useMemo(() => ["Firm Name", "Focuse Area", "", "Action"], []);

  // Edit/Delete Logic
  const handleEditClick = (e, row) => {
    e.stopPropagation();
    setSelectedRow(row);
    setFormData(row);
    setEditMode(true);
    setShowModal(true);
  };

  const handleDeleteClick = (e, rowId) => {
    e.stopPropagation();
    setDeleteRowId(rowId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const url = `${API}/partners/${deleteRowId}/`;
      console.log("Deleting URL:", url); // Debug
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      setShowDeleteConfirm(false);
      setShowModal(false);
      await fetchRows({ q: query, hq, page: currentPage }); // Refetch
    } catch (err) {
      console.error("Error deleting:", err);
      alert("Failed to delete firm");
    }
  };

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setFormData(row);
    setEditMode(false);
    setShowModal(true);
  };

  const handleUpdate = async () => {
    try {
      const method = editMode ? "PUT" : "POST"; // Use PUT for updates
      const url = editMode
        ? `${API}/partners/${selectedRow.id}/`
        : `${API}/partners/`;
      console.log("Updating URL:", url, "Method:", method); // Debug
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const updated = await res.json();
      setShowModal(false);
      setEditMode(false);
      setSelectedRow(null);
      setFormData({});
      await fetchRows({ q: query, hq, page: currentPage }); // Refetch
    } catch (err) {
      console.error("Error updating:", err);
      alert("Failed to update firm");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Search + Filter */}
      <form
        onSubmit={onSearch}
        className="flex flex-col sm:flex-row gap-4 mb-8 items-center"
      >
        <div className="relative flex-1 min-w-[200px]">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
          <input
            className="w-full pl-12 pr-4 py-3 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Search firms..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="px-6 py-3 bg-red-700 text-white rounded-lg hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-all font-medium">
          Search
        </button>
        <select
          className="w-full sm:w-auto px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all custom-dropdown appearance-none"
          value={hq}
          onChange={(e) => setHq(e.target.value)}
        >
          <option value="">All Headquarters</option>
          {hqs.map((c, idx) => (
            <option
              key={`${c}-${idx}`}
              value={c}
              className="bg-white text-black hover:bg-red-500 hover:text-white"
            >
              {c}
            </option>
          ))}
        </select>
      </form>

      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-red-700 dark:text-red-700 tracking-wider">
          Firms{" "}
          <span className="text-blue-900 dark:text-blue-800">Directory</span>
        </h2>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-blue-800 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="hidden md:table-header-group bg-blue-900 dark:bg-blue-900">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="text-left px-6 py-4 font-semibold text-white uppercase text-xs tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  colSpan={headers.length}
                >
                  Loading...
                </td>
              </tr>
            ) : Array.isArray(rows) && rows.length ? (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-700 transition-colors border-b dark:border-gray-700 last:border-b-0 cursor-pointer"
                  onClick={() => handleRowClick(r)}
                >
                  <td className="p-6 font-semibold text-gray-900 dark:text-white">
                    <div className="flex items-center gap-4">
                      <Image
                        src="/f-icon1.png"
                        alt="Firm Icon"
                        width={24}
                        height={24}
                        className="hidden md:block"
                      />
                      <div className="flex flex-col">
                        <span className="text-base">
                          {capitalizeFirst(r.firm_name)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {r.firm}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-gray-800 dark:text-gray-400">
                    <div className="flex flex-col">
                      <span>{r.focus_area || "-"}</span>
                      <span className="text-sm"></span>
                    </div>
                  </td>
                  <td className="p-6 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col">
                      <span>{r.contact}</span>
                      <span className="text-sm">{r.email || "-"}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => handleEditClick(e, r)}
                        className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <FaEdit size={20} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, r.id)}
                        className="text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <FaTrashAlt size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  colSpan={headers.length}
                >
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-6">
        <button
          className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-red-300 dark:hover:bg-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          Previous
        </button>
        <strong className="text-sm text-red-900 dark:text-gray-900">
          <strong className="text-sm text-blue-900 dark:text-gray-900">
            Page
          </strong>{" "}
          {currentPage}{" "}
          <strong className="text-sm text-blue-900 dark:text-gray-900">
            of
          </strong>{" "}
          {totalPages}
        </strong>
        <button
          className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-red-300 dark:hover:bg-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          disabled={currentPage === totalPages}
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
        >
          Next
        </button>
      </div>

      {/* Modal for Details/Edit */}
      {showModal && selectedRow && (
        <div className="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-[90vw] max-w-4xl h-[80vh] relative transform transition-all scale-100">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <FaTimes size={24} />
            </button>
            {!editMode ? (
              <>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-3">
                  Firm Details
                </h2>
                <div className="space-y-4 overflow-y-auto max-h-[calc(80vh-200px)]">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Firms Name:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedRow.firm_name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      HQ:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedRow.hq || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Contact:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedRow.contact || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Focus Area:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedRow.focus_area || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Donor Experience:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedRow.donor_experience || "-"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all font-medium"
                    onClick={() => setEditMode(true)}
                  >
                    Edit
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  Edit Firm
                </h2>
                <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(80vh-200px)]">
                  <label className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Firm Name
                    </span>
                    <input
                      className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={formData.firm_name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, firm_name: e.target.value })
                      }
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      HQ
                    </span>
                    <input
                      className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={formData.hq || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, hq: e.target.value })
                      }
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Focus Area
                    </span>
                    <input
                      className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={formData.focus_area || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, focus_area: e.target.value })
                      }
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Contact
                    </span>
                    <input
                      className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={formData.contact || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, contact: e.target.value })
                      }
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Donor Experience
                    </span>
                    <input
                      className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={formData.donor_experience || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          donor_experience: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Partnership Status
                    </span>
                    <input
                      className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={formData.current_partnership_status || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          current_partnership_status: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all font-medium"
                    onClick={handleUpdate}
                  >
                    Update
                  </button>
                  <button
                    className="px-5 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all font-medium"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-sm relative transform transition-all scale-100">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <FaTimes size={24} />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Delete
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this firm?
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-all font-medium"
                onClick={confirmDelete}
              >
                Confirm
              </button>
              <button
                className="px-5 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all font-medium"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
