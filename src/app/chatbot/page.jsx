"use client";

import { useSelector } from "react-redux";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import Navigation from "@/components/Navigation";

function ChevronIcon({ up }) {
  return up ? (
    <svg
      className="w-4 h-4 mr-1"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg
      className="w-4 h-4 mr-1"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function ChatbotChartPage() {
  const { isAuth } = useSelector((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (!isAuth) {
      router.replace("/login");
    }
  }, [isAuth, router]);

  if (!isAuth) return null;

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [inputFile, setInputFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatbotData, setChatbotData] = useState(null);
  const [mode, setMode] = useState("org"); // "org" or "department"
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);
  const [deptCollapsed, setDeptCollapsed] = useState({});

  const orgQuestions = [
    {
      from: "bot",
      text: "What is your organization name?",
      inputType: "text",
      name: "organizationName",
      required: true,
    },
    {
      from: "bot",
      text: "What is the CEO's name?",
      inputType: "text",
      name: "ceoName",
      required: true,
    },
    {
      from: "bot",
      text: "What is the CEO's email?",
      inputType: "email",
      name: "ceoEmail",
      required: true,
    },
    {
      from: "bot",
      text: "Please upload the CEO's picture",
      inputType: "file",
      name: "ceoPic",
      required: true,
    },
  ];
  const departmentQuestions = [
    {
      from: "bot",
      text: "What is the department name?",
      inputType: "text",
      name: "departmentName",
      required: true,
    },
    {
      from: "bot",
      text: "What is the HOD's name?",
      inputType: "text",
      name: "hodName",
      required: true,
    },
    {
      from: "bot",
      text: "Please upload the HOD's picture",
      inputType: "file",
      name: "hodPic",
      required: true,
    },
    {
      from: "bot",
      text: "What is the HOD's role?",
      inputType: "text",
      name: "role",
      required: true,
    },
    {
      from: "bot",
      text: "What is the HOD's email?",
      inputType: "email",
      name: "hodEmail",
      required: true,
    },
  ];

  useEffect(() => {
    if (!isAuth) return;
    const fetchData = async () => {
      try {
        const token = Cookies.get("token");
        const { data } = await axios.get("/api/chatbot", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChatbotData(data);
        setDeptCollapsed(
          data.departments
            ? data.departments.reduce(
                (acc, d) => ({ ...acc, [d._id]: false }),
                {}
              )
            : {}
        );
        if (data.organizationName) {
          setMode("department");
          setMessages([
            {
              from: "bot",
              text: "Organization data loaded. You can add departments now.",
            },
          ]);
        } else {
          setMessages([orgQuestions[0]]);
        }
      } catch {
        setMessages([orgQuestions[0]]);
      }
    };
    fetchData();
  }, [isAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const currentQuestion =
      mode === "org"
        ? orgQuestions[currentIndex]
        : departmentQuestions[currentIndex];

    if (currentQuestion.required) {
      if (currentQuestion.inputType === "file" && !inputFile) {
        setError("Please upload a file.");
        setLoading(false);
        return;
      }
      if (currentQuestion.inputType !== "file" && !inputValue.trim()) {
        setError("This field is required.");
        setLoading(false);
        return;
      }
    }
    if (currentQuestion.inputType === "email" && inputValue.trim()) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(inputValue.trim())) {
        setError("Please enter a valid email address.");
        setLoading(false);
        return;
      }
    }

    const newAnswers = { ...answers };
    if (currentQuestion.inputType === "file") {
      newAnswers[currentQuestion.name] = inputFile;
    } else {
      newAnswers[currentQuestion.name] = inputValue.trim();
    }
    setAnswers(newAnswers);

    setMessages((prev) => [
      ...prev,
      {
        from: "user",
        text:
          currentQuestion.inputType === "file"
            ? inputFile
              ? inputFile.name
              : "No file"
            : inputValue,
      },
    ]);

    const isLast =
      mode === "org"
        ? currentIndex === orgQuestions.length - 1
        : currentIndex === departmentQuestions.length - 1;

    if (!isLast) {
      setCurrentIndex(currentIndex + 1);
      setInputValue("");
      setInputFile(null);
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        (mode === "org" ? orgQuestions : departmentQuestions)[currentIndex + 1],
      ]);
      return;
    }

    const formData = new FormData();
    if (mode === "org") {
      formData.append("step", "org");
      orgQuestions.forEach((q) => {
        if (q.inputType === "file") {
          formData.append(q.name, newAnswers[q.name]);
        } else {
          formData.append(q.name, newAnswers[q.name]);
        }
      });
    } else {
      formData.append("step", "department");
      departmentQuestions.forEach((q) => {
        if (q.inputType === "file") {
          formData.append(q.name, newAnswers[q.name]);
        } else {
          formData.append(q.name, newAnswers[q.name]);
        }
      });
    }

    try {
      const token = Cookies.get("token");
      const { data } = await axios.post("/api/chatbot", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (data.message) {
        setMessages((prev) => [...prev, { from: "bot", text: data.message }]);
      }

      if (mode === "org") {
        setMode("department");
        setCurrentIndex(0);
        setAnswers({});
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "Organization created. Now let's add departments.",
          },
          departmentQuestions[0],
        ]);
      } else {
        setCurrentIndex(0);
        setAnswers({});
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "Department added. Add another or refresh to see chart.",
          },
          departmentQuestions[0],
        ]);
      }

      const { data: refreshed } = await axios.get("/api/chatbot", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChatbotData(refreshed);
      setDeptCollapsed(
        refreshed.departments
          ? refreshed.departments.reduce(
              (acc, d) => ({ ...acc, [d._id]: false }),
              {}
            )
          : {}
      );

      setInputValue("");
      setInputFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: err.response?.data?.message || err.message || "Error occurred",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const orgBoxWidth = 340;
  const deptBoxWidth = 340;
  const deptBoxGap = 32;
  const departments = chatbotData?.departments || [];
  const totalDeptWidth =
    departments.length * deptBoxWidth + (departments.length - 1) * deptBoxGap;
  const svgWidth = Math.max(orgBoxWidth, totalDeptWidth);

  const renderMessages = () => {
    return messages.map((msg, idx) => (
      <div
        key={idx}
        className={`mb-2 max-w-xs p-2 rounded ${
          msg.from === "bot"
            ? "bg-gray-200 self-start"
            : "bg-blue-500 text-white self-end"
        }`}
      >
        {msg.text}
      </div>
    ));
  };

  const currentQuestion =
    mode === "org"
      ? orgQuestions[currentIndex]
      : departmentQuestions[currentIndex];

  return (
    <div className="flex min-h-screen bg-white flex-col">
      <Navigation />
      <div className="flex flex-1">
        <div className="flex-1 p-8 overflow-auto border-r border-gray-300">
          <h1 className="text-2xl font-bold mb-4">Organization Chart</h1>
        {!chatbotData ? (
          <p>
            No organization data yet. Please create organization via chatbot.
          </p>
        ) : (
          <div className="flex flex-col items-center w-full">
            <div
              className="relative mx-auto bg-white rounded-xl shadow border border-gray-200 px-7 py-6 flex flex-col items-center"
              style={{ minWidth: orgBoxWidth, maxWidth: orgBoxWidth }}
            >
              <div className="flex items-center w-full mb-2">
                <div className="flex-shrink-0 mr-4">
                  {chatbotData.ceoPic ? (
                    <img
                      src={chatbotData.ceoPic}
                      alt={`${chatbotData.ceoName} Picture`}
                      className="w-12 h-12 rounded-full object-cover border border-gray-300"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm">
                      <span>No Image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold">{chatbotData.ceoName}</div>
                  <div className="text-base text-gray-900 font-medium">CEO</div>
                  <div className="text-sm text-gray-400">Executive</div>
                  <div className="text-sm text-gray-700">
                    {chatbotData.ceoEmail}
                  </div>
                </div>
              </div>
              <div className="flex w-full justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => !c)}
                  className="flex items-center border border-gray-300 px-2 py-1 rounded text-sm"
                >
                  <ChevronIcon up={!collapsed} />
                  {collapsed ? "Expand" : "Collapse"}
                </button>
              </div>
            </div>

            {!collapsed && departments.length > 0 && (
              <svg
                width={svgWidth}
                height="54"
                className="block mx-auto"
                style={{ marginTop: 0, marginBottom: -12 }}
              >
                <line
                  x1={svgWidth / 2}
                  y1={0}
                  x2={svgWidth / 2}
                  y2={24}
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <line
                  x1={svgWidth / 2 - totalDeptWidth / 2 + deptBoxWidth / 2}
                  y1={24}
                  x2={svgWidth / 2 + totalDeptWidth / 2 - deptBoxWidth / 2}
                  y2={24}
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                {departments.map((_, idx) => {
                  const x =
                    svgWidth / 2 -
                    totalDeptWidth / 2 +
                    deptBoxWidth / 2 +
                    idx * (deptBoxWidth + deptBoxGap);
                  return (
                    <line
                      key={idx}
                      x1={x}
                      y1={24}
                      x2={x}
                      y2={54}
                      stroke="#e5e7eb"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>
            )}

            {!collapsed && departments.length > 0 && (
              <div
                className="flex flex-row justify-center items-start gap-8 mt-0"
                style={{ minWidth: svgWidth }}
              >
                {departments.map((department) => (
                  <div
                    key={department._id}
                    className="relative bg-white rounded-xl shadow border border-gray-200 px-7 py-6 flex flex-col items-center"
                    style={{ minWidth: deptBoxWidth, maxWidth: deptBoxWidth }}
                  >
                    <div className="flex items-center w-full mb-2">
                      <div className="flex-shrink-0 mr-4">
                        {department.hodPic ? (
                          <img
                            src={department.hodPic}
                            alt={`${department.hodName} Picture`}
                            className="w-12 h-12 rounded-full object-cover border border-gray-300"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm">
                            <span>No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-bold">
                          {department.hodName}
                        </div>
                        <div className="text-base text-gray-900 font-medium">
                          {department.role}
                        </div>
                        <div className="text-sm text-gray-400">
                          {department.departmentName}
                        </div>
                        <div className="text-sm text-gray-700">
                          {department.hodEmail}
                        </div>
                      </div>
                    </div>
                    <div className="flex w-full justify-between mt-4">
                      <button
                        type="button"
                        onClick={() =>
                          setDeptCollapsed((prev) => ({
                            ...prev,
                            [department._id]: !prev[department._id],
                          }))
                        }
                        className="flex items-center border border-gray-300 px-2 py-1 rounded text-sm"
                      >
                        <ChevronIcon up={!deptCollapsed[department._id]} />
                        {deptCollapsed[department._id] ? "Expand" : "Collapse"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-96 border-l border-gray-300 flex flex-col p-4">
        <h2 className="text-xl font-bold mb-4">Chatbot</h2>
        <div className="flex-1 flex flex-col space-y-2 overflow-y-auto mb-4 max-h-[80vh]">
          {renderMessages()}
        </div>
        {currentQuestion && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            {(currentQuestion.inputType === "text" ||
              currentQuestion.inputType === "email") && (
              <input
                ref={inputRef}
                type={currentQuestion.inputType}
                name={currentQuestion.name}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentQuestion.text}
                required={currentQuestion.required}
                className="border border-gray-400 rounded px-3 py-2"
                disabled={loading}
                autoFocus
              />
            )}
            {currentQuestion.inputType === "file" && (
              <input
                ref={inputRef}
                type="file"
                name={currentQuestion.name}
                onChange={(e) =>
                  setInputFile(e.target.files ? e.target.files[0] : null)
                }
                accept="image/*"
                disabled={loading}
                required={currentQuestion.required}
              />
            )}
            {error && <div className="text-red-600">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? "Saving..." : "Submit"}
            </button>
          </form>
        )}
      </div>
      </div>
    </div>
  );
}
