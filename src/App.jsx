import React, { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable"; // Optional: For automatic table generation

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [whoisData, setWhoisData] = useState(null);
  const [httpsData, setHttpsData] = useState(null);

  const whoIsinfo = () => {
    try {
      const response = axios.post("http://localhost:5000/api/whois", {
        url,
      });
      setWhoisData(response.data);
    } catch (error) {
      console.error("Error fetching WHOIS data:", error);
      setError("Failed to fetch WHOIS data.");
    }
  };

  const httpsCheck = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/httpscheck", {
        siteUrl: url,
      });
      setHttpsData(res.data);
      console.log(res.data);

      console.log(httpsData);
    } catch (error) {
      console.log("Error fetching HTTPS data:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/seo-audit", {
        url,
      });
      setResult(res.data);
      httpsCheck();
      whoIsinfo();
      console.log(JSON.parse(whoisData));

      console.log(result);
    } catch (err) {
      setError("Failed to fetch results. Please enter a valid URL.");
    }
  };

  const getScore = (category) => {
    const score = result?.lighthouseResult?.categories?.[category]?.score;
    return score !== undefined ? Math.round(score * 100) : null;
  };

  const getVariant = (score) => {
    if (score >= 90) return "bg-primary";
    if (score >= 50) return "bg-warning";
    return "bg-danger";
  };

  const renderCategory = (label, category) => {
    const score = getScore(category);
    return (
      <div className="col-6 col-sm-3 d-flex justify-content-center mb-4">
        <div className="circle-badge text-center p-3">
          {score !== null ? (
            <>
              <div
                className={`badge rounded-circle ${getVariant(
                  score
                )} text-white`}
                style={{
                  width: "80px",
                  height: "80px",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {score}%
              </div>
              <p className="mt-2">{label}</p>
            </>
          ) : (
            <>
              <div
                className="badge rounded-circle bg-secondary text-white"
                style={{
                  width: "80px",
                  height: "80px",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                N/A
              </div>
              <p className="mt-2">{label}</p>
            </>
          )}
        </div>
      </div>
    );
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("SEO Audit Results", 20, 20);

    doc.setFontSize(12);
    doc.text(
      `Final URL: ${result?.lighthouseResult?.finalUrl || "N/A"}`,
      20,
      30
    );

    doc.text("Categories:", 20, 40);
    const categories = [
      { label: "Performance", category: "performance" },
      { label: "Accessibility", category: "accessibility" },
      { label: "Best Practices", category: "best-practices" },
      { label: "SEO", category: "seo" },
    ];

    categories.forEach((cat, index) => {
      const score = getScore(cat.category);
      doc.text(
        `${cat.label}: ${score !== null ? `${score}%` : "N/A"}`,
        20,
        50 + index * 10
      );
    });

    // Adding the strategy section
    doc.text("Strategy:", 20, 100);
    const strategyItems = [
      { label: "First Contentful Paint", key: "first-contentful-paint" },
      { label: "Largest Contentful Paint", key: "largest-contentful-paint" },
      { label: "Speed Index", key: "speed-index" },
      { label: "Time to Interactive", key: "interactive" },
      { label: "Total Blocking Time", key: "total-blocking-time" },
      { label: "Cumulative Layout Shift", key: "cumulative-layout-shift" },
    ];

    strategyItems.forEach((item, index) => {
      doc.text(
        `${item.label}: ${
          result?.lighthouseResult?.audits[item.key]?.displayValue || "N/A"
        }`,
        20,
        110 + index * 10
      );
    });

    doc.save("seo-audit-result.pdf");
  };

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">SEO Audit Tool with PageSpeed API</h2>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-3">
          <input
            type="url"
            className="form-control rounded-pill"
            placeholder="Enter website URL (e.g., https://example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-100 rounded-pill"
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      {result && result.lighthouseResult && (
        <div className="card shadow">
          <div className="card-header bg-primary text-white">
            SEO Audit Results
          </div>
          <div className="card-body">
            <p>
              <strong>Final URL:</strong> {result.lighthouseResult.finalUrl}
              <br />
              <strong>Report as on:</strong>
              {result.analysisUTCTimestamp}
            </p>

            <div className="row">
              {renderCategory("Performance", "performance")}
              {renderCategory("Accessibility", "accessibility")}
              {renderCategory("Best Practices", "best-practices")}
              {renderCategory("SEO", "seo")}
            </div>

            {/* Strategy Section */}
            <div className="mt-4">
              <h5>Strategy</h5>
              <ul className="list-group">
                <li className="list-group-item">
                  <strong>First Contentful Paint:</strong>{" "}
                  {result.lighthouseResult.audits["first-contentful-paint"]
                    ?.displayValue || "N/A"}
                </li>
                <li className="list-group-item">
                  <strong>Largest Contentful Paint:</strong>{" "}
                  {result.lighthouseResult.audits["largest-contentful-paint"]
                    ?.displayValue || "N/A"}
                </li>
                <li className="list-group-item">
                  <strong>Speed Index:</strong>{" "}
                  {result.lighthouseResult.audits["speed-index"]
                    ?.displayValue || "N/A"}
                </li>
                <li className="list-group-item">
                  <strong>Time to Interactive:</strong>{" "}
                  {result.lighthouseResult.audits["interactive"]
                    ?.displayValue || "N/A"}
                </li>
                <li className="list-group-item">
                  <strong>Total Blocking Time:</strong>{" "}
                  {result.lighthouseResult.audits["total-blocking-time"]
                    ?.displayValue || "N/A"}
                </li>
                <li className="list-group-item">
                  <strong>Cumulative Layout Shift:</strong>{" "}
                  {result.lighthouseResult.audits["cumulative-layout-shift"]
                    ?.displayValue || "N/A"}
                </li>
              </ul>
            </div>

            {/* WHOIS Data Section */}
            <div>{httpsData.message}</div>

            <button className="btn btn-primary mt-4" onClick={downloadPDF}>
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
