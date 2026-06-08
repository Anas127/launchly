import { useState } from "react";
import axios from "axios";

const C = {
  bg: "#FAFAF9",
  surface: "#FFFFFF",
  border: "#E8E7E2",
  borderFocus: "#111111",
  text: "#111111",
  muted: "#999790",
  subtle: "#F4F3EF",
  accent: "#00C48C",
  error: "#E24B4A",
  errorSoft: "#FEF2F2",
  success: "#00C48C",
  successSoft: "#F0FDF8",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "500",
  color: C.muted,
  marginBottom: "6px",
  letterSpacing: "0.02em",
};

const inputBase = {
  width: "100%",
  padding: "10px 13px",
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: "8px",
  color: C.text,
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
};

function Field({ label, name, placeholder, onChange, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputBase,
          borderColor: focused ? C.borderFocus : C.border,
        }}
      />
    </div>
  );
}

function TextArea({ label, name, placeholder, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <textarea
        name={name}
        placeholder={placeholder}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputBase,
          height: "88px",
          resize: "vertical",
          lineHeight: "1.6",
          borderColor: focused ? C.borderFocus : C.border,
        }}
      />
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p
      style={{
        margin: "0 0 16px",
        fontSize: "11px",
        fontWeight: "600",
        color: C.muted,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </p>
  );
}

function Divider() {
  return (
    <div style={{ height: "1px", background: C.border, margin: "24px 0" }} />
  );
}

