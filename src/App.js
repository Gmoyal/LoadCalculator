import React, { useState, useEffect, useCallback, useRef } from "react";

// --- Helper Functions ---
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    // Check if the script is already in the document
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Script load error for ${src}`));
    document.head.appendChild(script);
  });
};

const debounce = (func, delay) => {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

// --- Constants ---
const STANDARD_EQUIPMENT = [
  { name: "AC Unit", power: 5000 },
  { name: "ERV Unit", power: 1500 },
  { name: "Exhaust Fan", power: 750 },
  { name: "LED Lighting (per 1k sqft)", power: 100 },
  { name: "Furnace Fan", power: 800 },
  { name: "Roof Top AC", power: 12000 },
  { name: "Computer/Workstation", power: 150 },
  { name: "Commercial Washer", power: 4500 },
  { name: "Commercial Dryer", power: 5500 },
  { name: "Air Compressor (10hp)", power: 7500 },
];

const INITIAL_FORM_STATE = {
  name: "",
  qty: 1,
  power: "",
  hours: "",
  kwh: "",
};

// --- Components ---

const Header = () => (
  <header className="bg-slate-800 text-white shadow-md">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-3">
        {/* Use the logo from the public folder */}
        <img
          src="/logo-maktinta.png"
          alt="Maktinta Energy Logo"
          className="h-12"
        />
        <div className="text-right">
          <h1 className="text-2xl font-bold">
            Commercial Electric Load Calculator
          </h1>
          <p className="text-sm opacity-90">
            Tel: 408-432-9900 | www.maktinta.com
          </p>
        </div>
      </div>
    </div>
  </header>
);

const FormInput = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input id={id} {...props} className="form-input mt-1" />
  </div>
);

const EquipmentForm = ({ onAddEquipment }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSelectChange = (e) => {
    if (!e.target.value) {
      // User selected "Select or Enter Manually", so clear the template fields
      setFormData((prev) => ({ ...prev, name: "", power: "", hours: "" }));
      return;
    }
    // User selected a standard item, populate form as a template
    const { name, power } = JSON.parse(e.target.value);
    setFormData((prev) => ({ ...prev, name, power: power.toString() }));
  };

  const handleChange = (e) => {
    let { id, value } = e.target;
    if (id === "hours" && Number(value) > 24) {
      value = "24";
    }
    // If user types a name, it's a custom entry.
    // We don't need to do anything special as the name field is always enabled.
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, qty, power, hours, kwh } = formData;
    let totalDailyKWh = 0;

    if (!name) {
      setErrorMessage("Please provide an equipment name.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const numQty = parseInt(qty, 10);
    const numKwh = parseFloat(kwh);
    const numPower = parseInt(power, 10);
    const numHours = parseFloat(hours);

    if (numKwh > 0) {
      totalDailyKWh = numKwh * numQty;
    } else if (numPower > 0 && numHours > 0) {
      totalDailyKWh = (numQty * numPower * numHours) / 1000;
    } else {
      setErrorMessage(
        "Please provide either Power and Hours, or a Daily Load kWh."
      );
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    onAddEquipment({
      id: Date.now(),
      name,
      qty: numQty,
      power: numPower || 0,
      hours: numHours || 0,
      totalDailyKWh: totalDailyKWh,
    });

    setFormData(INITIAL_FORM_STATE);
    document.getElementById("equipment-select").value = "";
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="equipment-select"
            className="block text-sm font-medium text-gray-700"
          >
            Standard Equipment (as template)
          </label>
          <select
            id="equipment-select"
            onChange={handleSelectChange}
            className="form-input mt-1"
          >
            <option value="">Select to pre-fill form</option>
            {STANDARD_EQUIPMENT.map((eq) => (
              <option key={eq.name} value={JSON.stringify(eq)}>
                {eq.name}
              </option>
            ))}
          </select>
        </div>
        <FormInput
          label="Equipment Name"
          id="name"
          type="text"
          placeholder="Enter custom name or edit template"
          value={formData.name}
          onChange={handleChange}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 items-end">
        <FormInput
          label="Qty"
          id="qty"
          type="number"
          min="1"
          value={formData.qty}
          onChange={handleChange}
        />
        <FormInput
          label="Power (W)"
          id="power"
          type="number"
          placeholder="e.g., 2500"
          value={formData.power}
          onChange={handleChange}
          disabled={!!formData.kwh}
        />
        <FormInput
          label="Daily Hours"
          id="hours"
          type="number"
          max="24"
          min="0"
          placeholder="e.g., 8"
          value={formData.hours}
          onChange={handleChange}
          disabled={!!formData.kwh}
        />
        <FormInput
          label="Or Daily Load / unit (kWh)"
          id="kwh"
          type="number"
          min="0"
          placeholder="e.g., 20"
          value={formData.kwh}
          onChange={handleChange}
          disabled={!!formData.power || !!formData.hours}
        />
      </div>
      {errorMessage && (
        <div className="text-red-600 font-medium text-sm mt-3">
          {errorMessage}
        </div>
      )}
      <button
        type="submit"
        className="mt-4 w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Add Equipment to List
      </button>
    </form>
  );
};

const EquipmentTable = ({
  equipmentList,
  onUpdateEquipment,
  onRemoveEquipment,
}) => {
  const handleEdit = (id, field, value) => {
    let numValue = parseFloat(value) || 0;

    if (field === "hours" && numValue > 24) {
      numValue = 24;
    }

    const updatedList = equipmentList.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item };

        if (field === "qty") {
          const perUnitKwh =
            updatedItem.qty > 0
              ? updatedItem.totalDailyKWh / updatedItem.qty
              : 0;
          updatedItem.qty = numValue;
          updatedItem.totalDailyKWh = perUnitKwh * updatedItem.qty;
        } else if (field === "power" || field === "hours") {
          updatedItem[field] = numValue;
          updatedItem.totalDailyKWh =
            (updatedItem.qty * updatedItem.power * updatedItem.hours) / 1000;
        } else if (field === "dailyKWhPerUnit") {
          updatedItem.power = 0;
          updatedItem.hours = 0;
          updatedItem.totalDailyKWh = numValue * updatedItem.qty;
        }
        return updatedItem;
      }
      return item;
    });
    onUpdateEquipment(updatedList);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto text-sm text-left">
        <thead className="bg-gray-100">
          <tr>
            <th>Equipment</th>
            <th>Qty</th>
            <th>Power (W)</th>
            <th>Daily Hours</th>
            <th>Daily Load / unit (kWh)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {equipmentList.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center text-gray-500 py-4">
                No equipment added yet.
              </td>
            </tr>
          ) : (
            equipmentList.map((item) => {
              const perUnitKwh =
                item.qty > 0 ? item.totalDailyKWh / item.qty : 0;
              return (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) =>
                        handleEdit(item.id, "qty", e.target.value)
                      }
                      className="input-editable w-16"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.power}
                      onChange={(e) =>
                        handleEdit(item.id, "power", e.target.value)
                      }
                      className="input-editable w-24"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      max="24"
                      value={item.hours}
                      onChange={(e) =>
                        handleEdit(item.id, "hours", e.target.value)
                      }
                      className="input-editable w-20"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={perUnitKwh.toFixed(2)}
                      onChange={(e) =>
                        handleEdit(item.id, "dailyKWhPerUnit", e.target.value)
                      }
                      className="input-editable w-24 font-semibold"
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => onRemoveEquipment(item.id)}
                      className="delete-btn text-red-500 hover:text-red-700 font-semibold px-2"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

const ResultsPanel = ({ calculations, onExportPDF, isFacilityInfoValid }) => {
  const resultsRef = useRef();

  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg relative">
      <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-blue-800">
        Summary & Results
      </h2>

      {!isFacilityInfoValid && (
        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-center">
          <p className="font-semibold text-yellow-800">
            Please enter a complete Street Address and Zip Code to see your
            results.
          </p>
        </div>
      )}

      <div
        ref={resultsRef}
        style={{ visibility: isFacilityInfoValid ? "visible" : "hidden" }}
      >
        <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <h3 className="text-xl font-semibold mb-3 text-blue-900">
            Facility Load Summary
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center">
              <p className="font-medium text-gray-700">Total Daily Load</p>
              <p className="text-lg font-bold text-blue-900">
                {calculations.daily.toFixed(2)} kWh
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="font-medium text-gray-700">Total Monthly Load</p>
              <p className="text-lg font-bold text-blue-900">
                {calculations.monthly.toFixed(2)} kWh
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="font-medium text-gray-700">Total Annual Load</p>
              <p className="text-lg font-bold text-blue-900">
                {calculations.annual.toFixed(2)} kWh
              </p>
            </div>
          </div>
        </div>
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
          <h3 className="text-xl font-semibold mb-3 text-green-900">
            System Recommendation
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center">
              <p className="font-medium text-gray-700">
                Recommended Solar PV Size
              </p>
              <p className="text-lg font-bold text-green-900">
                {calculations.pvSize.toFixed(2)} kW
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="font-medium text-gray-700">
                Recommended Battery Storage
              </p>
              <p className="text-lg font-bold text-green-900">
                {calculations.batterySize.toFixed(0)} kWh
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-600 mt-2 text-center">
            {calculations.irradianceInfo}
          </div>
        </div>
        <div className="flex space-x-4 mt-8">
          <button
            onClick={() => onExportPDF(resultsRef)}
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Download PDF Report
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [facilityInfo, setFacilityInfo] = useState({
    streetAddress: "",
    zipCode: "",
    opHoursDay: 10,
    opDaysWeek: 5,
  });
  const [equipmentList, setEquipmentList] = useState([]);
  const [peakSunHours, setPeakSunHours] = useState(4.5);
  const [irradianceInfo, setIrradianceInfo] = useState(
    "Enter a zip code for a location-specific solar recommendation."
  );
  const [isLoading, setIsLoading] = useState(false);

  // --- Effects ---
  // Load Tailwind CSS framework from CDN on initial component mount
  useEffect(() => {
    loadScript("https://cdn.tailwindcss.com").catch((error) =>
      console.error(error)
    );
  }, []);

  const handleFacilityInfoChange = (e) => {
    let { id, value } = e.target;

    if (id === "opDaysWeek") {
      if (value === "") {
        // Allow clearing the input
      } else {
        const numValue = parseInt(value, 10);
        if (numValue > 7) {
          value = "7"; // Cap at 7
        }
      }
    }

    setFacilityInfo((prev) => ({ ...prev, [id]: value }));
  };

  const addEquipment = (item) => {
    setEquipmentList((prev) => [...prev, item]);
  };

  const removeEquipment = (id) => {
    setEquipmentList((prev) => prev.filter((item) => item.id !== id));
  };

  const updateEquipmentList = (newList) => {
    setEquipmentList(newList);
  };

  const fetchSolarData = useCallback(async (zip) => {
    if (!zip || zip.length < 5) {
      setIrradianceInfo(
        "Enter a valid 5-digit zip code for a location-specific solar recommendation."
      );
      setPeakSunHours(4.5);
      return;
    }
    setIsLoading(true);
    // Mock API call simulation
    await new Promise((resolve) => setTimeout(resolve, 500));
    let psh = 4.5;
    let loc = "an average US location";
    if (zip.startsWith("85") || zip.startsWith("86")) {
      psh = 6.5;
      loc = "Arizona";
    } else if (zip.startsWith("9")) {
      psh = 5.5;
      loc = "the West Coast";
    } else if (zip.startsWith("98") || zip.startsWith("99")) {
      psh = 3.8;
      loc = "the Pacific Northwest";
    } else if (zip.startsWith("3")) {
      psh = 5.0;
      loc = "the Southeast";
    }

    setPeakSunHours(psh);
    setIrradianceInfo(
      `Using solar irradiance data for ${loc}. Est. Peak Sun Hours: ${psh}.`
    );
    setIsLoading(false);
  }, []);

  const debouncedFetch = useCallback(
    debounce((zip) => fetchSolarData(zip), 500),
    [fetchSolarData]
  );

  useEffect(() => {
    debouncedFetch(facilityInfo.zipCode);
  }, [facilityInfo.zipCode, debouncedFetch]);

  // --- Calculations ---
  const calculateTotals = () => {
    const daysPerWeek = Number(facilityInfo.opDaysWeek) || 0;
    const daysPerMonth = (daysPerWeek / 7) * 30.44;
    const daysPerYear = (daysPerWeek / 7) * 365.25;

    const totalDailyLoad = equipmentList.reduce(
      (sum, item) => sum + item.totalDailyKWh,
      0
    );
    const totalMonthlyLoad = totalDailyLoad * daysPerMonth;
    const totalAnnualLoad = totalDailyLoad * daysPerYear;

    const systemEfficiency = 0.85;
    const dailyEnergyNeeded =
      totalAnnualLoad > 0 ? totalAnnualLoad / 365.25 : 0;
    const solarPVSize =
      dailyEnergyNeeded > 0 && peakSunHours > 0
        ? dailyEnergyNeeded / (peakSunHours * systemEfficiency)
        : 0;

    const rawBatterySize = solarPVSize * 2;
    const batteryStorageSize = Math.round(rawBatterySize / 5) * 5;

    return {
      daily: totalDailyLoad,
      monthly: totalMonthlyLoad,
      annual: totalAnnualLoad,
      pvSize: solarPVSize,
      batterySize: batteryStorageSize,
      irradianceInfo: irradianceInfo,
    };
  };

  const calculations = calculateTotals();
  const isFacilityInfoValid =
    facilityInfo.streetAddress.trim() !== "" &&
    facilityInfo.zipCode.trim() !== "";

  const exportPDF = async (resultsRef) => {
    if (!resultsRef.current) return;
    setIsLoading(true);

    try {
      // Dynamically load scripts for PDF generation
      await Promise.all([
        loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
        ),
        loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
        ),
      ]);

      const { jsPDF } = window.jspdf; // Access from window object
      const html2canvas = window.html2canvas;

      const headerCanvas = await html2canvas(document.querySelector("header"));
      const resultsCanvas = await html2canvas(resultsRef.current, { scale: 2 });

      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();

      const headerImgData = headerCanvas.toDataURL("image/png");
      pdf.addImage(headerImgData, "PNG", 0, 0, pdfWidth, 25);

      const resultsImgData = resultsCanvas.toDataURL("image/png");
      const imgProps = pdf.getImageProperties(resultsImgData);
      const imgHeight = (imgProps.height * (pdfWidth - 20)) / imgProps.width;

      pdf.addImage(resultsImgData, "PNG", 10, 30, pdfWidth - 20, imgHeight);
      pdf.save("Commercial_Electric_Load_Report.pdf");
    } catch (error) {
      console.error("Failed to load scripts for PDF generation:", error);
      // Optionally, show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen">
      <style>{`
                /* These are fallback styles and styles for elements not easily targeted by Tailwind classes. */
                body {
                    font-family: 'Inter', sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
                }
                .table-auto th, .table-auto td {
                    padding: 0.75rem;
                    border: 1px solid #e2e8f0;
                    vertical-align: middle;
                }
                .table-auto th {
                    background-color: #f8fafc;
                }
                .input-editable {
                    background-color: #f7fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.375rem;
                    padding: 0.5rem;
                    width: 100%;
                    box-sizing: border-box;
                }
                .input-editable:focus {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }
                .form-input {
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    border-radius: 0.375rem;
                    border: 1px solid #D1D5DB;
                    box-shadow: inset 0 1px 2px 0 rgb(0 0 0 / 0.05);
                }
                .form-input:disabled {
                    background-color: #e5e7eb;
                    cursor: not-allowed;
                }
            `}</style>
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-blue-800">
              Project Inputs
            </h2>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-700">
                1. Facility Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormInput
                  label="Street Address *"
                  id="streetAddress"
                  type="text"
                  placeholder="e.g., 1600 Amphitheatre Pkwy"
                  value={facilityInfo.streetAddress}
                  onChange={handleFacilityInfoChange}
                />
                <FormInput
                  label="Zip Code *"
                  id="zipCode"
                  type="text"
                  placeholder="e.g., 94043"
                  value={facilityInfo.zipCode}
                  onChange={handleFacilityInfoChange}
                />
                <FormInput
                  label="Hours of Operation / Day"
                  id="opHoursDay"
                  type="number"
                  max="24"
                  min="1"
                  value={facilityInfo.opHoursDay}
                  onChange={handleFacilityInfoChange}
                />
                <FormInput
                  label="Days of Operation / Week"
                  id="opDaysWeek"
                  type="number"
                  min="1"
                  max="7"
                  value={facilityInfo.opDaysWeek}
                  onChange={handleFacilityInfoChange}
                />
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-700">
                2. Equipment Load Entry
              </h3>
              <EquipmentForm onAddEquipment={addEquipment} />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-gray-700">
                3. Equipment List
              </h3>
              <EquipmentTable
                equipmentList={equipmentList}
                onUpdateEquipment={updateEquipmentList}
                onRemoveEquipment={removeEquipment}
              />
            </div>
          </div>

          <ResultsPanel
            calculations={calculations}
            onExportPDF={exportPDF}
            isFacilityInfoValid={isFacilityInfoValid}
          />
        </div>
        {isLoading && (
          <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            <p className="ml-4 text-blue-700">Processing...</p>
          </div>
        )}
      </main>
    </div>
  );
}
