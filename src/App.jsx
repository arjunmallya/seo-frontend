import React, { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable"; // Optional: For automatic table generation

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [Metadetails, setMetadetails] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [whoisData, setWhoisData] = useState("");
  const [httpsData, setHttpsData] = useState(null);
  const [backlinkData, setBacklinkData] = useState(null);

  const whoIsinfo = async () => {
    try {
      const response = await axios.post(
        "https://seo-backend-ork1.onrender.com/api/whois",
        {
          url: url,
        }
      );
      setWhoisData(response.data); // Store clean WHOIS data
      console.log("WHOIS Data:", response.data);
    } catch (error) {
      console.error("Error fetching WHOIS data:", error);
      setError("Failed to fetch WHOIS data.");
    }
  };

  const httpsCheck = async () => {
    try {
      const res = await axios.post(
        "https://seo-backend-ork1.onrender.com/api/httpscheck",
        {
          siteUrl: url,
        }
      );
      setHttpsData(res.data);
      console.log("HTTPS Data:", httpsData);
    } catch (error) {
      console.log("Error fetching HTTPS data:", error);
    }
  };

  const PageSpeed = async () => {
    setError("");
    setResult(null);

    try {
      const res = await axios.post(
        "https://seo-backend-ork1.onrender.com/api/seo-audit",
        {
          url,
        }
      );
      setResult(res.data);
    } catch (err) {
      setError("Failed to fetch results. Please enter a valid URL.");
    }
  };

  const metataganalysis = async () => {
    setError("");
    setMetadetails(null);
    try {
      const res = await axios.post(
        "https://seo-backend-ork1.onrender.com/api/metataganalysis",
        {
          url,
        }
      );
      setMetadetails(res.data);
      console.log("Meta Tag Analysis Result:", res.data);
    } catch (err) {
      setError("Failed to fetch results. Please enter a valid URL.");
    }
  };

  const backlinkAnalysis = async () => {
    setError("");
    setBacklinkData(null);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/backlinkanalysis",
        {
          siteUrl: url,
        }
      );
      setBacklinkData(res.data.backlinkData);
      console.log("Backlink Analysis Result:", backlinkData);
    } catch (err) {
      setError(
        "Backlink analysis Failed to fetch results. Please enter a valid URL."
      );
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
    let y = 20;

    // Section Title Style
    const addSectionTitle = (title) => {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(title, 20, y);
      y += 6;
      doc.setDrawColor(0);
      doc.line(20, y, 190, y); // border-bottom
      y += 10;
    };

    // Regular text style
    const addText = (label, value) => {
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`${label}: ${value || "N/A"}`, 20, y);
      y += 8;
    };

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("SEO Audit Results", 20, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    addText("Final URL", result?.lighthouseResult?.finalUrl);

    // Categories Section
    addSectionTitle("Lighthouse Categories");
    const categories = [
      { label: "Performance", category: "performance" },
      { label: "Accessibility", category: "accessibility" },
      { label: "Best Practices", category: "best-practices" },
      { label: "SEO", category: "seo" },
    ];

    categories.forEach((cat) => {
      const score = getScore(cat.category);
      addText(cat.label, score !== null ? `${score}%` : "N/A");
    });

    // Strategy Metrics Section
    addSectionTitle("Core Web Vitals / Strategy");
    const strategyItems = [
      { label: "First Contentful Paint", key: "first-contentful-paint" },
      { label: "Largest Contentful Paint", key: "largest-contentful-paint" },
      { label: "Speed Index", key: "speed-index" },
      { label: "Time to Interactive", key: "interactive" },
      { label: "Total Blocking Time", key: "total-blocking-time" },
      { label: "Cumulative Layout Shift", key: "cumulative-layout-shift" },
    ];

    strategyItems.forEach((item) => {
      addText(
        item.label,
        result?.lighthouseResult?.audits[item.key]?.displayValue
      );
    });

    // HTTPS Check
    if (httpsData) {
      addSectionTitle("HTTPS Check Result");
      addText("Is HTTPS", httpsData.isHTTPS ? "Yes" : "No");
      addText("Secure", httpsData.secure ? "Yes" : "No");
      addText("Message", httpsData.message);

      if (httpsData.certificate) {
        addText("Valid From", httpsData.certificate.validFrom);
        addText("Valid To", httpsData.certificate.validTo);
        addText("Days Left", `${httpsData.certificate.daysLeft} day(s)`);
      }
    }

    // WHOIS Data
    if (whoisData) {
      addSectionTitle("WHOIS Information");
      addText("Domain Name", whoisData.domainName);
      addText("Owner", whoisData.owner);
      addText("Registrar", whoisData.registrar);
    }

    // Meta Tag Analysis
    if (Metadetails?.success) {
      addSectionTitle("Meta Tag Analysis");

      const meta = Metadetails.meta;
      addText("Charset", meta.charset);
      addText("Viewport", meta.viewport);
      addText("Description", meta.description);
      addText("Keywords", meta.keywords);
      addText("Title", meta.title);
      addText("Canonical", meta.canonical);
      addText("Robots", meta.robots);
      addText("OG Title", meta.ogTitle);
      addText("OG Image", meta.ogImage);
      addText("Twitter Title", meta.twitterTitle);
      addText("Twitter Description", meta.twitterDescription);
      addText("Twitter Image", meta.twitterImage);
    }

    doc.save("seo-audit-result.pdf");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    // setBacklinkData(null);
    setHttpsData(null);
    setMetadetails(null);
    setWhoisData(null);

    try {
      await PageSpeed();
      whoIsinfo();
      await httpsCheck();
      await metataganalysis();
      //await backlinkAnalysis();
    } catch (err) {
      console.log("Error during analysis:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">SEO Audit Tool</h2>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Enter website URL (e.g., https://example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Auditing...
              </>
            ) : (
              "Run Audit"
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="alert alert-danger text-center" role="alert">
          {error}
        </div>
      )}

      {result && (
        <>
          <div className="row text-center">
            {renderCategory("Performance", "performance")}
            {renderCategory("Accessibility", "accessibility")}
            {renderCategory("Best Practices", "best-practices")}
            {renderCategory("SEO", "seo")}
          </div>

          <div className="text-center mt-4">
            <button className="btn btn-primary" onClick={downloadPDF}>
              Download PDF Report
            </button>
          </div>

          <div className="mt-5">
            <h4 className="mb-3">Detailed Metrics</h4>
            <ul className="list-group">
              {[
                {
                  label: "First Contentful Paint",
                  key: "first-contentful-paint",
                },
                {
                  label: "Largest Contentful Paint",
                  key: "largest-contentful-paint",
                },
                { label: "Speed Index", key: "speed-index" },
                { label: "Time to Interactive", key: "interactive" },
                { label: "Total Blocking Time", key: "total-blocking-time" },
                {
                  label: "Cumulative Layout Shift",
                  key: "cumulative-layout-shift",
                },
              ].map((item, i) => (
                <li
                  key={i}
                  className="list-group-item d-flex justify-content-between"
                >
                  <strong>{item.label}</strong>
                  <span>
                    {result?.lighthouseResult?.audits[item.key]?.displayValue ||
                      "N/A"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {httpsData && (
            <div className="mt-5">
              <h4 className="mb-3">HTTPS Check</h4>
              <table className="table table-bordered">
                <tbody>
                  <tr>
                    <th scope="row">Is HTTPS</th>
                    <td>{httpsData.isHTTPS ? "Yes" : "No"}</td>
                  </tr>
                  <tr>
                    <th scope="row">Secure</th>
                    <td>{httpsData.secure ? "Yes" : "No"}</td>
                  </tr>
                  <tr>
                    <th scope="row">Message</th>
                    <td>{httpsData.message}</td>
                  </tr>
                  {httpsData.certificate && (
                    <>
                      <tr>
                        <th scope="row">Valid From</th>
                        <td>{httpsData.certificate.validFrom}</td>
                      </tr>
                      <tr>
                        <th scope="row">Valid To</th>
                        <td>{httpsData.certificate.validTo}</td>
                      </tr>
                      <tr>
                        <th scope="row">Days Left</th>
                        <td>{httpsData.certificate.daysLeft}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {whoisData && (
            <div className="mt-5">
              <h4 className="mb-3">WHOIS Information</h4>
              <ul className="list-group">
                <li className="list-group-item">
                  <strong>Domain:</strong> {whoisData.domainName}
                </li>
                <li className="list-group-item">
                  <strong>Owner:</strong> {whoisData.owner}
                </li>
                <li className="list-group-item">
                  <strong>Registrar:</strong> {whoisData.registrar}
                </li>
              </ul>
            </div>
          )}

          {Metadetails?.success && (
            <div className="mt-5">
              <h4 className="mb-3">Meta Tag Details</h4>
              <table className="table table-hover">
                <tbody>
                  {Object.entries(Metadetails.meta).map(([key, value], i) => (
                    <tr key={i}>
                      <th>{key}</th>
                      <td>{value || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