export default function App() {
  const [form, setForm] = useState({
    company_name: "",
    user_background: {
      name: "",
      last_name: "",
      email: "",
      phone: "",
      location: "",
      skills: "",
      experience_years: "",
      target_role: "",
      summary: "",
    },
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState("professional");
  const [jobs, setJobs] = useState([]);
  const [steps, setSteps] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "company_name") {
      setForm({ ...form, company_name: value });
    } else {
      setForm({
        ...form,
        user_background: { ...form.user_background, [name]: value },
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSteps([]);
    setJobs([]);

    try {
      const payload = {
        ...form,
        tone,
        user_background: {
          ...form.user_background,
          skills: form.user_background.skills.split(",").map((s) => s.trim()),
          experience_years: parseInt(form.user_background.experience_years),
        },
      };

      const response = await fetch("http://localhost:8000/research-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data:"));

        for (const line of lines) {
          const data = JSON.parse(line.replace("data: ", ""));

          if (data.error) {
            setError(data.error);
            setLoading(false);
          } else if (data.result) {
            setResult(data.result);
            try {
              const raw =
                typeof data.jobs === "string"
                  ? data.jobs
                  : JSON.stringify(data.jobs);
              const parsed = JSON.parse(raw);
              setJobs(Array.isArray(parsed) ? parsed : []);
              console.log("jobs parsed:", parsed);
            } catch (e) {
              console.error("Jobs parse error:", e, data.jobs);
              setJobs([]);
            }
            setLoading(false);
          } else {
            setSteps((prev) => [...prev, data.message]);
          }
        }
      }
    } catch (err) {
      setError("Something went wrong. Make sure the backend is running.");
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPdf = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/export-pdf",
        {
          cover_letter: result,
          user_info: {
            name: form.user_background.name,
            last_name: form.user_background.last_name,
            email: form.user_background.email,
            phone: form.user_background.phone,
            location: form.user_background.location,
            target_role: form.user_background.target_role,
          },
        },
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "cover_letter.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        color: C.text,
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Nav */}
      <div
        style={{
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          padding: "0 40px",
          height: "60px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "4px",
          }}
        >
          <span
            style={{
              fontWeight: "700",
              fontSize: "18px",
              letterSpacing: "-0.04em",
              color: C.text,
            }}
          >
            Launchly
          </span>
          <div
            style={{
              width: "28px",
              height: "2.5px",
              background: C.accent,
              borderRadius: "2px",
            }}
          />
        </div>
      </div>

      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          padding: "52px 24px 80px",
        }}
      >
        {/* Hero */}
        <div style={{ marginBottom: "44px" }}>
          <h1
            style={{
              fontSize: "30px",
              fontWeight: "700",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              margin: "0 0 12px",
              color: C.text,
            }}
          >
            Your AI job research agent.
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: C.muted,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Drop a company name and your background. We research the company,
            find open roles, and write a tailored cover letter.
          </p>
        </div>

        {/* Form */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "12px",
            padding: "28px",
          }}
        >
          <SectionLabel>Target</SectionLabel>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <Field
              label="Company"
              name="company_name"
              placeholder="Stripe"
              onChange={handleChange}
            />
            <Field
              label="Role"
              name="target_role"
              placeholder="Backend Engineer"
              onChange={handleChange}
            />
          </div>

          <Divider />

          <SectionLabel>Your Details</SectionLabel>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <Field
              label="First name"
              name="name"
              placeholder="John"
              onChange={handleChange}
            />
            <Field
              label="Last name"
              name="last_name"
              placeholder="Doe"
              onChange={handleChange}
            />
            <Field
              label="Email"
              name="email"
              placeholder="john@gmail.com"
              onChange={handleChange}
            />
            <Field
              label="Phone"
              name="phone"
              placeholder="+1 234 567 8900"
              onChange={handleChange}
            />
            <Field
              label="Location"
              name="location"
              placeholder="San Francisco, CA"
              onChange={handleChange}
            />
            <Field
              label="Years of experience"
              name="experience_years"
              placeholder="3"
              type="number"
              onChange={handleChange}
            />
          </div>
          <div style={{ marginTop: "12px" }}>
            <Field
              label="Skills"
              name="skills"
              placeholder="Python, FastAPI, React, Docker"
              onChange={handleChange}
            />
          </div>
          <div style={{ marginTop: "12px" }}>
            <TextArea
              label="About you"
              name="summary"
              placeholder="Brief background — what you build, what you're good at."
              onChange={handleChange}
            />
          </div>

          <Divider />

          <div>
            <label style={labelStyle}>Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={{
                ...inputBase,
                cursor: "pointer",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                paddingRight: "36px",
              }}
            >
              <option value="professional">Professional</option>
              <option value="confident">Confident</option>
              <option value="casual">Casual</option>
            </select>
          </div>

          <Divider />

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: loading ? C.subtle : C.text,
              color: loading ? C.muted : "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "-0.01em",
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Working..." : "Generate Cover Letter"}
          </button>

          {steps.length > 0 && (
            <div
              style={{
                marginTop: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "13px",
                    color: C.muted,
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: C.accent,
                      flexShrink: 0,
                    }}
                  />
                  {step}
                </div>
              ))}
              {loading && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "13px",
                    color: C.muted,
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: C.border,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ opacity: 0.5 }}>Processing...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: "16px",
              padding: "14px 16px",
              background: C.errorSoft,
              border: `1px solid ${C.error}33`,
              borderRadius: "8px",
              color: C.error,
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* Job Cards */}
        {jobs.length > 0 && (
          <div style={{ marginTop: "24px" }}>
            <p
              style={{
                margin: "0 0 14px",
                fontSize: "11px",
                fontWeight: "600",
                color: C.muted,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Open Roles at {form.company_name}
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {jobs.map((job, i) => (
                <a
                  key={i}
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: "10px",
                      padding: "16px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = C.borderFocus)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = C.border)
                    }
                  >
                    <div>
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: C.text,
                        }}
                      >
                        {job.title}
                      </p>
                      <p
                        style={{ margin: 0, fontSize: "12px", color: C.muted }}
                      >
                        {job.location}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: C.accent,
                        fontWeight: "500",
                      }}
                    >
                      Apply →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            style={{
              marginTop: "24px",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "12px",
              padding: "28px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <SectionLabel>Cover Letter</SectionLabel>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleCopy}
                  style={{
                    padding: "7px 14px",
                    background: copied ? C.successSoft : "transparent",
                    color: copied ? C.success : C.muted,
                    border: `1px solid ${copied ? C.accent + "44" : C.border}`,
                    borderRadius: "7px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "500",
                    transition: "all 0.15s",
                  }}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
                <button
                  onClick={downloadPdf}
                  style={{
                    padding: "7px 14px",
                    background: "transparent",
                    color: C.muted,
                    border: `1px solid ${C.border}`,
                    borderRadius: "7px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  Export PDF
                </button>
              </div>
            </div>
            <div
              style={{
                whiteSpace: "pre-wrap",
                fontSize: "14px",
                lineHeight: "1.85",
                color: "#444",
              }}
            >
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
